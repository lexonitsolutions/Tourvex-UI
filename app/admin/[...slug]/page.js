"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { humanize } from "../_lib/format";
import { Card, EmptyState, PageHeader } from "../_kit";

// Menu entries for modules that later phases will build (bookings, enquiries, ...) land here instead of a bare 404.
export default function ModuleComingSoon({ params }) {
  const { slug } = use(params);
  const { menu } = useAdminMe();
  const href = `/admin/${slug.join("/")}`;
  const flat = [...menu, ...menu.flatMap((m) => m.children || [])];
  const item = flat.find((m) => m.href === href);
  if (!item && slug.length > 1) notFound();
  const title = item?.label || humanize(slug[0]);
  return (
    <>
      <PageHeader title={title} />
      <Card flush>
        <EmptyState icon="settings" title={`${title} is not built yet`} description="This module is planned for a later phase of the admin platform. Your menu already reflects what your role will be able to open." />
      </Card>
    </>
  );
}
