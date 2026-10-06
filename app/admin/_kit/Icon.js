// Small inline SVG icon set (24px grid, stroke icons). Menu items from /admin/me reference these keys.
const PATHS = {
  reports: "M5 20V10m5 10V4m5 16v-8m5 8H3",
  trendUp: "M3 17l6-6 4 4 8-8m0 0h-5m5 0v5",
  trendDown: "M3 7l6 6 4-4 8 8m0 0h-5m5 0v-5",
  arrowUp: "M12 19V5m-6 6 6-6 6 6",
  arrowDown: "M12 5v14m-6-6 6 6 6-6",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm-2.500-12a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700m0 3h.01",
  wallet: "M4 7h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7zm0 0 2-3h11v3m3 6h-3",
  dashboard: "M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6v-9h-6v9zm0-16v5h6V4h-6z",
  bookings: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm4 9 2 2 4-4",
  enquiries: "M4 5h16v11H9l-5 4V5z",
  tickets: "M4 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h16v-2a2 2 0 0 1 0-4v0a2 2 0 0 0 0-4V6H4v2zm8-2v12",
  vouchers: "M4 7h16v10H4V7zm4 0v10m8-10v10M12 10v4",
  customers: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-6 8a6 6 0 0 1 12 0M16 11a2.5 2.5 0 1 0 0-5M17 14a5 5 0 0 1 4 5",
  partners: "M3 12l4-4 4 3 3-3 7 5M3 12v5l4 3 3-2 3 2 4-3 4-3v-1",
  catalog: "M12 3l9 5-9 5-9-5 9-5zm-9 9 9 5 9-5M3 16l9 5 9-5",
  blog: "M5 4h10l4 4v12H5V4zm9 0v5h5M8 13h8M8 17h6",
  promos: "M20 12l-8 8-8-8V4h8l8 8zM8.5 8.5h.01",
  reviews: "M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9L12 3z",
  finance: "M3 17l5-5 4 4 8-8M15 8h5v5",
  invoices: "M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6M9 12h6",
  integrations: "M9 3v5M15 3v5M7 8h10v4a5 5 0 0 1-10 0V8zm5 9v4",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.3l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-2.2-1.3L14.4 3h-4l-.4 2.4A7.5 7.5 0 0 0 7.8 6.7l-2.3-.9-2 3.4 2 1.5a7.400 7.400 0 0 0 0 2.600l-2 1.500 2 3.400 2.300-.9c.7.600 1.400 1 2.200 1.300l.4 2.400h4l.4-2.400c.8-.3 1.500-.7 2.200-1.300l2.300.9 2-3.400-2-1.500c.1-.4.100-.9.100-1.300z",
  users: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-6 8a6 6 0 0 1 12 0M16 11a2.5 2.5 0 1 0 0-5M17 14a5 5 0 0 1 4 5",
  shield: "M12 3l8 3v6c0 4.500-3.400 8-8 9-4.600-1-8-4.500-8-9V6l8-3zm-3 9 2 2 4-4",
  staff: "M12 3l8 3v6c0 4.500-3.400 8-8 9-4.600-1-8-4.500-8-9V6l8-3zm-3 9 2 2 4-4",
  audit: "M5 4h14v16H5V4zm3 4h8M8 12h8M8 16h5",
  leads: "M4 6h16M4 12h16M4 18h10",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 3-4.500-4.500",
  bell: "M6 17V11a6 6 0 1 1 12 0v6l2 2H4l2-2zm4 4h4",
  plus: "M12 5v14M5 12h14",
  chevronDown: "M6 9l6 6 6-6",
  chevronRight: "M9 6l6 6-6 6",
  chevronLeft: "M15 6l-6 6 6 6",
  chevronUp: "M6 15l6-6 6 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
  check: "M5 12.500l4.500 4.500L19 7.500",
  copy: "M9 9h10v11H9V9zM5 15V4h10",
  download: "M12 4v11m-5-4 5 5 5-5M5 20h14",
  external: "M14 4h6v6m0-6-9 9M18 14v5H5V6h5",
  logout: "M10 4H5v16h5M15 8l4 4-4 4M19 12H9",
  sidebar: "M4 5h16v14H4V5zm5 0v14",
  filter: "M4 5h16l-6 8v6l-4-2v-4L4 5z",
  columns: "M4 5h16v14H4V5zm5 0v14m6-14v14",
  sortAsc: "M12 19V6m-5 5 5-5 5 5",
  sortDesc: "M12 5v13m-5-5 5 5 5-5",
  sort: "M8 9l4-4 4 4M8 15l4 4 4-4",
  alert: "M12 4l9 16H3L12 4zm0 6v4m0 3h.01",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-11v6m0-9h.01",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  refresh: "M20 11a8 8 0 0 0-14.500-3.500L4 9m0-5v5h5M4 13a8 8 0 0 0 14.500 3.500L20 15m0 5v-5h-5",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.500 2.500 3.500 5.500 3.500 9S14.500 18.500 12 21c-2.500-2.500-3.500-5.500-3.500-9S9.500 5.500 12 3z",
  inbox: "M4 13l2-8h12l2 8v6H4v-6zm0 0h5l1 2h4l1-2h5",
  calendar: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  dot: "M12 12h.01",
  trash: "M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4",
  scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16",
  flash: "M13 3 5 14h6l-1 7 8-11h-6l1-7z",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6M9 12h6",
  dotsV: "M12 5h.01M12 12h.01M12 19h.01",
  sliders: "M4 7h16M4 17h16M9 4v6M15 14v6",
  checkCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm-3.500-9 2.500 2.500 4.500-5",
  xCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm-3-12 6 6m0-6-6 6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-14v5l3 2",
  undo: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  mail: "M4 6h16v12H4V6zm0 1 8 6 8-6",
  ban: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.600 5.600l12.800 12.800",
  eye: "M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  rows: "M4 5h16v4H4V5zm0 10h16v4H4v-4z",
  arrowUpRight: "M7 17 17 7M8 7h9v9",
  arrowDownRight: "M7 7l10 10M17 8v9H8",
};

export default function Icon({ name, size = 18, className = "", strokeWidth = 1.75, ...rest }) {
  const d = PATHS[name] || PATHS.dot;
  return (
    <svg
      className={`adm-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

export const ICON_KEYS = Object.keys(PATHS);
