"use client";

import "./content.css";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Globe2, Pencil } from "lucide-react";
import { Button, EmptyState, ErrorState, PageHeader, RequirePermission, SearchInput, Skeleton, StatusBadge, useToast } from "../_kit";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { useAdminQuery } from "../_lib/useAdminQuery";
import { listOf, statusMeta, useCmsApi } from "../_lib/cms";
import { formatDateTime, formatRelative } from "../_lib/format";

const who = (p) => (p && typeof p === "object" ? p.name || p.email : p) || "";

function DocCard({ doc, index, canWrite, onPreview, previewing }) {
  const status = statusMeta(doc.status);
  const href = `/admin/content/${encodeURIComponent(doc.key)}`;
  const Icon = doc.kind === "global" ? Globe2 : FileText;
  return (
    <li className="adm-cms-doc adm-anim-fade-up" style={{ "--i": Math.min(index, 8) }}>
      <div className="adm-cms-doc__top">
        <span className="adm-cms-doc__icon"><Icon size={18} /></span>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>
      <h3 className="adm-cms-doc__title"><Link href={href}>{doc.label || doc.key}</Link></h3>
      <code className="adm-cms-doc__key">{doc.key}</code>
      <dl className="adm-cms-doc__meta">
        <div><dt>Version</dt><dd>{doc.version ? `v${doc.version}` : "None"}</dd></div>
        <div>
          <dt>Last edited</dt>
          <dd title={doc.updatedAt ? formatDateTime(doc.updatedAt) : undefined}>
            {doc.updatedAt ? formatRelative(doc.updatedAt) : "Never"}
            {who(doc.updatedBy) ? <small> by {who(doc.updatedBy)}</small> : null}
          </dd>
        </div>
      </dl>
      <div className="adm-cms-doc__actions">
        <Link href={href} className="adm-btn adm-btn--primary adm-btn--sm"><Pencil size={14} /><span className="adm-btn__label">{canWrite ? "Edit" : "View"}</span></Link>
        <Button size="sm" variant="secondary" onClick={() => onPreview(doc)} loading={previewing === doc.key}><ExternalLink size={14} /> Preview</Button>
      </div>
    </li>
  );
}

function Group({ title, docs, start, ...rest }) {
  if (!docs.length) return null;
  return (
    <section className="adm-cms-group-list" aria-label={title}>
      <h2 className="adm-cms-group-list__title">{title} <span>{docs.length}</span></h2>
      <ul className="adm-cms-doc-grid">
        {docs.map((d, i) => <DocCard key={d.key} doc={d} index={start + i} {...rest} />)}
      </ul>
    </section>
  );
}

export default function ContentListPage() {
  return (
    <RequirePermission permission="cms.read">
      <ContentList />
    </RequirePermission>
  );
}

function ContentList() {
  const cms = useCmsApi();
  const toast = useToast();
  const { can } = useAdminMe();
  const { data, error, loading, reload } = useAdminQuery("/admin/content");
  const [q, setQ] = useState("");
  const [previewing, setPreviewing] = useState(null);
  const docs = useMemo(() => listOf(data), [data]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? docs.filter((d) => `${d.label || ""} ${d.key}`.toLowerCase().includes(needle)) : docs;
  }, [docs, q]);
  const pages = filtered.filter((d) => d.kind !== "global");
  const globals = filtered.filter((d) => d.kind === "global");

  async function preview(doc) {
    const w = window.open("about:blank", "_blank");
    setPreviewing(doc.key);
    try {
      const res = await cms.previewToken(doc.key);
      if (!res?.url) throw new Error("The API did not return a preview URL.");
      if (w) {
        w.opener = null;
        w.location.href = res.url;
      }
    } catch (e) {
      w?.close();
      toast.error(e.message);
    } finally {
      setPreviewing(null);
    }
  }

  const common = { canWrite: can("cms.write"), onPreview: preview, previewing };
  return (
    <>
      <PageHeader
        title="Website content"
        description="Edit the text and images of the public website. Changes stay in a draft until you publish them."
        actions={docs.length ? <SearchInput value={q} onChange={setQ} placeholder="Search content" label="Search content documents" /> : null}
      />
      {loading ? (
        <ul className="adm-cms-doc-grid" aria-busy="true" aria-label="Loading content">
          {Array.from({ length: 6 }, (_, i) => <li key={i}><Skeleton height={190} className="tw:rounded-2xl" /></li>)}
        </ul>
      ) : error ? (
        <ErrorState title="Could not load the content list" description={error.message} onRetry={reload} />
      ) : !docs.length ? (
        <EmptyState icon="inbox" title="No editable content yet" description="Content documents appear here once the API registers their schemas." />
      ) : !filtered.length ? (
        <EmptyState icon="search" title="No documents match your search" description="Try another name or key." action={<Button onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div className="adm-cms-lists">
          <Group title="Pages" docs={pages} start={0} {...common} />
          <Group title="Global" docs={globals} start={pages.length} {...common} />
        </div>
      )}
    </>
  );
}
