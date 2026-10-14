"use client";

/*
 * Field types the catalog adds on top of the content editor's SchemaForm: money, chips, strings, dates, datetime, gallery, imageUrl.
 * They register themselves into the shared FieldRenderer (content/_components/formContext.js), so nested repeaters (cabins, ticket types,
 * sessions ...) render them too. Importing this module once (see CatalogEditor) is enough.
 */

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ImageOff, ImagePlus, Plus, Sparkles, Tag, Trash2, X } from "lucide-react";
import { Button, Field, MoneyField, cx } from "../../_kit";
import { Input } from "../../_ui/components/input";
import { dayKey } from "../../_lib/format";
import { resolveMediaUrl } from "../../_lib/cms";
import { API_BASE_URL } from "../../../lib/api";
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

const DEFAULT_SUGGESTIONS = {
  categories: [
    "Dhow Cruise & Yacht",
    "Yacht Charter",
    "Desert Safari",
    "Desert Safari Tours",
    "Theme Parks",
    "Water Activities",
    "Water Sports",
    "City Tours",
    "Adventure Tours",
    "Family Experiences",
    "Sightseeing & Cruises",
    "Cultural & Heritage",
    "Luxury Experiences",
    "Dinner Cruises",
    "Helicopter & Aerial Tours",
    "Nature & Wildlife",
    "Day Trips & Excursions",
  ],
  destinations: [
    "Dubai",
    "Dubai Marina",
    "Abu Dhabi",
    "Ras Al Khaimah",
    "Sharjah",
    "Fujairah",
    "Musandam",
    "Istanbul",
    "Singapore",
    "Baku",
    "Almaty",
    "Maldives",
  ],
  themes: [
    "Family",
    "Beach",
    "Luxury",
    "Culture",
    "Adventure",
    "Honeymoon",
    "Budget",
    "Romantic",
    "Wildlife & Safari",
    "City Break",
  ],
  tags: [
    "Family Friendly",
    "Outdoor",
    "Indoor",
    "Luxury",
    "Best Seller",
    "Adventure",
    "Waterfront",
    "Evening",
  ],
};

