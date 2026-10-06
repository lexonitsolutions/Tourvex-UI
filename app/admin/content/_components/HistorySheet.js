"use client";

import { useState } from "react";
import { ArrowLeft, Undo2 } from "lucide-react";
import { Button, ConfirmDialog, Drawer, EmptyState, ErrorState, Skeleton, StatusBadge, useToast } from "../../_kit";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../_ui/components/collapsible";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { displayValue, extractValue, listOf, normalizeValue, useCmsApi } from "../../_lib/cms";
import { formatDateTime, humanize } from "../../_lib/format";

export const personName = (p) => (p && typeof p === "object" ? p.name || p.fullName || p.email : p) || "Unknown";

function FieldRows({ fields, data, depth = 0 }) {
  return (
    <dl className="adm-cms-sum" style={{ "--depth": depth }}>
      {(fields || []).map((f) => {
        const v = data?.[f.name];
        if (f.type === "group") {
          return (
            <div key={f.name} className="adm-cms-sum__nest">
              <dt>{f.label}</dt>
              <dd><FieldRows fields={f.fields} data={v} depth={depth + 1} /></dd>
            </div>
          );
        }
        if (f.type === "list") {
          return (
            <div key={f.name} className="adm-cms-sum__nest">
              <dt>{f.label} <span className="adm-muted">({(v || []).length})</span></dt>
              <dd>
                {(v || []).map((item, i) => (
                  <div key={item.id || i} className="adm-cms-sum__item">
                    <b>{f.itemLabel || "Item"} {i + 1}</b>
                    <FieldRows fields={f.fields} data={item} depth={depth + 1} />
                  </div>
                ))}
              </dd>
            </div>
          );
        }
        return (
          <div key={f.name} className="adm-cms-sum__row">
            <dt>{f.label}</dt>
            <dd>{displayValue(f, v)}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Read-only summary of a payload, driven by the schema (never hard-coded fields). */
export function DataSummary({ kind, schema, sectionSchemas, revision }) {
  const raw = extractValue(kind, revision);
  const value = normalizeValue(kind, schema, sectionSchemas, raw ?? (kind === "page" ? [] : {}));
  if (kind === "global") return <FieldRows fields={schema?.fields} data={value} />;
  return (
    <div className="adm-cms-sum__sections">
      {value.map((s, i) => (
        <Collapsible key={s.id} defaultOpen={i === 0}>
          <CollapsibleTrigger className="adm-cms-sum__trigger">
            <span>{sectionSchemas?.[s.type]?.label || humanize(s.type)}</span>
            {!s.enabled ? <span className="adm-chip">Hidden</span> : null}
          </CollapsibleTrigger>
          <CollapsibleContent><FieldRows fields={sectionSchemas?.[s.type]?.fields} data={s.data} /></CollapsibleContent>
        </Collapsible>
      ))}
      {!value.length ? <p className="adm-muted">No sections.</p> : null}
    </div>
  );
}

function RevisionView({ docKey, version, doc, canWrite, dirty, onBack, onRestored }) {
  const cms = useCmsApi();
  const toast = useToast();
  const { data, error, loading, reload } = useAdminQuery(`/admin/content/${encodeURIComponent(docKey)}/revisions/${encodeURIComponent(version)}`);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");

  async function restore() {
    setBusy(true);
    setFailure("");
    try {
      await cms.restore(docKey, version);
      toast.success(`Version ${version} restored into the draft. Review it, then publish.`);
      setConfirm(false);
      onRestored();
    } catch (e) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-cms-rev">
      <button type="button" className="adm-cms-back" onClick={onBack}><ArrowLeft size={15} /> All versions</button>
      <div className="adm-cms-rev__head">
        <h3>Version {version}</h3>
        {data ? <p className="adm-muted">Published {formatDateTime(data.publishedAt)} by {personName(data.publishedBy)}{data.note ? ` · "${data.note}"` : ""}</p> : null}
        {canWrite ? <Button icon="undo" onClick={() => setConfirm(true)} disabled={!data}>Restore into draft</Button> : null}
      </div>
      {loading ? <div className="adm-stack">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={44} />)}</div> : error ? <ErrorState title="Could not load this version" description={error.message} onRetry={reload} /> : data ? <DataSummary kind={doc.kind} schema={doc.schema} sectionSchemas={doc.sectionSchemas} revision={data} /> : null}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={restore}
        busy={busy}
        error={failure}
        tone="primary"
        title={`Restore version ${version} into the draft?`}
        description={`The current draft${dirty ? " and your unsaved edits are" : " is"} replaced by version ${version}. Nothing is published until you press Publish.`}
        confirmLabel="Restore into draft"
      />
    </div>
  );
}

/** Revisions drawer: list of published versions, read-only view of one, restore into the draft. Mount only while open. */
export default function HistorySheet({ doc, onClose, canWrite, dirty, onRestored }) {
  const [version, setVersion] = useState(null);
  const { data, error, loading, reload } = useAdminQuery(`/admin/content/${encodeURIComponent(doc.key)}/revisions`);
  const revisions = listOf(data).slice().sort((a, b) => b.version - a.version);

  return (
    <Drawer open onClose={onClose} title="History" description={`Published versions of ${doc.schema?.label || doc.key}. The last 50 are kept.`} width={540}>
      {version !== null ? (
        <RevisionView docKey={doc.key} version={version} doc={doc} canWrite={canWrite} dirty={dirty} onBack={() => setVersion(null)} onRestored={onRestored} />
      ) : loading ? (
        <div className="adm-stack">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={64} />)}</div>
      ) : error ? (
        <ErrorState title="Could not load the history" description={error.message} onRetry={reload} />
      ) : !revisions.length ? (
        <EmptyState icon="clock" title="Nothing published yet" description="Versions appear here after the first publish." />
      ) : (
        <ol className="adm-cms-revlist">
          {revisions.map((r) => (
            <li key={r.version}>
              <button type="button" onClick={() => setVersion(r.version)}>
                <span className="adm-cms-revlist__v">v{r.version}</span>
                <span className="adm-cms-revlist__text">
                  <b>{formatDateTime(r.publishedAt)}</b>
                  <small>by {personName(r.publishedBy)}</small>
                  {r.note ? <em>{r.note}</em> : null}
                </span>
                {r.version === doc.version ? <StatusBadge tone="success">Live</StatusBadge> : <Undo2 size={15} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
}
