"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { formatPrice } from "../../lib/api";
import { useRouter } from "next/navigation";
import { getHoliday, isWishlisted, subscribeWishlist, toggleWishlist } from "../../lib/holidays";
import { currentPath, loginUrlFor, rememberPendingWish } from "../../lib/wishlistAuth";
import { useApp } from "../AppProvider";
import ShowcaseCard from "../ShowcaseCard";
import { StockChip } from "../StockBadge";
import "../../holidays.css";

export const FALLBACK_IMG = "/images/destination-a.jpg";

export function showFallback(e) {
  if (!e.currentTarget.src.endsWith(FALLBACK_IMG)) e.currentTarget.src = FALLBACK_IMG;
}

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function durationLabel(item) {
  return `${plural(item.durationNights, "Night")} / ${plural(item.durationDays, "Day")}`;
}

/** Display price for a card or package: sale price wins, the list price becomes the struck-through "was". */
export function priceOf(item) {
  const current = item.salePrice || item.price;
  if (!current) return null;
  const was = item.salePrice && item.price && item.price.amount > item.salePrice.amount ? item.price : null;
  return {
    current,
    was,
    save: was ? Math.round((1 - current.amount / was.amount) * 100) : 0,
  };
}

/** The API converts prices to the requested currency; always format in the currency the money itself carries. */
export const money = (m) => (m ? formatPrice(m.amount, m.currency || "AED") : null);

export const destinationHref = (name, country) =>
  `/holidays/destination/${encodeURIComponent(name)}${country ? `?country=${encodeURIComponent(country)}` : ""}`;

/* Icons ------------------------------------------------------------ */

const icon = (paths, props = {}) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
    {paths}
  </svg>
);

export const IconChevron = ({ dir = "right", ...p }) =>
  icon(
    <path
      d={
        dir === "left"
          ? "M15 5l-7 7 7 7"
          : dir === "down"
          ? "M5 9l7 7 7-7"
          : dir === "up"
          ? "M5 15l7-7 7 7"
          : "M9 5l7 7-7 7"
      }
    />,
    p
  );
