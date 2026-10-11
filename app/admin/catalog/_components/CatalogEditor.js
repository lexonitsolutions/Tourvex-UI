"use client";

import "./customFields";
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog, Dropdown, Icon, StatusBadge, cx, useToast } from "../../_kit";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { parsePath, setIn, sig } from "../../_lib/cms";
import { formatDateTime } from "../../_lib/format";
import { FormContext } from "../../content/_components/formContext";
import { useLeaveGuard } from "../../content/_components/leaveGuard";
import SchemaForm from "../../content/_components/SchemaForm";
import { blankForm, duplicateRecord, errorCountBySection, mapServerErrors, recordId, sectionOfKey, toForm, toPatch, toPayload, validateForm } from "../_lib/catalog";

/* ------------------------------------------------------------------ editor state */

function reducer(state, action) {
  switch (action.type) {
    case "field": {
      const key = action.path.join(".");
      const kept = Object.fromEntries(Object.entries(state.errors).filter(([k]) => k !== key && !k.startsWith(`${key}.`) && !key.startsWith(`${k}.`)));
      return { value: setIn(state.value, action.path, action.value), errors: Object.keys(kept).length === Object.keys(state.errors).length ? state.errors : kept };
    }
    case "set":
      return { value: action.value, errors: action.errors || {} };
    case "errors":
      return { ...state, errors: action.errors };
    default:
      return state;
  }
}

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const timeOf = (ms) => new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });

