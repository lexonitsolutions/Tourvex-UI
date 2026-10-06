"use client";

import {
  AlertTriangleIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon,
  ChevronsUpDownIcon, Columns3Icon, InboxIcon, MoreVerticalIcon, RowsIcon,
} from "lucide-react";
import { Button } from "@/app/admin/_ui/components/button";
import { Checkbox } from "@/app/admin/_ui/components/checkbox";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/app/admin/_ui/components/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/admin/_ui/components/select";
import { Skeleton } from "@/app/admin/_ui/components/skeleton";
import { TableCell, TableRow } from "@/app/admin/_ui/components/table";
import { cn } from "@/app/admin/_ui/lib/utils";

/** Human label for a column: meta.label, a string header, or the id. */
export function columnLabel(column) {
  const def = column.columnDef || {};
  return def.meta?.label || (typeof def.header === "string" ? def.header : null) || column.id;
}

/* ---------------------------------------------------------------- selection + actions columns */

/** Leading checkbox column (header = select page, indeterminate aware). */
export function selectColumn() {
  return {
    id: "__select",
    enableSorting: false,
    enableHiding: false,
    size: 40,
    meta: { label: "Select", className: "tw:w-10", headerClassName: "tw:w-10" },
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected?.() ? true : table.getIsSomePageRowsSelected?.() ? "indeterminate" : false}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected?.(!!v)}
        aria-label="Select all rows on this page"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Select row ${row.index + 1}`}
      />
    ),
  };
}

/**
 * Trailing "..." menu column. `getActions(rowData)` returns an array of
 * { label, icon?: LucideIcon, onSelect(rowData), destructive?, disabled?, separatorBefore? } (falsy entries are skipped).
 */
export function actionsColumn(getActions) {
  return {
    id: "__actions",
    enableSorting: false,
    enableHiding: false,
    size: 48,
    meta: { label: "Actions", align: "right", className: "tw:w-12 tw:text-right", headerClassName: "tw:w-12" },
    header: () => <span className="tw:sr-only">Actions</span>,
    cell: ({ row }) => <RowActionsMenu actions={getActions(row.original)} row={row.original} />,
  };
}

export function RowActionsMenu({ actions, row }) {
  const items = (actions || []).filter(Boolean);
  if (!items.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="tw:size-9 tw:rounded-[10px]" aria-label="Row actions" onClick={(e) => e.stopPropagation()}>
          <MoreVerticalIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {items.map((a, i) => (
          <span key={a.label + i} className="tw:contents">
            {a.separatorBefore && i > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              variant={a.destructive ? "destructive" : "default"}
              disabled={a.disabled}
              onSelect={() => a.onSelect?.(row)}
            >
              {a.icon ? <a.icon aria-hidden size={16} /> : null}
              {a.label}
            </DropdownMenuItem>
          </span>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------------------------------------------------------- header with sort toggle */

export function DataTableColumnHeader({ column, title, className }) {
  if (!column.getCanSort()) return <span className={className}>{title}</span>;
  const dir = column.getIsSorted();
  // one arrow, rotated by CSS for desc, so switching direction animates instead of swapping glyphs
  const Icon = dir ? ArrowUpIcon : ChevronsUpDownIcon;
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      data-sort={dir || "none"}
      className={cn(
        "tw:-mx-2 tw:inline-flex tw:h-7 tw:items-center tw:gap-1 tw:rounded-md tw:px-2 tw:text-[11.5px] tw:font-bold tw:tracking-[0.085em] tw:uppercase tw:hover:bg-accent tw:hover:text-accent-foreground tw:focus-visible:ring-[3px] tw:focus-visible:ring-ring/50 tw:outline-none",
        dir && "tw:text-foreground",
        className
      )}
    >
      {title}
      <Icon className={cn("tw:size-3.5", dir ? "" : "tw:opacity-50")} aria-hidden />
      <span className="tw:sr-only">{dir === "asc" ? ", sorted ascending" : dir === "desc" ? ", sorted descending" : ", not sorted"}</span>
    </button>
  );
}

/* ---------------------------------------------------------------- toolbar bits */

/** "Columns" menu: toggles column visibility (persisted by the parent DataTable when `storageKey` is set). */
export function DataTableColumnsMenu({ table, className }) {
  const cols = table.getAllLeafColumns().filter((c) => c.getCanHide());
  if (!cols.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("tw:h-10 tw:gap-2 tw:rounded-xl tw:bg-(--adm-control-bg) tw:px-3 tw:font-semibold tw:text-(--adm-ink) tw:shadow-none", className)}>
          <Columns3Icon aria-hidden /> Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="tw:w-48">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {cols.map((c) => (
          <DropdownMenuCheckboxItem
            key={c.id}
            checked={c.getIsVisible()}
            onCheckedChange={(v) => c.toggleVisibility(!!v)}
            onSelect={(e) => e.preventDefault()}
          >
            {columnLabel(c)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DataTableDensityMenu({ density, onDensityChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="tw:size-10 tw:rounded-xl tw:bg-(--adm-control-bg) tw:text-(--adm-ink) tw:shadow-none" aria-label="Row density" title="Row density">
          <RowsIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="tw:w-40">
        <DropdownMenuRadioGroup value={density} onValueChange={onDensityChange}>
          <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------------------------------------------------------- pagination footer */

export function DataTablePagination({ table, rowCount, pageSizeOptions = [10, 20, 50, 100], showSelection = true, className }) {
  const { pageIndex, pageSize } = table.state.pagination;
  const total = rowCount ?? table.getRowCount();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);
  const selected = Object.keys(table.state.rowSelection || {}).length;
  const sizes = [...new Set([...pageSizeOptions, pageSize])].sort((x, y) => x - y);
  // numbered buttons: first, last and the current neighbourhood, with gaps
  const list = [];
  for (let n = 1; n <= pages; n += 1) {
    if (n === 1 || n === pages || Math.abs(n - (pageIndex + 1)) <= 1) list.push(n);
    else if (list[list.length - 1] !== "gap") list.push("gap");
  }
  return (
    <nav aria-label="Pagination" className={cn("tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-x-4 tw:gap-y-2 tw:px-[18px] tw:py-3 tw:text-[13.5px]", className)}>
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-4">
        <span className="tw:text-muted-foreground tw:tabular-nums" aria-live="polite">
          {showSelection && selected > 0 ? `${selected} selected · ` : ""}
          {total === 0 ? "No rows" : `Showing ${from.toLocaleString()}-${to.toLocaleString()} of ${total.toLocaleString()}`}
        </span>
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:text-muted-foreground" id="dt-rows-label">Rows</span>
          <Select value={String(pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
            <SelectTrigger size="sm" className="tw:h-8 tw:w-[4.5rem] tw:rounded-[10px] tw:bg-(--adm-control-bg) tw:font-semibold tw:text-(--adm-ink) tw:shadow-none" aria-labelledby="dt-rows-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {sizes.map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="tw:flex tw:items-center tw:gap-1">
        <Button variant="ghost" size="icon" className="tw:size-[34px] tw:rounded-[10px]" onClick={() => table.previousPage()} disabled={pageIndex <= 0} aria-label="Previous page">
          <ChevronLeftIcon aria-hidden />
        </Button>
        {list.map((n, i) =>
          n === "gap" ? (
            <span key={`g${i}`} className="tw:px-1 tw:text-(--adm-faint)" aria-hidden="true">...</span>
          ) : (
            <Button
              key={n}
              variant={n === pageIndex + 1 ? "default" : "ghost"}
              className={cn("tw:h-[34px] tw:min-w-[34px] tw:rounded-[10px] tw:px-1.5 tw:font-semibold tw:tabular-nums", n === pageIndex + 1 && "tw:bg-linear-to-b tw:from-(--adm-primary-grad) tw:to-(--adm-primary) tw:text-(--adm-on-primary) tw:shadow-(--adm-brand-pill-shadow)")}
              onClick={() => table.setPageIndex(n - 1)}
              aria-current={n === pageIndex + 1 ? "page" : undefined}
              aria-label={`Page ${n}`}
            >
              {n}
            </Button>
          )
        )}
        <Button variant="ghost" size="icon" className="tw:size-[34px] tw:rounded-[10px]" onClick={() => table.nextPage()} disabled={pageIndex >= pages - 1} aria-label="Next page">
          <ChevronRightIcon aria-hidden />
        </Button>
      </div>
    </nav>
  );
}

/* ---------------------------------------------------------------- states */

export function SkeletonRows({ columns, rows = 8, rowClassName, rowHeight }) {
  return Array.from({ length: rows }, (_, r) => (
    <TableRow key={r} className={rowClassName} style={rowHeight ? { height: rowHeight } : undefined} aria-hidden>
      {columns.map((c, i) => (
        <TableCell key={c.id ?? i} className="tw:px-3.5">
          {i === 0 ? (
            <div className="tw:flex tw:items-center tw:gap-2.5">
              <Skeleton className="tw:size-[30px] tw:shrink-0 tw:rounded-full tw:bg-(--adm-skel-a)" />
              <div className="tw:grid tw:flex-1 tw:gap-1.5">
                <Skeleton className="tw:h-3.5 tw:bg-(--adm-skel-a)" style={{ width: `${60 + ((r * 11) % 30)}%` }} />
                <Skeleton className="tw:h-2.5 tw:w-2/5 tw:bg-(--adm-skel-a)" />
              </div>
            </div>
          ) : (
            <Skeleton className="tw:h-3.5 tw:bg-(--adm-skel-a)" style={{ width: `${40 + ((r * 7 + i * 13) % 40)}%` }} />
          )}
        </TableCell>
      ))}
    </TableRow>
  ));
}

export function EmptyRow({ colSpan, children }) {
  return (
    <TableRow className="tw:hover:bg-transparent">
      <TableCell colSpan={colSpan} className="tw:h-40 tw:text-center">
        {children || (
          <div className="tw:mx-auto tw:flex tw:max-w-xs tw:flex-col tw:items-center tw:gap-2 tw:text-muted-foreground">
            <InboxIcon className="tw:size-8 tw:opacity-60" aria-hidden />
            <p className="tw:font-medium tw:text-foreground">No results</p>
            <p className="tw:text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export function ErrorRow({ colSpan, error, onRetry }) {
  const message = typeof error === "string" ? error : error?.message || "Something went wrong while loading this table.";
  return (
    <TableRow className="tw:hover:bg-transparent">
      <TableCell colSpan={colSpan} className="tw:h-40 tw:text-center">
        <div role="alert" className="tw:mx-auto tw:flex tw:max-w-sm tw:flex-col tw:items-center tw:gap-2">
          <AlertTriangleIcon className="tw:size-8 tw:text-destructive" aria-hidden />
          <p className="tw:font-medium tw:text-foreground">Could not load data</p>
          <p className="tw:text-sm tw:text-muted-foreground">{message}</p>
          {onRetry ? <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button> : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
