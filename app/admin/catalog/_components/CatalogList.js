"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { formatDate, formatDateTime } from "../../_lib/format";
import { resolveMediaUrl } from "../../_lib/cms";
import {
  Button, ConfirmDialog, FilterToolbar, Icon, Money, PageHeader, SearchInput, SelectFilter, StatusBadge, buildChips, fromKitActions, fromKitColumns,
  useTableUrlState, usePageSize, useToast, useUrlParams,
} from "../../_kit";
import { DataTable } from "../../_ui/data-table";
import { duplicateRecord, recordId } from "../_lib/catalog";

const EMPTY = [];
const LIMIT = 20;
const STATUS = [{ value: "published", label: "Published" }, { value: "unpublished", label: "Unpublished" }];
const SAMPLE = [{ value: "only", label: "Samples only" }, { value: "hide", label: "Hide samples" }];

const publicUrl = (config, item) => (item.slug ? `${config.publicPath}/${encodeURIComponent(item.slug)}` : null);

function Cell({ kind, value }) {
  if (value === null || value === undefined || value === "") return <span className="adm-muted">-</span>;
  if (kind === "money") return <Money value={value.amount} currency={value.currency} />;
  if (kind === "date") return formatDate(value);
  if (kind === "datetime") return formatDateTime(value);
  return value;
}

function MiniThumbnail({ image, fallbackCode, alt = "" }) {
  const [src, setSrc] = useState(() => (image ? resolveMediaUrl(image) : null));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(image ? resolveMediaUrl(image) : null);
    setFailed(false);
  }, [image]);

  if (!src || failed) {
    return (
      <span className="adm-cat-mini is-text" aria-hidden="true">
        {String(fallbackCode || "?").slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <span className="adm-cat-mini" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => {
          if (fallbackCode && !src.includes("flagcdn.com")) {
            setSrc(`https://flagcdn.com/${String(fallbackCode).toLowerCase()}.svg`);
          } else {
            setFailed(true);
          }
        }}
      />
    </span>
  );
}

function TitleCell({ config, item, href }) {
  const isVisa = config.type === "visas" || Boolean(item.countryCode);
  const flagUrl = item.flagUrl || (item.countryCode ? `/flags/${String(item.countryCode).toLowerCase()}.svg` : null);
  const image = item.coverImage || item.image || (isVisa ? flagUrl : null);
  const fallbackCode = item.countryCode || item.title || "?";

  return (
    <div className="adm-cat-titlecell">
      <MiniThumbnail image={image} fallbackCode={fallbackCode} alt={item.country || item.title || ""} />
      <span className="adm-cat-titlecell__text">
        <Link href={href} className="adm-cat-titlelink">{item.title || "Untitled"}</Link>
        <small>{item.slug ? `${config.publicPath}/${item.slug}` : "No slug"}</small>
      </span>
    </div>
  );
}

