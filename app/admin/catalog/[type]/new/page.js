"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { RequirePermission } from "../../../_kit";
import { catalogConfig } from "../../_config";
import CatalogEditor from "../../_components/CatalogEditor";

export default function NewCatalogItemPage({ params }) {
  const { type } = use(params);
  const config = catalogConfig(type);
  if (!config) notFound();
  return (
    <RequirePermission permission="catalog.write">
      <CatalogEditor key={type} config={config} record={null} />
    </RequirePermission>
  );
}
