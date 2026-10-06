"use client"

import * as React from "react"
import { cn } from "@/app/admin/_ui/lib/utils"
import { Progress as ProgressPrimitive } from "radix-ui"

function Progress({
  className,
  value,
  ...props
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "tw:relative tw:h-2 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-primary/20",
        className
      )}
      {...props}>
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="tw:h-full tw:w-full tw:flex-1 tw:bg-primary"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
    </ProgressPrimitive.Root>
  );
}

export { Progress }
