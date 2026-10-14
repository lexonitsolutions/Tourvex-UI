"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FALLBACK_IMG, IconChevron, IconX, showFallback } from "./ActivityParts";

/** Native <dialog>: focus trap, Escape and top-layer stacking come from the browser. */
function Lightbox({ images, index, onIndex, onClose, title }) {
  const ref = useRef(null);
  const open = index != null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onIndex]);

  const img = open ? images[index] : null;
  return (
    <dialog ref={ref} className="act-lightbox" aria-label={`${title} photos`} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      {img && (
        <figure>
          <img src={img.url} alt={img.alt || ""} onError={showFallback} />
          <figcaption>{img.alt ? `${img.alt} · ` : ""}{index + 1} / {images.length}</figcaption>
        </figure>
      )}
      <button type="button" className="act-lb-btn act-lb-close" aria-label="Close photos" onClick={onClose}><IconX /></button>
      {images.length > 1 && (
        <>
          <button type="button" className="act-lb-btn act-lb-prev" aria-label="Previous photo" onClick={() => onIndex((index - 1 + images.length) % images.length)}><IconChevron dir="left" /></button>
          <button type="button" className="act-lb-btn act-lb-next" aria-label="Next photo" onClick={() => onIndex((index + 1) % images.length)}><IconChevron /></button>
        </>
      )}
    </dialog>
  );
}

/** One large photo plus up to four smaller ones; "See more" opens every photo in a lightbox. */
export default function ActivityGallery({ images, title, video }) {
  const [index, setIndex] = useState(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  const close = useCallback(() => setIndex(null), []);
  const list = images.length ? images : [{ url: FALLBACK_IMG, alt: title }];
  const extras = list.slice(1);

  const playVideo = useCallback(() => {
    const player = videoRef.current;
    if (!player) return;
    player.muted = true;
    player.play().then(() => setVideoPlaying(true)).catch(() => setVideoPlaying(false));
  }, []);
  const stopVideo = useCallback(() => {
    videoRef.current?.pause();
    setVideoPlaying(false);
  }, []);

  useEffect(() => () => videoRef.current?.pause(), [video?.url]);

  if (video?.url) {
    return (
      <div className="act-gallery-stack">
        <div className={`act-gallery act-gallery-video has-1${videoPlaying ? " is-playing" : ""}`} role="button" tabIndex={0} aria-label={`${videoPlaying ? "Pause" : "Play"} ${title} preview video`} aria-pressed={videoPlaying} onPointerEnter={playVideo} onPointerLeave={stopVideo} onFocus={playVideo} onBlur={stopVideo} onClick={() => (videoPlaying ? stopVideo() : playVideo())} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); videoPlaying ? stopVideo() : playVideo(); } }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className="act-hero-video" src={video.url} muted loop playsInline preload="metadata" aria-label={`${title} video`} onEnded={() => setVideoPlaying(false)} onError={() => setVideoPlaying(false)} />
          <img className="act-video-cover" src={list[0]?.url} alt={list[0]?.alt || title} />
        </div>
        {extras.length > 0 && <ThumbnailRail images={extras} offset={1} total={list.length} onOpen={setIndex} />}
        <Lightbox images={list} index={index} onIndex={setIndex} onClose={close} title={title} />
      </div>
    );
  }

  return (
    <div className="act-gallery-stack">
      <div className="act-gallery has-1">
        <button type="button" className="act-shot is-main" aria-label={`Open main photo of ${title}`} onClick={() => setIndex(0)}>
          <img src={list[0].url} alt="" width="1100" height="620" loading="eager" decoding="async" onError={showFallback} />
        </button>
        {list.length > 1 && <button type="button" className="act-seemore" onClick={() => setIndex(0)}>See all {list.length} photos</button>}
      </div>
      {extras.length > 0 && <ThumbnailRail images={extras} offset={1} total={list.length} onOpen={setIndex} />}
      <Lightbox images={list} index={index} onIndex={setIndex} onClose={close} title={title} />
    </div>
  );
}

function ThumbnailRail({ images, offset, total, onOpen }) {
  return <div className="act-extra-gallery" aria-label="More package photos">{images.map((img, index) => <button key={`${img.url}-${index}`} type="button" onClick={() => onOpen(index + offset)} aria-label={`Open photo ${index + offset + 1} of ${total}`}><img src={img.url} alt={img.alt || ""} loading="lazy" decoding="async" onError={showFallback} /></button>)}</div>;
}
