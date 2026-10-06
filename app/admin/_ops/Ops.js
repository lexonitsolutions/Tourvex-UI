"use client";

// Shared bits of the operations admin (bookings, vouchers, scanner, finance, invoices). Built on the admin kit only.
import "./ops.css";
import { useState } from "react";
import { useAdminApi } from "../_lib/adminApi";
import { formatMoney } from "../_lib/format";
import { Button, StatusBadge, downloadBlob, useToast } from "../_kit";

export const BOOKING_STATUS = {
  pending_payment: { label: "Pending payment", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  cancellation_requested: { label: "Cancellation requested", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "danger" },
  refunded: { label: "Refunded", tone: "info" },
  expired: { label: "Expired", tone: "neutral" },
  mixed: { label: "Mixed", tone: "neutral" },
};

export const PAYMENT_STATUS = {
  unpaid: { label: "Unpaid", tone: "neutral" },
  paid: { label: "Paid", tone: "success" },
  partially_refunded: { label: "Partly refunded", tone: "warning" },
  refunded: { label: "Refunded", tone: "info" },
};

export const VOUCHER_STATUS = {
  issued: { label: "Issued", tone: "info" },
  redeemed: { label: "Redeemed", tone: "success" },
  void: { label: "Void", tone: "danger" },
};

export const INVOICE_STATUS = {
  issued: { label: "Issued", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  refunded: { label: "Refunded", tone: "warning" },
  voided: { label: "Voided", tone: "danger" },
};

export const statusOptions = (map) => Object.entries(map).filter(([k]) => k !== "mixed").map(([value, v]) => ({ value, label: v.label }));

function mapBadge(map, status) {
  const entry = map[status] || { label: status || "-", tone: "neutral" };
  return <StatusBadge tone={entry.tone}>{entry.label}</StatusBadge>;
}
export const BookingStatusBadge = ({ status }) => mapBadge(BOOKING_STATUS, status);
export const PaymentBadge = ({ status }) => mapBadge(PAYMENT_STATUS, status);
export const VoucherBadge = ({ status }) => mapBadge(VOUCHER_STATUS, status);
export const InvoiceBadge = ({ status }) => mapBadge(INVOICE_STATUS, status);

export const money = (value, currency = "AED") => formatMoney(value, currency);

export const SERVICE_TYPES = [
  { value: "activity", label: "Activity" },
  { value: "flight", label: "Flight" },
  { value: "hotel", label: "Hotel" },
  { value: "visa", label: "Visa" },
  { value: "transfer", label: "Transfer" },
];

/** Travellers text such as "2 adults, 1 child". */
export function paxText(adults, children) {
  const a = Number(adults) || 0;
  const c = Number(children) || 0;
  return [a ? `${a} adult${a === 1 ? "" : "s"}` : null, c ? `${c} child${c === 1 ? "" : "ren"}` : null].filter(Boolean).join(", ") || "-";
}

/** "2026-10-05" -> "05 Oct 2026" without time zone drift (the value is a calendar day). */
export function formatDay(day) {
  if (!day) return "-";
  const [y, m, d] = String(day).slice(0, 10).split("-").map(Number);
  if (!y) return "-";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d).padStart(2, "0")} ${months[m - 1]} ${y}`;
}

/** Date inputs (YYYY-MM-DD) to inclusive ISO bounds for the API. */
export const dayStartIso = (day) => (day ? `${day}T00:00:00+04:00` : undefined);
export const dayEndIso = (day) => (day ? `${day}T23:59:59.999+04:00` : undefined);

/** Downloads an authenticated file (PDF/CSV) through the API client. */
export function useFileDownload() {
  const api = useAdminApi();
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  async function download(path, filename, key = path, options) {
    setBusy(key);
    try {
      downloadBlob(await api.download(path, options), filename);
    } catch (error) {
      toast.error(error?.message || "Download failed");
    } finally {
      setBusy(null);
    }
  }
  return { download, busy };
}

export function PdfButton({ path, filename, children = "Download PDF", variant = "secondary", size = "md" }) {
  const { download, busy } = useFileDownload();
  return <Button variant={variant} size={size} icon="download" loading={busy === path} onClick={() => download(path, filename, path)}>{children}</Button>;
}

/** Inline QR: the API sends the module grid as one SVG path, so nothing is injected as HTML. */
export function QrSvg({ qr, label = "QR code", className = "" }) {
  if (!qr?.path) return null;
  const pad = 2;
  const size = qr.size + pad * 2;
  return (
    <svg className={`adm-ops-qr ${className}`.trim()} viewBox={`${-pad} ${-pad} ${size} ${size}`} shapeRendering="crispEdges" role="img" aria-label={label}>
      <rect x={-pad} y={-pad} width={size} height={size} fill="#fff" />
      <path d={qr.path} fill="#0a1a40" />
    </svg>
  );
}

/** Link-styled row title that also works as plain text. */
export function Muted({ children }) {
  return <span className="adm-muted">{children}</span>;
}
