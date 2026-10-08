"use client";

import AppProvider from "../components/AppProvider";
import DevAdminSession from "./DevAdminSession";
import { AdminMeProvider } from "./_lib/AdminMeProvider";
import AdminShell from "./_kit/AdminShell";
import { ToastProvider } from "./_kit/Toast";

// Reuses the site's AppProvider only for Clerk-backed auth (`getAccessToken`, `logout`); none of the marketplace chrome is rendered.
// DevAdminSession is a no-op outside a local development build (see its header comment).
export default function AdminProviders({ children }) {
  return (
    <AppProvider>
      <DevAdminSession>
        <ToastProvider>
          <AdminMeProvider>
            <AdminShell>{children}</AdminShell>
          </AdminMeProvider>
        </ToastProvider>
      </DevAdminSession>
    </AppProvider>
  );
}
