import Link from "next/link";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
