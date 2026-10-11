import { redirect } from "next/navigation";

export const instant = false;

export default function CatalogIndex() {
  redirect("/admin/catalog/holidays");
}
