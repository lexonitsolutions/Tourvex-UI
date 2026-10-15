"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBookingApi, errorMessage, getAvailability, getQuote, isUnavailableError, itemKey } from "../../lib/booking";
import { aboutText, formatDay, formatStamp, money, paxLabel, plural, priceInfo, TRANSFER_LABEL } from "../../lib/actFormat";
import { loginUrlFor } from "../../lib/wishlistAuth";
import { useApp } from "../AppProvider";
import { useMotion } from "../MotionShell";
import { formatStockDate } from "../StockBadge";
import ActivityCalendar from "./ActivityCalendar";
import { IconCalendar, IconCart, IconChevron, IconUsers, IconX, useMedia, usePopover } from "./ActivityParts";

const NARROW = "(max-width: 960px)";

function Counter({ label, hint, value, min, max, onChange, capped }) {
  return (
    <div className="act-counter">
      <div>
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </div>
      <div className="act-counter-ctl">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>-</button>
        <output aria-live="polite" aria-label={`${label}: ${value}`}>{value}</output>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} title={capped && value >= max ? "No more tickets left for this date" : undefined} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

function QuoteDetails({ quote }) {
  const rows = quote.lines || [];
  const discount = quote.discount?.amount > 0;
  return (
    <dl className="act-qd">
      {rows.map((l, i) => (
        <div key={i}><dt>{l.label}{l.qty > 1 ? "" : ""}</dt><dd>{money(l.total)}</dd></div>
      ))}
      <div><dt>Subtotal</dt><dd>{money(quote.subtotal)}</dd></div>
      {discount && <div><dt>Discount</dt><dd>-{money(quote.discount)}</dd></div>}
      <div><dt>Taxes &amp; fees</dt><dd>{money(quote.taxesAndFees)}</dd></div>
      <div className="is-total"><dt>Total payable</dt><dd>{money(quote.total)}</dd></div>
    </dl>
  );
}

function OptionResult({ row, date, modifying, busy, added, onProceed, onAdd, onSave, allowAddToCart }) {
  const { option, quote, error } = row;
  const [open, setOpen] = useState(false);
  const about = quote ? aboutText({ currency: quote.currency, display: quote.display }) : "";
  const until = quote?.freeCancellationUntil ? formatStamp(quote.freeCancellationUntil) : "";
  return (
    <li className={`act-opt${quote ? "" : " is-off"}`}>
      <h4>{option.name}</h4>
      <ul className="act-opt-tags">
        {option.transferType && <li>{TRANSFER_LABEL[option.transferType] || option.transferType}</li>}
        {option.startTime && <li>Starts {option.startTime}</li>}
        {option.durationLabel && <li>{option.durationLabel}</li>}
      </ul>
      <p className="act-opt-date"><IconCalendar width="16" height="16" />{formatDay(date)}</p>
      {quote ? (
        <>
          <p className="act-opt-price">
            <strong>{money(quote.total)}</strong>
            <span>total payable{about ? `, ${about}` : ""}</span>
          </p>
          <button type="button" className="act-opt-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            Price details <IconChevron dir={open ? "down" : "right"} width="14" height="14" />
          </button>
          {open && <QuoteDetails quote={quote} />}
          <p className="act-opt-cancel">
            {quote.refundable ? (until ? `Free cancellation until ${until} (UAE time)` : "Refundable") : "Non-refundable"}
          </p>
          <div className="act-opt-actions">
            {modifying ? (
              <button type="button" className="mk-btn act-grow" disabled={!!busy} onClick={() => onSave(option.id)}>
                {busy === `${option.id}:save` ? "Saving..." : "Save changes"}
              </button>
            ) : (
              <>
                <button type="button" className="mk-btn act-grow" disabled={!!busy} onClick={() => onProceed(option.id)}>
                  {busy === `${option.id}:pay` ? "One moment..." : "Proceed to Pay"}
                </button>
                {allowAddToCart && <button type="button" className="act-iconbtn" aria-label={`Add ${option.name} to cart`} title="Add to cart" disabled={!!busy} onClick={() => onAdd(option.id)}>
                  <IconCart width="20" height="20" />
                </button>}
              </>
            )}
          </div>
          {added === option.id && (
            <p className="act-opt-added" role="status">Added to your cart. <Link href="/checkout">View cart</Link></p>
          )}
        </>
      ) : (
        <p className="act-opt-unavail">{error || "Not available for these details."}</p>
      )}
    </li>
  );
}

export default function ActivityBooking({ activity, initial, sheetOpen, onSheetClose, extra, productType = "activity" }) {
  const router = useRouter();
  const { user, ready, getAccessToken, currency } = useApp();
  const { setScrollLocked } = useMotion();
  const narrow = useMedia(NARROW);
  const options = activity.options;
  const slug = activity.slug;
  const maxTotal = Math.max(1, ...options.map((o) => o.maxPax || 1));
  const allowChildren = options.some((o) => o.childPrice);
  const childHint = options.find((o) => o.childAgeRange)?.childAgeRange;
  const price = priceInfo(activity);

  const [adults, setAdults] = useState(() => Math.min(Math.max(initial.adults || 2, 1), maxTotal));
  const [children, setChildren] = useState(() => (allowChildren ? Math.min(initial.children || 0, Math.max(maxTotal - 1, 0)) : 0));
  const [date, setDate] = useState(initial.date || "");
  const [pop, setPop] = useState(null);
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState("");
  const [added, setAdded] = useState("");
  const [error, setError] = useState(null);
  const [modify, setModify] = useState(initial.modify ? { status: "loading" } : null);
  // Optional stock info (docs/STOCK_API.md): sold out locks the panel until the visitor jumps to the next available date.
  const stock = activity.stock || null;
  const [unlocked, setUnlocked] = useState(false);
  const locked = !!stock?.soldOut && !unlocked;
  const nextDate = stock?.soldOut ? formatStockDate(stock.nextAvailableDate) : "";
  // Tickets left on the chosen date (lowest-capacity view across options): null = no limit known.
  const [left, setLeft] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const cacheRef = useRef(new Map());
  const travRef = useRef(null);
  const dateRef = useRef(null);
  const api = useMemo(() => createBookingApi(getAccessToken), [getAccessToken]);

  // Remaining tickets for the chosen date. Reads the same availability the calendar uses (shared cache).
  useEffect(() => {
    if (!date) return undefined;
    let live = true;
    const month = date.slice(0, 7);
    Promise.all(
      options.map((o) => {
        const ck = `${o.id}|${month}|${currency}`;
        const hit = cacheRef.current.get(ck);
        if (hit) return hit;
        return getAvailability(slug, o.id, month, { currency }).then((res) => {
          cacheRef.current.set(ck, res);
          return res;
        });
      })
    )
      .then((list) => {
        if (!live) return;
        let found = false;
        let best = 0;
        let unlimited = false;
        list.forEach((res) => {
          const d = (res?.days || []).find((x) => x.date === date);
          if (!d) return;
          found = true;
          if (d.status === "available") {
            if (typeof d.remaining === "number") best = Math.max(best, d.remaining);
            else unlimited = true;
          }
        });
        setLeft({ date, value: found && !unlimited ? best : null });
      })
      .catch(() => live && setLeft(null));
    return () => {
      live = false;
    };
  }, [date, currency, options, slug, refreshKey]);

  const closePop = useCallback(() => setPop(null), [setPop]);
  const travPanel = usePopover(pop === "travellers", closePop, travRef);
  const datePanel = usePopover(pop === "date", closePop, dateRef);

  const reset = () => {
    setResults(null);
    setAdded("");
    setError(null);
  };

  const run = useCallback(
    async (d, a, c) => {
      setResults({ status: "loading" });
      setError(null);
      setAdded("");
      const settled = await Promise.allSettled(options.map((o) => getQuote(slug, { optionId: o.id, date: d, adults: a, children: c }, { currency })));
      setResults({
        status: "done",
        date: d,
        adults: a,
        children: c,
        rows: options.map((option, i) => {
          const r = settled[i];
          return r.status === "fulfilled" ? { option, quote: r.value } : { option, error: errorMessage(r.reason) };
        }),
      });
    },
    [options, slug, currency]
  );

  // Back from sign-in (or a shared link) with a date in the URL: show the options straight away.
  useEffect(() => {
    if (!initial.date || initial.modify) return undefined;
    const id = setTimeout(() => run(initial.date, Math.min(Math.max(initial.adults || 2, 1), maxTotal), allowChildren ? initial.children || 0 : 0), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modify: load the cart line and prefill it.
  useEffect(() => {
    if (!initial.modify || !ready) return undefined;
    let live = true;
    (async () => {
      if (!user) {
        setModify({ status: "signin" });
        return;
      }
      try {
        const cart = await api.getCart();
        const item = cart.items.find((i) => String(itemKey(i)) === String(initial.modify));
        if (!live) return;
        if (!item || item.activity?.slug !== slug) {
          setModify({ status: "missing" });
          return;
        }
        setModify({ status: "ready" });
        setAdults(item.adults);
        setChildren(item.children || 0);
        setDate(item.date);
        run(item.date, item.adults, item.children || 0);
      } catch (e) {
        if (live) setModify({ status: "error", message: errorMessage(e) });
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, initial.modify, slug]);

  // Phone sheet: Escape closes, the page behind does not scroll.
  useEffect(() => {
    if (!narrow || !sheetOpen) return undefined;
    setScrollLocked(true);
    const onKey = (e) => e.key === "Escape" && onSheetClose();
    document.addEventListener("keydown", onKey);
    return () => {
      setScrollLocked(false);
      document.removeEventListener("keydown", onKey);
    };
  }, [narrow, sheetOpen, onSheetClose, setScrollLocked]);

  const modifying = modify?.status === "ready";
  const body = (optionId) => ({ activitySlug: slug, productType, ...(productType !== "activity" ? { productSlug: slug } : {}), optionId, date: results.date, adults: results.adults, children: results.children });
  const returnPath = (optionId) => {
    const q = new URLSearchParams({ date: results.date, adults: String(results.adults), children: String(results.children), option: optionId });
    return `/activities/${slug}?${q}`;
  };

  const guard = (optionId) => {
    if (!ready) return true;
    if (!user) {
      router.push(loginUrlFor(returnPath(optionId)));
      return true;
    }
    return false;
  };

  const cap = left && left.date === date ? left.value : null;
  const totalPax = adults + children;
  const overCap = cap != null && totalPax > cap;
  const stockMessage = cap == null ? "" : cap <= 0 ? "This date is sold out. Please choose another date." : overCap ? `Only ${cap} ticket${cap === 1 ? "" : "s"} left for this date. Please reduce your travellers.` : `Only ${cap} ticket${cap === 1 ? "" : "s"} left for this date.`;
  const paxMax = Math.min(maxTotal, cap != null && cap > 0 ? cap : maxTotal);

  const act = async (optionId, kind, fn) => {
    if (guard(optionId)) return;
    setBusy(`${optionId}:${kind}`);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError({ message: errorMessage(e), code: e.code });
      if (isUnavailableError(e)) {
        // Someone else took the last tickets: drop the stale answers, refetch availability and let the visitor pick again.
        cacheRef.current.clear();
        setResults(null);
        setLeft(null);
        setRefreshKey((k) => k + 1);
        setPop("date");
      }
    } finally {
      setBusy("");
    }
  };

  const onProceed = (id) => act(id, "pay", async () => { await api.addItem({ ...body(id), bookingOnly: true }); router.push("/checkout"); });
  const onAdd = (id) => act(id, "add", async () => { await api.addItem(body(id)); setAdded(id); });
  const onSave = (id) => act(id, "save", async () => { await api.updateItem(initial.modify, body(id)); router.push("/checkout"); });

  const check = () => {
    if (!date) {
      setPop("date");
      return;
    }
    if (overCap || (cap != null && cap <= 0)) return;
    run(date, adults, children);
  };

  const jumpToNext = () => {
    const iso = stock.nextAvailableDate;
    setUnlocked(true);
    setDate(iso);
    reset();
    run(iso, adults, children);
  };

  const hidden = narrow && !sheetOpen;
  return (
    <>
      {narrow && sheetOpen && <button type="button" className="act-scrim" aria-label="Close booking panel" tabIndex={-1} onClick={onSheetClose} />}
      <aside
        className={`act-aside${sheetOpen ? " is-open" : ""}${pop ? " has-open-pop" : ""}`}
        aria-label="Book this activity"
        inert={hidden || undefined}
        role={narrow ? "dialog" : undefined}
        aria-modal={narrow && sheetOpen ? true : undefined}
        data-lenis-prevent
      >
        <div className="act-book">
          <div className="act-sheet-head">
            <span className="act-grab" aria-hidden="true" />
            <h2>Book this activity</h2>
            <button type="button" className="act-sheet-close" aria-label="Close" onClick={onSheetClose}><IconX width="20" height="20" /></button>
          </div>

          {modify && (
            <p className={`act-banner${modify.status === "ready" ? "" : " is-warn"}`} role="status">
              {modify.status === "loading" && "Loading your cart item..."}
              {modify.status === "ready" && "You are changing an item in your cart. Pick new details, then save."}
              {modify.status === "signin" && <>Sign in to change this cart item. <Link href={loginUrlFor(`/activities/${slug}?modify=${initial.modify}`)}>Sign in</Link></>}
              {modify.status === "missing" && "That cart item is no longer in your cart. You can still book again below."}
              {modify.status === "error" && modify.message}
            </p>
          )}

          {stock?.soldOut && (
            <div className="stk-note is-sold" role="status" aria-live="polite">
              <strong>Sold out</strong>
              {unlocked ? (
                <p>These tickets are sold out right now, but you can try the next available date.</p>
              ) : nextDate ? (
                <p>All tickets are taken for now. Next available: {nextDate}.</p>
              ) : (
                <p>All tickets are taken for now. Please check back soon, or see similar experiences you may like.</p>
              )}
              {!unlocked && (
                <div className="stk-actions">
                  {stock.nextAvailableDate && nextDate && <button type="button" className="stk-link" onClick={jumpToNext}>Go to {nextDate}</button>}
                  <Link className="stk-link is-ghost" href={activity.destinations?.[0] ? `/activities?destination=${encodeURIComponent(activity.destinations[0])}` : "/activities"}>See similar experiences</Link>
                </div>
              )}
            </div>
          )}

          {price && (
            <div className="act-price">
              <small>From</small>
              <strong>{money(price.current)}</strong>
              {price.was && <s>{money(price.was)}</s>}
              {price.save > 0 && <span className="act-save">Save {price.save}%</span>}
              <span className="act-per">per adult</span>
            </div>
          )}

          <fieldset className="act-lock" disabled={locked}>
          <div className="act-field">
            <label id="act-trav-l">Travellers</label>
            <button ref={travRef} type="button" className="act-trigger" aria-labelledby="act-trav-l" aria-haspopup="dialog" aria-expanded={pop === "travellers"} onClick={() => setPop(pop === "travellers" ? null : "travellers")}>
              <IconUsers width="20" height="20" />
              <span>{paxLabel(adults, children)}</span>
              <IconChevron dir="down" width="16" height="16" />
            </button>
            {pop === "travellers" && (
              <>
                {narrow && <span className="act-pop-scrim" aria-hidden="true" />}
                <div className="act-pop" role="dialog" aria-label="Choose travellers" ref={travPanel}>
                  <Counter label="Adults" value={adults} min={1} max={paxMax - children} capped={cap != null} onChange={(v) => { setAdults(v); reset(); }} />
                  {allowChildren && <Counter label="Children" hint={childHint} value={children} min={0} max={paxMax - adults} capped={cap != null} onChange={(v) => { setChildren(v); reset(); }} />}
                  <p className="act-pop-note">Up to {plural(maxTotal, "traveller")} per booking.</p>
                  {cap != null && <p className="act-pop-note stk-live" aria-live="polite">{stockMessage}</p>}
                  <button type="button" className="mk-btn mk-btn-block" onClick={() => { closePop(); travRef.current?.focus(); }}>Done</button>
                </div>
              </>
            )}
          </div>

          <div className="act-field">
            <label id="act-date-l">Travel date</label>
            <button ref={dateRef} type="button" className="act-trigger" aria-labelledby="act-date-l" aria-haspopup="dialog" aria-expanded={pop === "date"} onClick={() => setPop(pop === "date" ? null : "date")}>
              <IconCalendar width="20" height="20" />
              <span className={date ? "" : "is-placeholder"}>{date ? formatDay(date) : "Select a date"}</span>
              <IconChevron dir="down" width="16" height="16" />
            </button>
            {pop === "date" && (
              <>
                {narrow && <span className="act-pop-scrim" aria-hidden="true" />}
                <div className="act-pop is-wide" role="dialog" aria-label="Choose a travel date" ref={datePanel}>
                  <ActivityCalendar
                    slug={slug}
                    options={options}
                    currency={currency}
                    value={date}
                    cacheRef={cacheRef}
                    onSelect={(iso) => { setDate(iso); reset(); closePop(); dateRef.current?.focus(); }}
                  />
                </div>
              </>
            )}
          </div>

          <div aria-live="polite">
            {stockMessage && <p className={`stk-live${cap <= 0 || overCap ? " is-sold" : ""}`}>{stockMessage}</p>}
          </div>

          <button type="button" className="mk-btn mk-btn-block act-check" onClick={check} disabled={results?.status === "loading" || overCap || (cap != null && cap <= 0)}>
            {results?.status === "loading" ? "Checking..." : "Check Availability"}
          </button>
          </fieldset>

          <div aria-live="polite">
            {error && (
              <p className="act-error" role="alert">
                {error.message} {error.code === "CART_FULL" && <Link href="/checkout">Go to cart</Link>}
              </p>
            )}
          </div>

          {results?.status === "done" && (
            <section className="act-results" aria-label="Options for your search">
              <h3>Your search applied to all options</h3>
              <p className="act-results-sub">{formatDay(results.date)} · {paxLabel(results.adults, results.children)}</p>
              <ul className="act-opts">
                {results.rows.map((row) => (
                  <OptionResult key={row.option.id} row={row} date={results.date} modifying={modifying} busy={busy} added={added} onProceed={onProceed} onAdd={onAdd} onSave={onSave} allowAddToCart={!!activity.allowAddToCart} />
                ))}
              </ul>
              <p className="act-fx">Charged in AED. Taxes and fees are included in the total.</p>
            </section>
          )}
        </div>
        {extra}
      </aside>
    </>
  );
}
