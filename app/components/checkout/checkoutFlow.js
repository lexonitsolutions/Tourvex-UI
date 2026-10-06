// The five checkout steps and the rules that keep them in order.

export const STEPS = [
  { id: "cart", label: "Review Cart", href: "/checkout" },
  { id: "pickup", label: "Pick-up Location", href: "/checkout/pickup" },
  { id: "additional", label: "Additional Details", href: "/checkout/details" },
  { id: "customer", label: "Customer Details", href: "/checkout/customer" },
  { id: "payment", label: "Payment Confirmation", href: "/checkout/payment" },
];

export const stepIndexForPath = (pathname) => {
  const clean = (pathname || "").replace(/\/$/, "") || "/checkout";
  const i = STEPS.findIndex((s) => s.href === clean);
  return i < 0 ? 0 : i;
};

export const needsPickup = (cart) => cart.items.some((i) => i.option?.pickupRequired);

/** Which steps are finished. The pick-up step counts as finished (skipped) when no item needs one. */
export function stepDone(cart) {
  const pickupNeeded = needsPickup(cart);
  return {
    cart: cart.items.length > 0,
    pickup: !pickupNeeded || !!cart.steps.pickup,
    additional: !!cart.steps.additional,
    customer: !!cart.steps.customer,
    payment: false,
  };
}

/** The earliest step that still needs the visitor, or the payment step when everything before it is done. */
export function firstOpenStep(cart) {
  const done = stepDone(cart);
  const pickupNeeded = needsPickup(cart);
  const open = STEPS.findIndex((s) => s.id !== "payment" && !done[s.id] && !(s.id === "pickup" && !pickupNeeded));
  return open < 0 ? STEPS.length - 1 : open;
}

/** The step that follows `index`, skipping pick-up when it is not needed. */
export function nextStepHref(cart, index) {
  let n = index + 1;
  if (STEPS[n]?.id === "pickup" && !needsPickup(cart)) n += 1;
  return STEPS[Math.min(n, STEPS.length - 1)].href;
}

export function previousStepHref(cart, index) {
  let n = index - 1;
  if (STEPS[n]?.id === "pickup" && !needsPickup(cart)) n -= 1;
  return STEPS[Math.max(n, 0)].href;
}
