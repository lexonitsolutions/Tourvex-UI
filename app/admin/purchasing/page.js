"use client";

import { RequirePermission } from "../_kit";
import PurchaseList from "./_components/PurchaseList";

export default function PurchasingPage() {
  return (
    <RequirePermission permission="purchasing.read">
      <PurchaseList />
    </RequirePermission>
  );
}
