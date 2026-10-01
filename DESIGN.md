---
name: Simulateur Assurance Automobile
description: Car insurance premium simulator in the modern insurance-app idiom, light and precise, with the premium as a live figure on an ink card.
colors:
  cobalt: "#2f5bea"
  cobalt-deep: "#2448c8"
  cobalt-mist: "#eef2fe"
  cobalt-edge: "#cbd6fb"
  ink-card: "#0e1424"
  on-ink-muted: "#a3adc2"
  ground: "#f6f7f9"
  surface: "#ffffff"
  surface-sunk: "#f2f4f7"
  hairline: "#e4e7ec"
  hairline-strong: "#cdd2db"
  ink: "#0f1522"
  slate: "#5b6474"
  tile-off: "#eef0f3"
  tile-off-ink: "#8a93a3"
  success: "#12805c"
  success-mist: "#e8f6ef"
  success-ink: "#0f6f50"
  amber: "#f2a01c"
  amber-mist: "#fff6e5"
  amber-ink: "#8a4b00"
  danger: "#d6392b"
  danger-mist: "#fdeeec"
  danger-ink: "#b42318"
  night-ground: "#0a0e16"
  night-surface: "#121826"
  night-ink: "#e7ebf3"
  night-cobalt: "#3f63f0"
  night-card: "#18213a"
  constat-yellow: "#ffe01a"
  constat-green: "#00a88e"
  viz-rc: "#2a78d6"
  viz-vehicle: "#eb6834"
  viz-other: "#1baf7a"
  viz-taxes: "#eda100"
  viz-fees: "#e87ba4"
typography:
  display:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 5.4vw, 4.3rem)"
    fontWeight: 650
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.45rem, 2.4vw, 1.8rem)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  figure:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 3.2vw, 2.7rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.045em"
    fontFeature: "\"tnum\" 1"
  title:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 550
    lineHeight: 1.3
  hint:
    fontFamily: "Geist, Segoe UI, system-ui, sans-serif"
    fontSize: "0.84rem"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  sm: "8px"
  field: "10px"
  md: "12px"
  lg: "16px"
  dialog: "18px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.surface}"
    rounded: "{rounded.field}"
    padding: "0 18px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 18px"
    height: "46px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-sunk}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "11px 14px"
    height: "46px"
  tab-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "36px"
  premium-card:
    backgroundColor: "{colors.ink-card}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "22px 24px"
  service-tile:
    backgroundColor: "{colors.cobalt-mist}"
    textColor: "{colors.cobalt-deep}"
    rounded: "{rounded.md}"
    size: "40px"
  switch-on:
    backgroundColor: "{colors.cobalt}"
    rounded: "{rounded.pill}"
    width: "40px"
    height: "24px"
  switch-off:
    backgroundColor: "{colors.hairline-strong}"
    rounded: "{rounded.pill}"
    width: "40px"
    height: "24px"
---

# Design System: Simulateur Assurance Automobile

## Overview

**Creative North Star: "The Live Quote"**

A modern insurance product played straight, at the craft level of Alan and Lemonade for calm clarity and of Stripe and Linear for precision. The page is light, cool and quiet so that the one thing that moves, the premium, reads instantly: it lives on a deep ink card, set in large tabular figures, and recomputes as the agent flips coverage switches. Everything else is white surfaces on a cool near-white ground, drawn with 1px hairlines and soft layered shadows, with a single electric cobalt accent that means "act, choose, progress".

Density is that of a working tool: twelve guarantees with franchises and capitals, a line-by-line table of net premium, TUA and totals, a fixed-fee breakdown. Expression lives in precise details (switches, pill tabs with a sliding thumb, numbered step dots joined by a line that fills, a soft reflection crossing the ink card when the figure changes), never in decoration. Futuristic here means exact, fast and calm, not neon: no glow, no glass, no gradient text. Night mode swaps the ground and surfaces for deep blue-blacks and keeps every role.

The printed offer is a white A4 document with a cobalt rule, key-value grids and one cobalt total panel. The Sinistre section keeps the FTUSA constat amiable as a paper document in its own official yellow and green.

**Key Characteristics:**
- One accent, cobalt, for actions, selection and progress; green, amber and red only for state.
- The premium always sits on the ink card; nothing else uses that surface except verdicts, proposal prices and toasts.
- Hairlines (1px) and soft shadows, never heavy borders or keylines.
- Geist throughout, tabular figures wherever numbers align.
- Motion is quick and quiet: steps slide in from the direction of travel, lists enter row by row once, the ink card catches a passing light.

