"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { recordRecentHoliday, submitHolidayEnquiry } from "../../lib/holidays";
import { ApiError, formatPrice } from "../../lib/api";
import { useApp } from "../AppProvider";
import { currentPath, loginUrlFor } from "../../lib/wishlistAuth";
import { ScrollTrigger, useReveal } from "../../lib/motion";
import CurrencyNote from "../CurrencyNote";
import ActivityReviews from "../activities/ActivityReviews";
import { EnquiryStockNote, StockHead } from "../StockBadge";
import { useMotion } from "../MotionShell";
import {
  FALLBACK_IMG,
  HolidayCard,
  HolidayWhatsAppButton,
  IconCheck,
  IconChevron,
  IconMoon,
  IconPin,
  IconStar,
  IconWhatsApp,
  IconX,
  PremiumDatePicker,
  RailSection,
  WishButton,
  durationLabel,
  money,
  priceOf,
  showFallback,
} from "./HolidayParts";

/* Inline Icons matching reference screenshots ----------------------- */

const svgIcon = (paths, props = {}) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {paths}
  </svg>
);

const IconShare = (p) =>
  svgIcon(
    <>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </>,
    p
  );

const IconCamera = (p) =>
  svgIcon(
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>,
    p
  );

const IconUser = (p) =>
  svgIcon(
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>,
    p
  );

const IconCalendar = (p) =>
  svgIcon(
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>,
    p
  );

const IconShield = (p) =>
  svgIcon(
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    p
  );

const IconCoin = (p) =>
  svgIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
      <path d="M12 6v2m0 8v2" />
    </>,
    p
  );

const IconChat = (p) =>
  svgIcon(
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    p
  );

const IconThumbsUp = (p) =>
  svgIcon(
    <>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </>,
    p
  );

const IconMinus = (p) => svgIcon(<line x1="5" y1="12" x2="19" y2="12" />, p);
const IconPlus = (p) => svgIcon(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>, p);
const IconCart = (p) =>
  svgIcon(
    <>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </>,
    p
  );
const IconRefund = (p) =>
  svgIcon(
    <>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </>,
    p
  );
const IconTransferSwap = (p) =>
  svgIcon(
    <>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>,
    p
  );

/* Sample Rich Media & Data Presets ---------------------------------- */

const GALLERY_FALLBACKS = [
  "/images/destination-01.jpg",
  "/images/01.jpg",
  "/images/02.jpg",
  "/images/03.jpg",
  "/images/destination-03.jpg",
];

const ITINERARY_PHOTOS = [
  "/images/01.jpg",
  "/images/02.jpg",
  "/images/destination-03.jpg",
  "/images/03.jpg",
  "/images/destination-01.jpg",
];

const SAMPLE_HOTELS = [
  {
    name: "Admiral Plaza Hotel",
    stars: 3,
    location: "Bur Dubai",
    image: "/images/01.jpg",
    tags: ["Free Wi-Fi", "Daily Breakfast", "Swimming Pool"],
  },
  {
    name: "Citymax Hotel Bur Dubai",
    stars: 3,
    location: "Bur Dubai",
    image: "/images/02.jpg",
    tags: ["Central Location", "Rooftop Pool", "Free Shuttle"],
  },
  {
    name: "Grand Excelsior Hotel Deira",
    stars: 4,
    location: "Deira",
    image: "/images/03.jpg",
    tags: ["Luxury Spa", "500m to Metro", "Multi-Cuisine Buffet"],
  },
  {
    name: "Fortune Pearl Hotel",
    stars: 3,
    location: "Deira",
    image: "/images/04.jpg",
    tags: ["Comfort Stay", "24/7 Dining", "Airport Shuttle"],
  },
  {
    name: "Atlantis, The Palm",
    stars: 5,
    location: "Palm Jumeirah",
    image: "/images/destination-01.jpg",
    tags: ["Private Beach", "Aquaventure Access", "Luxury Dining"],
  },
];

const CUSTOMER_PHOTOS = [
  "/images/blog-1.jpg",
  "/images/blog-2.jpg",
  "/images/destination-a.jpg",
  "/images/destination-b.jpg",
  "/images/destination-c.jpg",
  "/images/destination-d.jpg",
  "/images/destination-e.jpg",
  "/images/destination-f.jpg",
];

const SAMPLE_REVIEWS = [
  {
    id: "rev-1",
    name: "Aman",
    avatarBg: "#831843",
    date: "13 Jul 2026",
    rating: 5,
    packageTag: "Dubai Stopover Delight",
    duration: "1 Night / 2 Days",
    hasImages: true,
    images: ["/images/blog-1.jpg", "/images/destination-a.jpg", "/images/destination-b.jpg"],
    comment:
      "We had a memorable family holiday in Dubai for our stopover, covering both the Dhow cruise marina dinner and city tour. Huge thanks to the Karnish Tourism team who planned every single detail with precision! The airport pick-up was right on time and our hotel room was upgraded. Truly exceptional service!",
  },
  {
    id: "rev-2",
    name: "Sarah Jenkins",
    avatarBg: "#312e81",
    date: "28 Aug 2026",
    rating: 5,
    packageTag: "Dubai Stopover Delight",
    duration: "1 Night / 2 Days",
    hasImages: true,
    images: ["/images/blog-2.jpg", "/images/destination-c.jpg"],
    comment:
      "The Marina Dhow Cruise was absolutely magical under the night skyline! Food was delicious and the entertainment was top notch. Driver was polite and the 24/7 WhatsApp support gave us complete peace of mind. Best travel agency experience we've ever had in the Middle East.",
  },
  {
    id: "rev-3",
    name: "Vikram Patel",
    avatarBg: "#065f46",
    date: "05 Sep 2026",
    rating: 5,
    packageTag: "Dubai Stopover Delight",
    duration: "1 Night / 2 Days",
    hasImages: true,
    images: ["/images/blog-3.jpg", "/images/destination-d.jpg", "/images/destination-e.jpg"],
    comment:
      "Flawless trip from start to finish! Booking was effortless, prices are genuinely the best in the market, and the guided city tour gave us enough time to explore Burj Khalifa and Dubai Mall without feeling rushed. Will definitely book our future vacations with Karnish Tourism.",
  },
  {
    id: "rev-4",
    name: "Jessica Miller",
    avatarBg: "#581c87",
    date: "18 Sep 2026",
    rating: 4,
    packageTag: "Dubai Stopover Delight",
    duration: "1 Night / 2 Days",
    hasImages: true,
    images: ["/images/blog-4.jpg"],
    comment:
      "Very good experience overall! The hotel check-in was swift, transfers were in a clean AC vehicle, and the team was quick to respond when our flight was delayed by 1 hour. Highly recommended for quick stopovers.",
  },
];

/* Lightbox viewer ---------------------------------------------------- */

function Lightbox({ images, index, onIndex, onClose }) {
  const closeRef = useRef(null);
  const { setScrollLocked } = useMotion();

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    setScrollLocked(true);
    return () => {
      setScrollLocked(false);
      previous?.focus?.();
    };
  }, [setScrollLocked]);

  useEffect(() => {
    const step = (d) => onIndex((index + d + images.length) % images.length);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onIndex, onClose]);

  const image = images[index];
  const url = typeof image === "string" ? image : image?.url || FALLBACK_IMG;
  const alt = typeof image === "string" ? "Travel photo" : image?.alt || "Travel photo";

  return (
    <div className="hol-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose}>
      <button ref={closeRef} type="button" className="hol-lb-btn hol-lb-close" aria-label="Close photo viewer" onClick={onClose}>
        <IconX />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="hol-lb-btn hol-lb-prev"
            aria-label="Previous photo"
            onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + images.length) % images.length); }}
          >
            <IconChevron dir="left" />
          </button>
          <button
            type="button"
            className="hol-lb-btn hol-lb-next"
            aria-label="Next photo"
            onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % images.length); }}
          >
            <IconChevron />
          </button>
        </>
      )}
      <figure onClick={(e) => e.stopPropagation()}>
        <img key={url} src={url} alt={alt} onError={showFallback} />
        <figcaption>{alt} · {index + 1} / {images.length}</figcaption>
      </figure>
    </div>
  );
}

/* Country codes and nationalities for booking flow ------------------- */

const COUNTRY_CODES = [
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+1", country: "United States / Canada", flag: "🇺🇸" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
];

const NATIONALITIES = [
  "Emirati",
  "Indian",
  "Saudi",
  "British",
  "American",
  "Filipino",
  "Pakistani",
  "Egyptian",
  "Omani",
  "Qatari",
  "Kuwaiti",
  "Canadian",
  "Australian",
  "German",
  "French",
  "Russian",
  "Other Nationality",
];

/* Proceed to Book / Customer Details Modal --------------------------- */