/** `record` is the API record being edited, or null for "Add new". */
export default function CatalogEditor({ config, record }) {
  const { type } = config;
  const isNew = !record;
  const api = useAdminApi();
  const toast = useToast();
  const router = useRouter();
  const { can } = useAdminMe();
  const canWrite = can("catalog.write");
  const canDelete = can("catalog.delete");

  const [state, dispatch] = useReducer(reducer, null, () => ({ value: record ? toForm(config, record) : blankForm(config), errors: {} }));
  const baseRef = useRef(state.value);
  const valueRef = useRef(state.value);
  const savingRef = useRef(false);
  const headingRef = useRef(null);
  const leaveHref = useRef(`/admin/catalog/${type}`);
  const [meta, setMeta] = useState(() => ({ id: recordId(record), slug: record?.slug || "", title: record?.title || "", published: !!record?.published, isSample: !!record?.isSample, updatedAt: record?.updatedAt || null }));
  const [sectionId, setSectionId] = useState(config.sections[0].id);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(null); // "save" | "publish" | null
  const [savedAt, setSavedAt] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [problems, setProblems] = useState([]); // server messages that could not be placed on a field
  const [gone, setGone] = useState(false);
  const [dialog, setDialog] = useState(null); // leave | delete
  const [dialogError, setDialogError] = useState("");
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    valueRef.current = state.value;
  });

  useEffect(() => {
    const t = setTimeout(() => setDirty(sig(state.value) !== sig(baseRef.current)), 250);
    return () => clearTimeout(t);
  }, [state.value]);
  const isDirtyNow = useCallback(() => sig(valueRef.current) !== sig(baseRef.current), []);
  useLeaveGuard(isDirtyNow, (href) => {
    leaveHref.current = href;
    setDialog("leave");
  });

  const section = config.sections.find((s) => s.id === sectionId) || config.sections[0];
  const errorCounts = useMemo(() => errorCountBySection(config, state.errors), [config, state.errors]);
  const totalErrors = Object.keys(state.errors).length;
  const sectionErrorCount = errorCounts[section.id] || 0;

  const formCtx = useMemo(
    () => ({
      errors: state.errors,
      readOnly: !canWrite,
      onChange: (key, value) => dispatch({ type: "field", path: parsePath(key), value }),
    }),
    [state.errors, canWrite]
  );

  function showErrors(errors) {
    dispatch({ type: "errors", errors });
    const firstKey = Object.keys(errors)[0];
    const target = firstKey ? sectionOfKey(config, firstKey) : null;
    if (target) setSectionId(target);
  }

  const applyRecord = useCallback(
    (rec) => {
      const form = toForm(config, rec);
      baseRef.current = form;
      valueRef.current = form;
      dispatch({ type: "set", value: form });
      setDirty(false);
      setSavedAt(Date.now());
      setMeta({ id: recordId(rec), slug: rec.slug || "", title: rec.title || "", published: !!rec.published, isSample: !!rec.isSample, updatedAt: rec.updatedAt || null });
    },
    [config]
  );

  /** Validates, then POSTs (new) or PATCHes the changed fields. `publish` (true/false) also sets the published flag. Resolves true on success. */
  const save = useCallback(
    async (publish) => {
      if (!canWrite || savingRef.current) return false;
      const form = typeof publish === "boolean" ? { ...valueRef.current, published: publish } : valueRef.current;
      const local = validateForm(config, form, isNew ? null : baseRef.current);
      if (Object.keys(local).length) {
        showErrors(local);
        toast.error(`Fix ${count(Object.keys(local).length, "problem", "problems")} before saving.`);
        return false;
      }
      const patch = isNew ? null : toPatch(config, form, baseRef.current);
      if (patch && !Object.keys(patch).length) {
        toast.info("There are no changes to save.");
        return true;
      }
      savingRef.current = true;
      setSaving(typeof publish === "boolean" ? "publish" : "save");
      setSaveError(null);
      setProblems([]);
      try {
        if (isNew) {
          const created = await api.post(`/${type}`, toPayload(config, form, { create: true }));
          const id = recordId(created);
          toast.success(form.published ? `${config.singular} created and published` : `${config.singular} created as a draft`);
          baseRef.current = valueRef.current; // nothing left to lose: the page is replaced by the saved record
          if (id) router.replace(`/admin/catalog/${type}/${id}`);
          else router.replace(`/admin/catalog/${type}`);
          return true;
        }
        const updated = await api.patch(`/${type}/${meta.id}`, patch);
        let fresh = updated;
        try {
          fresh = await api.get(`/${type}/admin/${meta.id}`); // refetch: the stored record is the source of truth
        } catch {
          /* the PATCH answer is the updated record as well */
        }
        applyRecord(fresh && typeof fresh === "object" ? fresh : { ...record, ...patch });
        toast.success(typeof publish === "boolean" ? (publish ? "Published" : "Unpublished") : "Changes saved");
        return true;
      } catch (e) {
        if (e.status === 400 || e.status === 409) {
          const { fieldErrors, general } = mapServerErrors(config, e);
          setProblems(general);
          if (Object.keys(fieldErrors).length) showErrors(fieldErrors);
          toast.error(e.status === 409 ? fieldErrors.slug || e.message : general[0] || "The server rejected some fields. They are marked in the form.");
        } else if (e.status === 404) {
          setGone(true);
          toast.error("This item no longer exists.");
        } else {
          setSaveError(e);
          toast.error(e.status === 0 ? "Could not reach the server. Your edits are kept." : e.message);
        }
        return false;
      } finally {
        savingRef.current = false;
        setSaving(null);
      }
    },
    // showErrors only uses stable setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canWrite, config, isNew, api, type, meta.id, record, applyRecord, toast, router]
  );

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [save]);

  async function remove() {
    setBusy(true);
    setDialogError("");
    try {
      await api.delete(`/${type}/${meta.id}`);
      baseRef.current = valueRef.current;
      toast.success("Deleted");
      router.push(`/admin/catalog/${type}`);
    } catch (e) {
      if (e.status === 404) router.push(`/admin/catalog/${type}`);
      else setDialogError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function duplicate() {
    try {
      const created = await duplicateRecord(api, config, meta.id);
      toast.success(dirty ? "Duplicated the last saved version as an unpublished draft" : "Duplicated as an unpublished draft");
      const id = recordId(created);
      if (id) router.push(`/admin/catalog/${type}/${id}`);
    } catch (e) {
      toast.error(e.message);
    }
  }

  /* ---- render */
  const title = String(state.value.title || "").trim() || (isNew ? `New ${config.singular}` : meta.title || "Untitled");
  const publicHref = !isNew && meta.published && meta.slug ? `${config.publicPath}/${encodeURIComponent(meta.slug)}` : null;
  const stateText = saving ? "Saving..." : dirty ? "Unsaved changes" : savedAt ? `Saved ${timeOf(savedAt)}` : meta.updatedAt ? `Updated ${formatDateTime(meta.updatedAt)}` : isNew ? "Not saved yet" : "No unsaved changes";
  const nextPublished = !meta.published;

  const menuItems = [
    ...(!isNew && canWrite ? [{ label: "Duplicate", icon: "copy", onSelect: duplicate }] : []),
    ...(!isNew && canDelete ? [{ separator: true }, { label: "Delete", icon: "trash", danger: true, onSelect: () => { setDialogError(""); setDialog("delete"); } }] : []),
  ];

  const actions = (
    <>
      {canWrite && isNew ? (
        <>
          <Button variant="secondary" onClick={() => save(false)} loading={saving === "save" || saving === "publish"} disabled={!!saving}>Create as draft</Button>
          <Button variant="primary" icon="check" onClick={() => save(true)} disabled={!!saving}>Create and publish</Button>
        </>
      ) : null}
      {canWrite && !isNew ? (
        <>
          <Button variant="secondary" onClick={() => save()} loading={saving === "save"} disabled={(!dirty && !saveError) || !!saving || gone}>Save changes</Button>
          <Button variant={meta.published ? "secondary" : "primary"} icon={meta.published ? "xCircle" : "check"} onClick={() => save(nextPublished)} loading={saving === "publish"} disabled={!!saving || gone}>
            {meta.published ? "Unpublish" : "Publish"}
          </Button>
        </>
      ) : null}
    </>
  );

  // list-level hints: itinerary length vs the declared duration (the API requires them to agree)
  const lengthNotes = section.fields
    .filter((f) => f.type === "list" && f.lengthMatches)
    .map((f) => {
      const items = state.value[f.name]?.length || 0;
      const nights = state.value.durationNights;
      const days = state.value[f.lengthMatches] ?? (typeof nights === "number" ? nights + 1 : null);
      return items && days && items !== days ? `The itinerary has ${count(items, "day", "days")} but the duration is ${count(days, "day", "days")}. They must match, so adjust one of them.` : null;
    })
    .filter(Boolean);

  return (
    <div className="adm-cms adm-cat">
      <header className="adm-cms-bar">
        <div className="adm-cms-bar__title">
          <Link href={`/admin/catalog/${type}`} className="adm-backlink adm-cat-back"><Icon name="chevronLeft" size={15} />{config.plural}</Link>
          <div className="adm-cms-bar__row">
            {type === "visas" && state.value?.countryCode ? (
              <span className="adm-cat-header-flag" title={state.value.country || state.value.countryCode}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/flags/${state.value.countryCode.toLowerCase()}.svg`}
                  alt=""
                  onError={(e) => {
                    const c = state.value.countryCode.toLowerCase();
                    if (!e.currentTarget.src.includes("flagcdn.com")) {
                      e.currentTarget.src = `https://flagcdn.com/${c}.svg`;
                    }
                  }}
                />
              </span>
            ) : null}
            <h1>{title}</h1>
            {isNew ? <StatusBadge tone="neutral">New</StatusBadge> : <StatusBadge tone={meta.published ? "success" : "neutral"}>{meta.published ? "Published" : "Unpublished"}</StatusBadge>}
            {meta.isSample ? <span className="adm-chip" title="Sample / demo content">Sample</span> : null}
            <span className={cx("adm-cms-bar__state", dirty && "is-dirty")} role="status">{stateText}</span>
          </div>
        </div>
        <div className="adm-cms-bar__actions adm-cat-actions">
          {publicHref ? (
            <a className="adm-btn adm-btn--ghost" href={publicHref} target="_blank" rel="noopener noreferrer">
              <Icon name="external" size={16} />
              <span className="adm-btn__label">View on site</span>
            </a>
          ) : null}
          {actions}
          {menuItems.length ? <Dropdown label="More actions" items={menuItems} trigger={({ props }) => <button type="button" className="adm-iconbtn" aria-label="More actions" {...props}><Icon name="more" /></button>} /> : null}
        </div>
      </header>

      {!canWrite ? <p className="adm-cms-banner" role="note"><Icon name="lock" size={15} /> You can view this {config.singular} but not change it (read-only access).</p> : null}
      {gone ? (
        <div className="adm-cms-banner is-error" role="alert">
          <Icon name="alert" size={15} />
          <span>This {config.singular} was deleted by someone else, so it cannot be saved.</span>
          <Link href={`/admin/catalog/${type}`} className="adm-btn adm-btn--secondary adm-btn--sm"><span className="adm-btn__label">Back to the list</span></Link>
        </div>
      ) : null}
      {saveError ? (
        <div className="adm-cms-banner is-error" role="alert">
          <Icon name="alert" size={15} />
          <span>{saveError.status === 0 ? "You appear to be offline." : saveError.message} Your edits are still here.</span>
          <Button size="sm" icon="refresh" onClick={() => save()} loading={!!saving}>Retry</Button>
        </div>
      ) : null}
      {problems.length ? (
        <div className="adm-cms-banner is-error" role="alert">
          <Icon name="alert" size={15} />
          <span>The server could not accept the changes: {problems.join(" ")}</span>
        </div>
      ) : null}

      <div className="adm-cat-layout">
        <nav className="adm-cat-nav" aria-label={`${config.singular} sections`}>
          <ul>
            {config.sections.map((s, i) => (
              <li key={s.id}>
                <button type="button" className={cx("adm-cat-nav__btn", s.id === section.id && "is-active")} aria-current={s.id === section.id ? "step" : undefined} onClick={() => setSectionId(s.id)}>
                  <span className="adm-cat-nav__num" aria-hidden="true">{i + 1}</span>
                  <span className="adm-cat-nav__label">{s.label}</span>
                  {errorCounts[s.id] ? <span className="adm-cms-badge is-error" aria-label={`${count(errorCounts[s.id], "problem", "problems")}`}>{errorCounts[s.id]}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className="adm-cms-panel" aria-labelledby="adm-cat-panel-title">
          <div key={section.id} className="adm-anim-fade-in">
            <header className="adm-cms-panel__head">
              <div>
                <h2 id="adm-cat-panel-title" ref={headingRef} tabIndex={-1}>{section.label}</h2>
                {section.description ? <p className="adm-muted">{section.description}</p> : null}
              </div>
            </header>
            <div aria-live="polite" className="adm-cms-panel__live">
              {sectionErrorCount ? <p className="adm-cms-callout is-error">{sectionErrorCount} {sectionErrorCount === 1 ? "field needs" : "fields need"} attention in this section{totalErrors > sectionErrorCount ? ` (${totalErrors} in total)` : ""}.</p> : null}
              {lengthNotes.map((n) => <p key={n} className="adm-cms-callout">{n}</p>)}
            </div>
            <FormContext.Provider value={formCtx}>
              <SchemaForm fields={section.fields} value={state.value} />
            </FormContext.Provider>
          </div>
        </section>
      </div>

      {canWrite && !gone ? (
        <div className="adm-cat-dock" role="region" aria-label="Actions">
          <span className={cx("adm-cat-dock__state", dirty && "is-dirty")}>{stateText}</span>
          <div className="adm-cat-dock__btns">{actions}</div>
        </div>
      ) : null}

      <ConfirmDialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        onConfirm={remove}
        busy={busy}
        error={dialogError}
        title={`Delete "${meta.title || title}"?`}
        description={`This permanently removes the ${config.singular} and its public page. This cannot be undone. To hide it instead, unpublish it.`}
        confirmLabel="Delete"
      />
      <ConfirmDialog
        open={dialog === "leave"}
        onClose={() => setDialog(null)}
        onConfirm={() => {
          baseRef.current = valueRef.current;
          setDialog(null);
          router.push(leaveHref.current);
        }}
        title="Leave without saving?"
        description="You have unsaved changes. If you leave now they are lost."
        confirmLabel="Leave page"
      />
    </div>
  );
}
