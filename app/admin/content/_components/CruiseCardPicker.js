"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Ship,
  Trash2,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../../../lib/api";
import { useFormContext } from "./formContext";
import { resolveMediaUrl } from "../../_lib/cms";
import { useAdminApi } from "../../_lib/adminApi";
import { Button, Modal } from "../../_kit";

const FALLBACK_IMG = "/images/cruise-01.jpg";

function formatMoney(p) {
  if (!p) return "Fare on request";
  if (typeof p === "string") return p;
  if (p.amount !== undefined) return `${p.currency || "AED"} ${Number(p.amount).toLocaleString()}`;
  return "Fare on request";
}

function sanitizeCruiseItem(cruise) {
  const nights = cruise.durationNights ? `${cruise.durationNights} nights` : "";
  const imgUrl = cruise.coverImage || (cruise.images?.[0]?.url || cruise.images?.[0]) || FALLBACK_IMG;
  const priceVal = cruise.salePrice || cruise.price;

  return {
    id: `cr-${cruise.id || cruise.slug || Math.random().toString(36).slice(2, 8)}`,
    cruiseId: String(cruise.id || cruise._id || ""),
    slug: String(cruise.slug || ""),
    title: String(cruise.title || "Cruise"),
    image: {
      url: typeof imgUrl === "string" ? imgUrl : imgUrl?.url || FALLBACK_IMG,
      alt: cruise.title || "",
    },
    departureCity: String(cruise.departureCity || ""),
    duration: nights,
    price: formatMoney(priceVal),
  };
}

