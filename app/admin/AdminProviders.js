"use client";

import AppProvider from "../components/AppProvider";
import { AdminMeProvider } from "./_lib/AdminMeProvider";
import AdminShell from "./_kit/AdminShell";
import { ToastProvider } from "./_kit/Toast";

// Reuses the site's AppProvider only for Clerk-backed auth (`getAccessToken`, `logout`); none of the marketplace chrome is rendered.
export default function AdminProviders({ children }) {
  return (
    <AppProvider>
      <ToastProvider>
        <AdminMeProvider>
          <AdminShell>{children}</AdminShell>
        </AdminMeProvider>
      </ToastProvider>
    </AppProvider>
  );
}
