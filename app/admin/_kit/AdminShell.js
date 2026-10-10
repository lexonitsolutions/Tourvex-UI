"use client";

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "../../components/AppProvider";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { humanize } from "../_lib/format";
import Icon from "./Icon";
import { Dropdown } from "./Dropdown";
import { Avatar, Button, Skeleton, cx } from "./primitives";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../_ui/components/breadcrumb";
import { DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator } from "../_ui/components/dropdown-menu";
import { TooltipProvider } from "../_ui/components/tooltip";
import { ThemeToggle } from "../_ui/theme/ThemeToggle";
import { useTheme } from "../_ui/theme/ThemeProvider";

// cmdk + the palette are only fetched the first time it opens (Ctrl/Cmd+K, "/", or the topbar search button).
const CommandPalette = lazy(() => import("./CommandPalette"));
const noopSubscribe = () => () => {};

const COLLAPSE_KEY = "adm-sidebar-collapsed";
const COLLAPSE_EVENT = "adm-sidebar-collapse";

// Collapsed-rail preference lives in localStorage; useSyncExternalStore keeps SSR (always expanded) and hydration consistent.
function subscribeCollapsed(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(COLLAPSE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(COLLAPSE_EVENT, callback);
  };
}
// The sidebar is open by default and stays open until the visitor collapses it with the edge arrow ("1").
function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}
// The browser-storage leads page is gone (replaced by the leads CRM); kept as an empty list so a future legacy page can be linked again.
const LEGACY_ITEMS = [];

function isActive(pathname, href) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Groups menu items by an optional `group` field from the API; ungrouped items share one list. */
function groupMenu(menu) {
  const groups = [];
  menu.forEach((item) => {
    const title = item.group || "";
    let g = groups.find((x) => x.title === title);
    if (!g) groups.push((g = { title, items: [] }));
    g.items.push(item);
  });
  return groups;
}

/**
 * A frosted highlight that glides from one sidebar row to the next on hover/focus, like the dock in the site header.
 * It sits inside the scrolling <nav>, so it scrolls with the rows; positions are measured when a row is entered.
 */
function useNavGlow() {
  const nav = useRef(null);
  const [glow, setGlow] = useState({ x: 0, y: 0, w: 0, h: 0, visible: false, snap: true });

  const point = useCallback((e) => {
    const row = e.target.closest?.(".adm-nav__link, .adm-nav__sublink");
    const box = nav.current;
    if (!row || !box || !box.contains(row)) return;
    const b = box.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    setGlow((prev) => ({
      x: r.left - b.left + box.scrollLeft,
      y: r.top - b.top + box.scrollTop,
      w: r.width,
      h: r.height,
      visible: true,
      snap: !prev.visible,
    }));
  }, []);
  const hide = useCallback(() => setGlow((prev) => (prev.visible ? { ...prev, visible: false, snap: false } : prev)), []);

  const props = { ref: nav, onMouseOver: point, onFocus: point, onMouseLeave: hide, onBlur: hide, onScroll: hide };
  const element = (
    <span
      className={cx("adm-nav__glow", glow.snap && "is-snap", glow.visible && "is-visible")}
      aria-hidden="true"
      style={{ transform: `translate3d(${glow.x}px, ${glow.y}px, 0)`, width: glow.w, height: glow.h }}
    />
  );
  return { props, element, hide };
}

