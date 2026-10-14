"use client";

import Link from "next/link";
import { YACHT_PACKAGES } from "./yachtPackagesData";
import { useApp } from "../AppProvider";
import { formatPrice } from "../../lib/api";
import { showFallback } from "./CruiseParts";

const YACHTS_ACTIVITY_URL = "/activities?activity=Dhow%20Cruise%20%26%20Yacht";

export default function YachtHighlightSection({ section }) {
  const { currency } = useApp();
  const heading = section?.data?.heading || "Luxury Yachts & Private Charters";
  const description =
    section?.data?.description ||
    "Looking for a private yacht, sunset dinner sailing, or coastal gathering? Explore our handpicked fleet in Dubai Marina.";
  const showViewAll = section?.data?.showViewAll !== false;

  const configuredYachts =
    Array.isArray(section?.data?.yachts) && section.data.yachts.length > 0
      ? section.data.yachts
      : null;

  const defaultFeatured = YACHT_PACKAGES.filter((p) => p.featured).slice(0, 4);
  const yachtsToDisplay = configuredYachts || defaultFeatured;

  return (
    <section className="cr-yacht-section" aria-labelledby="cr-yacht-heading">
      <div className="mk-container">
        {/* Section Header */}
        <div className="cr-yacht-header">
          <div className="cr-yacht-header-text">
            <span className="cr-yacht-eyebrow">Private Charters & Boat Trips</span>
            <h2 id="cr-yacht-heading">{heading}</h2>
            <p>{description}</p>
          </div>
          {showViewAll && (
            <Link
              href={YACHTS_ACTIVITY_URL}
              className="mk-btn cr-yacht-btn"
            >
              View All Yacht Packages ({YACHT_PACKAGES.length})
            </Link>
          )}
        </div>

        {/* Yacht Cards linking to activity packages */}
        <div className="cr-yacht-grid">
          {yachtsToDisplay.map((pkg) => {
            const imageSrc =
              typeof pkg.image === "string"
                ? pkg.image
                : pkg.image?.url ||
                  "https://karnishtourism.com/wp-content/uploads/2025/03/xclusive-superyacht-dubai-tour-410x250.jpg";

            const displayPrice =
              typeof pkg.price === "number"
                ? formatPrice(pkg.price, currency)
                : pkg.price || "Fare on request";

            return (
              <Link
                key={pkg.slug || pkg.id || pkg.title}
                href={`/activities/${encodeURIComponent(pkg.slug)}`}
                className="cr-yacht-card-item"
              >
                <div className="cr-yacht-card-img-wrap">
                  <img
                    src={imageSrc}
                    alt={pkg.title}
                    loading="lazy"
                    onError={showFallback}
                  />
                  {pkg.category && <span className="cr-yacht-pill">{pkg.category}</span>}
                  {pkg.capacity && <span className="cr-yacht-pill is-subtle">{pkg.capacity}</span>}
                </div>

                <div className="cr-yacht-card-body">
                  <span className="cr-yacht-card-meta">
                    {pkg.destination || "Dubai Marina"} {pkg.duration ? `· ${pkg.duration}` : ""}
                  </span>
                  <h3>{pkg.title}</h3>
                  {pkg.description && <p>{pkg.description}</p>}

                  <div className="cr-yacht-card-footer">
                    <div className="cr-yacht-card-price">
                      <small>From</small>
                      <b>{displayPrice}</b>
                    </div>
                    <span className="cr-yacht-card-action">
                      View Package →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
