# Admin motion and design system

Two stylesheets own this: `_ui/motion.css` (tokens, keyframes, component motion) and `_ui/polish.css` (type scale,
elevation, depth). Both are imported last from `app/admin/layout.js`, after `theme.css`. Colours still come only from
`theme.css`; nothing here hard-codes a surface colour.

## Motion tokens (`.adm-root`, also the portal host)

| Token | Value | Use |
| --- | --- | --- |
| `--adm-d-fast` | 120ms | hover, press, focus, exits |
| `--adm-d-base` | 200ms | menus, popovers, fades, toggles |
| `--adm-d-slow` | 320ms | dialogs, sheets, card lift, tab indicator |
| `--adm-d-page` | 420ms | route enter, dashboard cards |
| `--adm-e-std` | cubic-bezier(.2,0,0,1) | default |
| `--adm-e-emph` | cubic-bezier(.32,.72,0,1) | page, drawers, large moves |
| `--adm-e-in` | cubic-bezier(.4,0,1,1) | exit animations |
| `--adm-e-spring` | cubic-bezier(.34,1.56,.64,1) | overshoot, sparingly: switch thumb, check marks, empty icon, avatars |
| `--adm-stagger` | 48ms | step for the `--i` helper |
| `--adm-rise` | 10px | travel of fade-up |

Keyframes: `adm-fade-in/out`, `adm-fade-up`, `adm-scale-in/out`, `adm-slide-in/out-{right,left,bottom,top}`,
`adm-dialog-in/out`, `adm-pop-in/out`, `adm-shimmer`, `adm-pulse-ring`, `adm-float`, `adm-collapse-in/out`, `adm-draw`,
`adm-reveal-x`, `adm-grow-x/y`, `adm-sweep`.

Classes: `.adm-anim-fade-in`, `.adm-anim-fade-up`, `.adm-anim-scale-in`, `.adm-anim-slide-in-{right,left,bottom}`,
`.adm-stagger` (children get `--i` 0..9 from their position; override with `style="--i: n"`), `.adm-skel` (shimmer),
`.adm-pulse` (live dot ring), `.adm-collapse` (height through `grid-template-rows`), `.adm-dot`.

## Rules

1. Animate only `transform` and `opacity`. Allowed exceptions: `clip-path` and `grid-template-rows` (already used for the
   sidebar rail and submenus, chart reveal, collapsibles), and colour properties on small controls.
2. Never animate blurred `box-shadow`, `filter` or layout properties on large surfaces. Big panels (`.adm-bt`, the table card)
   change border colour on hover; only small tinted cards (`.adm-kc`, tiles, report cards) ease their lift shadow.
3. Entrance animations use `animation-fill-mode: backwards`, never `both`/`forwards`. A forwards-filled `transform: none`
   outranks `:hover { transform }` for the life of the element (this silently disabled the KPI card lift before).
4. No per-row JavaScript. Row hover is a CSS `background-color` transition on `tr`.
5. Reduced motion is opt-in per `app/lib/motionPolicy.js`: every block is keyed on `html[data-honor-reduced-motion]`
   inside `@media (prefers-reduced-motion: reduce)`. `motion.css` has a catch-all at the bottom.
6. `backdrop-filter` only on the 56px topbar.

## Where each piece lives

- Route/page enter: `app/admin/template.js` wraps the page in `.adm-page`, keyed on the pathname, so every route change
  replays it (including `/admin/bookings` to `/admin/bookings/orders`). Search-param changes do not. Children rise and fade
  in a 56ms stagger. `.adm-kcs`, `.adm-bento`, `.adm-reportcards` are excluded because their cards stagger themselves via `--i`.
  The sidebar and topbar are in the layout and never animate. View Transitions were not used: `<ViewTransition>` is not exported
  by the stable React 19.2 build in this repo (checked), so a template plus CSS is the stable path.
- Overlays: `_ui/components/*` use `.adm-ov` (backdrop), `.adm-dlg` (centred dialogs and the command palette),
  `.adm-sheet .adm-sheet--{side}` (drawers), `.adm-pop` (popover, dropdown, select, tooltip; origin from the Radix
  `--radix-*-transform-origin`, offset from `data-side`). All animate on `data-state` so exits play before unmount.
- Charts: `_kit/motion.js` exports `reveal` (a ref callback). It marks the element `data-reveal="pending"` and flips it to `"in"` the first
  time it is on screen (one shared IntersectionObserver). CSS then plays a clip reveal (`.adm-reveal-clip`: sparkline, area,
  line), bar growth (`.adm-reveal-x` hbars/funnel/finance, `.adm-reveal-y` BarChart), or a conic sweep (`.adm-reveal-sweep`: donut).
  Elements hidden by clip-path or mask are observed through their parent (IntersectionObserver reports clipped targets as hidden).
- Theme switch: `theme-store.js` adds `.adm-theming` to the theme root and the portal host for 420ms when the resolved theme
  changes (not on load). `motion.css` then cross-fades colours only. Normal interaction pays nothing.
- Tables: `DataTable` keys the `tbody` by phase (`skeleton`, `rows`, `empty`), so skeleton to content is a fade;
  the stale page dims while the next page loads (existing); the bulk bar rises in; the sort arrow is one icon rotated by
  `[data-sort="desc"]`.

## Adding motion to a new component

1. Enter on mount: add `.adm-anim-fade-up` (or `fade-in`, `scale-in`) and, in a list, `style={{ "--i": index }}`.
2. Hover/press: transition `transform`/`background-color` with `var(--adm-d-fast) var(--adm-e-std)`; press is `scale(.98)`.
3. Radix overlay: give the content `.adm-pop` (menus) or `.adm-dlg`/`.adm-sheet` (modals); do not add animate-in utilities.
4. Collapsing content: `.adm-collapse` on the Radix content with one inner child.
5. A chart or bar that should draw in: put `ref={reveal}` on the container and the `.adm-reveal-*` class on the animated node.
6. Check: `animation-fill-mode` is `backwards`, nothing but transform/opacity moves, and the reduced-motion catch-all still covers it.

## Design system

- Type: Geist Variable, tabular numerals everywhere (`font-feature-settings: "tnum"`), scale tokens `--adm-fs-*`
  (11.5 / 12.5 / 13.5 / 15 / 16 / 18 / 22 / 28 / 36), tracking `--adm-track-tight` (headings, display numbers), `--adm-track-head`, `--adm-track-caps`.
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 (`--adm-s1..s6`).
- Elevation (tokens `--adm-shadow-sm|md|lg|card|lift|table|pop`, `--adm-hl`, `--adm-card-edge`): light = layered soft
  navy shadows; dark = inner top highlight, hairline edge, faint teal glow on lift. Hero cards get a static top-left sheen
  (`--adm-sheen`); the page body has a static radial teal wash (`--adm-hero-glow`).
- Cards: 18px radius, hairline `--adm-card-edge`, `--adm-shadow-card`. Overlays: 20px dialogs, 12 to 16px menus, `--adm-overlay` surface.
- Icons: 18px nav, 16px in buttons, rounded caps/joins, stroke 1.8 to 2.
- Scrollbars: thin, token coloured. Selection: browser default (a `::selection` rule measurably slowed the 500-row table scroll). Focus: `--adm-ring` (2px offset + 2px teal).
