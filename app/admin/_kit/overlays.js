"use client";

import { useId, useState } from "react";
import { Button } from "./primitives";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../_ui/components/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../_ui/components/sheet";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "../_ui/components/alert-dialog";
import { Input } from "../_ui/components/input";

// Dialogs / drawers are shadcn Dialog / Sheet / AlertDialog (Radix): focus trap, scroll lock, Esc, focus restore, aria wiring and
// the portal into the themed `.adm-root` host come from the primitives. The page-level API (open / onClose / title / footer ...)
// is unchanged from the old kit.

const SIZE = { sm: "tw:sm:max-w-[440px]", md: "tw:sm:max-w-[600px]", lg: "tw:sm:max-w-[820px]" };

/** Radix focuses the first tabbable node; honour `data-autofocus` like the old overlay did. */
function autoFocus(e) {
  const el = e.currentTarget?.querySelector?.("[data-autofocus]");
  if (el) {
    e.preventDefault();
    el.focus({ preventScroll: true });
  }
}

export function Modal({ open, onClose, title, description, children, footer, size = "md", closeOnScrim = true }) {
  return (
    <Dialog open={!!open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent
        onOpenAutoFocus={autoFocus}
        onInteractOutside={closeOnScrim ? undefined : (e) => e.preventDefault()}
        className={`tw:flex tw:max-h-[calc(100dvh-2rem)] tw:flex-col tw:gap-0 tw:overflow-hidden tw:p-0 ${SIZE[size] || SIZE.md}`}
      >
        <DialogHeader className="adm-modal__head tw:text-left">
          <div>
            <DialogTitle className="adm-modal__title">{title}</DialogTitle>
            <DialogDescription className={description ? "adm-modal__desc" : "tw:sr-only"}>{description || title}</DialogDescription>
          </div>
        </DialogHeader>
        <div className="adm-modal__body">{children}</div>
        {footer ? <div className="adm-modal__foot">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}

export function Drawer({ open, onClose, title, description, children, footer, width = 480 }) {
  return (
    <Sheet open={!!open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <SheetContent
        side="right"
        onOpenAutoFocus={autoFocus}
        style={{ width: `min(${width}px, 100vw)`, maxWidth: "100vw" }}
        className="tw:gap-0 tw:p-0"
      >
        <div className="adm-drawer__inner">
          <SheetHeader className="adm-modal__head tw:text-left">
            <div>
              <SheetTitle className="adm-modal__title">{title}</SheetTitle>
              <SheetDescription className={description ? "adm-modal__desc" : "tw:sr-only"}>{description || title}</SheetDescription>
            </div>
          </SheetHeader>
          <div className="adm-modal__body">{children}</div>
          {footer ? <div className="adm-modal__foot">{footer}</div> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Confirmation (shadcn AlertDialog). With `confirmText`, the user must type it exactly before the action enables (destructive flows). */
export function ConfirmDialog({ open, ...props }) {
  // Inner component mounts only while open, so the typed text always starts empty.
  return open ? <ConfirmInner {...props} /> : null;
}

function ConfirmInner({ onClose, onConfirm, title, description, confirmLabel = "Confirm", tone = "danger", confirmText, busy = false, error }) {
  const [typed, setTyped] = useState("");
  const id = useId();
  const ready = !confirmText || typed.trim() === confirmText;
  return (
    <AlertDialog open onOpenChange={(o) => { if (!o && !busy) onClose?.(); }}>
      <AlertDialogContent onOpenAutoFocus={autoFocus} className="tw:sm:max-w-[440px]">
        <AlertDialogHeader className="tw:text-left">
          <AlertDialogTitle className="adm-modal__title">{title}</AlertDialogTitle>
          <AlertDialogDescription className="adm-modal__desc">{description || "Please confirm this action."}</AlertDialogDescription>
        </AlertDialogHeader>
        {confirmText ? (
          <div className="adm-field">
            <label className="adm-field__label" htmlFor={`${id}-c`}>
              Type <code className="adm-code">{confirmText}</code> to confirm
            </label>
            <Input
              id={`${id}-c`}
              data-autofocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === "Enter" && ready && !busy) onConfirm();
              }}
            />
          </div>
        ) : null}
        {error ? <p className="adm-inline-error" role="alert">{error}</p> : null}
        <div className="adm-modal__foot adm-modal__foot--plain">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={!ready} loading={busy}>{confirmLabel}</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
