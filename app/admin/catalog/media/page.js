"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Film, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button, ConfirmDialog, EmptyState, ErrorState, PageHeader, Pagination, RequirePermission, SearchInput, Skeleton, StatusBadge, Tabs, useToast } from "../../_kit";
import { formatBytes, listOf, resolveMediaUrl, useCmsApi } from "../../_lib/cms";

const LIMIT = 24;
const isVideo = (item) => String(item.contentType || "").startsWith("video/") || /\.(mp4|webm|mov|ogg)$/i.test(item.filename || "");
const collectionLabel = (name) => ({ cms_documents: "Website content", activities: "Activity", holidays: "Holiday", cruises: "Cruise", events: "Event", visas: "Visa", holiday_banners: "Holiday banner", cruise_banners: "Cruise banner", event_banners: "Event banner", visa_banners: "Visa banner", holiday_collections: "Holiday collection", site_settings: "Site settings" })[name] || String(name || "Application data").replaceAll("_", " ");
const usageLocation = (path) => String(path || "Media field").replace(/^published\./, "Published · ").replace(/^draft\./, "Draft · ").replace(/\.data\./, " · ").replace(/sections\[(\d+)\]/, (_, index) => `Section ${Number(index) + 1}`).replace(/\[(\d+)\]/g, (_, index) => ` item ${Number(index) + 1}`).replaceAll(".", " › ");

export default function MediaPage() {
  return <RequirePermission permission="cms.write"><MediaManager /></RequirePermission>;
}