const Chips = memo(function Chips({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const items = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  const atMax = !!field.max && items.length >= field.max;
  const inputRef = useRef(null);

  // Dynamically discover existing categories / destinations from live catalog
  useEffect(() => {
    let ignore = false;
    const fetchLive = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/catalog/activities?limit=100`);
        if (!res.ok) return;
        const data = await res.json();
        const catalogItems = Array.isArray(data?.items) ? data.items : [];
        if (field.name === "categories") {
          const fetched = [...new Set(catalogItems.flatMap((it) => it.categories || []).filter(Boolean))];
          if (!ignore && fetched.length) setLiveSuggestions(fetched);
        } else if (field.name === "destinations") {
          const fetched = [...new Set(catalogItems.flatMap((it) => it.destinations || []).filter(Boolean))];
          if (!ignore && fetched.length) setLiveSuggestions(fetched);
        }
      } catch {
        // Fall back to built-in suggestions
      }
    };
    if (field.name === "categories" || field.name === "destinations") {
      fetchLive();
    }
    return () => {
      ignore = true;
    };
  }, [field.name]);

  // Combined unique suggestions
  const allSuggestions = useMemo(() => {
    const declared = field.suggestions || DEFAULT_SUGGESTIONS[field.name] || [];
    const pool = [...declared, ...liveSuggestions];
    const seen = new Set();
    const unique = [];
    pool.forEach((s) => {
      const trimmed = String(s || "").trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(trimmed);
      }
    });
    return unique;
  }, [field.suggestions, field.name, liveSuggestions]);

  // Filtered matching suggestions (excluding already added chips)
  const filteredSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    const available = allSuggestions.filter(
      (s) => !items.some((it) => it.toLowerCase() === s.toLowerCase())
    );
    if (!q) return available.slice(0, 10);

    // Prioritize startsWith over contains
    const startsWith = [];
    const contains = [];
    available.forEach((s) => {
      const lower = s.toLowerCase();
      if (lower.startsWith(q)) {
        startsWith.push(s);
      } else if (lower.includes(q)) {
        contains.push(s);
      }
    });
    return [...startsWith, ...contains].slice(0, 10);
  }, [allSuggestions, items, draft]);

  // Check if draft matches an existing item exactly
  const hasExactMatch = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return false;
    return items.some((it) => it.toLowerCase() === q) || filteredSuggestions.some((s) => s.toLowerCase() === q);
  }, [draft, items, filteredSuggestions]);

  function commit(raw) {
    const parts = String(raw).split(",").map((p) => p.trim()).filter(Boolean);
    if (!parts.length) {
      setDraft("");
      setActiveIndex(-1);
      return;
    }
    const next = [...items];
    parts.forEach((p) => {
      if (!next.some((x) => x.toLowerCase() === p.toLowerCase()) && (!field.max || next.length < field.max)) {
        next.push(p);
      }
    });
    onChange(path, next);
    setDraft("");
    setActiveIndex(-1);
  }

  const selectSuggestion = useCallback(
    (suggestion) => {
      if (atMax) return;
      commit(suggestion);
      setOpen(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [atMax, items, field.max, onChange, path]
  );

  const itemErrors = Object.keys(errors).filter((k) => k.startsWith(`${path}.`));
  const showDropdown = open && !readOnly && !atMax && (filteredSuggestions.length > 0 || (draft.trim() && !hasExactMatch));

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
            <div style={{ position: "relative" }}>
              <Input
                ref={inputRef}
                className={CONTROL}
                value={draft}
                disabled={atMax}
                placeholder={atMax ? `Maximum of ${field.max} reached` : "Type to see suggestions or press Enter"}
                autoComplete="off"
                onFocus={() => setOpen(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes(",")) {
                    commit(val);
                  } else {
                    setDraft(val);
                    setOpen(true);
                    setActiveIndex(-1);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setOpen(true);
                    setActiveIndex((prev) => {
                      const max = filteredSuggestions.length + (!hasExactMatch && draft.trim() ? 1 : 0);
                      if (max === 0) return -1;
                      return prev + 1 >= max ? 0 : prev + 1;
                    });
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setOpen(true);
                    setActiveIndex((prev) => {
                      const max = filteredSuggestions.length + (!hasExactMatch && draft.trim() ? 1 : 0);
                      if (max === 0) return -1;
                      return prev - 1 < 0 ? max - 1 : prev - 1;
                    });
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
                      selectSuggestion(filteredSuggestions[activeIndex]);
                    } else if (activeIndex === filteredSuggestions.length && !hasExactMatch && draft.trim()) {
                      commit(draft);
                      setOpen(false);
                    } else if (draft.trim()) {
                      commit(draft);
                      setOpen(false);
                    }
                  } else if (e.key === "Escape") {
                    setOpen(false);
                    setActiveIndex(-1);
                  } else if (e.key === "Backspace" && !draft && items.length) {
                    onChange(path, items.slice(0, -1));
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setOpen(false);
                    setActiveIndex(-1);
                    if (draft.trim()) commit(draft);
                  }, 180);
                }}
                {...a11y}
              />

              {/* Suggestions Dropdown Popover */}
              {showDropdown ? (
                <div
                  className="adm-cat-suggestions"
                  role="listbox"
                  aria-label={`${field.label} suggestions`}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 5px)",
                    left: 0,
                    right: 0,
                    zIndex: 999,
                    background: "var(--adm-surface, #ffffff)",
                    border: "1px solid var(--adm-line, rgba(0,0,0,0.12))",
                    borderRadius: 12,
                    boxShadow: "0 12px 32px -4px rgba(0,0,0,0.22), 0 6px 14px -3px rgba(0,0,0,0.14)",
                    padding: "6px",
                    maxHeight: 250,
                    overflowY: "auto",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "4px 8px 6px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--adm-faint, #64748b)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      borderBottom: "1px solid var(--adm-line, rgba(0,0,0,0.06))",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Sparkles size={12} color="var(--adm-teal, #0d9488)" />
                      {draft.trim() ? "Matching suggestions" : `Suggested ${field.label.toLowerCase()}`}
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 500 }}>
                      {filteredSuggestions.length} available
                    </span>
                  </div>

                  {filteredSuggestions.map((suggestion, idx) => {
                    const isActive = activeIndex === idx;
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectSuggestion(suggestion);
                        }}
                        onMouseEnter={() => setActiveIndex(idx)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          fontSize: 13.5,
                          fontWeight: 500,
                          textAlign: "left",
                          border: 0,
                          cursor: "pointer",
                          transition: "all 0.12s ease",
                          background: isActive
                            ? "var(--adm-teal-soft, rgba(13,148,136,0.14))"
                            : "transparent",
                          color: isActive
                            ? "var(--adm-teal-ink, #0f766e)"
                            : "var(--adm-ink, #0f172a)",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <Tag size={13} style={{ opacity: 0.65, flexShrink: 0 }} />
                          <span>{suggestion}</span>
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: isActive
                              ? "var(--adm-teal, #0d9488)"
                              : "var(--adm-line, rgba(0,0,0,0.08))",
                            color: isActive ? "#ffffff" : "var(--adm-faint)",
                            transition: "all 0.12s ease",
                          }}
                        >
                          + Add
                        </span>
                      </button>
                    );
                  })}

                  {/* Add custom typed chip if not an exact match */}
                  {draft.trim() && !hasExactMatch ? (
                    <button
                      type="button"
                      role="option"
                      aria-selected={activeIndex === filteredSuggestions.length}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        commit(draft);
                        setOpen(false);
                      }}
                      onMouseEnter={() => setActiveIndex(filteredSuggestions.length)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "8px 10px",
                        marginTop: 4,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign: "left",
                        borderTop: "1px dashed var(--adm-line, rgba(0,0,0,0.1))",
                        cursor: "pointer",
                        background:
                          activeIndex === filteredSuggestions.length
                            ? "var(--adm-brand-soft, rgba(59,130,246,0.14))"
                            : "transparent",
                        color:
                          activeIndex === filteredSuggestions.length
                            ? "var(--adm-brand-ink, #1d4ed8)"
                            : "var(--adm-ink, #0f172a)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Plus size={13} style={{ flexShrink: 0 }} />
                        <span>Add &quot;{draft.trim()}&quot; (custom)</span>
                      </span>
                      <span style={{ fontSize: 10.5, opacity: 0.7 }}>Press Enter ↵</span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
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

/* ------------------------------------------------------------------ country code with live flag preview */

const CountryCode = memo(function CountryCode({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const code = String(value || "").toLowerCase().trim();
  const [flagSrc, setFlagSrc] = useState(code && code.length === 2 ? `/flags/${code}.svg` : null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (code && code.length === 2) {
      setFlagSrc(`/flags/${code}.svg`);
      setHasError(false);
    } else {
      setFlagSrc(null);
      setHasError(false);
    }
  }, [code]);

  return (
    <Field label={field.label} hint={hintOf(field)} error={errors[path]} required={field.required}>
      {(a11y) => (
        <div className="adm-cat-countrycode-wrap">
          <div className="adm-cat-countrycode-row">
            <Input
              className={`${CONTROL} tw:uppercase`}
              value={value || ""}
              maxLength={2}
              autoComplete="off"
              spellCheck={false}
              placeholder="e.g. ae, sa, tr"
              disabled={readOnly}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z]/g, "").toLowerCase();
                onChange(path, val);
              }}
              {...a11y}
            />
            {code && code.length === 2 ? (
              <div className="adm-cat-flag-badge" title={`Flag for ${code.toUpperCase()}`}>
                {!hasError && flagSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={flagSrc}
                    alt={code}
                    className="adm-cat-flag-img"
                    onError={() => {
                      if (!flagSrc.includes("flagcdn.com")) {
                        setFlagSrc(`https://flagcdn.com/${code}.svg`);
                      } else {
                        setHasError(true);
                      }
                    }}
                  />
                ) : (
                  <span className="adm-cat-flag-fallback">{code.toUpperCase()}</span>
                )}
                <span className="adm-cat-flag-code">{code.toUpperCase()}</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Field>
  );
});

registerFieldType("countryCode", CountryCode, { wide: false });
