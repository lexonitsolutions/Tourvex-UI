import "@fontsource-variable/geist";
import "./admin.css";
import "./_kit/kit.css";
import "./_kit/dash.css";
import "./_ui/tailwind.css";
import "./_ui/theme.css";
import "./_ui/motion.css";
import "./_ui/polish.css";
import AdminProviders from "./AdminProviders";
import { NO_FLASH_SCRIPT } from "./_ui/theme/theme-store";
import { ThemeSync } from "./_ui/theme/ThemeProvider";

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
      <AdminProviders>{children}</AdminProviders>
    </div>
  );
}
