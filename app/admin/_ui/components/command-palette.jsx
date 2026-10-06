"use client"

import * as React from "react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/app/admin/_ui/components/command"

/**
 * Ctrl/Cmd+K command palette. `groups = [{ heading, items: [{ id, label, icon?, shortcut?, keywords?, onSelect }] }]`.
 * Import it lazily (React.lazy / next/dynamic) from the topbar so `cmdk` is only fetched on demand.
 */
function CommandPalette({ groups, open, onOpenChange, hotkey = true, placeholder = "Type a command or search..." }) {
  React.useEffect(() => {
    if (!hotkey) return
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [hotkey, open, onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command palette" description="Search for a page or action" showCloseButton={false}>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((g, gi) => (
          <React.Fragment key={g.heading}>
            {gi > 0 ? <CommandSeparator /> : null}
            <CommandGroup heading={g.heading}>
              {g.items.map((it) => (
                <CommandItem key={it.id} value={`${it.label} ${(it.keywords || []).join(" ")}`} onSelect={() => { onOpenChange(false); it.onSelect?.() }}>
                  {it.icon ? <it.icon aria-hidden /> : null}
                  {it.label}
                  {it.shortcut ? <CommandShortcut>{it.shortcut}</CommandShortcut> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

export { CommandPalette }
