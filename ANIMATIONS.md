# Hilora — Animation handoff

All motion is plain JavaScript using **GSAP 3** (`npm i gsap`). It works with any
framework or none. ScrollTrigger and SplitText ship with GSAP and are free.

```
src/animations/
  index.js       entry: registers plugins, handles reduced motion + touch devices
  header.js      header / promo bar entrance, mobile menu
  hero.js        hero entrance timeline + scroll parallax
  profile-carousel.js  looping "focus" carousel for the hero profile cards
  stats.js       stats strip entrance + number count-up
  verify.js      "How we verify" heading, step cards, mini UI stories, panel loops
  recent.js      "Recently verified" heading, card entrance, badge sheen, Save toggle
  different.js   "What makes us different" accordion, auto-advance timer, preview stories
  fields.js      "Pick a field / industry" grid entrance and count-up
  cta.js         "Hiring or getting hired?" CTA (results mock) + footer entrance
  card-tilt.js   reusable 3D cursor tilt + glare  (add data-tilt)
  magnetic.js    reusable magnetic button         (add data-magnetic)
  utils.js       shared helpers (sheen sweep, count-up)
```

Each file has a `CONFIG` object at the top for durations, easing and distances.
Change values there rather than inside the code.

## Global rules

- **Reduced motion:** if the OS setting "Reduce motion" is on, everything shows
  instantly with no movement (`gsap.matchMedia` in `index.js`).
- **Touch devices:** tilt and magnetic effects only run on devices that can hover.
- **No flash on load:** `<html>` gets a `js` class inline in `<head>`, and
  `.js [data-anim] { visibility: hidden }` hides animated sections until GSAP
  shows them. Without JS, the page renders normally.
- Only `transform`, `opacity` and `clip-path` are animated, so it stays smooth.
- Entrance tweens on elements that also have a CSS hover transform use
  `clearProps: "transform"`, otherwise GSAP's leftover inline transform would
  override the hover.

## Header + promo bar (`header.js`)

| Element | Trigger | Motion |
|---|---|---|
| `.site-header` | page load | slides down from -100%, 0.8s `power3.out` |
| logo, nav links, buttons | page load | fade + drop 12px, 0.05s stagger |
| `.promo-bar` | page load | clip-path reveal top→bottom, 0.7s |
| `#mobile-menu` | menu toggle | height 0→auto, links slide in from left (0.04s stagger) |
| nav link hover | hover | coral underline draws in L→R (CSS) |
| `More` chevron | hover | rotates 180° (CSS) |
| header shadow | scroll > 8px | `.is-scrolled` adds a soft shadow (`src/header.js`) |

## Hero (`hero.js`)

Load timeline (starts 0.35s after load):

| t (s) | Element | Motion |
|---|---|---|
| 0 | headline words | rise 110% out of a mask (SplitText `mask: "words"`), 1.1s, 0.08s stagger |
| 0.15 | `.hero__pill` | clip-path wipe L→R + rotate -4°→0, 0.9s `expo.inOut` |
| ~0.7 | "verified" text | pops up, `back.out(1.8)` |
| ~1.0 | pill | white sheen sweeps across once |
| 0.45 | `.hero__subtitle` | fade + rise 24px |
| 0.55 | `.search` | fade + rise 30px |
| 0.6 | featured card | rise 120px + scale 0.85→1, 1.3s `expo.out` |
| 0.75 | side cards | **deal out**: start stacked behind the centre card (rotated ±8°, scale 0.8) and fan out to place; inner cards first |
| ~1.5 | corner brackets | fly in from 30px outside, `back.out(2)` |
| then | corner brackets | pulse outward 6px and back forever, 1.4s `sine.inOut` |
| then | profile carousel | autoplay starts (below) |

### Profile carousel (`profile-carousel.js`)

The coral brackets (`.profiles__frame`) stay fixed in the centre like a viewfinder;
the cards slide through it in a loop.

- Every **3.2s** the row slides one card left (1.15s, `expo.inOut`). The card that
  lands in the frame becomes featured.
- **Morph:** each card's size, type, corner radius, shadow and tint come from one
  CSS variable, `--f` (0 = regular card, 1 = featured), in `hero.css`. The carousel
  just tweens `--f` from 0 to 1, so any card grows into exactly the Figma featured
  size (236×289 → 351×381) and its tint fades from navy to warm.
- **Lock-on:** while the row travels the brackets let go (scale 1.1, fade to 35%),
  then snap back onto the new card (`back.out(3)`). A sheen sweeps across the card
  and its badges pop in one after another.
- **Looping:** the five cards are cloned once in JS (clones are `aria-hidden`), so a
  card can leave on the left while its twin comes in from the right off-screen.
- **Pauses** while the mouse is over the row and while the hero is off-screen.
- **Click** any visible side card to bring it into the frame (two steps away = one
  longer slide).
- Without JS or with reduced motion, the row is the static Figma layout with
  Adaeze featured (`.is-featured`).

Scroll (scrubbed to the scrollbar, from hero top to hero bottom leaving the screen):

