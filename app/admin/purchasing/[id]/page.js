"use client";

import { useParams } from "next/navigation";
import { RequirePermission } from "../../_kit";
import { decodeId } from "../../inventory/_lib/stock";
import PurchaseEditor from "../_components/PurchaseEditor";

export default function PurchasePage() {
  const id = decodeId(useParams().id);
  return (
    <RequirePermission permission="purchasing.read">
      <PurchaseEditor id={id} />
    </RequirePermission>
  );
}
