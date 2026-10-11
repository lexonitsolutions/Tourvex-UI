"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Package, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { API_BASE_URL } from "../../../lib/api";
import { useFormContext } from "./formContext";
import { resolveMediaUrl } from "../../_lib/cms";
import { cx } from "../../_kit";

const FALLBACK_IMG = "/images/destination-03.jpg";

function formatMoney(p) {
  if (!p) return "Price on request";
  if (typeof p === "string") return p;
  if (p.amount !== undefined) return `${p.currency || "AED"} ${Number(p.amount).toLocaleString()}`;
  return "Price on request";
}

function sanitizePackageItem(pkg) {
  const nights = pkg.durationNights || 2;
  const days = pkg.durationDays || nights + 1;
  const imgUrl = pkg.coverImage || (pkg.images?.[0]?.url || pkg.images?.[0]) || FALLBACK_IMG;
  const priceVal = pkg.salePrice || pkg.price;

  return {
    id: `pkg-${pkg.id || pkg.slug || Math.random().toString(36).slice(2, 8)}`,
    packageId: String(pkg.id || pkg._id || ""),
    slug: String(pkg.slug || ""),
    title: String(pkg.title || "Holiday Package"),
    image: {
      url: typeof imgUrl === "string" ? imgUrl : imgUrl?.url || FALLBACK_IMG,
      alt: pkg.title || "",
    },
    country: String(pkg.country || (pkg.destinations || []).join(", ") || ""),
    duration: `${nights}N / ${days}D`,
    price: formatMoney(priceVal),
  };
}

