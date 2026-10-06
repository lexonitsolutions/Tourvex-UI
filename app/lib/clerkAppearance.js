// Clerk components (sign-in, sign-up, user menu) themed to match the Karnish site.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#2095AE",
    colorText: "#0f2454",
    colorTextSecondary: "#5e6282",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#0f2454",
    colorDanger: "#b3261e",
    fontFamily: '"Barlow Semi Condensed", system-ui, sans-serif',
    fontSize: "16px",
    borderRadius: "12px",
  },
  elements: {
    card: { boxShadow: "0 12px 32px rgba(15, 36, 84, 0.08)", border: "1px solid #e4e8ee" },
    headerTitle: { fontFamily: '"Barlow Condensed", system-ui, sans-serif', fontSize: "30px", textTransform: "none", letterSpacing: "normal" },
    formButtonPrimary: { fontWeight: 700, fontSize: "16px", textTransform: "none" },
  },
};
