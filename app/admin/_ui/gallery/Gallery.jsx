"use client";

import { useEffect, useState } from "react";
import { Toaster } from "@/app/admin/_ui/components/sonner";
import { PortalContainerProvider } from "@/app/admin/_ui/lib/portal";
import { ThemeToggle } from "@/app/admin/_ui/theme";
import { forceDarkUi } from "@/app/admin/_ui/theme/theme-store";
import Showcase from "./Showcase";

/** A forced light/dark surface. Portals opened inside it mount inside it, so overlays follow the panel's scheme. */
function SchemePanel({ scheme }) {
  const [el, setEl] = useState(null);
  return (
    <div
      ref={setEl}
      data-adm-scheme={scheme}
      className="tw:relative tw:min-w-0 tw:overflow-hidden tw:rounded-xl tw:border"
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:border-b tw:bg-muted/40 tw:px-4 tw:py-2 tw:text-xs tw:font-semibold tw:tracking-wide tw:uppercase tw:text-muted-foreground">
        {scheme} scheme
      </div>
      <PortalContainerProvider container={el}>
        <Showcase id={scheme} />
      </PortalContainerProvider>
    </div>
  );
}

/** Development-only gallery for the shadcn-based admin foundation (route: /admin/_ui). */
export default function Gallery() {
  useEffect(() => forceDarkUi(), []);
  return (
    <div className="tw:space-y-4 tw:bg-background tw:p-4 tw:text-foreground tw:sm:p-6">
      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
        <div>
          <h1 className="tw:text-xl tw:font-semibold">shadcn/ui foundation</h1>
          <p className="tw:text-sm tw:text-muted-foreground">Development only (404 in production). Every component in a forced light and a forced dark panel. All data is sample data.</p>
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:text-xs tw:text-muted-foreground">Page theme</span>
          <ThemeToggle />
        </div>
      </div>
      <div className="tw:grid tw:gap-6 tw:xl:grid-cols-2">
        <SchemePanel scheme="light" />
        <SchemePanel scheme="dark" />
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
