"use client";

import { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { ArrowDown, ArrowUp, EyeOff, GripVertical, LayoutPanelTop, Lock, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Switch as UiSwitch } from "../../_ui/components/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../_ui/components/dropdown-menu";
import { cx } from "../../_kit";
import { humanize } from "../../_lib/format";
import { useSortable } from "./sortable";

const RailItem = memo(function RailItem({ section, label, fixed, canDisable, selected, errorCount, index, count, readOnly, mark, dragging, handleProps, itemProps, onSelect, onToggle, onMoveBy, onRemove }) {
  return (
    <li className={cx("adm-cms-rail__item", selected && "is-selected", !section.enabled && "is-off", mark && `is-drop-${mark}`, dragging && "is-dragging", errorCount > 0 && "has-error")} {...itemProps(section.id)}>
      {readOnly ? null : (
        <button type="button" className="adm-cms-grip" aria-label={`Reorder ${label}. Use the arrow keys, or drag.`} title="Drag to reorder (or arrow keys)" {...handleProps(section.id)}>
          <GripVertical size={16} />
        </button>
      )}
      <button type="button" className="adm-cms-rail__main" aria-current={selected ? "true" : undefined} onClick={() => onSelect(section.id)}>
        <span className="adm-cms-rail__num" aria-hidden="true">{index + 1}</span>
        <span className="adm-cms-rail__text">
          <b>{label}</b>
          {!section.enabled ? <small><EyeOff size={11} /> Hidden</small> : fixed ? <small><Lock size={11} /> Required</small> : null}
        </span>
        {errorCount ? <span className="adm-cms-badge is-error" aria-label={`${errorCount} ${errorCount === 1 ? "problem" : "problems"} in ${label}`}>{errorCount}</span> : null}
      </button>
      {canDisable && !readOnly ? (
        <UiSwitch
          checked={section.enabled}
          onCheckedChange={(v) => onToggle(section.id, v)}
          aria-label={`${label} visible on the site`}
          title={section.enabled ? "Visible. Turn off to hide on the site." : "Hidden. Turn on to show on the site."}
          className="tw:h-[20px] tw:w-[34px] tw:shrink-0"
        />
      ) : null}
      {readOnly ? null : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="adm-cms-mini" aria-label={`Actions for ${label}`}><MoreHorizontal size={16} /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="tw:min-w-44">
            <DropdownMenuItem disabled={index === 0} onSelect={() => onMoveBy(section.id, -1)}><ArrowUp size={15} /> Move up</DropdownMenuItem>
            <DropdownMenuItem disabled={index === count - 1} onSelect={() => onMoveBy(section.id, 1)}><ArrowDown size={15} /> Move down</DropdownMenuItem>
            {!fixed ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => onRemove(section.id)}><Trash2 size={15} /> Remove section</DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
});

/**
 * Sections rail of a page document. Drag the grip (or focus it and use the arrow keys, or the item menu) to reorder,
 * flip the switch to hide a section that `canDisable`, add from the schema's `allowed` types, remove non-fixed sections.
 */
function SectionRail({ sections, sectionSchemas, allowed, selectedId, errorCounts, readOnly, onSelect, onToggle, onMove, onAdd, onRemove }) {
  const sectionsRef = useRef(sections);
  useLayoutEffect(() => {
    sectionsRef.current = sections;
  });
  const ids = useMemo(() => sections.map((s) => s.id), [sections]);
  const labelFor = useCallback((type) => sectionSchemas?.[type]?.label || humanize(type), [sectionSchemas]);
  const sortable = useSortable({
    ids,
    labelOf: (id) => {
      const s = sectionsRef.current.find((x) => x.id === id);
      return s ? labelFor(s.type) : "Section";
    },
    onMove,
  });
  const { move } = sortable;
  const onMoveBy = useCallback((id, delta) => move(id, ids.indexOf(id) + delta), [move, ids]);

  return (
    <nav className="adm-cms-rail" aria-label="Sections">
      <div className="adm-cms-rail__head">
        <h2>Sections</h2>
        <span className="adm-cms-rail__count">{sections.length}</span>
      </div>
      {sections.length ? (
        <ul className="adm-cms-rail__list">
          {sections.map((s, i) => (
            <RailItem
              key={s.id}
              section={s}
              label={labelFor(s.type)}
              fixed={!!sectionSchemas?.[s.type]?.fixed}
              canDisable={!!sectionSchemas?.[s.type]?.canDisable}
              selected={s.id === selectedId}
              errorCount={errorCounts?.[s.id] || 0}
              index={i}
              count={sections.length}
              readOnly={readOnly}
              mark={sortable.dropMark(s.id)}
              dragging={sortable.draggingId === s.id}
              handleProps={sortable.handleProps}
              itemProps={sortable.itemProps}
              onSelect={onSelect}
              onToggle={onToggle}
              onMoveBy={onMoveBy}
              onRemove={onRemove}
            />
          ))}
        </ul>
      ) : (
        <p className="adm-cms-list__empty">This page has no sections yet.</p>
      )}
      {!readOnly && allowed?.length ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="adm-btn adm-btn--secondary adm-cms-rail__add"><Plus size={15} /><span className="adm-btn__label">Add section</span></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="tw:max-h-80 tw:w-72 tw:overflow-auto">
            <DropdownMenuLabel>Add a section</DropdownMenuLabel>
            {allowed.map((type) => (
              <DropdownMenuItem key={type} className="tw:items-start" onSelect={() => onAdd(type)}>
                <LayoutPanelTop size={16} className="tw:mt-0.5" />
                <span className="tw:grid">
                  <b className="adm-cms-menu__title">{labelFor(type)}</b>
                  {sectionSchemas?.[type]?.description ? <small className="adm-cms-menu__desc">{sectionSchemas[type].description}</small> : null}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <div className="adm-sr" role="status" aria-live="assertive">{sortable.live}</div>
    </nav>
  );
}

export default memo(SectionRail);