function MediaManager() {
  const cms = useCmsApi();
  const toast = useToast();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: null, data: null, error: null });
  const [usage, setUsage] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const requestKey = `${tab}|${q}|${page}|${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    cms.mediaAll({ q: q || undefined, page, limit: LIMIT, kind: tab === "images" ? "image" : tab === "videos" ? "video" : "all" }, { signal: controller.signal })
      .then((data) => setState({ key: requestKey, data, error: null }))
      .catch((error) => { if (error?.name !== "AbortError") setState({ key: requestKey, data: null, error }); });
    return () => controller.abort();
  }, [cms, tab, q, page, attempt, requestKey]);

  const settled = state.key === requestKey;
  const items = useMemo(() => (settled ? listOf(state.data) : []), [settled, state.data]);
  const pagination = state.data?.pagination;
  const counts = state.data?.counts || {};

  async function inspect(item) {
    setUsage({ item, loading: true, references: [], error: null });
    try {
      const result = await cms.mediaReferences(item.id);
      setUsage({ item: result.item || item, activeVersion: result.activeVersion !== false, loading: false, references: result.references || [], error: null });
    } catch (error) {
      setUsage({ item, loading: false, references: [], error });
    }
  }

  async function confirmDelete(item) {
    try {
      const result = await cms.mediaReferences(item.id);
      setDeleting({ ...(result.item || item), referenceCount: (result.references || []).length });
    } catch (error) {
      toast.error(error.message || "Media usage could not be checked");
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await cms.mediaDelete(deleting.id);
      toast.success(`Deleted ${deleting.filename}`);
      setDeleting(null);
      setUsage(null);
      setAttempt((value) => value + 1);
    } catch (error) {
      toast.error(error.message || "Media could not be deleted");
    } finally { setBusy(false); }
  }

  return <>
    <PageHeader title="Media" description="Complete database inventory of available images and videos. Inspect usage or permanently delete an asset." actions={<SearchInput value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search media" label="Search media" />} />
    <div className="adm-media-toolbar"><Tabs tabs={[{ id: "all", label: `All (${counts.all ?? 0})` }, { id: "images", label: `Images (${counts.images ?? 0})` }, { id: "videos", label: `Videos (${counts.videos ?? 0})` }]} value={tab} onChange={(value) => { setTab(value); setPage(1); }} idPrefix="adm-media" variant="segmented" /></div>
    {!settled ? <div className="adm-media-grid" aria-busy="true">{Array.from({ length: 12 }, (_, index) => <Skeleton key={index} height={220} className="tw:rounded-2xl" />)}</div>
      : state.error ? <ErrorState title="Could not load media" description={state.error.message} onRetry={() => setAttempt((value) => value + 1)} />
      : !items.length ? <EmptyState icon="image" title="No media found" description="Upload media from a content or catalogue editor, or try a different search." />
      : <ul className="adm-media-grid">{items.map((item) => {
        const video = isVideo(item);
        return <li key={item.id} className="adm-media-card">
          <button type="button" className="adm-media-preview" onClick={() => inspect(item)} aria-label={`View usage for ${item.filename}`}>
            {video ? <video src={resolveMediaUrl(item.url)} muted playsInline preload="metadata" /> : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveMediaUrl(item.url)} alt="" loading="lazy" />
            )}
            <span className="adm-media-kind">{video ? <Film size={14} /> : <ImageIcon size={14} />}{video ? "Video" : "Image"}</span>
          </button>
          <div className="adm-media-meta"><b title={item.filename}>{item.originalName || item.filename}</b><small>{formatBytes(item.size || 0)} · {item.source === "upload" ? "Uploaded" : "Site media"}</small></div>
          <div className="adm-media-actions"><Button size="sm" variant="secondary" onClick={() => inspect(item)}>Usage</Button><Button size="sm" variant="danger" onClick={() => confirmDelete(item)} aria-label={`Permanently delete ${item.filename}`}><Trash2 size={14} /></Button></div>
        </li>;
      })}</ul>}
    {pagination?.pages > 1 && <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={pagination.limit || LIMIT} onPage={setPage} />}

    {usage && <div className="adm-media-usage" role="dialog" aria-modal="true" aria-label="Media usage"><button className="adm-media-usage__scrim" onClick={() => setUsage(null)} aria-label="Close"/><section><header><div><h2>Media usage</h2><p>{usage.item.filename}</p></div><Button variant="ghost" onClick={() => setUsage(null)}>Close</Button></header>{usage.loading ? <Skeleton height={120} /> : usage.error ? <ErrorState title="Could not inspect usage" description={usage.error.message} /> : usage.references.length ? <><p className="adm-media-warning">This file is currently displayed in {usage.references.length} application location{usage.references.length === 1 ? "" : "s"}. Open the record to change or remove it before deletion.</p><ul>{usage.references.map((ref, index) => <li key={`${ref.collection}-${ref.id}-${ref.path}-${index}`}><div><StatusBadge tone="info">{collectionLabel(ref.collection)}</StatusBadge><b>{ref.title}</b><code title={ref.path}>{usageLocation(ref.path)}</code></div><span className="adm-media-ref-actions">{ref.publicHref && <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={ref.publicHref} target="_blank">View live</Link>}{ref.href && <Link className="adm-btn adm-btn--secondary adm-btn--sm" href={ref.href}>Open record</Link>}</span></li>)}</ul></> : <div className="adm-media-unused"><b>{usage.activeVersion === false ? "Older duplicate—not served" : "Not used anywhere"}</b><p>{usage.activeVersion === false ? "Another newer upload has the same filename and is the version used by the application. This older copy can be deleted safely." : "No CMS page, catalogue record, banner, setting, booking, or other application record references this file."}</p><Button variant="danger" onClick={() => setDeleting(usage.item)}><Trash2 size={14}/> Delete media</Button></div>}</section></div>}
    <ConfirmDialog open={Boolean(deleting)} onClose={() => !busy && setDeleting(null)} onConfirm={remove} title="Permanently delete media?" description={deleting?.referenceCount ? `${deleting.filename} is used in ${deleting.referenceCount} application location${deleting.referenceCount === 1 ? "" : "s"}. Accepting will permanently remove the database file and its stored data. Referencing pages may show missing media. This cannot be undone.` : `This will permanently remove ${deleting?.filename || "this file"} and its stored data from the database. This action cannot be undone.`} confirmLabel="Delete permanently" confirmText="DELETE" busy={busy} />
  </>;
}
