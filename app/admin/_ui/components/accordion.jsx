"use client"

import * as React from "react"
import { cn } from "@/app/admin/_ui/lib/utils"
import { ChevronDownIcon } from "lucide-react"
import { Accordion as AccordionPrimitive } from "radix-ui"

function Accordion({
  ...props
}) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("tw:border-b tw:last:border-b-0", className)}
      {...props} />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}) {
  return (
    <AccordionPrimitive.Header className="tw:flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "tw:flex tw:flex-1 tw:items-start tw:justify-between tw:gap-4 tw:rounded-md tw:py-4 tw:text-left tw:text-sm tw:font-medium tw:transition-colors tw:outline-none tw:hover:underline tw:focus-visible:border-ring tw:focus-visible:ring-[3px] tw:focus-visible:ring-ring/50 tw:disabled:pointer-events-none tw:disabled:opacity-50 tw:[&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}>
        {children}
        <ChevronDownIcon
          className="tw:pointer-events-none tw:size-4 tw:shrink-0 tw:translate-y-0.5 tw:text-muted-foreground tw:transition-transform tw:duration-200 tw:ease-(--adm-e-std)" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="adm-collapse tw:text-sm"
      {...props}>
      <div className={cn("tw:pt-0 tw:pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
