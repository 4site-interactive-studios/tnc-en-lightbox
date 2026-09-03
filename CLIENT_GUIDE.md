# TNC Lightbox — Campaign setup guide

A small popup ("lightbox") you can add to any Engaging Networks page. You control what it says,
when it appears, and how it looks — all from a few lines of config.

---

## Table of contents

- [Live demo pages](#live-demo-pages)
  - [1. Forest, exit intent, one button that closes](#1-forest-exit-intent-one-button-that-closes)
  - [2. Sky, five-second delay, button to donation](#2-sky-five-second-delay-button-to-donation)
  - [3. Forest, scroll or inactivity, button to membership](#3-forest-scroll-or-inactivity-button-to-membership)
  - [4. Sky, time or exit intent, with a decline link](#4-sky-time-or-exit-intent-with-a-decline-link)
  - [5. Forest, scroll, custom color, image on top](#5-forest-scroll-custom-color-image-on-top)
  - [6. Dark, inactivity, no close button](#6-dark-inactivity-no-close-button)
  - [7. Sky, exit intent, donation redirect with outcome tracking](#7-sky-exit-intent-donation-redirect-with-outcome-tracking)
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
- [Analytics tracking](#analytics-tracking)
- [Optional diagnostics](#optional-diagnostics)
- [Real examples](#real-examples)
  - [Example 1: Exit-intent monthly-giving nudge (forest)](#example-1-exit-intent-monthly-giving-nudge-forest)
  - [Example 2: Time-delayed donation prompt (sky)](#example-2-time-delayed-donation-prompt-sky)
  - [Example 3: Scroll-triggered petition signup](#example-3-scroll-triggered-petition-signup)
  - [Example 4: Exit-intent redirect to a donation form (records the outcome on both pages)](#example-4-exit-intent-redirect-to-a-donation-form-records-the-outcome-on-both-pages)
- [FAQ](#faq)

---

## Live demo pages

These pages are live in Engaging Networks demo mode, so open one to see the behaviour for yourself. Each page includes its settings block so you can copy it as a starting point. All seven use `frequencyDays: 0`, so the popup appears on every visit; this is a testing setting, and the normal default is 7 days.

| # | Look | When it appears | Button | Also shows | Page |
|---|---|---|---|---|---|
| 1 | Forest, image right | Exit intent on desktop | `Give monthly` closes the popup | `Last chance` eyebrow | [Open page 1](https://preserve.nature.org/page/194392/action/1?mode=DEMO&locale=en-US) |
| 2 | Sky, image left | After 5 seconds | `Donate now` goes to the donation page | `Matching gift` eyebrow | [Open page 2](https://preserve.nature.org/page/194390/action/1?mode=DEMO&locale=en-US) |
| 3 | Forest, image right | After 50% scroll or 20 seconds of inactivity | `Become a member` goes to the membership page | `Limited time` eyebrow; close button outside | [Open page 3](https://preserve.nature.org/page/194391/donate/1?mode=DEMO&locale=en-US) |
| 4 | Sky, image right | After 30 seconds or exit intent on desktop | `Give today` goes to the donation page | `Before you go` eyebrow; `No thanks` link | [Open page 4](https://preserve.nature.org/page/194707/action/1?mode=DEMO&locale=en-US) |
| 5 | Forest, image on top | After scrolling | See the page | Custom color; eyebrow | [Open page 5](https://preserve.nature.org/page/194708/donate/1?mode=DEMO&locale=en-US) |
| 6 | Dark, image left | After 10 seconds of inactivity | `Subscribe` goes to the signup page | `Don't miss this` eyebrow; no close button; image hidden on phones | [Open page 6](https://preserve.nature.org/page/194709/action/1?mode=DEMO&locale=en-US) |
| 7 | Sky, image left | Exit intent on desktop | `Give now` goes to donation page 199477 | `Matching gift` eyebrow; `No thanks` link; outcome field `en_txn10` | [Open page 7](https://preserve.nature.org/page/199476/action/1?mode=DEMO&locale=en-US) |

### 1. Forest, exit intent, one button that closes

- Move the mouse toward the browser close button or address bar on a desktop to trigger the popup.
- The main `Give monthly` button closes the popup without navigating. It still counts as accepted.
- The forest design puts the image on the right and shows the `Last chance` eyebrow.

[Open live demo page 1](https://preserve.nature.org/page/194392/action/1?mode=DEMO&locale=en-US)

```javascript
window.ENLightbox = {
  eyebrow: "Last chance",
  header: "Don't go yet",
  body: "Your monthly gift protects forests, rivers, and wildlife year-round.",
  image: { src: "https://natureconservancy-h.assetsadobe.com/is/image/content/dam/tnc/nature/en/photos/i/l/IL_MRCC181025_D524_square.jpg?wid=1000&hei=600&fit=crop", alt: "Forest landscape" },
  cta: { label: "Give monthly", action: "close" },
  theme: { preset: "forest" },
  layout: { imagePosition: "right" },
  triggers: { frequencyDays: 0, list: [{ type: "exit-intent" }] },
};
```

### 2. Sky, five-second delay, button to donation

- Wait five seconds for the popup to appear.
- The `Donate now` button goes to the donation page.
- The sky design puts the image on the left and shows the `Matching gift` eyebrow.

[Open live demo page 2](https://preserve.nature.org/page/194390/action/1?mode=DEMO&locale=en-US)

```javascript
window.ENLightbox = {
  eyebrow: "Matching gift",
  header: "Double your impact",
  body: "Every dollar donated today is matched through midnight. Don't miss this chance.",
  image: { src: "https://natureconservancy-h.assetsadobe.com/is/image/content/dam/tnc/nature/en/photos/w/o/WOPA160517_D056-resized.jpg?crop=864%2C0%2C1728%2C2304&wid=600&hei=800&scl=2.88", alt: "Matching gift" },
  cta: { label: "Donate now", href: "https://support.nature.org/donate", action: "redirect" },
  theme: { preset: "sky" },
  layout: { imagePosition: "left" },
  triggers: { frequencyDays: 0, list: [{ type: "time", delayMs: 5000 }] },
};
```

### 3. Forest, scroll or inactivity, button to membership

- Scroll to 50% of the page or stop interacting for 20 seconds to trigger the popup. The first trigger to fire wins.
- The `Become a member` button goes to the membership page.
- The forest design puts the image on the right, shows the `Limited time` eyebrow, and places the close button outside the dialog.

[Open live demo page 3](https://preserve.nature.org/page/194391/donate/1?mode=DEMO&locale=en-US)

```javascript
window.ENLightbox = {
  eyebrow: "Limited time",
  header: "Will you join us?",
  body: "Members like you fund the science that saves the lands and waters we all rely on.",
  image: { src: "https://natureconservancy-h.assetsadobe.com/is/image/content/dam/tnc/nature/en/photos/t/n/tnc_42230974.jpg?wid=1000&hei=600&fit=crop", alt: "Member" },
  cta: { label: "Become a member", href: "https://support.nature.org/membership", action: "redirect" },
  theme: { preset: "forest" },
  layout: { imagePosition: "right", closeButton: "outside" },
  triggers: {
    frequencyDays: 0,
    list: [
      { type: "scroll", percent: 50 },
      { type: "inactivity", idleMs: 20000 },
    ],
  },
};
```

### 4. Sky, time or exit intent, with a decline link

- Wait 30 seconds or move the mouse toward the browser close button or address bar on a desktop to trigger the popup. The first trigger to fire wins.
- The `Give today` button goes to the donation page, and `No thanks` is the decline link.
- The sky design puts the image on the right and shows the `Before you go` eyebrow.

[Open live demo page 4](https://preserve.nature.org/page/194707/action/1?mode=DEMO&locale=en-US)

```javascript
window.ENLightbox = {
  eyebrow: "Before you go",
  header: "One last thing",
  body: "A gift today funds clean water, climate action, and resilient communities.",
  image: { src: "https://natureconservancy-h.assetsadobe.com/is/image/content/dam/tnc/nature/en/photos/i/l/IL_MRCC181025_D524_square.jpg?wid=1000&hei=600&fit=crop", alt: "Clean water" },
  cta: { label: "Give today", href: "https://support.nature.org/donate", action: "redirect" },
  dismissLabel: "No thanks",
  theme: { preset: "sky" },
  layout: { imagePosition: "right" },
  triggers: {
    frequencyDays: 0,
    list: [
      { type: "time", delayMs: 30000 },
      { type: "exit-intent" },
    ],
  },
};
```

### 5. Forest, scroll, custom color, image on top

- Scroll down the page to trigger the popup.
- It uses the forest theme, a custom color, and an image above the text.
- It includes an eyebrow label.

[Open live demo page 5](https://preserve.nature.org/page/194708/donate/1?mode=DEMO&locale=en-US)

Open the page and view its source to see the settings block used.

### 6. Dark, inactivity, no close button

- Stop interacting for 10 seconds to trigger the popup.
- The `Subscribe` button goes to the signup page. There is no X close button; press Escape or click outside the popup to dismiss it.
- The dark design puts the image on the left and hides the image on phones. It shows the `Don't miss this` eyebrow.

[Open live demo page 6](https://preserve.nature.org/page/194709/action/1?mode=DEMO&locale=en-US)

```javascript
window.ENLightbox = {
  eyebrow: "Don't miss this",
  header: "Stay in the loop",
  body: "Get the latest conservation news delivered to your inbox.",
  image: { src: "https://natureconservancy-h.assetsadobe.com/is/image/content/dam/tnc/nature/en/photos/w/o/WOPA160517_D056-resized.jpg?crop=864%2C0%2C1728%2C2304&wid=600&hei=800&scl=2.88", alt: "Conservation news" },
  cta: { label: "Subscribe", href: "https://support.nature.org/signup", action: "redirect" },
  theme: { preset: "dark" },
  layout: { imagePosition: "left", closeButton: "none" },
  hideImageOnMobile: true,
  triggers: { frequencyDays: 0, list: [{ type: "inactivity", idleMs: 10000 }] },
};
```

### 7. Sky, exit intent, donation redirect with outcome tracking

This is the live version of [Example 4: Exit-intent redirect to a donation form (records the outcome on both pages)](#example-4-exit-intent-redirect-to-a-donation-form-records-the-outcome-on-both-pages).

- Move the mouse toward the browser close button or address bar on a desktop to trigger the popup.
- The `Give now` button goes to donation page 199477 and records the outcome in `en_txn10`. For the outcome to carry over, the donation page must embed the script with the same `en.referenceField`.
- The sky design puts the image on the left, shows the `Matching gift` eyebrow, and includes the `No thanks` link.

[Open live demo page 7](https://preserve.nature.org/page/199476/action/1?mode=DEMO&locale=en-US)

```javascript
window.ENLightbox = {
  eyebrow: "Matching gift",
  header: "Double your impact",
  body: "Every dollar donated today is matched through midnight. Don't miss this chance.",
  image: { src: "https://natureconservancy-h.assetsadobe.com/is/image/content/dam/tnc/nature/en/photos/w/o/WOPA160517_D056-resized.jpg?crop=864%2C0%2C1728%2C2304&wid=600&hei=800&scl=2.88", alt: "Matching gift" },
  cta: {
    label: "Give now",
    action: "redirect",
    href: "https://preserve.nature.org/page/199477/donate/1",
  },
  dismissLabel: "No thanks",
  theme: { preset: "sky" },
  layout: { imagePosition: "left" },
  triggers: {
    exitIntent: true,     // desktop only: fires when the mouse leaves the viewport
    frequencyDays: 0,     // testing only: show on every page load (default is 7)
  },
  en: {
    referenceField: "en_txn10",
  },
};
```

See [When it appears — the triggers](#when-it-appears--the-triggers) and [Design options](#design-options) to understand what each setting means.

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
<script src="https://aaf1a18515da0e792f78-c27fdabe952dfc357fe25ebf5c8897ee.ssl.cf5.rackcdn.com/2246/en-lightbox.js" async></script>
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

## Analytics tracking

Analytics tracking is automatic. There is nothing to add to your lightbox config and no switch to
turn on. The page must already have Tealium (`window.utag`), TNC's standard tag manager. When
Tealium's `link` function is available, the lightbox sends the events below. When Tealium is not on
the page, the lightbox sends nothing and keeps working normally.

**What you will see:** Your config has no `analytics` setting. You use the same config and script
tag as usual; tracking starts when Tealium is available.

These are the only two analytics events:

| Plain-language moment | Exact value sent |
|---|---|
| The lightbox opens | `lightbox_impression` |
| The visitor clicks the main button (the primary CTA) | `lightbox_click` |

The impression is sent once each time the lightbox opens. The click is sent only for the main
button, including a main button that only closes the lightbox. Closing with X, Escape, by clicking
the background, the "no thanks" link, or a secondary button sends no analytics event.

`lightbox_name` is always the fixed value `inactivity-exit` on both events. It stays the same
whether the lightbox opened because of time, scroll, inactivity, or exit intent. It is a label for
the lightbox, not a third event.

A payload is the small set of values sent for an event.

The two exact payloads are:

```javascript
{ event_name: "lightbox_impression", lightbox_name: "inactivity-exit" }
{ event_name: "lightbox_click", lightbox_name: "inactivity-exit" }
```

No personal or page data is ever included. The payload contains only the two fields shown above.

To verify tracking, add `?debug=true` to the page URL and open the browser console. Open the
lightbox and, if appropriate, click its main button. With Tealium on the page, the lines look like
this:

```text
[ENLightbox debug] utag payload: { event_name: "lightbox_impression", lightbox_name: "inactivity-exit" }
[ENLightbox debug] utag payload: { event_name: "lightbox_click", lightbox_name: "inactivity-exit" }
```

Without Tealium, the lines use this form instead:

```text
[ENLightbox debug] utag absent — would fire: { event_name: "lightbox_impression", lightbox_name: "inactivity-exit" }
[ENLightbox debug] utag absent — would fire: { event_name: "lightbox_click", lightbox_name: "inactivity-exit" }
```

For the other diagnostic rules, see [Optional diagnostics](#optional-diagnostics).

---

## Optional diagnostics

For a QA run, append `?debug=true` or `?debug=log` to the **page URL**. Either value turns on
console-only diagnostics; it is not a lightbox config setting. The console records lifecycle events
(`enlb:open`, `enlb:cta` with its role, and `enlb:dismiss` with its reason and pathname) plus
`enlb:field-write` entries for reference-field `write` and `replay` actions. It also records the
exact Tealium payload objects for impression and primary-CTA events. If `utag` is absent, QA mode
prints `utag absent — would fire: {payload}` instead; diagnostics never queue or send an event.

Without the query, or with any other value such as `debug=false`, `debug=1`, an arbitrary value, or a
malformed query, the lightbox produces **zero console output**. Diagnostics stay console-only; an
in-page panel is deferred to BACKLOG.

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
<script src="https://aaf1a18515da0e792f78-c27fdabe952dfc357fe25ebf5c8897ee.ssl.cf5.rackcdn.com/2246/en-lightbox.js" async></script>
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
<script src="https://aaf1a18515da0e792f78-c27fdabe952dfc357fe25ebf5c8897ee.ssl.cf5.rackcdn.com/2246/en-lightbox.js" async></script>
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
<script src="https://aaf1a18515da0e792f78-c27fdabe952dfc357fe25ebf5c8897ee.ssl.cf5.rackcdn.com/2246/en-lightbox.js" async></script>
```

---

### Example 4: Exit-intent redirect to a donation form (records the outcome on both pages)

This example uses the same reference field on a cultivation page and its donation form.

**Page 1 — cultivation page**

```html
<script>
  window.ENLightbox = {
    header: "Keep nature thriving",
    body: "Your support protects the places and wildlife we all share.",
    cta: {
      label: "Donate now",
      action: "redirect",
      href: "https://example.org/donation-form", // replace with the donation page URL
    },
    dismissLabel: "No thanks",
    en: { referenceField: "en_txn10" },
    triggers: {
      frequencyDays: 0, // for testing only
      list: [{ type: "exit-intent" }],
    },
  };
</script>
<script src="https://aaf1a18515da0e792f78-c27fdabe952dfc357fe25ebf5c8897ee.ssl.cf5.rackcdn.com/2246/en-lightbox.js" async></script>
```

**Page 2 — donation form**

The donation page must have an EN form with a field named `en_txn10`, then it can use this minimal
config:

```html
<script>
  window.ENLightbox = {
    en: { referenceField: "en_txn10" },
  };
</script>
<script src="https://aaf1a18515da0e792f78-c27fdabe952dfc357fe25ebf5c8897ee.ssl.cf5.rackcdn.com/2246/en-lightbox.js" async></script>
```

With no header, button, or triggers, no lightbox appears on page 2; the script only fills the
`en_txn10` field.

**What happens**

1. When the visitor clicks the main button on page 1, the lightbox writes `lightbox_accepted` into
   `en_txn10` on page 1 and remembers that outcome for the browser session.
2. Page 2 fills its own `en_txn10` field before the visitor touches anything.
3. The value submits with the donation. After the successful replay, the carry-over is cleared, so
   it is written once on page 2 and then forgotten.

This works within the same browser tab and session. The page 1 EN form must be present for the
first write, and the donation page must use the same field name, `en_txn10`. Closing the lightbox
with X, Escape, the background, "No thanks," or a secondary close action carries
`lightbox_declined` the same way; a main button with `action: "close"` is still treated as accepted.

---

## FAQ

**Is the lightbox tracked in Tealium / Adobe Analytics?**

The lightbox sends two fixed events through Tealium when `window.utag.link` is available; it does
not send directly to Adobe Analytics. See [Analytics tracking](#analytics-tracking) for the exact
payloads and a way to verify them.

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

**Can we record lightbox outcomes in an Engaging Networks reference field?**

Yes. Configure the reference field designated by Membership:

```javascript
en: { referenceField: "supporter.appealCode" }
```

When the configured name is safe, the library ensures the matching input during listener
installation, before any lightbox interaction. It selects the real EN page-builder form first and
uses the legacy EN form selector as a fallback. If the form is absent while the page is still
loading, it retries once on `DOMContentLoaded`; if the document is already loaded and no form is
present, it does nothing.

This empty ensure is not an outcome write: it emits no `enlb:field-write`, does not create pending
carry-over storage, and does not affect analytics or frequency state. The primary CTA writes
`lightbox_accepted`; close, Escape, overlay, secondary, dismiss, and API close paths write
`lightbox_declined`. A primary CTA with `action: "close"` remains accepted. Dotted EN names such
as `supporter.appealCode` are supported. The eager ensure leaves an existing same-name input of any type
completely unchanged; otherwise it creates one empty, optional hidden input without an `id`. Only a
later accept, decline, or replay outcome write updates the input's `.value`; those writes do not change
its other attributes.

A redirect CTA carries the latest outcome through the current session only after the origin page
wrote it to its EN form, so the origin form must be present. For carry-over, the destination page
must embed `dist/en-lightbox.js` and use the same configured field. Replay waits automatically for
DOM readiness, so a config-before-script embed in `<head>` is allowed; the value is cleared after a
successful replay. Membership owns the deployed field designation—avoid `en_txn2` when the annual
upsell uses it, and do not share a field with another campaign.

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
