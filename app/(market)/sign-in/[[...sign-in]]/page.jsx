import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Log in — Karnish Tourism" };

const NOTES = {
  wishlist: "Log in to save holidays to your wishlist. We will add the one you picked.",
  checkout: "Log in to continue to checkout. Your cart will be waiting.",
};

export default async function SignInPage({ searchParams }) {
  const params = (await searchParams) || {};
  const note = NOTES[params.reason];
  return (
    <section className="mk-auth mk-clerk">
      <div className="mk-clerk-wrap">
        {note && <p className="mk-clerk-note">{note}</p>}
        <SignIn />
      </div>
    </section>
  );
}
