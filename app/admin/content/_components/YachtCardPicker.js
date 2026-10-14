"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Anchor,
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../../../lib/api";
import { useFormContext } from "./formContext";
import { resolveMediaUrl } from "../../_lib/cms";
import { useAdminApi } from "../../_lib/adminApi";
import { Button, Modal } from "../../_kit";
import { YACHT_PACKAGES } from "../../../components/cruises/yachtPackagesData";

const FALLBACK_IMG = "https://karnishtourism.com/wp-content/uploads/2025/03/xclusive-superyacht-dubai-tour-410x250.jpg";

function formatPriceString(price, currency = "AED") {
  if (price == null) return "Fare on request";
  if (typeof price === "string") {
    if (price.startsWith("AED") || price.startsWith("$")) return price;
    return `${currency} ${price}`;
  }
  if (typeof price === "number") {
    return `${currency} ${price.toLocaleString()}`;
  }
  return "Fare on request";
}

function sanitizeYachtItem(yacht) {
  const imgUrl =
    typeof yacht.image === "string"
      ? yacht.image
      : yacht.image?.url || yacht.coverImage || FALLBACK_IMG;

  const priceVal = yacht.price ?? yacht.salePrice;

  return {
    id: `yacht-${yacht.id || yacht.slug || Math.random().toString(36).slice(2, 8)}`,
    slug: String(yacht.slug || ""),
    title: String(yacht.title || "Yacht Package"),
    image: {
      url: typeof imgUrl === "string" ? imgUrl : imgUrl?.url || FALLBACK_IMG,
      alt: yacht.title || "Yacht Charter",
    },
    category: String(yacht.category || "Private Charter"),
    capacity: String(yacht.capacity || ""),
    duration: String(yacht.duration || ""),
    price: formatPriceString(priceVal, yacht.currency || "AED"),
    destination: String(yacht.destination || "Dubai Marina"),
    description: String(yacht.description || ""),
  };
}

