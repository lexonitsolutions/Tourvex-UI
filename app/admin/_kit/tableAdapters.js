"use client";

import { useCallback, useMemo } from "react";
import Icon from "./Icon";

/*
 * Glue between the admin list pages and the TanStack-based DataTable (app/admin/_ui/data-table).
 * Pages keep their compact column definitions ({ key, label, render, sortable, align, hidden, primary, nowrap }) and URL params;
 * these helpers turn them into TanStack column defs / row actions and map the URL <-> table state for SERVER-driven tables
 * (manualSorting, manualPagination, manualFiltering with rowCount).
 */

/** { key, label, render(row), sortable, align, hidden, primary, nowrap } -> TanStack v9 column def. Define the result once (useMemo). */
export function fromKitColumns(columns) {
  return columns.map((c) => ({
    id: c.key,
    accessorFn: (row) => row[c.key],
    header: c.label,
    cell: ({ row }) => (c.render ? c.render(row.original) : row.original[c.key] ?? "-"),
    enableSorting: !!c.sortable,
    meta: { label: c.label, align: c.align, primary: c.primary, nowrap: c.nowrap === false ? false : undefined, hidden: c.hidden },
  }));
}

const iconCache = new Map();
function iconComponent(name) {
  if (!iconCache.has(name)) {
    const Cmp = function KitIcon({ size = 16 }) {
      return <Icon name={name} size={size} />;
    };
    iconCache.set(name, Cmp);
  }
  return iconCache.get(name);
}

/** (row) => [{ label, icon: "eye", onSelect, danger, disabled, separator }] -> the DataTable `rowActions` shape. */
export function fromKitActions(getItems) {
  if (!getItems) return undefined;
  return (row) => {
    const out = [];
    let sep = false;
    (getItems(row) || []).filter(Boolean).forEach((i) => {
      if (i.separator) {
        sep = true;
        return;
      }
      out.push({
        label: i.label,
        icon: i.icon ? iconComponent(i.icon) : undefined,
        destructive: i.danger,
        disabled: i.disabled,
        separatorBefore: sep,
        onSelect: () => (i.href ? window.location.assign(i.href) : i.onSelect?.(row)),
      });
      sep = false;
    });
    return out;
  };
}

/**
 * URL params <-> server table state. `params` / `setParams` come from useUrlParams(); `limit` / `setLimit` from usePageSize().
 * sort is "field:asc|desc" in the URL; page is 1-based in the URL and 0-based in the table.
 */
export function useTableUrlState(params, setParams, limit, setLimit) {
  const page = Math.max(1, Number(params.page) || 1);
  const [sortId, sortDir] = (params.sort || "").split(":");
  const sorting = useMemo(() => (sortId ? [{ id: sortId, desc: sortDir === "desc" }] : []), [sortId, sortDir]);
  const pagination = useMemo(() => ({ pageIndex: page - 1, pageSize: limit }), [page, limit]);
  const onSortingChange = useCallback(
    (next) => {
      const first = next?.[0];
      setParams({ sort: first ? `${first.id}:${first.desc ? "desc" : "asc"}` : "" });
    },
    [setParams]
  );
  const onPaginationChange = useCallback(
    (next) => {
      if (next.pageSize !== limit) setLimit(next.pageSize);
      else setParams({ page: next.pageIndex + 1 });
    },
    [limit, setLimit, setParams]
  );
  return { sorting, onSortingChange, pagination, onPaginationChange };
}

/** string[] of ids <-> TanStack rowSelection record. */
export function useSelectionState(selected, setSelected) {
  const rowSelection = useMemo(() => Object.fromEntries(selected.map((id) => [id, true])), [selected]);
  const onRowSelectionChange = useCallback((next) => setSelected(Object.keys(next)), [setSelected]);
  return { rowSelection, onRowSelectionChange };
}
