"use client";

import "./tax.css";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { ConfirmDialog } from "../../_kit";
import { useLeaveGuard } from "../../content/_components/leaveGuard";
import RegimesCard from "./RegimesCard";
import SellersCard from "./SellersCard";
import { CalculatorCard, TaxSettingsCard } from "./SettingsCards";
import { TAX_API, useCountries, useRegimes, useSellers } from "./taxLib";

/** Settings > "Tax & invoicing" (permission tax.read to see it, tax.write to change anything). */
export default function TaxSettingsTab() {
  const { can } = useAdminMe();
  const router = useRouter();
  const canWrite = can("tax.write");
  const regimes = useRegimes();
  const sellers = useSellers();
  const countries = useCountries();
  const settings = useAdminQuery(`${TAX_API}/settings`, undefined, { prefetchNext: false });

  const dirtyRef = useRef(false);
  const leaveHref = useRef("/admin");
  const [leaving, setLeaving] = useState(false);
  const onDirty = useCallback((d) => { dirtyRef.current = d; }, []);
  useLeaveGuard(() => dirtyRef.current, (href) => { leaveHref.current = href; setLeaving(true); });

  const defaultCountry = settings.data?.defaultCountry || "";
  return (
    <div className="tx">
      <div className="tx-note" role="note">
        <b>What this does and does not do.</b>
        <ul>
          <li>Invoices are issued in the booking currency (AED). A separate INR or SAR invoice currency with exchange rates is not part of this release.</li>
          <li>There is no government e-invoicing integration (India IRN / e-way bill, Saudi ZATCA phase 2, UAE FTA). The fields they need are stored on each invoice. For ZATCA regimes the PDF carries the phase 1 QR only.</li>
          <li>These are settings, not legal advice. Have your accountant check the rates, labels and number formats before relying on them.</li>
        </ul>
      </div>
      <RegimesCard regimes={regimes} countries={countries.items} canWrite={canWrite} onChanged={regimes.reload} />
      <SellersCard sellers={sellers} regimes={regimes.items} countries={countries.items} defaultCountry={defaultCountry} canWrite={canWrite} onChanged={sellers.reload} />
      <div className="tx-split">
        <TaxSettingsCard regimes={regimes.items} countries={countries.items} canWrite={canWrite} onDirty={onDirty} />
        <CalculatorCard regimes={regimes.items} defaultCountry={defaultCountry} />
      </div>
      <ConfirmDialog
        open={leaving}
        onClose={() => setLeaving(false)}
        onConfirm={() => { dirtyRef.current = false; setLeaving(false); router.push(leaveHref.current); }}
        title="Leave without saving?"
        description="You have unsaved tax settings. If you leave now they are lost."
        confirmLabel="Leave page"
      />
    </div>
  );
}
