"use client";

import { DataTable } from "../_ui/data-table";
import { fromKitColumns } from "./tableAdapters";

const EMPTY = [];

/**
 * Small embedded table (detail pages: order bookings, customer tabs) on the TanStack DataTable: client rows, no pager, no toolbar
 * menus, fits its container. columns use the compact kit format ({ key, label, render, align, primary }).
 */
export function InlineTable({ columns, rows, caption, rowId = (r) => r.id, onRowClick, emptyTitle = "Nothing to show" }) {
  return (
    <DataTable
      label={caption}
      columns={fromKitColumns(columns)}
      data={rows || EMPTY}
      getRowId={rowId}
      paginate={false}
      showColumnsMenu={false}
      showDensityMenu={false}
      minWidth={0}
      maxHeight={null}
      onRowClick={onRowClick}
      emptyState={<div className="adm-empty"><p className="adm-empty__title">{emptyTitle}</p></div>}
      className="adm-dt2--inline"
    />
  );
}
