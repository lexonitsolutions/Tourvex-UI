"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { TableBody, TableCell, TableRow } from "@/app/admin/_ui/components/table";

/**
 * Windowed <tbody>: only the rows near the viewport are mounted. Uses top/bottom spacer rows so the real <table>
 * semantics (and sticky header, column widths) are kept. Rows MUST be fixed height (`rowHeight`).
 * Lazy-loaded by DataTable (React.lazy) so @tanstack/react-virtual is only fetched when a table actually virtualizes.
 */
export default function VirtualBody({ rows, scrollRef, rowHeight, colSpan, renderRow, overscan = 12 }) {
  // eslint-disable-next-line react-hooks/incompatible-library -- virtualizer functions are not memoised here on purpose
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });
  const items = virtualizer.getVirtualItems();
  const total = virtualizer.getTotalSize();
  const padTop = items.length ? items[0].start : 0;
  const padBottom = items.length ? total - items[items.length - 1].end : 0;
  return (
    <TableBody data-virtual-rows={rows.length}>
      {padTop > 0 ? (
        <TableRow aria-hidden className="tw:border-0 tw:hover:bg-transparent" style={{ height: padTop }}>
          <TableCell colSpan={colSpan} className="tw:p-0" />
        </TableRow>
      ) : null}
      {items.map((v) => renderRow(rows[v.index], v.index))}
      {padBottom > 0 ? (
        <TableRow aria-hidden className="tw:border-0 tw:hover:bg-transparent" style={{ height: padBottom }}>
          <TableCell colSpan={colSpan} className="tw:p-0" />
        </TableRow>
      ) : null}
    </TableBody>
  );
}
