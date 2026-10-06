"use client"

import * as React from "react"
import { format, startOfMonth, subDays } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/app/admin/_ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/admin/_ui/components/popover"
import { Skeleton } from "@/app/admin/_ui/components/skeleton"
import { cn } from "@/app/admin/_ui/lib/utils"

// react-day-picker + date-fns locale code only load when the popover is first opened.
const Calendar = React.lazy(() => import("@/app/admin/_ui/components/calendar").then((m) => ({ default: m.Calendar })))

const PRESETS = [
  { label: "Today", range: () => ({ from: new Date(), to: new Date() }) },
  { label: "Last 7 days", range: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: "Last 30 days", range: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "This month", range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
]

/** value / onChange use `{ from?: Date, to?: Date }`. */
function DateRangePicker({ value, onChange, placeholder = "Pick a date range", className, align = "start", presets = PRESETS, numberOfMonths = 2, ...triggerProps }) {
  const [open, setOpen] = React.useState(false)
  const label = value?.from
    ? value.to
      ? `${format(value.from, "d MMM yyyy")} - ${format(value.to, "d MMM yyyy")}`
      : format(value.from, "d MMM yyyy")
    : placeholder
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("tw:justify-start tw:font-normal", !value?.from && "tw:text-muted-foreground", className)} {...triggerProps}>
          <CalendarIcon aria-hidden /> {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="tw:w-auto tw:p-0 tw:max-w-[calc(100vw-1rem)]">
        <div className="tw:flex tw:flex-col tw:sm:flex-row">
          <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-1 tw:border-b tw:p-2 tw:sm:w-36 tw:sm:flex-col tw:sm:border-r tw:sm:border-b-0">
            {presets.map((p) => (
              <Button key={p.label} variant="ghost" size="sm" className="tw:justify-start" onClick={() => { onChange?.(p.range()); setOpen(false) }}>
                {p.label}
              </Button>
            ))}
          </div>
          <React.Suspense fallback={<Skeleton className="tw:m-3 tw:h-64 tw:w-72" />}>
            <Calendar mode="range" numberOfMonths={numberOfMonths} selected={value} onSelect={onChange} defaultMonth={value?.from} className="tw:[--cell-size:--spacing(9)]" />
          </React.Suspense>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { DateRangePicker }
