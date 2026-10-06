// A template (unlike a layout) is re-created on every navigation inside this route group, so the wrapper below
// replays its open animation each time a page is opened. The header, footer and tab bar live in the layout and stay put.
export default function MarketTemplate({ children }) {
  return <div className="mk-page">{children}</div>;
}
