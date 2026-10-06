"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { formatDateTime } from "../../_lib/format";
import { Button, DateTime, Modal, PageHeader, RequirePermission, SearchInput, StatusBadge, TextArea, UserCell, fromKitColumns, useToast, useUrlParams, useTableUrlState, usePageSize } from "../../_kit";
import { DataTable } from "../../_ui/data-table";
import { formatDay, money } from "../../_ops/Ops";

const LIMIT = 20;
const EMPTY = [];

export default function CancellationsPage() {
  return (
    <RequirePermission permission="bookings.read">
      <Queue />
    </RequirePermission>
  );
}

function Queue() {
  const api = useAdminApi();
  const toast = useToast();
  const { can } = useAdminMe();
  const [params, setParams] = useUrlParams();
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const page = Math.max(1, Number(params.page) || 1);
  const query = useMemo(() => ({ q: params.q, page, limit }), [params.q, page, limit]);
  const tableState = useTableUrlState(params, setParams, limit, setLimit);
  const { data, error, loading, reload } = useAdminQuery("/admin/bookings/cancellation-requests", query);
  const [dialog, setDialog] = useState(null); // { kind: "approve" | "reject", row }
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState("");
  const canDecide = can("bookings.cancel");
  const canRefund = can("bookings.refund");

  function open(kind, row) {
    setReason("");
    setApiError("");
    setDialog({ kind, row });
  }

  async function submit(event) {
    event.preventDefault();
    const { kind, row } = dialog;
    setBusy(true);
    setApiError("");
    try {
      if (kind === "reject") await api.post(`/admin/bookings/${row.id}/cancellation/reject`, { reason: reason.trim() });
      else {
        const refund = canRefund && row.policy.refundAmount > 0 ? "policy" : "none";
        const result = await api.post(`/admin/bookings/${row.id}/cancellation/approve`, { refund, note: reason.trim() || undefined });
        if (result.refundError) toast.error(`Cancelled, but the refund failed: ${result.refundError}`);
      }
      toast.success(kind === "reject" ? "Request rejected" : "Cancellation approved");
      setDialog(null);
      reload();
    } catch (e) {
      setApiError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const columns = useMemo(() => fromKitColumns([
    { key: "reference", label: "Booking", primary: true, render: (b) => <Link href={`/admin/bookings/${b.id}`} className="adm-ops-link">{b.reference}</Link> },
    { key: "customer", label: "Customer", render: (b) => <UserCell name={b.customerName} email={b.customerEmail} size={32} /> },
    { key: "title", label: "Service", render: (b) => (<>{b.title}<small className="adm-ops-sub">{formatDay(b.serviceDay)}</small></>) },
    { key: "requestedAt", label: "Requested", render: (b) => <DateTime value={b.requestedAt} /> },
    {
      key: "policy", label: "Policy outcome",
      render: (b) => b.policy.eligible
        ? <><StatusBadge tone="success">Refund {money(b.policy.refundAmount, b.currency)}</StatusBadge><small className="adm-ops-sub">Free cancellation until {formatDateTime(b.freeCancellationUntil)}</small></>
        : <><StatusBadge tone="neutral">No refund</StatusBadge><small className="adm-ops-sub">{b.policy.reason}</small></>,
    },
    { key: "total", label: "Total", align: "right", render: (b) => <span className="adm-ops-num">{money(b.total, b.currency)}</span> },
    {
      key: "actions", label: "Decision", align: "right",
      render: (b) => canDecide ? (
        <div className="adm-ops-actions" style={{ justifyContent: "flex-end" }}>
          <Button size="sm" variant="primary" onClick={() => open("approve", b)}>Approve</Button>
          <Button size="sm" onClick={() => open("reject", b)}>Reject</Button>
        </div>
      ) : null,
    },
  ]), [canDecide]);

  return (
    <>
      <PageHeader title="Cancellation requests" description={data?.pagination ? `${data.pagination.total.toLocaleString("en-GB")} waiting for a decision · approving refunds per the free-cancellation policy; rejecting returns the booking to confirmed` : "Customers who asked to cancel. Approving cancels the booking, voids the voucher and refunds according to the free-cancellation policy."} />
      <DataTable
        label="Cancellation requests"
        storageKey="cancellations"
        manual
        title="Requests awaiting a decision"
        columns={columns}
        data={data?.items || EMPTY}
        getRowId={(b) => b.id}
        rowCount={data?.pagination?.total}
        {...tableState}
        loading={loading}
        error={error}
        onRetry={reload}
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Reference, name or email" label="Search requests" />}
        emptyState={
          <div className="adm-empty">
            <p className="adm-empty__title">No cancellation requests</p>
            <p className="adm-empty__desc">You are all caught up. New requests from customers appear here, oldest first.</p>
          </div>
        }
      />
      {dialog ? (
        <Modal
          open
          onClose={busy ? undefined : () => setDialog(null)}
          title={dialog.kind === "reject" ? "Reject cancellation request" : "Approve cancellation"}
          description={dialog.kind === "reject" ? `${dialog.row.reference} stays confirmed.` : `${dialog.row.reference} is cancelled and its voucher voided.${dialog.row.policy.refundAmount > 0 ? (canRefund ? ` The policy refund of ${money(dialog.row.policy.refundAmount, dialog.row.currency)} is sent to the customer.` : " You cannot refund; finance will have to refund it afterwards.") : " The policy gives no refund."}`}
          footer={<><Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>Cancel</Button><Button variant={dialog.kind === "reject" ? "secondary" : "primary"} type="submit" form="ops-queue" loading={busy} disabled={dialog.kind === "reject" && !reason.trim()}>{dialog.kind === "reject" ? "Reject request" : "Approve and cancel"}</Button></>}
        >
          <form id="ops-queue" className="adm-stack" onSubmit={submit}>
            <TextArea label={dialog.kind === "reject" ? "Reason" : "Note (optional)"} required={dialog.kind === "reject"} value={reason} onChange={setReason} rows={2} maxLength={300} data-autofocus />
            {apiError ? <p className="adm-inline-error" role="alert">{apiError}</p> : null}
          </form>
        </Modal>
      ) : null}
    </>
  );
}