export function YachtCardPicker({ field, value, path }) {
  const { readOnly, onChange, errors } = useFormContext();
  const api = useAdminApi();
  const selectedList = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const [modalOpen, setModalOpen] = useState(false);
  const [catalog, setCatalog] = useState(() => YACHT_PACKAGES);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");

  const maxItems = field.max || 24;
  const atMax = selectedList.length >= maxItems;

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Start with our curated saved packages
      const combined = [...YACHT_PACKAGES];
      const seenSlugs = new Set(combined.map((y) => y.slug));

      // Attempt to fetch any additional live activities in the Yacht / Dhow category
      try {
        const res = await fetch(
          `${API_BASE_URL}/catalog/activities?category=${encodeURIComponent("Dhow Cruise & Yacht")}&limit=50`,
          { headers: { Accept: "application/json" } }
        );
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data?.items) ? data.items : [];
          items.forEach((item) => {
            if (item.slug && !seenSlugs.has(item.slug)) {
              seenSlugs.add(item.slug);
              combined.push({
                id: item.id || item._id,
                slug: item.slug,
                title: item.title,
                category: item.category || "Yacht / Cruise",
                capacity: item.capacity || "Charter",
                duration: item.duration || "2+ Hours",
                price: item.salePrice || item.price,
                currency: item.currency || "AED",
                image: item.coverImage || item.images?.[0]?.url || item.images?.[0] || FALLBACK_IMG,
                destination: item.location || item.city || "Dubai",
                description: item.shortDescription || item.description || "",
              });
            }
          });
        }
      } catch {
        // Use curated saved packages if API is offline
      }

      setCatalog(combined);
    } catch (err) {
      setLoadError(err.message || "Could not fetch saved yacht packages");
    } finally {
      setLoading(false);
    }
  }, []);

  const openPickerModal = useCallback(() => {
    setModalOpen(true);
    fetchCatalog();
  }, [fetchCatalog]);

  const selectedIndexMap = useMemo(() => {
    const map = new Map();
    selectedList.forEach((item, index) => {
      if (item.slug) map.set(item.slug, index);
      if (item.id) map.set(item.id, index);
    });
    return map;
  }, [selectedList]);

  const toggleSelect = useCallback(
    (yacht) => {
      if (readOnly) return;
      const existingIdx = selectedIndexMap.has(yacht.slug)
        ? selectedIndexMap.get(yacht.slug)
        : yacht.id && selectedIndexMap.has(yacht.id)
        ? selectedIndexMap.get(yacht.id)
        : -1;

      if (existingIdx !== -1 && existingIdx !== undefined) {
        const next = selectedList.filter((_, idx) => idx !== existingIdx);
        onChange(path, next);
      } else {
        if (selectedList.length >= maxItems) return;
        const newItem = sanitizeYachtItem(yacht);
        onChange(path, [...selectedList, newItem]);
      }
    },
    [readOnly, selectedIndexMap, selectedList, maxItems, onChange, path]
  );

  const moveItem = useCallback(
    (index, direction) => {
      if (readOnly) return;
      const target = index + direction;
      if (target < 0 || target >= selectedList.length) return;
      const next = [...selectedList];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      onChange(path, next);
    },
    [readOnly, selectedList, onChange, path]
  );

  const removeItem = useCallback(
    (index) => {
      if (readOnly) return;
      const next = selectedList.filter((_, i) => i !== index);
      onChange(path, next);
    },
    [readOnly, selectedList, onChange, path]
  );

  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.trim().toLowerCase();
    return catalog.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.destination?.toLowerCase().includes(q) ||
        p.capacity?.toLowerCase().includes(q)
    );
  }, [catalog, search]);

  const err = errors?.[path];

  return (
    <div className="adm-cms-list adm-yacht-picker" style={{ display: "grid", gap: 12 }}>
      {/* Header */}
      <div className="adm-cms-list__head">
        <div>
          <h4 className="adm-cms-list__label">{field.label || "Yacht packages"}</h4>
          <p className="adm-field__hint">
            {field.help ||
              "Choose from saved yacht packages to showcase in this section, or reorder and remove them."}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="adm-cms-list__count">
            {selectedList.length} / {maxItems} packages
          </span>
          <Link
            href="/activities?activity=Dhow%20Cruise%20%26%20Yacht"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Yachts on live site"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--adm-link)",
              textDecoration: "none",
              padding: "2px 8px",
              borderRadius: 6,
              border: "1px solid var(--adm-line)",
              background: "var(--adm-surface)",
            }}
          >
            <span>Live page</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {err ? (
        <p className="adm-field__error" role="alert">
          {err}
        </p>
      ) : null}

      {/* Selected Items Tray */}
      {selectedList.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: 8,
            padding: 12,
            background: "var(--adm-surface-2, var(--adm-fill-neutral))",
            border: "1px solid var(--adm-line)",
            borderRadius: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 650, color: "var(--adm-ink)" }}>
              Selected yacht cards ({selectedList.length})
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => onChange(path, [])}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 12,
                  color: "var(--adm-danger)",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                Clear all
              </button>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
              gap: 8,
            }}
          >
            {selectedList.map((item, index) => {
              const img = item.image?.url || item.coverImage || FALLBACK_IMG;
              return (
                <div
                  key={item.id || item.slug || index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    background: "var(--adm-surface)",
                    borderRadius: 10,
                    border: "1px solid var(--adm-line)",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--adm-ink)",
                      color: "var(--adm-surface)",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    #{index + 1}
                  </span>

                  <img
                    src={resolveMediaUrl(img)}
                    alt=""
                    style={{
                      width: 52,
                      height: 42,
                      borderRadius: 6,
                      objectFit: "cover",
                      flexShrink: 0,
                      border: "1px solid var(--adm-line-soft)",
                    }}
                    onError={(e) => {
                      if (!e.currentTarget.src.endsWith(FALLBACK_IMG)) e.currentTarget.src = FALLBACK_IMG;
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 650,
                        color: "var(--adm-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--adm-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.category || "Yacht"} {item.capacity ? `• ${item.capacity}` : ""}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--adm-text)" }}>
                      {item.price}
                    </div>
                  </div>

                  {!readOnly && (
                    <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        title="Move up"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 4,
                          cursor: index === 0 ? "default" : "pointer",
                          opacity: index === 0 ? 0.25 : 0.8,
                          color: "var(--adm-ink)",
                        }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, 1)}
                        disabled={index === selectedList.length - 1}
                        title="Move down"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 4,
                          cursor: index === selectedList.length - 1 ? "default" : "pointer",
                          opacity: index === selectedList.length - 1 ? 0.25 : 0.8,
                          color: "var(--adm-ink)",
                        }}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        title="Remove"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 4,
                          cursor: "pointer",
                          color: "var(--adm-danger)",
                          marginLeft: 2,
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="adm-cms-list__empty"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            padding: "20px 16px",
          }}
        >
          <Anchor size={24} style={{ color: "var(--adm-muted)", opacity: 0.7 }} />
          <span>No yacht packages selected yet.</span>
          <span style={{ fontSize: 12, color: "var(--adm-muted)" }}>
            Click <strong>+ Add yacht package</strong> to choose from saved yacht and charter cards.
          </span>
        </div>
      )}

      {/* Prominent "+ Add yacht package" Action Button */}
      {!readOnly && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <button
            type="button"
            className="adm-btn adm-btn--secondary adm-btn--sm adm-cms-list__add"
            onClick={openPickerModal}
            disabled={atMax}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
            }}
          >
            <Plus size={16} />
            <span className="adm-btn__label">
              {atMax ? `Maximum of ${maxItems} reached` : "Add yacht package"}
            </span>
          </button>
        </div>
      )}

      {/* Yacht Selection Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Select Saved Yacht Packages"
        description="Choose yacht cards to highlight in the Luxury Yachts & Charters section."
        size="lg"
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--adm-muted)", fontWeight: 550 }}>
              {selectedList.length} of {maxItems} packages selected
            </span>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Search bar & Refresh */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--adm-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved yachts by title, category, destination, or capacity..."
                style={{
                  width: "100%",
                  padding: "8px 30px 8px 32px",
                  fontSize: 13,
                  borderRadius: 8,
                  border: "1px solid var(--adm-line)",
                  background: "var(--adm-surface)",
                  color: "var(--adm-ink)",
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--adm-muted)",
                    cursor: "pointer",
                    padding: 2,
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={fetchCatalog}
              title="Refresh saved packages"
              disabled={loading}
              className="adm-btn adm-btn--ghost adm-btn--sm"
              style={{ padding: "6px 10px" }}
            >
              <RefreshCw size={13} className={loading ? "tw:animate-spin" : ""} />
              <span className="adm-btn__label">Refresh</span>
            </button>
          </div>

          {/* Loading state */}
          {loading && catalog.length === 0 && (
            <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--adm-muted)", fontSize: 13 }}>
              Loading yacht packages...
            </div>
          )}

          {/* Error state */}
          {loadError && catalog.length === 0 && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: "var(--adm-danger-soft)",
                color: "var(--adm-danger)",
                fontSize: 13,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={fetchCatalog}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "inherit",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Yacht Cards Grid */}
          <div
            className="adm-catalog-picker-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 14,
              maxHeight: "56vh",
              overflowY: "auto",
              padding: "6px 2px",
            }}
          >
            {filteredCatalog.map((yacht) => {
              const isSelected =
                selectedIndexMap.has(yacht.slug) || (yacht.id && selectedIndexMap.has(yacht.id));
              const selectedIdx = isSelected
                ? selectedIndexMap.has(yacht.slug)
                  ? selectedIndexMap.get(yacht.slug)
                  : selectedIndexMap.get(yacht.id)
                : -1;

              const img = yacht.image?.url || yacht.image || FALLBACK_IMG;
              const priceText = formatPriceString(yacht.price, yacht.currency || "AED");

              return (
                <div
                  className="adm-catalog-choice-card"
                  key={yacht.id || yacht.slug}
                  onClick={() => toggleSelect(yacht)}
                  tabIndex={readOnly ? -1 : 0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleSelect(yacht);
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 14,
                    border: isSelected
                      ? "2px solid #0d9488"
                      : "1px solid #e2e8f0",
                    background: isSelected
                      ? "rgba(13, 148, 136, 0.05)"
                      : "#ffffff",
                    cursor: readOnly ? "default" : "pointer",
                    overflow: "hidden",
                    transition: "all 0.18s ease",
                    boxShadow: isSelected
                      ? "0 0 0 1px #0d9488, 0 4px 12px rgba(13, 148, 136, 0.12)"
                      : "0 2px 6px rgba(15, 23, 42, 0.06)",
                    position: "relative",
                    minHeight: 310,
                  }}
                >
                  {/* Photo Container */}
                  <div style={{ position: "relative", height: 310, minHeight: 310, width: "100%", background: "#0f172a", overflow: "hidden" }}>
                    <img
                      src={resolveMediaUrl(img)}
                      alt={yacht.title || "Yacht"}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={(e) => {
                        if (!e.currentTarget.src.endsWith(FALLBACK_IMG)) e.currentTarget.src = FALLBACK_IMG;
                      }}
                    />

                    {/* Duration Badge */}
                    {yacht.duration && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 8,
                          left: 8,
                          background: "rgba(15, 23, 42, 0.8)",
                          color: "#ffffff",
                          fontSize: 11,
                          fontWeight: 650,
                          padding: "3px 8px",
                          borderRadius: 6,
                          backdropFilter: "blur(6px)",
                          letterSpacing: "0.01em",
                        }}
                      >
                        ⏱ {yacht.duration}
                      </span>
                    )}

                    {/* Selection Checkmark / Action */}
                    {isSelected ? (
                      <span
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "#0d9488",
                          color: "#ffffff",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 999,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                      >
                        <Check size={13} strokeWidth={3} />
                        Selected #{selectedIdx + 1}
                      </span>
                    ) : (
                      <span
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "rgba(255, 255, 255, 0.85)",
                          color: "#0f2454",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 999,
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        + Select
                      </span>
                    )}
                  </div>

                  {/* Card Body with Full Details */}
                  <div
                    style={{
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      flex: 1,
                      background: "#ffffff",
                    }}
                  >
                    {/* Category & Capacity Badges */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 750,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "#0d9488",
                          background: "rgba(13, 148, 136, 0.1)",
                          padding: "2px 7px",
                          borderRadius: 4,
                        }}
                      >
                        {yacht.category || "Yacht Charter"}
                      </span>
                      {yacht.capacity && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 550,
                            color: "#475569",
                            background: "#f1f5f9",
                            padding: "2px 7px",
                            borderRadius: 4,
                          }}
                        >
                          👥 {yacht.capacity}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h5
                      style={{
                        margin: 0,
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: "#0f2454",
                        lineHeight: 1.35,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                      title={yacht.title}
                    >
                      {yacht.title}
                    </h5>

                    {/* Destination / Route */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#64748b" }}>
                      <span>Location:</span>
                      <span style={{ fontWeight: 550, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {yacht.destination || "Dubai Marina"}
                      </span>
                    </div>

                    {/* Description or Highlights snippet */}
                    {(yacht.description || (yacht.highlights && yacht.highlights[0])) && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11.5,
                          color: "#64748b",
                          lineHeight: 1.35,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {yacht.description || yacht.highlights?.join(" • ")}
                      </p>
                    )}

                    {/* Price Footer */}
                    <div
                      style={{
                        marginTop: "auto",
                        paddingTop: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                        Price from
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 750, color: "#0d9488" }}>
                        {priceText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default memo(YachtCardPicker);
