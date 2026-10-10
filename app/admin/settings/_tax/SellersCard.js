"use client";

import "./tax.css";
import { useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { Button, ConfirmDialog, Dropdown, ErrorState, Icon, Skeleton, StatusBadge, useToast } from "../../_kit";
import SellerDialog from "./SellerDialog";
import { TAX_API, countryName, regimeFor, taxErrorText } from "./taxLib";

/** Seller registrations table: add / edit dialog and delete (409 SELLER_IN_USE explained). */
export default function SellersCard({ sellers, regimes, countries, defaultCountry, canWrite, onChanged }) {
  const api = useAdminApi();
  const toast = useToast();
  const [dialog, setDialog] = useState(null); // { seller } | null
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [removeError, setRemoveError] = useState("");

  async function remove() {
    setBusy(true);
    setRemoveError("");
    try {
      await api.delete(`${TAX_API}/sellers/${removing.id}`);
      toast.success("Seller registration deleted");
      setRemoving(null);
      onChanged();
    } catch (e) {
      setRemoveError(taxErrorText(e));
    } finally {
      setBusy(false);
    }
  }

  const items = sellers.items;
  return (
    <section className="tx-card" aria-labelledby="tx-sellers-title">
      <div className="tx-card__head">
        <div>
          <h3 className="tx-card__title" id="tx-sellers-title">Seller registrations</h3>
          <p className="tx-card__sub">The legal entities that issue invoices. An invoice uses the active registration for its tax country, otherwise the default one.</p>
        </div>
        {canWrite ? <div className="tx-card__actions"><Button variant="primary" icon="plus" onClick={() => setDialog({ seller: null })}>Add registration</Button></div> : null}
      </div>

      {sellers.error && !sellers.data ? (
        <ErrorState title="Could not load the seller registrations" description={sellers.error.message} onRetry={sellers.reload} />
      ) : sellers.loading && !sellers.data ? (
        <div className="adm-stack"><Skeleton height={40} /><Skeleton height={40} /></div>
      ) : !items.length ? (
        <p className="tx-empty">No seller registrations yet. Invoices fall back to the company details in Settings &gt; General until you add one.</p>
      ) : (
        <div className="tx-tablewrap">
          <table className="tx-table">
            <thead>
              <tr><th scope="col">Legal name</th><th scope="col">Country</th><th scope="col">Registration no.</th><th scope="col">Contact</th><th scope="col">Status</th>{canWrite ? <th scope="col"><span className="adm-sr">Actions</span></th> : null}</tr>
            </thead>
            <tbody>
              {items.map((s) => {
                const regime = regimeFor(regimes, s.country);
                const label = s.registrationLabel || regime?.registrationLabel || "Reg. no.";
                return (
                  <tr key={s.id}>
                    <td data-label="Legal name"><span className="tx-cell"><b>{s.legalName}</b>{s.state ? <small>{s.state}{s.stateCode ? ` (${s.stateCode})` : ""}</small> : null}</span></td>
                    <td data-label="Country">{countryName(countries, s.country)}</td>
                    <td data-label={label}><span className="tx-cell"><span className="tx-code">{s.registrationNumber}</span><small>{label}</small></span></td>
                    <td data-label="Contact"><span className="tx-cell">{s.email ? <span>{s.email}</span> : null}{s.phone ? <small>{s.phone}</small> : null}{!s.email && !s.phone ? "-" : null}</span></td>
                    <td data-label="Status">
                      <span className="tx-flags">
                        {s.isDefault ? <StatusBadge tone="brand">Default</StatusBadge> : null}
                        <StatusBadge tone={s.active === false ? "neutral" : "success"}>{s.active === false ? "Inactive" : "Active"}</StatusBadge>
                      </span>
                    </td>
                    {canWrite ? (
                      <td className="tx-actions" data-label="">
                        <Dropdown
                          label={`Actions for ${s.legalName}`}
                          trigger={() => <button type="button" className="adm-iconbtn" aria-label={`Actions for ${s.legalName}`}><Icon name="more" /></button>}
                          items={[
                            { label: "Edit", icon: "edit", onSelect: () => setDialog({ seller: s }) },
                            { separator: true },
                            { label: "Delete", icon: "trash", danger: true, disabled: s.isDefault, onSelect: () => { setRemoveError(""); setRemoving(s); } },
                          ]}
                        />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog ? <SellerDialog seller={dialog.seller} regimes={regimes} countries={countries} defaultCountry={defaultCountry} onClose={() => setDialog(null)} onSaved={onChanged} /> : null}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        busy={busy}
        error={removeError}
        title={`Delete "${removing?.legalName || ""}"?`}
        description="The registration is removed. This only works when no invoice was issued with it; otherwise deactivate it instead."
        confirmLabel="Delete"
      />
    </section>
  );
}
