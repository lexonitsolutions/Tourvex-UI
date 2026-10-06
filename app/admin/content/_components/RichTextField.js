"use client";

import { Fragment, memo, useDeferredValue, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Bold, Italic, Link2, List } from "lucide-react";
import { Field } from "../../_kit";
import { Textarea } from "../../_ui/components/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "../../_ui/components/popover";
import { Input } from "../../_ui/components/input";
import { insertLink, isSafeHref, parseMarkdown, toggleBullets, wrapInline } from "../../_lib/cms";
import { useFormContext } from "./formContext";
import { Counter, TEXTAREA } from "./parts";

function Inline({ tokens }) {
  return tokens.map((t, i) => {
    if (t.t === "text") return <Fragment key={i}>{t.v}</Fragment>;
    if (t.t === "bold") return <strong key={i}><Inline tokens={t.c} /></strong>;
    if (t.t === "italic") return <em key={i}><Inline tokens={t.c} /></em>;
    // links render as inert anchors in the editor preview; unsafe targets render as plain text (never executed)
    if (isSafeHref(t.href)) return <a key={i} href={t.href} title={t.href} onClick={(e) => e.preventDefault()}><Inline tokens={t.c} /></a>;
    return <span key={i}><Inline tokens={t.c} /></span>;
  });
}

/** Safe preview of the markdown subset: React elements only, no HTML is ever injected. */
export function MarkdownPreview({ text, empty = "Nothing to preview yet." }) {
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  if (!blocks.length) return <p className="adm-muted">{empty}</p>;
  return (
    <div className="adm-cms-md">
      {blocks.map((b, i) =>
        b.type === "ul" ? (
          <ul key={i}>{b.items.map((it, j) => <li key={j}><Inline tokens={it} /></li>)}</ul>
        ) : (
          <p key={i}>{b.lines.map((l, j) => <Fragment key={j}>{j ? <br /> : null}<Inline tokens={l} /></Fragment>)}</p>
        )
      )}
    </div>
  );
}

function RichTextField({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const text = typeof value === "string" ? value : "";
  const deferred = useDeferredValue(text);
  const ref = useRef(null);
  const pending = useRef(null);
  const [href, setHref] = useState("https://");
  const [linkOpen, setLinkOpen] = useState(false);
  const hrefOk = isSafeHref(href);

  // restore the selection after a toolbar edit re-rendered the controlled textarea
  useLayoutEffect(() => {
    if (pending.current && ref.current) {
      const { start, end } = pending.current;
      pending.current = null;
      ref.current.focus();
      ref.current.setSelectionRange(start, end);
    }
  }, [text]);

  function apply(op) {
    const el = ref.current;
    if (!el || readOnly) return;
    const next = op(text, el.selectionStart, el.selectionEnd);
    pending.current = { start: next.start, end: next.end };
    onChange(path, next.value);
  }
  const bold = () => apply((v, s, e) => wrapInline(v, s, e, "**"));
  const italic = () => apply((v, s, e) => wrapInline(v, s, e, "*"));
  const bullets = () => apply(toggleBullets);
  function addLink() {
    if (!hrefOk) return;
    apply((v, s, e) => insertLink(v, s, e, href.trim()));
    setLinkOpen(false);
  }
  function onKeyDown(e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === "b") { e.preventDefault(); bold(); }
    else if (k === "i") { e.preventDefault(); italic(); }
    else if (k === "k") { e.preventDefault(); setLinkOpen(true); }
  }

  return (
    <Field label={field.label} hint={field.help || "Supports **bold**, *italic*, [links](https://...) and - bullet lists. No HTML."} error={errors[path]} required={field.required}>
      {(a11y) => (
        <div className="adm-cms-rt">
          <div className="adm-cms-rt__bar" role="toolbar" aria-label={`${field.label} formatting`}>
            <button type="button" className="adm-cms-rt__btn" onClick={bold} disabled={readOnly} aria-label="Bold (Ctrl B)" title="Bold (Ctrl B)"><Bold size={15} /></button>
            <button type="button" className="adm-cms-rt__btn" onClick={italic} disabled={readOnly} aria-label="Italic (Ctrl I)" title="Italic (Ctrl I)"><Italic size={15} /></button>
            <Popover open={linkOpen} onOpenChange={setLinkOpen}>
              <PopoverTrigger asChild>
                <button type="button" className="adm-cms-rt__btn" disabled={readOnly} aria-label="Add link (Ctrl K)" title="Add link (Ctrl K)"><Link2 size={15} /></button>
              </PopoverTrigger>
              <PopoverContent align="start" className="tw:w-72 tw:p-3">
                <label className="adm-field__label" htmlFor={`${a11y.id}-href`}>Link address</label>
                <Input
                  id={`${a11y.id}-href`}
                  className="tw:mt-1.5 tw:h-9 tw:rounded-lg"
                  value={href}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => setHref(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                />
                <p className={hrefOk ? "adm-field__hint" : "adm-field__error"}>{hrefOk ? "Wraps the selected text." : "Use /path or https://..."}</p>
                <button type="button" className="adm-btn adm-btn--primary adm-btn--sm tw:mt-2" onClick={addLink} disabled={!hrefOk}><span className="adm-btn__label">Add link</span></button>
              </PopoverContent>
            </Popover>
            <button type="button" className="adm-cms-rt__btn" onClick={bullets} disabled={readOnly} aria-label="Bulleted list" title="Bulleted list"><List size={15} /></button>
          </div>
          <Textarea ref={ref} className={`${TEXTAREA} tw:rounded-t-none`} rows={5} value={text} disabled={readOnly} onKeyDown={onKeyDown} onChange={(e) => onChange(path, e.target.value)} {...a11y} />
          <Counter length={text.length} max={field.maxLength} />
          <div className="adm-cms-rt__preview" aria-label="Live preview">
            <span className="adm-cms-rt__label">Preview</span>
            <MarkdownPreview text={deferred} />
          </div>
        </div>
      )}
    </Field>
  );
}

export default memo(RichTextField);
