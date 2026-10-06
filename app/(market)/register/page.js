import { redirect } from "next/navigation";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// Sign-in moved to Clerk (/sign-up). Keep old links and bookmarks working.
export default async function RegisterRedirect({ searchParams }) {
  const params = (await searchParams) || {};
  const query = new URLSearchParams();
  const next = typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : null;
  if (next) query.set("redirect_url", next);
  if (typeof params.reason === "string") query.set("reason", params.reason);
  if (params.type === "b2b") redirect("/partners");
  const qs = query.toString();
  redirect(qs ? `/sign-up?${qs}` : "/sign-up");
}
