# TNC Lightbox — Campaign setup guide

A small popup ("lightbox") you can add to any Engaging Networks page. You control what it says,
when it appears, and how it looks — all from a few lines of config.

---

## Table of contents

- [How it works](#how-it-works)
- [Adding it to a page](#adding-it-to-a-page)
- [When it appears — the triggers](#when-it-appears--the-triggers)
- [Designs work with any trigger](#designs-work-with-any-trigger)
- [Linking the button to another page](#linking-the-button-to-another-page)
- [Design options](#design-options)
  - [Themes (the overall look)](#themes-the-overall-look)
  - [Eyebrow label](#eyebrow-label)
  - [One button (recommended)](#one-button-recommended)
  - [Image position](#image-position)
  - [Close button](#close-button)
- [How often it shows](#how-often-it-shows)
- [Real examples](#real-examples)
  - [Example 1: Exit-intent monthly-giving nudge (forest)](#example-1-exit-intent-monthly-giving-nudge-forest)
  - [Example 2: Time-delayed donation prompt (sky)](#example-2-time-delayed-donation-prompt-sky)
  - [Example 3: Scroll-triggered petition signup](#example-3-scroll-triggered-petition-signup)
- [FAQ](#faq)

---

## How it works

The lightbox is a small dialog that appears on top of the page. It never blocks the page from
loading and never interferes with an Engaging Networks donation form. You configure it once, paste
two snippets onto your page, and it handles the rest — waits for the trigger you set, respects a
"don't nag" frequency, and remembers when someone has already seen it.

## Adding it to a page

Two things go on the page: a **config block** (your settings) and a **script tag** (the code that
runs it). Place them anywhere — the `<head>` or before `</body>` both work.

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

The config must be set **before or at the same time** as the script tag. The popup does **not**
appear immediately — it waits for the trigger you configure.

---

## When it appears — the triggers

You choose what makes the popup show up. You can use one trigger or combine several
("first one to fire wins").

| Trigger | What it does | Good for |
|---|---|---|
| `time` | Appears after a set number of seconds | Letting people read the page first, then showing a prompt |
| `scroll` | Appears when the visitor has scrolled a certain percentage down the page | Catching engaged readers who are already interested |
| `inactivity` | Appears after a few seconds of mouse/touch inactivity | Getting attention from someone who stopped interacting |
| `exitIntent` | Appears when the mouse moves toward the browser's close button or address bar — **desktop only** | A last chance before someone leaves |

### Combine triggers — first one wins

```javascript
window.ENLightbox = {
  header: "Before you go",
  body: "Will you sign the petition to protect our rivers?",
  cta: { label: "Sign now", action: "close" },
  dismissLabel: "Not now",
  triggers: {
    frequencyDays: 7,
    list: [
      { type: "time", delayMs: 30000 },   // 30 seconds
      { type: "exit-intent" },              // or when mouse leaves
    ],
  },
};
```

Whichever trigger fires first opens the popup, and the others are cancelled.

## Designs work with any trigger

The **look** (theme, layout, colors) and the **trigger** are independent. You can use any design
with any trigger — a gentle forest-themed popup on a timer, a bright sky-themed popup on exit,
a dark popup on scroll. Nothing is locked together.

---

## Linking the button to another page

The button in the popup can either **navigate to a new page** (like a donation form) or **just
close** the popup.

```javascript
// Navigate to a donation page
cta: { label: "Donate monthly", href: "https://support.nature.org/…", action: "redirect" }

// Just close the popup (no page navigation)
cta: { label: "Got it", action: "close" }
```

When you provide an `href` and set `action: "redirect"`, the button becomes a real link — visitors
can middle-click, right-click, or open it in a new tab like any normal link. If you leave out
`action` entirely but include an `href`, it defaults to `"redirect"`.

This works on every version of the popup, including the exit-intent one.

---

## Design options

### Themes (the overall look)

Five preset themes — **forest** and **sky** match the mockups you've seen, alongside `light`, `dark`, and `brand`. All five use the same campaign-style 50/50 layout (half image, half content). You control which side the image sits on with `imagePosition` (see below) — the theme does not fix it. As a convention, `forest` pairs with the image on the right and `sky` with the image on the left to match the mockups.

| Theme | What it looks like |
|---|---|
| **`forest`** | Deep green panel (`#006537`), white body text, a white button with green text, and a square green × close button over the image. Centered, bold campaign text. (Pair with `imagePosition: "right"`.) |
| **`sky`** | Light blue panel (`#8DBBDC`), near-black text (`#191919`), a black button with white text, and a plain black × close icon (no box) over the content. Centered, bold campaign text. (Pair with `imagePosition: "left"`.) |
| `light` | Clean white panel, dark text, blue button — a simple default. |
| `dark` | Dark gray panel, light text, a white button with dark text — good for low-light pages. |
| `brand` | TNC green (`#003d24`) panel, white text, green button — the classic TNC look. |

On wide screens the modal is about 835×475px; below about 700px the two halves stack vertically and the modal shrinks to fit. When stacked, the **image always appears on top** (regardless of your `imagePosition` setting — the desktop side-by-side order is left alone), and the **close × always has a visible backing** so it stays readable over the image. By default the image still shows on mobile — set `hideImageOnMobile: true` to hide it. Every theme's colors can be tweaked individually — just add a `colors` block:

```javascript
theme: { preset: "forest", colors: { ctaBg: "#004d2e" } }
```

### Eyebrow label

An optional small uppercase label that sits above the headline. Use it to add urgency or context.

```javascript
eyebrow: "Limited time"
```

Rendered as: **LIMITED TIME** (small, uppercase, bold) above the main heading.

### One button (recommended)

For the forest and sky themes, we recommend using a single call-to-action button and no secondary
link — it keeps the design clean and focused. Just set `cta` and leave out `secondaryCta` and
`dismissLabel`.

```javascript
cta: { label: "Donate monthly", action: "close" }
// No secondaryCta, no dismissLabel
```

### Image position

Control where the image sits relative to the text.

```javascript
layout: { imagePosition: "left" }   // image on the left (default)
layout: { imagePosition: "right" }  // image on the right
layout: { imagePosition: "top" }    // image above the text
```

This sets the image side for **every** theme (the theme does not fix the column
order). As a convention, `forest` looks best with `imagePosition: "right"`
(content left / image right) and `sky` with `imagePosition: "left"` (image left /
content right), matching the mockups — but you can use any position with any
theme.

### Close button

The close button (×) is larger and easier to see — 44×44 pixels with a
contrasting round backing so it's visible over photographs and colored panels
(`light`/`dark`/`brand`). The `forest` and `sky` campaign themes have their own
close × instead: `forest` uses a square green button with a white × over the
image; `sky` uses a plain black × with no backing box over the content panel.
On mobile (below ~700px) every theme's close × keeps a visible backing — `sky`
gains a semi-opaque dark backing with a white × so it stays readable over the
stacked image.

Control its position:

```javascript
layout: { closeButton: "inside" }   // top-right corner of the dialog (default)
layout: { closeButton: "outside" }  // above the dialog, not clipped
layout: { closeButton: "none" }     // no close button (rely on CTA, ESC, or backdrop click)
```

---

## How often it shows

Set `triggers.frequencyDays` to control how often the same visitor sees the popup on the same page.

```javascript
triggers: { frequencyDays: 7 }   // show at most once per week (default)
triggers: { frequencyDays: 0 }   // show on every page load
```

The popup remembers using `localStorage` — even if someone refreshes the page, they won't see it
again until the window has passed.

---

## Real examples

### Example 1: Exit-intent monthly-giving nudge (forest)

A last-chance popup that appears when someone tries to leave. Uses the forest theme with the
image on the right (`imagePosition: "right"`). A single button closes the popup (no page
navigation).

```html
<script>
  window.ENLightbox = {
    eyebrow: "Last chance",
    header: "Don't go yet",
    body: "Your monthly gift protects forests, rivers, and wildlife year-round.",
    image: { src: "/img/forest-hero.jpg", alt: "Forest landscape" },
    cta: { label: "Give monthly", action: "close" },
    theme: { preset: "forest" },
    layout: { imagePosition: "right" },
    triggers: {
      frequencyDays: 14,
      list: [{ type: "exit-intent" }],
    },
  };
</script>
<script src="https://en-assets.tnc.org/en-lightbox.js?v=1.0.0" async></script>
```

### Example 2: Time-delayed donation prompt (sky)

Appears after 15 seconds — enough time to read the page. The button links directly to the donation
form. Uses the sky theme with the image on the left (`imagePosition: "left"`).

```html
<script>
  window.ENLightbox = {
    eyebrow: "Matching gift",
    header: "Double your impact",
    body: "Every dollar donated today is matched through midnight. Don't miss this chance.",
    image: { src: "/img/matching-gift.jpg", alt: "Matching gift" },
    cta: {
      label: "Donate now",
      href: "https://support.nature.org/donate",
      action: "redirect",
    },
    theme: { preset: "sky" },
    layout: { imagePosition: "left" },
    triggers: {
      frequencyDays: 7,
      list: [{ type: "time", delayMs: 15000 }],
    },
  };
</script>
<script src="https://en-assets.tnc.org/en-lightbox.js?v=1.0.0" async></script>
```

### Example 3: Scroll-triggered petition signup

Appears after the visitor has scrolled 60% down the page — they're already engaged. Links to the
petition section. Light theme, image on top, close button placed outside the dialog.

```html
<script>
  window.ENLightbox = {
    header: "Add your voice",
    body: "Tell your representatives to protect clean water for generations to come.",
    image: { src: "/img/river.jpg", alt: "Clean river" },
    cta: {
      label: "Sign the petition",
      href: "#petition",
      action: "redirect",
    },
    dismissLabel: "Not right now",
    layout: { imagePosition: "top", closeButton: "outside" },
    triggers: {
      frequencyDays: 30,
      list: [{ type: "scroll", percent: 60 }],
    },
  };
</script>
<script src="https://en-assets.tnc.org/en-lightbox.js?v=1.0.0" async></script>
```

---

## FAQ

**Can the button link to another page?**

Yes. Add an `href` to the `cta` object and set `action: "redirect"`. The button becomes a real
link — it navigates normally, and visitors can middle-click or right-click it. This works on all
trigger types, including exit-intent. It's most useful on time-delayed and scroll-triggered popups.

```javascript
cta: { label: "Donate monthly", href: "https://support.nature.org/…", action: "redirect" }
```

**Can we use any design with any trigger?**

Yes. The theme, layout, and image position are completely independent of the trigger. Any design
pairs with any trigger.

**Can we record a click or exit into an Engaging Networks reference field for A/B testing?**

Not yet — this is on the roadmap as a planned future enhancement. Today the popup doesn't write
to any Engaging Networks fields. It's purely a visual tool that records only the "don't show again"
timing (in the visitor's browser storage).

**Can the close button be bigger / easier to see?**

Yes. For `light`/`dark`/`brand` it's 44×44 pixels with a contrasting round backing — significantly
larger than a standard close button — and it stays visible over photographs and colored backgrounds.
The `forest` and `sky` campaign themes use their own close × instead (a square green button for
forest, a plain black × for sky). You can place it inside the dialog, outside the dialog, or remove
it entirely.

**Can visitors on mobile or tablet use it?**

Yes. The popup works on desktop, tablet, and mobile. On small screens the two halves stack
— with the image always on top (whatever your `imagePosition`) and the close × always
carrying a visible backing so it reads over the image. The image shows by default; set
`hideImageOnMobile: true` to hide it. The only exception is the exit-intent trigger,
which is desktop-only (mobile browsers don't have a mouse cursor to
detect).

**Does the popup block the donation form?**

No. The popup is a non-blocking overlay. It never touches or interferes with any Engaging Networks
form on the page. If an error occurs while opening, it simply doesn't open — the page keeps working
normally.

**How do I update the popup across multiple pages?**

Each page has its own copy of the config snippet. To make a change, edit the `window.ENLightbox`
block on each page where it appears. Search your Engaging Networks pages for
`en-lightbox.js` to find all the pages that currently use it.
