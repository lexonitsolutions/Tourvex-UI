import Link from "next/link";

/** True for targets the API's validator accepts: site-relative, https, mailto, tel. Re-checked here as defence in depth. */
export function isSafeHref(href) {
  if (typeof href !== "string" || href.length === 0) return false;
  if (href.startsWith("/")) return !href.startsWith("//");
  return /^(https:\/\/|mailto:|tel:)/i.test(href);
}

/**
 * Link for CMS-provided targets: next/link for relative paths, a plain anchor for https/mailto/tel,
 * and an inert span for anything unsafe (it can never produce a javascript: or data: href).
 */
export function CmsLink({ href, children, ...props }) {
  if (!isSafeHref(href)) return <span {...props}>{children}</span>;
  if (href.startsWith("/")) return <Link href={href} {...props}>{children}</Link>;
  const external = /^https:/i.test(href);
  return (
    <a href={href} {...(external ? { rel: "noopener noreferrer" } : {})} {...props}>
      {children}
    </a>
  );
}