export function HolidayPackagePicker({ field, value, path }) {
  const { readOnly, onChange } = useFormContext();
  const selectedList = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/holidays?limit=50`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Failed to load holidays (${res.status})`);
      const data = await res.json();
      setCatalog(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setLoadError(err.message || "Could not fetch holiday packages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const selectedIndexMap = useMemo(() => {
    const map = new Map();
    selectedList.forEach((item, index) => {
      if (item.slug) map.set(item.slug, index);
      if (item.packageId) map.set(item.packageId, index);
    });
    return map;
  }, [selectedList]);

  const toggleSelect = useCallback(
    (pkg) => {
      if (readOnly) return;
      const existingIdx = selectedIndexMap.has(pkg.slug)
        ? selectedIndexMap.get(pkg.slug)
        : pkg.id && selectedIndexMap.has(pkg.id)
        ? selectedIndexMap.get(pkg.id)
        : -1;

      if (existingIdx !== -1 && existingIdx !== undefined) {
        const next = selectedList.filter((_, idx) => idx !== existingIdx);
        onChange(path, next);
      } else {
        if (selectedList.length >= (field.max || 12)) return;
        const newItem = sanitizePackageItem(pkg);
        onChange(path, [...selectedList, newItem]);
      }
    },
    [readOnly, selectedIndexMap, selectedList, field.max, onChange, path]
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
        p.country?.toLowerCase().includes(q) ||
        p.destinations?.some((d) => d.toLowerCase().includes(q))
    );
  }, [catalog, search]);

  return (
    <div className="adm-hol-picker" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          paddingBottom: 8,
          borderBottom: "1px solid var(--adm-line-soft)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: "var(--adm-fs-md)", fontWeight: 650, color: "var(--adm-ink)" }}>
              {field.label || "Featured holiday package cards"}
            </h3>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: selectedList.length > 0 ? "var(--adm-teal-soft)" : "var(--adm-fill-neutral)",
                color: selectedList.length > 0 ? "var(--adm-brand-ink)" : "var(--adm-muted)",
              }}
            >
              {selectedList.length} / {field.max || 12} chosen
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "var(--adm-fs-sm)", color: "var(--adm-muted)" }}>
            Select which holiday packages from your Catalog to showcase on the home page. If none are selected, recent catalog packages are shown automatically.
          </p>
        </div>

        <Link
          href="/admin/catalog/holidays"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "var(--adm-fs-xs)",
            fontWeight: 600,
            color: "var(--adm-link)",
            textDecoration: "none",
            padding: "4px 10px",
            borderRadius: 8,
            border: "1px solid var(--adm-line)",
          }}
        >
          <span>Catalog &gt; Holidays</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* Selected Showcase Tray */}
      {selectedList.length > 0 && (
        <div
          style={{
            background: "var(--adm-surface-2, var(--adm-fill-neutral))",
            borderRadius: 14,
            padding: 14,
            border: "1px solid var(--adm-line)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong style={{ fontSize: "var(--adm-fs-sm)", color: "var(--adm-ink)" }}>
              Selected for Home Page ({selectedList.length})
            </strong>
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
                }}
              >
                Clear all
              </button>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 10,
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
                    padding: 8,
                    background: "var(--adm-surface)",
                    borderRadius: 10,
                    border: "1px solid var(--adm-line)",
                    position: "relative",
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
                      width: 48,
                      height: 38,
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
                    <div style={{ fontSize: 11, color: "var(--adm-muted)", display: "flex", gap: 6 }}>
                      <span>{item.duration || "2N / 3D"}</span>
                      {item.country && <span>• {item.country}</span>}
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
                        title="Move left"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 4,
                          cursor: index === 0 ? "default" : "pointer",
                          opacity: index === 0 ? 0.3 : 0.8,
                          color: "var(--adm-ink)",
                        }}
                      >
                        <ArrowLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, 1)}
                        disabled={index === selectedList.length - 1}
                        title="Move right"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 4,
                          cursor: index === selectedList.length - 1 ? "default" : "pointer",
                          opacity: index === selectedList.length - 1 ? 0.3 : 0.8,
                          color: "var(--adm-ink)",
                        }}
                      >
                        <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        title="Remove from featured"
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
      )}

      {/* Available Packages from Catalog */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <strong style={{ fontSize: "var(--adm-fs-sm)", color: "var(--adm-ink)" }}>
            Available Holiday Packages in Catalog ({catalog.length})
          </strong>

          <button
            type="button"
            onClick={fetchCatalog}
            title="Refresh catalog"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--adm-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
            }}
          >
            <RefreshCw size={12} className={loading ? "tw:animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: "relative" }}>
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
            placeholder="Search packages by title, country or destination..."
            style={{
              width: "100%",
              padding: "7px 12px 7px 32px",
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid var(--adm-line)",
              background: "var(--adm-surface)",
              color: "var(--adm-ink)",
            }}
          />
        </div>

        {/* Loading / Error states */}
        {loading && catalog.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: "var(--adm-muted)", fontSize: 13 }}>
            Loading holiday packages from catalog...
          </div>
        )}

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
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Catalog Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
            maxHeight: 460,
            overflowY: "auto",
            padding: "4px 2px",
          }}
        >
          {filteredCatalog.map((pkg) => {
            const isSelected =
              selectedIndexMap.has(pkg.slug) || (pkg.id && selectedIndexMap.has(pkg.id));
            const selectedIdx = isSelected
              ? selectedIndexMap.has(pkg.slug)
                ? selectedIndexMap.get(pkg.slug)
                : selectedIndexMap.get(pkg.id)
              : -1;

            const img = pkg.coverImage || (pkg.images?.[0]?.url || pkg.images?.[0]) || FALLBACK_IMG;
            const nights = pkg.durationNights || 2;
            const days = pkg.durationDays || nights + 1;
            const durationText = `${nights}N / ${days}D`;
            const priceText = formatMoney(pkg.salePrice || pkg.price);

            return (
              <div
                key={pkg.id || pkg.slug}
                onClick={() => toggleSelect(pkg)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 12,
                  border: isSelected
                    ? "2px solid var(--adm-teal, #0d9488)"
                    : "1px solid var(--adm-line)",
                  background: isSelected
                    ? "var(--adm-teal-soft, rgba(13, 148, 136, 0.08))"
                    : "var(--adm-surface)",
                  cursor: readOnly ? "default" : "pointer",
                  overflow: "hidden",
                  transition: "all 0.18s ease",
                  boxShadow: isSelected ? "0 0 0 1px var(--adm-teal, #0d9488)" : "none",
                }}
              >
                {/* Media banner */}
                <div style={{ position: "relative", height: 110, width: "100%", background: "#111" }}>
                  <img
                    src={resolveMediaUrl(img)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      if (!e.currentTarget.src.endsWith(FALLBACK_IMG)) e.currentTarget.src = FALLBACK_IMG;
                    }}
                  />

                  <span
                    style={{
                      position: "absolute",
                      bottom: 6,
                      left: 6,
                      background: "rgba(0,0,0,0.7)",
                      color: "#fff",
                      fontSize: 10.5,
                      fontWeight: 650,
                      padding: "2px 6px",
                      borderRadius: 4,
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {durationText}
                  </span>

                  {isSelected && (
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        background: "var(--adm-teal, #0d9488)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 999,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                      }}
                    >
                      <Check size={12} strokeWidth={3} />
                      Featured #{selectedIdx + 1}
                    </span>
                  )}
                </div>

                {/* Body info */}
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 650,
                      color: "var(--adm-ink)",
                      lineHeight: 1.3,
                    }}
                  >
                    {pkg.title}
                  </div>

                  <div style={{ fontSize: 11.5, color: "var(--adm-muted)" }}>
                    {pkg.country || (pkg.destinations || []).join(", ") || "Holiday Package"}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 6,
                      paddingTop: 6,
                      borderTop: "1px solid var(--adm-line-soft)",
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--adm-ink)" }}>
                      {priceText}
                    </span>

                    <button
                      type="button"
                      disabled={readOnly}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: isSelected
                          ? "1px solid var(--adm-danger)"
                          : "1px solid var(--adm-line)",
                        background: isSelected
                          ? "transparent"
                          : "var(--adm-teal, #0d9488)",
                        color: isSelected ? "var(--adm-danger)" : "#fff",
                        cursor: readOnly ? "default" : "pointer",
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          <span>Select card</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCatalog.length === 0 && !loading && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--adm-muted)", fontSize: 13 }}>
            {catalog.length === 0
              ? "No holiday packages found in catalog. Create packages under Admin > Catalog > Holidays first."
              : `No packages match "${search}".`}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(HolidayPackagePicker);
