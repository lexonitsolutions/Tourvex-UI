"use client";

import "./tax.css";
import { useEffect, useMemo, useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { formatDateTime } from "../../_lib/format";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { Button, ErrorState, MoneyField, SelectField, Skeleton, Switch, TextField, useToast } from "../../_kit";
import TaxPreview from "./TaxPreview";
import { INDIA_STATES, INDIA_STATE_OPTIONS, TAX_API, clone, countryName, fmtPercent, same, serverErrors, taxErrorText } from "./taxLib";

const PERCENT_RE = /^\d{1,3}(\.\d{1,3})?$/;

/** Default country and the fallback percent: GET / PATCH /admin/tax/settings. Reports its dirty state to the tab (leave guard). */
export function TaxSettingsCard({ regimes, countries, canWrite, onDirty }) {
  const api = useAdminApi();
  const toast = useToast();
  const { data, error, loading, reload } = useAdminQuery(`${TAX_API}/settings`, undefined, { prefetchNext: false });
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(null);
  const [errors, setErrors] = useState({});
  const [general, setGeneral] = useState([]);
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState(null);
  if (data && data !== seen) {
    const v = { defaultCountry: data.defaultCountry || "", defaultRateFallbackPercent: data.defaultRateFallbackPercent === undefined || data.defaultRateFallbackPercent === null ? "" : String(data.defaultRateFallbackPercent) };
    setSeen(data);
    setDraft(clone(v));
    setSaved(clone(v));
    setErrors({});
  }
  const dirty = !!draft && !same(draft, saved);
  useEffect(() => {
    onDirty?.(dirty);
    return () => onDirty?.(false);
  }, [dirty, onDirty]);

  const options = useMemo(() => {
    const codes = [...new Set([...regimes.filter((r) => r.active !== false).map((r) => r.country), draft?.defaultCountry].filter(Boolean))];
    return codes.map((c) => ({ value: c, label: `${countryName(countries, c, regimes.find((r) => r.country === c)?.countryName)} (${c})` }));
  }, [regimes, countries, draft?.defaultCountry]);

  if (error && !data) return <section className="tx-card"><ErrorState title="Could not load the tax settings" description={error.message} onRetry={reload} /></section>;
  if (loading && !draft) return <section className="tx-card"><div className="adm-stack"><Skeleton height={40} /><Skeleton height={40} /></div></section>;
  if (!draft) return null;

  const set = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  async function save(event) {
    event.preventDefault();
    const found = {};
    if (!draft.defaultCountry) found.defaultCountry = "Choose the default country.";
    const p = String(draft.defaultRateFallbackPercent).trim();
    if (!p) found.defaultRateFallbackPercent = "Required (0 is allowed).";
    else if (!PERCENT_RE.test(p) || Number(p) > 100) found.defaultRateFallbackPercent = "A number from 0 to 100 with up to 3 decimals.";
    setErrors(found);
    setGeneral([]);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const res = await api.patch(`${TAX_API}/settings`, { defaultCountry: draft.defaultCountry, defaultRateFallbackPercent: Number(p) });
      const v = { defaultCountry: res?.defaultCountry || draft.defaultCountry, defaultRateFallbackPercent: String(res?.defaultRateFallbackPercent ?? p) };
      setDraft(clone(v));
      setSaved(clone(v));
      toast.success("Tax settings saved");
      reload();
    } catch (e) {
      const parsed = serverErrors(e, ["defaultCountry", "defaultRateFallbackPercent"]);
      setErrors((prev) => ({ ...prev, ...parsed.fields }));
      setGeneral(parsed.general.length || Object.keys(parsed.fields).length ? parsed.general : [taxErrorText(e)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="tx-card" onSubmit={save} noValidate aria-labelledby="tx-settings-title">
      <div className="tx-card__head">
        <div>
          <h3 className="tx-card__title" id="tx-settings-title">Tax settings</h3>
          <p className="tx-card__sub">What applies when a product&apos;s service country has no active regime.</p>
        </div>
      </div>
      <div className="tx-form">
        <SelectField label="Default country" required value={draft.defaultCountry} onChange={(defaultCountry) => set({ defaultCountry })} options={options} placeholder="Choose a country" error={errors.defaultCountry} disabled={!canWrite} hint="Its regime is used when no regime matches the service country." />
        <TextField label="Fallback rate" required inputMode="decimal" suffix="%" value={draft.defaultRateFallbackPercent} onChange={(v) => set({ defaultRateFallbackPercent: v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1") })} error={errors.defaultRateFallbackPercent} disabled={!canWrite} hint="Used only if the default regime has no usable rate." />
        {general.length ? <p className="tx-error" role="alert">{general.join(" ")}</p> : null}
        <div className="tx-bar">
          <span className={dirty ? "tx-dirty" : "adm-muted"}>{!canWrite ? "You can view these settings but not change them." : dirty ? "You have unsaved changes." : data?.updatedAt ? `Last saved ${formatDateTime(data.updatedAt)}` : "No unsaved changes."}</span>
          {canWrite ? (
            <div className="adm-row">
              <Button variant="ghost" onClick={() => { setDraft(clone(saved)); setErrors({}); setGeneral([]); }} disabled={!dirty || busy}>Discard</Button>
              <Button variant="primary" type="submit" loading={busy} disabled={!dirty}>Save changes</Button>
            </div>
          ) : null}
        </div>
      </div>
    </form>
  );
}

/** Tax calculator: POST /admin/tax/preview { country, state?, stateCode?, amount, rateCode?, pricesIncludeTax? }. */
export function CalculatorCard({ regimes, defaultCountry }) {
  const api = useAdminApi();
  const active = useMemo(() => regimes.filter((r) => r.active !== false), [regimes]);
  const [form, setForm] = useState({ country: "", stateCode: "", amount: null, rateCode: "", pricesIncludeTax: false });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErr, setFieldErr] = useState({});

  const country = form.country || defaultCountry || active[0]?.country || "";
  const regime = regimes.find((r) => r.country === country && r.active !== false) || regimes.find((r) => r.country === country) || null;
  const india = regime?.model === "india_gst";
  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setResult(null);
    setError("");
    setFieldErr({});
  };

  async function calculate(event) {
    event.preventDefault();
    const found = {};
    if (!country) found.country = "Choose a country.";
    if (!(form.amount > 0)) found.amount = "Enter an amount above 0.";
    setFieldErr(found);
    setError("");
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const state = india && form.stateCode ? INDIA_STATES.find((s) => s.code === form.stateCode)?.name : undefined;
      setResult(await api.post(`${TAX_API}/preview`, {
        country,
        amount: form.amount,
        ...(india && form.stateCode ? { state, stateCode: form.stateCode } : {}),
        ...(form.rateCode ? { rateCode: form.rateCode } : {}),
        pricesIncludeTax: form.pricesIncludeTax,
      }));
    } catch (e) {
      setResult(null);
      setError(taxErrorText(e));
    } finally {
      setBusy(false);
    }
  }

  const rateOptions = (regime?.rates || []).map((r) => ({ value: r.code, label: `${r.label || r.code} (${fmtPercent(r.percent)})${r.isDefault ? " - default" : ""}` }));
  return (
    <form className="tx-card" onSubmit={calculate} noValidate aria-labelledby="tx-calc-title">
      <div className="tx-card__head">
        <div>
          <h3 className="tx-card__title" id="tx-calc-title">Tax calculator</h3>
          <p className="tx-card__sub">Try an amount against a regime to see the net, each tax component and the total. Nothing is saved.</p>
        </div>
      </div>
      <div className="tx-calc">
        <div className="tx-form2">
          <SelectField label="Country" required value={country} onChange={(c) => set({ country: c, stateCode: "", rateCode: "" })} options={active.map((r) => ({ value: r.country, label: `${r.countryName || r.country} (${r.country})` }))} placeholder="Choose a country" error={fieldErr.country} />
          {india ? (
            <SelectField label="Place of supply (state)" value={form.stateCode} onChange={(stateCode) => set({ stateCode })} options={INDIA_STATE_OPTIONS} placeholder="Not set" hint="Inside the seller's state: CGST + SGST. Elsewhere: IGST." />
          ) : (
            <SelectField label="Rate" value={form.rateCode} onChange={(rateCode) => set({ rateCode })} options={rateOptions} placeholder="Regime default" />
          )}
          <MoneyField label="Amount" required value={form.amount} onChange={(amount) => set({ amount })} error={fieldErr.amount} />
          {india ? <SelectField label="Rate" value={form.rateCode} onChange={(rateCode) => set({ rateCode })} options={rateOptions} placeholder="Regime default" /> : null}
        </div>
        <Switch label="Amount includes tax" description="On: the amount is the total and the tax is taken out of it. Off: tax is added on top." checked={form.pricesIncludeTax} onChange={(pricesIncludeTax) => set({ pricesIncludeTax })} />
        <div><Button variant="primary" type="submit" icon="check" loading={busy}>Calculate</Button></div>
        {error ? <p className="tx-error" role="alert">{error}</p> : null}
        <div aria-live="polite"><TaxPreview result={result} /></div>
      </div>
    </form>
  );
}