export default function CatalogList({ config }) {
  const { type } = config;
  const api = useAdminApi();
  const router = useRouter();
  const toast = useToast();
  const { can } = useAdminMe();
  const canWrite = can("catalog.write");
  const canDelete = can("catalog.delete");
  const [params, setParams] = useUrlParams();
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const page = Math.max(1, Number(params.page) || 1);
  const status = STATUS.some((s) => s.value === params.status) ? params.status : "";
  const sample = SAMPLE.some((s) => s.value === params.sample) ? params.sample : "";
  const query = useMemo(
    () => ({
      q: params.q,
      page,
      limit,
      sort: params.sort || undefined,
      published: status ? String(status === "published") : undefined,
      sample: sample ? String(sample === "only") : undefined,
    }),
    [params.q, params.sort, page, limit, status, sample]
  );
  const list = useAdminQuery(`/${type}/admin/all`, query);
  const [confirm, setConfirm] = useState(null); // { item, error }
  const [busy, setBusy] = useState(null); // id of the row being changed
  const [deleting, setDeleting] = useState(false);

  const editHref = (item) => `/admin/catalog/${type}/${item.id}`;
  const newHref = `/admin/catalog/${type}/new`;

  /* ---- sorting: the URL carries the API sort value (price_asc, nights_desc ...); columns declare which values they own */
  const sortable = useMemo(() => Object.fromEntries(config.columns.filter((c) => c.sort).map((c) => [c.key, c.sort])), [config]);
  const sorting = useMemo(() => {
    const hit = Object.entries(sortable).find(([, values]) => values.includes(params.sort));
    return hit ? [{ id: hit[0], desc: hit[1][1] === params.sort }] : [];
  }, [sortable, params.sort]);
  const onSortingChange = (next) => {
    const first = next?.[0];
    const values = first ? sortable[first.id] : null;
    setParams({ sort: values ? (first.desc ? values[1] || values[0] : values[0]) || "" : "" });
  };
  const tableState = { ...useTableUrlState(params, setParams, limit, setLimit), sorting, onSortingChange };

  const columns = useMemo(
    () =>
      fromKitColumns([
        { key: "title", label: "Title", primary: true, render: (r) => <TitleCell config={config} item={r} href={`/admin/catalog/${type}/${r.id}`} /> },
        ...config.columns.map((c) => ({ key: c.key, label: c.label, sortable: !!c.sort, nowrap: true, render: (r) => <Cell kind={c.kind} value={c.value(r)} /> })),
        {
          key: "published",
          label: "Status",
          render: (r) => (
            <span className="adm-cat-status">
              <StatusBadge tone={r.published ? "success" : "neutral"}>{r.published ? "Published" : "Unpublished"}</StatusBadge>
              {r.isSample ? <span className="adm-chip" title="Sample / demo content">Sample</span> : null}
            </span>
          ),
        },
        { key: "updatedAt", label: "Updated", nowrap: true, render: (r) => (r.updatedAt ? formatDate(r.updatedAt) : "-") },
      ]),
    [config, type]
  );

  /* ---- row actions */
  async function setPublished(item, published) {
    setBusy(item.id);
    try {
      await api.patch(`/${type}/${item.id}`, { published });
      toast.success(published ? `Published "${item.title}"` : `Unpublished "${item.title}"`);
      list.reload();
    } catch (e) {
      toast.error(e.status === 404 ? "This item no longer exists." : e.message);
      if (e.status === 404) list.reload();
    } finally {
      setBusy(null);
    }
  }

  async function duplicate(item) {
    setBusy(item.id);
    try {
      const created = await duplicateRecord(api, config, item.id);
      toast.success("Duplicated as an unpublished draft");
      const id = recordId(created);
      if (id) router.push(`/admin/catalog/${type}/${id}`);
      else list.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    const { item } = confirm;
    setDeleting(true);
    try {
      await api.delete(`/${type}/${item.id}`);
      toast.success(`Deleted "${item.title}"`);
      setConfirm(null);
      if ((list.data?.items?.length || 0) <= 1 && page > 1) setParams({ page: page - 1 });
      else list.reload();
    } catch (e) {
      if (e.status === 404) {
        setConfirm(null);
        list.reload();
        toast.info("This item was already deleted.");
      } else setConfirm({ item, error: e.message });
    } finally {
      setDeleting(false);
    }
  }

  const rowActions = useMemo(
    () =>
      fromKitActions((r) => {
        const url = publicUrl(config, r);
        return [
          { label: canWrite ? "Edit" : "View", icon: canWrite ? "edit" : "eye", onSelect: () => router.push(`/admin/catalog/${type}/${r.id}`) },
          ...(r.published && url ? [{ label: "View on site", icon: "external", onSelect: () => window.open(url, "_blank", "noopener,noreferrer") }] : []),
          ...(canWrite
            ? [
                { label: r.published ? "Unpublish" : "Publish", icon: r.published ? "xCircle" : "checkCircle", disabled: busy === r.id, onSelect: () => setPublished(r, !r.published) },
                { label: "Duplicate", icon: "copy", disabled: busy === r.id, onSelect: () => duplicate(r) },
              ]
            : []),
          ...(canDelete ? [{ separator: true }, { label: "Delete", icon: "trash", danger: true, onSelect: () => setConfirm({ item: r }) }] : []),
        ];
      }),
    // handlers close over stable api / toast / list; only inputs that change the menu are listed
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, type, canWrite, canDelete, busy, router]
  );

  const chips = buildChips(
    params,
    [
      { keys: ["q"], label: "Search" },
      { keys: ["status"], label: "Status", text: () => STATUS.find((s) => s.value === status)?.label || params.status },
      { keys: ["sample"], label: "Samples", text: () => SAMPLE.find((s) => s.value === sample)?.label || params.sample },
    ],
    setParams
  );
  const filtered = !!(params.q || status || sample);
  const total = list.data?.pagination?.total;

  return (
    <>
      <PageHeader
        title={config.plural}
        description={typeof total === "number" ? `${total.toLocaleString("en-GB")} ${total === 1 ? config.singular : config.plural.toLowerCase()}${filtered ? " match your filters" : ""}. ${config.description}` : config.description}
        actions={
          canWrite ? (
            <Link href={newHref} className="adm-btn adm-btn--primary">
              <Icon name="plus" size={16} />
              <span className="adm-btn__label">Add {config.singular}</span>
            </Link>
          ) : null
        }
      />
      <DataTable
        label={config.plural}
        storageKey={`catalog-${type}`}
        manual
        title={`${config.plural} list`}
        columns={columns}
        data={list.data?.items || EMPTY}
        getRowId={(r) => r.id}
        rowCount={total}
        {...tableState}
        pageSizeOptions={[10, 20, 25]}
        rowActions={rowActions}
        onRowClick={(r) => router.push(editHref(r))}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder={`Search ${config.plural.toLowerCase()}`} label={`Search ${config.plural.toLowerCase()}`} />}
        toolbar={
          <FilterToolbar chips={chips} onClearAll={() => setParams({ q: "", status: "", sample: "" })}>
            <SelectFilter label="Status" allLabel="All" value={status} onChange={(v) => setParams({ status: v })} options={STATUS} />
            <SelectFilter label="Samples" allLabel="Include" value={sample} onChange={(v) => setParams({ sample: v })} options={SAMPLE} />
          </FilterToolbar>
        }
        emptyState={
          <div className="adm-empty">
            <span className="adm-empty__icon"><Icon name={filtered ? "search" : "inbox"} size={22} /></span>
            <p className="adm-empty__title">{filtered ? `No ${config.plural.toLowerCase()} match your filters` : `No ${config.plural.toLowerCase()} yet`}</p>
            <p className="adm-empty__desc">{filtered ? "Try a different search or clear the filters." : canWrite ? `Add the first ${config.singular} to see it here.` : "Nothing has been added yet."}</p>
            <div className="adm-empty__action">
              {filtered ? <Button onClick={() => setParams({ q: "", status: "", sample: "" })}>Clear filters</Button> : canWrite ? <Link href={newHref} className="adm-btn adm-btn--primary"><span className="adm-btn__label">Add {config.singular}</span></Link> : null}
            </div>
          </div>
        }
      />
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        busy={deleting}
        error={confirm?.error}
        title={`Delete "${confirm?.item?.title || "this item"}"?`}
        description={`This permanently removes the ${config.singular} and its public page. This cannot be undone. To hide it instead, unpublish it.`}
        confirmLabel="Delete"
      />
    </>
  );
}