export function CruiseCardPicker({ field, value, path }) {
  const { readOnly, onChange, errors } = useFormContext();
  const api = useAdminApi();
  const selectedList = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const [modalOpen, setModalOpen] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");

  const maxItems = field.max || 12;
  const atMax = selectedList.length >= maxItems;

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      let data;
      try {
        data = await api.get("/cruises/admin/all", { query: { limit: 48 } });
      } catch {
        const res = await fetch(`${API_BASE_URL}/cruises?limit=48`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          let msg = `Failed to load cruises (${res.status})`;
          try {
            const errJson = await res.json();
            if (errJson?.message) {
              msg = Array.isArray(errJson.message) ? errJson.message.join(", ") : errJson.message;
            }
          } catch {
            /* ignore */
          }
          throw new Error(msg);
        }
        data = await res.json();
      }

      let allItems = Array.isArray(data?.items) ? data.items : [];
      if (data?.pagination?.pages > 1) {
        const extraPages = [];
        for (let p = 2; p <= Math.min(data.pagination.pages, 5); p++) {
          extraPages.push(
            api
              .get("/cruises/admin/all", { query: { limit: 48, page: p } })
              .catch(() =>
                fetch(`${API_BASE_URL}/cruises?limit=48&page=${p}`, {
                  headers: { Accept: "application/json" },
                }).then((r) => (r.ok ? r.json() : null))
              )
          );
        }
        const extraResults = await Promise.all(extraPages);
        extraResults.forEach((r) => {
          if (Array.isArray(r?.items)) {
            allItems = allItems.concat(r.items);
          }
        });
      }
      setCatalog(allItems);
    } catch (err) {
      setLoadError(err.message || "Could not fetch cruises from catalogue");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const openPickerModal = useCallback(() => {
    setModalOpen(true);
    if (catalog.length === 0) {
      fetchCatalog();
    }
  }, [catalog.length, fetchCatalog]);

  const selectedIndexMap = useMemo(() => {
    const map = new Map();
    selectedList.forEach((item, index) => {
      if (item.slug) map.set(item.slug, index);
      if (item.cruiseId) map.set(item.cruiseId, index);
    });
    return map;
  }, [selectedList]);

  const toggleSelect = useCallback(
    (cruise) => {
      if (readOnly) return;
      const existingIdx = selectedIndexMap.has(cruise.slug)
        ? selectedIndexMap.get(cruise.slug)
        : cruise.id && selectedIndexMap.has(cruise.id)
        ? selectedIndexMap.get(cruise.id)
        : -1;

      if (existingIdx !== -1 && existingIdx !== undefined) {
        const next = selectedList.filter((_, idx) => idx !== existingIdx);
        onChange(path, next);
      } else {
        if (selectedList.length >= maxItems) return;
        const newItem = sanitizeCruiseItem(cruise);
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
        p.departureCity?.toLowerCase().includes(q) ||
        p.cruiseLine?.toLowerCase().includes(q) ||
        p.region?.toLowerCase().includes(q)
    );
  }, [catalog, search]);

  const err = errors?.[path];

  return (
    <div className="adm-cms-list adm-cruise-picker" style={{ display: "grid", gap: 12 }}>
      {/* Header */}
      <div className="adm-cms-list__head">
        <div>
          <h4 className="adm-cms-list__label">{field.label || "Featured cruise cards"}</h4>
          <p className="adm-field__hint">
            {field.help ||
              "Choose cruises from your catalogue to showcase in the cruise teaser section on the home page."}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="adm-cms-list__count">
            {selectedList.length} / {maxItems} cruises
          </span>
          <Link
            href="/admin/catalog/cruises"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Cruises Catalogue in new tab"
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
            <span>Catalogue</span>
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
              Showcase order on home page ({selectedList.length})
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
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
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
                      width: 50,
                      height: 40,
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
                      {item.duration || "7 nights"} {item.departureCity ? `• From ${item.departureCity}` : ""}
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
          <Ship size={24} style={{ color: "var(--adm-muted)", opacity: 0.7 }} />
          <span>No cruises selected for the home page yet.</span>
          <span style={{ fontSize: 12, color: "var(--adm-muted)" }}>
            By default, recent catalogue cruises are shown. Click <strong>Add cruise</strong> to choose specific cruises.
          </span>
        </div>
      )}

      {/* "Add cruise" Action Button */}
      {!readOnly && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <button
            type="button"
            className="adm-btn adm-btn--secondary adm-btn--sm adm-cms-list__add"
            onClick={openPickerModal}
            disabled={atMax}
          >
            <Plus size={15} />
            <span className="adm-btn__label">{atMax ? `Maximum of ${maxItems} reached` : "Add cruise"}</span>
          </button>
        </div>
      )}

      {/* Cruise Selection Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Select Cruise Cards"
        description="Choose cruises uploaded in your catalogue to showcase on the home page."
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
              {selectedList.length} of {maxItems} cruises selected
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
                placeholder="Search cruises by title, departure city, line or region..."
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
              title="Refresh catalogue"
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
              Loading cruises from catalogue...
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

          {/* Cruises Grid */}
          <div
            className="adm-catalog-picker-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 12,
              maxHeight: "52vh",
              overflowY: "auto",
              padding: "4px 2px",
            }}
          >
            {filteredCatalog.map((cruise) => {
              const isSelected =
                selectedIndexMap.has(cruise.slug) || (cruise.id && selectedIndexMap.has(cruise.id));
              const selectedIdx = isSelected
                ? selectedIndexMap.has(cruise.slug)
                  ? selectedIndexMap.get(cruise.slug)
                  : selectedIndexMap.get(cruise.id)
                : -1;

              const img = cruise.coverImage || (cruise.images?.[0]?.url || cruise.images?.[0]) || FALLBACK_IMG;
              const durationText = cruise.durationNights ? `${cruise.durationNights}N / ${cruise.durationNights + 1}D` : "Cruise";
              const priceText = formatMoney(cruise.salePrice || cruise.price);

              return (
                <div
                  className="adm-catalog-choice-card"
                  key={cruise.id || cruise.slug}
                  onClick={() => toggleSelect(cruise)}
                  tabIndex={readOnly ? -1 : 0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleSelect(cruise);
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
                      alt={cruise.title || "Cruise"}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={(e) => {
                        if (!e.currentTarget.src.endsWith(FALLBACK_IMG)) e.currentTarget.src = FALLBACK_IMG;
                      }}
                    />
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
                      🚢 {durationText}
                    </span>

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
                        Featured #{selectedIdx + 1}
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
                    {/* Line & Region Badges */}
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
                        {cruise.cruiseLine || "Cruise Voyage"}
                      </span>
                      {cruise.departureCity && (
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
                          Location: {cruise.departureCity}
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
                      title={cruise.title}
                    >
                      {cruise.title}
                    </h5>

                    {/* Ship / Ports summary */}
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>
                      {cruise.shipName ? `Ship: ${cruise.shipName}` : cruise.region || "Ocean & Coastal Voyage"}
                    </div>

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

          {filteredCatalog.length === 0 && !loading && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--adm-muted)", fontSize: 13 }}>
              {catalog.length === 0
                ? "No cruises found in catalogue. Create cruises under Admin > Catalog > Cruises first."
                : `No cruises match "${search}".`}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default memo(CruiseCardPicker);