function NavItem({ item, pathname, collapsed, onNavigate, onToggle }) {
  const active = isActive(pathname, item.href);
  const children = item.children || [];
  const hasChildren = children.length > 0;
  const inSection = active || children.some((c) => isActive(pathname, c.href));
  // null = follow the route (open while inside the section); true/false = the visitor toggled it by hand.
  const [manual, setManual] = useState(null);
  const open = hasChildren && (manual ?? inSection);
  const subId = `adm-sub-${item.id || item.href.replace(/\W+/g, "-")}`;
  // Only the most specific child highlights ("All bookings" must not stay lit on /admin/bookings/orders).
  const bestChild = children.filter((c) => isActive(pathname, c.href)).sort((x, y) => y.href.length - x.href.length)[0];
  return (
    <li className={cx("adm-nav__item", hasChildren && "has-sub", open && "is-open")}>
      <Link
        href={item.href}
        className={cx("adm-nav__link", inSection && "is-active")}
        aria-current={pathname === item.href ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        onClick={(e) => {
          // Clicking anywhere on a parent row toggles its dropdown (not just the chevron). A closed menu opens and the
          // page navigates; an open one just folds away. In the icon rail there is no dropdown, so it simply navigates.
          if (hasChildren && !collapsed) {
            if (open) {
              e.preventDefault();
              setManual(false);
              onToggle?.();
              return;
            }
            setManual(true);
          }
          onToggle?.();
          onNavigate?.();
        }}
      >
        <Icon name={item.icon || item.id} size={18} />
        <span className="adm-nav__label">{item.label}</span>
      </Link>
      {hasChildren ? (
        <button
          type="button"
          className="adm-nav__toggle"
          aria-expanded={open}
          aria-controls={subId}
          aria-label={`${open ? "Collapse" : "Expand"} ${item.label} menu`}
          onClick={() => {
            setManual(!open);
            onToggle?.();
          }}
          tabIndex={-1}
        >
          <Icon name="chevronDown" size={16} />
        </button>
      ) : null}
      {hasChildren ? (
        <div className="adm-nav__subwrap" id={subId} inert={!open}>
          <ul className="adm-nav__sub">
            {children.map((c, i) => (
              <li key={c.id || c.href} style={{ "--i": i }}>
                <Link href={c.href} className={cx("adm-nav__sublink", bestChild === c && "is-active")} aria-current={pathname === c.href ? "page" : undefined} onClick={onNavigate}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

function Breadcrumbs({ pathname, menu }) {
  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean).slice(1);
    const flat = [...menu, ...menu.flatMap((m) => m.children || []), ...LEGACY_ITEMS];
    return parts.map((part, i) => {
      const href = `/admin/${parts.slice(0, i + 1).join("/")}`;
      const hit = flat.find((m) => m.href === href);
      const text = decodeURIComponent(part);
      // Record ids (24-char hex) and stock item ids (type:ref:variant) are not readable; show a generic label instead.
      const label = hit?.label || (/^[0-9a-f]{24}$/i.test(text) ? "Details" : text.includes(":") ? "Item" : humanize(text));
      return { href, label };
    });
  }, [pathname, menu]);
  return (
    <Breadcrumb className="adm-crumbs">
      <BreadcrumbList className="tw:flex-nowrap tw:gap-1.5 tw:text-sm tw:whitespace-nowrap tw:sm:gap-1.5">
        <BreadcrumbItem>
          {crumbs.length ? <BreadcrumbLink asChild><Link href="/admin">Admin</Link></BreadcrumbLink> : <BreadcrumbPage>Dashboard</BreadcrumbPage>}
        </BreadcrumbItem>
        {crumbs.map((c, i) => (
          <span key={c.href} className="tw:contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? <BreadcrumbPage className="tw:font-semibold">{c.label}</BreadcrumbPage> : <BreadcrumbLink asChild><Link href={c.href}>{c.label}</Link></BreadcrumbLink>}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** System / Light / Dark radio group inside the profile menu (the topbar sun/moon button opens the same choices). */
function ProfileThemeItems() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <DropdownMenuLabel className="tw:text-xs tw:font-medium tw:text-muted-foreground">Theme</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
        <DropdownMenuRadioItem value="system" onSelect={(e) => e.preventDefault()}>System</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="light" onSelect={(e) => e.preventDefault()}>Light</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="dark" onSelect={(e) => e.preventDefault()}>Dark</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
}

function ScreenMessage({ icon = "lock", title, children, actions }) {
  return (
    <div className="adm-root adm-screen">
      <div className="adm-screen__card" role="alert">
        <span className="adm-screen__icon"><Icon name={icon} size={24} /></span>
        <h1 className="adm-screen__title">{title}</h1>
        <div className="adm-screen__text">{children}</div>
        <div className="adm-screen__actions">{actions}</div>
      </div>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="adm-root adm-skelshell" aria-busy="true" aria-label="Loading admin">
      <div className="adm-skelshell__side">
        <Skeleton width={120} height={20} className="tw:bg-white/15" />
        {Array.from({ length: 7 }, (_, i) => <Skeleton key={i} height={14} className="tw:bg-white/15" style={{ width: `${55 + ((i * 11) % 35)}%` }} />)}
      </div>
      <div className="adm-skelshell__main">
        <Skeleton width="30%" height={28} />
        <Skeleton height={110} />
        <Skeleton height={220} />
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const navGlow = useNavGlow();
  const { user, ready, logout } = useApp();
  const { status, menu, user: meUser, error, reload } = useAdminMe();
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  // false on the server and during hydration, true afterwards: the first client render is always the same skeleton the server sent,
  // whatever Clerk reports synchronously (this removes the adm-skelshell hydration mismatch).
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMounted, setPaletteMounted] = useState(false);
  const openPalette = () => {
    setPaletteMounted(true);
    setPaletteOpen(true);
  };
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteMounted(true);
        setPaletteOpen((o) => !o);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setPaletteMounted(true);
        setPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  // The off-canvas menu is bound to the path it was opened on, so navigating closes it without an effect.
  const [openedAt, setOpenedAt] = useState(null);
  const mobileOpen = openedAt === pathname;
  const setMobileOpen = (open) => setOpenedAt(open ? pathname : null);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpenedAt(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);
  useEffect(() => {
    if (status === "signed-out") {
      const back = `${window.location.pathname}${window.location.search}`;
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(back)}`);
    }
  }, [status, router]);

  function toggleCollapsed() {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "0" : "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  }

  const groups = useMemo(() => groupMenu(menu), [menu]);

  if (!hydrated || !ready || status === "loading" || status === "signed-out") return <ShellSkeleton />;

  if (status === "forbidden") {
    return (
      <ScreenMessage
        title="No admin access"
        actions={
          <>
            <Link href="/" className="adm-btn adm-btn--secondary"><span className="adm-btn__label">Back to site</span></Link>
            <Button variant="primary" icon="logout" onClick={logout}>Sign out</Button>
          </>
        }
      >
        <p>{user?.email ? <><b>{user.email}</b> is signed in, but </> : "This account "}is not an active staff account. Ask a super admin to invite you from Staff, then sign in again.</p>
      </ScreenMessage>
    );
  }
  if (status === "error") {
    return (
      <ScreenMessage
        icon="alert"
        title="Could not load the admin"
        actions={<Button variant="primary" icon="refresh" onClick={reload}>Try again</Button>}
      >
        <p>{error?.message || "Unexpected error."}</p>
      </ScreenMessage>
    );
  }

  const displayName = meUser?.name || user?.firstName || meUser?.email || "Staff";

  return (
    <TooltipProvider delayDuration={200}>
    <div className={cx("adm-root adm-shell", collapsed && "is-collapsed", mobileOpen && "is-mobile-open")}>
      <a href="#adm-main" className="adm-skip">Skip to content</a>
      <aside className="adm-side" aria-label="Admin">
        <div className="adm-side__brand">
          <Link href="/admin" className="adm-side__logo" onClick={() => setMobileOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/karnish-logo.png" alt="" width="28" height="28" />
            <span className="adm-side__name">
              <b>Karnish Tourism</b>
              <small>Admin</small>
            </span>
          </Link>
          <button type="button" className="adm-iconbtn adm-iconbtn--dark adm-side__close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>
        <nav className="adm-nav" aria-label="Main" {...navGlow.props}>
          {navGlow.element}
          {groups.map((g) => (
            <div key={g.title || "main"} className="adm-nav__group">
              {g.title ? <p className="adm-nav__title">{g.title}</p> : null}
              <ul>
                {g.items.map((item) => (
                  <NavItem key={item.id || item.href} item={item} pathname={pathname} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} onToggle={navGlow.hide} />
                ))}
              </ul>
            </div>
          ))}
          {LEGACY_ITEMS.length ? (
            <div className="adm-nav__group">
              <p className="adm-nav__title">Legacy</p>
              <ul>
                {LEGACY_ITEMS.map((item) => (
                  <NavItem key={item.id} item={item} pathname={pathname} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} onToggle={navGlow.hide} />
                ))}
              </ul>
            </div>
          ) : null}
        </nav>
        <div className="adm-side__foot">
          <a className="adm-nav__link" href="/" target="_blank" rel="noopener noreferrer" title={collapsed ? "View site" : undefined}>
            <Icon name="globe" size={18} />
            <span className="adm-nav__label">View site</span>
          </a>
        </div>
      </aside>
      <button
        type="button"
        className="adm-edge"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Icon name="chevronLeft" size={16} />
      </button>
      <div className="adm-scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />

      <div className="adm-body">
        <header className="adm-top">
          <button type="button" className="adm-iconbtn adm-top__burger" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen}>
            <Icon name="menu" />
          </button>
          <Breadcrumbs pathname={pathname} menu={menu} />
          <div className="adm-top__spacer" />
          <button type="button" className="adm-top__search" onClick={openPalette} aria-label="Search the admin (Ctrl K)" aria-haspopup="dialog">
            <Icon name="search" size={15} />
            <span>Search</span>
            <kbd>Ctrl K</kbd>
          </button>
          <button type="button" className="adm-iconbtn adm-top__searchicon" onClick={openPalette} aria-label="Search the admin"><Icon name="search" /></button>
          <Dropdown
            label="Quick create"
            trigger={({ props }) => (
              <button type="button" className="adm-btn adm-btn--primary adm-btn--sm" {...props}>
                <Icon name="plus" size={15} /><span className="adm-btn__label adm-hide-sm">Create</span>
              </button>
            )}
            items={[
              { label: "Invite staff member", icon: "staff", href: "/admin/staff?invite=1" },
              { label: "Booking (coming soon)", icon: "bookings", disabled: true, onSelect: () => {} },
              { label: "Enquiry (coming soon)", icon: "enquiries", disabled: true, onSelect: () => {} },
            ]}
          />
          <ThemeToggle className="adm-themebtn tw:max-[900px]:hidden" />
          <Dropdown
            label="Notifications"
            trigger={({ props }) => (
              <button type="button" className="adm-iconbtn" aria-label="Notifications" {...props}><Icon name="bell" /></button>
            )}
          >
            <div className="adm-dd__note">You are all caught up. Alerts will appear here.</div>
          </Dropdown>
          <Dropdown
            label="Account"
            items={[
              { label: "View site", icon: "globe", href: "/", external: true },
              { label: "Sign out", icon: "logout", onSelect: logout },
            ]}
            trigger={({ props }) => (
              <button type="button" className="adm-profile" {...props}>
                <Avatar name={displayName} src={user?.imageUrl} size={30} />
                <span className="adm-profile__text adm-hide-sm">
                  <b>{displayName}</b>
                  <small>{(meUser?.roles || []).map(humanize).join(", ")}</small>
                </span>
                <Icon name="chevronDown" size={14} />
              </button>
            )}
          >
            <div className="adm-dd__head">
              <b>{displayName}</b>
              <small>{meUser?.email}</small>
            </div>
            <DropdownMenuSeparator />
            <ProfileThemeItems />
            <DropdownMenuSeparator />
          </Dropdown>
        </header>
        <main id="adm-main" className="adm-main" tabIndex={-1}>
          <Suspense fallback={null}>{children}</Suspense>
        </main>
        {paletteMounted ? (
          <Suspense fallback={null}>
            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
          </Suspense>
        ) : null}
      </div>
    </div>
    </TooltipProvider>
  );
}
