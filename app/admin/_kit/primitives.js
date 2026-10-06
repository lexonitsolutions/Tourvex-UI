"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { formatAmount, formatDate, formatTime, initials } from "../_lib/format";
import { Avatar as UiAvatar, AvatarFallback, AvatarImage } from "../_ui/components/avatar";
import { Badge } from "../_ui/components/badge";
import { Skeleton as UiSkeleton } from "../_ui/components/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../_ui/components/tooltip";
import { Pagination as UiPagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../_ui/components/pagination";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

export function Button({ variant = "secondary", size = "md", icon, loading = false, disabled, className, children, type = "button", ...rest }) {
  return (
    <button
      type={type}
      className={cx("adm-btn", `adm-btn--${variant}`, size === "sm" && "adm-btn--sm", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="adm-spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={16} /> : null}
      {children ? <span className="adm-btn__label">{children}</span> : null}
    </button>
  );
}

export function IconButton({ icon, label, className, size = 18, ...rest }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={cx("adm-iconbtn", className)} aria-label={label} {...rest}>
          <Icon name={icon} size={size} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

// Deterministic gradient per name (dark enough for white initials). No external photos.
const AVATAR_GRADIENTS = [
  ["#2095ae", "#12295f"], ["#7c5ac7", "#3b2a87"], ["#c4601a", "#8a3b0c"], ["#2e9e6e", "#12634a"],
  ["#c0334a", "#7d1b30"], ["#3b7ddd", "#1f3f9a"], ["#a97a2c", "#6b4b12"], ["#c0517c", "#7a2850"],
];
function gradientFor(name) {
  const text = String(name || "?");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  const [a, b] = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function Avatar({ name, src, size = 32 }) {
  return (
    <UiAvatar className="adm-avatar tw:size-(--av)" style={{ "--av": `${size}px`, fontSize: Math.round(size * 0.38) }} aria-hidden="true">
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback className="tw:text-[length:inherit] tw:font-semibold tw:text-white" style={{ background: gradientFor(name) }}>{initials(name)}</AvatarFallback>
    </UiAvatar>
  );
}

/** Avatar + name (plain, link or button) + muted second line. */
export function UserCell({ name, email, href, onClick, size = 34, suffix }) {
  const label = name || "-";
  const title = href ? (
    <Link href={href} className="adm-usercell__name">{label}</Link>
  ) : onClick ? (
    <button type="button" className="adm-usercell__name" onClick={onClick}>{label}</button>
  ) : (
    <span className="adm-usercell__name">{label}</span>
  );
  return (
    <span className="adm-usercell">
      <Avatar name={name || email} size={size} />
      <span className="adm-usercell__text">
        <span className="adm-usercell__line">{title}{suffix}</span>
        {email ? <small>{email}</small> : null}
      </span>
    </span>
  );
}

/** Money with a muted currency code and tabular numbers. */
export function Money({ value, currency = "AED", negative = false, className }) {
  if (typeof value !== "number" || !Number.isFinite(value)) return <span className="adm-muted">-</span>;
  return (
    <span className={cx("adm-money", negative && "is-neg", className)}>
      <small>{currency}</small> {negative ? "-" : ""}{formatAmount(value)}
    </span>
  );
}

/** Date with the time underneath in muted text (fixed Asia/Dubai formatter, hydration safe). */
export function DateTime({ value }) {
  if (!value) return <span className="adm-muted">-</span>;
  return (
    <span className="adm-datetime">
      {formatDate(value)}
      <small>{formatTime(value)}</small>
    </span>
  );
}

/** Monospace-ish ID in brand colour with tabular numbers; optional inline copy button. */
export function IdText({ children, copy }) {
  return (
    <span className="adm-idtext">
      <span className="adm-idtext__v">{children}</span>
      {copy ? <CopyButton value={copy === true ? children : copy} label="Copy ID" /> : null}
    </span>
  );
}

export function Skeleton({ width, height = 12, className, style }) {
  return <UiSkeleton className={cx("adm-skel tw:bg-(--adm-skel-a)", className)} style={{ width, height, ...style }} aria-hidden="true" />;
}

const TONES = {
  active: "success", ready: "success", paid: "success", confirmed: "success", resolved: "success", done: "success",
  pending: "warning", new: "info", open: "info", draft: "neutral", inactive: "neutral", deactivated: "danger",
  cancelled: "danger", failed: "danger", refunded: "warning", closed: "neutral",
};

const BADGE_TONE = {
  success: "tw:bg-(--adm-b-success) tw:text-(--adm-b-success-ink)",
  warning: "tw:bg-(--adm-b-warning) tw:text-(--adm-b-warning-ink)",
  danger: "tw:bg-(--adm-b-danger) tw:text-(--adm-b-danger-ink)",
  info: "tw:bg-(--adm-b-info) tw:text-(--adm-b-info-ink)",
  brand: "tw:bg-(--adm-b-brand) tw:text-(--adm-b-brand-ink)",
  neutral: "tw:bg-(--adm-b-neutral) tw:text-(--adm-b-neutral-ink)",
};

/** Soft pill (shadcn Badge): tinted background, leading dot (default) or tiny icon. tone: success | warning | danger | info | neutral | brand. */
export function StatusBadge({ status, tone, children, dot = true, icon }) {
  const key = String(status || "").toLowerCase();
  const t = tone || TONES[key] || "neutral";
  return (
    <Badge variant="secondary" className={cx("adm-badge tw:h-[26px] tw:gap-1.5 tw:px-[11px] tw:text-[12.5px] tw:font-semibold", BADGE_TONE[t] || BADGE_TONE.neutral)}>
      {icon ? <Icon name={icon} size={12} strokeWidth={2.2} /> : dot ? <i className="adm-badge__dot" aria-hidden="true" /> : null}
      {children ?? status}
    </Badge>
  );
}

export function EmptyState({ icon = "inbox", title, description, action }) {
  return (
    <div className="adm-empty">
      <span className="adm-empty__icon"><Icon name={icon} size={22} /></span>
      <p className="adm-empty__title">{title}</p>
      {description ? <p className="adm-empty__desc">{description}</p> : null}
      {action ? <div className="adm-empty__action">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <div className="adm-empty adm-empty--error" role="alert">
      <span className="adm-empty__icon"><Icon name="alert" size={22} /></span>
      <p className="adm-empty__title">{title}</p>
      {description ? <p className="adm-empty__desc">{description}</p> : null}
      {onRetry ? <div className="adm-empty__action"><Button onClick={onRetry} icon="refresh">Try again</Button></div> : null}
    </div>
  );
}

export function KeyValue({ items, columns = 1 }) {
  return (
    <dl className={cx("adm-kv", columns > 1 && "adm-kv--cols")}>
      {items.map((item) => (
        <div className="adm-kv__row" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value ?? "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CopyButton({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(String(value ?? ""));
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <button type="button" className="adm-copy" onClick={copy} aria-label={copied ? "Copied" : label} title={copied ? "Copied" : label}>
      <Icon name={copied ? "check" : "copy"} size={14} />
      <span className="adm-sr" role="status">{copied ? "Copied to clipboard" : ""}</span>
    </button>
  );
}

export function Card({ title, actions, children, flush, className }) {
  return (
    <section className={cx("adm-card", className)}>
      {title || actions ? (
        <header className="adm-card__head">
          {title ? <h3 className="adm-card__title">{title}</h3> : <span />}
          {actions ? <div className="adm-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={flush ? "adm-card__body adm-card__body--flush" : "adm-card__body"}>{children}</div>
    </section>
  );
}

/** Numbered pager (shadcn Pagination parts) for non-table lists such as the audit timeline. Tables use the DataTable footer. */
export function Pagination({ page = 1, pages = 1, total, limit, onPage }) {
  const from = total ? (page - 1) * limit + 1 : 0;
  const to = total ? Math.min(page * limit, total) : 0;
  const list = [];
  for (let n = 1; n <= pages; n += 1) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) list.push(n);
    else if (list[list.length - 1] !== "gap") list.push("gap");
  }
  const go = (n) => (e) => {
    e.preventDefault();
    onPage(n);
  };
  return (
    <div className="adm-pager">
      <span className="adm-pager__info">{total != null ? `Showing ${from}-${to} of ${total}` : `Page ${page}`}</span>
      <UiPagination className="tw:mx-0 tw:w-auto">
        <PaginationContent>
          <PaginationItem><PaginationPrevious href="#" onClick={go(Math.max(1, page - 1))} aria-disabled={page <= 1} className={page <= 1 ? "tw:pointer-events-none tw:opacity-40" : undefined} /></PaginationItem>
          {list.map((n, i) => (
            <PaginationItem key={n === "gap" ? `g${i}` : n}>
              {n === "gap" ? <PaginationEllipsis /> : <PaginationLink href="#" isActive={n === page} onClick={go(n)} aria-label={`Page ${n}`}>{n}</PaginationLink>}
            </PaginationItem>
          ))}
          <PaginationItem><PaginationNext href="#" onClick={go(Math.min(pages, page + 1))} aria-disabled={page >= pages} className={page >= pages ? "tw:pointer-events-none tw:opacity-40" : undefined} /></PaginationItem>
        </PaginationContent>
      </UiPagination>
    </div>
  );
}

export function Timeline({ items, empty = "Nothing here yet." }) {
  if (!items?.length) return <p className="adm-muted">{empty}</p>;
  return (
    <ol className="adm-timeline">
      {items.map((item, i) => (
        <li key={item.id || i} className="adm-timeline__item">
          <span className={cx("adm-timeline__dot", item.tone && `is-${item.tone}`)} aria-hidden="true" />
          <div className="adm-timeline__main">
            <p className="adm-timeline__title">{item.title}</p>
            {item.body ? <div className="adm-timeline__body">{item.body}</div> : null}
            <p className="adm-timeline__meta">{item.meta}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
