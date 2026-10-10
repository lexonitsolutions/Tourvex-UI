"use client";

import { RequirePermission } from "../../_kit";
import SupplierList from "../_components/SupplierList";

export default function SuppliersPage() {
  return (
    <RequirePermission permission="purchasing.read">
      <SupplierList />
    </RequirePermission>
  );
}