- background pattern moves down 120px (slower than the page, giving depth)
- the whole card row moves up 70px
- headline/search block moves up 40px and fades to 0.2

Hover (CSS + `card-tilt.js` / `magnetic.js`):

- **Profile cards:** 3D tilt up to 10° toward the cursor, scale 1.03, white glare
  follows the cursor, photo zooms 1.06 inside the card.
- **Search Talent button:** magnetic pull toward the cursor (25%), elastic snap
  back; a white fill wipes up from the bottom and the text turns navy.
- **Search box:** coral focus ring when either input is focused (CSS).

## Stats (`stats.js`)

| Trigger | Motion |
|---|---|
| card reaches 92% of the viewport (once) | card rises 60px + fades in, then each stat fades up (0.12s stagger) |
| same | numbers count up from 0 to their `data-count` value over 2s, `power3.out` |

If the card is already on screen at load, it waits 1.4s so the hero cards land first.

## How verification works (`verify.js`)

Scroll-in timeline, plays once when the section reaches 75% of the viewport
(on a refresh with the section on screen, that's immediately):

| t (s) | Element | Motion |
|---|---|---|
| 0 | `.section-head__eyebrow` | fade + rise 16px |
| 0.1 | `.section-head__title` | lines rise out of a mask (SplitText `mask: "lines"`), 0.1s stagger |
| 0.35 | `.section-head__lead` | fade + rise 20px |
| 0.4 | `.step` cards | rise 60px + fade, 0.12s stagger, `expo.out` |
| 0.85 / 1.45 / 2.05 / 2.65 | panels 1–4 | each card's story starts (`CONFIG.stepGap` = 0.6s apart) |

**Hover:** hovering a card replays its story. If the story is still playing, the
hover is ignored so it never stutters.

Each story is a `reset()` that puts the mini UI into its "in progress" state and
a `run()` that builds a fresh timeline ending exactly on the Figma design.
Without JS or with reduced motion the panels just show the finished design.

### Step 1 — Apply: uploads (~3.3s)
Each row slides in with its label dimmed to 45% and a **loading spinner** in the
tick's place (a navy arc on a faint track, turning steadily). A 3px progress bar
runs along the bottom of the row with small stalls (`UPLOAD_CURVES`), different
per row, so it feels like a real upload. When it finishes, the spinner's arc
**closes into a full circle** and hands over to the tick (same size and colour, so
there's no jump), and the label brightens. Rows start 0.7s apart, like a queue.

### Step 2 — Credentials: scan and stamp (~3.5s)
Tunde's card drops in, photo pops. The licence row shows a grey **"Checking COREN"**
pill with a spinner while a blue scan beam passes down and back up over the card.
Then the pending pill shrinks away, **"Valid to Dec 2026" stamps down**
(scale 1.8 → 1, -8° → 0°) and the row flashes pale green.

### Step 3 — References: calling referees (~4s)
Both referee photos start greyed out with a white **spinner badge**; the status
says **"Calling…"** and the pill is amber, **"0 of 2 confirmed"**, with a pulsing
dot. Each referee confirms 1s apart: photo comes into colour and settles up, badge
turns green with a tick, the counter rolls to **1**, then **2**, with a little pill
bump. At 2 of 2 the pill turns green, "Calling…" becomes **"Called 13 Nov"**, and
the badges step aside so the card matches the design.

### Step 4 — Profile goes live: count + confetti (~3.5s)
The card rises, the "Live" pill pops, the number counts 0 → 38 and the three check
pills pop one by one. When the count lands, the number bumps and a **small confetti
burst** (26 pieces, brand colours) fires from the "Live" pill using GSAP's
`Physics2DPlugin`. It's clipped to the green panel and the pieces remove themselves.
The "Live" pill keeps a soft red pulse ring afterwards.

### Hover styling (CSS)
The panel lifts only 2px with a faint shadow. The background texture does not move.

## Recently verified professionals (`recent.js`)

Scroll-in timeline, plays once when the section reaches 75% of the viewport:

| t (s) | Element | Motion |
|---|---|---|
| 0 | eyebrow | fade + rise 16px |
| 0.1 | title | lines rise out of a mask |
| 0.3 | lead | fade + rise 20px |
| 0.35 | "See all professionals" button | fade + slide in from the right 24px |
| 0.45 + 0.12×i | `.pro-card` | rise 50px + fade, `expo.out` |
| +0.2 | avatar | settles up 12px |
| +0.4 | chips | pop up one by one |
| +0.45 | **"Verified" badge** | stamps on (scale 0.5 → 1, `back.out`) then a sheen sweeps across it, so each card reads as "just verified" |

Hover:

- Card lifts 4px with a slightly deeper shadow (CSS).
- Pointer devices: a sheen sweeps across the "Verified" badge (once per hover).
- "View profile" darkens; presses down slightly on click (CSS).
- "See all professionals on Hilora": navy fill wipes up from the bottom, text turns white (CSS).

**Save button** (works on every device, even with reduced motion):

- Click toggles `aria-pressed` and the label between **Save** and **Saved**.
- Saving: the bookmark drops in and fills navy, six tiny dots pop outward around
  it, and the label rolls up to "Saved". The button turns pale navy.
- Unsaving: the bookmark gives a small squeeze and empties; the label rolls back.
- The bookmark is inline SVG (same path as the Figma asset) so its fill can change.
- In production, hook the click up to the real save endpoint in `initSaveButtons`.

Content note: the four cards use placeholder profiles (accountant, physician,
barrister, HSE officer) with avatar crops of the industry photos from the Figma
file (`public/assets/profiles/avatar-*.jpg`). Swap in real data when it's wired up.

## What makes us different (`different.js`)

An accordion of six features drives the preview panel on the right. Behaviour and
animation live in the same file because the accordion must work with reduced
motion too (it switches instantly and has no timer then).

**Auto-advance:** the coral bar under the open item (from the design) is a 7s
timer (`CONFIG.interval`). When it fills, the next feature opens; it loops.
It pauses while the mouse is over the list or preview, and while the section is
off-screen. Clicking a feature opens it and restarts the timer.

**Switching (≈1.5s):**

| t (s) | Element | Motion |
|---|---|---|
| 0 | old panel / new panel | height collapses / expands together (0.5s, `power3.inOut`); new text fades up |
| 0 | preview background | eases to the feature's colour (`data-color` on each `.pv`) |
| 0 | old cards | drop 14px and fade (0.3s) |
| 0.15 | new photo | wipes in from the right (`clip-path`, 0.8s `expo.inOut`) with a slow zoom from 1.12 → 1 |
| 0.75 | new cards | rise 22px, 0.12s apart, then the feature's story plays |

**Stories:**

- **01 Scout bounties:** bounty counts ₦0 → ₦350,000; the Referred bar fills, then Interviewing.
- **02 Stealth mode:** the toggle starts on (green), slides off; "Hidden from search" pops in.
- **03 Escrow:** "PAYMENT HELD" stamps on; the three timeline dots light up in order.
- **04 Trust dossier:** the four checks rise in and their ticks pop one by one.
- **05 Graduate pipeline:** verification chips pop in; the NYSC emblem rotates in.
- **06 Replacement guarantee:** "7 working days" counts up; "₦0" pops.

**Scroll-in (once at 70% of the viewport):** eyebrow + title reveal, list rows slide
in from the left (0.07s apart), preview rises 40px, the first photo settles from
1.12 zoom, then story 01 plays and the timer starts.

**Hover (CSS):** closed rows darken their title and the plus turns 90°.

**Scaling:** the preview is built at the design size (692×580) and scaled to its
container with `zoom: var(--z)`, which a `ResizeObserver` sets, so the cards keep
their exact layout on tablet and mobile.

**Placeholders to replace:** the photos for 03–06 and the NYSC emblem are stand-ins
(Figma's API limit was reached before they could be exported). Drop the real
exports into `figma-exports/` and they'll be swapped in.

## Pick a field / industry (`fields.js`)

Scroll-in timeline, plays once when the section reaches 75% of the viewport:

| t (s) | Element | Motion |
|---|---|---|
| 0 | eyebrow | fade + rise 16px |
| 0.1 | title | lines rise out of a mask |
| 0.25 | `.field` tiles | rise 40px + scale 0.96 → 1, as a wave across the grid (`stagger.grid: "auto"`, 0.07s) |
| 0.25 | tile photos | settle from 1.15 zoom (1.4s), same wave |
| 0.7 | "N verified profiles" | numbers count up from 0 (1s, 0.05s apart) |

Hover (CSS): photo zooms to 1.06, the bottom shade deepens, the arrow nudges up-right
3px. On "See all", the navy wash lightens slightly.

Layout: 4 columns on desktop (315×213 tiles, 12px gap), 2 columns below 900px.

## Get started CTA + footer (`cta.js`)

> Built from the full-page screenshot because the Figma API limit was reached;
> spacing and sizes are measured from it and may be a few px off the Figma file.

CTA scroll-in (once at 75% of the viewport):

| t (s) | Element | Motion |
|---|---|---|
| 0 | eyebrow | fade + rise 16px |
| 0.1 | title | line rises out of a mask |
| 0.3 | the two cards | rise 50px + fade, 0.12s apart (`clearProps` so CSS hovers keep working) |
| 0.75 | browser mock | slides in from the bottom-right (x 60, y 50) |
| 1.0 | "86 verified" | counts up from 0 |
| 1.1 | result rows | load in one by one (0.12s apart) |
| 2.2 | result list | starts stepping |

**Result list:** every 2.2s the list moves up one row (0.7s `power3.inOut`), like
new verified profiles arriving. The four rows are duplicated once so it loops
seamlessly. It pauses while the employer card is hovered and while the section is
off-screen.

Hover (CSS): buttons lighten; press scales to 0.98.

**Footer** (once at 90% of the viewport): brand block, the three link columns and
the copyright fade up 24px, 0.1s apart. Link hover: a coral underline draws in
left to right (same as the header nav). The logo is the header SVG rendered white
with a CSS filter.
