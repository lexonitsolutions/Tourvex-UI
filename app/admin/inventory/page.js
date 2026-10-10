"use client";

import { RequirePermission } from "../_kit";
import StockList from "./_components/StockList";

export default function InventoryPage() {
  return (
    <RequirePermission permission="stock.read">
      <StockList />
    </RequirePermission>
  );
}
