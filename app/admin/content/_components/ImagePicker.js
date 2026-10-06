"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import { ImageOff, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { Button, ErrorState, Field, Modal, Pagination, SearchInput, Skeleton, TabPanel, Tabs, cx, useToast } from "../../_kit";
import { Input } from "../../_ui/components/input";
import { Progress } from "../../_ui/components/progress";
import { checkUpload, formatBytes, isValidImageUrl, listOf, resolveMediaUrl, useCmsApi } from "../../_lib/cms";
import { isAbortError } from "../../_lib/adminApi";
import { useFormContext } from "./formContext";
import { CONTROL } from "./parts";

const LIMIT = 24;
const TABS = [
  { id: "library", label: "Library" },
  { id: "upload", label: "Upload" },
  { id: "url", label: "By URL" },
];

/** "16:9", "16/9", "4x3" -> 1.777 (null when unparsable). */
function parseAspect(aspect) {
  const m = /^\s*(\d+(?:\.\d+)?)\s*[:/x]\s*(\d+(?:\.\d+)?)\s*$/i.exec(String(aspect || ""));
  return m ? Number(m[1]) / Number(m[2]) : null;
}

function AspectNote({ aspect, width, height }) {
  const want = parseAspect(aspect);
  if (!want || !width || !height) return null;
  const got = width / height;
  if (Math.abs(got - want) / want < 0.08) return <p className="adm-cms-aspect is-ok">Matches the {aspect} slot.</p>;
  return <p className="adm-cms-aspect">This image is {width}x{height}; the slot is {aspect}, so the edges may be cropped.</p>;
}

function Library({ picked, onPick }) {
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
    // key encodes q + page + attempt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cms, key]);

  const settled = result.key === key;
  const items = settled && result.data ? listOf(result.data) : [];
  const pagination = settled ? result.data?.pagination : null;

  return (
    <div className="adm-cms-lib">
      <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by file name" label="Search media library" />
      {!settled ? (
        <div className="adm-cms-lib__grid" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} height={120} className="tw:rounded-xl" />)}
        </div>
      ) : result.error ? (
        <ErrorState title="Could not load the media library" description={result.error.message} onRetry={() => setAttempt((n) => n + 1)} />
      ) : !items.length ? (
        <div className="adm-empty">
          <p className="adm-empty__title">{q ? "No images match your search" : "No images uploaded yet"}</p>
          <p className="adm-empty__desc">{q ? "Try a different file name." : "Use the Upload tab to add the first image."}</p>
        </div>
      ) : (
        <ul className="adm-cms-lib__grid" aria-label="Media library">
          {items.map((m) => {
            const on = picked?.url === m.url;
            return (
              <li key={m.id || m.url}>
                <button type="button" className={cx("adm-cms-tile", on && "is-selected")} aria-pressed={on} onClick={() => onPick(m)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveMediaUrl(m.url)} alt="" loading="lazy" />
                  <span className="adm-cms-tile__meta">
                    <b>{m.filename || "image"}</b>
                    <small>{m.width && m.height ? `${m.width}x${m.height}` : ""}{m.size ? ` · ${formatBytes(m.size)}` : ""}</small>
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

function Uploader({ onUploaded, picked }) {
  const cms = useCmsApi();
  const toast = useToast();
  const [state, setState] = useState({ status: "idle", progress: 0, error: "", name: "" });
  const [over, setOver] = useState(false);
  const controller = useRef(null);
  const inputId = useId();

  useEffect(() => () => controller.current?.abort(), []);

  async function start(file) {
    const problem = checkUpload(file);
    if (problem) {
      setState({ status: "error", progress: 0, error: problem, name: file?.name || "" });
      return;
    }
    controller.current = new AbortController();
    setState({ status: "uploading", progress: 0, error: "", name: file.name });
    try {
      const media = await cms.upload(file, { signal: controller.current.signal, onProgress: (p) => setState((s) => ({ ...s, progress: p })) });
      setState({ status: "done", progress: 1, error: "", name: file.name });
      onUploaded(media);
      toast.success("Image uploaded");
    } catch (error) {
      if (isAbortError(error)) setState({ status: "idle", progress: 0, error: "", name: "" });
      else setState({ status: "error", progress: 0, error: error.message, name: file.name });
    }
  }

  const pct = Math.round(state.progress * 100);
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
        <UploadCloud size={26} />
        <b>Drop an image here, or click to browse</b>
        <small>PNG, JPEG, WebP or AVIF. Up to 5 MB and 8000 px. SVG is not accepted.</small>
        <input
          id={inputId}
          type="file"
          className="adm-sr"
          accept="image/png,image/jpeg,image/webp,image/avif"
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
          <div className="adm-cms-up__row"><span>Uploading {state.name}</span><span>{pct}%</span></div>
          <Progress value={pct} aria-label="Upload progress" />
          <Button size="sm" variant="ghost" onClick={() => controller.current?.abort()}>Cancel</Button>
        </div>
      ) : null}
      {state.status === "error" ? <p className="adm-field__error" role="alert">{state.error}</p> : null}
      {state.status === "done" && picked ? (
        <div className="adm-cms-up__done">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolveMediaUrl(picked.url)} alt="" />
          <div><b>{picked.filename || state.name}</b><small>Uploaded and selected. Press &quot;Use image&quot; to apply it.</small></div>
        </div>
      ) : null}
    </div>
  );
}

function UrlTab({ picked, onPick }) {
  const [text, setText] = useState(picked?.url || "");
  const ok = isValidImageUrl(text);
  return (
    <div className="adm-cms-urltab">
      <Field label="Image address" hint="An uploaded image, a /images/... path of the site, or an https:// URL." error={text && !ok ? "Use /images/..., /api/v1/media/images/... or an https:// URL." : ""}>
        {(a11y) => (
          <Input
            className={CONTROL}
            value={text}
            placeholder="/images/example.jpg"
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => {
              setText(e.target.value);
              const v = e.target.value.trim();
              onPick(isValidImageUrl(v) ? { url: v } : null);
            }}
            {...a11y}
          />
        )}
      </Field>
      {ok ? (
        <div className="adm-cms-up__done">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolveMediaUrl(text.trim())} alt="" />
          <div><b>Preview</b><small>If this stays blank the address does not point to an image.</small></div>
        </div>
      ) : null}
    </div>
  );
}

