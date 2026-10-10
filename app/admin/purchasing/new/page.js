"use client";

import { RequirePermission } from "../../_kit";
import PurchaseEditor from "../_components/PurchaseEditor";

export default function NewPurchasePage() {
  return (
    <RequirePermission permission="purchasing.write">
      <PurchaseEditor />
    </RequirePermission>
  );
}
