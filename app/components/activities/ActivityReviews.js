"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createBookingApi, errorMessage, getReviews } from "../../lib/booking";
import { dubaiToday, formatDayShort } from "../../lib/actFormat";
import { useApp } from "../AppProvider";
import { IconCamera, Stars } from "./ActivityParts";

const BANDS = [
  { id: "all", label: "All reviews" },
  { id: "images", label: "With images" },
  { id: "4", label: "4+ stars", stars: [5, 4] },
  { id: "3", label: "3 stars", stars: [3] },
  { id: "low", label: "Below 3 stars", stars: [2, 1] },
];
const BREAKDOWN = [
  ["excellent", "Excellent"], ["veryGood", "Very good"], ["average", "Average"], ["poor", "Poor"], ["terrible", "Terrible"],
];
const PAGE = 6;

function WriteReview({ slug, bookingReference, onDone }) {
  const uid = useId();
  const { getAccessToken } = useApp();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [state, setState] = useState({ status: "idle" });

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setState({ status: "error", message: "Please choose a star rating." });
    if (text.trim().length < 10) return setState({ status: "error", message: "Please write at least 10 characters." });
    setState({ status: "busy" });
    try {
      await createBookingApi(getAccessToken).postReview(slug, { bookingReference, rating, title: title.trim(), body: text.trim() });
      setState({ status: "sent" });
      onDone?.();
    } catch (error) {
      setState({ status: "error", message: errorMessage(error) });
    }
  };

  if (state.status === "sent") return <p className="act-rev-thanks" role="status">Thank you. Your review was received and will appear once our team has checked it.</p>;
  return (
    <form className="act-rev-form" onSubmit={submit} noValidate>
      <fieldset>
        <legend>Your rating</legend>
        <div className="act-rate-pick">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={rating >= n ? "is-on" : ""}>
              <input type="radio" name={`${uid}-r`} value={n} checked={rating === n} onChange={() => setRating(n)} />
              <span aria-hidden="true">&#9733;</span>
              <span className="act-sr">{n} star{n > 1 ? "s" : ""}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="act-lbl" htmlFor={`${uid}-t`}>Title (optional)</label>
      <input id={`${uid}-t`} className="act-input" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
      <label className="act-lbl" htmlFor={`${uid}-b`}>Your review</label>
      <textarea id={`${uid}-b`} className="act-input" rows={4} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
      <p className="act-error" role="alert" aria-live="assertive">{state.status === "error" ? state.message : ""}</p>
      <button type="submit" className="mk-btn" disabled={state.status === "busy"}>{state.status === "busy" ? "Sending..." : "Submit review"}</button>
    </form>
  );
}

