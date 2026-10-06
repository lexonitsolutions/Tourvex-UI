// Shown instantly while a dynamic page in this group (listings, details, checkout, bookings) renders on the server.
// The header, footer and tab bar come from the layout's prerendered shell, so only this block is waiting.
export default function MarketLoading() {
  return (
    <div className="mk-container mk-section" aria-busy="true" aria-live="polite">
      <div className="mk-skeleton" style={{ height: 36, width: "min(360px, 60%)", borderRadius: 10 }} />
      <div className="mk-grid mk-grid-4" style={{ marginTop: 24 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="sc-card mk-skeleton" aria-hidden="true" style={{ minHeight: 280 }} />
        ))}
      </div>
    </div>
  );
}
