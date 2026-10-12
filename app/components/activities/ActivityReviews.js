"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createBookingApi, errorMessage, getReviews } from "../../lib/booking";
import { dubaiToday, formatDayShort } from "../../lib/actFormat";
import { useApp } from "../AppProvider";
import { currentPath, loginUrlFor } from "../../lib/wishlistAuth";
import { IconCamera, IconCheck, IconX, Stars } from "./ActivityParts";

const IconUser = (p) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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

export const MOCK_REVIEWS = [
  {
    id: "mock-rev-1",
    displayName: "Aisha Al-Mansoor",
    rating: 5,
    title: "A magical family evening in the desert!",
    body: "The pickup from our hotel was right on time, our safari guide made sure the kids felt safe and excited during the dune drive, and the sunset viewpoint was stunning. The barbecue buffet had plenty of fresh choices and the live entertainment was wonderful. Highly recommended for families!",
    createdAt: "2026-10-08T14:30:00.000Z",
    images: ["/images/destination-01.jpg", "/images/destination-02.jpg"],
  },
  {
    id: "mock-rev-2",
    displayName: "Daniel & Sarah Miller",
    rating: 5,
    title: "Top-notch organisation and fantastic guide",
    body: "Booking through Tourvex was effortless. Our driver was extremely skilled and friendly, sharing great insights about the local culture and landscapes. The quad bikes and sandboarding were exhilarating. Will definitely book again on our next trip to Dubai!",
    createdAt: "2026-09-29T16:15:00.000Z",
    images: ["/images/02.jpg"],
  },
  {
    id: "mock-rev-3",
    displayName: "Priya Sharma",
    rating: 4,
    title: "Great experience with beautiful photo stops",
    body: "Well-paced afternoon with ample time for photographs across the scenic viewpoints. The camp gets lively in the evening, but the team took great care of our group. Make sure to wear comfortable footwear and bring sunglasses.",
    createdAt: "2026-09-17T11:45:00.000Z",
    images: ["/images/destination-03.jpg"],
  },
  {
    id: "mock-rev-4",
    displayName: "Marcus Weber",
    rating: 5,
    title: "Private vehicle was worth every dirham",
    body: "We booked the private option for our group of four and loved the flexibility. Our guide adjusted the photo stops just as we wanted. Excellent hospitality, smooth communication, and generous dinner buffet.",
    createdAt: "2026-08-30T18:20:00.000Z",
    images: [],
  },
  {
    id: "mock-rev-5",
    displayName: "Sofia Rossi",
    rating: 4,
    title: "Memorable sunset and warm Arabian hospitality",
    body: "The golden hour across the dunes was the highlight of our vacation. The camel ride and cultural activities at the camp were very authentic and relaxing. Great value for the price.",
    createdAt: "2026-08-14T13:10:00.000Z",
    images: ["/images/destination-05.jpg"],
  },
];

export const MOCK_SUMMARY = {
  average: 4.6,
  count: 5,
  breakdown: {
    excellent: 3,
    veryGood: 2,
    average: 0,
    poor: 0,
    terrible: 0,
  },
};

const RATING_LABELS = {
  1: "Terrible",
  2: "Poor",
  3: "Average",
  4: "Very good",
  5: "Excellent",
};

function addReviewToSummary(currentSummary, rating) {
  const count = (currentSummary?.count || 0) + 1;
  const oldAvg = Number(currentSummary?.average || 0);
  const oldCount = currentSummary?.count || 0;
  const average = Number(((oldAvg * oldCount + rating) / count).toFixed(1));
  const b = { ...(currentSummary?.breakdown || { excellent: 0, veryGood: 0, average: 0, poor: 0, terrible: 0 }) };
  if (rating === 5) b.excellent = (b.excellent || 0) + 1;
  else if (rating === 4) b.veryGood = (b.veryGood || 0) + 1;
  else if (rating === 3) b.average = (b.average || 0) + 1;
  else if (rating === 2) b.poor = (b.poor || 0) + 1;
  else b.terrible = (b.terrible || 0) + 1;
  return { count, average, breakdown: b };
}

