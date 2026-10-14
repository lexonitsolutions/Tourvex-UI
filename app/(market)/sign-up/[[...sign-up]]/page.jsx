import { SignUp } from "@clerk/nextjs";
import AuthShell from "../../../components/AuthShell";
import "../../../auth.css";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = { title: "Create account — Karnish Tourism" };

const NOTES = {
  wishlist: "Create a free account to save holidays to your wishlist. We will add the one you picked.",
};

export default async function SignUpPage({ searchParams }) {
  const params = (await searchParams) || {};
  const note = NOTES[params.reason];
  return (
    <AuthShell mode="signup" note={note}>
      <SignUp />
    </AuthShell>
  );
}
