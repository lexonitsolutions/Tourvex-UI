"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Minus, Pencil, Plus } from "lucide-react";
import { Button, Modal, cx } from "../../_kit";
import { Textarea } from "../../_ui/components/textarea";
import { Counter, TEXTAREA } from "./parts";

const NOTE_MAX = 200;
const KIND = {
  added: { label: "Added", Icon: Plus },
  removed: { label: "Removed", Icon: Minus },
  changed: { label: "Changed", Icon: Pencil },
};

/** Field-level change list grouped by section (also used by the history view). */
export function ChangeList({ changes }) {
  const groups = useMemo(() => {
    const map = new Map();
    changes.forEach((c) => {
      const k = c.section || "Page";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(c);
    });
    return [...map.entries()];
  }, [changes]);
  return (
    <div className="adm-cms-changes">
      {groups.map(([section, list]) => (
        <section key={section} className="adm-cms-changes__group">
          <h4>{section} <span>{list.length}</span></h4>
          <ul>
            {list.map((c, i) => {
              const { label, Icon } = KIND[c.kind] || KIND.changed;
              return (
                <li key={i} className={`is-${c.kind}`}>
                  <span className="adm-cms-changes__kind"><Icon size={12} /><span className="adm-sr">{label}: </span></span>
                  <div>
                    <b>{c.label}</b>
                    {c.from !== undefined || c.to !== undefined ? (
                      <p>
                        {c.from !== undefined ? <del>{c.from}</del> : null}
                        {c.from !== undefined && c.to !== undefined ? <ArrowRight size={12} aria-label="became" /> : null}
                        {c.to !== undefined ? <ins>{c.to}</ins> : null}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Publish confirmation: required changes summary (draft vs published, computed client side) + optional note. Mount only while open. */
export default function PublishDialog({ onClose, diff, dirty, firstPublish, version, onPublish }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const nothing = !diff.length && !firstPublish;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onPublish(note.trim());
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      size="lg"
      title={firstPublish ? "Publish for the first time" : `Publish version ${(version || 0) + 1}`}
      description="Publishing makes these changes live on the website within about 30 seconds."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" icon="check" onClick={submit} loading={busy} disabled={nothing}>Publish now</Button>
        </>
      }
    >
      <div className="adm-stack">
        {dirty ? <p className="adm-cms-callout">You have unsaved edits. They are saved to the draft first, then published.</p> : null}
        <div>
          <h3 className="adm-cms-h3">What will change <span className="adm-cms-badge">{diff.length}</span></h3>
          {diff.length ? (
            <div className="adm-cms-changes__scroll"><ChangeList changes={diff} /></div>
          ) : (
            <p className="adm-muted">{firstPublish ? "This publishes the current content as version 1." : "The draft is identical to the published version. There is nothing to publish."}</p>
          )}
        </div>
        <div className="adm-field">
          <label className="adm-field__label" htmlFor="adm-cms-note">Note (optional)</label>
          <Textarea id="adm-cms-note" className={cx(TEXTAREA, "tw:min-h-[64px]")} rows={2} value={note} placeholder="What did you change and why? Shown in the history." onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))} />
          <Counter length={note.length} max={NOTE_MAX} />
        </div>
        {error ? (
          <div className="adm-cms-callout is-error" role="alert">
            <b>{error.problems ? "The content has problems that must be fixed first" : error.message}</b>
            {error.problems ? (
              <ul>{error.problems.slice(0, 8).map((p, i) => <li key={i}>{p}</li>)}</ul>
            ) : null}
            {error.problems ? <Button size="sm" onClick={onClose}>Review problems</Button> : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