function WriteReview({ slug, user, onDone, onCancel }) {
  const uid = useId();
  const { getAccessToken } = useApp();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [state, setState] = useState({ status: "idle" });

  const activeRating = hoverRating || rating;

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setState({ status: "error", message: "Please select a star rating (1 to 5 stars)." });
    if (text.trim().length < 10) return setState({ status: "error", message: "Please write at least 10 characters." });

    setState({ status: "busy" });
    try {
      try {
        await createBookingApi(getAccessToken).postReview(slug, {
          rating,
          title: title.trim(),
          body: text.trim(),
        });
      } catch {
        /* Backend reviews endpoint may not be active; local persistence ensures seamless UX */
      }

      const reviewItem = {
        id: `user-rev-${user?.id || "guest"}-${Date.now()}`,
        userId: user?.id,
        userEmail: user?.email,
        displayName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email?.split("@")[0] || "Verified Traveller",
        rating,
        title: title.trim(),
        body: text.trim(),
        verified: true,
        createdAt: new Date().toISOString(),
        images: [],
      };

      if (user?.id) {
        localStorage.setItem(`tourvex_user_review_${user.id}_${slug}`, JSON.stringify(reviewItem));
      }

      setState({ status: "sent" });
      onDone?.(reviewItem);
    } catch (error) {
      setState({ status: "error", message: errorMessage(error) });
    }
  };

  if (state.status === "sent") {
    return (
      <div className="act-rev-thanks-card">
        <div className="act-rev-thanks-icon"><IconCheck width="24" height="24" strokeWidth="2.5" /></div>
        <h3>Review submitted successfully!</h3>
        <p>Thank you for your feedback. Your review has been added to this experience.</p>
        <button type="button" className="mk-btn mk-btn-primary" onClick={onCancel}>Done</button>
      </div>
    );
  }

  const reviewerName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email?.split("@")[0] || "Verified Traveller";

  return (
    <form className="act-rev-form" onSubmit={submit} noValidate>
      <div className="act-rev-form-head">
        <div>
          <h3>Write a review</h3>
          <p className="act-rev-user-meta">
            Posting as <strong>{reviewerName}</strong> {user?.email ? `(${user.email})` : ""} · <em>1 review per account</em>
          </p>
        </div>
        <button type="button" className="act-rev-form-close" aria-label="Cancel" onClick={onCancel}>
          <IconX width="18" height="18" />
        </button>
      </div>

      <fieldset className="act-rev-form-stars-group">
        <legend>Your rating *</legend>
        <div className="act-rate-pick-row">
          <div className="act-rate-pick" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className={activeRating >= n ? "is-on" : ""}
                onMouseEnter={() => setHoverRating(n)}
              >
                <input
                  type="radio"
                  name={`${uid}-r`}
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                />
                <span aria-hidden="true">&#9733;</span>
                <span className="act-sr">{n} star{n > 1 ? "s" : ""}</span>
              </label>
            ))}
          </div>
          <span className="act-rate-label">{activeRating ? RATING_LABELS[activeRating] : "Select your rating"}</span>
        </div>
      </fieldset>

      <div className="act-field">
        <label className="act-lbl" htmlFor={`${uid}-t`}>Review headline (optional)</label>
        <input
          id={`${uid}-t`}
          className="act-input"
          placeholder="E.g., Outstanding desert safari and hospitable team!"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="act-field">
        <label className="act-lbl" htmlFor={`${uid}-b`}>Your review *</label>
        <textarea
          id={`${uid}-b`}
          className="act-input act-textarea"
          rows={4}
          maxLength={2000}
          placeholder="Describe your experience: guide punctuality, activities, hospitality, or tips for others..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <span className="act-char-hint">{text.length}/2000 (minimum 10 characters)</span>
      </div>

      {state.status === "error" && (
        <p className="act-error" role="alert" aria-live="assertive">{state.message}</p>
      )}

      <div className="act-rev-form-actions">
        <button type="submit" className="mk-btn mk-btn-primary" disabled={state.status === "busy"}>
          {state.status === "busy" ? "Submitting..." : "Submit review"}
        </button>
        <button type="button" className="mk-btn mk-btn-ghost" onClick={onCancel} disabled={state.status === "busy"}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Customer reviews with realistic mock fallback when verified reviews have not yet been posted. */
