# Ice Realm redesign v3: "Deep Field"

Inspiration: the [Noomo Showcase](https://showcase.noomoagency.com) and the client's crystal-star logo. This replaces v2 ("Frost Star", based on the Nike ball concept). We take inspiration from Noomo but do not copy it.

## 1. Design taste

Across the three references the client chose (the Nike × UCL ball, Noomo Showcase and the crystal logo), the same things keep coming back:

| Signal | Nike ball | Noomo | Logo |
|---|---|---|---|
| Deep space or near-black navy background | indigo fields | black starfield, blue nebula | `#000407` disc |
| Electric / ultramarine blue | `#013BFF` | `#0004EB` highlight blocks | facet blues |
| Crystalline object as the hero | ball of star panels | glass polyhedron, flying shards | faceted ice star |
| Refraction and glitch | rainbow edge fringes | red/cyan RGB split, grain, CRT tearing | |
| Oversized type with personality | tiled condensed caps | full-width uppercase, weights mixed, words in highlight blocks | |

What the client **is not** drawn to: light themes, soft rounded SaaS cards and polite pastel UI. Their taste is **immersive, cosmic, crystalline and a little glitchy**.

## 2. What Noomo does (measured from the live site)

| Element | Noomo |
|---|---|
| Background | `#000000` with a canvas starfield, a blue nebula glow and a heavy film-grain and chromatic-aberration pass over everything |
| Text colour | `#D9E0ED`, a cold blue-white |
| Accent | `#0004EB`, used as solid blocks behind words and as button fills |
| Type | Three faces: **PP Neue Montreal** (grotesk) for the uppercase headline (300 px tall on desktop) and body copy; **GT America Mono** for nav, labels ("Project", "Info") and uppercase buttons; ABC Favorit (minor) |
| Shape | **0 px radius** on buttons, chips and panels. Highlight blocks behind headline words are softly rounded, about 16 px |
| Header | Script-plus-logo on the left, mono nav links, and on the right a square sound toggle plus a pale **"Send email"** block with a small blue square arrow icon |
| Primary CTA | A two-part button: an electric-blue rectangle with uppercase text, *plus* a separate blue circle holding a pixel-art arrow |
| Hero | A full-viewport headline justified across the whole width, with a glass 3D object breaking through its centre and ice-like shards drifting in space |
| Info blocks | Editorial label/value columns bottom-left: a mono label ("Project", "Info") over grotesk text, and tags as pale chips butted together with 2 px gaps |
| Hover | Every word and button label is rendered twice; on hover the text **rolls** up to the copy (the duplicated spans seen in the DOM) |
| Spacing | Edge-to-edge 20 px page margin, very large type, very little else |

## 3. Translation to Ice Realm

| Noomo device | Ice Realm version |
|---|---|
| Glass polyhedron as hero object | **The client's crystal-star logo**, floating at the centre of the hero with a slow tilt, a blue nebula glow and an RGB-split edge |
| Drifting shards | Ice shards (small faceted polygons in logo blues) drifting through a starfield, with slight parallax on pointer move |
| Full-width uppercase headline, words in blue blocks | "BOOK FLOODLIT FOOTBALL / ON THE ICE / IN 10 CITIES, TONIGHT". Two phrases sit in electric highlight blocks. Light and bold weights are mixed in one headline. |
| Project / Info label columns | Mono label column on the left, content on the right, used for every home section (Cities, Formats, How it works, Under the lights) |
| Pale tag chips butted together | Format and amenity badges |
| Two-part blue CTA with pixel-arrow knob | Primary action everywhere: **Book a slot**, **Find slots**, **Book 7–8 pm** |
| Pale "Send email" block | Header CTA: "Book a slot" in a pale block with an electric arrow square |
| Roll-over text | Nav links and primary buttons |
| Grain and RGB split | A global grain overlay plus a red/cyan split on display type and the hero logo |

**Ice cyan's role:** it's the *glow*. It marks focus rings, the selected slot's edge, prices and live states. Electric blue is the *action* colour, filling buttons and the selected slot.

## 4. Tokens

### Colour

| Token | Hex | Source | Use |
|---|---|---|---|
| `--void` | `#00040A` | logo centre | Page background |
| `--abyss` | `#04101F` | between logo disc and facets | Glass panel base |
| `--facet-dark` | `#0A315F` | logo | Raised surfaces, hover fills |
| `--facet` | `#29548C` | logo | Borders on hover, booked texture |
| `--facet-light` | `#256AA6` | logo | Shards, nebula |
| `--frost` | `#7FA8D4` | logo frost lifted for contrast | Secondary text (7.3:1 on void) |
| `--ice` | `#90D8F3` | logo edge highlight | Glow, focus, prices, selected-slot edge |
| `--paper` | `#D9E0ED` | Noomo text | Primary text, pale chips, header CTA block |
| `--electric` | `#0A2BFF` | Noomo `#0004EB`, nudged toward the logo's blues | Primary buttons, highlight blocks, selected states |
| `--split-red` | `#FF2E63` | | RGB split, decorative only |
| `--split-cyan` | `#00F0FF` | | RGB split, decorative only |
| `--amber` | `#FFC44D` | | Peak and weekend price |
| `--danger` | `#FF5C7A` | | Errors |

Glass panels use `rgba(4,16,31,.62)`, `backdrop-filter: blur(14px)`, and a 1 px `rgba(217,224,237,.14)` hairline.

### Type

| Role | Face | Spec |
|---|---|---|
| Display and body | **Host Grotesk** (a free, Google-hosted grotesk standing in for Neue Montreal) | Hero 300/700 uppercase, `clamp(2.8rem, 8.4vw, 8.5rem)`, line-height 0.9, tracking −0.02em. Section titles 700 uppercase at 40–64 px. Body 400 at 17 px / 1.55. |
| Labels, nav, buttons, data | **Geist Mono** (standing in for GT America Mono) | Nav 14 px sentence case. Labels 13 px sentence case in `--frost`. Buttons 15 px uppercase with 0.02em tracking. Times and prices use tabular figures. |

### Shape, depth and effects

- **Radius:** 0 on buttons, inputs, cards, tiles and panels. 4 px on chips. 14 px on headline highlight blocks. Circles only on the CTA knob and the logo.
- **Depth:** glass plus hairline, never drop shadows. Hover adds an `--ice` hairline and a `0 0 28px -6px rgba(144,216,243,.5)` glow.
- **RGB split:** `text-shadow: -1.5px 0 rgba(255,46,99,.55), 1.5px 0 rgba(0,240,255,.55)` on display type. The logo gets the same with `drop-shadow`.
- **Grain:** a fixed SVG `feTurbulence` overlay at 6% opacity with `mix-blend-mode: overlay`, stepping position at 8 fps.
- **Motion:**
  - **On load:** the logo fades up from a blur, the headline rows slide in, and the shards start drifting.
  - **On interaction:** roll-text on buttons and nav, a 2 px lift on tiles.
  - **Reduced motion:** the starfield and shards render static, grain stops and nothing slides.

## 5. Components

### Header and navigation
- **Layout:** fixed, 72 px high, transparent over the hero; after scrolling it becomes `rgba(0,4,10,.7)` with blur and a hairline.
- **Left:** the round logo (36 px) plus the wordmark "ICE REALM" in Host Grotesk 700 with tracking.
- **Centre:** nav links in Geist Mono 14 px (*Grounds · How it works · My booking*) with roll-text hover.
- **Right:** the **Book a slot** block, a pale `--paper` rectangle with electric mono text and a 22 px electric square holding a pixel arrow. Same treatment as Noomo's "Send email".
- **Mobile:** the logo, the CTA, and nav links folded into the footer.

### Hero with search console
- **Background layers:** the void, a nebula radial glow (`--electric` 35% → transparent), the starfield canvas with drifting ice shards, and grain.
- **Headline:** full-width uppercase, justified row by row, with the logo crystal (`min(46vw, 520px)`) centred *behind* rows 2–3 and slowly tilting. Highlight blocks sit on "ON THE ICE" and "TONIGHT".
- **Search console:** docked below the headline. It's a rectangular glass strip of three fields and a CTA:
  `[City ▾] [Format ▾] [Day ▾] [FIND SLOTS ●→]`
  - Each field has a mono label above an 18 px grotesk value.
  - Fields are separated by hairlines.
  - Stacked on mobile.
- **Soonest open:** an editorial row with the mono label "Soonest open in Mumbai" on the left and a horizontal strip of rectangular slot tickets on the right.
- **Slot ticket:** the time in grotesk 700, the area, a paper chip for the format, and the price in ice.

### Turf card and time-slot grid
- **Turf card:**
  - **Base:** a glass rectangle with a mono label row (format chip and player count), then the name in grotesk 700 uppercase at 32 px and a "From ₹" line in mono.
  - **Selected:** an `--electric` fill, an ice inner hairline and an RGB split on the name.
- **Slot grid:** a tight mosaic of tiles with **2 px gaps** and no radius, `minmax(108px, 1fr)` columns and 68 px rows. The time is grotesk 600 at 20 px and the price is Geist Mono 13 px.

  | State | Treatment |
  |---|---|
  | Open | glass fill, hairline |
  | Hover/focus | `--ice` hairline + glow + 2 px lift |
  | Selected run | solid `--electric`, an ice inset line, and the tiles fuse into one bar (2 px gaps filled) |
  | Peak/weekend | price in `--amber` |
  | Booked | **CRT scanlines**: `repeating-linear-gradient` in `--facet` at 3 px, text in `--frost`, "Booked" |
  | Passed | 30% opacity, "Passed" |

### Booking modal and forms
- **Summary card** (desktop, sticky right): a glass panel with an `--electric` header strip and a mono label ("Your slot") above the time in grotesk 700 at 44 px with the RGB split. Below come the details, the form, a dashed hairline, the total in grotesk 700, then the primary CTA.
- **Mobile:**
  - A docked summary strip holds the mono date, the time, the price and a **Continue** CTA.
  - The bottom sheet is a `<dialog>` with **square corners**, a 2 px `--ice` top border and a void backdrop with blur.
- **Inputs:**
  - **Base:** a rectangle with a `rgba(217,224,237,.04)` fill, a 1 px paper-14% hairline and a mono label above. The value is in grotesk 17 px.
  - **Focus:** an ice hairline plus a 3 px ice glow.
  - **Error:** a danger hairline and a mono error line below.
- **Badges:** pale `--paper` chips with void text at 13 px, 4 px radius, butted together with 2 px gaps.
- **Status badges:** pending is amber on amber-15%, confirmed is void on ice, closed is frost on facet-dark.
- **Ticket:** glass, an electric head strip (ice when confirmed), the time as a giant grotesk 700 numeral with the RGB split, a perforation line, and the amount in mono.
- **QR code:** stays dark-on-light on a paper tile framed in ice so it still scans.

## 6. Structural CSS changes from v2

1. **Tokens.** Replace the v2 palette (`--night`, `--deep`, `--rink`, …) with the logo-derived set above. Body becomes `--void` with `--paper` text.
2. **Fonts.** Big Shoulders Display and Geist become Host Grotesk and Geist Mono. Display type changes from condensed to wide uppercase grotesk.
3. **Radius.** Drop every `--r-card` / `--r-pill` use to 0. Only chips (4 px), highlight blocks (14 px), the knob and the logo stay rounded.
4. **Global layers.** Add `<SpaceBackdrop>`, a `position: fixed; inset: 0; z-index: -1` canvas for the starfield and shards, and a `.grain` overlay (`position: fixed; pointer-events: none; z-index: 100`).
5. **Hero.** Replace v2's centred ball + title + pill search bar with:
   - `.hero` at `min-height: 100svh`, using a `grid-template-rows: 1fr auto auto` stack: headline stage, search console, soonest-open row.
   - `.hero-stage` with `position: relative`, the logo absolutely centred, and the headline rows as `display: flex; justify-content: space-between` so each row spans the full width.
   - `.console` as `grid-template-columns: repeat(3, 1fr) auto` with zero radius and hairline dividers.
6. **Sections.** v2's full-bleed colour fields (electric, frost, graphite) go. Every section sits on the void and uses an editorial grid, `grid-template-columns: 220px 1fr`, with the mono label in the left column. It collapses to one column under 820 px.
7. **Buttons.** `.btn-primary` is an electric rectangle with a `::after` knob (36 px circle with the pixel-arrow SVG), and `.roll` spans handle the hover. `.btn-secondary` is a paper hairline rectangle. v2's ice pill buttons go.
8. **Slot grid.** The gap drops from 8 px to 2 px and the radius to 0. The selected run uses `box-shadow: 0 0 0 1px var(--electric)` so gaps inside the run fill in. Booked slots switch from v2's halftone dots to scanlines.
9. **Sheet.** Square corners and an ice top border instead of v2's 22 px rounded top.
10. **Removed.** `FrostBall.jsx` (the logo is the hero object now) and the colour-field section classes.

## 7. Accessibility floor

- **Contrast:**

  | Pairing | Ratio |
  |---|---|
  | Paper on void | 15.9:1 |
  | Frost on void | 7.3:1 |
  | Paper on electric | 5.6:1 |
  | Void on ice | 13.2:1 |
- **Effects:** the RGB split and grain are decorative. Body copy and form text never carry the split, and the grain sits at 6%.
- **Non-colour cues:** booked slots are told apart by texture and the word "Booked", not by colour alone.
- **Reduced motion:** all motion is disabled under `prefers-reduced-motion`.
- **Focus:** keyboard focus is a 2 px ice outline with a 2 px offset everywhere.

## 8. Images still to come

The client will supply photography. Slots are ready for:
- `src/assets/photos/photo-1..3.jpg`: the "Under the lights" gallery
- optional `src/assets/photos/hero-*.jpg`: could replace the drifting shards with floating photo shards, Noomo-style, once real venue shots exist
