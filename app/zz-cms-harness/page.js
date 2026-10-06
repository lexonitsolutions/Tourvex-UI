"use client";
// HARNESS-TEMP: dev-only harness (removed after verification). Stubs the admin session so the real shell + content pages render without Clerk.
import "@fontsource-variable/geist";
import "../admin/admin.css";
import "../admin/_kit/kit.css";
import "../admin/_kit/dash.css";
import "../admin/_ui/tailwind.css";
import "../admin/_ui/theme.css";
import "../admin/_ui/motion.css";
import "../admin/_ui/polish.css";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppProvider from "../components/AppProvider";
import { AdminMeContext } from "../admin/_lib/AdminMeProvider";
import AdminShell from "../admin/_kit/AdminShell";
import { ToastProvider } from "../admin/_kit/Toast";
import { NO_FLASH_SCRIPT } from "../admin/_ui/theme/theme-store";
import { ThemeSync } from "../admin/_ui/theme/ThemeProvider";
import ListPage from "../admin/content/page";
import EditorPage from "../admin/content/[key]/page";

function Inner() {
  const q = useSearchParams();
  const perms = (q.get("perms") || "cms.read,cms.write,cms.publish").split(",");
  const doc = q.get("doc");
  const [params] = useState(() => Promise.resolve({ key: doc || "x" }));
  const value = useMemo(() => {
    const set = new Set(perms);
    return {
      status: "ready", error: null, me: null, user: { id: "u1", name: "Cms Tester", email: "cms.tester@example.com", roles: ["content"] }, permissions: set,
      menu: [{ id: "dashboard", label: "Dashboard", href: "/admin", icon: "dashboard" }, { id: "content", label: "Website content", href: "/admin/content", icon: "catalog" }],
      reload() {}, can: (p) => (Array.isArray(p) ? p.some((x) => set.has(x)) : set.has(p)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.get("perms")]);
  return (
    <AdminMeContext.Provider value={value}>
      <AdminShell>{doc ? <EditorPage params={params} /> : <ListPage />}</AdminShell>
    </AdminMeContext.Provider>
  );
}

export default function Harness() {
  return (
    <div data-adm-themeroot="" style={{ display: "contents" }} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      <ThemeSync />
      <AppProvider>
        <ToastProvider>
          <Suspense fallback={null}><Inner /></Suspense>
        </ToastProvider>
      </AppProvider>
    </div>
  );
}
