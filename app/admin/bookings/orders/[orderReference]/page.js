"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAdminQuery } from "../../../_lib/useAdminQuery";
import { formatDateTime } from "../../../_lib/format";
import { Card, ErrorState, InlineTable, KeyValue, PageHeader, RequirePermission, Skeleton } from "../../../_kit";
import { BookingStatusBadge, PaymentBadge, formatDay, money, paxText } from "../../../_ops/Ops";

export default function OrderPage() {
  return (
    <RequirePermission permission="bookings.read">
      <Order />
    </RequirePermission>
  );
}

function Order() {
  const { orderReference } = useParams();
  const router = useRouter();
  const { data: o, error, reload } = useAdminQuery(`/admin/bookings/orders/${orderReference}`);
  if (error && !o) return <ErrorState title={error.status === 404 ? "Order not found" : "Could not load this order"} description={error.message} onRetry={error.status === 404 ? undefined : reload} />;
  if (!o) return (<><PageHeader title={orderReference} /><Card><Skeleton height={14} width="50%" /></Card></>);

  const columns = [
    { key: "reference", label: "Booking", primary: true, render: (b) => <Link href={`/admin/bookings/${b.id}`} className="adm-ops-link">{b.reference}</Link> },
    { key: "title", label: "Service", render: (b) => (<>{b.title}<small className="adm-ops-sub">{b.optionName}</small></>) },
    { key: "serviceDay", label: "Service date", render: (b) => (<>{formatDay(b.serviceDay)}<small className="adm-ops-sub">{paxText(b.adults, b.children)}</small></>) },
    { key: "status", label: "Status", render: (b) => <BookingStatusBadge status={b.status} /> },
    { key: "paymentStatus", label: "Payment", render: (b) => <PaymentBadge status={b.paymentStatus} /> },
    { key: "total", label: "Total", align: "right", render: (b) => <span className="adm-ops-num">{money(b.total, b.currency)}</span> },
  ];

  return (
    <>
      <PageHeader
        title={o.orderReference}
        description={`${o.bookings.length} ${o.bookings.length === 1 ? "booking" : "bookings"} paid together`}
        meta={<BookingStatusBadge status={o.status} />}
      />
      <div className="adm-ops-detail">
        <div className="adm-ops-col">
          <Card title="Bookings in this order" flush>
            <InlineTable columns={columns} rows={o.bookings} onRowClick={(b) => router.push(`/admin/bookings/${b.id}`)} caption="Bookings in this order" />
          </Card>
        </div>
        <div className="adm-ops-col">
          <Card title="Payment">
            <KeyValue
              items={[
                { label: "Subtotal", value: money(o.subtotal, o.currency) },
                { label: "Discount", value: o.discount > 0 ? `-${money(o.discount, o.currency)}${o.promoCode ? ` (${o.promoCode})` : ""}` : "-" },
                { label: "Taxes & fees", value: money(o.tax, o.currency) },
                { label: "Total", value: <b>{money(o.total, o.currency)}</b> },
                { label: "Refunded", value: o.refunded > 0 ? money(o.refunded, o.currency) : "-" },
                { label: "Method", value: o.paymentMode === "mock" ? "Simulated (mock mode)" : o.paymentMode === "stripe" ? "Card (Stripe)" : o.paymentMode },
                { label: "Reference", value: o.paymentReference },
                { label: "Paid on", value: o.paidAt ? formatDateTime(o.paidAt) : "-" },
                { label: "Created", value: formatDateTime(o.createdAt) },
              ]}
            />
          </Card>
          {o.customer ? (
            <Card title="Customer">
              <KeyValue items={[{ label: "Name", value: o.customer.fullName }, { label: "Email", value: o.customer.email }, { label: "Phone", value: o.customer.phone ? `${o.customer.phoneCountryCode || ""} ${o.customer.phone}` : null }, { label: "Nationality", value: o.customer.nationality }]} />
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