/** Real customer reviews only. The whole block stays hidden when there are none (and nothing to write). */
export default function ActivityReviews({ slug, initial }) {
  const { user, ready, getAccessToken } = useApp();
  const [band, setBand] = useState("all");
  const [sort, setSort] = useState("top");
  const [data, setData] = useState(initial || null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [eligible, setEligible] = useState(null);
  const [writing, setWriting] = useState(false);
  const summary = initial?.summary || null;

  // Eligibility: a confirmed booking for this activity whose date has passed.
  useEffect(() => {
    if (!ready || !user) return undefined;
    let live = true;
    createBookingApi(getAccessToken)
      .getBookings()
      .then((list) => {
        const today = dubaiToday();
        const hit = (Array.isArray(list) ? list : []).find(
          (b) => b.activitySlug === slug && b.status === "confirmed" && b.serviceDate && String(b.serviceDate).slice(0, 10) < today
        );
        if (live) setEligible(hit?.reference || null);
      })
      .catch(() => live && setEligible(null));
    return () => {
      live = false;
    };
  }, [ready, user, getAccessToken, slug]);

  const load = useCallback(
    async (nextBand, nextSort, nextPage, append) => {
      setBusy(true);
      setFailed(false);
      try {
        const def = BANDS.find((b) => b.id === nextBand);
        let items;
        let pagination;
        if (def?.stars) {
          const pages = await Promise.all(def.stars.map((rating) => getReviews(slug, { rating, sort: nextSort, limit: 20 })));
          items = pages.flatMap((p) => p.items || []);
          if (nextSort === "recent") items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
          else items.sort((a, b) => b.rating - a.rating);
          pagination = { pages: 1, page: 1 };
        } else {
          const res = await getReviews(slug, { withImages: nextBand === "images", sort: nextSort, page: nextPage, limit: PAGE });
          items = res.items || [];
          pagination = res.pagination || { pages: 1, page: nextPage };
        }
        setData((prev) => ({ summary: prev?.summary || summary, items: append ? [...(prev?.items || []), ...items] : items, pagination }));
        setPage(nextPage);
      } catch {
        setFailed(true);
      } finally {
        setBusy(false);
      }
    },
    [slug, summary]
  );

  const hasReviews = (summary?.count || 0) > 0;
  if (!hasReviews && !eligible) return null;

  const items = data?.items || [];
  const pages = data?.pagination?.pages || 1;
  const pick = (id) => { setBand(id); load(id, sort, 1, false); };

  return (
    <section className="hol-block act-reviews" aria-labelledby="act-reviews-h">
      <h2 id="act-reviews-h">Customer reviews</h2>

      {hasReviews && (
        <div className="act-rev-summary">
          <div className="act-rev-score">
            <strong>{Number(summary.average).toFixed(1)}</strong>
            <Stars value={summary.average} size={20} />
            <span>Based on {summary.count} review{summary.count === 1 ? "" : "s"}</span>
          </div>
          <ul className="act-rev-bars" aria-label="Guest rating breakdown">
            {BREAKDOWN.map(([key, label]) => {
              const n = summary.breakdown?.[key] || 0;
              return (
                <li key={key}>
                  <span>{label}</span>
                  <span className="act-rev-bar" aria-hidden="true"><i style={{ width: `${summary.count ? (n / summary.count) * 100 : 0}%` }} /></span>
                  <b>{n}</b>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {eligible && (
        <div className="act-rev-write">
          {writing ? <WriteReview slug={slug} bookingReference={eligible} onDone={() => setEligible(null)} /> : (
            <button type="button" className="mk-btn mk-btn-ghost" onClick={() => setWriting(true)}>Write a review</button>
          )}
        </div>
      )}

      {hasReviews && (
        <>
          <div className="act-rev-tools">
            <div className="act-rev-chips" role="group" aria-label="Filter reviews">
              {BANDS.map((b) => (
                <button key={b.id} type="button" className={`hol-chip is-soft${band === b.id ? " is-active" : ""}`} aria-pressed={band === b.id} onClick={() => pick(b.id)}>{b.label}</button>
              ))}
            </div>
            <label className="act-rev-sort">
              <span>Sort by</span>
              <select value={sort} onChange={(e) => { setSort(e.target.value); load(band, e.target.value, 1, false); }}>
                <option value="top">Top reviews</option>
                <option value="recent">Most recent</option>
              </select>
            </label>
          </div>

          <ul className="act-rev-list" aria-busy={busy}>
            {items.map((r) => (
              <li key={r.id} className="act-rev">
                <div className="act-rev-head">
                  <b>{r.displayName}</b>
                  <Stars value={r.rating} size={14} />
                  <time dateTime={String(r.createdAt).slice(0, 10)}>{formatDayShort(r.createdAt)}</time>
                </div>
                {r.title && <h3>{r.title}</h3>}
                <p>{r.body}</p>
                {r.images?.length > 0 && (
                  <ul className="act-rev-imgs" aria-label="Review photos">
                    {r.images.map((src) => <li key={src}><img src={src} alt="" width="84" height="84" loading="lazy" /></li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          {!items.length && !busy && !failed && <p className="act-rev-empty" role="status"><IconCamera width="18" height="18" /> No reviews match this filter.</p>}
          {failed && <p className="act-error" role="alert">We could not load reviews. <button type="button" className="act-linkbtn" onClick={() => load(band, sort, 1, false)}>Try again</button></p>}
          {page < pages && (
            <button type="button" className="mk-btn mk-btn-ghost act-more" disabled={busy} onClick={() => load(band, sort, page + 1, true)}>{busy ? "Loading..." : "Show more reviews"}</button>
          )}
        </>
      )}
    </section>
  );
}