export const IconCheck = (p) => icon(<path d="M5 12.5l4.5 4.5L19 7.5" />, p);
export const IconX = (p) => icon(<path d="M6 6l12 12M18 6L6 18" />, p);
export const IconMoon = (p) => icon(<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />, p);
export const IconPin = (p) => icon(<><path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.4" /></>, p);
export const IconHeart = ({ filled, ...p }) =>
  icon(<path d="M12 20.5s-7.5-4.6-9.2-9.6C1.7 7.60 3.80 4.50 7 4.50c2 0 3.40 1 5 2.90 1.60-1.90 3-2.90 5-2.90 3.20 0 5.30 3.10 4.20 6.40-1.70 5-9.20 9.60-9.20 9.60z" fill={filled ? "currentColor" : "none"} />, p);
export const IconStar = (p) => icon(<path d="M12 3.50l2.60 5.40 5.90.8-4.30 4.10 1 5.80L12 16.80l-5.20 2.80 1-5.80L3.50 9.70l5.90-.8z" fill="currentColor" strokeWidth="1.2" />, p);
export const IconClose = IconX;

/* Wishlist heart --------------------------------------------------- */

export const WishButton = memo(function WishButton({ slug, title, label = false, className = "" }) {
  const { user, ready } = useApp();
  const router = useRouter();
  const signedIn = ready && !!user;
  // Hearts only show as saved for signed-in visitors (the wishlist belongs to an account).
  const saved = useSyncExternalStore(subscribeWishlist, () => isWishlisted(slug), () => false) && signedIn;
  const [pop, setPop] = useState(false);
  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      rememberPendingWish(slug);
      router.push(loginUrlFor(currentPath(), "wishlist"));
      return;
    }
    toggleWishlist(slug);
    setPop(true);
  };
  return (
    <button
      type="button"
      className={`hol-heart${saved ? " is-saved" : ""}${pop ? " is-pop" : ""}${label ? " hol-heart-label" : ""} ${className}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
      onClick={onClick}
      onAnimationEnd={() => setPop(false)}
    >
      <IconHeart filled={saved} />
      {label && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
});

/* Package card icons ----------------------------------------------- */

const svgCardIcon = (paths, props = {}) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {paths}
  </svg>
);

export const IconTransfer = (p) =>
  svgCardIcon(
    <>
      <rect x="2" y="7" width="20" height="11" rx="2" />
      <path d="M16 7V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3M6 18v2M18 18v2M7 12h2M15 12h2" />
    </>,
    p
  );

export const IconHotel = (p) =>
  svgCardIcon(
    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />,
    p
  );

export const IconTicket = (p) =>
  svgCardIcon(
    <>
      <path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V6H4zM13 6v12" strokeDasharray="2 2" />
    </>,
    p
  );

export const IconMeal = (p) =>
  svgCardIcon(
    <>
      <path d="M4 18h16M12 5a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7zM12 2v3" />
    </>,
    p
  );

export const IconSightseeing = (p) =>
  svgCardIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </>,
    p
  );

export const IconPhone = (p) =>
  svgCardIcon(
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
    p
  );

export const IconMail = (p) =>
  svgCardIcon(
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>,
    p
  );

export const IconWhatsApp = ({ size = 18, ...p }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p}>
    <path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.18 1.6 6L.2 24l6.16-1.37A11.9 11.9 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.22-3.5-8.5zm-8.5 18.5a9.9 9.9 0 0 1-5.06-1.38l-.36-.21-3.66.81.83-3.57-.24-.38A9.9 9.9 0 0 1 2 12c0-5.52 4.48-10 10-10 2.67 0 5.18 1.04 7.07 2.93A9.95 9.95 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.45-7.46c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.19 5.06 4.47.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
  </svg>
);

/* Shared, reusable WhatsApp button across all pages (Cards, Detail, Modals) */
export const HolidayWhatsAppButton = memo(function HolidayWhatsAppButton({
  phone = "971500000000",
  message,
  item,
  size = "normal",
  className = "",
  ariaLabel,
  children,
}) {
  const text =
    message ||
    (item?.title
      ? `Hello Karnish Tourism! I am interested in booking "${item.title}". Please share details.`
      : "Hello Karnish Tourism! I am interested in holiday packages. Please share details.");

  const href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  const label = ariaLabel || (item?.title ? `Chat on WhatsApp about ${item.title}` : "Chat on WhatsApp with travel specialist");

  const isCircle = size === "circle" || size === "large";
  const iconSize = isCircle ? 22 : 16;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`hol-wa-btn-shared ${isCircle ? "is-circle" : "is-card"} ${className}`}
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
    >
      <IconWhatsApp size={iconSize} />
      {children}
    </a>
  );
});

/* Package card (Shared Reusable Production Component) --------------- */

export const HolidayPackageCard = memo(function HolidayPackageCard({ item, reveal = true, style }) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [loadedImages, setLoadedImages] = useState(null);
  const swipeStartX = useRef(null);
  const suppressClick = useRef(false);
  const manualUntil = useRef(0);
  const galleryRequested = useRef(false);

  const nights = item?.durationNights || 1;
  const days = item?.durationDays || nights + 1;
  const durationText = `${nights}N / ${days}D`;

  const priceObj = item?.salePrice || item?.price;
  const displayPrice = priceObj ? formatPrice(priceObj.amount, priceObj.currency || "AED") : "Price on request";

  const initialImages = item?.images?.length
    ? item.images.map((img) => (typeof img === "string" ? img : img.url))
    : [item?.coverImage || FALLBACK_IMG];
  const allImages = loadedImages?.length ? loadedImages : initialImages;

  const startHover = () => {
    setIsHovered(true);
    if (allImages.length > 1 || galleryRequested.current || !item?.slug) return;
    galleryRequested.current = true;
    getHoliday(item.slug)
      .then((result) => {
        const gallery = result?.package?.images
          ?.map((image) => (typeof image === "string" ? image : image?.url))
          .filter(Boolean);
        if (gallery?.length) setLoadedImages(gallery);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    if (!isHovered || allImages.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      if (Date.now() < manualUntil.current) return;
      setActiveImgIndex((current) => (current + 1) % allImages.length);
    }, 1300);

    return () => window.clearInterval(intervalId);
  }, [allImages.length, isHovered]);

  const currentImage = allImages[activeImgIndex] || item?.coverImage || FALLBACK_IMG;
  const detailHref = `/holidays/${item?.slug || ""}`;

  const waText = encodeURIComponent(
    `Hello Karnish Tourism! I am interested in booking the "${item?.title || "holiday"}" package (${durationText}). Please share details.`
  );
  const waUrl = `https://wa.me/971500000000?text=${waText}`;
  const telUrl = `tel:+97142000000`;
  const mailUrl = `/contact?subject=${encodeURIComponent(`Enquiry: ${item?.title || "Holiday"}`)}`;

  const stopProp = (e) => e.stopPropagation();
  const moveImage = useCallback((direction) => {
    if (allImages.length <= 1) return;
    manualUntil.current = Date.now() + 8000;
    setActiveImgIndex((current) => (current + direction + allImages.length) % allImages.length);
  }, [allImages.length]);

  const beginSwipe = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    swipeStartX.current = e.clientX;
    suppressClick.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const endSwipe = (e) => {
    if (swipeStartX.current === null) return;
    const distance = swipeStartX.current - e.clientX;
    swipeStartX.current = null;
    if (Math.abs(distance) < 32) return;
    suppressClick.current = true;
    moveImage(distance > 0 ? 1 : -1);
  };

  return (
    <article
      className="hol-pkg-card"
      data-reveal={reveal ? "up" : undefined}
      style={style}
      onMouseEnter={startHover}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="hol-pkg-media"
        onPointerDown={beginSwipe}
        onPointerUp={endSwipe}
        onPointerCancel={() => { swipeStartX.current = null; }}
      >
        <Link
          href={detailHref}
          className="hol-pkg-img-link"
          tabIndex={-1}
          onClick={(e) => {
            if (!suppressClick.current) return;
            e.preventDefault();
            suppressClick.current = false;
          }}
        >
          <img
            key={activeImgIndex}
            src={currentImage}
            alt={item?.title || "Holiday package"}
            loading="lazy"
            decoding="async"
            draggable="false"
            onError={showFallback}
          />
        </Link>

        <StockChip stock={item?.stock} />
        <span className="hol-pkg-dur-badge" aria-label={`Duration: ${durationText}`}>
          {durationText}
        </span>

        {item?.slug && (
          <div className="hol-pkg-wish-wrap" onClick={stopProp}>
            <WishButton slug={item.slug} title={item.title} />
          </div>
        )}

        {allImages.length > 1 && <div className="hol-pkg-dots" role="tablist" aria-label="Photos" onClick={stopProp}>
          {allImages.slice(0, 4).map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`hol-pkg-dot${idx === activeImgIndex ? " is-active" : ""}`}
              aria-label={`View photo ${idx + 1}`}
              onClick={() => {
                manualUntil.current = Date.now() + 8000;
                setActiveImgIndex(idx % allImages.length);
              }}
            />
          ))}
        </div>}
      </div>

      <div className="hol-pkg-body">
        <h3 className="hol-pkg-title">
          <Link href={detailHref}>{item?.title}</Link>
        </h3>

        <div className="hol-pkg-tag-row">
          <span className="hol-pkg-status">New</span>
          {item?.themes?.[0] && <span className="hol-pkg-theme">{item.themes[0]}</span>}
        </div>

        <div className="hol-pkg-inclusions" aria-label="Inclusions">
          <span className="hol-pkg-incl-item" title="Transfers Included">
            <IconTransfer />
            <span>Transfers</span>
          </span>
          <span className="hol-pkg-incl-item" title="Hotel Stay Included">
            <IconHotel />
            <span>Hotels</span>
          </span>
          <span className="hol-pkg-incl-item" title="Entry Tickets Included">
            <IconTicket />
            <span>Entry Tickets</span>
          </span>
          <span className="hol-pkg-incl-item" title="Meals Included">
            <IconMeal />
            <span>Meals</span>
          </span>
          <span className="hol-pkg-incl-item" title="Activities & Sightseeing">
            <IconSightseeing />
            <span>Activities</span>
          </span>
        </div>
      </div>

      <div className="hol-pkg-footer">
        <div className="hol-pkg-price-col">
          <span className="hol-pkg-from">from</span>
          <strong className="hol-pkg-price">{displayPrice}</strong>
        </div>

        <div className="hol-pkg-actions" onClick={stopProp}>
          <a
            href={telUrl}
            className="hol-pkg-btn hol-pkg-btn-call"
            aria-label={`Call us about ${item?.title}`}
          >
            <IconPhone />
          </a>

          <Link
            href={mailUrl}
            className="hol-pkg-btn hol-pkg-btn-mail"
            aria-label={`Send enquiry for ${item?.title}`}
          >
            <IconMail />
          </Link>

          <HolidayWhatsAppButton item={item} size="card" />
        </div>
      </div>
    </article>
  );
});

