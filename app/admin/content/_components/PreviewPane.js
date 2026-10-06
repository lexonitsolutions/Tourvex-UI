"use client";

import { memo, useEffect, useRef, useState } from "react";
import { ExternalLink, Monitor, PanelRightClose, RefreshCw, Smartphone } from "lucide-react";
import { ErrorState, Skeleton, cx } from "../../_kit";
import { useCmsApi } from "../../_lib/cms";
import { isAbortError } from "../../_lib/adminApi";

const WIDTHS = { desktop: 1280, mobile: 390 };

/**
 * Live preview: an iframe of the public site with a signed preview token (POST /admin/content/:key/preview-token).
 * The site renders the saved DRAFT, so `refreshKey` is bumped after every successful save. The frame is rendered at a real
 * device width and scaled down to the pane, so the preview matches what visitors get.
 */
function PreviewPane({ docKey, refreshKey, onClose }) {
  const cms = useCmsApi();
  const [device, setDevice] = useState("desktop");
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, url: "", error: null });
  const [box, setBox] = useState({ w: 0, h: 0 });
  const stage = useRef(null);
  const key = `${docKey}|${refreshKey}|${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    cms
      .previewToken(docKey, { signal: controller.signal })
      .then((res) => setResult({ key, url: res?.url || "", error: res?.url ? null : new Error("The API did not return a preview URL.") }))
      .catch((error) => {
        if (!isAbortError(error)) setResult({ key, url: "", error });
      });
    return () => controller.abort();
    // key encodes docKey + refreshKey + attempt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cms, key]);

  useEffect(() => {
    const el = stage.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const settled = result.key === key;
  const width = WIDTHS[device];
  const scale = box.w ? Math.min(1, box.w / width) : 1;
  const frameH = box.h && scale ? box.h / scale : 800;

  return (
    <section className="adm-cms-preview" aria-label="Live preview">
      <header className="adm-cms-preview__bar">
        <div className="adm-cms-seg" role="group" aria-label="Preview width">
          <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")} title="Desktop width"><Monitor size={15} /> Desktop</button>
          <button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")} title="Mobile width"><Smartphone size={15} /> Mobile</button>
        </div>
        <div className="adm-cms-preview__tools">
          <button type="button" className="adm-cms-mini" onClick={() => setAttempt((n) => n + 1)} aria-label="Refresh preview" title="Refresh preview"><RefreshCw size={15} /></button>
          {settled && result.url ? (
            <a className="adm-cms-mini" href={result.url} target="_blank" rel="noopener noreferrer" aria-label="Open preview in a new tab" title="Open in new tab"><ExternalLink size={15} /></a>
          ) : (
            <span className="adm-cms-mini is-disabled" aria-hidden="true"><ExternalLink size={15} /></span>
          )}
          {onClose ? <button type="button" className="adm-cms-mini" onClick={onClose} aria-label="Hide preview" title="Hide preview"><PanelRightClose size={16} /></button> : null}
        </div>
      </header>
      <p className="adm-cms-preview__note">Shows the saved draft. Save your changes to update it.</p>
      <div ref={stage} className={cx("adm-cms-preview__stage", device === "mobile" && "is-mobile")}>
        {!settled ? (
          <div className="adm-cms-preview__loading" aria-busy="true"><Skeleton height="100%" /></div>
        ) : result.error ? (
          <ErrorState title="Preview is not available" description={result.error.message} onRetry={() => setAttempt((n) => n + 1)} />
        ) : (
          <div className="adm-cms-preview__device" style={{ width: width * scale, height: box.h || undefined }}>
            <iframe
              key={result.url}
              title={`Preview of ${docKey} (${device})`}
              src={result.url}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              style={{ width, height: frameH, transform: `scale(${scale})` }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(PreviewPane);
