"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { formatDateTime } from "../../_lib/format";
import { Card, ErrorState, KeyValue, PageHeader, RequirePermission, Skeleton, StatusBadge } from "../../_kit";
import { InvoiceBadge, PdfButton, money } from "../../_ops/Ops";
import { EmailCard, TaxBreakdownCard, TaxDetailsCard, buyerItems, sellerHasNumber, sellerItems } from "../_components/InvoiceTax";

export default function InvoicePage() {
  return (
    <RequirePermission permission="invoices.read">
      <InvoiceDetail />
    </RequirePermission>
  );
}

function InvoiceDetail() {
  const { id } = useParams();
  const { data: inv, error, reload } = useAdminQuery(`/admin/invoices/${id}`);
  if (error && !inv) return <ErrorState title={error.status === 404 ? "Invoice not found" : "Could not load this invoice"} description={error.message} onRetry={error.status === 404 ? undefined : reload} />;
  if (!inv) return (<><PageHeader title="Invoice" /><Card><Skeleton height={14} width="50%" /></Card></>);
  const credit = inv.kind === "credit_note";
  const sign = credit ? "-" : "";
  return (
    <>
      <PageHeader
        title={inv.invoiceNumber}
        meta={<div className="adm-row">{credit ? <StatusBadge tone="warning">Credit note</StatusBadge> : <StatusBadge tone="neutral">Invoice</StatusBadge>}<InvoiceBadge status={inv.status} /></div>}
        description={`${inv.title ? `${inv.title} · ` : ""}Issued ${formatDateTime(inv.issuedAt)}`}
        actions={<PdfButton path={`/admin/invoices/${inv.id}/pdf`} filename={`${inv.invoiceNumber}.pdf`} />}
      />
      <div className="adm-ops-detail">
        <div className="adm-ops-col">
          <Card title="Line items">
            <table className="adm-ops-pricetable">
              <thead>
                <tr><th scope="col">Description</th><th scope="col">Amount</th></tr>
              </thead>
              <tbody>
                {(inv.lines.length ? inv.lines : [{ label: `Booking ${inv.bookingReference || ""}`, qty: 1, total: inv.subtotal }]).map((l, i) => (
                  <tr key={i}><td>{l.label}{l.qty > 1 ? <small className="adm-ops-sub">{l.qty} x {money(l.unitAmount, inv.currency)}</small> : null}</td><td>{sign}{money(l.total, inv.currency)}</td></tr>
                ))}
                {inv.discount > 0 ? <tr><td>Discount</td><td>-{money(inv.discount, inv.currency)}</td></tr> : null}
                <tr><td>Taxes &amp; fees{inv.taxPercent ? ` (${inv.taxPercent}%)` : ""}</td><td>{sign}{money(inv.tax, inv.currency)}</td></tr>
              </tbody>
              <tfoot>
                <tr><th scope="row">{credit ? "Total refunded" : "Total paid"}</th><td>{sign}{money(inv.total, inv.currency)}</td></tr>
              </tfoot>
            </table>
          </Card>
          <TaxBreakdownCard inv={inv} credit={credit} />
          {inv.reason ? <Card title="Reason"><p>{inv.reason}</p></Card> : null}
        </div>
        <div className="adm-ops-col">
          <Card title="Details">
            <KeyValue
              items={[
                { label: "Booking", value: inv.bookingReference ? <Link className="adm-ops-link" href={`/admin/bookings/${inv.bookingId}`}>{inv.bookingReference}</Link> : null },
                { label: "Order", value: inv.orderReference ? <Link className="adm-ops-link" href={`/admin/bookings/orders/${inv.orderReference}`}>{inv.orderReference}</Link> : null },
                { label: "Against invoice", value: inv.relatedInvoiceId ? <Link className="adm-ops-link" href={`/admin/invoices/${inv.relatedInvoiceId}`}>{inv.relatedInvoiceNumber}</Link> : null },
                { label: "Payment reference", value: inv.paymentReference },
              ]}
            />
          </Card>
          <TaxDetailsCard inv={inv} />
          <Card title="Billed to">
            <KeyValue items={buyerItems(inv)} />
          </Card>
          <EmailCard inv={inv} onDone={reload} />
          <Card title="Issued by">
            {inv.seller ? (
              <KeyValue items={sellerItems(inv)} />
            ) : <p className="adm-muted">This invoice predates company details; the PDF uses the current settings.</p>}
            {!sellerHasNumber(inv) ? <p className="adm-muted" style={{ marginTop: 8 }}>Add the legal name and TRN in Settings &gt; General so new invoices carry them.</p> : null}
          </Card>
        </div>
      </div>
    </>
  );
}
