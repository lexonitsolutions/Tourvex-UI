import Link from "next/link";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = { title: "Privacy Policy — Karnish Tourism" };

export default function PrivacyPage() {
  return (
    <section className="mk-auth">
      <div className="mk-auth-card">
        <h1>Privacy Policy</h1>
        <p className="mk-auth-sub">
          Our privacy policy, covering how we use, keep and delete your personal data, is being finalised and will be published
          here before launch. Card details are handled by our payment provider and never pass through our servers.
        </p>
        <Link className="mk-btn" href="/contact">Questions? Contact us</Link>
      </div>
    </section>
  );
}
