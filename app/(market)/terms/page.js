import Link from "next/link";

export const metadata = { title: "Terms & Conditions — Karnish Tourism" };

export default function TermsPage() {
  return (
    <section className="mk-auth">
      <div className="mk-auth-card">
        <h1>Terms &amp; Conditions</h1>
        <p className="mk-auth-sub">
          Our booking terms, cancellation rules and refund policy are being finalised with our legal team and will be published
          here before launch. Each booking already shows its own cancellation policy before you pay.
        </p>
        <Link className="mk-btn" href="/contact">Questions? Contact us</Link>
      </div>
    </section>
  );
}
