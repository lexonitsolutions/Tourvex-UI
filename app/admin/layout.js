import "@fontsource-variable/geist";
import "./admin.css";
import "./_kit/kit.css";
import "./_kit/dash.css";
import "./_ui/tailwind.css";
import "./_ui/theme.css";
import "./_ui/motion.css";
import "./_ui/polish.css";
import { Suspense } from "react";
import AdminProviders from "./AdminProviders";
import { NO_FLASH_SCRIPT } from "./_ui/theme/theme-store";
import { ThemeSync } from "./_ui/theme/ThemeProvider";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// The admin lives outside the (market) group, so it never mounts the marketplace header/footer/tab bar/preloader/Lenis.
// The root layout already provides ClerkProvider. Never indexed.
export const metadata = {
  title: { default: "Admin | Tourvex", template: "%s | Tourvex Admin" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({ children }) {
  return (
    // display:contents wrapper that carries data-adm-theme / data-adm-dark (never <html>: the public site owns it, and a
    // pre-hydration attribute change there would be a hydration mismatch). The script runs before first paint.
    <div data-adm-themeroot="" style={{ display: "contents" }} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      <ThemeSync />
      {/* The admin shell reads the URL on the client (usePathname/useParams); Suspense keeps that out of the prerender. */}
      <Suspense fallback={null}>
        <AdminProviders>{children}</AdminProviders>
      </Suspense>
    </div>
  );
}
