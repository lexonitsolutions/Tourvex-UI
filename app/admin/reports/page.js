"use client";

import Link from "next/link";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { rangeSearch } from "../_lib/reports";
import { Icon, NoAccess, RangePicker, useUrlParams } from "../_kit";
import { REPORTS } from "./reportDefs";

export default function ReportsIndexPage() {
  const { can } = useAdminMe();
  const [params, setParams] = useUrlParams();
  if (!can("dashboard.read")) return <NoAccess permission="dashboard.read" />;
  const search = rangeSearch(params);
  const visible = REPORTS.filter((r) => r.view.every((p) => can(p)));
  return (
    <>
      <div className="adm-dashhead">
        <div>
          <span className="adm-pill-chip"><i />Reports</span>
          <h1 className="adm-dashhead__title">Reports</h1>
          <p className="adm-dashhead__sub">Real figures from bookings, payments, leads and support. Pick a period, read the table and chart, export CSV.</p>
        </div>
        <div className="adm-dashhead__side"><RangePicker params={params} setParams={setParams} /></div>
      </div>
      {visible.length ? (
        <div className="adm-reportcards">
          {visible.map((r, i) => (
            <Link key={r.name} href={`/admin/reports/${r.name}${search}`} className={`adm-reportcard adm-tone-${r.tone}`} style={{ "--i": i }}>
              <span className="adm-reportcard__ico"><Icon name={r.icon} size={20} /></span>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
              <span className="adm-reportcard__go">Open report<Icon name="chevronRight" size={14} /></span>
            </Link>
          ))}
        </div>
      ) : <p className="adm-muted">Your role does not include any report. The reports need finance, enquiries, tickets or bookings access.</p>}
      <p className="adm-reportnote" style={{ marginTop: 20 }}>All money is AED. Days are Asia/Dubai calendar days. Comparisons are against the immediately preceding period of equal length.</p>
    </>
  );
}
