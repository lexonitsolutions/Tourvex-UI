"use client"

import * as React from "react"
import { cn } from "@/app/admin/_ui/lib/utils"
import { usePortalContainer } from "@/app/admin/_ui/lib/portal"
import { Tooltip as TooltipPrimitive } from "radix-ui"

function TooltipProvider({
  delayDuration = 0,
  ...props
}) {
  return (<TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />);
}

function Tooltip({
  ...props
}) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
  ...props
}) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}) {
  const container = usePortalContainer()
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "tw:z-[320] tw:w-fit tw:origin-(--radix-tooltip-content-transform-origin) adm-pop tw:rounded-lg tw:border tw:border-white/10 tw:bg-(--adm-tip-bg) tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-medium tw:text-balance tw:text-white tw:shadow-(--adm-shadow-pop)",
          className
        )}
        {...props}>
        {children}
        <TooltipPrimitive.Arrow
          className="tw:z-[320] tw:size-2.5 tw:translate-y-[calc(-50%_-_2px)] tw:rotate-45 tw:rounded-[2px] tw:bg-(--adm-tip-bg) tw:fill-(--adm-tip-bg)" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
