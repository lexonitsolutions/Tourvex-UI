"use client"

import * as React from "react"
import { cn } from "@/app/admin/_ui/lib/utils"
import { CheckIcon, MinusIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

function Checkbox({
  className,
  ...props
}) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "tw:peer tw:size-4 tw:shrink-0 tw:rounded-[4px] tw:border tw:border-input tw:shadow-xs tw:outline-none tw:focus-visible:border-ring tw:focus-visible:ring-[3px] tw:focus-visible:ring-ring/50 tw:disabled:cursor-not-allowed tw:disabled:opacity-50 tw:aria-invalid:border-destructive tw:aria-invalid:ring-destructive/20 tw:data-[state=indeterminate]:border-primary tw:data-[state=indeterminate]:bg-primary tw:data-[state=indeterminate]:text-primary-foreground tw:data-[state=checked]:border-primary tw:data-[state=checked]:bg-primary tw:data-[state=checked]:text-primary-foreground tw:dark:bg-input/30 tw:dark:aria-invalid:ring-destructive/40 tw:dark:data-[state=checked]:bg-primary tw:dark:data-[state=indeterminate]:bg-primary",
        className
      )}
      {...props}>
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="tw:grid tw:place-content-center tw:text-current tw:transition-none">
        {props.checked === "indeterminate" ? <MinusIcon className="tw:size-3.5" /> : <CheckIcon className="tw:size-3.5" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox }
