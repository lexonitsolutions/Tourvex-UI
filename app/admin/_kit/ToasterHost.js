"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "../_ui/components/sonner";
import { registerToastImpl } from "./Toast";

/** Lazy chunk: the sonner Toaster plus the bridge that lets useToast() call sonner. */
export default function ToasterHost() {
  useEffect(() => {
    registerToastImpl({
      success: (m, o) => toast.success(m, o),
      error: (m, o) => toast.error(m, o),
      info: (m, o) => toast(m, o),
      dismiss: (id) => toast.dismiss(id),
    });
  }, []);
  return <Toaster position="bottom-right" closeButton />;
}
