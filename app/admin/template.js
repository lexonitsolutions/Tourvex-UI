"use client";

import { usePathname } from "next/navigation";

// Page-enter transition for the admin content area only (the sidebar and topbar live in the layout and never move).
// Keyed on the pathname so EVERY route change replays it, including /admin/bookings -> /admin/bookings/orders, which
// share a top-level segment and would not remount a plain template. Search-param changes (filters, paging) keep the key,
// so hover/filter re-renders never animate. The animation itself is CSS (.adm-page in _ui/motion.css): children rise
// and fade in a short stagger, `backwards` fill so nothing is left transformed. The first load shows the shell skeleton
// until auth resolves, so there is no flash of unstyled or half-animated content.
export default function AdminTemplate({ children }) {
  const pathname = usePathname();
  return <div key={pathname} className="adm-page">{children}</div>;
}
