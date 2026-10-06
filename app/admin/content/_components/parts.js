"use client";

import { cx } from "../../_kit";

/** Character counter: "n / max", amber at 90%, red over the limit. */
export function Counter({ length, max }) {
  if (!max) return null;
  const over = length > max;
  return (
    <p className={cx("adm-cms-count", over && "is-over", !over && length >= max * 0.9 && "is-near")} aria-live="polite">
      <span className="adm-sr">{over ? `${length - max} characters over the limit. ` : ""}</span>
      {length} / {max}
    </p>
  );
}

export const CONTROL = "tw:h-10 tw:rounded-xl tw:bg-(--adm-control-bg) tw:text-[15px] tw:md:text-[15px]";
export const TEXTAREA = "tw:min-h-[84px] tw:resize-y tw:rounded-xl tw:bg-(--adm-control-bg) tw:text-[15px] tw:md:text-[15px]";