/** Modal image chooser. Mount it only while open (state then starts fresh). onPick receives the media item ({ url, width?, height? ... }). */
export function ImagePicker({ onClose, onPick, aspect, current }) {
  const [tab, setTab] = useState("library");
  const [picked, setPicked] = useState(null);
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Choose an image"
      description={aspect ? `Recommended aspect ratio ${aspect}.` : "Pick from the library, upload a new file, or paste an address."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!picked} onClick={() => onPick(picked)}>Use image</Button>
        </>
      }
    >
      <div className="adm-cms-picker">
        <Tabs tabs={TABS} value={tab} onChange={setTab} idPrefix="adm-cms-pick" variant="segmented" label="Image source" />
        <TabPanel id="library" value={tab} idPrefix="adm-cms-pick"><Library picked={picked || current} onPick={setPicked} /></TabPanel>
        <TabPanel id="upload" value={tab} idPrefix="adm-cms-pick"><Uploader picked={picked} onUploaded={setPicked} /></TabPanel>
        <TabPanel id="url" value={tab} idPrefix="adm-cms-pick"><UrlTab picked={picked} onPick={setPicked} /></TabPanel>
        {picked?.width ? <AspectNote aspect={aspect} width={picked.width} height={picked.height} /> : null}
      </div>
    </Modal>
  );
}

function ImageField({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(null);
  const altRef = useRef(null);
  const img = value && typeof value === "object" ? value : { url: "", alt: "" };
  const ratio = parseAspect(field.aspect) || 16 / 9;
  const urlError = errors[`${path}.url`] || errors[path];
  const altError = errors[`${path}.alt`];

  return (
    <fieldset className="adm-cms-image" aria-labelledby={`${id}-l`}>
      <legend id={`${id}-l`} className="adm-cms-link__legend">
        {field.label}
        {field.required ? <span className="adm-field__req" aria-hidden="true"> *</span> : null}
      </legend>
      {field.help ? <p className="adm-field__hint">{field.help}</p> : null}
      <div className="adm-cms-image__row">
        <div className={cx("adm-cms-image__frame", !img.url && "is-empty", !field.aspect && "is-contain")} style={{ width: `min(100%, ${Math.round(180 * ratio)}px)`, aspectRatio: String(ratio) }}>
          {img.url && broken !== img.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(img.url)} alt={img.alt || ""} onError={() => setBroken(img.url)} />
          ) : (
            <span>{img.url ? <><ImageOff size={20} /> Could not load</> : <><ImagePlus size={20} /> No image</>}</span>
          )}
        </div>
        <div className="adm-cms-image__side">
          {field.aspect ? <p className="adm-field__hint">Recommended ratio {field.aspect}</p> : null}
          {img.url ? <code className="adm-cms-image__url" title={img.url}>{img.url}</code> : null}
          {readOnly ? null : (
            <div className="adm-cms-image__btns">
              <Button size="sm" icon="edit" onClick={() => setOpen(true)}>{img.url ? "Replace" : "Choose image"}</Button>
              {img.url ? <Button size="sm" variant="ghost" onClick={() => onChange(path, { url: "", alt: "" })}><Trash2 size={14} /> Remove</Button> : null}
            </div>
          )}
        </div>
      </div>
      {urlError ? <p className="adm-field__error" role="alert">{urlError}</p> : null}
      <Field label="Alt text" hint={img.url && !String(img.alt || "").trim() ? "No alt text yet. Describe the image for screen readers, or leave it empty only if it is purely decorative." : "Describe the image for people who cannot see it."} error={altError}>
        {(a11y) => (
          <Input ref={altRef} className={CONTROL} value={img.alt || ""} disabled={readOnly} maxLength={200} onChange={(e) => onChange(path, { ...img, alt: e.target.value })} {...a11y} />
        )}
      </Field>
      {open ? (
        <ImagePicker
          aspect={field.aspect}
          current={img.url ? { url: img.url } : null}
          onClose={() => setOpen(false)}
          onPick={(m) => {
            setOpen(false);
            setBroken(null);
            onChange(path, { url: m.url, alt: img.alt || "" });
            setTimeout(() => altRef.current?.focus(), 60);
          }}
        />
      ) : null}
    </fieldset>
  );
}

export default memo(ImageField);