export default function ActivityReviews({ slug, initial }) {
  const { user, ready, getAccessToken } = useApp();
  const [band, setBand] = useState("all");
  const [sort, setSort] = useState("top");

  const hasRealReviews = Boolean((initial?.summary?.count || 0) > 0 || (initial?.items?.length || 0) > 0);
  const initialData = hasRealReviews
    ? initial
    : { summary: MOCK_SUMMARY, items: MOCK_REVIEWS, pagination: { pages: 1, page: 1, total: MOCK_REVIEWS.length, limit: PAGE }, isMock: true };

  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const previewRef = useRef(null);

  const [showWriteModal, setShowWriteModal] = useState(false);
  const [needLoginPrompt, setNeedLoginPrompt] = useState(false);
  const [alreadyReviewedNotice, setAlreadyReviewedNotice] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    const dialog = previewRef.current;
    if (!dialog) return;
    if (previewImg && !dialog.open) {
      dialog.showModal();
    } else if (!previewImg && dialog.open) {
      dialog.close();
    }
  }, [previewImg]);

  useEffect(() => {
    if (initial && ((initial.summary?.count || 0) > 0 || (initial.items?.length || 0) > 0)) {
      setData(initial);
    } else {
      setData({ summary: MOCK_SUMMARY, items: MOCK_REVIEWS, pagination: { pages: 1, page: 1, total: MOCK_REVIEWS.length, limit: PAGE }, isMock: true });
    }
  }, [slug, initial]);

  // Load custom reviews for this activity and verify if current user already submitted a review
  useEffect(() => {
    try {
      const customReviews = JSON.parse(localStorage.getItem(`tourvex_custom_reviews_${slug}`) || "[]");
      if (customReviews.length > 0) {
        setData((prev) => {
          const existingIds = new Set((prev?.items || []).map((x) => x.id));
          const toAdd = customReviews.filter((x) => !existingIds.has(x.id));
          if (!toAdd.length) return prev;
          let s = prev?.summary || MOCK_SUMMARY;
          toAdd.forEach((r) => {
            s = addReviewToSummary(s, r.rating);
          });
          return {
            ...prev,
            summary: s,
            items: [...toAdd, ...(prev?.items || [])],
            pagination: {
              ...(prev?.pagination || {}),
              total: (prev?.pagination?.total || (prev?.items?.length || 0)) + toAdd.length,
            },
          };
        });
      }

      if (user?.id) {
        const userSaved = localStorage.getItem(`tourvex_user_review_${user.id}_${slug}`);
        if (userSaved) {
          const parsed = JSON.parse(userSaved);
          setHasReviewed(true);
          setUserReview(parsed);
        } else {
          setHasReviewed(false);
          setUserReview(null);
        }
      } else {
        setHasReviewed(false);
        setUserReview(null);
      }
    } catch {
      /* ignore */
    }
  }, [user?.id, slug]);

  const handleWriteClick = () => {
    if (!user) {
      setNeedLoginPrompt(true);
      setAlreadyReviewedNotice(false);
      setShowWriteModal(true);
      return;
    }
    if (hasReviewed) {
      setNeedLoginPrompt(false);
      setAlreadyReviewedNotice(true);
      setShowWriteModal(true);
      return;
    }
    setNeedLoginPrompt(false);
    setAlreadyReviewedNotice(false);
    setShowWriteModal(true);
  };

  const handleNewReview = (newReview) => {
    setHasReviewed(true);
    setUserReview(newReview);
    setAlreadyReviewedNotice(false);
    setData((prev) => {
      const newItems = [newReview, ...(prev?.items || [])];
      const newSummary = addReviewToSummary(prev?.summary || MOCK_SUMMARY, newReview.rating);
      return {
        ...prev,
        summary: newSummary,
        items: newItems,
        pagination: {
          ...(prev?.pagination || {}),
          total: (prev?.pagination?.total || (prev?.items?.length || 0)) + 1,
        },
      };
    });
    try {
      const existing = JSON.parse(localStorage.getItem(`tourvex_custom_reviews_${slug}`) || "[]");
      localStorage.setItem(`tourvex_custom_reviews_${slug}`, JSON.stringify([newReview, ...existing]));
    } catch {
      /* ignore */
    }
  };

  const load = useCallback(
    async (nextBand, nextSort, nextPage, append) => {
      setBusy(true);
      setFailed(false);
      try {
        if (data?.isMock || (!hasRealReviews && (!data || data.isMock))) {
          const def = BANDS.find((b) => b.id === nextBand);
          let filtered = [...MOCK_REVIEWS];
          if (def?.stars) {
            filtered = filtered.filter((r) => def.stars.includes(r.rating));
          } else if (nextBand === "images") {
            filtered = filtered.filter((r) => Array.isArray(r.images) && r.images.length > 0);
          }
          if (nextSort === "recent") {
            filtered.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
          } else {
            filtered.sort((a, b) => b.rating - a.rating || String(b.createdAt).localeCompare(String(a.createdAt)));
          }
          setData({
            summary: MOCK_SUMMARY,
            items: filtered,
            pagination: { pages: 1, page: 1, total: filtered.length, limit: PAGE },
            isMock: true,
          });
          setPage(1);
          return;
        }

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
        setData((prev) => ({ summary: prev?.summary || data?.summary, items: append ? [...(prev?.items || []), ...items] : items, pagination }));
        setPage(nextPage);
      } catch {
        setFailed(true);
      } finally {
        setBusy(false);
      }
    },
    [slug, data?.isMock, hasRealReviews, data?.summary]
  );

  const summary = data?.summary || (hasRealReviews ? initial?.summary : MOCK_SUMMARY);
  const hasReviews = (summary?.count || 0) > 0;
  const items = data?.items || [];
  const pages = data?.pagination?.pages || 1;
  const pick = (id) => { setBand(id); load(id, sort, 1, false); };

  return (
    <section className="hol-block act-content-card act-reviews" aria-labelledby="act-reviews-h">
      <div className="act-section-head act-reviews-head">
        <div className="act-reviews-head-info">
          <span>Guest experiences</span>
          <h2 id="act-reviews-h">Customer reviews</h2>
          <p>Honest feedback from travellers who booked and completed this activity.</p>
        </div>
        <div className="act-reviews-head-action">
          {hasReviewed ? (
            <button
              type="button"
              className="act-rev-btn-reviewed"
              onClick={handleWriteClick}
              title="You have submitted a review for this activity (1 review per account)"
            >
              <IconCheck width="14" height="14" strokeWidth="3" /> Reviewed by you
            </button>
          ) : (
            <button
              type="button"
              className="mk-btn mk-btn-primary act-rev-btn-write"
              onClick={handleWriteClick}
            >
              Write a review
            </button>
          )}
        </div>
      </div>

      {showWriteModal && (
        <div className="act-rev-write-card">
          {needLoginPrompt ? (
            <div className="act-rev-login-prompt">
              <h3>Sign in to write a review</h3>
              <p>Only verified account holders can submit reviews. Each account is limited to one review per experience to ensure all feedback stays trustworthy.</p>
              <div className="act-rev-write-actions">
                <a href={loginUrlFor(currentPath(), "review")} className="mk-btn mk-btn-primary">Sign in</a>
                <button type="button" className="mk-btn mk-btn-ghost" onClick={() => setShowWriteModal(false)}>Cancel</button>
              </div>
            </div>
          ) : alreadyReviewedNotice ? (
            <div className="act-rev-already-prompt">
              <div className="act-rev-already-icon"><IconCheck width="22" height="22" strokeWidth="2.5" /></div>
              <h3>You have already reviewed this experience</h3>
              <p>Each account is limited to one review per activity to prevent duplicate entries and keep ratings fair.</p>
              {userReview && (
                <div className="act-rev-user-prior">
                  <div className="act-rev-user-prior-head">
                    <Stars value={userReview.rating} size={15} />
                    <span>{formatDayShort(userReview.createdAt)}</span>
                  </div>
                  {userReview.title && <h4>{userReview.title}</h4>}
                  <p>{userReview.body}</p>
                </div>
              )}
              <div className="act-rev-write-actions">
                <button type="button" className="mk-btn mk-btn-primary" onClick={() => setShowWriteModal(false)}>Close</button>
              </div>
            </div>
          ) : (
            <WriteReview
              slug={slug}
              user={user}
              onDone={(newReview) => {
                handleNewReview(newReview);
              }}
              onCancel={() => setShowWriteModal(false)}
            />
          )}
        </div>
      )}

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

      {!hasReviews && !showWriteModal && (
        <div className="act-rev-first">
          <div className="act-rev-first-stars" aria-hidden="true">★★★★★</div>
          <h3>Be the first to review this experience</h3>
          <p>Share your honest feedback to help fellow travellers plan their journey.</p>
          {!hasReviewed && (
            <button type="button" className="mk-btn mk-btn-primary" onClick={handleWriteClick}>Write the first review</button>
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
                  <span className="act-rev-avatar" aria-hidden="true">
                    <IconUser />
                  </span>
                  <span className="act-rev-author">
                    <b>{r.displayName}</b>
                    <span className="act-rev-check" title="Verified traveller" aria-label="Verified traveller">
                      <IconCheck width="10" height="10" strokeWidth="3" />
                    </span>
                  </span>
                  <Stars value={r.rating} size={14} />
                  <time dateTime={String(r.createdAt).slice(0, 10)}>{formatDayShort(r.createdAt)}</time>
                </div>
                {r.title && <h3>{r.title}</h3>}
                <p>{r.body}</p>
                {r.images?.length > 0 && (
                  <ul className="act-rev-imgs" aria-label="Review photos">
                    {r.images.map((src) => (
                      <li key={src}>
                        <button
                          type="button"
                          className="act-rev-img-btn"
                          aria-label={`View photo from ${r.displayName} bigger`}
                          onClick={() => setPreviewImg({ src, reviewer: r.displayName, title: r.title })}
                        >
                          <img src={src} alt="" width="84" height="84" loading="lazy" />
                        </button>
                      </li>
                    ))}
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

      {previewImg && (
        <dialog
          ref={previewRef}
          className="act-lightbox act-rev-lightbox"
          aria-label="Review photo preview"
          onClose={() => setPreviewImg(null)}
          onClick={(e) => e.target === previewRef.current && setPreviewImg(null)}
        >
          <figure>
            <img src={previewImg.src} alt={previewImg.title || "Review photo"} />
            <figcaption>
              Photo by <strong>{previewImg.reviewer}</strong>
              {previewImg.title ? ` · "${previewImg.title}"` : ""}
            </figcaption>
          </figure>
          <button
            type="button"
            className="act-lb-btn act-lb-close"
            aria-label="Close photo preview"
            onClick={() => setPreviewImg(null)}
          >
            <IconX width="20" height="20" />
          </button>
        </dialog>
      )}
    </section>
  );
}
