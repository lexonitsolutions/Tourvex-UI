"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/app/admin/_ui/components/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/app/admin/_ui/components/dropdown-menu";
import { useTheme } from "./ThemeProvider";

/** Sun / moon button with a System | Light | Dark menu. Ready to mount in the topbar. */
export function ThemeToggle({ className, size = "icon" }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size} className={className} aria-label="Colour theme">
          {resolvedTheme === "dark" ? <MoonIcon aria-hidden /> : <SunIcon aria-hidden />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="tw:w-36">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="system"><MonitorIcon aria-hidden /> System</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light"><SunIcon aria-hidden /> Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark"><MoonIcon aria-hidden /> Dark</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
