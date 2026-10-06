"use client"

import * as React from "react"
import { cn } from "@/app/admin/_ui/lib/utils"
import { usePortalContainer } from "@/app/admin/_ui/lib/portal"
import { XIcon } from "lucide-react"
import { Dialog as SheetPrimitive } from "radix-ui"

function Sheet({
  ...props
}) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}) {
  const container = usePortalContainer()
  return <SheetPrimitive.Portal container={container} data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "adm-ov tw:fixed tw:inset-0 tw:z-[320] tw:bg-(--adm-scrim)",
        className
      )}
      {...props} />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "adm-sheet tw:fixed tw:z-[320] tw:flex tw:flex-col tw:gap-4 tw:bg-(--adm-overlay) tw:shadow-(--adm-shadow-lg)",
          `adm-sheet--${side}`,
          side === "right" &&
            "tw:inset-y-0 tw:right-0 tw:h-full tw:w-3/4 tw:border-l tw:sm:max-w-sm",
          side === "left" &&
            "tw:inset-y-0 tw:left-0 tw:h-full tw:w-3/4 tw:border-r tw:sm:max-w-sm",
          side === "top" &&
            "tw:inset-x-0 tw:top-0 tw:h-auto tw:border-b",
          side === "bottom" &&
            "tw:inset-x-0 tw:bottom-0 tw:h-auto tw:border-t",
          className
        )}
        {...props}>
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            className="tw:absolute tw:top-4 tw:right-4 tw:rounded-xs tw:opacity-70 tw:ring-offset-background tw:transition-opacity tw:hover:opacity-100 tw:focus:ring-2 tw:focus:ring-ring tw:focus:ring-offset-2 tw:focus:outline-hidden tw:disabled:pointer-events-none tw:data-[state=open]:bg-secondary">
            <XIcon className="tw:size-4" />
            <span className="tw:sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("tw:flex tw:flex-col tw:gap-1.5 tw:p-4", className)}
      {...props} />
  );
}

function SheetFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("tw:mt-auto tw:flex tw:flex-col tw:gap-2 tw:p-4", className)}
      {...props} />
  );
}

function SheetTitle({
  className,
  ...props
}) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("tw:font-semibold tw:text-foreground", className)}
      {...props} />
  );
}

function SheetDescription({
  className,
  ...props
}) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("tw:text-sm tw:text-muted-foreground", className)}
      {...props} />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
