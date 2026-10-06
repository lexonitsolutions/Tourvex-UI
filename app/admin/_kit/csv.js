"use client";

import { useState } from "react";
import { Button } from "./primitives";
import { useToast } from "./Toast";

/** Client-side CSV with formula-injection protection (cells starting with = + - @ get a leading quote), same rule as the API. */
export function toCsv(columns, rows) {
  const esc = (value) => {
    let text = value == null ? "" : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const head = columns.map((c) => esc(c.label)).join(",");
  const body = rows.map((row) => columns.map((c) => esc(typeof c.value === "function" ? c.value(row) : row[c.key])).join(","));
  return [head, ...body].join("\r\n");
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(filename, columns, rows) {
  downloadBlob(new Blob(["﻿", toCsv(columns, rows)], { type: "text/csv;charset=utf-8" }), filename);
}

/**
 * Export button. Pass `getBlob` (async, e.g. api.download("/admin/audit/export.csv", { query })) for server exports
 * or `columns`+`rows` for exporting what is loaded on the page.
 */
export function ExportCsvButton({ filename = "export.csv", getBlob, columns, rows, disabled, children = "Export CSV" }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function run() {
    setBusy(true);
    try {
      if (getBlob) downloadBlob(await getBlob(), filename);
      else downloadCsv(filename, columns, rows || []);
    } catch (error) {
      toast.error(error?.message || "Export failed");
    } finally {
      setBusy(false);
    }
  }
  return <Button icon="download" onClick={run} loading={busy} disabled={disabled}>{children}</Button>;
}
