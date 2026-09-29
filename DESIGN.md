---
name: Simulateur Assurance Automobile
description: Car insurance premium simulator styled as a road-signage system, where every color carries a traffic meaning.
colors:
  traffic-blue: "#0b4f94"
  traffic-blue-deep: "#083e75"
  traffic-yellow: "#f5b400"
  traffic-red: "#c4161c"
  traffic-green: "#11763f"
  traffic-black: "#1b1d21"
  concrete: "#e5e5e2"
  traffic-white: "#ffffff"
  panel-sunk: "#f2f2f0"
  line: "#d8d8d4"
  line-strong: "#8f918d"
  muted-ink: "#525c68"
  on-sign-muted: "#d3e2f4"
  tile-off: "#b9bbb7"
  night-asphalt: "#141414"
  night-panel: "#1e1e1e"
  night-ink: "#e9edf1"
  night-blue: "#0d58a6"
typography:
  display:
    fontFamily: "Overpass, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.35rem, 7vw, 4.4rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Overpass, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2.6vw, 1.9rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  figure:
    fontFamily: "Overpass, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.1vw, 2.55rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\" 1"
  title:
    fontFamily: "Overpass, Segoe UI, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 800
    lineHeight: 1.2
  body:
    fontFamily: "Overpass, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Overpass, Segoe UI, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 700
    lineHeight: 1.3
  hint:
    fontFamily: "Overpass, Segoe UI, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  field: "8px"
  panel: "10px"
  sign: "12px"
  hero-sign: "18px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-blue:
    backgroundColor: "{colors.traffic-blue}"
    textColor: "{colors.traffic-white}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "48px"
  button-blue-hover:
    backgroundColor: "{colors.traffic-blue-deep}"
  button-green:
    backgroundColor: "{colors.traffic-green}"
    textColor: "{colors.traffic-white}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "48px"
  button-ghost:
    backgroundColor: "{colors.traffic-white}"
    textColor: "{colors.traffic-black}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "48px"
  button-danger:
    backgroundColor: "{colors.traffic-white}"
    textColor: "{colors.traffic-red}"
    rounded: "{rounded.field}"
    height: "38px"
  input:
    backgroundColor: "{colors.traffic-white}"
    textColor: "{colors.traffic-black}"
    rounded: "{rounded.field}"
    padding: "11px 14px 9px"
    height: "48px"
  sign-panel:
    backgroundColor: "{colors.traffic-blue}"
    textColor: "{colors.traffic-white}"
    rounded: "{rounded.sign}"
    padding: "24px 26px"
  service-tile:
    backgroundColor: "{colors.traffic-blue}"
    textColor: "{colors.traffic-white}"
    rounded: "9px"
    size: "44px"
  attention-note:
    backgroundColor: "{colors.traffic-yellow}"
    textColor: "{colors.traffic-black}"
    rounded: "6px"
    padding: "8px 10px"
---

# Design System: Simulateur Assurance Automobile

## Overview

**Creative North Star: "La Signalisation"**

The simulator is built like a road-sign system rather than a web app. A driver reads a sign at speed because its grammar never changes: a fixed color means a fixed thing, the white keyline frames the message, the pictogram names the subject before the words do. The interface borrows exactly that discipline. The agent "drives" a route of three stops (Véhicule, Garanties, Résumé), every constraint is signposted where it applies, and the answer, the premium TTC, is a large blue direction panel that stays in view and updates live.

Density is that of a working tool: tables of figures, twelve guarantees with their franchises and capitals, a fixed-fee breakdown. Expression lives in precise details (keylined panels, service-sign pictograms, milestone markers on the step route), never in decoration. There is no road scenery, no illustration, no gradient: the grammar is the brand. A night mode ("Mode nuit") swaps the concrete ground for asphalt while the signs keep their retroreflective colors. The printed offer is a white A4 document with one blue total panel.