export const HolidayCard = HolidayPackageCard;

/* Rail with arrows ------------------------------------------------- */

export function useRailControls() {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const start = el.scrollLeft <= 4;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdge((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [measure]);

  const scrollBy = useCallback((dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.85, 240), behavior: "smooth" });
  }, []);

  return { ref, edge, scrollBy };
}

export function RailArrows({ edge, scrollBy, label }) {
  return (
    <div className="hol-arrows">
      <button type="button" aria-label={`Previous ${label}`} disabled={edge.start} onClick={() => scrollBy(-1)}>
        <IconChevron dir="left" />
      </button>
      <button type="button" aria-label={`Next ${label}`} disabled={edge.end} onClick={() => scrollBy(1)}>
        <IconChevron />
      </button>
    </div>
  );
}

/** Section header + scroll-snap rail with arrow buttons. Children are the rail items. */
export function RailSection({ id, title, subtitle, label, href, hrefLabel = "View all", children, className = "" }) {
  const { ref, edge, scrollBy } = useRailControls();
  const headingId = `${id}-title`;
  return (
    <section className={`mk-container hol-section ${className}`} aria-labelledby={headingId}>
      <div className="hol-head" data-reveal>
        <div>
          <h2 id={headingId}>{title}</h2>
          {subtitle && <p className="hol-sub">{subtitle}</p>}
        </div>
        <div className="hol-head-tools">
          {href && <Link className="hol-link" href={href}>{hrefLabel}</Link>}
          <RailArrows edge={edge} scrollBy={scrollBy} label={label || title} />
        </div>
      </div>
      <div className="hol-rail" ref={ref} role="group" aria-label={title} tabIndex={0}>
        {children}
      </div>
    </section>
  );
}

export function CardSkeletons({ count = 4, rail = false }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className={`hol-skel-card${rail ? " is-rail" : ""}`} aria-hidden="true">
      <div className="hol-skel hol-skel-img" />
      <div className="hol-skel hol-skel-line" />
      <div className="hol-skel hol-skel-line is-short" />
    </div>
  ));
}

export function StateMessage({ title, text, action, onAction, href, actionLabel }) {
  return (
    <div className="hol-state" role={action ? "alert" : "status"}>
      <div className="hol-state-art" aria-hidden="true">
        <IconPin width="30" height="30" />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {onAction && (
        <button type="button" className="mk-btn" onClick={onAction}>{action}</button>
      )}
      {href && <Link className="mk-btn" href={href}>{actionLabel}</Link>}
    </div>
  );
}

export { PremiumDatePicker } from "../PremiumDatePicker";
