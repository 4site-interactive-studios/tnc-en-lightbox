# tnc-en-lightbox — Editor & advanced-customization guide

This guide is for the page editor or campaign developer who configures the lightbox on an Engaging Networks page. It is the companion to the developer README at [`README.md`](./README.md).

## How the lightbox is loaded

On each page where the lightbox should appear, the page editor sets a global config object and then loads the built script:

```html
<script>
  window.ENLightbox = {
    header: "Join the fight",
    body: "Add your voice to protect the lands and waters we all rely on.",
    cta: { label: "Sign now", href: "#petition", action: "redirect" },
  };
</script>
<script src="https://en-assets.tnc.org/en-lightbox.js?v=1.0.0" async></script>
```

`window.ENLightbox` must be set **before or alongside** the script. The script auto-instantiates from it when it loads. It **does not open automatically** — it waits for the configured trigger (or an explicit `ENLightboxAPI.open()` call).

### Loading order and deferred init

If the script runs while the document is still parsing (`document.readyState === "loading"`) and `window.ENLightbox` has not been set yet, auto-init is deferred **once** until the `DOMContentLoaded` event, at which point `window.ENLightbox` is re-read. This means placing the script in `<head>` ahead of the config still works — there is no polling loop, and a config declared later in the page is picked up.

The script is **load-once**: a sentinel (`globalThis.__ENLightboxLoaded`) ensures that if the script is evaluated a second time (e.g. accidentally included twice), it is a no-op — no re-init, no destroy, no re-arm of triggers.

For programmatic control, the library exposes `window.ENLightboxAPI`:

```js
ENLightboxAPI.open()   // open manually (honors the dismissal frequency cap)
ENLightboxAPI.close()  // close manually
ENLightboxAPI.getInstance() // the current Lightbox instance, or null
```

## Config schema

Every field is optional. Defaults are applied during normalization, so partial or invalid configs degrade gracefully and never throw on the host page. A wrong-typed field (e.g. `image` set to a string, `cta` set to a number, `triggers` set to a non-object, or `image.src` missing/non-string) degrades to its default rather than throwing, so a hand-authored config with a typo cannot disrupt the host page (including any Engaging Networks donation form). If a render error does occur while opening, the lightbox fails closed (never opens a broken overlay) and a later valid `open()` still works.

```ts
interface ENLightboxConfig {
  // ── CONTENT ─────────────────────────────────────
  header?: string          // Dialog title (default: '')
  eyebrow?: string         // Small uppercase label rendered above the title (default: '')
  body?: string            // Plain text body (default: '')
  image?: { src: string; alt?: string } // Omit for a single-column layout
  cta?: {                  // Primary call to action
    label: string
    href?: string          // Destination URL for redirect CTAs
    action?: "redirect" | "close" // default: href ? "redirect" : "close"
  }
  secondaryCta?: {         // Secondary / decline-style CTA
    label: string
    href?: string
    action?: "redirect" | "close" // default: href ? "redirect" : "close"
  }
  dismissLabel?: string    // Shorthand decline button; always action: "close"

  // ── BEHAVIOR: close paths ───────────────────────
  closeOnOverlay?: boolean // click the backdrop to close (default: true)
  closeOnEsc?: boolean     // press Escape to close (default: true)
  hideImageOnMobile?: boolean // hide the image column on small screens (default: true)

  // ── BEHAVIOR: triggers ──────────────────────────
  triggers?: {
    frequencyDays?: number  // days before re-show on the same page (default: 7; 0 = every load)
    time?: number           // open after N milliseconds
    scroll?: number         // open after scrolling N% of the page
    inactivity?: number     // open after N milliseconds of inactivity
    exitIntent?: boolean    // open on mouse leaving the viewport (desktop only)
    list?: Array<{          // explicit trigger list; preferred for composition
      type: "time" | "scroll" | "inactivity" | "exit-intent"
      delayMs?: number
      percent?: number
      idleMs?: number
    }>
  }

  // ── PRESENTATION: layout ────────────────────────
  layout?: {
    variant?: "two-column" // default: "two-column"; image absent ⇒ single-column
    imagePosition?: "left" | "right" | "top" // default: "left"
    imageRatio?: string     // default: "40%"
    hideImageOnMobile?: boolean // overrides the top-level flag when set
    closeButton?: "inside" | "outside" | "none" // default: "inside"
  }

  // ── PRESENTATION: theme ─────────────────────────
  theme?: {
    preset?: "light" | "dark" | "brand" | "forest" | "sky" // default: "light"
    colors?: {
      overlay?: string
      surface?: string
      text?: string
      title?: string
      ctaBg?: string
      ctaText?: string
      secondaryCtaBg?: string
      secondaryCtaText?: string
      border?: string
    }
    radius?: string         // CSS value for border radius
    maxWidth?: string       // CSS value for the dialog max-width
    fontFamily?: string     // CSS value for the font family
    // customCss is planned for a future wave and is not available yet.
  }
}
```

## CTA routing

`cta.action` is the single source of truth for what happens when a CTA is activated:

- `"redirect"` (or a CTA with an `href` and no explicit action) renders as a native `<a href>` and lets the browser navigate. Middle-click / ⌘-click / copy-link work as expected.
- `"close"` (or a CTA with no `href` and no explicit action) renders as a `<button>` and closes the lightbox, recording dismissal so the frequency cap applies.

`secondaryCta` follows the same rules. `dismissLabel` is always a close button.

## Dismissal frequency

The lightbox records a timestamp in `localStorage` keyed by `location.pathname` when it is shown or dismissed. It will not re-arm on that page until `frequencyDays` have elapsed.

