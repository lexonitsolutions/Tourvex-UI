import { SignUp } from "@clerk/nextjs";

export const metadata = { title: "Create account — Karnish Tourism" };

const NOTES = {
  wishlist: "Create a free account to save holidays to your wishlist. We will add the one you picked.",
};

export default async function SignUpPage({ searchParams }) {
  const params = (await searchParams) || {};
  const note = NOTES[params.reason];
  return (
    <section className="mk-auth mk-clerk">
      <div className="mk-clerk-wrap">
        {note && <p className="mk-clerk-note">{note}</p>}
        <SignUp />
      </div>
    </section>
  );
}
