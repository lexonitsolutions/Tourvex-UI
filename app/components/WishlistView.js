"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "../lib/api";
import { useApp } from "./AppProvider";
import PackageCartButton from "./PackageCartButton";

const LABELS = { activity: "Activities", visa: "Visas", yacht: "Yachts", holiday: "Holidays", cruise: "Cruises" };
const hrefOf = (item) => `/${item.productType === "activity" ? "activities" : `${item.productType}s`}/${encodeURIComponent(item.productSlug)}`;

function SignInPrompt() {
  return <div className="mk-pg-card mk-pg-center"><h2>Sign in to see your wishlist</h2><p>Your saved packages are securely linked to your account and available on every device.</p><div className="mk-pg-actions"><Link className="mk-btn" href="/sign-in?redirect_url=%2Fwishlist&reason=wishlist">Log in</Link><Link className="mk-btn mk-btn-ghost" href="/sign-up?redirect_url=%2Fwishlist&reason=wishlist">Create account</Link></div></div>;
}

function WishlistCard({ item }) {
  const { toggleWishlist } = useApp();
  const [busy, setBusy] = useState(false);
  const product = item.product;
  const href = hrefOf(item);
  const remove = async () => { setBusy(true); try { await toggleWishlist(item.productType, item.productSlug); } finally { setBusy(false); } };
  if (!item.available || !product) return <article className="mk-wl-card mk-wl-gone"><div className="mk-wl-body"><h3>Package unavailable</h3><span className="mk-wl-meta">This package is no longer published.</span></div><button type="button" className="mk-btn mk-btn-ghost" disabled={busy} onClick={remove}>Remove</button></article>;
  return (
    <article className="mk-wl-card">
      {product.image && <img src={product.image} alt="" loading="lazy" />}
      <div className="mk-wl-body">
        <span className="mk-wl-meta">{LABELS[item.productType]}</span>
        <h3><Link href={href}>{product.title}</Link></h3>
        {product.price && <strong>{formatPrice(product.price.amount, product.price.currency || "AED")}</strong>}
        <div className="mk-pg-actions">
          <Link className="mk-btn mk-btn-ghost" href={href}>View details</Link>
          {product.allowAddToCart && !product.soldOut && <PackageCartButton item={{ ...product, allowAddToCart: true }} type={item.productType} />}
          {["holiday", "cruise"].includes(item.productType) && <Link className="mk-btn" href={href}>Get Quote</Link>}
          <button type="button" className="mk-pg-linkbtn" disabled={busy} onClick={remove}>{busy ? "Removing…" : "Remove"}</button>
        </div>
      </div>
    </article>
  );
}

export default function WishlistView() {
  const { user, ready, wishlist } = useApp();
  if (ready && !user) return <section className="mk-container mk-pg"><h1 className="mk-pg-title">Wishlist</h1><SignInPrompt /></section>;
  if (!ready || !wishlist.ready) return <section className="mk-container mk-pg"><h1 className="mk-pg-title">Wishlist</h1><p aria-busy="true">Loading your saved packages…</p></section>;
  const groups = wishlist.items.reduce((result, item) => { (result[item.productType] ||= []).push(item); return result; }, {});
  return (
    <section className="mk-container mk-pg">
      <h1 className="mk-pg-title">Wishlist <small>{wishlist.items.length} {wishlist.items.length === 1 ? "item" : "items"}</small></h1>
      {!wishlist.items.length ? <div className="mk-pg-card mk-pg-center"><h2>Your wishlist is empty</h2><p>Use the heart on a package to save it here.</p><Link className="mk-btn" href="/">Explore packages</Link></div> : Object.entries(groups).map(([type, items]) => <section className="mk-wl-group" key={type}><h2>{LABELS[type] || type} <small>{items.length}</small></h2><div className="mk-wl-grid">{items.map((item) => <WishlistCard key={`${type}:${item.productSlug}`} item={item} />)}</div></section>)}
    </section>
  );
}
