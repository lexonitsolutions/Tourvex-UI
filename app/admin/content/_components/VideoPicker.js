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
      .mediaVideoList({ q: q || undefined, page, limit: LIMIT }, { signal: controller.signal })
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (!isAbortError(error)) setResult({ key, data: null, error });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cms, key]);

  const settled = result.key === key;
  const rawItems = settled && result.data ? listOf(result.data) : [];
  const items = rawItems;
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
  const [over, setOver] = useState(false);
  const controller = useRef(null);
  const inputId = useId();

  useEffect(() => () => controller.current?.abort(), []);

  async function start(file) {
    if (!file) return;
    const problem = checkVideoUpload(file);
    if (problem) {
      setState({ status: "error", progress: 0, error: problem, name: file?.name || "" });
      toast.error(problem);
      return;
    }
    controller.current = new AbortController();
    setState({ status: "uploading", progress: 0, error: "", name: file.name });
    try {
      const saved = await cms.uploadVideo(file, {
        signal: controller.current.signal,
        onProgress: (p) => setState((s) => ({ ...s, progress: Math.round(p * 100) })),
      });
      setState({ status: "done", progress: 100, error: "", name: file.name });
      toast.success(`Uploaded ${file.name}`);
      onUploaded(saved);
    } catch (error) {
      if (isAbortError(error)) {
        setState({ status: "idle", progress: 0, error: "", name: "" });
      } else {
        const msg = error.message || "Video upload failed";
        setState({ status: "error", progress: 0, error: msg, name: file.name });
        toast.error(msg);
      }
    }
  }

  const pct = state.progress;

  return (
    <div className="adm-cms-up">
      <label
        htmlFor={inputId}
        className={cx("adm-cms-drop", over && "is-over", state.status === "uploading" && "is-busy")}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (state.status !== "uploading") start(e.dataTransfer.files?.[0]);
        }}
      >
        <UploadCloud size={30} />
        <b>Drop a video clip here, or click to browse</b>
        <small>MP4, WebM, MOV or OGG · Up to 50 MB · 1:1, 4:5 or 16:9 ratio recommended</small>
        <input
          id={inputId}
          type="file"
          className="adm-sr"
          accept="video/mp4,video/webm,video/quicktime,video/ogg"
          disabled={state.status === "uploading"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) start(file);
          }}
        />
      </label>

      {state.status === "uploading" ? (
        <div className="adm-cms-up__progress" role="status">
          <div className="adm-cms-up__row">
            <span>Uploading {state.name}</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} aria-label="Upload progress" />
          <Button size="sm" variant="ghost" onClick={() => controller.current?.abort()}>
            Cancel
          </Button>
        </div>
      ) : null}

      {state.error ? <p className="adm-field__error" role="alert">{state.error}</p> : null}

      {picked?.url ? (
        <div className="adm-cms-up__done">
          <video
            src={resolveMediaUrl(picked.url)}
            muted
            playsInline
            controls
            style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 10, background: "#000" }}
          />
          <div>
            <b>{picked.filename || state.name || "Video selected"}</b>
            <small>Press &quot;Use video&quot; below to apply to the card.</small>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VideoByUrl({ picked, onPick }) {
  const [text, setText] = useState(picked?.url || "");

  function handleChange(val) {
    setText(val);
    const clean = val.trim();
    if (clean) {
      onPick({ url: clean });
    } else {
      onPick(null);
    }
  }

  return (
    <div className="adm-cms-urltab">
      <Field
        label="Video address"
        hint="An uploaded video, a /videos/... path of the site, or an https:// URL."
      >
        {(a11y) => (
          <Input
            className={CONTROL}
            type="text"
            value={text}
            placeholder="/videos/experience-clip.mp4 or https://..."
            onChange={(e) => handleChange(e.target.value)}
            {...a11y}
          />
        )}
      </Field>

      {text.trim() ? (
        <div className="adm-cms-up__done">
          <video
            src={resolveMediaUrl(text.trim())}
            playsInline
            muted
            controls
            style={{ width: 140, height: 90, objectFit: "cover", borderRadius: 10, background: "#000" }}
          />
          <div>
            <b>Preview</b>
            <small>If this stays blank or doesn&apos;t play, check the address or file format (MP4/WebM).</small>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function VideoModal({ current, onClose, onPick }) {
  const [tab, setTab] = useState("upload");
  const [picked, setPicked] = useState(current || null);

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Choose video clip"
      description="Short clip shown when hovering on the card."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!picked?.url}
            onClick={() => onPick(picked)}
          >
            Use video
          </Button>
        </>
      }
    >
      <div className="adm-cms-picker">
        <Tabs
          tabs={TABS}
          value={tab}
          onChange={setTab}
          idPrefix="adm-cms-vid"
          variant="segmented"
          label="Video source"
        />
        <TabPanel id="upload" value={tab} idPrefix="adm-cms-vid">
          <VideoUploader picked={picked} onUploaded={setPicked} />
        </TabPanel>
        <TabPanel id="url" value={tab} idPrefix="adm-cms-vid">
          <VideoByUrl picked={picked} onPick={setPicked} />
        </TabPanel>
        <TabPanel id="library" value={tab} idPrefix="adm-cms-vid">
          <VideoLibrary picked={picked} onPick={setPicked} />
        </TabPanel>
      </div>
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
        <VideoThumb key={url || "empty-video"} url={url} />
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
