"use client";

import "./tax.css";
import { useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { Button, ConfirmDialog, Dropdown, ErrorState, Icon, Skeleton, StatusBadge, useToast } from "../../_kit";
import RegimeDialog from "./RegimeDialog";
import { MODEL_LABEL, TAX_API, ratesSummary, taxErrorText } from "./taxLib";

/** Tax regimes table (one per country) with the editor dialog, activate / deactivate and delete (409 REGIME_IN_USE explained). */
export default function RegimesCard({ regimes, countries, canWrite, onChanged }) {
  const api = useAdminApi();
  const toast = useToast();
  const [dialog, setDialog] = useState(null); // { regime }
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [removeError, setRemoveError] = useState("");

  async function toggleActive(r) {
    try {
      await api.patch(`${TAX_API}/regimes/${r.id}`, { active: r.active === false });
      toast.success(r.active === false ? "Regime activated" : "Regime deactivated");
      onChanged();
    } catch (e) {
      toast.error(taxErrorText(e));
    }
  }
  async function remove() {
    setBusy(true);
    setRemoveError("");
    try {
      await api.delete(`${TAX_API}/regimes/${removing.id}`);
      toast.success("Tax regime deleted");
      setRemoving(null);
      onChanged();
    } catch (e) {
      setRemoveError(taxErrorText(e));
    } finally {
      setBusy(false);
    }
  }

  const items = regimes.items;
  return (
    <section className="tx-card" aria-labelledby="tx-regimes-title">
      <div className="tx-card__head">
        <div>
          <h3 className="tx-card__title" id="tx-regimes-title">Tax regimes</h3>
          <p className="tx-card__sub">One regime per country. The tax that applies is decided by the country where the service is delivered, not where the customer lives. Countries without a regime use the default country below.</p>
        </div>
        {canWrite ? <div className="tx-card__actions"><Button variant="primary" icon="plus" onClick={() => setDialog({ regime: null })}>Add country</Button></div> : null}
      </div>

      {regimes.error && !regimes.data ? (
        <ErrorState title="Could not load the tax regimes" description={regimes.error.message} onRetry={regimes.reload} />
      ) : regimes.loading && !regimes.data ? (
        <div className="adm-stack"><Skeleton height={40} /><Skeleton height={40} /><Skeleton height={40} /></div>
      ) : !items.length ? (
        <p className="tx-empty">No tax regimes yet. Run the tax seed on the API, or add a country.</p>
      ) : (
        <div className="tx-tablewrap">
          <table className="tx-table">
            <thead>
              <tr><th scope="col">Country</th><th scope="col">Tax</th><th scope="col">Rates</th><th scope="col">Model</th><th scope="col">Prices</th><th scope="col">Status</th>{canWrite ? <th scope="col"><span className="adm-sr">Actions</span></th> : null}</tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td data-label="Country"><span className="tx-cell"><b>{r.countryName || r.country}</b><small>{r.country}</small></span></td>
                  <td data-label="Tax"><span className="tx-cell"><b>{r.taxName}</b><small>{r.registrationLabel}</small></span></td>
                  <td data-label="Rates"><span className="tx-code">{ratesSummary(r)}</span></td>
                  <td data-label="Model">{MODEL_LABEL[r.model] || r.model}</td>
                  <td data-label="Prices">{r.pricesIncludeTax ? "Include tax" : "Exclude tax"}</td>
                  <td data-label="Status"><StatusBadge tone={r.active === false ? "neutral" : "success"}>{r.active === false ? "Inactive" : "Active"}</StatusBadge></td>
                  {canWrite ? (
                    <td className="tx-actions" data-label="">
                      <Dropdown
                        label={`Actions for ${r.countryName || r.country}`}
                        trigger={() => <button type="button" className="adm-iconbtn" aria-label={`Actions for ${r.countryName || r.country}`}><Icon name="more" /></button>}
                        items={[
                          { label: "Edit", icon: "edit", onSelect: () => setDialog({ regime: r }) },
                          { label: r.active === false ? "Activate" : "Deactivate", icon: r.active === false ? "check" : "ban", onSelect: () => toggleActive(r) },
                          { separator: true },
                          { label: "Delete", icon: "trash", danger: true, onSelect: () => { setRemoveError(""); setRemoving(r); } },
                        ]}
                      />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog ? <RegimeDialog regime={dialog.regime} regimes={items} countries={countries} onClose={() => setDialog(null)} onSaved={onChanged} /> : null}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        busy={busy}
        error={removeError}
        title={`Delete the ${removing?.countryName || removing?.country || ""} regime?`}
        description="This only works when no invoice or booking uses it. If it is in use, deactivate it instead."
        confirmLabel="Delete"
      />
    </section>
  );
}
