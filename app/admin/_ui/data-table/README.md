# Admin DataTable (shadcn + TanStack Table v9)

`import { DataTable } from "@/app/admin/_ui/data-table"`

Built on `@tanstack/react-table` v9 (feature-based `useTable`, same API the shadcn Data Table guide uses),
`@tanstack/react-virtual` (lazy, only fetched when a table windows its rows) and the shadcn components in
`app/admin/_ui/components`. All classes carry the `tw:` prefix; the stylesheet is only loaded by `app/admin/layout.js`.

## Quick start

```jsx
const columns = [
  { accessorKey: "ref", header: "Reference", meta: { label: "Reference" } },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <Badge variant="success">{getValue()}</Badge> },
  { accessorKey: "total", header: "Total", meta: { align: "right" } },
];                      // define OUTSIDE the component (or useMemo): TanStack needs stable column/data references

<DataTable columns={columns} data={rows} getRowId={(r) => r.id} storageKey="bookings" />
```

### Server-driven (the normal case for admin lists)

```jsx
<DataTable
  manual rowCount={total}                         // manualSorting + manualFiltering + manualPagination
  sorting={sorting} onSortingChange={setSorting}                 // [{ id: "created", desc: true }]
  pagination={pagination} onPaginationChange={setPagination}     // { pageIndex, pageSize }
  columnFilters={filters} onColumnFiltersChange={setFilters}
  loading={isFetching} error={error} onRetry={refetch}
  ...
/>
```
The table never sorts/filters/slices in `manual` mode; refetch in your state setters / effect (or push the state to the URL).

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `columns` | TanStack v9 column defs | required | `meta: { label, align: "right", className, headerClassName }`. `label` feeds the Columns menu. `enableHiding: false` / `enableSorting: false` supported. |
| `data` | `T[]` | required | Current page (server) or all rows (client). |
| `getRowId` | `(row) => string` | index | Required for stable selection across pages. |
| `label` | string | "Data table" | `aria-label` of the `<table>`. |
| `manual` | boolean | false | Server-driven sorting/filtering/pagination. Pair with `rowCount`. |
| `rowCount` | number | - | Total rows on the server (drives page count/footer). |
| `sorting` / `onSortingChange` | `SortingState` | internal | Controlled or uncontrolled. |
| `pagination` / `onPaginationChange` | `{pageIndex,pageSize}` | internal (`pageSize` prop) | |
| `columnFilters` / `onColumnFiltersChange` | `ColumnFiltersState` | internal | Put filter inputs in `toolbar`. |
| `rowSelection` / `onRowSelectionChange` | `Record<id, boolean>` | internal | |
| `columnVisibility` / `onColumnVisibilityChange` | `Record<id, boolean>` | persisted if `storageKey` | |
| `paginate` | boolean | true | `false` = no pager (use with client data + windowing). |
| `pageSize`, `pageSizeOptions` | number, number[] | 25, [10,25,50,100] | |
| `enableRowSelection` | boolean | false | Adds the checkbox column (indeterminate header). |
| `rowActions` | `(row) => Action[]` | - | Adds a trailing "..." menu. `Action = { label, icon?, onSelect(row), destructive?, disabled?, separatorBefore? }`. |
| `onRowClick` | `(row) => void` | - | Rows become keyboard focusable (Enter/Space). Clicks on buttons/links/checkboxes are ignored. |
| `storageKey` | string | - | Persists column visibility + density to `localStorage` (`tvx-admin:dt:<key>:cols|density`). SSR-safe: server and first client render use defaults, stored value is applied in a layout effect right after hydration. Omit to disable. |
| `density` / `onDensityChange` | "comfortable" \| "compact" | persisted / comfortable | Row height 48 / 36 px. |
| `showColumnsMenu`, `showDensityMenu` | boolean | true | |
| `toolbar` | node \| `(table) => node` | - | Left slot (search, filters). |
| `toolbarActions` | node \| `(table) => node` | - | Right slot, before Density/Columns (export, "New"). |
| `bulkActions` | `({ table, count, rows, clear }) => node` | - | Rendered in the toolbar only while rows are selected. |
| `footer` | node | - | Below the pager. |
| `loading` | boolean | false | Skeleton rows when there is no data yet, otherwise dims the body (`aria-busy`). |
| `error` | string \| Error | - | Error state with "Try again" (`onRetry`). |
| `emptyState` | node | built-in | Replaces the "No results" block. |
| `skeletonRows` | number | 8 | |
| `stickyHeader` | boolean | true | Header sticks inside the scroll container. |
| `maxHeight` | CSS length \| null | `min(70vh, 720px)` | The scroll container's max height. `null` = grow with the page (sticky header then has no effect, windowing needs a height). |
| `virtualize` | "auto" \| boolean | "auto" | "auto" windows when visible rows > `virtualizeThreshold` (100). Rows are fixed-height in this mode (density decides). |
| `className` | string | - | |

