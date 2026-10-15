"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_COUNTRIES } from "../../lib/countries";
import { createBookingApi, errorMessage } from "../../lib/booking";
import { currentPath, loginUrlFor } from "../../lib/wishlistAuth";
import { formatPrice } from "../../lib/api";
import { useApp } from "../AppProvider";
import { Flag, IconCalendar, IconCheck, IconClock } from "./VisaParts";

const key = (value) => String(value || "normal").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "normal";
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const savedKey = (slug) => `tourvex.visa.${slug}`;

function CountryPicker({ label, value, onChange, error }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = ALL_COUNTRIES.find((item) => item.code === value);
  const items = ALL_COUNTRIES.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.code.toLowerCase().includes(query.toLowerCase()));
  return <div className="vb-country"><label>{label}</label><button type="button" className="vb-country-trigger" onClick={() => setOpen((v) => !v)}>{selected ? <><img src={selected.flag} alt="" /><span>{selected.name}</span></> : <span>Select {label.toLowerCase()}</span>}<b>⌄</b></button>
    {open && <div className="vb-country-menu"><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${label.toLowerCase()}`} /><div>{items.map((item) => <button type="button" key={item.code} onClick={() => { onChange(item.code); setOpen(false); setQuery(""); }}><img src={item.flag} alt="" /><span>{item.name}</span>{value === item.code && <IconCheck width="15" height="15" />}</button>)}</div></div>}{error && <small className="vb-error">{error}</small>}</div>;
}

export default function VisaBooking({ visa, open, onClose, onConfigured }) {
  const router = useRouter();
  const { user, ready, getAccessToken } = useApp();
  const api = useMemo(() => createBookingApi(getAccessToken), [getAccessToken]);
  const options = useMemo(() => visa.processingOptions?.length ? visa.processingOptions.filter((o) => o.enabled !== false) : [{ id: "normal", name: "Normal processing", estimatedTime: visa.processing, fee: null, benefits: [] }], [visa]);
  const [form, setForm] = useState({ nationality: "", residence: "", date: "", adults: 1, children: 0, minorAges: [] });
  const [configured, setConfigured] = useState(false);
  const [optionId, setOptionId] = useState(() => key(options[0]?.id));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(true);

  useEffect(() => {
    if (!open) return undefined;
    const y = window.scrollY;
    const previous = { position: document.body.style.position, top: document.body.style.top, width: document.body.style.width, overflow: document.documentElement.style.overflow };
    document.body.style.position = "fixed"; document.body.style.top = `-${y}px`; document.body.style.width = "100%"; document.documentElement.style.overflow = "hidden";
    return () => { document.body.style.position = previous.position; document.body.style.top = previous.top; document.body.style.width = previous.width; document.documentElement.style.overflow = previous.overflow; window.scrollTo(0, y); };
  }, [open]);

  useEffect(() => { try { const saved = JSON.parse(sessionStorage.getItem(savedKey(visa.slug)) || "null"); if (saved) { setForm(saved.form); setOptionId(saved.optionId); setConfigured(true); onConfigured?.(); } } catch {} }, [visa.slug, onConfigured]);
  const option = options.find((item) => key(item.id) === optionId) || options[0];
  const adultUnit = visa.adultPrice || visa.startingPrice;
  const minorUnit = visa.minorPrice || adultUnit;
  const currency = adultUnit?.currency || "AED";
  const processingFee = Number(option?.fee?.amount || 0);
  const service = Number(visa.serviceCharge?.amount || 0);
  const subtotal = Number(adultUnit?.amount || 0) * form.adults + Number(minorUnit?.amount || 0) * form.children + processingFee * (form.adults + form.children) + service;
  const money = (amount) => formatPrice(amount, currency);
  const eligibility = (visa.eligibleNationalities?.length && !visa.eligibleNationalities.includes(form.nationality)) || (visa.eligibleResidences?.length && !visa.eligibleResidences.includes(form.residence));

  const validate = () => { const next = {}; if (!form.nationality) next.nationality = "Select your nationality"; if (!form.residence) next.residence = "Select your country of residence"; if (!form.date) next.date = "Choose a travel date"; if (form.date && form.date < today()) next.date = "Travel date cannot be in the past"; if (form.adults + form.children < 1) next.travelers = "Add at least one traveler"; if (form.children !== form.minorAges.length || form.minorAges.some((age) => age === "" || age == null)) next.travelers = "Select the age of every minor"; setErrors(next); return !Object.keys(next).length; };
  const updateCount = (field, delta) => setForm((old) => { const value = Math.max(field === "adults" ? 0 : 0, old[field] + delta); const next = { ...old, [field]: value }; if (field === "children") next.minorAges = Array.from({ length: value }, (_, i) => old.minorAges[i] ?? ""); return next; });
  const complete = () => { if (!validate()) return; setConfigured(true); onConfigured?.(); onClose(); setNotice(eligibility ? "No visa option is available for this nationality or residence." : ""); };
  const payload = (bookingOnly = false) => ({ productType: "visa", productSlug: visa.slug, optionId: key(option?.id), date: form.date, adults: form.adults, children: form.children, minorAges: form.minorAges.map(Number), nationality: form.nationality, residence: form.residence, bookingOnly });
  const act = async (kind) => { if (!ready || !validate() || eligibility) return; const saved = { form, optionId }; sessionStorage.setItem(savedKey(visa.slug), JSON.stringify(saved)); if (!user) { router.push(loginUrlFor(currentPath(), "visa-booking")); return; } setBusy(kind); setNotice(""); try { await api.addItem(payload(kind === "pay")); if (kind === "pay") router.push("/checkout"); else setNotice("Visa package added to your cart."); } catch (e) { setNotice(errorMessage(e)); } finally { setBusy(""); } };

  return <>
    {open && <div className="vb-modal" role="dialog" aria-modal="true" aria-labelledby="vb-title"><button className="vb-scrim" onClick={onClose} aria-label="Close" /><div className="vb-dialog"><header><div><small>Visa application</small><h2 id="vb-title">Traveler information</h2></div><button type="button" onClick={onClose}>×</button></header><div className="vb-form"><CountryPicker label="Nationality" value={form.nationality} onChange={(nationality) => setForm((v) => ({ ...v, nationality }))} error={errors.nationality} /><CountryPicker label="Country of residence" value={form.residence} onChange={(residence) => setForm((v) => ({ ...v, residence }))} error={errors.residence} /><label className="vb-date"><span>Travel date</span><input type="date" min={today()} value={form.date} onChange={(e) => setForm((v) => ({ ...v, date: e.target.value }))} />{errors.date && <small className="vb-error">{errors.date}</small>}</label><fieldset><legend>Who is traveling?</legend>{[["adults", "Adults", "18 years and above"], ["children", "Minors", `Ages 0–${visa.minorMaxAge ?? 17}`]].map(([field, title, sub]) => <div className="vb-counter" key={field}><span><strong>{title}</strong><small>{sub}</small></span><div><button type="button" onClick={() => updateCount(field, -1)} disabled={form[field] <= 0}>−</button><b>{form[field]}</b><button type="button" onClick={() => updateCount(field, 1)}>+</button></div></div>)}{form.minorAges.map((age, index) => <label className="vb-age" key={index}><span>Minor {index + 1} age</span><select value={age} onChange={(e) => setForm((old) => ({ ...old, minorAges: old.minorAges.map((v, i) => i === index ? e.target.value : v) }))}><option value="">Select age</option>{Array.from({ length: (visa.minorMaxAge ?? 17) + 1 }, (_, value) => <option key={value} value={value}>{value} years</option>)}</select></label>)}{errors.travelers && <small className="vb-error">{errors.travelers}</small>}</fieldset></div><footer><button type="button" className="mk-btn" onClick={complete}>Continue</button></footer></div></div>}
    {configured && <section className="vb-results" aria-labelledby="vb-types"><div className="vb-types"><h2 id="vb-types">{visa.country} Visa Types</h2>{eligibility ? <div className="vb-unavailable"><h3>No eligible visa option found</h3><p>This package is not currently available for the selected nationality or country of residence.</p><button type="button" onClick={() => onClose(false) || null}>Modify search</button></div> : <article><h3>{visa.title}</h3><div className="vb-search-summary"><div><small>Your search</small><strong>{ALL_COUNTRIES.find((c) => c.code === form.nationality)?.name} · {ALL_COUNTRIES.find((c) => c.code === form.residence)?.name}</strong><span>{form.date} · {form.adults} adult{form.adults === 1 ? "" : "s"} · {form.children} minor{form.children === 1 ? "" : "s"}</span></div><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("visa-modify"))}>✎ Modify Search</button></div><h4>Select Processing Type</h4><div className="vb-options">{options.map((item) => <button type="button" key={item.id} className={key(item.id) === optionId ? "is-active" : ""} onClick={() => setOptionId(key(item.id))}><strong>{item.name}</strong><span><IconClock width="15" height="15" /> Estimated: {item.estimatedTime}</span><small>{item.fee?.amount ? `+ ${formatPrice(item.fee.amount, item.fee.currency || currency)}` : "Included"}</small></button>)}</div>{visa.visaExpertWhatsapp && <a className="vb-help" href={`https://wa.me/${visa.visaExpertWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">Need help with your visa? <strong>Talk to our visa expert on WhatsApp</strong></a>}</article>}</div>
      {!eligibility && <aside className="vb-summary"><div className="vb-summary-search"><span>{form.nationality} · {form.residence}</span><strong>{form.date} · {form.adults + form.children} travelers</strong></div><div className="vb-selected"><Flag code={visa.countryCode} /><div><h3>{visa.title}</h3><span>{form.adults} adults · {form.children} minors</span><span>{option?.name}</span></div></div><button className="vb-price-toggle" type="button" onClick={() => setDetailsOpen((v) => !v)}>Price Details <span>{detailsOpen ? "⌃" : "⌄"}</span></button>{detailsOpen && <div className="vb-price-lines">{form.adults > 0 && <p><span>Adult visa fee × {form.adults}</span><strong>{money(Number(adultUnit?.amount || 0) * form.adults)}</strong></p>}{form.children > 0 && <p><span>Minor visa fee × {form.children}</span><strong>{money(Number(minorUnit?.amount || 0) * form.children)}</strong></p>}{processingFee > 0 && <p><span>Processing fee</span><strong>{money(processingFee * (form.adults + form.children))}</strong></p>}{service > 0 && <p><span>Service charge</span><strong>{money(service)}</strong></p>}</div>}<div className="vb-total"><span>Total Payable</span><strong>{money(subtotal)}</strong></div><div className="vb-actions"><button type="button" className="mk-btn" disabled={!!busy} onClick={() => act("pay")}>{busy === "pay" ? "Please wait…" : "Proceed to Pay"}</button>{visa.allowAddToCart && <button type="button" disabled={!!busy} onClick={() => act("cart")}>{busy === "cart" ? "Adding…" : "Add to Cart"}</button>}</div>{notice && <p className="vb-notice" role="status">{notice}</p>}</aside>}</section>}
  </>;
}
