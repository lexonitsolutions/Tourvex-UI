"use client";

import { memo, useEffect, useRef, useState } from "react";

/*
 * WavingFlag — Canvas-based realistic cloth waving animation.
 *
 * KEY FIX: The off-screen source canvas is padded vertically by the maximum
 * possible wave amplitude on both top AND bottom. The flag image is stretched
 * to fill this taller buffer. Each animated slice reads from `pad + dy` in the
 * buffer and writes to y=0 on the visible canvas — so the read position is
 * always inside real image pixels, never outside, eliminating the transparent
 * gaps that let the white background bleed through.
 */

/* ── tunables ─────────────────────────────────────────────────────────── */
const SLICE_W = 2;     // px per column-slice (lower = smoother)
const AMP_MAX = 14;    // max vertical displacement at free end (px at 160w base)
const FREQ1   = 0.018; // primary wave spatial frequency (rad/px)
const FREQ2   = 0.011; // secondary wave spatial frequency
const SPEED1  = 1.8;   // primary wave speed (rad/s)
const SPEED2  = 2.7;   // secondary wave speed
const DRIFT_F = 0.31;  // gust drift frequency (rad/s)
const DRIFT_A = 0.28;  // gust amplitude modulator
/* ──────────────────────────────────────────────────────────────────────── */

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const WavingFlag = memo(function WavingFlag({ src, alt = "", width = 160, height = 120 }) {
  const canvasRef = useRef(null);
  const startRef  = useRef(null);
  const offRef    = useRef(null); // { canvas, pad }
  const [ready, setReady] = useState(false);
  const reduced = prefersReducedMotion();

  /* ── Load image → build padded off-screen buffer ──────────────────── */
  useEffect(() => {
    if (reduced || !src) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      const ampScale = width / 160;
      // Extra rows needed top + bottom to absorb the worst-case dy
      const pad = Math.ceil(AMP_MAX * ampScale * (1 + DRIFT_A) * 1.6);

      const off = document.createElement("canvas");
      off.width  = width;
      off.height = height + pad * 2; // taller buffer

      // Stretch the image across the full padded height.
      // Wave shifts read from [pad + dy … pad + dy + height], which always
      // lands inside [0 … off.height], so no transparent rows ever appear.
      off.getContext("2d").drawImage(img, 0, 0, width, off.height);

      offRef.current = { canvas: off, pad };
      setReady(true);
    };

    img.onerror = () => setReady(false);
  }, [src, reduced, width, height]);

  /* ── Animation loop ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!ready || reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const ampScale = width / 160;
    let animId;

    function draw(ts) {
      if (!startRef.current) startRef.current = ts;
      const t = (ts - startRef.current) / 1000; // seconds elapsed

      // Gust: slow amplitude modulator for natural wind variation
      const gust = 1 + DRIFT_A * Math.sin(t * DRIFT_F * 2 * Math.PI);

      ctx.clearRect(0, 0, width, height);

      const { canvas: srcCanvas, pad } = offRef.current;
      const cols = Math.ceil(width / SLICE_W);

      // ── Wave pass ────────────────────────────────────────────────────
      for (let col = 0; col < cols; col++) {
        const x  = col * SLICE_W;
        const p  = x / width;                         // 0 at pole, 1 at free end
        const amp = AMP_MAX * ampScale * p * p * p * gust; // cubic: pole barely moves

        // Two overlapping sinusoids break up mechanical regularity
        const dy = amp       * Math.sin(x * FREQ1 - t * SPEED1)
                 + amp * 0.4 * Math.sin(x * FREQ2 - t * SPEED2 + 0.9);

        // Source y = pad + dy → always inside the padded buffer, never negative/OOB
        ctx.drawImage(
          srcCanvas,
          x, pad + dy, SLICE_W, height, // source slice in padded buffer
          x, 0,        SLICE_W, height, // destination on visible canvas
        );
      }

      // ── Cloth shading pass (slope → highlight / shadow) ──────────────
      const cols2 = Math.ceil(width / (SLICE_W * 4));
      for (let col = 0; col < cols2; col++) {
        const x    = col * SLICE_W * 4;
        const p    = x / width;
        const amp  = AMP_MAX * ampScale * p * p * p * gust;
        const slope = Math.cos(x * FREQ1 - t * SPEED1) * FREQ1 * amp;
        const light = Math.max(0,  slope) * 0.18;
        const dark  = Math.max(0, -slope) * 0.22;

        if (light > 0.005) {
          ctx.fillStyle = `rgba(255,255,255,${light.toFixed(3)})`;
          ctx.fillRect(x, 0, SLICE_W * 4, height);
        }
        if (dark > 0.005) {
          ctx.fillStyle = `rgba(0,0,0,${dark.toFixed(3)})`;
          ctx.fillRect(x, 0, SLICE_W * 4, height);
        }
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [ready, reduced, width, height]);

  /* ── Render ────────────────────────────────────────────────────────── */
  if (reduced || !src) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        decoding="async"
        style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return (
    <>
      {/* Static fallback while the off-screen canvas is being built */}
      {!ready && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          decoding="async"
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        aria-hidden="true"
        style={{
          display: ready ? "block" : "none",
          width: "100%",
          height: "100%",
        }}
      />
    </>
  );
});

export default WavingFlag;
