"use client";

import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { Collapsible, CollapsibleContent } from "../../_ui/components/collapsible";
import { cloneWithNewIds, newListItem, stripMarkdown } from "../../_lib/cms";
import { cx } from "../../_kit";
import { errorsUnder, useFormContext } from "./formContext";
import SchemaForm from "./SchemaForm";
import { useSortable } from "./sortable";

const LEAVE_MS = 170;

/** One-line summary of an item: its first filled text-like field. */
function summaryOf(field, item) {
  for (const f of field.fields) {
    const v = item?.[f.name];
    let text = "";
    if (f.type === "text" || f.type === "textarea") text = v;
    else if (f.type === "richtext") text = stripMarkdown(v);
    else if (f.type === "link") text = v?.label;
    else if (f.type === "image") text = v?.alt;
    text = String(text || "").replace(/\s+/g, " ").trim();
    if (text) return text.length > 64 ? `${text.slice(0, 63)}…` : text;
  }
  return "";
}

const ListItem = memo(function ListItem({ field, item, index, count, path, open, mark, dragging, fresh, leaving, readOnly, canRemove, canDuplicate, handleProps, itemProps, onToggle, onMoveBy, onDuplicate, onRemove }) {
  const { errors } = useFormContext();
  const bodyId = useId();
  const title = `${field.itemLabel || "Item"} ${index + 1}`;
  const summary = summaryOf(field, item);
  const errCount = errorsUnder(errors, path).length;
  const expanded = open || errCount > 0;
  return (
    <li
      className={cx("adm-cms-li", mark && `is-drop-${mark}`, dragging && "is-dragging", fresh && "is-fresh", leaving && "is-leaving", errCount > 0 && "has-error")}
      data-item-id={item.id}
      {...itemProps(item.id)}
    >
      <div className="adm-cms-li__head">
        {readOnly ? null : (
          <button type="button" className="adm-cms-grip" aria-label={`Reorder ${title}. Use the arrow keys, or drag.`} title="Drag to reorder (or arrow keys)" {...handleProps(item.id)}>
            <GripVertical size={16} />
          </button>
        )}
        <button type="button" className="adm-cms-li__toggle" aria-expanded={expanded} aria-controls={bodyId} onClick={() => onToggle(item.id)}>
          <ChevronRight size={16} className="adm-cms-chev" />
          <span className="adm-cms-li__title">{title}</span>
          {summary ? <span className="adm-cms-li__summary">{summary}</span> : null}
          {errCount ? <span className="adm-cms-badge is-error" aria-label={`${errCount} problems`}>{errCount}</span> : null}
        </button>
        {readOnly ? null : (
          <div className="adm-cms-li__actions">
            <button type="button" className="adm-cms-mini" onClick={() => onMoveBy(item.id, -1)} disabled={index === 0} aria-label={`Move ${title} up`} title="Move up"><ArrowUp size={15} /></button>
            <button type="button" className="adm-cms-mini" onClick={() => onMoveBy(item.id, 1)} disabled={index === count - 1} aria-label={`Move ${title} down`} title="Move down"><ArrowDown size={15} /></button>
            <button type="button" className="adm-cms-mini" onClick={() => onDuplicate(item.id)} disabled={!canDuplicate} aria-label={`Duplicate ${title}`} title="Duplicate"><Copy size={15} /></button>
            <button type="button" className="adm-cms-mini is-danger" onClick={() => onRemove(item.id)} disabled={!canRemove} aria-label={`Remove ${title}`} title={canRemove ? "Remove" : `At least ${field.min} required`}><Trash2 size={15} /></button>
          </div>
        )}
      </div>
      <Collapsible open={expanded}>
        <CollapsibleContent id={bodyId}>
          <div className="adm-cms-li__body">
            <SchemaForm fields={field.fields} value={item} base={path} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
});

function ListField({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const items = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const itemsRef = useRef(items);
  useLayoutEffect(() => {
    itemsRef.current = items;
  });
  const [initialOpen] = useState(() => items.length <= 3);
  const [openMap, setOpenMap] = useState({});
  const [leavingId, setLeavingId] = useState(null);
  const [freshIds, setFreshIds] = useState(() => new Set());
  const focusNew = useRef(null);
  const timer = useRef(null);
  const noun = field.itemLabel || "Item";
  const ids = useMemo(() => items.map((i) => i.id), [items]);
  const atMax = !!field.max && items.length >= field.max;
  const atMin = items.length <= (field.min || 0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const commit = useCallback((next) => onChange(path, next), [onChange, path]);

  const sortable = useSortable({
    ids,
    labelOf: (id) => `${noun} ${itemsRef.current.findIndex((i) => i.id === id) + 1}`,
    onMove: (from, to) => {
      const next = itemsRef.current.slice();
      next.splice(to, 0, next.splice(from, 1)[0]);
      commit(next);
    },
  });
  const { move, announce } = sortable;

  const onToggle = useCallback((id) => setOpenMap((m) => ({ ...m, [id]: !(m[id] ?? initialOpen) })), [initialOpen]);
  const onMoveBy = useCallback((id, delta) => move(id, itemsRef.current.findIndex((i) => i.id === id) + delta), [move]);
  const onDuplicate = useCallback(
    (id) => {
      const list = itemsRef.current;
      const at = list.findIndex((i) => i.id === id);
      const copy = cloneWithNewIds(field, list[at]);
      setFreshIds((f) => new Set(f).add(copy.id));
      setOpenMap((m) => ({ ...m, [copy.id]: true }));
      const next = list.slice();
      next.splice(at + 1, 0, copy);
      commit(next);
      announce(`${noun} ${at + 1} duplicated. The copy is ${noun} ${at + 2}.`);
    },
    [field, commit, announce, noun]
  );
  const onRemove = useCallback(
    (id) => {
      setLeavingId(id);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const list = itemsRef.current;
        const at = list.findIndex((i) => i.id === id);
        setLeavingId(null);
        if (at < 0) return;
        commit(list.filter((i) => i.id !== id));
        announce(`${noun} ${at + 1} removed.`);
      }, LEAVE_MS);
    },
    [commit, announce, noun]
  );

  function add() {
    const item = newListItem(field);
    setFreshIds((f) => new Set(f).add(item.id));
    focusNew.current = item.id;
    setOpenMap((m) => ({ ...m, [item.id]: true }));
    commit([...items, item]);
    announce(`${noun} ${items.length + 1} added.`);
  }

  // move focus into the first control of a freshly added item
  useEffect(() => {
    if (!focusNew.current) return;
    const el = document.querySelector(`[data-item-id="${CSS.escape(focusNew.current)}"] input, [data-item-id="${CSS.escape(focusNew.current)}"] textarea`);
    focusNew.current = null;
    el?.focus({ preventScroll: false });
  }, [items.length]);

  const err = errors[path];
  return (
    <div className="adm-cms-list">
      <div className="adm-cms-list__head">
        <div>
          <h4 className="adm-cms-list__label">{field.label}</h4>
          {field.help ? <p className="adm-field__hint">{field.help}</p> : null}
        </div>
        <span className="adm-cms-list__count">
          {items.length}
          {field.max ? ` / ${field.max}` : ""} {items.length === 1 ? "item" : "items"}
          {field.min ? ` (min ${field.min})` : ""}
        </span>
      </div>
      {err ? <p className="adm-field__error" role="alert">{err}</p> : null}
      {items.length ? (
        <ul className="adm-cms-li__list" aria-label={field.label}>
          {items.map((item, i) => (
            <ListItem
              key={item.id}
              field={field}
              item={item}
              index={i}
              count={items.length}
              path={`${path}.${i}`}
              open={openMap[item.id] ?? initialOpen}
              mark={sortable.dropMark(item.id)}
              dragging={sortable.draggingId === item.id}
              fresh={freshIds.has(item.id)}
              leaving={leavingId === item.id}
              readOnly={readOnly}
              canRemove={!atMin}
              canDuplicate={!atMax}
              handleProps={sortable.handleProps}
              itemProps={sortable.itemProps}
              onToggle={onToggle}
              onMoveBy={onMoveBy}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
            />
          ))}
        </ul>
      ) : (
        <p className="adm-cms-list__empty">No {noun.toLowerCase()} items yet.</p>
      )}
      {readOnly ? null : (
        <button type="button" className="adm-btn adm-btn--secondary adm-btn--sm adm-cms-list__add" onClick={add} disabled={atMax}>
          <Plus size={15} />
          <span className="adm-btn__label">{atMax ? `Maximum of ${field.max} reached` : `Add ${noun.toLowerCase()}`}</span>
        </button>
      )}
      <div className="adm-sr" role="status" aria-live="assertive">{sortable.live}</div>
    </div>
  );
}

export default memo(ListField);
