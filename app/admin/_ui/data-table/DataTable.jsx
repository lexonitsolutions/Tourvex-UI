"use client";

import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  columnFilteringFeature, columnVisibilityFeature, createFilteredRowModel, createPaginatedRowModel, createSortedRowModel,
  filterFn_equalsString, filterFn_includesString, filterFn_inNumberRange, flexRender, rowPaginationFeature, rowSelectionFeature,
  rowSortingFeature, sortFn_alphanumeric, sortFn_basic, sortFn_datetime, sortFn_text, tableFeatures, useTable,
} from "@tanstack/react-table";
import { XIcon } from "lucide-react";
import { Button } from "@/app/admin/_ui/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/admin/_ui/components/table";
import { cn } from "@/app/admin/_ui/lib/utils";
import { usePersistedState } from "./use-persisted-state";
import {
  DataTableColumnHeader, DataTableColumnsMenu, DataTableDensityMenu, DataTablePagination, EmptyRow, ErrorRow, SkeletonRows,
  actionsColumn, columnLabel, selectColumn,
} from "./parts";

// Heavy bits are lazy: the virtualizer is only fetched when a table actually windows its rows.
const VirtualBody = lazy(() => import("./VirtualBody"));

// Declared once, outside the component (TanStack v9 recommendation): which features + row models are compiled in.
const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  columnFilteringFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, basic: sortFn_basic, datetime: sortFn_datetime },
  filterFns: { includesString: filterFn_includesString, equalsString: filterFn_equalsString, inNumberRange: filterFn_inNumberRange },
});

const ROW_H = { comfortable: 56, compact: 40 };
const CELL_PAD = { comfortable: "tw:px-3.5 tw:py-2", compact: "tw:px-3.5 tw:py-1" };
const NOOP_SORT = [];
const NO_SELECTION = {};
const EMPTY_VIS = {};

/** Use controlled state when the prop is provided, otherwise an internal copy. */
function useControllable(value, onChange, initial) {
  const [internal, setInternal] = useState(initial);
  const controlled = value !== undefined;
  return [controlled ? value : internal, (u) => {
    const next = typeof u === "function" ? u(controlled ? value : internal) : u;
    if (!controlled) setInternal(next);
    onChange?.(next);
  }];
}

/**
 * One body row, memoised: it re-renders only when ITS data, selection, visible-column set, density or the column definitions change
 * (not when the toolbar, another row's selection, the pager or a search keystroke re-renders the table).
 */
const BodyRow = memo(
  function BodyRow({ row, selected, density, rowHeight, clickable, onRowClick }) {
    return (
      <TableRow
        data-state={selected ? "selected" : undefined}
        tabIndex={clickable ? 0 : undefined}
        style={{ height: rowHeight }}
        className={cn("tw:border-(--adm-line-soft) tw:hover:bg-(--adm-surface-hover) tw:data-[state=selected]:bg-(--adm-surface-selected) tw:data-[state=selected]:hover:bg-(--adm-surface-selected-hover)", clickable && "tw:cursor-pointer")}
        onClick={
          clickable
            ? (e) => {
                if (e.target.closest("button, a, input, [role=checkbox], [role=menuitem]")) return;
                onRowClick(row.original);
              }
            : undefined
        }
        onKeyDown={
          clickable
            ? (e) => {
                if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onRowClick(row.original);
                }
              }
            : undefined
        }
      >
        {row.getVisibleCells().map((cell) => {
          const meta = cell.column.columnDef.meta || {};
          return (
            <TableCell
              key={cell.id}
              data-label={meta.label}
              data-primary={meta.primary ? "" : undefined}
              data-kind={cell.column.id === "__select" ? "select" : cell.column.id === "__actions" ? "actions" : undefined}
              className={cn(CELL_PAD[density], meta.nowrap === false && "tw:whitespace-normal", meta.align === "right" && "tw:text-right", meta.primary && "tw:font-semibold tw:text-(--adm-ink)", meta.className)}
            >
              <div className="adm-dt2__cell">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
            </TableCell>
          );
        })}
      </TableRow>
    );
  },
  (a, b) =>
    a.row.original === b.row.original &&
    a.selected === b.selected &&
    a.density === b.density &&
    a.rowHeight === b.rowHeight &&
    a.clickable === b.clickable &&
    a.onRowClick === b.onRowClick &&
    a.colsKey === b.colsKey &&
    a.cols === b.cols
);