**Key Characteristics:**
- Color is semantic: blue informs and navigates, yellow warns, red forbids or deletes, green confirms.
- Signs carry an inset white keyline (5px of blue, then 2px of white) at every scale, from the hero panel to buttons and tiles.
- One typeface, Overpass (Highway Gothic lineage), with tabular figures for every amount.
- Light concrete ground by day, asphalt by night.
- One authored motion: the premium figure rolls to its new value.

## Colors

The RAL "traffic" family on a concrete ground: four signal colors with fixed meanings, and a neutral field that never competes with them.

### Primary
- **Traffic Blue** (RAL 5017): information, navigation, mandatory. Direction panels (hero, premium meter, total on the offer), the top bar, dialog headers, selected formula, active step, "Obligatoire" discs, guarantee tiles that are switched on, primary "Suivant" and "Imprimer" buttons, the reduction plate and slider.
- **Traffic Blue Deep**: hover state of every blue button.

### Secondary
- **Traffic Green** (RAL 6024): confirm and finish only. "Commencer la simulation", "Voir l'offre", "Enregistrer", completed steps on the route, the "Prime la plus basse" badge, success toasts.

### Tertiary
- **Traffic Yellow** (RAL 1023): attention. Vehicle-age warnings on step 1, the "Attention !" confirmation header, focus rings in night mode. Always with black text.
- **Traffic Red** (RAL 3020): prohibition and deletion. "Non disponible" / "Non cumulable" notes on guarantees, "Supprimer", the border of the warning triangle.

### Neutral
- **Traffic Black** (RAL 9017): ink, table rules, focus ring by day.
- **Concrete**: neutral grey page ground by day (no blue cast).
- **Traffic White**: panels, fields, the printed offer.
- **Panel Sunk**: table headers, total rows, segmented-control track, the offer's desk.
- **Line / Line Strong**: dividers and field borders; Line Strong is also the dashed lane marking of the step route.
- **Muted Ink**: secondary text, hints, column headers (6.8:1 on white).
- **On-Sign Muted**: secondary text on blue panels.
- **Tile Off**: pictogram tiles of guarantees that are off or unavailable.
- **Night Asphalt / Night Panel / Night Ink / Night Blue**: the night-mode ground and panels (neutral near-blacks, not blue-black slate), text and sign blue.

