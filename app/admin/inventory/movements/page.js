"use client";

import { RequirePermission } from "../../_kit";
import Movements from "../_components/Movements";

export default function InventoryMovementsPage() {
  return (
    <RequirePermission permission="stock.read">
      <Movements />
    </RequirePermission>
  );
}