/** ISO date (YYYY-MM-DD) for the enquiry: the picker value, else the displayed date parsed, else omitted. */
function enquiryDate(iso, display) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return iso;
  const parsed = new Date(display);
  if (Number.isNaN(parsed.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

function QuoteModal({ pkg, travelers, travelDate, travelDateIso, price, isOpen, onClose }) {
  const { user, getAccessToken } = useApp();
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [nationality, setNationality] = useState("Emirati");
  const [optOutMarketing, setOptOutMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [leadReference, setLeadReference] = useState("");

  if (!isOpen) return null;

  const durationStr = durationLabel(pkg);
  const displayPrice = price ? money(price.current) : "Price on request";
  const coverImg = pkg?.images?.[0]?.url || pkg?.coverImage || FALLBACK_IMG;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting) return;
    if (!user) {
      router.push(loginUrlFor(currentPath(), "quote"));
      return;
    }

    if (!fullName.trim()) {
      setSubmitError("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setSubmitError("Please enter your phone number.");
      return;
    }
    const fullPhoneNumber = `${countryCode} ${phone.trim()}`;
    if (!/^[0-9+\-\s]{6,20}$/.test(fullPhoneNumber)) {
      setSubmitError("Phone numbers may only contain digits, spaces, + and - (6 to 20 characters in total).");
      return;
    }
    if (!consent) {
      setSubmitError("Please agree to be contacted so we can reply to your request.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const isoDate = enquiryDate(travelDateIso, travelDate);
      const amount = Math.round((price?.current?.amount || 0) * 100) / 100;
      const summary = `Package: ${pkg.title}. Duration: ${durationStr}. Travellers: ${travelers?.label || "1 guest"}${travelers?.infants ? ` (${travelers.infants} infant${travelers.infants === 1 ? "" : "s"})` : ""}. Date shown: ${travelDate}.`;
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: fullPhoneNumber,
        travelers: Math.min(20, Math.max(1, travelers?.count || 1)),
        ...(isoDate ? { travelDate: isoDate } : {}),
        ...(amount > 0 ? { totalAmount: amount } : {}),
        currency: price?.current?.currency || "AED",
        nationality,
        adults: Math.min(20, travelers?.adults ?? 1),
        children: Math.min(20, travelers?.children ?? 0),
        marketingOptOut: optOutMarketing,
        message: summary.slice(0, 1000),
        consent: true,
      };

      const token = await getAccessToken();
      const result = await submitHolidayEnquiry(pkg.slug, payload, { token });
      setLeadReference(result.reference);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setSubmitError("Too many requests just now. Please wait a minute and try again.");
      else if (err instanceof ApiError && err.status === 400) setSubmitError(err.message);
      else if (err instanceof ApiError && err.status === 404) setSubmitError("This package is no longer available. Please choose another one or contact us.");
      else setSubmitError("We could not send your request. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hol-bf-overlay" role="dialog" aria-modal="true" aria-labelledby="booking-flow-title" onClick={onClose}>
      <div className="hol-bf-dialog" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="hol-bf-close" aria-label="Close modal" onClick={onClose}>
          <IconX />
        </button>

        {/* Top Stepper Indicator matching Screenshot */}
        <div className="hol-bf-stepper">
          <div className="hol-bf-step is-done">
            <span className="hol-bf-step-circle">✓</span>
            <span>Inquiry Reviewed</span>
          </div>
          <div className={`hol-bf-step-divider ${submitted ? "is-done" : ""}`} />
          <div className={`hol-bf-step ${submitted ? "is-done" : "is-active"}`}>
            <span className="hol-bf-step-circle">{submitted ? "✓" : "2"}</span>
            <span>Customer Details</span>
          </div>
          <div className={`hol-bf-step-divider ${submitted ? "is-done" : ""}`} />
          <div className={`hol-bf-step ${submitted ? "is-active is-done" : ""}`}>
            <span className="hol-bf-step-circle">{submitted ? "✓" : "3"}</span>
            <span>Submit Request</span>
          </div>
        </div>

        {submitted ? (
          /* Step 3: Success Completed View */
          <div className="hol-bf-success-wrap">
            <div className="hol-bf-success-icon">✓</div>
            <div className="hol-bf-ref-badge">
              Booking Reference: #{leadReference}
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#111827", margin: "0 0 10px" }}>
              Booking Request Received!
            </h2>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: "0 0 24px" }}>
              Thank you, <strong>{fullName}</strong> ({nationality}). Your booking request for{" "}
              <strong>{pkg.title}</strong> on <strong>{travelDate}</strong> for <strong>{travelers.label}</strong> at{" "}
              <strong>{displayPrice}</strong> has been received and stored in our operations desk. Our specialist will contact you within 15 minutes.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <HolidayWhatsAppButton
                message={`Hello Karnish Tourism! I submitted booking request #${leadReference} for "${pkg.title}" (${displayPrice}) on ${travelDate} for ${travelers.label}. Please confirm my booking.`}
                size="large"
                className="hol-quote-wa-btn"
                ariaLabel="Chat with us on WhatsApp now"
              >
                <span>Chat with us on WhatsApp now</span>
              </HolidayWhatsAppButton>

              <button type="button" className="mk-btn hol-quote-done-btn" onClick={onClose}>
                Done &amp; Close
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Customer Details & Inquiry Summary Layout matching Screenshot */
          <>
            {/* Login Callout Banner */}
            <div className="hol-bf-login-banner">
              <span>Already have an account?</span>
              <Link href="/sign-in" className="hol-bf-login-btn">
                Login Now
              </Link>
            </div>

            {submitError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", marginBottom: "18px" }}>
                {submitError}
              </div>
            )}

            <div className="hol-bf-grid">
              {/* Left Column: Customer Details Form Card */}
              <div className="hol-bf-left-card">
                <h2 id="booking-flow-title" className="hol-bf-card-title">
                  Customer Details
                </h2>
                <EnquiryStockNote stock={pkg.stock} noun="package" />

                <form onSubmit={handleSubmit}>
                  {/* Full Name */}
                  <div className="hol-bf-form-group">
                    <label className="hol-bf-label" htmlFor="bf-name">
                      Full Name
                    </label>
                    <input
                      id="bf-name"
                      type="text"
                      required
                      className="hol-bf-input"
                      placeholder="Enter your full name"
                      value={fullName}
                      disabled={submitting}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  {/* Email */}
                  <div className="hol-bf-form-group">
                    <label className="hol-bf-label" htmlFor="bf-email">
                      Email
                    </label>
                    <input
                      id="bf-email"
                      type="email"
                      required
                      className="hol-bf-input"
                      placeholder="Enter your email"
                      value={email}
                      disabled={submitting}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="hol-bf-email-notice">
                      <span>ⓘ</span>
                      <span>Check email carefully - all updates will be sent here.</span>
                    </div>
                  </div>

                  {/* Phone & Nationality 2-column row */}
                  <div className="hol-bf-row-2col">
                    <div className="hol-bf-form-group">
                      <label className="hol-bf-label" htmlFor="bf-phone">
                        Phone Number
                      </label>
                      <div className="hol-bf-phone-box">
                        <select
                          className="hol-bf-country-select"
                          value={countryCode}
                          disabled={submitting}
                          onChange={(e) => setCountryCode(e.target.value)}
                          aria-label="Select Country Code"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <div className="hol-bf-phone-divider" />
                        <input
                          id="bf-phone"
                          type="tel"
                          required
                          className="hol-bf-phone-input"
                          placeholder="Enter your phone number"
                          value={phone}
                          disabled={submitting}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                        {phone && (
                          <button
                            type="button"
                            className="hol-bf-clear-btn"
                            onClick={() => setPhone("")}
                            aria-label="Clear phone number"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="hol-bf-form-group">
                      <label className="hol-bf-label" htmlFor="bf-nationality">
                        Nationality
                      </label>
                      <select
                        id="bf-nationality"
                        className="hol-bf-select"
                        value={nationality}
                        disabled={submitting}
                        onChange={(e) => setNationality(e.target.value)}
                      >
                        {NATIONALITIES.map((nat) => (
                          <option key={nat} value={nat}>
                            {nat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Consent (required by the API) */}
                  <label className="hol-bf-checkbox-label">
                    <input
                      type="checkbox"
                      checked={consent}
                      disabled={submitting}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>I agree to be contacted about this request</span>
                  </label>

                  {/* Do not send offers checkbox */}
                  <label className="hol-bf-checkbox-label">
                    <input
                      type="checkbox"
                      checked={optOutMarketing}
                      disabled={submitting}
                      onChange={(e) => setOptOutMarketing(e.target.checked)}
                    />
                    <span>Do not send me offers via Email, SMS, RCS, WhatsApp and other electronic channels</span>
                  </label>

                  {/* Action buttons bar */}
                  <div className="hol-bf-actions-row">
                    <button type="button" className="hol-bf-btn-back" onClick={onClose}>
                      ← Go back
                    </button>
                    <button type="submit" className="hol-bf-btn-submit" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Inquiry Summary Card */}
              <div className="hol-bf-right-card">
                <h3 className="hol-bf-summary-title">Inquiry Summary</h3>

                {/* Package Thumbnail & Metadata */}
                <div className="hol-bf-pkg-preview">
                  <div className="hol-bf-pkg-thumb-wrap">
                    <img src={coverImg} alt={pkg.title} onError={showFallback} />
                    <span className="hol-bf-duration-tag">{durationStr}</span>
                  </div>
                  <div className="hol-bf-pkg-info">
                    <div className="hol-bf-pkg-title">{pkg.title}</div>
                    <div className="hol-bf-pkg-meta">
                      <span>📅 {travelDate}</span>
                      <span>👥 {travelers.label}</span>
                    </div>
                  </div>
                </div>

                {/* Price Display */}
                <div className="hol-bf-price-row">
                  <span className="hol-bf-price-label">Starts from</span>
                  <span className="hol-bf-price-value">{displayPrice}</span>
                </div>

                {/* Submit Request Button on Right */}
                <button
                  type="button"
                  className="hol-bf-btn-submit-side"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>

                {/* Why choose Karnish Tourism? */}
                <div className="hol-bf-trust-box">
                  <div className="hol-bf-trust-title">Why choose Karnish Tourism?</div>
                  <ul className="hol-bf-trust-items">
                    <li className="hol-bf-trust-item">
                      <span className="hol-bf-trust-icon">🪙</span>
                      <span>Best Price Guarantee</span>
                    </li>
                    <li className="hol-bf-trust-item">
                      <span className="hol-bf-trust-icon">🛡️</span>
                      <span>Secure Online Transaction</span>
                    </li>
                    <li className="hol-bf-trust-item">
                      <span className="hol-bf-trust-icon">💬</span>
                      <span>24X7 Live Chat Support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* Daywise Details Modal ---------------------------------------------- */

function DayDetailModal({ day, onClose }) {
  if (!day) return null;

  return (
    <div className="hol-quote-overlay" role="dialog" aria-modal="true" aria-labelledby="day-modal-title" onClick={onClose}>
      <div className="hol-quote-dialog hol-day-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="hol-quote-close" aria-label="Close modal" onClick={onClose}>
          <IconX />
        </button>
        <div className="hol-day-modal-hero">
          <img src={day.photo} alt={day.title} onError={showFallback} />
          <span className="hol-day-modal-badge">Day {day.day}</span>
        </div>
        <div className="hol-day-modal-content">
          <h2 id="day-modal-title">{day.title}</h2>
          <p className="hol-day-modal-desc">{day.description}</p>
          {day.bulletPoints?.length ? (
            <ul className="hol-day-modal-timeline" aria-label="Day highlights">
              {day.bulletPoints.map((point, index) => (
                <li className="hol-timeline-step" key={`${point}-${index}`}>
                  <span className="hol-timeline-dot" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="button" className="mk-btn hol-day-modal-btn" onClick={onClose}>
            Back to Itinerary
          </button>
        </div>
      </div>
    </div>
  );
}

/* Booking / Modify Search Form Content Component -------------------- */

function BookingCardContent({
  pkg,
  adults,
  setAdults,
  children,
  setChildren,
  infants,
  setInfants,
  travelersText,
  travelersOpen,
  setTravelersOpen,
  travelDate,
  travelDateIso,
  setTravelDate,
  setTravelDateIso,
  calendarOpen,
  setCalendarOpen,
  priceDetailsOpen,
  setPriceDetailsOpen,
  handleAddToCart,
  cartToast,
  adultUnitPrice,
  childUnitPrice,
  adultSubtotal,
  childSubtotal,
  totalAmount,
  totalWasAmount,
  totalSavings,
  currency,
  previewThumb,
  price,
  waMessage,
  onProceed,
}) {
  return (
    <>
      <h3 className="hol-booking-card-head">Modify Search</h3>

      {/* Who's traveling */}
      <div className="hol-picker-field-group">
        <label className="hol-picker-label">Who&apos;s traveling?</label>
        <div className="hol-field-relative">
          <button
            type="button"
            className="hol-picker-input-box"
            onClick={() => {
              setTravelersOpen((prev) => !prev);
              setCalendarOpen(false);
            }}
            aria-expanded={travelersOpen}
          >
            <IconUser className="hol-input-icon" width="18" height="18" />
            <span className="hol-input-value">{travelersText}</span>
            <IconChevron dir={travelersOpen ? "down" : "right"} className="hol-input-chev" width="16" height="16" />
          </button>

          {/* Travelers Counter Popover */}
          {travelersOpen && (
            <div className="hol-travelers-popover" role="dialog" aria-label="Select travelers">
              <div className="hol-pop-counter-row">
                <div className="hol-pop-desc">
                  <strong>Adults</strong>
                  <span>Age 12+</span>
                </div>
                <div className="hol-counter-actions">
                  <button
                    type="button"
                    disabled={adults <= 1}
                    onClick={() => setAdults((a) => Math.max(1, a - 1))}
                    aria-label="Decrease adults"
                  >
                    <IconMinus width="14" height="14" />
                  </button>
                  <span>{adults}</span>
                  <button
                    type="button"
                    disabled={adults >= 10}
                    onClick={() => setAdults((a) => a + 1)}
                    aria-label="Increase adults"
                  >
                    <IconPlus width="14" height="14" />
                  </button>
                </div>
              </div>

              <div className="hol-pop-counter-row">
                <div className="hol-pop-desc">
                  <strong>Children</strong>
                  <span>Age 2-11</span>
                </div>
                <div className="hol-counter-actions">
                  <button
                    type="button"
                    disabled={children <= 0}
                    onClick={() => setChildren((c) => Math.max(0, c - 1))}
                    aria-label="Decrease children"
                  >
                    <IconMinus width="14" height="14" />
                  </button>
                  <span>{children}</span>
                  <button
                    type="button"
                    disabled={children >= 8}
                    onClick={() => setChildren((c) => c + 1)}
                    aria-label="Increase children"
                  >
                    <IconPlus width="14" height="14" />
                  </button>
                </div>
              </div>

              <div className="hol-pop-counter-row">
                <div className="hol-pop-desc">
                  <strong>Infants</strong>
                  <span>Under 2</span>
                </div>
                <div className="hol-counter-actions">
                  <button
                    type="button"
                    disabled={infants <= 0}
                    onClick={() => setInfants((inf) => Math.max(0, inf - 1))}
                    aria-label="Decrease infants"
                  >
                    <IconMinus width="14" height="14" />
                  </button>
                  <span>{infants}</span>
                  <button
                    type="button"
                    disabled={infants >= 4}
                    onClick={() => setInfants((inf) => inf + 1)}
                    aria-label="Increase infants"
                  >
                    <IconPlus width="14" height="14" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="hol-pop-apply-btn"
                onClick={() => setTravelersOpen(false)}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* When are you traveling */}
      <div className="hol-picker-field-group">
        <label className="hol-picker-label">When are you traveling?</label>
        <div className="hol-field-relative">
          <button
            type="button"
            className="hol-picker-input-box"
            onClick={() => {
              setCalendarOpen((prev) => !prev);
              setTravelersOpen(false);
            }}
            aria-expanded={calendarOpen}
          >
            <IconCalendar className="hol-input-icon" width="18" height="18" />
            <span className="hol-input-value">{travelDate}</span>
            <IconChevron dir={calendarOpen ? "down" : "right"} className="hol-input-chev" width="16" height="16" />
          </button>

          {calendarOpen && (
            <PremiumDatePicker
              value={travelDateIso}
              currency={pkg.price?.currency || "AED"}
              onSelect={(formatted, iso) => {
                setTravelDate(formatted);
                setTravelDateIso(iso);
                setCalendarOpen(false);
              }}
              onClose={() => setCalendarOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Selected package mini preview card */}
      <div className="hol-mini-pkg-preview">
        <div className="hol-mini-pkg-img">
          <img src={previewThumb} alt={pkg.title} onError={showFallback} />
        </div>
        <div className="hol-mini-pkg-info">
          <strong className="hol-mini-pkg-title">{pkg.title}</strong>
          <div className="hol-mini-pkg-meta-item">
            <IconCalendar width="13" height="13" />
            <span>{travelDate}</span>
          </div>
          <div className="hol-mini-pkg-meta-item is-transfer">
            <IconTransferSwap width="13" height="13" />
            <span>Return Transfers Included</span>
          </div>
        </div>
      </div>

      {/* Dynamic Price Breakdown Section */}
      <div className="hol-price-details-section">
        <button
          type="button"
          className="hol-price-details-toggle"
          onClick={() => setPriceDetailsOpen((prev) => !prev)}
          aria-expanded={priceDetailsOpen}
        >
          <span>Price details of</span>
          <IconChevron dir={priceDetailsOpen ? "down" : "right"} width="14" height="14" />
        </button>

        {priceDetailsOpen && (
          <div className="hol-price-breakdown-table">
            <div className="hol-breakdown-row">
              <span className="hol-breakdown-label">
                {adults} {adults === 1 ? "adult" : "adults"} x {formatPrice(adultUnitPrice, currency)}
              </span>
              <strong className="hol-breakdown-value">{formatPrice(adultSubtotal, currency)}</strong>
            </div>

            {children > 0 && (
              <div className="hol-breakdown-row">
                <span className="hol-breakdown-label">
                  {children} {children === 1 ? "child" : "children"} x {formatPrice(childUnitPrice, currency)}
                </span>
                <strong className="hol-breakdown-value">{formatPrice(childSubtotal, currency)}</strong>
              </div>
            )}

            {infants > 0 && (
              <div className="hol-breakdown-row">
                <span className="hol-breakdown-label">
                  {infants} {infants === 1 ? "infant" : "infants"} (Under 2)
                </span>
                <span className="hol-breakdown-free-badge">FREE</span>
              </div>
            )}

            {totalSavings > 0 && (
              <div className="hol-breakdown-row is-savings">
                <span className="hol-breakdown-label">Discounted savings</span>
                <span className="hol-breakdown-save-num">-{formatPrice(totalSavings, currency)}</span>
              </div>
            )}
          </div>
        )}

        <div className="hol-total-payable-row">
          <div className="hol-total-left">
            <span className="hol-total-payable-label">Total Payable</span>
            {totalWasAmount > totalAmount && (
              <s className="hol-total-was-amount">{formatPrice(totalWasAmount, currency)}</s>
            )}
          </div>
          <div className="hol-total-right">
            <strong className="hol-total-payable-num">{formatPrice(totalAmount, currency)}</strong>
            {price?.save ? <span className="hol-save-pill">Save {price.save}%</span> : null}
          </div>
        </div>
      </div>

      {/* Action Buttons: Cart + Proceed to Book + WhatsApp */}
      <div className="hol-booking-actions-row">

        <button
          type="button"
          className="hol-btn-proceed-book"
          onClick={onProceed}
        >
          Get Quote
        </button>

        <HolidayWhatsAppButton
          message={waMessage}
          size="circle"
          className="hol-btn-wa-circle"
          ariaLabel="Contact us on WhatsApp"
        />
      </div>

      {/* Free Cancellation Trust Box */}
      <div className="hol-free-cancellation-box">
        <div className="hol-free-canc-icon">
          <IconRefund width="20" height="20" />
        </div>
        <div className="hol-free-canc-text">
          <strong>Free cancellation</strong>
          <p>Up to 24 hours in advance for a full refund</p>
        </div>
      </div>
    </>
  );
}

/* Main Holiday Detail Component -------------------------------------- */

export default function HolidayDetail({ pkg, related }) {
  const rootRef = useRef(null);
  const { user } = useApp();
  const router = useRouter();
  const price = priceOf(pkg);
  const enquiryHref = `/contact?subject=${encodeURIComponent(pkg.title)}`;

  // Ensure minimum 5 images for mosaic gallery
  const mosaicImages = useMemo(() => {
    const raw = (pkg.images && pkg.images.length > 0)
      ? pkg.images.map((img) => (typeof img === "string" ? { url: img, alt: pkg.title } : img))
      : [{ url: pkg.coverImage || FALLBACK_IMG, alt: pkg.title }];

    const result = [...raw];
    let fallbackIdx = 0;
    while (result.length < 5) {
      result.push({
        url: GALLERY_FALLBACKS[fallbackIdx % GALLERY_FALLBACKS.length],
        alt: `${pkg.title} view ${result.length + 1}`,
      });
      fallbackIdx++;
    }
    return result;
  }, [pkg]);
  const additionalPackageImages = useMemo(() => (pkg.images || [])
    .map((img) => (typeof img === "string" ? { url: img, alt: pkg.title } : img))
    .filter((img) => img?.url)
    .slice(1, 20), [pkg.images, pkg.title]);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightboxAt = useCallback((index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  // Share button state
  const [copied, setCopied] = useState(false);
  const [mapInteractive, setMapInteractive] = useState(false);
  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: pkg.title,
          text: `Check out ${pkg.title} package on Karnish Tourism!`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  }, [pkg.title]);

  // Travelers Selector state
  const [travelersOpen, setTravelersOpen] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const travelersText = useMemo(() => {
    const total = adults + children;
    if (children === 0) return `${adults} adult${adults > 1 ? "s" : ""}`;
    return `${adults} adult${adults > 1 ? "s" : ""}, ${children} child${children > 1 ? "ren" : ""}`;
  }, [adults, children]);

  // Travel Date Picker state
  const defaultDateStr = useMemo(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }, []);

  const [travelDate, setTravelDate] = useState(defaultDateStr);
  const [travelDateIso, setTravelDateIso] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Price breakdown toggle & Cart feedback
  const [priceDetailsOpen, setPriceDetailsOpen] = useState(true);
  const [cartToast, setCartToast] = useState(false);

  const handleAddToCart = useCallback(() => {
    setCartToast(true);
    setTimeout(() => setCartToast(false), 2400);
  }, []);

  // Dynamic price calculation based on number of persons selected
  const currency = price?.current?.currency || pkg.price?.currency || "AED";
  const adultUnitPrice = Number(price?.current?.amount) || 1590;
  // Children priced at 65% of adult rate
  const childUnitPrice = Math.round(adultUnitPrice * 0.65);

  const adultSubtotal = adults * adultUnitPrice;
  const childSubtotal = children * childUnitPrice;
  const totalAmount = adultSubtotal + childSubtotal;

  // Struck-through list price calculation (was price)
  const adultWasPrice = price?.was?.amount || (price?.save ? Math.round(adultUnitPrice / (1 - price.save / 100)) : 0);
  const childWasPrice = adultWasPrice ? Math.round(adultWasPrice * 0.65) : 0;
  const totalWasAmount = adultWasPrice ? adults * adultWasPrice + children * childWasPrice : 0;
  const totalSavings = totalWasAmount > totalAmount ? totalWasAmount - totalAmount : 0;

  // Selected package preview thumbnail
  const previewThumb = mosaicImages?.[0]?.url || pkg.coverImage || FALLBACK_IMG;

  // Quote modal state
  const [quoteOpen, setQuoteOpen] = useState(false);
  const openQuote = useCallback(() => {
    if (!user) router.push(loginUrlFor(currentPath(), "quote"));
    else setQuoteOpen(true);
  }, [user, router]);

  // Mobile Booking Drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (!mobileDrawerOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMobileDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileDrawerOpen]);

  // Selected Day modal state
  const [selectedDay, setSelectedDay] = useState(null);

  // Accordion state (key details open by default so travelers see full inclusions & exclusions immediately)
  const [openAccordions, setOpenAccordions] = useState({
    overview: true,
    inclusion: true,
    exclusion: true,
    departure: true,
    flights: false,
    visa: false,
    important: false,
    booking: false,
    payment: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

function resolveDayBulletPoints(day) {
  if (Array.isArray(day?.bulletPoints) && day.bulletPoints.length > 0) {
    return day.bulletPoints.filter(Boolean);
  }
  if (!day?.description) return [];

  if (day.description.includes("\n") || day.description.includes("•")) {
    const lines = day.description
      .split(/[\n•]/)
      .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
      .filter((s) => s.length > 3);
    if (lines.length > 1) return lines;
  }

  const titleLower = (day.title || "").toLowerCase();
  const descLower = (day.description || "").toLowerCase();

  if (titleLower.includes("arrival") || descLower.includes("arrival") || descLower.includes("landing")) {
    const pts = ["Airport reception & comfortable private transfer", "Smooth hotel check-in & leisure time"];
    if (descLower.includes("coffee") || descLower.includes("dates")) {
      pts.push("Welcome Arabic coffee & dates hospitality");
    } else if (descLower.includes("cruise") || descLower.includes("dinner")) {
      pts.push("Evening marina dinner cruise with live entertainment");
    } else {
      pts.push("Evening at leisure to explore nearby areas");
    }
    return pts;
  }

  if (titleLower.includes("departure") || descLower.includes("departure") || descLower.includes("airport")) {
    return [
      "Complimentary breakfast at hotel",
      "Leisure morning & check-out assistance",
      "Private transfer to airport for departure flight",
    ];
  }

  if (titleLower.includes("heritage") || descLower.includes("culture") || descLower.includes("museum")) {
    return [
      "Guided walk through historic wind-tower quarter",
      "Visits to cultural museums & local art galleries",
      "Traditional storytelling with an expert guide",
    ];
  }

  if (titleLower.includes("mosque") || descLower.includes("cooking") || descLower.includes("lunch")) {
    return [
      "Guided mosque visit & architectural tour",
      "Hands-on culinary workshop & cooking lesson",
      "Shared traditional lunch with regional flavors",
    ];
  }

  if (titleLower.includes("safari") || descLower.includes("desert") || descLower.includes("dune")) {
    return [
      "Thrilling 4x4 desert dune bashing session",
      "Scenic sunset photography stop in the desert",
      "Barbecue dinner buffet & cultural show",
    ];
  }

  if (titleLower.includes("city") || descLower.includes("tour")) {
    return [
      "Comprehensive guided city sightseeing tour",
      "Iconic photo stops at major landmark attractions",
      "Free time for shopping & self-guided exploration",
    ];
  }

  const sentences = day.description
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().replace(/\.+$/, ""))
    .filter((s) => s.length > 6);
  if (sentences.length >= 2) {
    return sentences.slice(0, 3);
  }

  return [day.description];
}

  // Daywise Itinerary list
  const itineraryDays = useMemo(() => {
    const days = pkg.itinerary?.length ? [...pkg.itinerary].sort((a, b) => a.day - b.day) : [];
    if (days.length === 0) {
      days.push(
        {
          day: 1,
          title: "Arrival & Dhow Cruise Marina Dinner",
          description:
            "Upon landing in Dubai, enjoy a smooth transfer to your hotel. Check into your room and later set out for a magical evening cruise at Dubai Marina with buffet dining and live music.",
        },
        {
          day: 2,
          title: "Dubai City Tour & Departure",
          description:
            "Kick off your day with a guided city tour covering Dubai's iconic landmarks, cultural gems, photo stops at Burj Al Arab and Burj Khalifa, followed by private airport transfer.",
        }
      );
    }
    return days.map((d, i) => ({
      ...d,
      photo: ITINERARY_PHOTOS[i % ITINERARY_PHOTOS.length],
    }));
  }, [pkg.itinerary]);

  // Customer Reviews filtering
  const [reviewFilter, setReviewFilter] = useState("all"); // 'all', 'images', '4star', '3star'
  const filteredReviews = useMemo(() => {
    if (reviewFilter === "images") return SAMPLE_REVIEWS.filter((r) => r.hasImages);
    if (reviewFilter === "4star") return SAMPLE_REVIEWS.filter((r) => r.rating >= 4);
    if (reviewFilter === "3star") return SAMPLE_REVIEWS.filter((r) => r.rating === 3);
    return SAMPLE_REVIEWS;
  }, [reviewFilter]);
  const activityStyleReviews = useMemo(() => {
    const items = SAMPLE_REVIEWS.map((review) => ({ id: review.id, displayName: review.name, rating: review.rating, title: review.packageTag, body: review.comment, createdAt: review.date, images: review.images || [], verified: true }));
    const count = items.length;
    const average = count ? items.reduce((sum, review) => sum + review.rating, 0) / count : 0;
    return { summary: { average, count, breakdown: { excellent: items.filter((review) => review.rating === 5).length, veryGood: items.filter((review) => review.rating === 4).length, average: items.filter((review) => review.rating === 3).length, poor: items.filter((review) => review.rating === 2).length, terrible: items.filter((review) => review.rating === 1).length } }, items, pagination: { pages: 1, page: 1, total: count, limit: count } };
  }, []);

  // Rails for Hotel Options and Customer Photos
  const hotelsRailRef = useRef(null);
  const photosRailRef = useRef(null);

  const scrollRail = (ref, dir) => {
    if (ref.current) {
      const step = ref.current.clientWidth * 0.75 * dir;
      ref.current.scrollBy({ left: step, behavior: "smooth" });
    }
  };

  useEffect(() => {
    recordRecentHoliday(pkg.slug);
  }, [pkg.slug]);

  useReveal(rootRef, pkg.slug);
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(id);
  }, [pkg.slug]);

  // WhatsApp click handler
  const waMessage = encodeURIComponent(
    `Hello Karnish Tourism! I am interested in booking "${pkg.title}".\n` +
    `• Travelers: ${travelersText}\n` +
    `• Travel Date: ${travelDate}\n` +
    `• Total Payable: ${formatPrice(totalAmount, currency)}\n` +
    `• Duration: ${durationLabel(pkg)}\n` +
    `Please share the booking confirmation and details.`
  );
  const waUrl = `https://wa.me/971500000000?text=${waMessage}`;

  const destinationName = pkg.destinations?.[0] || "Dubai";
  const durationText = `${pkg.durationNights || 1}N / ${pkg.durationDays || (pkg.durationNights ? pkg.durationNights + 1 : 2)}D`;
  const locationLabel = [destinationName, pkg.country].filter(Boolean).join(", ");
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(locationLabel)}&output=embed&iwloc=0`;

  return (
    <div className="hol-page hol-detail-screen is-activity-layout" ref={rootRef}>
      <div className="mk-container">
        {/* 1. Breadcrumbs */}
        <nav className="hol-crumbs hol-crumbs-premium" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/holidays">Holidays</Link></li>
            <li>
              <Link href={`/holidays/destination/${encodeURIComponent(destinationName)}${pkg.country ? `?country=${encodeURIComponent(pkg.country)}` : ""}`}>
                {destinationName} City
              </Link>
            </li>
            <li aria-current="page">{pkg.title}</li>
          </ol>
        </nav>

        {/* 2. Header: Title, Rating, Wishlist & Share */}
        <div className="hol-detail-header-block" data-reveal>
          <div className="hol-detail-title-col">
            <h1 className="hol-package-heading">{pkg.title}</h1>
            <StockHead stock={pkg.stock} />
            <div className="hol-head-rating-line">
              <a href="#customer-reviews" className="hol-head-rating-badge" aria-label="Customer Reviews">
                <IconStar className="hol-star-gold" width="17" height="17" />
                <strong>{pkg.rating?.average || 4.8}</strong>
                <span>({pkg.rating?.count || 119} Reviews)</span>
              </a>
            </div>
          </div>

          <div className="hol-head-actions-col">
            <WishButton slug={pkg.slug} title={pkg.title} label className="hol-detail-wish-btn" />

            <div className="hol-share-wrap">
              <button
                type="button"
                className="hol-detail-share-btn"
                onClick={handleShare}
                aria-label="Share this holiday package"
              >
                <IconShare width="18" height="18" />
                <span>Share</span>
              </button>
              {copied && <span className="hol-share-toast" role="status">Link copied!</span>}
            </div>
          </div>
        </div>

        {/* 3. 5-Image Mosaic Gallery Grid */}
        <section className="hol-mosaic-gallery" aria-label="Photo gallery" data-reveal>
          {/* Main Large Left Photo */}
          <div
            className="hol-mosaic-left"
            onClick={() => openLightboxAt(0)}
            role="button"
            tabIndex={0}
            aria-label="View photo 1 in full screen"
          >
            <img
              src={mosaicImages[0].url}
              alt={mosaicImages[0].alt}
              loading="eager"
              decoding="async"
              onError={showFallback}
            />
            <span className="hol-mosaic-dur-badge">
              <IconMoon width="15" height="15" />
              {durationText}
            </span>
          </div>

          {/* 4 Photos on Right (2x2) */}
          <div className="hol-mosaic-right">
            {mosaicImages.slice(1, 5).map((img, idx) => {
              const photoIndex = idx + 1;
              const isLast = idx === 3;
              return (
                <div
                  key={img.url + idx}
                  className="hol-mosaic-thumb-box"
                  onClick={() => openLightboxAt(photoIndex)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View photo ${photoIndex + 1} in full screen`}
                >
                  <img src={img.url} alt={img.alt} loading="lazy" decoding="async" onError={showFallback} />
                  {isLast && (
                    <button
                      type="button"
                      className="hol-mosaic-see-more-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightboxAt(photoIndex);
                      }}
                    >
                      <IconCamera width="17" height="17" />
                      <span>See More</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {additionalPackageImages.length > 0 && (
          <div className="hol-extra-gallery" aria-label="More package photos" data-reveal>
            {additionalPackageImages.map((img, index) => (
              <button key={`${img.url}-${index}`} type="button" onClick={() => openLightboxAt(index + 1)} aria-label={`Open package photo ${index + 2}`}>
                <img src={img.url} alt={img.alt || ""} loading="lazy" decoding="async" onError={showFallback} />
              </button>
            ))}
          </div>
        )}

        {/* Main Content Grid: Left Sections vs Right Sticky Sidebar */}
        <div className="hol-detail-layout-grid">
          {/* LEFT COLUMN: Features, Itinerary, Hotels, Accordions, Reviews */}
          <div className="hol-detail-left-col">
            <section className="hol-section-block hol-activity-overview" aria-labelledby="holiday-about-heading" data-reveal>
              <div className="hol-section-kicker">Overview</div>
              <h2 id="holiday-about-heading">About this experience</h2>
              <p>{pkg.summary || pkg.description || `Discover ${destinationName} with a carefully planned holiday package that brings together accommodation, transfers and memorable experiences.`}</p>
              {pkg.description && pkg.summary ? <p>{pkg.description}</p> : null}
              <ul className="hol-amenity-bullets" aria-label="Package essentials">
                <li><span aria-hidden="true">🏨</span>Hotel stay</li>
                <li><span aria-hidden="true">🎟️</span>Entry tickets</li>
                <li><span aria-hidden="true">🍽️</span>Meals</li>
                <li><span aria-hidden="true">🧭</span>Activities</li>
                <li><span aria-hidden="true">🚐</span>Transfers</li>
              </ul>
              <div className="hol-experience-details">
                <span><strong>Duration</strong>{durationText}</span>
                <span><strong>Destination</strong>{destinationName}</span>
                <span><strong>Stay</strong>Selected hotel accommodation</span>
                <span><strong>Support</strong>Tourvex travel assistance</span>
              </div>
            </section>

            <div className="hol-activity-pair" data-reveal>
              <section className="hol-section-block is-compact" aria-labelledby="holiday-highlights-heading">
                <div className="hol-section-kicker">Best moments</div>
                <h2 id="holiday-highlights-heading">Experience highlights</h2>
                <ul className="hol-activity-checklist">
                  {(pkg.highlights?.length ? pkg.highlights : itineraryDays.slice(0, 5).map((day) => day.title)).map((item, index) => <li key={index}><IconCheck width="13" height="13" />{typeof item === "string" ? item : item.title}</li>)}
                </ul>
              </section>
              <section className="hol-section-block is-compact" aria-labelledby="holiday-included-heading">
                <div className="hol-section-kicker">Your booking</div>
                <h2 id="holiday-included-heading">What&apos;s included</h2>
                <ul className="hol-activity-checklist">
                  {(pkg.inclusions?.length ? pkg.inclusions : ["Hotel accommodation", "Selected transfers", "Planned sightseeing", "Travel support"]).slice(0, 6).map((item, index) => <li key={index}><IconCheck width="13" height="13" />{item}</li>)}
                </ul>
              </section>
            </div>

            <section className="hol-section-block hol-activity-excluded" aria-labelledby="holiday-excluded-heading" data-reveal>
              <div className="hol-section-kicker">Please note</div>
              <h2 id="holiday-excluded-heading">What&apos;s not included</h2>
              <ul className="hol-activity-checklist is-negative">
                {(pkg.exclusions?.length ? pkg.exclusions : ["International flights unless specified", "Personal expenses", "Optional upgrades", "Travel insurance"]).slice(0, 7).map((item, index) => <li key={index}><IconX width="13" height="13" />{item}</li>)}
              </ul>
            </section>

            {/* 5. Daywise Itinerary Simple Cards */}
            <section className="hol-section-block" aria-labelledby="daywise-heading" data-reveal>
              <div className="hol-section-header-row">
                <h2 id="daywise-heading">Daywise Itinerary</h2>
              </div>

              <div className="hol-itinerary-cards-grid">
                {itineraryDays.map((d) => {
                  const bullets = resolveDayBulletPoints(d);
                  return (
                    <article key={d.day} className="hol-itinerary-simple-card">
                      <div className="hol-itinerary-card-top">
                        <span className="hol-itinerary-day-tag">Day {d.day}</span>
                        <h3 className="hol-itinerary-card-title">{d.title}</h3>
                      </div>
                      <p className="hol-itinerary-card-desc">{d.description}</p>
                      {bullets.length > 0 ? (
                        <ul className="hol-itinerary-bullets" aria-label={`Day ${d.day} highlights`}>
                          {bullets.map((point, index) => (
                            <li key={`${point}-${index}`} className="hol-itinerary-bullet-item">
                              <span className="hol-itinerary-bullet-dot" aria-hidden="true" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>

            {/* 6. Hotel Options Carousel */}
            <section className="hol-section-block" aria-labelledby="hotels-heading" data-reveal>
              <div className="hol-section-header-row">
                <h2 id="hotels-heading">Hotel Options</h2>
                <div className="hol-section-arrows">
                  <button
                    type="button"
                    aria-label="Previous hotels"
                    onClick={() => scrollRail(hotelsRailRef, -1)}
                  >
                    <IconChevron dir="left" width="18" height="18" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next hotels"
                    onClick={() => scrollRail(hotelsRailRef, 1)}
                  >
                    <IconChevron dir="right" width="18" height="18" />
                  </button>
                </div>
              </div>

              <div className="hol-hotels-carousel" ref={hotelsRailRef}>
                {SAMPLE_HOTELS.map((hotel, i) => (
                  <div key={hotel.name + i} className="hol-hotel-card">
                    <div className="hol-hotel-media">
                      <img src={hotel.image} alt={hotel.name} loading="lazy" onError={showFallback} />
                    </div>
                    <div className="hol-hotel-body">
                      <h3 className="hol-hotel-name">{hotel.name}</h3>
                      <div className="hol-hotel-stars" aria-label={`${hotel.stars} star hotel`}>
                        {Array.from({ length: 5 }).map((_, s) => (
                          <IconStar
                            key={s}
                            width="14"
                            height="14"
                            className={s < hotel.stars ? "is-filled" : "is-empty"}
                          />
                        ))}
                        <span className="hol-hotel-star-text">{hotel.stars} Star Hotel</span>
                      </div>
                      <div className="hol-hotel-tags">
                        <span className="hol-hotel-loc-badge"><IconPin width="12" height="12" /> {hotel.location}</span>
                        {hotel.tags?.map((t) => (
                          <span key={t} className="hol-hotel-tag-chip">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 7. Comprehensive Accordions (9 Sections) */}
            <section className="hol-section-block" aria-label="Detailed package information" data-reveal>
              <div
                className="hol-accordions-group"
                onPointerOver={(event) => {
                  if (event.pointerType && event.pointerType !== "mouse") return;
                  const key = event.target.closest?.("[data-accordion]")?.dataset.accordion;
                  if (key) setOpenAccordions((current) => Object.fromEntries(Object.keys(current).map((name) => [name, name === key])));
                }}
                onFocusCapture={(event) => {
                  const key = event.target.closest?.("[data-accordion]")?.dataset.accordion;
                  if (key) setOpenAccordions((current) => Object.fromEntries(Object.keys(current).map((name) => [name, name === key])));
                }}
              >
                {/* 1. Overview */}
                <div data-accordion="overview" className={`hol-acc-item${openAccordions.overview ? " is-open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={openAccordions.overview}
                      onClick={() => toggleAccordion("overview")}
                    >
                      <span>Overview</span>
                      <IconChevron dir={openAccordions.overview ? "up" : "down"} />
                    </button>
                  </h3>
                  <div className="hol-acc-panel">
                    <div className="hol-acc-content">
                      <p className="hol-acc-lead">
                        {pkg.summary ||
                          `Spending just a few hours or a full stopover in ${destinationName}, and want to make every moment count? This curated holiday package transforms your visit into an unforgettable Arabian experience.`}
                      </p>
                      {pkg.description ? (
                        pkg.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)
                      ) : (
                        <p>
                          Thoughtfully curated with exclusive highlights and complete with roundtrip airport transfers,
                          visa assistance, and premier activities, this package features a guided city tour and a delightful
                          dinner dhow cruise at Dubai Marina, ensuring you enjoy the absolute best of the city with zero hassle.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Inclusion */}
                <div data-accordion="inclusion" className={`hol-acc-item${openAccordions.inclusion ? " is-open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={openAccordions.inclusion}
                      onClick={() => toggleAccordion("inclusion")}
                    >
                      <span>Inclusion</span>
                      <IconChevron dir={openAccordions.inclusion ? "up" : "down"} />
                    </button>
                  </h3>
                  <div className="hol-acc-panel">
                    <div className="hol-acc-content">
                      <ul className="hol-acc-list is-yes">
                        {(pkg.inclusions?.length ? pkg.inclusions : [
                          "Hotel Accommodation in selected category with daily breakfast",
                          "Roundtrip Airport Transfers in private sanitized vehicle",
                          "Dubai Marina Dhow Cruise with 5-star International Buffet Dinner",
                          "Half-day Dubai guided city tour covering top cultural & modern landmarks",
                          "All UAE hotel taxes, service charges and 5% VAT included",
                        ]).map((inc, i) => (
                          <li key={i}>
                            <span className="hol-acc-bullet is-check"><IconCheck width="14" height="14" strokeWidth="3" /></span>
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 3. Exclusion */}
                <div data-accordion="exclusion" className={`hol-acc-item${openAccordions.exclusion ? " is-open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={openAccordions.exclusion}
                      onClick={() => toggleAccordion("exclusion")}
                    >
                      <span>Exclusion</span>
                      <IconChevron dir={openAccordions.exclusion ? "up" : "down"} />
                    </button>
                  </h3>
                  <div className="hol-acc-panel">
                    <div className="hol-acc-content">
                      <ul className="hol-acc-list is-no">
                        {(pkg.exclusions?.length ? pkg.exclusions : [
                          "International or domestic flight tickets (available on request)",
                          "Tourism Dirham fee (payable directly at hotel check-in: approx AED 10-20/night)",
                          "UAE Entry Visa fees (unless expressly booked with visa option)",
                          "Meals and beverages not explicitly mentioned in inclusions",
                          "Personal expenses, tipping, and travel insurance",
                        ]).map((exc, i) => (
                          <li key={i}>
                            <span className="hol-acc-bullet is-x"><IconX width="14" height="14" strokeWidth="3" /></span>
                            <span>{exc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 4. Departure & Pricing */}
                <div data-accordion="departure" className={`hol-acc-item${openAccordions.departure ? " is-open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={openAccordions.departure}
                      onClick={() => toggleAccordion("departure")}
                    >
                      <span>Departure & Pricing</span>
                      <IconChevron dir={openAccordions.departure ? "up" : "down"} />
                    </button>
                  </h3>
                  <div className="hol-acc-panel">
                    <div className="hol-acc-content">
                      <p>
                        <strong>Departure Hub:</strong> Daily departures available from Dubai International Airport (DXB) and Al Maktoum Airport (DWC).
                      </p>
                      <p>
                        <strong>Pricing Basis:</strong> Prices are quoted per adult on a twin-sharing basis. Single supplements apply for solo travelers.
                        Children aged 2–11 receive subsidized pricing, and infants under 2 travel free of charge.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. Flights Details */}
                <div data-accordion="flights" className={`hol-acc-item${openAccordions.flights ? " is-open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={openAccordions.flights}
                      onClick={() => toggleAccordion("flights")}
                    >
                      <span>Flights Details</span>
                      <IconChevron dir={openAccordions.flights ? "up" : "down"} />
                    </button>
                  </h3>
                  <div className="hol-acc-panel">
                    <div className="hol-acc-content">
                      <p>
                        We coordinate transfers seamlessly with all international airline arrivals including Emirates,
                        flydubai, Air India, IndiGo, British Airways, and Lufthansa.
                      </p>
                      <p>
                        We recommend arriving before 14:00 on Day 1 to enjoy the evening Marina cruise comfortably.
                        Flight booking assistance and baggage allowance (30kg check-in + 7kg cabin) can be arranged with our ticketing desk.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6. Visa Details */}
                <div data-accordion="visa" className={`hol-acc-item${openAccordions.visa ? " is-open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={openAccordions.visa}
                      onClick={() => toggleAccordion("visa")}
                    >
                      <span>Visa Details</span>
                      <IconChevron dir={openAccordions.visa ? "up" : "down"} />
                    </button>
                  </h3>
                  <div className="hol-acc-panel">
                    <div className="hol-acc-content">
                      <p>
                        Our in-house visa department provides 30-Day and 60-Day UAE Tourist Visas with 24 to 48 business hours standard processing.
                      </p>
                      <p>
                        <strong>Required Documents:</strong> Color copy of passport (valid for minimum 6 months from entry date),
                        passport-size photograph on white background, and return flight itinerary.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 7. Important Information */}
                <div data-accordion="important" className={`hol-acc-item${openAccordions.important ? " is-open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={openAccordions.important}
                      onClick={() => toggleAccordion("important")}
                    >
                      <span>Important Information</span>
                      <IconChevron dir={openAccordions.important ? "up" : "down"} />
                    </button>
                  </h3>
                  <div className="hol-acc-panel">
                    <div className="hol-acc-content">
                      <p>
                        <strong>Dress Code:</strong> Modest, lightweight clothing recommended. Shoulders and knees must be covered
                        when visiting heritage areas and mosques.
                      </p>
                      <p>
                        <strong>Currency & Cards:</strong> UAE Dirham (AED). Credit/Debit cards are universally accepted.
                        Complimentary tourist SIM cards are provided upon immigration arrival at DXB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 8. Booking Policy */}
                <div data-accordion="booking" className={`hol-acc-item${openAccordions.booking ? " is-open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={openAccordions.booking}
                      onClick={() => toggleAccordion("booking")}
                    >
                      <span>Booking Policy</span>
                      <IconChevron dir={openAccordions.booking ? "up" : "down"} />
                    </button>
                  </h3>
                  <div className="hol-acc-panel">
                    <div className="hol-acc-content">
                      <p>
                        Instant booking confirmation upon receiving confirmation deposit. Complete travel vouchers,
                        hotel confirmation codes, and driver contact info are issued via email and WhatsApp 24 hours prior to travel.
                      </p>
                      <p>
                        Free date rescheduling is permitted up to 7 days before your arrival date.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 9. Payment Terms */}
                <div data-accordion="payment" className={`hol-acc-item${openAccordions.payment ? " is-open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={openAccordions.payment}
                      onClick={() => toggleAccordion("payment")}
                    >
                      <span>Payment Terms</span>
                      <IconChevron dir={openAccordions.payment ? "up" : "down"} />
                    </button>
                  </h3>
                  <div className="hol-acc-panel">
                    <div className="hol-acc-content">
                      <p>
                        Pay securely with 256-bit encrypted checkout via Visa, MasterCard, Apple Pay, or direct bank transfer.
                      </p>
                      <p>
                        25% token advance required to confirm booking. Balance payable 14 days prior to departure.
                        100% refund for cancellations made 15+ days prior to travel date.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 8. Location map — reviews follow it, matching the activity detail flow. */}
            {/* 9. Customer Reviews Section */}
            <section className="hol-section-block hol-legacy-reviews" aria-labelledby="reviews-heading" data-reveal>
              <div className="hol-section-header-row">
                <h2 id="reviews-heading">Customer Reviews</h2>
              </div>

              {/* Guest Rating Summary Box */}
              <div className="hol-guest-rating-card">
                <div className="hol-rating-score-box">
                  <span className="hol-score-label">Guest Rating</span>
                  <div className="hol-score-big-row">
                    <strong>4.8</strong>
                    <span>Out Of 5</span>
                  </div>
                  <span className="hol-score-sentiment">Excellent</span>
                  <span className="hol-score-count">Based on 119 Ratings</span>
                </div>

                <div className="hol-rating-bars-box">
                  <div className="hol-bar-row">
                    <span className="hol-bar-label">Excellent</span>
                    <div className="hol-bar-track">
                      <div className="hol-bar-fill is-green" style={{ width: "85%" }} />
                    </div>
                    <span className="hol-bar-val">101</span>
                  </div>

                  <div className="hol-bar-row">
                    <span className="hol-bar-label">Very Good</span>
                    <div className="hol-bar-track">
                      <div className="hol-bar-fill is-lime" style={{ width: "14%" }} />
                    </div>
                    <span className="hol-bar-val">17</span>
                  </div>

                  <div className="hol-bar-row">
                    <span className="hol-bar-label">Average</span>
                    <div className="hol-bar-track">
                      <div className="hol-bar-fill" style={{ width: "0%" }} />
                    </div>
                    <span className="hol-bar-val">0</span>
                  </div>

                  <div className="hol-bar-row">
                    <span className="hol-bar-label">Poor</span>
                    <div className="hol-bar-track">
                      <div className="hol-bar-fill" style={{ width: "0%" }} />
                    </div>
                    <span className="hol-bar-val">0</span>
                  </div>

                  <div className="hol-bar-row">
                    <span className="hol-bar-label">Terrible</span>
                    <div className="hol-bar-track">
                      <div className="hol-bar-fill is-red" style={{ width: "1%" }} />
                    </div>
                    <span className="hol-bar-val">1</span>
                  </div>
                </div>
              </div>

              {/* Photos from our customers */}
              <div className="hol-customer-photos-section">
                <div className="hol-photos-head-row">
                  <h3>Photos from our customers</h3>
                  <div className="hol-section-arrows">
                    <button
                      type="button"
                      aria-label="Previous customer photos"
                      onClick={() => scrollRail(photosRailRef, -1)}
                    >
                      <IconChevron dir="left" width="16" height="16" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next customer photos"
                      onClick={() => scrollRail(photosRailRef, 1)}
                    >
                      <IconChevron dir="right" width="16" height="16" />
                    </button>
                  </div>
                </div>

                <div className="hol-customer-photos-rail" ref={photosRailRef}>
                  {CUSTOMER_PHOTOS.map((src, i) => (
                    <div
                      key={src + i}
                      className="hol-customer-photo-item"
                      onClick={() => openLightboxAt(i % mosaicImages.length)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View customer photo ${i + 1}`}
                    >
                      <img src={src} alt={`Customer travel photo ${i + 1}`} loading="lazy" onError={showFallback} />
                    </div>
                  ))}
                </div>
              </div>

              {/* What our customers say */}
              <div className="hol-customer-reviews-list-block">
                <div className="hol-reviews-subhead-row">
                  <h3>What our customers say</h3>
                </div>

                {/* Filter chips & sort */}
                <div className="hol-reviews-filter-bar">
                  <div className="hol-review-chips">
                    <button
                      type="button"
                      className={`hol-rev-chip${reviewFilter === "images" ? " is-active" : ""}`}
                      onClick={() => setReviewFilter(reviewFilter === "images" ? "all" : "images")}
                    >
                      <IconCamera width="15" height="15" />
                      <span>With Images</span>
                      {reviewFilter === "images" && <IconX width="12" height="12" />}
                    </button>

                    <button
                      type="button"
                      className={`hol-rev-chip${reviewFilter === "4star" ? " is-active" : ""}`}
                      onClick={() => setReviewFilter(reviewFilter === "4star" ? "all" : "4star")}
                    >
                      <IconStar width="14" height="14" />
                      <span>4+ Stars</span>
                    </button>

                    <button
                      type="button"
                      className={`hol-rev-chip${reviewFilter === "3star" ? " is-active" : ""}`}
                      onClick={() => setReviewFilter(reviewFilter === "3star" ? "all" : "3star")}
                    >
                      <IconStar width="14" height="14" />
                      <span>3 Stars</span>
                    </button>
                  </div>

                  <div className="hol-reviews-sort">
                    <span className="hol-sort-tag">Most Recent</span>
                    <IconChevron dir="down" width="14" height="14" />
                  </div>
                </div>

                {/* Reviews Feed */}
                <div className="hol-reviews-cards-list">
                  {filteredReviews.map((rev) => (
                    <article key={rev.id} className="hol-review-card">
                      <div className="hol-rev-header">
                        <div className="hol-rev-avatar" style={{ backgroundColor: rev.avatarBg }}>
                          {rev.name[0]}
                        </div>
                        <div className="hol-rev-author-meta">
                          <strong className="hol-rev-name">{rev.name}</strong>
                          <span className="hol-rev-date">{rev.date}</span>
                        </div>
                      </div>

                      {rev.images?.length > 0 && (
                        <div className="hol-rev-images-row">
                          {rev.images.map((imgUrl, idx) => (
                            <div
                              key={imgUrl + idx}
                              className="hol-rev-thumb"
                              onClick={() => openLightboxAt(idx % mosaicImages.length)}
                              role="button"
                              tabIndex={0}
                            >
                              <img src={imgUrl} alt="Trip review attachment" loading="lazy" onError={showFallback} />
                            </div>
                          ))}
                        </div>
                      )}

                      <h4 className="hol-rev-pkg-title">{pkg.title || rev.packageTag}</h4>

                      <div className="hol-rev-rating-pill-row">
                        <div className="hol-rev-stars">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <IconStar
                              key={s}
                              width="14"
                              height="14"
                              className={s < rev.rating ? "is-filled" : "is-empty"}
                            />
                          ))}
                          <strong>{rev.rating}/5</strong>
                        </div>
                        <span className="hol-rev-dur-tag">{durationText}</span>
                      </div>

                      <p className="hol-rev-text">{rev.comment}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Sticky Booking Card & Why Choose Trust Box */}
          <aside className="hol-sticky-sidebar" aria-label="Booking and enquiry">
            {/* Sticky Card 1: Booking & Quote */}
            <div className="hol-booking-card" data-reveal>
              <BookingCardContent
                pkg={pkg}
                adults={adults}
                setAdults={setAdults}
                children={children}
                setChildren={setChildren}
                infants={infants}
                setInfants={setInfants}
                travelersText={travelersText}
                travelersOpen={travelersOpen}
                setTravelersOpen={setTravelersOpen}
                travelDate={travelDate}
                travelDateIso={travelDateIso}
                setTravelDate={setTravelDate}
                setTravelDateIso={setTravelDateIso}
                calendarOpen={calendarOpen}
                setCalendarOpen={setCalendarOpen}
                priceDetailsOpen={priceDetailsOpen}
                setPriceDetailsOpen={setPriceDetailsOpen}
                handleAddToCart={handleAddToCart}
                cartToast={cartToast}
                adultUnitPrice={adultUnitPrice}
                childUnitPrice={childUnitPrice}
                adultSubtotal={adultSubtotal}
                childSubtotal={childSubtotal}
                totalAmount={totalAmount}
                totalWasAmount={totalWasAmount}
                totalSavings={totalSavings}
                currency={currency}
                previewThumb={previewThumb}
                price={price}
                waMessage={waMessage}
                onProceed={openQuote}
              />
            </div>

            {/* Sticky Card 2: Why Choose Karnish Tourism Trust Box */}
            <div className="hol-trust-box-card" data-reveal>
              <h3 className="hol-trust-heading">Why choose Karnish Tourism?</h3>

              <ul className="hol-trust-list">
                <li className="hol-trust-item">
                  <div className="hol-trust-icon-box is-gold">
                    <IconCoin width="22" height="22" />
                  </div>
                  <div className="hol-trust-text">
                    <strong>Best Price Guarantee</strong>
                    <p>Always the best deal—book with total confidence.</p>
                  </div>
                </li>

                <li className="hol-trust-item">
                  <div className="hol-trust-icon-box is-teal">
                    <IconShield width="22" height="22" />
                  </div>
                  <div className="hol-trust-text">
                    <strong>Secure Online Transaction</strong>
                    <p>Your transactions are protected with advanced encryption.</p>
                  </div>
                </li>

                <li className="hol-trust-item">
                  <div className="hol-trust-icon-box is-indigo">
                    <IconChat width="22" height="22" />
                  </div>
                  <div className="hol-trust-text">
                    <strong>24X7 Live Chat Support</strong>
                    <p>Real humans, ready to help anytime.</p>
                  </div>
                </li>

                <li className="hol-trust-item">
                  <div className="hol-trust-icon-box is-coral">
                    <IconThumbsUp width="22" height="22" />
                  </div>
                  <div className="hol-trust-text">
                    <strong>Happy Travelers Worldwide</strong>
                    <p>Trusted by millions of happy travelers.</p>
                  </div>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {/* Full-width location and reviews follow the two-column content, matching the activity page. */}
        <section className="hol-location-wide hol-location-in-flow" aria-labelledby="holiday-location-title" data-reveal>
          <div className="hol-location-heading">
            <span>Location</span>
            <h2 id="holiday-location-title">Explore {destinationName}</h2>
            <p><IconPin width="17" height="17" /> {locationLabel}</p>
          </div>
          <div className={`hol-map-stage${mapInteractive ? " is-interactive" : ""}`}>
            <iframe className="hol-destination-map" src={mapEmbedUrl} title={`Map showing ${locationLabel}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" tabIndex={mapInteractive ? 0 : -1} />
            <div className="hol-map-overlay">
              {!mapInteractive ? <button type="button" className="hol-map-activate" onClick={() => setMapInteractive(true)}><IconPin width="19" height="19" /><span>Explore map</span></button> : <button type="button" className="hol-map-release" onClick={() => setMapInteractive(false)}>Stop exploring map</button>}
            </div>
          </div>
        </section>

        <div id="customer-reviews" className="act-reviews-wide hol-activity-reviews" data-reveal>
          <ActivityReviews slug={pkg.slug} initial={activityStyleReviews} />
        </div>

      </div>

      {/* 9. Similar Holidays Rail */}
      {related?.length > 0 && (
        <RailSection id="hol-related" title="Similar holidays" subtitle="More packages you may like." label="similar holidays">
          {related.map((item) => (
            <div className="hol-rail-item" key={item.slug}><HolidayCard item={item} /></div>
          ))}
        </RailSection>
      )}

      <section className="hol-bottom-trust" aria-labelledby="hol-bottom-trust-title" data-reveal>
        <div className="mk-container">
          <div className="hol-bottom-trust-head">
            <span>Book with confidence</span>
            <h2 id="hol-bottom-trust-title">Why choose Karnish Tourism?</h2>
          </div>
          <ul className="hol-bottom-trust-grid">
            <li><div className="hol-trust-icon-box is-gold"><IconCoin width="22" height="22" /></div><div><strong>Best Price Guarantee</strong><p>Always the best deal—book with total confidence.</p></div></li>
            <li><div className="hol-trust-icon-box is-teal"><IconShield width="22" height="22" /></div><div><strong>Secure Online Transaction</strong><p>Your transactions are protected with advanced encryption.</p></div></li>
            <li><div className="hol-trust-icon-box is-indigo"><IconChat width="22" height="22" /></div><div><strong>24X7 Live Chat Support</strong><p>Real humans, ready to help anytime.</p></div></li>
            <li><div className="hol-trust-icon-box is-coral"><IconThumbsUp width="22" height="22" /></div><div><strong>Happy Travelers Worldwide</strong><p>Trusted by millions of happy travelers.</p></div></li>
          </ul>
        </div>
      </section>

      {/* Mobile Booking Drawer Scrim & Bottom Sheet */}
      <div
        className={`hol-mobile-drawer-scrim${mobileDrawerOpen ? " is-open" : ""}`}
        onClick={() => setMobileDrawerOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`hol-mobile-drawer${mobileDrawerOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hol-mobile-drawer-title"
        aria-hidden={!mobileDrawerOpen}
      >
        <div className="hol-mobile-drawer-header">
          <span className="hol-sheet-grab" aria-hidden="true" />
          <div className="hol-mobile-drawer-top-row">
            <h3 id="hol-mobile-drawer-title" className="hol-mobile-drawer-title">
              Modify Search
            </h3>
            <button
              type="button"
              className="hol-mobile-drawer-close"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close booking details"
            >
              <IconX width="18" height="18" />
            </button>
          </div>
        </div>

        <div className="hol-mobile-drawer-body">
          <div className="hol-booking-card">
            <BookingCardContent
              pkg={pkg}
              adults={adults}
              setAdults={setAdults}
              children={children}
              setChildren={setChildren}
              infants={infants}
              setInfants={setInfants}
              travelersText={travelersText}
              travelersOpen={travelersOpen}
              setTravelersOpen={setTravelersOpen}
              travelDate={travelDate}
              travelDateIso={travelDateIso}
              setTravelDate={setTravelDate}
              setTravelDateIso={setTravelDateIso}
              calendarOpen={calendarOpen}
              setCalendarOpen={setCalendarOpen}
              priceDetailsOpen={priceDetailsOpen}
              setPriceDetailsOpen={setPriceDetailsOpen}
              handleAddToCart={handleAddToCart}
              cartToast={cartToast}
              adultUnitPrice={adultUnitPrice}
              childUnitPrice={childUnitPrice}
              adultSubtotal={adultSubtotal}
              childSubtotal={childSubtotal}
              totalAmount={totalAmount}
              totalWasAmount={totalWasAmount}
              totalSavings={totalSavings}
              currency={currency}
              previewThumb={previewThumb}
              price={price}
              waMessage={waMessage}
              onProceed={() => {
                setMobileDrawerOpen(false);
                openQuote();
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Bar with Up Arrow Toggle */}
      <div className="hol-mobile-bar">
        <button
          type="button"
          className="hol-mobile-bar-total-btn"
          onClick={() => setMobileDrawerOpen((prev) => !prev)}
          aria-expanded={mobileDrawerOpen}
          aria-label={mobileDrawerOpen ? "Collapse booking details" : "Expand booking details"}
        >
          <div className="hol-mobile-bar-meta">
            <span>Total ({travelersText})</span>
            <span className={`hol-mobile-up-arrow${mobileDrawerOpen ? " is-open" : ""}`} aria-hidden="true">
              <IconChevron dir={mobileDrawerOpen ? "down" : "up"} width="13" height="13" />
            </span>
          </div>
          <strong>{formatPrice(totalAmount, currency)}</strong>
        </button>

        <div className="hol-mobile-bar-actions">
          <button
            type="button"
            className="mk-btn hol-mobile-quote-btn"
            onClick={() => setMobileDrawerOpen(true)}
          >
            Get Quote
          </button>
          <HolidayWhatsAppButton
            message={waMessage}
            size="circle"
            className="hol-btn-wa-circle is-mobile"
            ariaLabel="Contact us on WhatsApp"
          />
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <Lightbox
          images={mosaicImages}
          index={lightboxIndex}
          onIndex={setLightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Quote / Booking Enquiry Modal */}
      <QuoteModal
        pkg={pkg}
        travelers={{ count: adults + children, label: travelersText, adults, children, infants }}
        travelDate={travelDate}
        travelDateIso={travelDateIso}
        price={{
          current: { amount: totalAmount, currency },
          was: totalWasAmount > 0 ? { amount: totalWasAmount, currency } : null,
          save: price?.save || 0,
        }}
        isOpen={quoteOpen}
        onClose={() => setQuoteOpen(false)}
      />

      {/* Day Itinerary Detail Modal */}
      <DayDetailModal day={selectedDay} onClose={() => setSelectedDay(null)} />
    </div>
  );
}
