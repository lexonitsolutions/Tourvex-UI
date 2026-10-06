"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "../_ui/components/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../_ui/components/dialog";
import { useAdminApi, isAbortError } from "../_lib/adminApi";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { useApp } from "../../components/AppProvider";
import { useTheme } from "../_ui/theme/ThemeProvider";
import Icon from "./Icon";

/**
 * Global Ctrl/Cmd+K palette (lazy: cmdk and this file are only fetched the first time the palette opens).
 *  - "Go to": every menu entry the signed-in staff member may open (the API already filters the menu by permission).
 *  - "Quick actions": invite staff, switch theme, view site, sign out.
 *  - Live lookups (debounced 250 ms, previous request aborted): bookings by reference / name / email, leads by email / name,
 *    customers, each only when the member holds the read permission. cmdk's own filter is off; static entries are filtered here.
 */
export default function CommandPalette({ open, onOpenChange }) {
  const router = useRouter();
  const api = useAdminApi();
  const { menu, can } = useAdminMe();
  const { logout } = useApp();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState({ q: "", bookings: [], leads: [], customers: [], loading: false });

  // reset the field each time the palette closes (no effect needed on open)
  const handleOpenChange = (next) => {
    if (!next) {
      setQuery("");
      setFound({ q: "", bookings: [], leads: [], customers: [], loading: false });
    }
    onOpenChange(next);
  };

  const q = query.trim();
  useEffect(() => {
    if (!open || q.length < 2) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setFound((f) => ({ ...f, loading: true }));
      const ask = (permission, path) =>
        can(permission) ? api.get(path, { query: { q, limit: 5 }, signal: controller.signal }).then((r) => r?.items || []).catch((e) => (isAbortError(e) ? null : [])) : Promise.resolve([]);
      const [bookings, leads, customers] = await Promise.all([ask("bookings.read", "/admin/bookings"), ask("enquiries.read", "/admin/leads"), ask("customers.read", "/admin/customers")]);
      if (controller.signal.aborted || bookings === null) return;
      setFound({ q, bookings, leads: leads || [], customers: customers || [], loading: false });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, open, api, can]);

  const go = (href) => {
    handleOpenChange(false);
    router.push(href);
  };

  const pages = useMemo(() => {
    const out = [];
    menu.forEach((m) => {
      out.push({ id: m.href, label: m.label, href: m.href, icon: m.icon || m.id, group: m.group });
      (m.children || []).forEach((c) => out.push({ id: c.href, label: `${m.label}: ${c.label}`, href: c.href, icon: c.icon || m.icon || m.id }));
    });
    return out;
  }, [menu]);

  const actions = useMemo(
    () => [
      ...(can("staff.write") ? [{ id: "invite", label: "Invite a staff member", icon: "staff", run: () => go("/admin/staff?invite=1") }] : []),
      { id: "theme-light", label: "Theme: Light", icon: "dot", run: () => { setTheme("light"); handleOpenChange(false); } },
      { id: "theme-dark", label: "Theme: Dark", icon: "dot", run: () => { setTheme("dark"); handleOpenChange(false); } },
      { id: "theme-system", label: "Theme: Follow system", icon: "dot", run: () => { setTheme("system"); handleOpenChange(false); } },
      { id: "site", label: "View the public site", icon: "globe", run: () => { window.open("/", "_blank", "noopener"); handleOpenChange(false); } },
      { id: "logout", label: "Sign out", icon: "logout", run: () => { handleOpenChange(false); logout(); } },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [can, setTheme, logout]
  );

  const match = (text) => !q || text.toLowerCase().includes(q.toLowerCase());
  const shownPages = pages.filter((p) => match(p.label));
  const shownActions = actions.filter((a) => match(a.label));
  const fresh = found.q === q;
  const hasLive = fresh && (found.bookings.length || found.leads.length || found.customers.length);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="tw:overflow-hidden tw:p-0 tw:sm:max-w-xl tw:top-[22%] tw:translate-y-0">
        <DialogHeader className="tw:sr-only">
          <DialogTitle>Search the admin</DialogTitle>
          <DialogDescription>Jump to a page, run an action, or look up a booking, lead or customer.</DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false} loop className="tw:[&_[cmdk-group-heading]]:px-2 tw:[&_[cmdk-group-heading]]:py-1.5 tw:[&_[cmdk-group-heading]]:text-xs tw:[&_[cmdk-group-heading]]:text-muted-foreground tw:[&_[cmdk-item]]:gap-2.5 tw:[&_[cmdk-item]]:px-2 tw:[&_[cmdk-item]]:py-2.5">
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search pages, bookings by reference, leads by email..." aria-label="Search the admin" />
          <CommandList className="tw:max-h-[min(420px,60vh)]">
            {q.length >= 2 && fresh && !hasLive && !shownPages.length && !shownActions.length ? <CommandEmpty>No results for &quot;{q}&quot;.</CommandEmpty> : null}
            {q.length >= 2 && found.loading && !fresh ? <div className="tw:px-3 tw:py-3 tw:text-sm tw:text-muted-foreground" role="status">Searching...</div> : null}
            {fresh && found.bookings.length ? (
              <CommandGroup heading="Bookings">
                {found.bookings.map((b) => (
                  <CommandItem key={`b${b.id}`} value={`booking-${b.id}`} onSelect={() => go(`/admin/bookings/${b.id}`)}>
                    <Icon name="bookings" size={16} /> <span className="tw:font-medium">{b.reference}</span>
                    <span className="tw:truncate tw:text-muted-foreground">{[b.customerName, b.title].filter(Boolean).join(" · ")}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {fresh && found.leads.length ? (
              <CommandGroup heading="Leads">
                {found.leads.map((l) => (
                  <CommandItem key={`l${l.id}`} value={`lead-${l.id}`} onSelect={() => go(`/admin/leads?lead=${l.id}`)}>
                    <Icon name="leads" size={16} /> <span className="tw:font-medium">{l.name || l.email}</span>
                    <span className="tw:truncate tw:text-muted-foreground">{l.name ? l.email : ""}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {fresh && found.customers.length ? (
              <CommandGroup heading="Customers">
                {found.customers.map((c) => (
                  <CommandItem key={`c${c.id}`} value={`customer-${c.id}`} onSelect={() => go(`/admin/customers/${c.id}`)}>
                    <Icon name="customers" size={16} /> <span className="tw:font-medium">{c.name || c.email}</span>
                    <span className="tw:truncate tw:text-muted-foreground">{c.name ? c.email : ""}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {hasLive && (shownPages.length || shownActions.length) ? <CommandSeparator /> : null}
            {shownPages.length ? (
              <CommandGroup heading="Go to">
                {shownPages.map((p) => (
                  <CommandItem key={`${p.id}|${p.label}`} value={`${p.id}|${p.label}`} onSelect={() => go(p.href)}>
                    <Icon name={p.icon} size={16} /> {p.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {shownActions.length ? (
              <CommandGroup heading="Quick actions">
                {shownActions.map((a) => (
                  <CommandItem key={a.id} value={a.id} onSelect={a.run}>
                    <Icon name={a.icon} size={16} /> {a.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
