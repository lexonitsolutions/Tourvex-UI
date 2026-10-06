"use client";

import { useState } from "react";
import Icon from "./Icon";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../_ui/components/dropdown-menu";

/**
 * Menu button, backed by the shadcn DropdownMenu (Radix: keyboard navigation, typeahead, collision-aware placement, portal into
 * the themed `.adm-root` host, so table clipping and dark mode need no special handling).
 * items: [{ label, onSelect, href?, icon?, danger?, disabled?, separator?, checked? }].
 * `trigger` receives ({ props, open }) and must render ONE element that accepts a ref (a <button>); `props` is kept for API
 * compatibility (Radix attaches the trigger behaviour itself). `keepOpen` keeps the menu open after a pick (checkbox menus).
 * `portal` is accepted and ignored: menus always portal.
 */
export function Dropdown({ items, trigger, align = "end", label = "Menu", className, keepOpen = false, children }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {trigger ? trigger({ props: {}, open }) : (
          <button type="button" className="adm-iconbtn" aria-label={label}><Icon name="more" /></button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} aria-label={label} className={className ? `tw:min-w-52 ${className}` : "tw:min-w-52"}>
        {children}
        {(items || []).map((item, i) => {
          if (item.separator) return <DropdownMenuSeparator key={`s${i}`} />;
          const icon = item.icon ? <Icon name={item.icon} size={16} /> : null;
          if (item.href) {
            return (
              <DropdownMenuItem key={item.label} asChild>
                <a href={item.href} {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{icon}{item.label}</a>
              </DropdownMenuItem>
            );
          }
          if (item.checked !== undefined) {
            return (
              <DropdownMenuCheckboxItem
                key={item.label}
                checked={!!item.checked}
                disabled={item.disabled}
                onSelect={(e) => {
                  if (keepOpen) e.preventDefault();
                  item.onSelect?.();
                }}
              >
                {item.label}
              </DropdownMenuCheckboxItem>
            );
          }
          return (
            <DropdownMenuItem
              key={item.label}
              variant={item.danger ? "destructive" : "default"}
              disabled={item.disabled}
              onSelect={(e) => {
                if (keepOpen) e.preventDefault();
                item.onSelect?.();
              }}
            >
              {icon}{item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