## Colors

A restrained palette: cool neutrals, one saturated cobalt, a deep ink surface for the premium, and three state colors.

### Primary
- **Electric Cobalt** (#2f5bea): primary buttons, selected formula card ring and radio, switches on, the filled step line and current step dot, links, the reduction slider, active chips, the printed offer's rule and total panel. White text on it passes AA (5.5:1).
- **Deep Cobalt** (#2448c8): hover state of primary buttons, and cobalt text on white (links, reduced rates, the TTC line in the fee panel).
- **Cobalt Mist** (#eef2fe) with **Cobalt Edge** (#cbd6fb): soft tiles behind icons (step tile, guarantee tiles, reduction figure, case numbers), the "Obligatoire" pill, selected rows in "Mes devis".

### Secondary
- **Ink Card** (#0e1424) with **On-ink Muted** (#a3adc2): the premium card, the mobile premium bar, proposal prices, Sinistre verdict cards, toasts. White figures, muted labels, 12% white hairlines inside.

### Neutral
- **Cool Ground** (#f6f7f9): the page field, with a faint dot grid fading out behind the home screen.
- **Surface** (#ffffff): panels, cards, dialogs, the top bar, the stuck action bar.
- **Sunk Surface** (#f2f4f7): table heads, tab and segmented tracks, the fixed usage field, verdict rows.
- **Hairline** (#e4e7ec) and **Hairline Strong** (#cdd2db): dividers and card rings; input and secondary button outlines.
- **Ink** (#0f1522): text. **Slate** (#5b6474): secondary text and hints (5.5:1 on the ground).
- **Tile Off** (#eef0f3) with **Tile Off Ink** (#8a93a3): icon tiles of guarantees that are off or unavailable.

### State
- **Success** (#12805c, mist #e8f6ef, ink #0f6f50): the live dot on the premium card, confirmations, "non fautif", the best offer badge.
- **Amber** (#f2a01c, mist #fff6e5, ink #8a4b00): vehicle-age warnings, the confirmation dialog icon, incomplete constat, "responsabilité partagée". Dark text on amber, never white.
- **Danger** (#d6392b, mist #fdeeec, ink #b42318): "Non disponible" and "Non cumulable" notes, validation errors, delete actions, "fautif".

### Content colors (Sinistre)
- **Constat Yellow** (#ffe01a) and **Constat Green** (#00a88e): vehicles A and B exactly as on the FTUSA form, with their soft columns; sketch cars use #ffd23f and #22a87a. They identify vehicles only and carry no UI meaning. Road signs drawn in sketches keep their real colors.

### Data colors (premium breakdown)
- **Categorical five** for "Où va votre prime" only, in fixed order: RC-RTI #2a78d6, vehicle guarantees #eb6834, other guarantees #1baf7a, TUA taxes #eda100, fixed fees #e87ba4. In dark mode the same slots step to #3987e5, #d95926, #199e70, #c98500, #d55181; the printed offer always keeps the light steps. Both sets pass the colorblind and contrast checks of the data-visualization validator; the legend always shows the amount and the percentage next to each swatch, so identity never rests on color alone.

### Named Rules
**The One Accent Rule.** Cobalt is the only hue that invites action. A second accent color never appears; state colors never decorate. The data colors above are the single exception: they identify parts of a chart, never a button, link or state, and appear nowhere else.

**The Ink Card Rule.** The deep ink surface is reserved for figures that answer the flow (the premium, proposal prices, Sinistre verdicts) and for toasts. Never use it for ordinary containers.

## Typography

**Display Font:** Geist (with Segoe UI, system-ui)
**Body Font:** Geist
**Label/Mono Font:** Geist with tabular figures; no monospace.

**Character:** A precise contemporary grotesk, self-hosted as a variable font (SIL OFL). Tight negative tracking at large sizes gives the headline and the premium their engineered feel; medium weights (500 to 650) keep the interface light.

### Hierarchy
- **Display** (650, clamp(2.6rem, 5.4vw, 4.3rem), 1.02, -0.04em): the home headline only, first word in cobalt.
- **Headline** (650, clamp(1.45rem, 2.4vw, 1.8rem), 1.15, -0.03em): step titles and the Sinistre title.
- **Figure** (600, clamp(2.1rem, 3.2vw, 2.7rem), 1.05, -0.045em, tabular): the premium on the ink card; the same treatment at 2.3rem for the reduction figure and 1.6rem for proposal prices.
- **Title** (650, 1.02rem, -0.015em): group legends, panel titles, dialog titles (1.15rem), formula names (1.06rem).
- **Body** (400, 1rem, 1.5): running text; descriptions at 0.86 to 0.9rem in Slate, capped at 62ch.
- **Label** (550, 0.9rem): field labels; table heads at 0.78rem, 550, Slate.

### Named Rules
**The Tabular Figures Rule.** Every amount, rate and count is set with tabular figures, formatted with three decimals and comma thousands (2,935.140 DT), so columns align to the digit.

## Layout

A 1240px shell with a 16px gutter. The tool is a two-column workspace: step content on the left, a 340px column on the right holding the sticky premium card (top 88px) and the fee panel. Under 1024px the columns stack, the premium card flows under the content and a fixed ink premium bar appears at the bottom once the card scrolls out of view. The home screen is a two-column stage (copy left, example premium card right) that stacks under 900px.

Each step ends with an action bar (Précédent, Suivant, Voir l'offre) that sticks to the bottom of the viewport while the step scrolls, and rests in place at the step's end; on phones it is one row sitting directly above the premium bar. Scroll padding (96px, 156px on phones) keeps focused fields clear of it. Spacing follows 4 / 8 / 16 / 24 / 40px; panels pad 20 to 24px; guarantee rows 16px vertical.

## Elevation & Depth

Depth is a hybrid of hairline rings and soft, offset shadows. Surfaces are white on the cool ground, separated by a 1px ring plus a small shadow; the ink card and dialogs are lifted further. Nothing glows.

### Shadow Vocabulary
- **Ring + small** (`0 0 0 1px #e4e7ec, 0 1px 2px rgb(16 24 40 / .05), 0 2px 6px -2px rgb(16 24 40 / .08)`): panels, cards, active tabs.
- **Large** (`0 2px 6px rgb(16 24 40 / .08), 0 24px 48px -18px rgb(16 24 40 / .38)`): the ink card.
- **Pop** (`0 32px 80px -24px rgb(16 24 40 / .45)`): dialogs.
- **Button lift** (`inset 0 1px 0 rgb(255 255 255 / .16), 0 1px 2px rgb(16 24 40 / .16), 0 6px 14px -6px` cobalt at 60%): primary buttons in day mode only.
- **Tray** (`0 -1px 0 #e4e7ec, 0 -14px 32px -20px rgb(16 24 40 / .38)`): the action bar once stuck.

### Named Rules
**The No Glow Rule.** Shadows always carry an offset and a neutral tone. Colored shadows are allowed only under primary buttons in day mode; in night mode they are removed.

## Shapes

Gently rounded and consistent: 10px for buttons and fields, 12px for tiles and small cards, 16px for panels and the ink card, 18px for dialogs, full pills for switches, chips, the "Obligatoire" badge and the "Exemple" tag. Step markers are 30px circles. The action bar, once stuck, rounds only its top corners (16px). No clip-path shapes, no keylines.

## Components

### Buttons
- **Shape:** gently curved (10px), 46px high, 54px for the home CTAs.
- **Primary:** Electric Cobalt with white 600-weight text and a soft lift; hover deepens to Deep Cobalt; forward arrows slide 3px on hover; press moves 1px down.
- **Secondary:** white with a 1px Hairline Strong ring; hover fills with Sunk Surface.
- **Danger:** danger-ink text with a danger ring; hover fills with Danger Mist. A solid Danger fill is kept for confirmed deletions.
- **Focus:** 2px cobalt outline, 2px offset (white inside the ink card).

### Tabs and segmented controls
- **Style:** a Sunk Surface track with a 1px ring; the active item is a white thumb with ring and small shadow (ink card color at night). In the Fractionnement control the thumb slides between options (340ms).

### Chips
- **Style:** white pills with a 1px ring; the active filter is solid cobalt with white text.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Surface on the Cool Ground.
- **Shadow Strategy:** ring + small (see Elevation).
- **Internal Padding:** 20 to 24px.

### Inputs / Fields
- **Style:** white, 1px Hairline Strong border, 10px radius, 46px high, unit suffix (DT) in Slate inside the right edge; selects carry a thin chevron.
- **Focus:** border turns cobalt with a 3px cobalt halo at 22%.
- **Error / Disabled:** danger border and halo with an error line below; disabled at 55% opacity.

### Navigation
- **Top bar:** white, sticky, hairline base; shield mark on a cobalt tile, product name, pill tabs (Tarification, Sinistre), and outlined tool buttons (Formulaire proposant, Mes devis with a cobalt count, theme). On phones the name wraps to two lines, tools become icon buttons, tabs take the full second row.
- **Steps:** numbered circles (upcoming: white with ring; current: cobalt with a mist halo; done: mist with cobalt number) joined by a 2px line whose cobalt fill paints forward (600ms) as steps are completed.

### Premium card (signature)
The ink card that answers the whole flow: a live dot (green when computed, grey while waiting), "Prime totale TTC", the figure rolling to its new value in 460ms with an exponential ease-out while a soft light crosses the card (1s, at most once every 1.6s), then Formule, Fractionnement and Réduction under a hairline. Before the values and the guarantees are chosen it shows an em dash and says what is missing; the fee panel stays hidden until then and unfolds when the premium appears.

### Guarantee rows
A switch (40 × 24px), an icon on a Cobalt Mist tile (Tile Off when off or unavailable), name and description, franchise and capital. Locked guarantees show the switch at half cobalt and an "Obligatoire" pill; unavailable ones fade to 50% with a danger note. A tile scales in from 84% when its guarantee turns on.

### Constat amiable (Sinistre)
A paper document that stays light at night: yellow A column, green B column, the 17 numbered circumstances in the middle, square boxes that receive a drawn cross, and the count of ticked boxes at the foot. Verdict badges follow state colors (green non fautif, red fautif, amber partagé); the split bar uses the vehicle colors; case numbers sit on Cobalt Mist tiles.

### Printed offer
A white A4 document in either theme: shield mark and date over a 2px cobalt rule, key-value grids with hairlines, the coverage table, a cobalt total panel, the assistance note on Cobalt Mist, the QR code. Fits one page. Empty insured fields print as dotted lines to complete by hand, never as dashes; on screen a quiet note offers to fill the proposant form. The dialog footer has one primary action, Imprimer.

### Notifications
Ink toasts at the top of the screen (below the top bar), never over the bottom action bar. When a dialog is open they appear inside it, above its footer. A toast may carry one action ("Annuler") for 6 seconds.

### Premium breakdown chart
"Où va votre prime" is a single horizontal stacked bar (16px, 2px surface gaps, 4px rounded data end) with a legend of five tiles: swatch and name, then the amount in DT and the share in percent. Hovering a segment shows an ink tooltip with the amount, share and name. It appears in step 3 once the quote is ready and in the printed offer above the total, where the legend sits on one row of five.

### Installed app
The icon is the shield mark on flat Electric Cobalt (rounded square; full-bleed for maskable and Apple icons). The "Installer" button (secondary, in the top bar and on the home screen, shortened to "Installer" on phones) is hidden only when the app already runs installed. It opens the "Installer l'application" dialog: a QR code to the public address with `#installer`, two step cards (Android Chrome, iPhone Safari; the visitor's own system comes first on Cobalt Mist with a "Votre appareil" chip), the address with a copy button and a link to the printable poster `assets/qr/installer-application.png`. When the browser offers installation, a primary "Installer sur cet appareil" button appears in the dialog. On a phone the QR moves below the steps. Offline and back-online states are announced by toasts, never by a permanent banner.

### Mes devis
A wide dialog: search field with the primary "Nouveau devis" beside it, a one-line summary in Slate (count, average, range, formula split), secondary data actions (Exporter, Sauvegarder, Restaurer), then rows named by client with vehicle facts and date, the premium, secondary "Charger" and danger "Supprimer". The comparator marks every differing value in cobalt with a 2px cobalt rule and states the premium gap.

## Do's and Don'ts

### Do:
- **Do** keep the premium on the ink card, in tabular figures, and let only it catch the passing light.
- **Do** use cobalt for every action, selection and progress indicator, and nothing else.
- **Do** separate surfaces with 1px hairlines and soft offset shadows (see Elevation).
- **Do** keep motion quick, on transform and opacity from an already-visible default: steps slide 26px from the direction of travel (440ms), rows rise 8px with an 18ms stagger once per entry, exits are faster than entrances; reduced motion keeps only short fades.
- **Do** open in day mode; night mode stays one click away and keeps every role.

### Don't:
- **Don't** add a second accent color or use green, amber or red as decoration.
- **Don't** use glows, glass or blur panels, gradient text, or neon effects to signal "futuristic".
- **Don't** reintroduce the road-signage keylines, RAL traffic palette or Overpass: that direction was replaced at the user's request (September 2026).
- **Don't** show an amount before it means something: no premium or fees before the vehicle values are entered and the Garanties step is opened.
- **Don't** put white text on amber.
