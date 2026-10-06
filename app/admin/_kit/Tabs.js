"use client";

import { useId, useLayoutEffect, useRef } from "react";
import { Tabs as TabsRoot, TabsList, TabsTrigger } from "../_ui/components/tabs";
import { cx } from "./primitives";

/**
 * Controlled tabs on the shadcn Tabs (Radix: roving focus, arrow/Home/End keys, aria-selected). tabs: [{ id, label, badge? }].
 * Render panels yourself with <TabPanel>. Keeps the look of the admin: a sliding indicator (underline) or the segmented pill.
 * The indicator is positioned from the active trigger's box through CSS variables (no state, no re-render; transform/width only).
 */
export function Tabs({ tabs, value, onChange, label = "Sections", idPrefix, variant = "underline" }) {
  const auto = useId();
  const prefix = idPrefix || auto;
  const listRef = useRef(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const place = () => {
      const active = list.querySelector('[role="tab"][aria-selected="true"]');
      if (!active) return;
      list.style.setProperty("--ind-x", `${active.offsetLeft}px`);
      list.style.setProperty("--ind-w", `${active.offsetWidth}px`);
      list.dataset.ready = "1";
    };
    place();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
    ro?.observe(list);
    return () => ro?.disconnect();
  }, [value, tabs]);
  return (
    <TabsRoot value={value} onValueChange={onChange} className={cx("tw:gap-0", variant === "segmented" && "tw:items-start")}>
      <TabsList
        variant="line"
        ref={listRef}
        aria-label={label}
        className={cx("adm-tabs tw:h-auto tw:w-auto tw:justify-start", variant === "segmented" ? "adm-tabs--seg tw:gap-0.5 tw:rounded-[14px] tw:bg-(--adm-track) tw:p-1" : "tw:gap-1 tw:rounded-none tw:p-0")}
      >
        <span className="adm-tabs__ind" aria-hidden="true" />
        {tabs.map((t) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            id={`${prefix}-tab-${t.id}`}
            aria-controls={`${prefix}-panel-${t.id}`}
            className={cx("adm-tab tw:flex-none tw:border-0 tw:bg-transparent tw:text-[15px] tw:font-semibold tw:text-(--adm-muted) tw:shadow-none tw:after:hidden tw:hover:text-(--adm-ink) tw:data-[state=active]:bg-transparent tw:data-[state=active]:text-(--adm-ink) tw:data-[state=active]:shadow-none", variant === "segmented" ? "tw:h-[34px] tw:rounded-[10px] tw:px-3.5 tw:text-sm" : "tw:h-10 tw:rounded-none tw:px-3", t.id === value && "is-active")}
          >
            {t.label}
            {t.badge != null ? <span className="adm-tab__badge">{t.badge}</span> : null}
          </TabsTrigger>
        ))}
      </TabsList>
    </TabsRoot>
  );
}

export function TabPanel({ id, value, idPrefix, children }) {
  if (id !== value) return null;
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-tab-${id}`} tabIndex={0} className="adm-tabpanel">
      {children}
    </div>
  );
}
