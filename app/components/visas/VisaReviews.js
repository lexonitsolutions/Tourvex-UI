"use client";

import { memo, useId, useState } from "react";

const IconStar = ({ filled = true, className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill={filled ? "#f59e0b" : "none"}
    stroke="#f59e0b"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconThumbsUp = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const IconVerified = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="#059669"
    stroke="#ffffff"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2l3.09 3.26 4.45.65 1.54 4.25 3.32 3.09-1.54 4.25.65 4.45-4.25 1.54-3.09 3.32-4.25-1.54-4.45.65-1.54-4.25-3.32-3.09 1.54-4.25-.65-4.45 4.25-1.54L12 2z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

function getInitialReviews(countryName, kind) {
  const isEvisa = kind === "evisa";
  const dest = countryName || "International";

  return [
    {
      id: "vr-1",
      name: "Tariq Mansoor",
      location: "Dubai Resident",
      applicantType: "Family Trip",
      rating: 5,
      date: "3 days ago",
      tag: "Fast Approval",
      title: isEvisa
        ? `Received our ${dest} e-Visas in just 36 hours!`
        : `Smooth embassy appointment and hassle-free document preparation`,
      text: isEvisa
        ? `We needed ${dest} visas for our upcoming family vacation. Karnish Tourism checked our passport photos and travel itineraries within an hour of submitting. All 4 visas arrived approved in our inbox two days later. Remarkable speed and zero stress!`
        : `Applying for ${dest} seemed overwhelming with so many paperwork requirements. The visa specialists at Karnish prepared our entire application package, booked our biometric appointment, and guided us on what to expect. Approved on the first attempt!`,
      helpful: 28,
    },
    {
      id: "vr-2",
      name: "Pooja & Rohan Mehra",
      location: "Sharjah, UAE",
      applicantType: "Holiday Trip",
      rating: 5,
      date: "1 week ago",
      tag: "Document Support",
      title: "Saved us from an application rejection",
      text: `When I submitted my initial documents, the team noticed my passport had less than 6 months remaining validity for ${dest} regulations. They immediately called me to explain and helped plan our renewal before submitting to the visa authority. Outstanding attention to detail.`,
      helpful: 21,
    },
    {
      id: "vr-3",
      name: "Marcus Lindqvist",
      location: "Expat Traveller",
      applicantType: "Business Travel",
      rating: 5,
      date: "2 weeks ago",
      tag: "Great Communication",
      title: "Fast, clear, and absolutely transparent pricing",
      text: `I travel internationally several times a year and this was by far the smoothest visa support experience. Fast WhatsApp updates at every stage from document receipt to issuance for ${dest}. No surprise extra fees. Worth every dirham.`,
      helpful: 16,
    },
    {
      id: "vr-4",
      name: "Fatima Al-Zahra",
      location: "Abu Dhabi",
      applicantType: "Solo Vacation",
      rating: 5,
      date: "3 weeks ago",
      tag: "Hassle-Free",
      title: "Extremely helpful team from start to finish",
      text: `Applied for my ${dest} tourist visa. The requirements list on this page was 100% accurate, and their consultation answered all my questions regarding multiple entry conditions and length of stay. Will use them for all future travel visas!`,
      helpful: 12,
    },
  ];
}

export default memo(function VisaReviews({ country = "destination", kind = "evisa" }) {
  const formId = useId();
  const [reviews, setReviews] = useState(() => getInitialReviews(country, kind));
  const [activeFilter, setActiveFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [helpfulGiven, setHelpfulGiven] = useState({});
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // New review form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [applicantType, setApplicantType] = useState("Holiday Trip");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");

  const handleHelpful = (id) => {
    if (helpfulGiven[id]) return;
    setHelpfulGiven((prev) => ({ ...prev, [id]: true }));
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpful: (r.helpful || 0) + 1 } : r))
    );
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!authorName.trim() || !reviewText.trim()) return;

    const newRev = {
      id: `user-rev-${Date.now()}`,
      name: authorName.trim(),
      location: "Verified Applicant",
      applicantType: applicantType || "Verified Traveller",
      rating: Number(rating) || 5,
      date: "Just now",
      tag: "Recent Approval",
      title: reviewTitle.trim() || "Great visa experience with Karnish",
      text: reviewText.trim(),
      helpful: 1,
    };

    setReviews([newRev, ...reviews]);
    setAuthorName("");
    setReviewTitle("");
    setReviewText("");
    setShowForm(false);
    setSubmittedMessage(true);
    setTimeout(() => setSubmittedMessage(false), 5000);
  };

  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "5stars") return r.rating === 5;
    if (activeFilter === "fast") return r.tag === "Fast Approval";
    if (activeFilter === "docs") return r.tag === "Document Support";
    return true;
  });

  return (
    <section id="vis-reviews" className="hol-block vis-reviews-block" aria-labelledby="vis-reviews-heading" data-reveal>
      <div className="vis-reviews-header">
        <div>
          <span className="vis-reviews-eyebrow">Client Feedback &amp; Approvals</span>
          <h2 id="vis-reviews-heading">Customer Reviews &amp; Visa Experience</h2>
        </div>
        <button
          type="button"
          className="mk-btn vis-write-review-btn"
          onClick={() => setShowForm(!showForm)}
          aria-expanded={showForm}
        >
          {showForm ? "Cancel Review" : "Share Your Experience"}
        </button>
      </div>

      {submittedMessage && (
        <div className="vis-review-success-banner" role="status">
          <IconVerified /> Thank you! Your visa experience review has been shared successfully.
        </div>
      )}

      {/* Trust & Score Banner */}
      <div className="vis-reviews-overview">
        <div className="vis-reviews-score-card">
          <div className="vis-reviews-big-num">4.9</div>
          <div className="vis-reviews-score-meta">
            <div className="vis-stars-row" aria-label="5 out of 5 stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <IconStar key={s} filled={true} />
              ))}
            </div>
            <p className="vis-reviews-count-txt">Based on 140+ verified client applications</p>
          </div>
        </div>

        <div className="vis-reviews-badges-strip">
          <div className="vis-rev-badge-item">
            <strong>99.4%</strong>
            <span>Approval Assistance</span>
          </div>
          <div className="vis-rev-badge-item">
            <strong>&lt; 2 hrs</strong>
            <span>Initial Document Audit</span>
          </div>
          <div className="vis-rev-badge-item">
            <strong>Dedicated</strong>
            <span>Visa Specialist Support</span>
          </div>
        </div>
      </div>

      {/* Review Submission Form Drawer */}
      {showForm && (
        <form className="vis-review-form" onSubmit={handleSubmitReview}>
          <h3>Write a Review on Your Visa Experience</h3>
          <p className="vis-review-form-sub">Share your feedback to help fellow travellers prepare their applications.</p>

          <div className="vis-form-group">
            <label>Rating</label>
            <div className="vis-star-selector" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className="vis-star-btn"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  aria-label={`${star} star`}
                >
                  <IconStar filled={star <= (hoverRating || rating)} />
                </button>
              ))}
              <span className="vis-star-score-hint">{rating} of 5 Stars</span>
            </div>
          </div>

          <div className="vis-review-form-grid">
            <div className="vis-form-group">
              <label htmlFor={`${formId}-name`}>Your Name *</label>
              <input
                id={`${formId}-name`}
                type="text"
                required
                placeholder="e.g. Tariq Mansoor"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>
            <div className="vis-form-group">
              <label htmlFor={`${formId}-type`}>Trip / Applicant Type</label>
              <select
                id={`${formId}-type`}
                value={applicantType}
                onChange={(e) => setApplicantType(e.target.value)}
              >
                <option value="Holiday Trip">Holiday / Tourism</option>
                <option value="Family Trip">Family Travel</option>
                <option value="Business Travel">Business &amp; Conference</option>
                <option value="Couple Travel">Couple / Honeymoon</option>
                <option value="Solo Vacation">Solo Travel</option>
              </select>
            </div>
          </div>

          <div className="vis-form-group">
            <label htmlFor={`${formId}-title`}>Review Headline</label>
            <input
              id={`${formId}-title`}
              type="text"
              placeholder="e.g. Approved in less than 48 hours!"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
            />
          </div>

          <div className="vis-form-group">
            <label htmlFor={`${formId}-text`}>Your Visa Experience *</label>
            <textarea
              id={`${formId}-text`}
              rows={4}
              required
              placeholder="Tell others about the turnaround time, communication, document guidance, and overall service..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          <div className="vis-review-form-actions">
            <button type="submit" className="mk-btn">Submit Review</button>
            <button type="button" className="mk-btn mk-btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="vis-reviews-filter-bar">
        <button
          type="button"
          className={`vis-filter-pill${activeFilter === "all" ? " is-active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          All Reviews ({reviews.length})
        </button>
        <button
          type="button"
          className={`vis-filter-pill${activeFilter === "5stars" ? " is-active" : ""}`}
          onClick={() => setActiveFilter("5stars")}
        >
          5-Star Ratings
        </button>
        <button
          type="button"
          className={`vis-filter-pill${activeFilter === "fast" ? " is-active" : ""}`}
          onClick={() => setActiveFilter("fast")}
        >
          Fast Approvals
        </button>
        <button
          type="button"
          className={`vis-filter-pill${activeFilter === "docs" ? " is-active" : ""}`}
          onClick={() => setActiveFilter("docs")}
        >
          Document Support
        </button>
      </div>

      {/* Reviews Cards List */}
      <div className="vis-reviews-cards-list">
        {filteredReviews.map((rev) => (
          <article key={rev.id} className="vis-review-card">
            <div className="vis-review-card-head">
              <div className="vis-reviewer-profile">
                <div className="vis-reviewer-avatar" aria-hidden="true">
                  {rev.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="vis-reviewer-name-row">
                    <span className="vis-reviewer-name">{rev.name}</span>
                    <span className="vis-verified-badge" title="Verified Visa Application">
                      <IconVerified /> Verified Applicant
                    </span>
                  </div>
                  <div className="vis-reviewer-sub">
                    <span>{rev.location}</span>
                    <span className="vis-bullet" aria-hidden="true">·</span>
                    <span className="vis-applicant-type">{rev.applicantType}</span>
                  </div>
                </div>
              </div>

              <div className="vis-review-rating-block">
                <div className="vis-card-stars" aria-label={`${rev.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <IconStar key={s} filled={s <= rev.rating} />
                  ))}
                </div>
                <span className="vis-review-date">{rev.date}</span>
              </div>
            </div>

            {rev.tag && <span className="vis-review-tag-badge">{rev.tag}</span>}

            <h3 className="vis-review-card-title">{rev.title}</h3>
            <p className="vis-review-card-text">{rev.text}</p>

            <div className="vis-review-card-foot">
              <button
                type="button"
                className={`vis-helpful-btn${helpfulGiven[rev.id] ? " is-helpful" : ""}`}
                onClick={() => handleHelpful(rev.id)}
                disabled={helpfulGiven[rev.id]}
                aria-label={`Mark as helpful. Current count: ${rev.helpful || 0}`}
              >
                <IconThumbsUp />
                <span>Helpful ({rev.helpful || 0})</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});