Exports: `DataTable`, `selectColumn`, `actionsColumn`, `RowActionsMenu`, `DataTableColumnHeader`, `DataTableColumnsMenu`,
`DataTableDensityMenu`, `DataTablePagination`, `SkeletonRows`, `EmptyRow`, `ErrorRow`, `usePersistedState`, `createColumnHelper`.

## Gotchas

* Tailwind is prefixed: write `tw:flex`, never `flex`. Use `cn()` from `app/admin/_ui/lib/utils` to merge.
* Overlays (dropdown, dialog, sheet, select, popover, tooltip) portal into `#adm-ui-portal` (an `.adm-root` host) via
  `usePortalContainer()`; never import Radix portals directly.
* TanStack v9: features are compiled in once in `DataTable.jsx` (`tableFeatures({...})`). Need grouping/expanding/pinning? Add the feature there.
* Virtual rows must be fixed height; do not let cell content wrap in windowed tables (use `truncate`).
* Dark mode is ON (`DARK_UI_ENABLED = true`): every admin colour is a token in `_ui/theme.css` (light + dark), so a table themes with the page.

## Migration table: old kit component -> new shadcn-based component

Paths: new = `app/admin/_ui/components/*` unless noted. "Keep" = no shadcn equivalent that is better; leave the kit version.

