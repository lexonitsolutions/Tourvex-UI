"use client";

import { RequirePermission } from "../../_kit";
import ItemDetail from "../_components/ItemDetail";

export default function InventoryItemPage() {
  return (
    <RequirePermission permission="stock.read">
      <ItemDetail />
    </RequirePermission>
  );
}
