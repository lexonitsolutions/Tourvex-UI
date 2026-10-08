"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { RequirePermission } from "../../_kit";
import { catalogConfig } from "../_config";
import CatalogList from "../_components/CatalogList";

export default function CatalogListPage({ params }) {
  const { type } = use(params);
  const config = catalogConfig(type);
  if (!config) notFound();
  return (
    <RequirePermission permission="catalog.read">
      <CatalogList key={type} config={config} />
    </RequirePermission>
  );
}
