"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, PanelRight } from "lucide-react";
import { Button, ConfirmDialog, Drawer, Dropdown, Icon, Modal, StatusBadge, TabPanel, Tabs, cx, useToast } from "../../_kit";
import { Switch as UiSwitch } from "../../_ui/components/switch";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import {
  clearLocal, countErrors, diffValues, extractApiErrors, loadLocal, mapApiErrors, newSection, normalizeValue, parsePath, readDocument, saveLocal,
  sectionSchemaFor, setIn, sig, statusMeta, useCmsApi, validateValue,
} from "../../_lib/cms";
import { formatDateTime, humanize } from "../../_lib/format";
import { FormContext } from "./formContext";
import { useLeaveGuard } from "./leaveGuard";
import SchemaForm from "./SchemaForm";
import SectionRail from "./SectionRail";
import PreviewPane from "./PreviewPane";
import PublishDialog from "./PublishDialog";
import HistorySheet from "./HistorySheet";

/* ------------------------------------------------------------------ editor state */

function reducer(state, action) {
  switch (action.type) {
    case "field": {
      const pk = action.path.join(".");
      const sectionErrors = state.errors[action.sectionId];
      let errors = state.errors;
      if (sectionErrors) {
        const kept = Object.fromEntries(Object.entries(sectionErrors).filter(([k]) => k !== pk && !k.startsWith(`${pk}.`)));
        if (Object.keys(kept).length !== Object.keys(sectionErrors).length) {
          errors = { ...state.errors, [action.sectionId]: kept };
          if (!Object.keys(kept).length) delete errors[action.sectionId];
        }
      }
      if (action.sectionId === "_") return { value: setIn(state.value, action.path, action.value), errors };
      return {
        value: state.value.map((s) => (s.id === action.sectionId ? { ...s, data: setIn(s.data, action.path, action.value) } : s)),
        errors,
      };
    }
    case "enabled":
      return { ...state, value: state.value.map((s) => (s.id === action.id ? { ...s, enabled: action.enabled } : s)) };
    case "move": {
      const next = state.value.slice();
      next.splice(action.to, 0, next.splice(action.from, 1)[0]);
      return { ...state, value: next };
    }
    case "add":
      return { ...state, value: [...state.value, action.section] };
    case "remove": {
      const errors = { ...state.errors };
      delete errors[action.id];
      return { value: state.value.filter((s) => s.id !== action.id), errors };
    }
    case "set":
      return { value: action.value, errors: action.errors || {} };
    case "errors":
      return { ...state, errors: action.errors };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ small hooks */

const wideQuery = "(min-width: 1360px)";
const midQuery = "(min-width: 900px)";
function subscribeViewport(cb) {
  const lists = [window.matchMedia(wideQuery), window.matchMedia(midQuery)];
  lists.forEach((l) => l.addEventListener("change", cb));
  return () => lists.forEach((l) => l.removeEventListener("change", cb));
}
/** 0 = narrow (tabs), 1 = mid (rail + form, preview in a drawer), 2 = wide (three panes). */
function useViewport() {
  return useSyncExternalStore(subscribeViewport, () => (window.matchMedia(wideQuery).matches ? 2 : window.matchMedia(midQuery).matches ? 1 : 0), () => 1);
}

const when = (v) => (v ? formatDateTime(v) : "");
const who = (p) => (p && typeof p === "object" ? p.name || p.email : p) || "";

/* ------------------------------------------------------------------ editor */

export default function ContentEditor({ doc, initialSelected, onSelectedChange, onReload }) {
  const cms = useCmsApi();
  const toast = useToast();
  const router = useRouter();
  const { can } = useAdminMe();
  const canWrite = can("cms.write");
  const canPublish = can("cms.publish");
  const isPage = doc.kind === "page";
  const viewport = useViewport();

  const [state, dispatch] = useReducer(reducer, { value: doc.value, errors: {} });
  const [meta, setMeta] = useState({ hasDraft: doc.hasDraft, version: doc.version, draftRevision: doc.draftRevision, status: doc.status, draftUpdatedAt: doc.draftUpdatedAt, draftUpdatedBy: doc.draftUpdatedBy, publishedAt: doc.publishedAt });
  const baseSig = useRef(sig(doc.value));
  const valueRef = useRef(state.value);
  const metaRef = useRef(meta);
  const savingRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewDrawer, setPreviewDrawer] = useState(false);
  const [pane, setPane] = useState("edit");
  const [selectedId, setSelectedId] = useState(() => (isPage ? (doc.value.find((s) => s.id === initialSelected) || doc.value[0])?.id : "_"));
  const [dialog, setDialog] = useState(null); // publish | history | discard | conflict | remove | leave
  const [publishDiff, setPublishDiff] = useState([]);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [recovered, setRecovered] = useState(() => {
    if (typeof window === "undefined") return null;
    const local = loadLocal(doc.key, doc.draftRevision);
    if (!local) return null;
    const value = normalizeValue(doc.kind, doc.schema, doc.sectionSchemas, local.value);
    return sig(value) === sig(doc.value) ? null : { at: local.at, value };
  });
  const headingRef = useRef(null);
  const leaveHref = useRef("/admin/content");

  useLayoutEffect(() => {
    valueRef.current = state.value;
    metaRef.current = meta;
  });

  const sections = isPage ? state.value : null;
  const selected = isPage ? sections.find((s) => s.id === selectedId) || sections[0] || null : null;
  const sectionKey = isPage ? selected?.id : "_";
  const selectedKeyRef = useRef(sectionKey);
  useLayoutEffect(() => {
    selectedKeyRef.current = sectionKey;
  });
  useEffect(() => {
    if (isPage) onSelectedChange(sectionKey);
  }, [isPage, sectionKey, onSelectedChange]);

  /* dirty tracking (debounced) and local autosave */
  useEffect(() => {
    const t = setTimeout(() => setDirty(sig(state.value) !== baseSig.current), 250);
    return () => clearTimeout(t);
  }, [state.value]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (sig(state.value) !== baseSig.current) saveLocal(doc.key, meta.draftRevision, state.value);
    }, 1200);
    return () => clearTimeout(t);
  }, [state.value, doc.key, meta.draftRevision]);

  const isDirtyNow = useCallback(() => sig(valueRef.current) !== baseSig.current, []);
  useLeaveGuard(isDirtyNow, (href) => {
    leaveHref.current = href;
    setDialog("leave");
  });

  const errorCounts = useMemo(() => Object.fromEntries(Object.entries(state.errors).map(([id, e]) => [id, Object.keys(e).length])), [state.errors]);
  const totalErrors = countErrors(state.errors);
  const sectionErrors = state.errors[sectionKey];
  const formCtx = useMemo(
    () => ({
      errors: sectionErrors || {},
      readOnly: !canWrite,
      onChange: (pk, value) => dispatch({ type: "field", sectionId: selectedKeyRef.current, path: parsePath(pk), value }),
    }),
    [sectionErrors, canWrite]
  );

  /* ---- section actions (stable callbacks so the rail stays memoised) */
  const selectSection = useCallback((id) => {
    setSelectedId(id);
    setPane("edit");
  }, []);
  const toggleSection = useCallback((id, enabled) => dispatch({ type: "enabled", id, enabled }), []);
  const moveSection = useCallback((from, to) => dispatch({ type: "move", from, to }), []);
  const addSection = useCallback(
    (type) => {
      const section = newSection(type, sectionSchemaFor(doc.sectionSchemas, type));
      dispatch({ type: "add", section });
      setSelectedId(section.id);
      setPane("edit");
      toast.info(`${doc.sectionSchemas?.[type]?.label || humanize(type)} section added at the end of the page.`);
      setTimeout(() => headingRef.current?.focus(), 80);
    },
    [doc.sectionSchemas, toast]
  );
  const askRemove = useCallback((id) => setDialog({ kind: "remove", id }), []);

  function showErrors(bySection) {
    dispatch({ type: "errors", errors: bySection });
    const first = isPage ? valueRef.current.find((s) => bySection[s.id]) : null;
    if (first) {
      setSelectedId(first.id);
      setPane("edit");
    }
  }

  const applySaved = useCallback(
    async (res, sent) => {
      baseSig.current = sig(sent);
      clearLocal(doc.key);
      setRecovered(null);
      setSavedAt(Date.now());
      setPreviewKey((n) => n + 1);
      setDirty(sig(valueRef.current) !== baseSig.current);
      const rev = res?.draftRevision ?? res?.draft?.draftRevision;
      setMeta((m) => ({
        ...m,
        hasDraft: true,
        version: res?.version ?? m.version,
        draftRevision: rev ?? m.draftRevision,
        status: res?.status || "draft-changes",
        draftUpdatedAt: res?.draftUpdatedAt || new Date().toISOString(),
        draftUpdatedBy: res?.draftUpdatedBy || m.draftUpdatedBy,
      }));
      if (rev === undefined || rev === null) {
        // the API did not echo the new draft revision: read it so the next save does not conflict with ourselves
        try {
          const fresh = readDocument(await cms.get(doc.key));
          setMeta((m) => ({ ...m, draftRevision: fresh.draftRevision, version: fresh.version, status: fresh.status }));
          metaRef.current = { ...metaRef.current, draftRevision: fresh.draftRevision, version: fresh.version };
        } catch {
          /* non fatal */
        }
      }
    },
    [cms, doc.key]
  );

  /** Validates, then PUTs the whole payload. Resolves true on success; failures are surfaced (inline errors, conflict dialog or retry banner). */
  const save = useCallback(async () => {
    if (!canWrite || savingRef.current) return false;
    const sent = valueRef.current;
    const local = validateValue(doc.kind, doc.schema, doc.sectionSchemas, sent);
    if (countErrors(local)) {
      showErrors(local);
      toast.error(`Fix ${countErrors(local)} ${countErrors(local) === 1 ? "problem" : "problems"} before saving.`);
      return false;
    }
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await cms.saveDraft(doc.key, doc.kind, sent, metaRef.current);
      dispatch({ type: "errors", errors: {} });
      await applySaved(res, sent);
      toast.success("Draft saved");
      return true;
    } catch (e) {
      if (e.status === 409 || e.code === "CONTENT_CONFLICT") {
        setDialog({ kind: "conflict", error: e });
      } else if (extractApiErrors(e).length) {
        const mapped = mapApiErrors(extractApiErrors(e), doc.kind, sent);
        showErrors(mapped.bySection);
        toast.error(mapped.general[0]?.message || "The server rejected some fields. They are marked in the form.");
      } else {
        setSaveError(e);
        toast.error(e.status === 0 ? "Could not reach the server. Your edits are kept." : e.message);
      }
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
    // showErrors only uses refs and stable setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canWrite, cms, doc, applySaved, toast]);

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

  /* ---- publish */
  function openPublish() {
    const local = validateValue(doc.kind, doc.schema, doc.sectionSchemas, valueRef.current);
    if (countErrors(local)) {
      showErrors(local);
      toast.error(`Fix ${countErrors(local)} ${countErrors(local) === 1 ? "problem" : "problems"} before publishing.`);
      return;
    }
    setPublishDiff(diffValues(doc, doc.published, valueRef.current));
    setDialog("publish");
  }
  async function publish(note) {
    // the API publishes the saved draft: save first when there are unsaved edits or no draft exists yet
    if ((isDirtyNow() || !metaRef.current.hasDraft) && !(await save())) throw new Error("Your changes could not be saved, so nothing was published.");
    try {
      const res = await cms.publish(doc.key, note, metaRef.current.draftRevision);
      clearLocal(doc.key);
      toast.success(`Published version ${res?.version ?? meta.version + 1}`);
      setDialog(null);
      baseSig.current = sig(valueRef.current);
      onReload();
    } catch (e) {
      const list = extractApiErrors(e);
      if (list.length) {
        const mapped = mapApiErrors(list, doc.kind, valueRef.current);
        showErrors(mapped.bySection);
        const err = new Error(e.message);
        err.problems = list.map((p) => `${p.path ? `${p.path}: ` : ""}${p.message}`);
        throw err;
      }
      throw e;
    }
  }

  /* ---- discard / conflict / remove */
  async function discard() {
    setBusy(true);
    setDialogError("");
    try {
      if (meta.hasDraft) await cms.discard(doc.key);
      clearLocal(doc.key);
      baseSig.current = sig(valueRef.current);
      setDialog(null);
      toast.success("Draft discarded");
      onReload();
    } catch (e) {
      setDialogError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function overwrite() {
    setBusy(true);
    setDialogError("");
    try {
      const fresh = readDocument(await cms.get(doc.key));
      metaRef.current = { ...metaRef.current, version: fresh.version, draftRevision: fresh.draftRevision };
      setDialog(null);
      await save();
    } catch (e) {
      setDialogError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function confirmRemove() {
    const id = dialog.id;
    const idx = valueRef.current.findIndex((s) => s.id === id);
    dispatch({ type: "remove", id });
    setSelectedId(valueRef.current[idx + 1]?.id || valueRef.current[idx - 1]?.id);
    setDialog(null);
  }

  async function openPreviewTab() {
    const w = window.open("about:blank", "_blank");
    try {
      const res = await cms.previewToken(doc.key);
      if (!res?.url) throw new Error("The API did not return a preview URL.");
      if (w) {
        w.opener = null;
        w.location.href = res.url;
      }
    } catch (e) {
      w?.close();
      toast.error(e.message);
    }
  }

  /* ---- render */
  const status = statusMeta(dirty && meta.status === "published" ? "draft-changes" : meta.status);
  const hasServerDraft = meta.hasDraft;
  const stateText = saving ? "Saving..." : dirty ? "Unsaved changes" : savedAt ? `Draft saved ${new Date(savedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : meta.draftUpdatedAt && hasServerDraft ? `Draft edited ${when(meta.draftUpdatedAt)}${who(meta.draftUpdatedBy) ? ` by ${who(meta.draftUpdatedBy)}` : ""}` : "No unsaved changes";

  const menuItems = [
    ...(viewport === 0 ? [{ label: "History", icon: "clock", onSelect: () => setDialog("history") }] : []),
    { label: "Open preview in new tab", icon: "external", onSelect: openPreviewTab },
    ...(canWrite ? [{ separator: true }, { label: hasServerDraft ? "Discard draft" : "Discard changes", icon: "trash", danger: true, disabled: !hasServerDraft && !dirty, onSelect: () => { setDialogError(""); setDialog("discard"); } }] : []),
  ];

  const sectionSchema = isPage && selected ? sectionSchemaFor(doc.sectionSchemas, selected.type) : null;
  const panelTitle = isPage ? sectionSchema?.label || (selected ? humanize(selected.type) : "") : doc.schema?.label;
  const panelDesc = isPage ? sectionSchema?.description : doc.schema?.description;
  const fields = isPage ? sectionSchema?.fields : doc.schema?.fields;

  const addable = useMemo(
    () => (doc.schema?.sections?.allowed || []).filter((t) => !(doc.sectionSchemas?.[t]?.single && sections?.some((s) => s.type === t))),
    [doc.schema, doc.sectionSchemas, sections]
  );
  const rail = isPage ? (
    <SectionRail
      sections={sections}
      sectionSchemas={doc.sectionSchemas}
      allowed={addable}
      selectedId={selected?.id}
      errorCounts={errorCounts}
      readOnly={!canWrite}
      onSelect={selectSection}
      onToggle={toggleSection}
      onMove={moveSection}
      onAdd={addSection}
      onRemove={askRemove}
    />
  ) : null;

  const form = (
    <section className="adm-cms-panel" aria-labelledby="adm-cms-panel-title">
      <div key={sectionKey} className="adm-anim-fade-in">
        <header className="adm-cms-panel__head">
          <div>
            <h2 id="adm-cms-panel-title" ref={headingRef} tabIndex={-1}>{panelTitle || "Nothing selected"}</h2>
            {panelDesc ? <p className="adm-muted">{panelDesc}</p> : null}
          </div>
          {isPage && selected && sectionSchema?.canDisable && canWrite ? (
            <label className="adm-cms-panel__vis">
              <UiSwitch checked={selected.enabled} onCheckedChange={(v) => toggleSection(selected.id, v)} className="tw:h-[22px] tw:w-[38px]" />
              <span>{selected.enabled ? "Visible on the site" : "Hidden on the site"}</span>
            </label>
          ) : null}
        </header>
        <div aria-live="polite" className="adm-cms-panel__live">
          {countErrors(sectionErrors ? { x: sectionErrors } : {}) ? (
            <p className="adm-cms-callout is-error">
              {Object.keys(sectionErrors).length} {Object.keys(sectionErrors).length === 1 ? "field needs" : "fields need"} attention in this section.
            </p>
          ) : null}
        </div>
        {isPage && selected && !selected.enabled ? <p className="adm-cms-callout">This section is hidden. Visitors do not see it, but you can still edit it.</p> : null}
        {fields ? (
          <FormContext.Provider value={formCtx}>
            <SchemaForm fields={fields} value={isPage ? selected?.data : state.value} />
          </FormContext.Provider>
        ) : (
          <p className="adm-muted">{isPage ? "Choose a section on the left to edit it." : "This document has no fields."}</p>
        )}
      </div>
    </section>
  );

  const preview = <PreviewPane docKey={doc.key} refreshKey={previewKey} onClose={viewport === 2 ? () => setPreviewOpen(false) : undefined} />;

  const tabs = isPage
    ? [{ id: "sections", label: "Sections", badge: sections.length }, { id: "edit", label: "Edit", badge: totalErrors || undefined }, { id: "preview", label: "Preview" }]
    : [{ id: "edit", label: "Edit" }, { id: "preview", label: "Preview" }];

  return (
    <div className="adm-cms">
      <header className="adm-cms-bar">
        <div className="adm-cms-bar__title">
          <nav aria-label="Breadcrumb" className="adm-cms-crumbs">
            <Link href="/admin/content">Content</Link>
            <Icon name="chevronRight" size={13} />
            <span aria-current="page">{doc.schema?.label || doc.key}</span>
          </nav>
          <div className="adm-cms-bar__row">
            <h1>{doc.schema?.label || doc.key}</h1>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            <span className="adm-chip" title="Published version">v{meta.version || 0}</span>
            <span className={cx("adm-cms-bar__state", dirty && "is-dirty")} role="status">{stateText}</span>
          </div>
        </div>
        <div className="adm-cms-bar__actions">
          {viewport >= 1 ? <Button variant="ghost" icon="clock" onClick={() => setDialog("history")}>History</Button> : null}
          {viewport === 2 ? (
            <Button variant="ghost" onClick={() => setPreviewOpen((o) => !o)} aria-pressed={previewOpen}><PanelRight size={16} /> Preview</Button>
          ) : viewport === 1 ? (
            <Button variant="ghost" onClick={() => setPreviewDrawer(true)}><Eye size={16} /> Preview</Button>
          ) : null}
          {canWrite ? <Button variant="secondary" onClick={save} loading={saving} disabled={!dirty && !saveError}>Save draft</Button> : null}
          {canPublish ? <Button variant="primary" icon="check" onClick={openPublish} disabled={saving || (!dirty && !meta.hasDraft)}>Publish</Button> : null}
          <Dropdown label="More actions" items={menuItems} trigger={({ props }) => <button type="button" className="adm-iconbtn" aria-label="More actions" {...props}><Icon name="more" /></button>} />
        </div>
      </header>

      {!canWrite ? <p className="adm-cms-banner" role="note"><Icon name="lock" size={15} /> You can view this content but not change it (read-only access).</p> : null}
      {saveError ? (
        <div className="adm-cms-banner is-error" role="alert">
          <Icon name="alert" size={15} />
          <span>{saveError.status === 0 ? "You appear to be offline." : saveError.message} Your edits are still here{dirty ? " and stored in this browser" : ""}.</span>
          <Button size="sm" icon="refresh" onClick={save} loading={saving}>Retry</Button>
        </div>
      ) : null}
      {recovered ? (
        <div className="adm-cms-banner is-info" role="alert">
          <Icon name="info" size={15} />
          <span>Unsaved edits from {formatDateTime(recovered.at)} were found in this browser.</span>
          <Button size="sm" variant="primary" onClick={() => { dispatch({ type: "set", value: recovered.value }); setRecovered(null); }}>Restore them</Button>
          <Button size="sm" variant="ghost" onClick={() => { clearLocal(doc.key); setRecovered(null); }}>Discard</Button>
        </div>
      ) : null}

      {viewport === 0 ? (
        <>
          <div className="adm-cms-tabs"><Tabs tabs={tabs} value={pane} onChange={setPane} idPrefix="adm-cms-pane" variant="segmented" label="Editor panes" /></div>
          {isPage ? <TabPanel id="sections" value={pane} idPrefix="adm-cms-pane">{rail}</TabPanel> : null}
          <TabPanel id="edit" value={pane} idPrefix="adm-cms-pane">{form}</TabPanel>
          <TabPanel id="preview" value={pane} idPrefix="adm-cms-pane">{preview}</TabPanel>
        </>
      ) : (
        <div className={cx("adm-cms-grid", isPage && "has-rail", viewport === 2 && previewOpen && "has-preview")}>
          {rail}
          {form}
          {viewport === 2 && previewOpen ? <aside className="adm-cms-aside">{preview}</aside> : null}
        </div>
      )}

      {viewport === 1 && previewDrawer ? (
        <Drawer open onClose={() => setPreviewDrawer(false)} title="Live preview" description="The public site rendering the saved draft." width={620}>{preview}</Drawer>
      ) : null}

      {dialog === "publish" ? (
        <PublishDialog onClose={() => setDialog(null)} diff={publishDiff} dirty={dirty} firstPublish={meta.status === "never-published"} version={meta.version} onPublish={publish} />
      ) : null}
      {dialog === "history" ? (
        <HistorySheet
          doc={{ ...doc, version: meta.version }}
          canWrite={canWrite}
          dirty={dirty}
          onClose={() => setDialog(null)}
          onRestored={() => {
            clearLocal(doc.key);
            baseSig.current = sig(valueRef.current);
            setDialog(null);
            onReload();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={dialog === "discard"}
        onClose={() => setDialog(null)}
        onConfirm={discard}
        busy={busy}
        error={dialogError}
        title={hasServerDraft ? "Discard the draft?" : "Discard your changes?"}
        description={hasServerDraft ? "The saved draft and any unsaved edits are deleted. The editor goes back to the published version. This cannot be undone." : "Your unsaved edits are lost and the editor reloads the saved content."}
        confirmLabel={hasServerDraft ? "Discard draft" : "Discard changes"}
      />
      <ConfirmDialog
        open={dialog?.kind === "remove"}
        onClose={() => setDialog(null)}
        onConfirm={confirmRemove}
        title="Remove this section?"
        description={`"${dialog?.kind === "remove" ? doc.sectionSchemas?.[sections.find((s) => s.id === dialog.id)?.type]?.label || "This section" : ""}" and all of its content are removed from the draft. You can still bring it back by discarding unsaved changes or restoring a version.`}
        confirmLabel="Remove section"
      />
      <ConfirmDialog
        open={dialog === "leave"}
        onClose={() => setDialog(null)}
        onConfirm={() => {
          baseSig.current = sig(valueRef.current);
          setDialog(null);
          router.push(leaveHref.current);
        }}
        tone="danger"
        title="Leave without saving?"
        description="You have unsaved edits. They are kept in this browser, and you will be offered them back next time you open this page, but they are not in the draft."
        confirmLabel="Leave page"
      />
      {dialog?.kind === "conflict" ? (
        <Modal
          open
          onClose={busy ? undefined : () => setDialog(null)}
          title="Someone else changed this draft"
          description="The draft was saved by another editor after you opened it, so saving now would replace their changes."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>Keep editing</Button>
              <Button onClick={() => { clearLocal(doc.key); baseSig.current = sig(valueRef.current); onReload(); }} disabled={busy}>Reload latest</Button>
              <Button variant="danger" onClick={overwrite} loading={busy}>Overwrite with my version</Button>
            </>
          }
        >
          <div className="adm-stack">
            <p><b>Reload latest</b> loads their version and drops your unsaved edits.</p>
            <p><b>Overwrite</b> saves your version on top of theirs.</p>
            {dialog.error?.body?.draftUpdatedBy || dialog.error?.body?.latest?.draftUpdatedBy ? <p className="adm-muted">Last saved by {who(dialog.error.body.draftUpdatedBy || dialog.error.body.latest.draftUpdatedBy)}.</p> : null}
            {dialogError ? <p className="adm-inline-error" role="alert">{dialogError}</p> : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
