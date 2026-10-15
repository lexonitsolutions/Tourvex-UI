"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { money, priceInfo, TRANSFER_LABEL } from "../../lib/actFormat";
import ShowcaseCard from "../ShowcaseCard";
import { StockHead } from "../StockBadge";
import ActivityBooking from "./ActivityBooking";
import ActivityGallery from "./ActivityGallery";
import ActivityReviews from "./ActivityReviews";
import { WishButton } from "../holidays/HolidayParts";
import { IconBolt, IconCar, IconCheck, IconChevron, IconClock, IconGlobe, IconInfo, IconMap, IconPhone, IconPin, IconShare, IconShield, IconX, Stars } from "./ActivityParts";

const osmLink = (loc) =>
  loc.lat != null && loc.lng != null
    ? `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=16/${loc.lat}/${loc.lng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent([loc.name, loc.address].filter(Boolean).join(", "))}`;

const osmEmbed = (loc) => {
  const d = 0.008;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng - d}%2C${loc.lat - d}%2C${loc.lng + d}%2C${loc.lat + d}&layer=mapnik&marker=${loc.lat}%2C${loc.lng}`;
};

function Accordion({ accordionKey, title, items, kind, open, onOpen, onClose, onToggle }) {
  const id = useId();
  return (
    <div
      className={`act-acc${open ? " is-open" : ""}`}
      onPointerEnter={() => onOpen(accordionKey)}
      onPointerLeave={(event) => event.pointerType === "mouse" && onClose(accordionKey)}
      onFocusCapture={() => onOpen(accordionKey)}
    >
      <h3>
        <button type="button" aria-expanded={open} aria-controls={`${id}-p`} id={`${id}-b`} onClick={(event) => event.detail === 0 ? onToggle(accordionKey) : onOpen(accordionKey)}>
          <span>{title}</span>
          <IconChevron dir="down" width="20" height="20" />
        </button>
      </h3>
      <div className="act-acc-panel" id={`${id}-p`} role="region" aria-labelledby={`${id}-b`} aria-hidden={!open}>
        <div className="act-acc-motion">
          <div className="act-acc-clip">
            <ul className="act-list">
              {items.map((x, i) => (
                <li key={i}>
                  {kind === "yes" && <span className="is-yes" aria-hidden="true"><IconCheck width="13" height="13" strokeWidth="3" /></span>}
                  {kind === "no" && <span className="is-no" aria-hidden="true"><IconX width="13" height="13" strokeWidth="3" /></span>}
                  {kind === "dot" && <span className="is-dot" aria-hidden="true" />}
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextAccordion({ accordionKey, title, children, open, onOpen, onClose, onToggle }) {
  const id = useId();
  return (
    <div
      className={`act-acc${open ? " is-open" : ""}`}
      onPointerEnter={() => onOpen(accordionKey)}
      onPointerLeave={(event) => event.pointerType === "mouse" && onClose(accordionKey)}
      onFocusCapture={() => onOpen(accordionKey)}
    >
      <h3><button type="button" aria-expanded={open} aria-controls={`${id}-p`} id={`${id}-b`} onClick={(event) => event.detail === 0 ? onToggle(accordionKey) : onOpen(accordionKey)}><span>{title}</span><IconChevron dir="down" width="20" height="20" /></button></h3>
      <div className="act-acc-panel" id={`${id}-p`} role="region" aria-labelledby={`${id}-b`} aria-hidden={!open}>
        <div className="act-acc-motion"><div className="act-acc-clip act-rich">{children}</div></div>
      </div>
    </div>
  );
}

function Itinerary({ items }) {
  if (!items?.length) return null;
  return (
    <section className="hol-block act-content-card act-itinerary" id="itinerary" aria-labelledby="act-itinerary-title">
      <div className="act-section-head"><span>What to expect</span><h2 id="act-itinerary-title">Experience itinerary</h2><p>A clear look at how your experience unfolds.</p></div>
      <ol>
        {items.map((item, i) => (
          <li key={`${item.title}-${i}`}>
            <span className="act-step" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <div className="act-step-card">
              {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : null}
              <div><div className="act-step-title"><h3>{item.title}</h3>{item.duration ? <span>{item.duration}</span> : null}</div><p>{item.description}</p></div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ShareButton({ title }) {
  const [msg, setMsg] = useState("");
  const share = async () => {
    const url = window.location.href.split("#")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMsg("Link copied");
    } catch {
      setMsg("");
    }
    setTimeout(() => setMsg(""), 2200);
  };
  return (
    <span className="act-share">
      <button type="button" className="act-ghost" onClick={share}><IconShare width="18" height="18" />Share</button>
      <span className="act-sr" role="status">{msg}</span>
      {msg && <span className="act-toast" aria-hidden="true">{msg}</span>}
    </span>
  );
}

function ActivityPoints({ a }) {
  const transfers = [...new Set((a.options || []).map((o) => o.transferType).filter(Boolean))].map((t) => TRANSFER_LABEL[t] || t);
  const cancel = a.freeCancellationHours;
  const items = [
    a.operatingHours && { label: "Operating hours", value: a.operatingHours },
    a.duration && { label: "Duration", value: a.duration },
    a.instantConfirmation && { value: "Instant confirmation" },
    a.mobileVoucher && { value: "Mobile voucher accepted" },
    cancel > 0 && { value: `Free cancellation up to ${cancel} hour${cancel === 1 ? "" : "s"} before` },
    transfers.length > 0 && { label: "Transfer options", value: transfers.join(", ") },
    a.languages?.length > 0 && { label: "Languages", value: a.languages.join(", ") },
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <div className="act-overview-details">
      <h3 className="act-overview-details-title">Experience details</h3>
      <ul className="act-overview-details-list" aria-label="Experience details">
        {items.map((item, i) => (
          <li key={i} className="act-bullet-item">
            <svg
              className="act-bullet-arrow"
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
            <span className="act-bullet-text">
              {item.label ? <strong>{item.label}: </strong> : null}
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Description({ text, a }) {
  const [more, setMore] = useState(false);
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const long = text.length > 900;
  const shown = long && !more ? paragraphs.slice(0, 2) : paragraphs;
  return (
    <section className="hol-block act-content-card act-overview" id="overview" aria-labelledby="act-about">
      <div className="act-section-head"><span>Overview</span><h2 id="act-about">About this experience</h2></div>
      {shown.map((p, i) => <p key={i}>{p}</p>)}
      {long && paragraphs.length > 2 && (
        <button type="button" className="act-linkbtn act-readmore" aria-expanded={more} onClick={() => setMore((v) => !v)}>{more ? "Read less" : "Read more"}</button>
      )}
      <ActivityPoints a={a} />
    </section>
  );
}

function DetailListSection({ id, title, eyebrow, items, kind = "yes" }) {
  if (!items?.length) return null;
  return (
    <section className={`hol-block act-content-card act-list-section is-${kind}`} id={id} aria-labelledby={`${id}-title`}>
      <div className="act-section-head"><span>{eyebrow}</span><h2 id={`${id}-title`}>{title}</h2></div>
      <ul className="act-list">
        {items.map((item, i) => (
          <li key={i}>
            {kind === "no" ? <span className="is-no" aria-hidden="true"><IconX width="13" height="13" strokeWidth="3" /></span> : <span className="is-yes" aria-hidden="true"><IconCheck width="13" height="13" strokeWidth="3" /></span>}
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function TrustPanel() {
  return (
    <section className="act-trust" aria-labelledby="act-trust-title">
      <div className="act-section-head"><span>Book with confidence</span><h2 id="act-trust-title">Why travellers choose Tourvex</h2></div>
      <div className="act-trust-grid">
        <article><IconShield /><div><h3>Secure checkout</h3><p>Protected payments and clear booking details.</p></div></article>
        <article><IconCheck /><div><h3>Carefully selected</h3><p>Experiences reviewed for quality and value.</p></div></article>
        <article><IconPhone /><div><h3>Human support</h3><p>Help before, during and after your activity.</p></div></article>
        <article><IconBolt /><div><h3>Fast confirmation</h3><p>Quick confirmation whenever the supplier supports it.</p></div></article>
      </div>
    </section>
  );
}

/** Shown instead of the booking card for activities that have no bookable options (enquiry only). */
function EnquiryCard({ activity, price }) {
  return (
    <div className="act-book act-enquiry">
      {price && (
        <div className="act-price">
          <small>From</small><strong>{money(price.current)}</strong>{price.was && <s>{money(price.was)}</s>}
          {price.save > 0 && <span className="act-save">Save {price.save}%</span>}
        </div>
      )}
      <p className="act-enq-text"><IconInfo width="18" height="18" /> Online booking is not open for this activity yet. Ask our team and we will arrange it for you.</p>
      <Link className="mk-btn mk-btn-block" href={`/contact?activity=${encodeURIComponent(activity.slug)}`}>Ask about this activity</Link>
    </div>
  );
}

export default function ActivityDetail({ activity, related, reviews, initial }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapInteractive, setMapInteractive] = useState(false);
  const locationRef = useRef(null);
  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const openAccordion = useCallback((key) => setActiveAccordion(key), []);
  const closeAccordion = useCallback((key) => setActiveAccordion((current) => current === key ? null : current), []);
  const toggleAccordion = useCallback((key) => setActiveAccordion((current) => current === key ? null : key), []);

  // Mount background map only when the user starts scrolling or nears the location block
  useEffect(() => {
    if (mapVisible) return undefined;
    if (typeof window !== "undefined" && window.scrollY > 40) {
      setMapVisible(true);
      return undefined;
    }
    const handleScroll = () => setMapVisible(true);
    window.addEventListener("scroll", handleScroll, { passive: true, once: true });
    window.addEventListener("wheel", handleScroll, { passive: true, once: true });
    window.addEventListener("touchmove", handleScroll, { passive: true, once: true });

    let observer;
    if (locationRef.current && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setMapVisible(true);
        },
        { rootMargin: "600px 0px 600px 0px" }
      );
      observer.observe(locationRef.current);
    }
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
      observer?.disconnect();
    };
  }, [mapVisible]);

  // Release map controls when user presses Escape or scrolls past the location stage
  useEffect(() => {
    if (!mapInteractive) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setMapInteractive(false);
    };
    window.addEventListener("keydown", onKey);
    let observer;
    if (locationRef.current && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) setMapInteractive(false);
        },
        { threshold: 0.05 }
      );
      observer.observe(locationRef.current);
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      observer?.disconnect();
    };
  }, [mapInteractive]);

  const scrollToLocation = useCallback((e) => {
    e?.preventDefault?.();
    setMapVisible(true);
    const el = locationRef.current || document.getElementById("location") || document.getElementById("act-loc");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);
  const a = activity;
  const productType = /yacht|cruise|dhow|sailing|boat|charter/i.test([a.title, ...(a.categories || [])].join(" ")) ? "yacht" : "activity";
  const bookable = Array.isArray(a.options) && a.options.length > 0;
  const price = priceInfo(a);
  const city = a.destinations?.[0];
  const category = a.categories?.[0];
  const images = [...(a.imageUrl ? [{ url: a.imageUrl, alt: a.title }] : []), ...(a.gallery || [])]
    .filter((image, index, all) => image?.url && all.findIndex((candidate) => candidate?.url === image.url) === index)
    .slice(0, 13);
  const where = a.location?.name || a.destinations?.join(", ");
  const rating = a.rating && a.rating.count > 0 ? a.rating : { average: 4.8, count: 5 };
  const guidanceSections = [
    ["How to redeem", a.howToRedeem, "dot"],
    ["Important information", a.importantInfo, "dot"],
    ["What to bring", a.whatToBring, "yes"],
    ["Cancellation policy", a.cancellationPolicy, "dot"],
  ].filter(([, items]) => items?.length > 0);

  return (
    <div className="hol-page act-page">
      <div className="mk-container">
        <nav className="hol-crumbs act-crumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/activities">Activities</Link></li>
            {city && <li><Link href={`/activities?destination=${encodeURIComponent(city)}`}>{city}</Link></li>}
            {category && <li><Link href={`/activities?activity=${encodeURIComponent(category)}`}>{category}</Link></li>}
            <li aria-current="page">{a.title}</li>
          </ol>
        </nav>

        <header className="act-head">
          <h1>{a.title}</h1>
          {a.summary ? <p className="act-summary">{a.summary}</p> : null}
          <StockHead stock={a.stock} />
          <div className="act-head-row">
            <ul className="hol-meta act-meta">
              {rating && (
                <li><Stars value={rating.average} size={16} /><b>{Number(rating.average).toFixed(1)}</b><span className="act-muted">({rating.count} review{rating.count === 1 ? "" : "s"})</span></li>
              )}
              {where && <li><IconPin width="18" height="18" />{where}</li>}
            </ul>
            <ShareButton title={a.title} />
          </div>
        </header>

        <ActivityGallery images={images} title={a.title} video={a.heroVideo} />

        <div className="act-grid">
          <div className="act-main">
            {a.description ? <Description text={a.description} a={a} /> : <div className="hol-block act-content-card act-overview"><ActivityPoints a={a} /></div>}
            <div className="act-detail-pair">
              <DetailListSection id="highlights" eyebrow="Best moments" title="Experience highlights" items={a.highlights} />
              <DetailListSection id="inclusions" eyebrow="Your booking" title="What's included" items={a.inclusions} />
            </div>
            <DetailListSection id="exclusions" eyebrow="Please note" title="What's not included" items={a.exclusions} kind="no" />
            <Itinerary items={a.itinerary} />
            {guidanceSections.length > 0 && (
              <section className="hol-block act-content-card act-accs" id="guest-info" aria-label="Guest information">
                <div className="act-section-head"><span>Plan ahead</span><h2>Good to know before you go</h2></div>
                {guidanceSections.map(([title, items, kind], i) => {
                  const key = `guide-${i}`;
                  return <Accordion key={title} accordionKey={key} title={title} items={items} kind={kind} open={activeAccordion === key} onOpen={openAccordion} onClose={closeAccordion} onToggle={toggleAccordion} />;
                })}
              </section>
            )}
            {a.contentSections?.length > 0 && (
              <section className="hol-block act-accs" aria-label="More activity information">
                {a.contentSections.map((section, i) => (
                  <TextAccordion key={`${section.title}-${i}`} accordionKey={`content-${i}`} title={section.title} open={activeAccordion === `content-${i}`} onOpen={openAccordion} onClose={closeAccordion} onToggle={toggleAccordion}>
                    {section.body?.split(/\n{2,}/).filter(Boolean).map((p, j) => <p key={j}>{p}</p>)}
                    {section.items?.length ? <ul className="act-list">{section.items.map((item, j) => <li key={j}><span className="is-dot" aria-hidden="true" />{item}</li>)}</ul> : null}
                  </TextAccordion>
                ))}
              </section>
            )}
            {a.faqs?.length > 0 && (
              <section className="hol-block act-content-card act-accs" id="faqs" aria-labelledby="act-faqs">
                <div className="act-section-head"><span>Good to know</span><h2 id="act-faqs">Frequently asked questions</h2></div>
                {a.faqs.map((faq, i) => <TextAccordion key={`${faq.question}-${i}`} accordionKey={`faq-${i}`} title={faq.question} open={activeAccordion === `faq-${i}`} onOpen={openAccordion} onClose={closeAccordion} onToggle={toggleAccordion}><p>{faq.answer}</p></TextAccordion>)}
              </section>
            )}
            {a.detailsAreSample && <p className="act-sample">Sample details shown for demonstration.</p>}
          </div>

          {bookable ? (
            <ActivityBooking
              activity={a}
              initial={initial}
              sheetOpen={sheetOpen}
              onSheetClose={closeSheet}
              productType={productType}
            />
          ) : (
            <aside className="act-aside act-aside-enquiry" aria-label="Booking">
              <EnquiryCard activity={a} price={price} />
            </aside>
          )}
        </div>

        {a.location && (a.location.name || a.location.address) && (
          <section ref={locationRef} id="location" className="hol-block act-location-wide" aria-labelledby="act-loc">
            <h2 id="act-loc">Location</h2>
            <p className="act-loc-text"><IconPin width="18" height="18" /><span>{[a.location.name, a.location.address].filter(Boolean).join(" · ")}</span></p>
            {a.location.lat != null && a.location.lng != null && (
              <div className={`act-map-stage${mapInteractive ? " is-interactive" : ""}`}>
                {mapVisible && (
                  <iframe
                    key={`${a.location.lat}-${a.location.lng}`}
                    className="act-map"
                    title={`Map of ${a.location.name || a.title}`}
                    src={osmEmbed(a.location)}
                    referrerPolicy="no-referrer"
                    tabIndex={mapInteractive ? 0 : -1}
                  />
                )}
                <div className="act-map-overlay">
                  {!mapInteractive ? (
                    <button
                      type="button"
                      className="act-map-activate"
                      onClick={() => setMapInteractive(true)}
                      aria-label="Click to explore the map"
                    >
                      <IconMap width="22" height="22" />
                      <span>Click to explore the map</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="act-map-release"
                      onClick={() => setMapInteractive(false)}
                      aria-label="Return to page scrolling"
                    >
                      Return to page scrolling
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        <div id="reviews" className="act-reviews-wide"><ActivityReviews slug={a.slug} initial={reviews} /></div>

        <TrustPanel />

        {related.length > 0 && (
          <section className="hol-block act-related" aria-labelledby="act-rel">
            <h2 id="act-rel">You might also like</h2>
            <div className="hol-rail" tabIndex={0} role="region" aria-label="Related activities">
              {related.map((r) => {
                const p = r.salePrice || r.price;
                const was = r.salePrice && r.price && r.price.amount > r.salePrice.amount ? r.price : null;
                return (
                  <div className="hol-rail-item" key={r.slug}>
                    <ShowcaseCard
                      href={`/activities/${r.slug}`}
                      title={r.title}
                      image={r.imageUrl}
                      tag={r.categories?.[0]}
                      stock={r.stock}
                      location={(r.destinations || []).join(", ") || undefined}
                      price={p ? { amount: p.amount, currency: p.currency, was } : null}
                      priceFallback="Price on request"
                      topRight={<WishButton type="activity" slug={r.slug} title={r.title} />}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="act-bar">
        <div>
          <span>{price ? "From" : ""}</span>
          <strong>{price ? money(price.current) : "On request"}</strong>
        </div>
        {bookable ? (
          <button type="button" className="mk-btn" onClick={openSheet}>{a.stock?.soldOut ? "Sold out" : "Check Availability"}</button>
        ) : (
          <Link className="mk-btn" href={`/contact?activity=${encodeURIComponent(a.slug)}`}>Ask about this activity</Link>
        )}
      </div>
    </div>
  );
}
