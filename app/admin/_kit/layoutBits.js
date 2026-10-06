"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Icon from "./Icon";
import { Button, cx } from "./primitives";
import { Input } from "../_ui/components/input";

/** Page title row: heading, optional description, right-aligned actions. */
export function PageHeader({ title, description, actions, meta }) {
  return (
    <div className="adm-pagehead">
      <div className="adm-pagehead__text">
        <h1 className="adm-pagehead__title">{title}</h1>
        {description ? <p className="adm-pagehead__desc">{description}</p> : null}
        {meta ? <div className="adm-pagehead__meta">{meta}</div> : null}
      </div>
      {actions ? <div className="adm-pagehead__actions">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, trend, spark, loading, href, tone }) {
  const body = (
    <>
      <div className="adm-stat__top">
        <span className="adm-stat__label">{label}</span>
        {icon ? <span className={cx("adm-stat__icon", tone && `is-${tone}`)}><Icon name={icon} size={16} /></span> : null}
      </div>
      <div className="adm-stat__value">{loading ? <span className="adm-skel" style={{ width: 64, height: 26 }} aria-hidden="true" /> : value}</div>
      <div className="adm-stat__foot">
        {trend != null ? <span className={cx("adm-stat__trend", trend >= 0 ? "is-up" : "is-down")}>{trend >= 0 ? "+" : ""}{trend}%</span> : null}
        {hint ? <span className="adm-stat__hint">{hint}</span> : null}
        {spark ? <span className="adm-stat__spark">{spark}</span> : null}
      </div>
    </>
  );
  return href ? <Link href={href} className="adm-stat adm-stat--link">{body}</Link> : <div className="adm-stat">{body}</div>;
}

/**
 * URL-synced filter state. `params` are strings (empty = unset). `setParams(patch)` merges, drops empty values and
 * resets `page` unless the patch sets it. Needs a <Suspense> boundary above (the admin layout provides one).
 */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const current = search.toString();
  const params = useMemo(() => Object.fromEntries(new URLSearchParams(current)), [current]);
  const setParams = useCallback(
    (patch) => {
      const next = new URLSearchParams(current);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") next.delete(k);
        else next.set(k, String(v));
      });
      if (!("page" in patch)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [current, pathname, router]
  );
  return [params, setParams];
}

/** Debounced search box; controlled by the URL value but typing stays instant. */
export function SearchInput({ value, onChange, placeholder = "Search", delay = 250, label = "Search" }) {
  const [text, setText] = useState(value || "");
  const [seen, setSeen] = useState(value);
  const timer = useRef(null);
  if (value !== seen) {
    setSeen(value);
    setText(value || "");
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className="adm-search">
      <Icon name="search" size={16} />
      <Input
        type="search"
        className="adm-search__input tw:h-10 tw:w-[330px] tw:max-w-full tw:rounded-xl tw:border-(--adm-line) tw:bg-(--adm-surface-3) tw:px-0 tw:ps-[38px] tw:pe-3 tw:text-sm tw:shadow-none tw:max-sm:w-full tw:focus-visible:bg-(--adm-control-bg)"
        value={text}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => {
          setText(e.target.value);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => onChange(e.target.value.trim()), delay);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            clearTimeout(timer.current);
            onChange(text.trim());
          }
        }}
      />
    </div>
  );
}

/** Row of filter controls with an active count and a Clear button. Children are the controls. */
export function FilterBar({ children, activeCount = 0, onClear }) {
  return (
    <div className="adm-filterbar" role="search">
      <div className="adm-filterbar__controls">{children}</div>
      {activeCount > 0 ? (
        <Button variant="ghost" size="sm" icon="close" onClick={onClear}>Clear ({activeCount})</Button>
      ) : null}
    </div>
  );
}