/**
 * shadcn-style data table on TanStack Table v9. See README.md for the base props.
 *
 * Server-driven: pass `manual` + `rowCount`; own `sorting` / `pagination` / `columnFilters` and refetch in the change handlers.
 * Client-side: omit `manual`; sorting/filtering/pagination run locally and tables with > `virtualizeThreshold` visible rows window them.
 *
 * Chrome (admin list look): `toolbar` (node or `(table) => node`, rendered full width above the card: put the FilterToolbar there and
 * the DataTableColumnsMenu in its `end` slot), then ONE rounded card holding the head (`title` + `count`, `search`, `toolbarActions`,
 * density menu, Columns menu unless `columnsInToolbar`), the bulk bar, the table and the pager. Rows are memoised, keep the previous page
 * dimmed while the next one loads, and under 760px every row becomes a stacked card (td[data-label] + lists.css).
 */
export function DataTable({
  columns,
  data,
  getRowId,
  label = "Data table",
  manual = false,
  rowCount,
  sorting, onSortingChange,
  pagination, onPaginationChange,
  columnFilters, onColumnFiltersChange,
  rowSelection, onRowSelectionChange,
  columnVisibility, onColumnVisibilityChange,
  paginate = true,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  enableRowSelection = false,
  rowActions,
  onRowClick,
  storageKey,
  density: densityProp,
  onDensityChange,
  showColumnsMenu = true,
  columnsInToolbar = false,
  showDensityMenu = true,
  title,
  count,
  search,
  toolbar,
  toolbarActions,
  bulkActions,
  footer,
  loading = false,
  error,
  onRetry,
  emptyState,
  skeletonRows = 8,
  stickyHeader = true,
  maxHeight = "min(74vh, 960px)",
  virtualize = "auto",
  virtualizeThreshold = 100,
  minWidth = 1020,
  className,
}) {
  const key = (suffix) => (storageKey ? `tvx-admin:dt:${storageKey}:${suffix}` : null);

  const [sortState, setSortState] = useControllable(sorting, onSortingChange, NOOP_SORT);
  const [filterState, setFilterState] = useControllable(columnFilters, onColumnFiltersChange, NOOP_SORT);
  const [pageState, setPageState] = useControllable(pagination, onPaginationChange, { pageIndex: 0, pageSize });
  const [selectState, setSelectState] = useControllable(rowSelection, onRowSelectionChange, NO_SELECTION);

  // Default visibility comes from column meta (`meta.hidden: true`); a stored choice (storageKey) overrides it after hydration.
  const defaultVis = useMemo(() => {
    const out = {};
    columns.forEach((c) => {
      if (c.meta?.hidden) out[c.id ?? c.accessorKey] = false;
    });
    return Object.keys(out).length ? out : EMPTY_VIS;
  }, [columns]);
  const [persistedVis, setPersistedVis] = usePersistedState(key("cols"), null);
  const visState = columnVisibility !== undefined ? columnVisibility : persistedVis ?? defaultVis;
  const setVisState = (u) => {
    const next = typeof u === "function" ? u(visState) : u;
    if (columnVisibility === undefined) setPersistedVis(next);
    onColumnVisibilityChange?.(next);
  };
  const [persistedDensity, setPersistedDensity] = usePersistedState(key("density"), "comfortable");
  const density = densityProp || persistedDensity;
  const changeDensity = (d) => {
    setPersistedDensity(d);
    onDensityChange?.(d);
  };

  // latest-callback refs keep column identity (and therefore memoised rows) stable across parent re-renders
  const latest = useRef({});
  useEffect(() => {
    latest.current = { rowActions, onRowClick };
  });
  const hasActions = !!rowActions;
  const stableActions = useCallback((row) => latest.current.rowActions?.(row), []);
  const clickRow = useCallback((row) => latest.current.onRowClick?.(row), []);

  const allColumns = useMemo(() => {
    const cols = [...columns];
    if (enableRowSelection) cols.unshift(selectColumn());
    // eslint-disable-next-line react-hooks/refs -- stableActions only reads the ref when a row is rendered, never here
    if (hasActions) cols.push(actionsColumn(stableActions));
    return cols;
  }, [columns, enableRowSelection, hasActions, stableActions]);

  const pageStateEff = paginate ? pageState : { pageIndex: 0, pageSize: Math.max(data.length, 1) };

  const table = useTable({
    features,
    data,
    columns: allColumns,
    getRowId,
    manualSorting: manual,
    manualFiltering: manual,
    manualPagination: manual,
    autoResetPageIndex: !manual,
    sortDescFirst: false,
    enableMultiSort: false,
    rowCount: manual ? rowCount : undefined,
    enableRowSelection: enableRowSelection || undefined,
    state: { sorting: sortState, columnFilters: filterState, pagination: pageStateEff, rowSelection: selectState, columnVisibility: visState },
    onSortingChange: setSortState,
    onColumnFiltersChange: setFilterState,
    onPaginationChange: setPageState,
    onRowSelectionChange: setSelectState,
    onColumnVisibilityChange: setVisState,
  });

  const scrollRef = useRef(null);
  const rows = table.getRowModel().rows;
  const visibleCols = table.getVisibleLeafColumns();
  const colsKey = `${density}|${visibleCols.map((c) => c.id).join(",")}|${allColumns.length}`;
  const colSpan = Math.max(visibleCols.length, 1);
  const rowHeight = ROW_H[density] || ROW_H.comfortable;
  const windowed = virtualize === "auto" ? rows.length > virtualizeThreshold : !!virtualize;
  const selectedCount = Object.keys(selectState || {}).length;
  const showSkeleton = loading && rows.length === 0;
  const stale = loading && rows.length > 0;
  const headerGroups = table.getHeaderGroups();
  const total = count ?? (manual ? rowCount : data.length);

  const renderRow = (row) => (
    <BodyRow key={row.id} row={row} selected={row.getIsSelected()} density={density} rowHeight={rowHeight} clickable={!!onRowClick} onRowClick={clickRow} colsKey={colsKey} cols={allColumns} />
  );

  const toolbarNode = typeof toolbar === "function" ? toolbar(table) : toolbar;
  const bulkNode =
    bulkActions && selectedCount > 0
      ? bulkActions({ table, count: selectedCount, rows: table.getSelectedRowModel().rows.map((r) => r.original), ids: Object.keys(selectState || {}), clear: () => table.resetRowSelection(true) })
      : null;
  const showHead = title || search || toolbarActions || showDensityMenu || (showColumnsMenu && !columnsInToolbar);

  return (
    <div data-slot="data-table" className={cn("adm-dt2 tw:flex tw:flex-col tw:gap-3.5", className)}>
      {toolbarNode}

      <div className="adm-dt2__card tw:overflow-hidden tw:rounded-[18px] tw:border tw:border-(--adm-line) tw:bg-card tw:text-card-foreground tw:shadow-(--adm-shadow-table)">
        {showHead ? (
          <div className="adm-dt2__head tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-x-4 tw:gap-y-2.5 tw:px-[18px] tw:pt-4 tw:pb-3.5">
            <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
              {title ? (
                <h2 className="tw:flex tw:items-center tw:gap-2.5 tw:text-[17px] tw:font-semibold tw:tracking-[-0.012em] tw:text-(--adm-ink)">
                  {title}
                  {total != null ? <span className="tw:inline-flex tw:h-6 tw:items-center tw:rounded-full tw:bg-(--adm-fill-neutral) tw:px-2.5 tw:text-[12.5px] tw:font-semibold tw:tabular-nums tw:text-(--adm-muted)">{Number(total).toLocaleString("en-GB")}</span> : null}
                </h2>
              ) : null}
            </div>
            <div className="adm-dt2__headend tw:ml-auto tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              {search}
              {typeof toolbarActions === "function" ? toolbarActions(table) : toolbarActions}
              {showDensityMenu ? <DataTableDensityMenu density={density} onDensityChange={changeDensity} /> : null}
              {showColumnsMenu && !columnsInToolbar ? <DataTableColumnsMenu table={table} /> : null}
            </div>
          </div>
        ) : null}

        {bulkNode ? (
          <div role="region" aria-label="Bulk actions" className="adm-dt2__bulk tw:mx-3.5 tw:mb-3 tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:rounded-[14px] tw:bg-linear-to-br tw:from-(--adm-bulk-from) tw:to-(--adm-bulk-to) tw:py-2 tw:pr-2 tw:pl-4 tw:text-(--adm-bulk-white) tw:shadow-(--adm-shadow-bulk)">
            <span className="tw:text-sm tw:text-(--adm-bulk-ink)"><b className="tw:text-base tw:tabular-nums tw:text-(--adm-bulk-white)">{selectedCount}</b> selected</span>
            <div className="tw:ml-auto tw:flex tw:flex-wrap tw:items-center tw:gap-2">{bulkNode}</div>
            <Button variant="ghost" size="sm" className="tw:h-8 tw:rounded-[10px] tw:text-(--adm-bulk-ink-2) tw:hover:bg-white/12 tw:hover:text-white" onClick={() => table.resetRowSelection(true)}>
              <XIcon aria-hidden /> Clear selection
            </Button>
          </div>
        ) : null}

        <Table
          aria-label={label}
          aria-busy={loading || undefined}
          aria-rowcount={manual && rowCount != null ? rowCount : undefined}
          containerRef={scrollRef}
          containerStyle={{ ...(maxHeight ? { maxHeight } : null), ...(showSkeleton ? { minHeight: skeletonRows * rowHeight + 44 } : null) }}
          containerClassName={cn("adm-dt2__scroll tw:border-t tw:border-(--adm-line)", maxHeight && "tw:overscroll-contain", stale && "tw:opacity-55 tw:transition-opacity tw:duration-150")}
          className="adm-dt2__table" style={{ minWidth }}
        >
          <TableHeader className={cn("tw:max-[760px]:sr-only tw:[&_tr]:border-(--adm-line)", stickyHeader && "tw:sticky tw:top-0 tw:z-10 tw:bg-(--adm-surface-3) tw:shadow-[0_1px_0_var(--adm-line)]")}>
            {headerGroups.map((hg) => (
              <TableRow key={hg.id} className="tw:hover:bg-transparent">
                {hg.headers.map((header) => {
                  const col = header.column;
                  const meta = col.columnDef.meta || {};
                  const sorted = col.getIsSorted();
                  const rendered = header.isPlaceholder ? null : flexRender(col.columnDef.header, header.getContext());
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      scope="col"
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : col.getCanSort() ? "none" : undefined}
                      className={cn("tw:h-11 tw:bg-(--adm-surface-3) tw:text-[11.5px] tw:font-bold tw:tracking-[0.085em] tw:text-(--adm-th) tw:uppercase", CELL_PAD[density], "tw:py-0", meta.align === "right" && "tw:text-right", meta.headerClassName)}
                    >
                      {header.isPlaceholder ? null : <DataTableColumnHeader column={col} title={rendered} />}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          {error && rows.length === 0 ? (
            <TableBody><ErrorRow colSpan={colSpan} error={error} onRetry={onRetry} /></TableBody>
          ) : showSkeleton ? (
            <TableBody key="skeleton" data-phase="skeleton"><SkeletonRows columns={visibleCols} rows={skeletonRows} rowHeight={rowHeight} rowClassName="tw:border-(--adm-line-soft)" /></TableBody>
          ) : rows.length === 0 ? (
            <TableBody key="empty" data-phase="empty"><EmptyRow colSpan={colSpan}>{emptyState}</EmptyRow></TableBody>
          ) : windowed ? (
            <Suspense fallback={<TableBody>{rows.slice(0, 30).map(renderRow)}</TableBody>}>
              <VirtualBody rows={rows} scrollRef={scrollRef} rowHeight={rowHeight} colSpan={colSpan} renderRow={renderRow} />
            </Suspense>
          ) : (
            <TableBody key="rows" data-phase="rows">{rows.map(renderRow)}</TableBody>
          )}
        </Table>

        {error && rows.length > 0 ? (
          <div role="alert" className="tw:flex tw:items-center tw:gap-2 tw:border-t tw:border-(--adm-line) tw:bg-(--adm-danger-soft) tw:px-[18px] tw:py-2 tw:text-sm tw:text-(--adm-danger)">
            {typeof error === "string" ? error : error.message}
            {onRetry ? <button type="button" className="tw:font-semibold tw:underline" onClick={onRetry}>Retry</button> : null}
          </div>
        ) : null}

        {paginate ? (
          <DataTablePagination table={table} rowCount={manual ? rowCount : undefined} pageSizeOptions={pageSizeOptions} className="tw:border-t tw:border-(--adm-line)" />
        ) : (
          <div className="tw:border-t tw:border-(--adm-line) tw:px-[18px] tw:py-3 tw:text-sm tw:text-muted-foreground" aria-live="polite">
            {selectedCount > 0 ? `${selectedCount} selected · ` : ""}{rows.length.toLocaleString()} row{rows.length === 1 ? "" : "s"}{windowed ? " (windowed)" : ""}
          </div>
        )}
      </div>
      {footer}
    </div>
  );
}

export { columnLabel };
