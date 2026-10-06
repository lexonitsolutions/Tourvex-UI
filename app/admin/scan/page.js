"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAdminApi } from "../_lib/adminApi";
import { formatDay, paxText } from "../_ops/Ops";
import { Button, Card, PageHeader, RequirePermission, TextField } from "../_kit";

const HISTORY_KEY = "adm-scan-history";

function subscribeOnline(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}
const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

/** Verdicts from POST /admin/vouchers/validate (and refusals from /redeem) mapped to the big result screen. */
const VERDICTS = {
  valid: { tone: "ok", title: "Valid" },
  already_redeemed: { tone: "bad", title: "Already used" },
  void: { tone: "bad", title: "Void" },
  too_early: { tone: "warn", title: "Not valid yet" },
  expired: { tone: "bad", title: "Expired" },
  booking_inactive: { tone: "bad", title: "Booking not active" },
};
const REFUSAL_CODES = { ALREADY_REDEEMED: "already_redeemed", VOUCHER_VOID: "void", TOO_EARLY: "too_early", VOUCHER_EXPIRED: "expired", BOOKING_INACTIVE: "booking_inactive" };

function readHistory() {
  try {
    return JSON.parse(window.sessionStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeHistory(list) {
  try {
    window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: the history just lives in memory */
  }
}

export default function ScanPage() {
  return (
    <RequirePermission permission="vouchers.validate">
      <Scanner />
    </RequirePermission>
  );
}

function Scanner() {
  const api = useAdminApi();
  const online = useOnline();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const busyRef = useRef(false);
  const [camera, setCamera] = useState("off"); // off | starting | on | denied | unsupported
  const [result, setResult] = useState(null); // { verdict, tone, title, booking, voucher, message, redeemed }
  const [manual, setManual] = useState("");
  const [working, setWorking] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // sessionStorage only exists in the browser; loaded after mount so server and client markup match.
    setHistory(readHistory()); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const remember = useCallback((entry) => {
    setHistory((prev) => {
      const next = [{ ...entry, at: Date.now() }, ...prev].slice(0, 30);
      writeHistory(next);
      return next;
    });
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const check = useCallback(
    async (raw) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setWorking(true);
      stopCamera();
      setCamera("off");
      try {
        if (!navigator.onLine) throw Object.assign(new Error("You are offline. Reconnect to check this ticket."), { offline: true });
        const res = await api.post("/admin/vouchers/validate", { code: raw });
        const verdict = VERDICTS[res.verdict] || VERDICTS.booking_inactive;
        setResult({ ...verdict, verdict: res.verdict, booking: res.booking, voucher: res.voucher });
        remember({ code: res.voucher.displayCode, tone: verdict.tone, label: verdict.title, title: res.booking?.activityTitle || "" });
      } catch (error) {
        const known = error.status === 404 || error.status === 400;
        setResult({
          tone: error.offline || !known ? "warn" : "bad",
          title: error.offline ? "Offline" : known ? "Unknown ticket" : "Could not check",
          message: error.offline ? error.message : known ? "No ticket matches this code. Check the code or ask the guest for their voucher." : error.message,
        });
        remember({ code: String(raw).slice(-16), tone: known ? "bad" : "warn", label: error.offline ? "Offline" : known ? "Unknown ticket" : "Error", title: "" });
      } finally {
        busyRef.current = false;
        setWorking(false);
      }
    },
    [api, remember, stopCamera]
  );

  async function redeem() {
    if (!result?.voucher || busyRef.current) return;
    busyRef.current = true;
    setWorking(true);
    try {
      if (!navigator.onLine) throw Object.assign(new Error("You are offline. Reconnect to redeem this ticket."), { offline: true });
      await api.post(`/admin/vouchers/${result.voucher.id}/redeem`);
      setResult({ ...result, tone: "ok", title: "Redeemed", redeemed: true });
      remember({ code: result.voucher.displayCode, tone: "ok", label: "Redeemed", title: result.booking?.activityTitle || "" });
    } catch (error) {
      const verdict = VERDICTS[REFUSAL_CODES[error.code]];
      setResult(verdict
        ? { ...result, ...verdict, verdict: REFUSAL_CODES[error.code], message: error.message, voucher: { ...result.voucher } }
        : { ...result, tone: "warn", title: error.offline ? "Offline" : "Could not redeem", message: error.message, verdict: "valid" });
      if (verdict) remember({ code: result.voucher.displayCode, tone: verdict.tone, label: verdict.title, title: result.booking?.activityTitle || "" });
    } finally {
      busyRef.current = false;
      setWorking(false);
    }
  }

  async function startCamera() {
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera("unsupported");
      return;
    }
    setCamera("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setCamera("on");
      // The <video> mounts when camera === "on"; attach in the next frame.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (error) {
      setCamera(error?.name === "NotAllowedError" ? "denied" : "unsupported");
    }
  }

  // Decode loop: the native BarcodeDetector when the browser has it, otherwise jsQR on a downscaled canvas.
  useEffect(() => {
    if (camera !== "on") return undefined;
    let stopped = false;
    let timer = null;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    let detector = null;
    let jsQR = null;

    async function prepare() {
      if (typeof window.BarcodeDetector === "function") {
        try {
          detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          return;
        } catch {
          detector = null;
        }
      }
      jsQR = (await import("jsqr")).default;
    }

    async function tick() {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && !busyRef.current) {
        try {
          let value = null;
          if (detector) {
            const found = await detector.detect(video);
            value = found[0]?.rawValue || null;
          } else if (jsQR) {
            const scale = Math.min(1, 640 / video.videoWidth);
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const image = context.getImageData(0, 0, canvas.width, canvas.height);
            value = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" })?.data || null;
          }
          if (value && !stopped) {
            check(value);
            return;
          }
        } catch {
          /* a frame that cannot be read is skipped */
        }
      }
      timer = setTimeout(tick, 140);
    }

    prepare().then(() => {
      if (!stopped) tick();
    });
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [camera, check]);

  function next() {
    setResult(null);
    setManual("");
    startCamera();
  }

  return (
    <>
      <PageHeader title="Scan tickets" description="Point the camera at a guest's QR code, or type the code printed under it. Valid tickets show the group size and the activity; redeem once the guests are checked in." />
      <div className="adm-scan">
        {!online ? <div className="adm-scan__offline" role="alert">You are offline. Scanning needs a connection so a ticket can never be used twice; reconnect and try again.</div> : null}

        {result ? (
          <div className={`adm-scan__result is-${result.tone}`} role="status" aria-live="assertive">
            <div className="adm-scan__verdict">{result.title}</div>
            {result.booking && result.verdict !== "void" ? (
              <>
                <div className="adm-scan__pax">{result.booking.travellers}<small>{result.booking.travellers === 1 ? "traveller" : "travellers"}</small></div>
                <div className="adm-scan__activity">{result.booking.activityTitle}</div>
                <div className="adm-scan__meta">{paxText(result.booking.adults, result.booking.children)}{result.booking.optionName ? ` · ${result.booking.optionName}` : ""}</div>
                <div className="adm-scan__meta">{formatDay(result.booking.serviceDay)}{result.booking.startTime ? ` at ${result.booking.startTime}` : ""}{result.booking.leadTraveller ? ` · ${result.booking.leadTraveller}` : ""}</div>
                {result.booking.pickup ? <div className="adm-scan__meta">Pick-up: {result.booking.pickup}</div> : null}
              </>
            ) : null}
            {result.verdict === "already_redeemed" && result.voucher?.redeemedAt ? <div className="adm-scan__meta">Redeemed {new Date(result.voucher.redeemedAt).toLocaleString("en-GB", { timeZone: "Asia/Dubai" })}{result.voucher.redeemedByName ? ` by ${result.voucher.redeemedByName}` : ""}</div> : null}
            {result.verdict === "void" && result.voucher?.voidReason ? <div className="adm-scan__meta">{result.voucher.voidReason}</div> : null}
            {result.verdict === "too_early" || result.verdict === "expired" ? <div className="adm-scan__meta">This ticket is only valid on {formatDay(result.booking?.serviceDay)}.</div> : null}
            {result.message && !result.booking ? <div className="adm-scan__meta">{result.message}</div> : null}
            {result.message && result.booking && result.verdict === "valid" ? <div className="adm-scan__meta">{result.message}</div> : null}
            {result.verdict === "valid" && !result.redeemed ? <Button size="md" onClick={redeem} loading={working} icon="check">Redeem ticket</Button> : null}
            <Button variant="ghost" onClick={next} disabled={working}>Scan next ticket</Button>
          </div>
        ) : (
          <div className="adm-scan__view">
            {camera === "on" ? (
              <>
                <video ref={videoRef} className="adm-scan__video" playsInline muted aria-label="Camera preview" />
                <div className="adm-scan__frame" aria-hidden="true" />
                <div className="adm-scan__hint">{working ? "Checking..." : "Hold the QR code inside the frame"}</div>
              </>
            ) : (
              <div className="adm-scan__idle">
                <div>
                  <p style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>
                    {camera === "starting" ? "Starting camera..." : camera === "denied" ? "Camera permission was denied" : camera === "unsupported" ? "No camera available" : "Camera is off"}
                  </p>
                  <p>
                    {camera === "denied" ? "Allow camera access for this site in your browser settings, then try again." : camera === "unsupported" ? "This browser cannot open a camera here (it needs HTTPS). Type the code below instead." : "Start the camera to scan a guest's ticket."}
                  </p>
                </div>
                {camera !== "starting" ? <Button variant="primary" icon="scan" onClick={startCamera} disabled={!online}>Start camera</Button> : null}
              </div>
            )}
          </div>
        )}

        {!result ? (
          <form className="adm-scan__manual" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) check(manual.trim()); }}>
            <TextField label="Or type the code" value={manual} onChange={setManual} placeholder="ABCD-EFGH-2345-6723" autoComplete="off" autoCapitalize="characters" spellCheck={false} />
            <Button type="submit" variant="primary" loading={working} disabled={!manual.trim() || !online} style={{ alignSelf: "flex-end" }}>Check</Button>
          </form>
        ) : null}

        <Card title="Scan history" actions={history.length ? <Button size="sm" variant="ghost" onClick={() => { setHistory([]); writeHistory([]); }}>Clear</Button> : null}>
          {history.length ? (
            <ul className="adm-scan__hist">
              {history.map((h, i) => (
                <li key={`${h.at}-${i}`}>
                  <i className={`is-${h.tone}`} aria-hidden="true" />
                  <span><b>{h.label}</b>{h.title ? ` · ${h.title}` : ""}<small className="adm-ops-sub">{h.code}</small></span>
                  <time dateTime={new Date(h.at).toISOString()}>{new Date(h.at).toLocaleTimeString("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</time>
                </li>
              ))}
            </ul>
          ) : <p className="adm-muted">Nothing scanned in this session yet. History stays in this browser tab only and holds no guest names.</p>}
        </Card>
      </div>
    </>
  );
}
