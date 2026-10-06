"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminApi } from "../_lib/adminApi";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { useAdminQuery } from "../_lib/useAdminQuery";
import { humanize } from "../_lib/format";
import {
  Button, ConfirmDialog, DateTime, FilterToolbar, Modal, MultiSelect, PageHeader, RequirePermission,
  SearchInput, SelectFilter, StatusBadge, TextField, UserCell, buildChips, fromKitActions, fromKitColumns, useTableUrlState, usePageSize, useToast, useUrlParams,
} from "../_kit";
import { DataTable, DataTableColumnsMenu } from "../_ui/data-table";

const LIMIT = 20;
const EMPTY = [];
const STAFF_ROLES = [
  { value: "super_admin", label: "Super admin", description: "Everything, including managing admins" },
  { value: "admin", label: "Admin", description: "Everything except granting super admin" },
  { value: "sales", label: "Sales", description: "Enquiries, customers, partners (read)" },
  { value: "operations", label: "Operations", description: "Bookings, vouchers, catalog (read)" },
  { value: "finance", label: "Finance", description: "Finance, invoices, refunds" },
  { value: "support", label: "Support", description: "Tickets, reviews, customers (read)" },
  { value: "content", label: "Content", description: "Catalog, blog, promos, reviews" },
];
const PRIVILEGED = ["admin", "super_admin"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const nameOf = (s) => s.fullName || s.name || s.email;
const isActive = (s) => (s.active !== undefined ? s.active !== false : String(s.status || "active").toLowerCase() === "active");

function StaffForm({ mode, initial, onClose, onSaved }) {
  const api = useAdminApi();
  const toast = useToast();
  const { user: me, can } = useAdminMe();
  const isSuper = (me?.roles || []).includes("super_admin");
  const editing = mode === "edit";
  const self = editing && initial && me?.id && (initial.id === me.id || initial.email === me.email);
  const [email, setEmail] = useState(initial?.email || "");
  const [fullName, setFullName] = useState(initial?.fullName || initial?.name || "");
  const [roles, setRoles] = useState(initial?.roles?.filter((r) => STAFF_ROLES.some((x) => x.value === r)) || []);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);
  // Inviting only needs staff.write; changing an existing person's roles also needs staff.assign_roles and never your own.
  const canAssign = editing ? can("staff.assign_roles") && !self : true;

  const options = STAFF_ROLES.map((r) => ({
    ...r,
    disabled: !canAssign || (PRIVILEGED.includes(r.value) && !isSuper),
    description: PRIVILEGED.includes(r.value) && !isSuper ? "Only a super admin can grant this role" : r.description,
  }));

  function validate() {
    const next = {};
    if (!editing && !EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (fullName.trim().length < 2) next.fullName = "Enter the person's full name.";
    if (!roles.length) next.roles = "Choose at least one staff role.";
    setErrors(next);
    return !Object.keys(next).length;
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setApiError("");
    try {
      const saved = editing
        ? await api.patch(`/admin/staff/${initial.id}`, { fullName: fullName.trim(), ...(canAssign ? { roles } : {}) })
        : await api.post("/admin/staff", { email: email.trim().toLowerCase(), fullName: fullName.trim(), roles });
      toast.success(editing ? "Staff member updated" : "Staff member invited. They get access when they sign in with this email.");
      onSaved(saved);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={editing ? `Edit ${nameOf(initial)}` : "Invite staff member"}
      description={editing ? initial.email : "They sign in with Clerk using this email; access is linked on first sign-in."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="adm-staff-form" loading={busy}>{editing ? "Save changes" : "Send invite"}</Button>
        </>
      }
    >
      <form id="adm-staff-form" className="adm-stack" onSubmit={submit} noValidate>
        {!editing ? <TextField label="Email" type="email" required value={email} onChange={setEmail} error={errors.email} autoComplete="off" data-autofocus /> : null}
        <TextField label="Full name" required value={fullName} onChange={setFullName} error={errors.fullName} data-autofocus={editing ? true : undefined} />
        <MultiSelect
          label="Roles"
          required
          value={roles}
          onChange={setRoles}
          options={options}
          error={errors.roles}
          hint={self ? "You cannot change your own roles." : !canAssign ? "You do not have permission to assign roles." : "Only a super admin can grant or revoke Admin and Super admin."}
        />
        {apiError ? <p className="adm-inline-error" role="alert">{apiError}</p> : null}
      </form>
    </Modal>
  );
}

export default function StaffPage() {
  return (
    <RequirePermission permission="staff.read">
      <StaffList />
    </RequirePermission>
  );
}

function StaffList() {
  const api = useAdminApi();
  const toast = useToast();
  const { can, user: me } = useAdminMe();
  const [params, setParams] = useUrlParams();
  const page = Math.max(1, Number(params.page) || 1);
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const query = useMemo(
    () => ({ q: params.q, role: params.role, status: params.status, page, limit, sort: params.sort || undefined }),
    [params.q, params.role, params.status, params.sort, page, limit]
  );
  const { data, error, loading, reload } = useAdminQuery("/admin/staff", query);
  const canWrite = can("staff.write");
  const [form, setForm] = useState(null); // { mode, initial }
  // "?invite=1" (from the topbar Create menu) opens the invite dialog; adjusting state during render, URL cleaned below.
  if (params.invite === "1" && canWrite && !form) setForm({ mode: "invite" });
  const [confirm, setConfirm] = useState(null); // { kind: "deactivate" | "reactivate", row }
  const [busy, setBusy] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  useEffect(() => {
    if (params.invite === "1") setParams({ invite: "", page: params.page });
  }, [params.invite, params.page, setParams]);

  async function runConfirm() {
    setBusy(true);
    setConfirmError("");
    try {
      await api.post(`/admin/staff/${confirm.row.id}/${confirm.kind}`);
      toast.success(confirm.kind === "deactivate" ? `${nameOf(confirm.row)} was deactivated` : `${nameOf(confirm.row)} was reactivated`);
      setConfirm(null);
      reload();
    } catch (err) {
      setConfirmError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const meId = me?.id;
  const columns = useMemo(
    () => fromKitColumns([
      { key: "firstName", label: "Name", sortable: true, primary: true, render: (s) => <UserCell name={nameOf(s)} email={s.email} size={34} suffix={meId === s.id ? <span className="adm-chip">You</span> : null} /> },
      { key: "roles", label: "Roles", render: (s) => <div className="adm-chips">{(s.roles || []).filter((r) => STAFF_ROLES.some((x) => x.value === r)).map((r) => <span className="adm-chip" key={r}>{humanize(r)}</span>)}</div> },
      { key: "status", label: "Status", render: (s) => (isActive(s) ? <StatusBadge status="active">Active</StatusBadge> : <StatusBadge status="deactivated">Deactivated</StatusBadge>) },
      { key: "linkedToClerk", label: "Sign-in", render: (s) => (s.linkedToClerk ? <StatusBadge tone="brand" icon="check">Linked</StatusBadge> : <span className="adm-muted">Waiting for first sign-in</span>) },
      { key: "createdAt", label: "Added", sortable: true, render: (s) => <DateTime value={s.createdAt} /> },
    ]),
    [meId]
  );
  const tableState = useTableUrlState(params, setParams, limit, setLimit);
  const rowActions = useMemo(
    () =>
      canWrite
        ? fromKitActions((s) => [
            { label: "Edit", icon: "edit", onSelect: () => setForm({ mode: "edit", initial: s }) },
            isActive(s)
              ? { label: "Deactivate", icon: "lock", danger: true, onSelect: () => { setConfirmError(""); setConfirm({ kind: "deactivate", row: s }); } }
              : { label: "Reactivate", icon: "refresh", onSelect: () => { setConfirmError(""); setConfirm({ kind: "reactivate", row: s }); } },
          ])
        : undefined,
    [canWrite]
  );

  const active = ["q", "role", "status"].filter((k) => params[k]).length;
  const STATUS_OPTIONS = [{ value: "active", label: "Active" }, { value: "inactive", label: "Deactivated" }];
  const chips = buildChips(
    params,
    [
      { keys: ["q"], label: "Search" },
      { keys: ["role"], label: "Role", text: (p) => STAFF_ROLES.find((r) => r.value === p.role)?.label || p.role },
      { keys: ["status"], label: "Status", text: (p) => STATUS_OPTIONS.find((o) => o.value === p.status)?.label || p.status },
    ],
    setParams
  );

  return (
    <>
      <PageHeader
        title="Staff"
        description={data?.pagination ? `${data.pagination.total.toLocaleString("en-GB")} people can sign in${active ? " (matching filters)" : ""} · roles decide what each person can see and do; changes are audited` : "People who can sign in to this admin."}
        actions={canWrite ? <Button variant="primary" icon="plus" onClick={() => setForm({ mode: "invite" })}>Invite staff</Button> : null}
      />
      <DataTable
        label="Staff members"
        storageKey="staff"
        manual
        title="Team"
        columns={columns}
        data={data?.items || EMPTY}
        getRowId={(s) => s.id}
        rowCount={data?.pagination?.total}
        {...tableState}
        rowActions={rowActions}
        loading={loading}
        error={error}
        onRetry={reload}
        columnsInToolbar
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Search name or email" label="Search staff" />}
        toolbar={(table) => (
          <FilterToolbar chips={chips} onClearAll={() => setParams({ q: "", role: "", status: "" })} end={<DataTableColumnsMenu table={table} />}>
            <SelectFilter label="Role" allLabel="All roles" value={params.role || ""} onChange={(role) => setParams({ role })} options={STAFF_ROLES.map((r) => ({ value: r.value, label: r.label }))} />
            <SelectFilter label="Status" allLabel="Any" value={params.status || ""} onChange={(status) => setParams({ status })} options={STATUS_OPTIONS} />
          </FilterToolbar>
        )}
        emptyState={
          <div className="adm-empty">
            <p className="adm-empty__title">{active ? "No staff match these filters" : "No staff yet"}</p>
            <p className="adm-empty__desc">{active ? "Try a different search or clear the filters." : "Invite the first team member to get started."}</p>
            <div className="adm-empty__action">
              {active ? <Button onClick={() => setParams({ q: "", role: "", status: "" })}>Clear filters</Button> : canWrite ? <Button variant="primary" icon="plus" onClick={() => setForm({ mode: "invite" })}>Invite staff</Button> : null}
            </div>
          </div>
        }
      />

      {form ? (
        <StaffForm
          mode={form.mode}
          initial={form.initial}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); reload(); }}
        />
      ) : null}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        busy={busy}
        error={confirmError}
        tone={confirm?.kind === "deactivate" ? "danger" : "primary"}
        title={confirm?.kind === "deactivate" ? "Deactivate staff member?" : "Reactivate staff member?"}
        description={
          confirm?.kind === "deactivate"
            ? `${confirm ? nameOf(confirm.row) : ""} will get a 403 on every admin request immediately. You can reactivate them later.`
            : `${confirm ? nameOf(confirm.row) : ""} will be able to sign in to the admin again with their existing roles.`
        }
        confirmText={confirm?.kind === "deactivate" ? confirm.row.email : undefined}
        confirmLabel={confirm?.kind === "deactivate" ? "Deactivate" : "Reactivate"}
      />
    </>
  );
}
