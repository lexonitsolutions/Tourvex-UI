// Stripe.js loader. The publishable key (safe to expose) comes from NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local.
// Without it, mock-mode checkout still works and stripe-mode shows a "not configured" state.
import { loadStripe } from "@stripe/stripe-js";

const KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
let promise;

export const stripeKeyPresent = Boolean(KEY);

export function getStripe() {
  if (!KEY) return null;
  promise ||= loadStripe(KEY);
  return promise;
}

export const STRIPE_APPEARANCE = {
  theme: "stripe",
  variables: {
    colorPrimary: "#2095ae",
    colorText: "#0f2454",
    colorDanger: "#b3261e",
    fontFamily: '"Barlow Semi Condensed", system-ui, sans-serif',
    fontSizeBase: "16px",
    borderRadius: "10px",
  },
};
