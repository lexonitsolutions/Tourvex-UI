import { redirect } from "next/navigation";

// Sign-in moved to Clerk (/sign-in). Keep old links and bookmarks working.
export default async function LoginRedirect({ searchParams }) {
  const params = (await searchParams) || {};
  const query = new URLSearchParams();
  const next = typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : null;
  if (next) query.set("redirect_url", next);
  if (typeof params.reason === "string") query.set("reason", params.reason);
  if (params.type === "b2b") redirect("/partners");
  const qs = query.toString();
  redirect(qs ? `/sign-in?${qs}` : "/sign-in");
}
