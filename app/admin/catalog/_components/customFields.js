"use client";

/*
 * Field types the catalog adds on top of the content editor's SchemaForm: money, chips, strings, dates, datetime, gallery, imageUrl.
 * They register themselves into the shared FieldRenderer (content/_components/formContext.js), so nested repeaters (cabins, ticket types,
 * sessions ...) render them too. Importing this module once (see CatalogEditor) is enough.
 */

import { memo, useId, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ImageOff, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Button, Field, MoneyField, cx } from "../../_kit";
import { Input } from "../../_ui/components/input";
import { dayKey } from "../../_lib/format";
import { resolveMediaUrl } from "../../_lib/cms";
import { ImagePicker } from "../../content/_components/ImagePicker";
import { registerFieldType, useFormContext } from "../../content/_components/formContext";
import { CONTROL } from "../../content/_components/parts";

const hintOf = (field) => field.help;

/* ------------------------------------------------------------------ money */

const Money = memo(function Money({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const m = value && typeof value === "object" ? value : { amount: null, currency: "AED" };
  const id = useId();
  return (
    <fieldset className="adm-cat-money" aria-labelledby={`${id}-l`}>
      <legend id={`${id}-l`} className="adm-cms-link__legend">{field.label}</legend>
      {hintOf(field) ? <p className="adm-field__hint">{hintOf(field)}</p> : null}
      <div className="adm-cat-money__row">
        <MoneyField label="Amount" currency={m.currency || "AED"} value={m.amount} error={errors[`${path}.amount`] || errors[path]} disabled={readOnly} onChange={(amount) => onChange(path, { ...m, amount })} />
        <Field label="Currency" error={errors[`${path}.currency`]}>
          {(a11y) => (
            <Input className={`${CONTROL} tw:uppercase`} value={m.currency || ""} maxLength={3} spellCheck={false} autoComplete="off" disabled={readOnly} onChange={(e) => onChange(path, { ...m, currency: e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase() })} {...a11y} />
          )}
        </Field>
      </div>
    </fieldset>
  );
});

/* ------------------------------------------------------------------ chips (short strings: destinations, themes, tags) */

const Chips = memo(function Chips({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const items = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState("");
  const atMax = !!field.max && items.length >= field.max;
  const inputRef = useRef(null);

  function commit(raw) {
    const parts = String(raw).split(",").map((p) => p.trim()).filter(Boolean);
    if (!parts.length) {
      setDraft("");
      return;
    }
    const next = [...items];
    parts.forEach((p) => {
      if (!next.some((x) => x.toLowerCase() === p.toLowerCase()) && (!field.max || next.length < field.max)) next.push(p);
    });
    onChange(path, next);
    setDraft("");
  }
  const itemErrors = Object.keys(errors).filter((k) => k.startsWith(`${path}.`));
  return (
    <Field label={field.label} hint={hintOf(field)} error={errors[path] || (itemErrors.length ? errors[itemErrors[0]] : "")} required={field.required}>
      {(a11y) => (
        <div className={cx("adm-cat-chips", readOnly && "is-readonly")}>
          {items.length ? (
            <ul className="adm-cat-chips__list" aria-label={field.label}>
              {items.map((item, i) => (
                <li key={`${item}-${i}`} className={cx("adm-cat-chip", errors[`${path}.${i}`] && "has-error")}>
                  <span>{item}</span>
                  {readOnly ? null : (
                    <button type="button" aria-label={`Remove ${item}`} onClick={() => onChange(path, items.filter((_, j) => j !== i))}>
                      <X size={13} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          {readOnly ? null : (
            <Input
              ref={inputRef}
              className={CONTROL}
              value={draft}
              disabled={atMax}
              placeholder={atMax ? `Maximum of ${field.max} reached` : "Type and press Enter to add"}
              autoComplete="off"
              onChange={(e) => (e.target.value.includes(",") ? commit(e.target.value) : setDraft(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit(draft);
                } else if (e.key === "Backspace" && !draft && items.length) onChange(path, items.slice(0, -1));
              }}
              onBlur={() => commit(draft)}
              {...a11y}
            />
          )}
          {field.max ? <p className="adm-cms-count">{items.length} / {field.max}</p> : null}
        </div>
      )}
    </Field>
  );
});

/* ------------------------------------------------------------------ strings (longer lines: highlights, inclusions ...) */

const Strings = memo(function Strings({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const items = Array.isArray(value) ? value : [];
  const atMax = !!field.max && items.length >= field.max;
  const rootRef = useRef(null);
  const set = (next) => onChange(path, next);
  const move = (i, d) => {
    const next = items.slice();
    next.splice(i + d, 0, next.splice(i, 1)[0]);
    set(next);
  };
  function add() {
    set([...items, ""]);
    setTimeout(() => {
      const inputs = rootRef.current?.querySelectorAll("input[data-line]");
      inputs?.[inputs.length - 1]?.focus();
    }, 30);
  }
  const heading = useId();
  return (
    <div className="adm-cms-list adm-cat-strings" ref={rootRef}>
      <div className="adm-cms-list__head">
        <div>
          <h4 className="adm-cms-list__label" id={heading}>{field.label}</h4>
          {hintOf(field) ? <p className="adm-field__hint">{hintOf(field)}</p> : null}
        </div>
        <span className="adm-cms-list__count">{items.length}{field.max ? ` / ${field.max}` : ""} {items.length === 1 ? "item" : "items"}</span>
      </div>
      {errors[path] ? <p className="adm-field__error" role="alert">{errors[path]}</p> : null}
      {items.length ? (
        <ul className="adm-cat-lines" aria-labelledby={heading}>
          {items.map((item, i) => (
            <li key={i} className={cx("adm-cat-line", errors[`${path}.${i}`] && "has-error")}>
              <span className="adm-cat-line__n" aria-hidden="true">{i + 1}</span>
              <div className="adm-cat-line__main">
                <Input
                  data-line=""
                  className={CONTROL}
                  value={item}
                  disabled={readOnly}
                  aria-label={`${field.label} ${i + 1}`}
                  aria-invalid={errors[`${path}.${i}`] ? true : undefined}
                  onChange={(e) => set(items.map((x, j) => (j === i ? e.target.value : x)))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !readOnly) {
                      e.preventDefault();
                      if (!atMax) add();
                    }
                  }}
                />
                {errors[`${path}.${i}`] ? <p className="adm-field__error" role="alert">{errors[`${path}.${i}`]}</p> : field.itemMax && item.length > field.itemMax * 0.85 ? <p className={cx("adm-cms-count", item.length > field.itemMax && "is-over")}>{item.length} / {field.itemMax}</p> : null}
              </div>
              {readOnly ? null : (
                <div className="adm-cat-line__actions">
                  <button type="button" className="adm-cms-mini" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${field.label} ${i + 1} up`}><ArrowUp size={15} /></button>
                  <button type="button" className="adm-cms-mini" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${field.label} ${i + 1} down`}><ArrowDown size={15} /></button>
                  <button type="button" className="adm-cms-mini is-danger" onClick={() => set(items.filter((_, j) => j !== i))} aria-label={`Remove ${field.label} ${i + 1}`}><Trash2 size={15} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="adm-cms-list__empty">None added yet.</p>
      )}
      {readOnly ? null : (
        <button type="button" className="adm-btn adm-btn--secondary adm-btn--sm adm-cms-list__add" onClick={add} disabled={atMax}>
          <Plus size={15} />
          <span className="adm-btn__label">{atMax ? `Maximum of ${field.max} reached` : "Add item"}</span>
        </button>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ dates (list of days) */

const Dates = memo(function Dates({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const items = Array.isArray(value) ? value : [];
  const atMax = !!field.max && items.length >= field.max;
  const [today] = useState(() => dayKey());
  const set = (next) => onChange(path, next);
  const heading = useId();
  return (
    <div className="adm-cms-list adm-cat-strings">
      <div className="adm-cms-list__head">
        <div>
          <h4 className="adm-cms-list__label" id={heading}>{field.label}</h4>
          {hintOf(field) ? <p className="adm-field__hint">{hintOf(field)}</p> : null}
        </div>
        <span className="adm-cms-list__count">{items.length}{field.max ? ` / ${field.max}` : ""} {items.length === 1 ? "date" : "dates"}</span>
      </div>
      {errors[path] ? <p className="adm-field__error" role="alert">{errors[path]}</p> : null}
      {items.length ? (
        <ul className="adm-cat-dates" aria-labelledby={heading}>
          {items.map((d, i) => (
            <li key={i} className={cx("adm-cat-date", errors[`${path}.${i}`] && "has-error")}>
              <Input
                type="date"
                className={CONTROL}
                value={d}
                min={field.noPast ? today : undefined}
                disabled={readOnly}
                aria-label={`${field.label} ${i + 1}`}
                aria-invalid={errors[`${path}.${i}`] ? true : undefined}
                onChange={(e) => set(items.map((x, j) => (j === i ? e.target.value : x)))}
              />
              {readOnly ? null : (
                <button type="button" className="adm-cms-mini is-danger" onClick={() => set(items.filter((_, j) => j !== i))} aria-label={`Remove date ${i + 1}`}><Trash2 size={15} /></button>
              )}
              {errors[`${path}.${i}`] ? <p className="adm-field__error" role="alert">{errors[`${path}.${i}`]}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="adm-cms-list__empty">No dates yet.</p>
      )}
      {readOnly ? null : (
        <button type="button" className="adm-btn adm-btn--secondary adm-btn--sm adm-cms-list__add" onClick={() => set([...items, ""])} disabled={atMax}>
          <Plus size={15} />
          <span className="adm-btn__label">{atMax ? `Maximum of ${field.max} reached` : "Add date"}</span>
        </button>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ datetime (Dubai time) */

const Datetime = memo(function Datetime({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  return (
    <Field label={field.label} hint={field.help || "Dubai time (GST)."} error={errors[path]} required={field.required}>
      {(a11y) => <Input type="datetime-local" className={CONTROL} value={typeof value === "string" ? value : ""} disabled={readOnly} onChange={(e) => onChange(path, e.target.value)} {...a11y} />}
    </Field>
  );
});

/* ------------------------------------------------------------------ images */

/** "/images/dubai-skyline_01.jpg" -> "Dubai skyline 01": a starting point for the required alt text. */
function altFrom(media) {
  const raw = media.filename || String(media.url || "").split("?")[0].split("/").pop() || "";
  return raw.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());
}

function Thumb({ url, className }) {
  const [broken, setBroken] = useState(null);
  return (
    <div className={cx("adm-cat-thumb", !url && "is-empty", className)}>
      {url && broken !== url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolveMediaUrl(url)} alt="" onError={() => setBroken(url)} loading="lazy" />
      ) : (
        <span>{url ? <><ImageOff size={18} /> Could not load</> : <><ImagePlus size={18} /> No image</>}</span>
      )}
    </div>
  );
}

const Gallery = memo(function Gallery({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const items = Array.isArray(value) ? value : [];
  const [picker, setPicker] = useState(null); // { replace: index | null }
  const atMax = !!field.max && items.length >= field.max;
  const heading = useId();
  const set = (next) => onChange(path, next);
  const move = (i, d) => {
    const next = items.slice();
    next.splice(i + d, 0, next.splice(i, 1)[0]);
    set(next);
  };
  const itemUrlError = (i) => errors[`${path}.${i}.url`];
  return (
    <div className="adm-cms-list adm-cat-gallery">
      <div className="adm-cms-list__head">
        <div>
          <h4 className="adm-cms-list__label" id={heading}>{field.label}{field.required ? <span className="adm-field__req" aria-hidden="true"> *</span> : null}</h4>
          {hintOf(field) ? <p className="adm-field__hint">{hintOf(field)}</p> : null}
        </div>
        <span className="adm-cms-list__count">{items.length}{field.max ? ` / ${field.max}` : ""} {items.length === 1 ? "image" : "images"}</span>
      </div>
      {errors[path] ? <p className="adm-field__error" role="alert">{errors[path]}</p> : null}
      {items.length ? (
        <ul className="adm-cat-gallery__grid" aria-labelledby={heading}>
          {items.map((img, i) => (
            <li key={img.id || i} className="adm-cat-gcard">
              <div className="adm-cat-gcard__frame">
                <Thumb url={img.url} />
                {i === 0 && field.required ? <span className="adm-cat-gcard__badge">Cover</span> : <span className="adm-cat-gcard__badge is-num">{i + 1}</span>}
              </div>
              <Field label="Alt text" error={errors[`${path}.${i}.alt`] || itemUrlError(i)} hint="Describe the image for screen readers.">
                {(a11y) => (
                  <Input className={CONTROL} value={img.alt || ""} maxLength={250} disabled={readOnly} onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} {...a11y} />
                )}
              </Field>
              {readOnly ? null : (
                <div className="adm-cat-gcard__actions">
                  <button type="button" className="adm-cms-mini" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move image ${i + 1} earlier`}><ArrowLeft size={15} /></button>
                  <button type="button" className="adm-cms-mini" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move image ${i + 1} later`}><ArrowRight size={15} /></button>
                  <Button size="sm" variant="ghost" icon="edit" onClick={() => setPicker({ replace: i })}>Replace</Button>
                  <button type="button" className="adm-cms-mini is-danger" onClick={() => set(items.filter((_, j) => j !== i))} aria-label={`Remove image ${i + 1}`}><Trash2 size={15} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="adm-cms-list__empty">No images yet.</p>
      )}
      {readOnly ? null : (
        <button type="button" className="adm-btn adm-btn--secondary adm-btn--sm adm-cms-list__add" onClick={() => setPicker({ replace: null })} disabled={atMax}>
          <Plus size={15} />
          <span className="adm-btn__label">{atMax ? `Maximum of ${field.max} reached` : "Add image"}</span>
        </button>
      )}
      {picker ? (
        <ImagePicker
          current={picker.replace !== null && items[picker.replace]?.url ? { url: items[picker.replace].url } : null}
          onClose={() => setPicker(null)}
          onPick={(m) => {
            const { replace } = picker;
            setPicker(null);
            if (replace !== null) set(items.map((x, j) => (j === replace ? { ...x, url: m.url } : x)));
            else set([...items, { id: `new-${Date.now().toString(36)}-${items.length}`, url: m.url, alt: altFrom(m) }]);
          }}
        />
      ) : null}
    </div>
  );
});

const ImageUrl = memo(function ImageUrl({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const [open, setOpen] = useState(false);
  const url = typeof value === "string" ? value : "";
  const id = useId();
  return (
    <fieldset className="adm-cms-image" aria-labelledby={`${id}-l`}>
      <legend id={`${id}-l`} className="adm-cms-link__legend">
        {field.label}
        {field.required ? <span className="adm-field__req" aria-hidden="true"> *</span> : null}
      </legend>
      {hintOf(field) ? <p className="adm-field__hint">{hintOf(field)}</p> : null}
      <div className="adm-cms-image__row">
        <Thumb url={url} className="adm-cat-thumb--cover" />
        <div className="adm-cms-image__side">
          {url ? <code className="adm-cms-image__url" title={url}>{url}</code> : null}
          {readOnly ? null : (
            <div className="adm-cms-image__btns">
              <Button size="sm" icon="edit" onClick={() => setOpen(true)}>{url ? "Replace" : "Choose image"}</Button>
              {url ? <Button size="sm" variant="ghost" onClick={() => onChange(path, "")}><Trash2 size={14} /> Remove</Button> : null}
            </div>
          )}
        </div>
      </div>
      {errors[path] ? <p className="adm-field__error" role="alert">{errors[path]}</p> : null}
      {open ? (
        <ImagePicker
          current={url ? { url } : null}
          onClose={() => setOpen(false)}
          onPick={(m) => {
            setOpen(false);
            onChange(path, m.url);
          }}
        />
      ) : null}
    </fieldset>
  );
});

registerFieldType("money", Money);
registerFieldType("chips", Chips);
registerFieldType("strings", Strings);
registerFieldType("dates", Dates);
registerFieldType("datetime", Datetime, { wide: false });
registerFieldType("gallery", Gallery);
registerFieldType("imageUrl", ImageUrl);
