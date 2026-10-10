"use client";

import { RequirePermission } from "../../_kit";
import AlertsList from "../_components/AlertsList";

export default function InventoryAlertsPage() {
  return (
    <RequirePermission permission="stock.read">
      <AlertsList />
    </RequirePermission>
  );
}