### Constat colors (content, not signals)
- **Constat Yellow** (#ffe01a, soft #fff7c2) and **Constat Green** (#00a88e, soft #d9f2ec): vehicle A and vehicle B, exactly as on the FTUSA constat amiable. In sketches, A/X cars are #ffd23f and B/Y cars #22a87a, like the barème's own croquis. They identify vehicles only and never carry a UI meaning.

### Named Rules
**The Traffic Code Rule.** A signal color is never used for decoration or for a meaning other than its own. If an element is not informing, warning, forbidding or confirming, it is neutral.

**The Yellow Carries Black Rule.** Traffic Yellow always carries Traffic Black text; never white.

## Typography

**Display Font:** Overpass (with Segoe UI, system-ui, sans-serif)
**Body Font:** Overpass
**Label/Mono Font:** none; figures use Overpass tabular numerals.

**Character:** A single signage face descended from Highway Gothic: open, wide apertures, legible at a glance and at a distance. Hierarchy comes from weight (400 / 600 / 700 / 800) and size, never from a second family. Self-hosted from `assets/fonts/` (SIL OFL 1.1).

### Hierarchy
- **Display** (800, clamp(2.35rem, 7vw, 4.4rem), 0.98): the hero sign title only; its first word "Simulateur" is set smaller (0.62em, weight 700) but in the same white, as part of the name, never as an eyebrow.
- **Headline** (800, clamp(1.5rem, 2.6vw, 1.9rem), 1.15): step titles.
- **Figure** (800, clamp(2rem, 3.1vw, 2.55rem), tabular): the premium TTC on the meter sign.
- **Title** (800, 1.05–1.2rem): panel titles, fieldset legends, guarantee names, dialog titles.
- **Body** (400, 1rem, 1.5): running text and table cells (600–800 for amounts).
- **Label** (700, 0.95rem): field labels, buttons (1rem).
- **Hint** (400, 0.85rem, 1.4): explanations under fields; bold fragments carry the figure.

### Named Rules
**The Tabular Figures Rule.** Every amount, rate and count is set with tabular numerals and three decimals for dinars (`2,935.140 DT`), so columns align and totals can be checked by eye.

## Layout

A two-column workspace (max 1240px, 16px side gutter): the step content on the left, the sticky premium meter (340px) on the right, 24px apart. Above it runs the step route: three milestone markers joined by a lane line, dashed ahead and solid green behind. Below 1024px the meter moves under the content and a fixed blue bar at the bottom of the screen shows the premium whenever the meter sign is out of view. Below 760px form grids collapse to one column, the top bar keeps icon buttons only, and guarantee rows stack their franchise and capital under the description (container query at 700px). Below 560px dialogs become full-screen sheets and step navigation stacks with the forward action on top. Spacing rhythm: 4 / 8 / 16 / 24 / 40px, with 20px between blocks of a step.

## Elevation & Depth

Depth is physical and quiet: signs stand slightly off the concrete, panels sit on it. Shadows are neutral and always offset downward with a soft blur; there are no colored glows.

### Shadow Vocabulary
- **Panel** (`box-shadow: 0 1px 2px rgb(16 24 32 / .06), 0 10px 24px -14px rgb(16 24 32 / .24)`): white panels and formula cards.
- **Sign** (`box-shadow: 0 2px 4px rgb(16 24 32 / .16), 0 18px 36px -18px rgb(16 24 32 / .5)`): blue sign panels and the reduction plate, combined with the inset keyline.
- **Pop** (`box-shadow: 0 24px 64px -18px rgb(10 16 24 / .5)`): dialogs.

### Named Rules
**The Keyline Rule.** A sign is drawn with inset shadows, not borders: `inset 0 0 0 5px <sign color>, inset 0 0 0 7px white` for panels, 2px / 3.5px for buttons, 2.5px / 3.8px for tiles. The keyline follows the corner radius and changes color with the sign on hover.

## Shapes

Rounded rectangles throughout, with radii that grow with the object: fields and buttons 8px, panels 10px, signs 12px, the hero sign 18px, service tiles 9px, checkboxes 7px. Round shapes are reserved for Vienna-convention meanings: the blue disc means mandatory (the "Obligatoire" badge) and nothing else; user-chosen values such as the reduction rate sit on rectangular information plates. The only triangle is the warning sign. Arrows on signs (hero, brand mark, offer header) are filled sign arrows with a thick square-ended shaft and a broad triangular head; thin stroked arrows are reserved for button icons. Milestone markers have a rounded top and square-ish base (16px 16px 5px 5px) with a colored cap.

## Components

### Buttons
- **Shape:** gently rounded (8px), 48px tall, 60px for the hero call to action, 38px for list actions.
- **Blue (navigation):** Traffic Blue with the keyline; "Suivant", "Imprimer", "Charger", "Comparer les offres".
- **Green (confirm/finish):** Traffic Green with the keyline; "Commencer la simulation", "Voir l'offre", "Enregistrer".
- **Ghost:** white with a 1.5px Line Strong outline; "Précédent", "Fermer", "Réinitialiser".
- **Danger:** white with red text and red outline, filling red on hover; "Supprimer".
- **Hover / Focus:** hover deepens the sign color (keyline follows); forward arrows slide 3px. Focus is a 3px outline offset 2px: Traffic Black by day, Traffic Yellow by night and on blue surfaces.

### Sign panels
- **Style:** Traffic Blue, white text, keyline, Sign shadow. Used for the hero, the premium meter, the selected formula, the usage plate and the offer total. A 2px white rule divides a sign's head from its details.

### Service tiles (guarantee pictograms)
- **Style:** 44px blue square with a white 24px line pictogram (1.7–1.8 stroke, round caps) and keyline. The tile turns Tile Off grey when the guarantee is off or unavailable, like a switched-off service sign.

### Read-only facts
- A fixed value (the vehicle usage "Privé ou Affaires") is a read-only field on Panel Sunk with a small blue pictogram tile and a muted lock + "Usage fixe"; it must never look like a button.

### Inputs / Fields
- **Style:** white field, 1.5px Line Strong border, 8px radius, 48px tall; units ("DT") sit inside the field on the right; selects use a drawn chevron.
- **Focus:** border turns Traffic Blue with a 3px 28% blue ring (yellow by night).
- **Disabled:** 55% opacity, not-allowed cursor.
- **Hints:** muted text under the field; an attention hint becomes a yellow note with a warning triangle.

### Checkboxes and segmented control
- Checkboxes are 26px rounded squares that fill Traffic Blue with a white check; locked ones are a lighter blue. The segmented control (fractionnement) is a sunk track whose selected half becomes a small blue sign.

### Navigation
- **Top bar:** Traffic Blue band with a white keyline at its base, brand glyph (white square with a filled blue sign arrow), the full product name on every width (the tagline drops on phones), outlined white buttons for "Formulaire proposant", "Mes devis" (with a count badge) and the day/night toggle.
- **Step route:** milestone markers (cap grey ahead, blue current, green done), labels in bold, lane line dashed ahead and solid green behind. Every marker is a button. Below 480px only the current step keeps its label so the lane line keeps real length.

### Dialogs
- Blue header band with a white keyline base and a white close button; body scrolls; footer holds actions, primary on the right. The confirmation dialog uses a yellow header with the red-bordered warning triangle.

### Premium meter (signature)
- The blue sign that answers the whole flow: "Prime totale TTC", the figure rolling to its new value in 460ms with an exponential ease-out, and a three-column detail (Formule, Fractionnement, Réduction) under a white rule. Below it, the fixed-fee breakdown panel ends with the TTC total in blue.

### Constat amiable (Sinistre)
- A paper document that stays light in night mode: yellow A column, green B column, the 17 numbered circumstances in the middle, square boxes that receive a drawn blue cross, and the per-vehicle count of ticked boxes at the foot.
- The verdict follows the traffic code: green badge = non fautif, red = fautif, yellow = responsabilité partagée; the split bar uses the vehicle colors.
- Case numbers sit on white number plates keyed in blue (blue plates on white cards in the barème list).
- Sketches are drawn in SVG on a light road ground: curbs in dark grey, white lane markings, red impact star, black motion arrows.

### Printed offer
- A white A4 document regardless of theme: brand line and date over a 3px blue rule, key-value grids with dashed separators, the coverage table, a blue keylined total panel and the assistance note. Fits one page.

## Do's and Don'ts

### Do:
- **Do** give every new state its traffic color by meaning: blue to inform, yellow to warn, red to forbid or delete, green to confirm.
- **Do** draw signs with the inset keyline (5px color, 2px white) and a neutral offset shadow.
- **Do** set every amount in Overpass tabular figures with three decimals and "DT".
- **Do** give each guarantee or concept a line pictogram on a blue service tile, drawn on the 24px grid with round caps.
- **Do** keep the premium visible: the meter on desktop, the bottom bar on small screens.
- **Do** let content start visible: entrances move by transform only; the premium roll is the one authored motion.

### Don't:
- **Don't** use a signal color as decoration, or two signal colors for the same meaning.
- **Don't** put white text on Traffic Yellow.
- **Don't** add road scenery, illustrations, gradients, glows or glass; the grammar is the brand.
- **Don't** use emoji or Unicode symbols as icons.
- **Don't** introduce a second typeface or a monospace for figures.
