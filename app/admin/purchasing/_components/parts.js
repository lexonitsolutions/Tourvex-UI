"use client";

import { useState } from "react";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { Field, Icon, StatusBadge } from "../../_kit";
import { Popover, PopoverContent, PopoverTrigger } from "../../_ui/components/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "../../_ui/components/command";
import { STATUS } from "../_lib/purchasing";

/** Status pill of a purchase. `overdue` swaps a received, unpaid purchase to a warning. */
export function PurchaseStatus({ status, overdue = false }) {
  const s = STATUS[status];
  if (!s) return <span className="adm-muted">-</span>;
  if (overdue) return <StatusBadge tone="warning">Overdue</StatusBadge>;
  return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>;
}

/** Inline error block announced to screen readers (same look as the stock screens). */
export function InlineError({ children }) {
  return children ? <p className="pur-error" role="alert">{children}</p> : null;
}

/**
 * Searchable server-side picker (Popover + cmdk list, no client filtering).
 *   path / buildQuery(q): the GET that supplies options ({ items: [...] }),
 *   option(item) -> { id, title, sub? }, onPick(item), footer: node under the list (e.g. "Add supplier").
 */
export function Picker({ label, required, error, hint, valueTitle, valueSub, placeholder = "Choose", searchPlaceholder = "Search", path, buildQuery, option, onPick, disabled, footer, icon = "search", emptyText = "Nothing found." }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const results = useAdminQuery(open ? path : null, buildQuery(q.trim()), { prefetchNext: false });
  const items = results.data?.items || [];
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      {(a11y) => (
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
          <PopoverTrigger asChild>
            <button type="button" className={`pur-picker${valueTitle ? "" : " is-empty"}`} disabled={disabled} aria-haspopup="listbox" aria-expanded={open} {...a11y}>
              <Icon name={icon} size={16} />
              <span className="pur-picker__text">
                <span className="pur-picker__title">{valueTitle || placeholder}</span>
                {valueSub ? <small>{valueSub}</small> : null}
              </span>
              <Icon name="chevronDown" size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="tw:w-[min(420px,92vw)] tw:rounded-2xl tw:p-0">
            <Command shouldFilter={false}>
              <CommandInput value={q} onValueChange={setQ} placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
              <CommandList>
                {results.error ? <p className="pur-picker__note" role="alert">Could not load. {results.error.message} <button type="button" className="adm-link" onClick={results.reload}>Try again</button></p> : null}
                {results.loading && !results.data ? <p className="pur-picker__note" role="status">Loading...</p> : null}
                {results.data && !items.length ? <p className="pur-picker__note">{emptyText}</p> : null}
                {items.length ? (
                  <CommandGroup>
                    {items.map((it) => {
                      const o = option(it);
                      return (
                        <CommandItem key={o.id} value={String(o.id)} onSelect={() => { onPick(it); setOpen(false); setQ(""); }} className="tw:items-start">
                          <span className="pur-opt">
                            <span className="pur-opt__title">{o.title}</span>
                            {o.sub ? <small>{o.sub}</small> : null}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ) : null}
              </CommandList>
              {footer ? <div className="pur-picker__foot">{footer(() => setOpen(false))}</div> : null}
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </Field>
  );
}
