"use client";

import { memo, useId, useRef, useState, useEffect } from "react";
import { Film, Play, Trash2, UploadCloud, Video, VideoOff } from "lucide-react";
import { Button, ErrorState, Field, Modal, Pagination, SearchInput, Skeleton, TabPanel, Tabs, cx, useToast } from "../../_kit";
import { Input } from "../../_ui/components/input";
import { Progress } from "../../_ui/components/progress";
import { checkVideoUpload, formatBytes, listOf, resolveMediaUrl, useCmsApi } from "../../_lib/cms";
import { isAbortError } from "../../_lib/adminApi";
import { useFormContext } from "./formContext";
import { CONTROL } from "./parts";

const LIMIT = 24;
const TABS = [
  { id: "upload", label: "Upload video" },
  { id: "url", label: "By URL" },
  { id: "library", label: "Media library" },
];

function VideoThumb({ url, className = "" }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
    setIsPlaying(false);
  }, [url]);

  if (!url || loadError) {
    return (
      <div className={cx("adm-cms-image__frame is-empty", className)} style={{ width: 144, aspectRatio: "4/5" }}>
        <span>
          <Film size={22} strokeWidth={1.5} />
          {loadError ? "Cannot load video" : "No video"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cx("adm-cms-image__frame", className)}
      style={{ width: 144, aspectRatio: "4/5", cursor: "pointer" }}
      title="Hover to preview playback"
      onMouseEnter={() => {
        videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
      }}
      onMouseLeave={() => {
        videoRef.current?.pause();
        setIsPlaying(false);
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={resolveMediaUrl(url)}
        playsInline
        muted
        loop
        preload="metadata"
        onError={() => setLoadError(true)}
      />
      {!isPlaying ? (
        <span className="adm-cms-video-badge" aria-hidden="true">
          <Play size={10} fill="currentColor" /> Hover to preview
        </span>
      ) : null}
    </div>
  );
}

function VideoLibrary({ picked, onPick }) {
  const cms = useCmsApi();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const key = `${q}|${page}|${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    cms
      .mediaList({ q: q || undefined, page, limit: LIMIT }, { signal: controller.signal })
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (!isAbortError(error)) setResult({ key, data: null, error });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cms, key]);

  const settled = result.key === key;
  const rawItems = settled && result.data ? listOf(result.data) : [];
  // Filter for video files or files with video extensions/contentTypes
  const items = rawItems.filter((m) => {
    const ct = String(m.contentType || "");
    const fn = String(m.filename || "").toLowerCase();
    return ct.startsWith("video/") || /\.(mp4|webm|mov|ogg)$/.test(fn);
  });
  const pagination = settled ? result.data?.pagination : null;

  return (
    <div className="adm-cms-lib">
      <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by file name" label="Search media library" />
      {!settled ? (
        <div className="adm-cms-lib__grid" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} height={120} className="tw:rounded-xl" />)}
        </div>
      ) : result.error ? (
        <ErrorState title="Could not load media library" description={result.error.message} onRetry={() => setAttempt((n) => n + 1)} />
      ) : !items.length ? (
        <div className="adm-empty">
          <p className="adm-empty__title">{q ? "No videos match your search" : "No videos uploaded yet"}</p>
          <p className="adm-empty__desc">Use the Upload video tab to upload an MP4 or WebM clip.</p>
        </div>
      ) : (
        <ul className="adm-cms-lib__grid" aria-label="Video library">
          {items.map((m) => {
            const on = picked?.url === m.url;
            return (
              <li key={m.id || m.url}>
                <button type="button" className={cx("adm-cms-tile", on && "is-selected")} aria-pressed={on} onClick={() => onPick(m)}>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video src={resolveMediaUrl(m.url)} preload="metadata" muted playsInline />
                  <span className="adm-cms-tile__meta">
                    <b>{m.filename || "video"}</b>
                    <small>{m.size ? formatBytes(m.size) : "Video clip"}</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {pagination && pagination.pages > 1 ? <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={pagination.limit || LIMIT} onPage={setPage} /> : null}
    </div>
  );
}

function VideoUploader({ onUploaded, picked }) {
  const cms = useCmsApi();
  const toast = useToast();
  const [state, setState] = useState({ status: "idle", progress: 0, error: "", name: "" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    const problem = checkVideoUpload(file);
    if (problem) {
      setState({ status: "error", progress: 0, error: problem, name: file.name });
      toast.error(problem);
      return;
    }
    setState({ status: "uploading", progress: 0, error: "", name: file.name });
    try {
      const saved = await cms.uploadVideo(file, {
        onProgress: (p) => setState((s) => ({ ...s, progress: Math.round(p * 100) })),
      });
      setState({ status: "done", progress: 100, error: "", name: file.name });
      toast.success(`Uploaded ${file.name}`);
      onUploaded(saved);
    } catch (e) {
      const msg = e.message || "Video upload failed";
      setState({ status: "error", progress: 0, error: msg, name: file.name });
      toast.error(msg);
    }
  }

  return (
    <div className="adm-cms-upload">
      <div
        className={cx("adm-cms-drop", dragging && "is-dragging", state.status === "uploading" && "is-busy")}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        <UploadCloud size={36} className="adm-cms-drop__icon" />
        <p className="adm-cms-drop__title">Drag and drop a video clip here, or browse</p>
        <p className="adm-cms-drop__sub">MP4, WebM, MOV or OGG · Up to 50 MB · 1:1, 4:5 or 16:9 ratio recommended</p>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/ogg"
          className="tw:sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            handleFile(f);
          }}
        />
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={state.status === "uploading"}>
          Browse video file
        </Button>
      </div>

      {state.status === "uploading" ? (
        <div className="adm-cms-upload__prog">
          <p>Uploading {state.name}… {state.progress}%</p>
          <Progress value={state.progress} />
        </div>
      ) : null}

      {state.error ? <p className="adm-field__error" role="alert">{state.error}</p> : null}
      {picked?.url ? <p className="adm-field__hint">Current video: <code>{picked.url}</code></p> : null}
    </div>
  );
}

function VideoByUrl({ currentUrl, onPick }) {
  const [draft, setDraft] = useState(currentUrl || "");
  const [tested, setTested] = useState(Boolean(currentUrl));

  return (
    <div className="adm-cms-byurl">
      <Field label="Video URL" hint="A site-relative path (e.g. /videos/desert-dunes.mp4) or an https:// link.">
        {(a11y) => (
          <Input
            className={CONTROL}
            type="text"
            value={draft}
            placeholder="/videos/experience-clip.mp4 or https://..."
            onChange={(e) => {
              setDraft(e.target.value.trim());
              setTested(false);
            }}
            {...a11y}
          />
        )}
      </Field>

      {draft ? (
        <div className="adm-cms-video-url-preview">
          <p className="adm-field__hint">Live preview:</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={resolveMediaUrl(draft)}
            controls
            playsInline
            muted
            className="adm-cms-video-frame"
            onLoadedData={() => setTested(true)}
            onError={() => setTested(false)}
          />
        </div>
      ) : null}

      <div className="tw:flex tw:justify-end tw:gap-2 tw:pt-3">
        <Button size="sm" disabled={!draft.trim()} onClick={() => onPick({ url: draft.trim() })}>
          Use this video
        </Button>
      </div>
    </div>
  );
}

export function VideoModal({ current, onClose, onPick }) {
  const [tab, setTab] = useState("upload");

  return (
    <Modal title="Choose video clip" description="Short clip shown when hovering on the card." open onClose={onClose} size="lg">
      <Tabs tabs={TABS} active={tab} onChange={setTab} className="tw:mb-4" />
      <TabPanel id="upload" active={tab}>
        <VideoUploader
          picked={current}
          onUploaded={(media) => {
            onPick(media);
            onClose();
          }}
        />
      </TabPanel>
      <TabPanel id="url" active={tab}>
        <VideoByUrl
          currentUrl={current?.url}
          onPick={(media) => {
            onPick(media);
            onClose();
          }}
        />
      </TabPanel>
      <TabPanel id="library" active={tab}>
        <VideoLibrary
          picked={current}
          onPick={(media) => {
            onPick(media);
            onClose();
          }}
        />
      </TabPanel>
    </Modal>
  );
}

/**
 * Video field control: renders a video thumbnail preview, actions to replace/remove,
 * and launches the VideoModal to upload or choose a video clip.
 */
function VideoPickerField({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const [open, setOpen] = useState(false);
  const id = useId();

  const url = typeof value === "string" ? value : value?.url || "";
  const err = errors[`${path}.url`] || errors[path];

  return (
    <fieldset className="adm-cms-image" aria-labelledby={`${id}-l`}>
      <legend id={`${id}-l`} className="adm-cms-link__legend">
        {field.label}
        {field.required ? <span className="adm-field__req" aria-hidden="true"> *</span> : null}
      </legend>
      {field.help ? <p className="adm-field__hint">{field.help}</p> : null}

      <div className="adm-cms-image__row">
        <VideoThumb url={url} />
        <div className="adm-cms-image__side">
          {url ? (
            <div className="tw:grid tw:gap-1">
              <code className="adm-cms-image__url" title={url}>{url}</code>
              <p className="adm-field__hint tw:m-0">Plays smoothly on hover · photo fades out</p>
            </div>
          ) : (
            <p className="adm-field__hint tw:m-0">No video clip chosen yet. The photo will stay static on hover.</p>
          )}

          {readOnly ? null : (
            <div className="adm-cms-image__btns">
              <Button size="sm" icon="video" onClick={() => setOpen(true)}>
                {url ? "Replace video" : "Choose video clip"}
              </Button>
              {url ? (
                <Button size="sm" variant="ghost" onClick={() => onChange(path, { url: "" })}>
                  <Trash2 size={14} /> Remove
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {err ? <p className="adm-field__error" role="alert">{err}</p> : null}

      {open ? (
        <VideoModal
          current={url ? { url } : null}
          onClose={() => setOpen(false)}
          onPick={(media) => {
            setOpen(false);
            onChange(path, { url: media.url });
          }}
        />
      ) : null}
    </fieldset>
  );
}

export default memo(VideoPickerField);