- `frequencyDays: 7` (default) — show at most once per week on this page.
- `frequencyDays: 0` — show on every page load.

If `localStorage` is unavailable (e.g., private mode), the library fails open: it treats the page as eligible and never throws.

## Examples

### Basic single-column lightbox

```html
<script>
  window.ENLightbox = {
    header: "Stay in the loop",
    body: "Get the latest conservation news delivered to your inbox.",
    cta: { label: "Subscribe", href: "#subscribe", action: "redirect" },
    dismissLabel: "No thanks",
  };
</script>
```

### Themed two-column lightbox

```html
<script>
  window.ENLightbox = {
    header: "Double your impact",
    body: "Every dollar donated today is matched through midnight.",
    image: { src: "/img/match.jpg", alt: "Matching gift" },
    cta: { label: "Donate now", href: "#donate", action: "redirect" },
    secondaryCta: { label: "Learn more", href: "/matching-gift", action: "redirect" },
    theme: { preset: "brand", colors: { ctaBg: "#006341" } },
    layout: { imagePosition: "left" },
  };
</script>
```

### Eyebrow + forest preset (mockup-faithful look)

The `eyebrow` is a small uppercase label rendered above the title. The `forest`
and `sky` presets apply the client mockup treatment — a deep-green or light-blue
surface with a centered content block — from `theme.preset` alone. They pair
naturally with a specific image side (forest → `imagePosition: "right"`,
sky → `imagePosition: "left"`), but the image side is a separate `layout`
choice and is not forced by the theme. The client typically uses a single CTA;
when a `secondaryCta`/`dismissLabel` is present under `forest`/`sky` it renders
as an underlined italic text link.

```html
<script>
  window.ENLightbox = {
    eyebrow: "Last chance",
    header: "Don't go yet",
    body: "Add your voice while you're here.",
    image: { src: "/img/forest.jpg", alt: "Forest" },
    cta: { label: "Sign the petition", href: "#petition", action: "redirect" },
    theme: { preset: "forest" },
    layout: { imagePosition: "right" },
  };
</script>
```

`sky` is the same shape with `theme: { preset: "sky" }` and
`layout: { imagePosition: "left" }`. All preset colors are starting points and
are fully overridable via `theme.colors`.

### Multi-trigger behavior

```html
<script>
  window.ENLightbox = {
    header: "Before you go",
    body: "Will you sign the petition to protect our rivers?",
    cta: { label: "Sign now", action: "close" },
    dismissLabel: "Not now",
    triggers: {
      frequencyDays: 7,
      list: [
        { type: "time", delayMs: 30000 },
        { type: "exit-intent" },
      ],
    },
  };
</script>
```

The first trigger to fire wins; the others are torn down after opening.

## Hosting the built artifact

The built file is committed at `dist/en-lightbox.js`. It is a single, self-contained, dependency-free IIFE with all CSS inlined. Distribution follows a two-step process:

1. **GitHub Release** — each tagged release publishes the versioned `dist/en-lightbox.js` as a release asset. This is the source-of-truth artifact.
2. **Manual upload to the EN asset library** — the editor downloads the versioned `dist/en-lightbox.js` from the latest GitHub Release and uploads it to the Engaging Networks asset library, then references the EN-hosted URL.

### Per-release update workflow

```html
<script src="https://en-assets.example.com/en-lightbox.js?v=1.2.3" async></script>
```

- Append `?v=VERSION` as a cache-busting query parameter when deploying a new version.
- The library itself has no runtime resources to cache-bust; the versioned query is solely for the host page's CDN/browser cache.
- If the EN asset library supports versioned filenames, prefer naming the uploaded file `en-lightbox-v1.2.3.js` and referencing it directly. Otherwise, use `?v=`.

### Updating across pages

Because each EN page embeds the script independently, updating the lightbox version requires editing every page that includes it. Search across your EN pages for `<script src="...en-lightbox.js"` to find all embed locations. When deploying a new release, update each embed to the new EN-hosted URL or query-parameter version.

## Advanced customization notes

- **Style isolation (Shadow DOM).** The lightbox renders inside an open Shadow DOM
  root. Host-page CSS cannot cascade into the lightbox and lightbox CSS cannot leak
  out — the dialog looks correct with zero host CSS. A `:host` reset neutralizes
  inherited properties (font, color, line-height) so the host page's styles never
  bleed across the shadow boundary. Customize the look exclusively through the
  documented theme token surface (`colors`, `radius`, `maxWidth`, `fontFamily`);
  host-page stylesheets have no effect on the lightbox.
- **Layout is construct-time only.** Changing `layout` requires re-initializing the lightbox.
- **Close button.** The × is a ≥44×44px rounded button with a contrasting backing
  so it stays visible over photographs and surface colors across every theme.
  `layout.closeButton` controls placement: `"inside"` (default, top-right of the
  dialog), `"outside"` (sits above the dialog, not clipped), or `"none"` (no close
  button — rely on the CTA, ESC, or overlay click). The backing and focus-ring
  colors are themed via internal tokens; you do not configure them directly.
- **Theme is runtime-settable.** `ENLightboxAPI.setTheme({ preset: "dark" })` re-applies the theme to an open lightbox.
- **Custom CSS injection** (`theme.customCss`) is planned for a future wave and is not yet available. Use the theme token surface (`colors`, `radius`, `maxWidth`, `fontFamily`) for customization now.
- **No page detection.** The library does not detect Engaging Networks page type or page ID. Show the lightbox only on the pages where you place `window.ENLightbox`.
