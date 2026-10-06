// Tiny external store for the admin colour mode ("system" | "light" | "dark"). No provider is required to use it.
// Persisted in localStorage under STORAGE_KEY; applied as `data-adm-theme="light|dark"` on the layout wrapper [data-adm-themeroot] and the portal host (read by theme.css).
export const STORAGE_KEY = "tvx-admin-theme";
const MODES = ["system", "light", "dark"];
/** Master switch for page-level dark mode. ON: every admin screen is token-driven (see _ui/theme.css). Set false to pin the admin to light. */
export const DARK_UI_ENABLED = true;
const listeners = new Set();

/** Gallery/dev helper: enable page-level dark while mounted. Returns a cleanup. */
let dark_forced = false;
export function forceDarkUi() {
  dark_forced = true;
  applyTheme(getMode());
  return () => {
    dark_forced = false;
    applyTheme(getMode());
  };
}
let mq = null;

function readMode() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return MODES.includes(v) ? v : "system";
  } catch {
    return "system";
  }
}

export function resolve(mode) {
  if (mode === "light" || mode === "dark") return mode;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Elements carrying the theme attributes: the layout wrapper [data-adm-themeroot] and the portal host (#adm-ui-portal). */
export function themeTargets() {
  return document.querySelectorAll("[data-adm-themeroot], #adm-ui-portal");
}

export function applyTo(el, resolved) {
  el.setAttribute("data-adm-theme", resolved);
  if (DARK_UI_ENABLED || dark_forced) el.setAttribute("data-adm-dark", "");
  else el.removeAttribute("data-adm-dark");
}

/** Short colour cross-fade: .adm-theming (see _ui/motion.css) is on the theme targets only while the colours swap. */
let fadeTimer = 0;
function crossFade(targets) {
  targets.forEach((el) => el.classList.add("adm-theming"));
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => themeTargets().forEach((el) => el.classList.remove("adm-theming")), 420);
}

export function applyTheme(mode, animate = false) {
  const r = resolve(mode);
  const targets = themeTargets();
  if (animate && targets.length && targets[0].getAttribute("data-adm-theme") !== r) crossFade(targets);
  targets.forEach((el) => applyTo(el, r));
  return r;
}

function onSystemChange() {
  if (readMode() === "system") applyTheme("system", true);
  listeners.forEach((l) => l());
}

export function getMode() {
  return typeof window === "undefined" ? "system" : readMode();
}

export function setMode(mode) {
  if (!MODES.includes(mode)) return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {}
  applyTheme(mode, true);
  listeners.forEach((l) => l());
}

export function subscribe(cb) {
  listeners.add(cb);
  if (listeners.size === 1 && typeof window !== "undefined") {
    mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onSystemChange);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && mq) {
      mq.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onSystemChange);
      mq = null;
    }
  };
}

/** Inline, blocking script (string) that sets data-adm-theme before first paint. Keep it tiny and dependency free. */
export const NO_FLASH_SCRIPT = `(function(){try{var r=document.currentScript.parentElement;var m=localStorage.getItem("${STORAGE_KEY}");if(m!=="light"&&m!=="dark")m=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";r.setAttribute("data-adm-theme",m);if(${DARK_UI_ENABLED})r.setAttribute("data-adm-dark","")}catch(e){}})();`;