| Old (`app/admin/_kit`) | New | Notes |
|---|---|---|
| `Icon`, `ICON_KEYS` | `lucide-react` icons | Map keys to lucide names; keep `Icon` where a screen still uses it. |
| `Button` | `button` (`Button`) | variants: default, secondary, outline, ghost, link, destructive; sizes default/sm/xs/lg/icon*. |
| `IconButton` | `button` with `size="icon"` / `"icon-sm"` + `aria-label` | |
| `Avatar` | `avatar` | |
| `Skeleton` | `skeleton` | |
| `StatusBadge` | `badge` (`variant="success" \| "warning" \| "info" \| "danger" \| "secondary"`) | Wrap in a status->variant map (see gallery `STATUS_BADGE`). |
| `EmptyState`, `ErrorState` | `data-table` `EmptyRow` / `ErrorRow`; for pages build from `card` + lucide icon | |
| `KeyValue` | `table` or a `dl` with `tw:` classes | No shadcn primitive. |
| `CopyButton` | `button` ghost icon + `sonner` toast | |
| `Card` | `card` (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`) | |
| `Pagination` | `data-table` `DataTablePagination` (tables) / `pagination` (link pagers) | |
| `Timeline` | Keep (compose with `separator` if desired) | |
| `cx` | `cn` from `_ui/lib/utils` | tailwind-merge aware. |
| `ToastProvider` / `useToast` | `sonner` (`Toaster` + `toast()`) | Mount `<Toaster />` once in the shell. |
| `Modal` | `dialog` | |
| `Drawer` | `sheet` (`side="right"`) | |
| `ConfirmDialog` | `alert-dialog` | |
| `Dropdown` | `dropdown-menu` | |
| `Tabs`, `TabPanel` | `tabs` | |
| `Field` | `label` + `input`/`textarea`/`select` (+ `aria-invalid`) | |
| `TextField` | `input` + `label` | |
| `TextArea` | `textarea` | |
| `SelectField` | `select` | |
| `MoneyField` | `input` (`inputMode="decimal"`) | Keep formatting logic from the kit. |
| `DateField` | `popover` + `calendar` (`mode="single"`) | |
| `DateRangeField`, `RangePicker`, `DateRangeFilter` | `date-range-picker` (`DateRangePicker`) | Lazy-loads react-day-picker on first open. |
| `Switch` | `switch` | |
| `MultiSelect` | `popover` + `command` (multi-select pattern) | |
| `Sparkline`, `BarChart`, `LineChart`, `Donut`, `AreaChart`, `HBars` | Keep (`_kit/charts.js`) or `chart` (`BarChartLite`, `AreaChartLite`) | No recharts shipped. |
| `KpiCard`, `StatCard`, `StatusTiles` | `card` + `--adm-tint-*` tokens | Tint tokens have dark values. |
| `DeltaPill`, `CountUp`, `useSpotlight` | Keep | |
| `DataTable` | `data-table` `DataTable` | Column defs change: `{ key, label, render }` -> `{ accessorKey, header, cell, meta }`. Selection/sort/page state is TanStack's. |
| `UserCell`, `Money`, `DateTime`, `IdText` | Keep as cell renderers | Use inside `cell`. |
| `FilterToolbar`, `SelectFilter`, `FilterBar` | `DataTable` `toolbar` slot + `select` / `input` / `popover` | |
| `FiltersButton`, `FiltersDrawer` | `sheet` (+ `button` with a count `badge`) | |
| `ColumnsButton`, `useColumnPrefs` | `DataTableColumnsMenu` (built in; `storageKey`) | |
| `buildChips`, `dateChipText` | `badge` (`variant="secondary"`) + a small helper | |
| `usePageSize` | `DataTable` `pageSize` + `storageKey`, or `pagination` state | |
| `PageHeader` | Keep (or `breadcrumb` + heading) | |
| `SearchInput` | `input` with a lucide `SearchIcon` | |
| `useUrlParams` | Keep | Drive `sorting`/`pagination`/`columnFilters` from the URL. |
| `AdminShell` (sidebar, topbar) | Keep | Mount `ThemeToggle` from `_ui/theme` in the topbar; optionally `command-palette` (lazy). |
| `NoAccess`, `RequirePermission` | Keep | |
| `csv` helpers / `ExportCsvButton` | Keep | |

## Also available (no kit equivalent)

`accordion`, `collapsible`, `breadcrumb`, `command` + `command-palette` (Ctrl/Cmd+K, import lazily), `calendar` (lazy),
`checkbox` (indeterminate), `radio-group`, `progress`, `scroll-area`, `separator`, `table`, `tooltip` (wrap in `TooltipProvider`),
`popover`.


## Admin list-page chrome (added in the migration)

Extra props used by every admin list page (all optional):

| Prop | Notes |
|---|---|
| `title`, `count` | Card head: heading + count pill (`count` defaults to `rowCount` / `data.length`). |
| `search` | Node in the card head (the debounced `SearchInput`, 250 ms). |
| `toolbar` | Node or `(table) => node`, rendered full width ABOVE the card. Pages put the one-row `FilterToolbar` here and the `DataTableColumnsMenu` in its `end` slot; set `columnsInToolbar` so the head does not repeat the Columns menu. |
| `bulkActions` | `({ table, count, rows, ids, clear }) => node`, shown in the dark bulk bar inside the card while rows are selected. |
| `minWidth` | Table min width (default 1020; `0` for embedded tables). |
| `meta.hidden` | Column meta: hidden by default (stored visibility overrides it). `meta.primary` = bold first cell + card title on phones. |

Behaviour: rows are `React.memo`'d (re-render only for their own data / selection / visible columns / density / column defs), the previous page
stays visible and dimmed while the next one loads (`loading` with rows present), skeleton rows use the real row height (no layout shift),
and under 760px every row becomes a stacked card (`td[data-label]`, styles in `_kit/lists.css`).

### Bridging the existing pages (`app/admin/_kit/tableAdapters.js`)

* `fromKitColumns([{ key, label, render, sortable, align, hidden, primary }])` -> TanStack column defs (call once, `useMemo`).
* `fromKitActions((row) => [{ label, icon: "eye", onSelect, danger, separator, href }])` -> `rowActions`.
* `useTableUrlState(params, setParams, limit, setLimit)` -> `{ sorting, onSortingChange, pagination, onPaginationChange }`
  (URL `sort=field:asc|desc`, `page` 1-based, `limit`) for `manual` tables.
* `useSelectionState(ids, setIds)` -> `{ rowSelection, onRowSelectionChange }`.
* `InlineTable` (`_kit/InlineTable.js`): small embedded client table with no pager/menus.
