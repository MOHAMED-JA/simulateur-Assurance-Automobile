# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two confirmed audiences:

- **Agents and brokers (courtiers) in an insurance agency** who build a car insurance quote for a client at the counter or on the phone, print it as an offer, save it, and compare two saved quotes.
- **People the tool is shown or shared with**: clients looking at their own quote, and observers who open the public GitHub Pages site as a demonstration of the developer's work.

## Product Purpose

Turn a vehicle's characteristics and a chosen set of guarantees into a complete Tunisian car insurance premium, in dinars (DT, three decimals), with a transparent line-by-line breakdown: net premium, TUA tax, total per guarantee, then fixed fees and the final premium TTC. The result becomes a printable offer ("Offre d'Assurance Automobile") that can be saved in the browser and compared with another saved quote. Success is a correct, readable quote produced in a few minutes and handed to the client.

## Positioning

A single, dependable page that encodes a specific tariff (barème) end to end: RC-RTI priced by fiscal horsepower (2 to 45 CV) and bonus-malus class (1 to 11), guarantee-specific formulas, TUA at 12% (plus 2% on RC including contract cost), fixed contract fees, reduction rules that depend on the chosen formula, and eligibility rules that depend on vehicle age. Every figure is visible, so the agent can explain the price, not just quote it.

## Operating Context

- Inputs come from the vehicle's registration document (carte grise): number of seats, fiscal horsepower (CV), first registration date (PMEC/DPMEC), plus catalogue value (valeur à neuf) and market value (valeur vénale).
- Three-step flow: 1. Véhicule, 2. Garanties, 3. Résumé; then the offer.
- No amount is shown before it means something: the premium TTC and the fixed fees (coût du contrat, FSSR, FPAC, FGA) appear only once the PMEC date and the catalogue and market values are entered and the Garanties step has been opened.
- The PMEC date starts empty and is required (it drives eligibility: Dommages au véhicule over 5 years, Dommages et collision over 10 years); a future date is refused.
- A "Formulaire Proposant" captures the insured person (nom, prénom, CIN, adresse, mobile, email, agence), the vehicle (marque, modèle, DPMEC) and the contract (type renouvelable/ferme, date d'effet).
- The offer is printed on paper for the client.
- Saved quotes ("Mes devis") live only in the browser's localStorage. "Mes devis" lists them by client name with the vehicle and formula, searches by name, CIN, mobile, brand or power ("7 CV"), summarizes count, average and range of premiums, loads, deletes (undoable for 6 s) and compares exactly two (premium gap and differing items highlighted). It exports an Excel-ready CSV (";" separator, decimal comma, UTF-8 BOM), downloads a JSON backup and restores one (merging by id), and starts a "Nouveau devis" (undoable).

## Capabilities and Constraints

- Static single page (`index.html`), no build step, deployed to GitHub Pages from `main` by `.github/workflows/static.yml`. No backend.
- Installable web app: `manifest.webmanifest` (standalone, shortcuts Tarification and Sinistre, icons in `assets/icons/`) and a service worker `sw.js` that serves the network first and falls back to its cache offline (a page that takes more than 4 s falls back too). Bump `VERSION` in `sw.js` whenever the precached file list changes. The "Installer" button (home screen and top bar) opens a dialog with a QR code to `https://mohamed-ja.github.io/simulateur-Assurance-Automobile/#installer`, Android and iPhone steps, and a direct install button when the browser offers one; opening the `#installer` address shows that dialog at startup. A printable poster with the same QR code lives in `assets/qr/installer-application.png` (regenerate it if the public address changes).
- French UI. Currency formatting: three decimals with comma thousands separators (e.g. `2,935.140 DT`).
- localStorage keys in use and to stay compatible: `theme` (`light`, `dark` or `auto`; light when absent), `userFormData`, `savedOffers`, plus `textScale` (`large` when the bigger text is chosen).
- Usage is fixed to "Privé ou Affaires".
- RC-RTI net premium = base tariff (class 4) by fiscal horsepower × bonus-malus coefficient. Base tariff in DT: 2 CV 94; 3–4 CV 110; 5–6 CV 140; 7–10 CV 170; 11–14 CV 220; 15 CV and more 264 (reference: the agency's calculation workbook). Coefficients: class 1 → 0.7 … class 11 → 3.5.
- Tariffs confirmed by the user (1 October 2026): the application's values are the reference (Assistance 100 DT, Dommages et collision 30 + 8 % of the capital, Bris de glaces 9 % of the capital); the agency workbook is the one to correct.
- Twelve guarantees: RC-RTI, Défenses et Recours, Incendie, Vol, Dommages au véhicule, Dommages et collision, Bris de glaces, PTA, Individuel Accident, CAT/NAT, Emeutes et Mouvements populaires, Assistance Automobile.
- Formule basique (confirmed current behavior): the nine base guarantees are included and locked; Dommages au véhicule, Dommages et collision and Bris de glaces can still be added. Formule personnalisée: everything can be toggled except RC-RTI.
- Step 1 requires only the PMEC date and the valeur vénale. The valeur catalogue is optional (user decision, 1 October 2026): it is the capital of Dommages au véhicule, which stays unavailable until it is entered.
- Dommages au véhicule excludes Dommages et collision and Bris de glaces, and vice versa. Collision is unavailable for vehicles over 10 years, Dommages au véhicule for vehicles over 5 years.
- Reduction rate 0 to 80% in 5% steps, applied in both formulas (basique and personnalisée) to: Défenses et Recours, Incendie, Vol, Dommages au véhicule, Dommages et collision, PTA, Bris de glaces. Changing the formula keeps the rate.
- Fractionnement semestriel halves net premiums; fixed fees are unchanged: coût du contrat 25.000, FSSR 0.500, FPAC 0.300, FGA 3.000 DT.
- Sales tools (added after the redesign): target-premium calculator (finds the lowest 5 % step reaching a TTC target, or says it is impossible); three-formula proposals (Essentielle = basic 9, Confort = + Bris de glaces + Dommages et collision, Tous risques = + Dommages au véhicule) computed with the current vehicle and reduction, printable and applicable in one click; simulation link in the URL hash (no personal data), QR code on the share dialog and on the printed offer, WhatsApp (to the proposant's mobile when known) and email sharing.
- Productivity (added 1 October 2026): quick search with Ctrl K / ⌘ K (steps, actions, saved quotes, guarantees, barème cases); client presentation mode (full screen, premium, guarantees, breakdown, QR); "Où va votre prime" breakdown in step 3, the printed offer and the presentation; live +/− difference on the premium; home example priced with the real engine; Affichage menu (light by default, dark, automatic; larger text).
- Sinistre section (tab "Sinistre" in the header, direct link `#sinistre`): clickable FTUSA constat amiable (17 circumstances, vehicles A yellow / B green as on the official form), responsibility engine proposing the FTUSA barème case (25 cases, edition of 1 June 1999) with the A/B split (0, 1/4, 1/2, 3/4, 1), the full barème with a sketch per case and "Simuler sur le constat", a chain/successive-collision simulator (cases 24–25), and a 10-question training mode. Barème texts are transcribed verbatim in `assets/js/bareme-ftusa.js` (single source). The case proposed from the ticked boxes is a teaching aid; the insurer decides from the full constat.
- Terminology to keep: prime nette, TUA, prime totale TTC, franchise, capital, valeur vénale, valeur catalogue, classe bonus-malus, fractionnement, DPMEC/PMEC.

## Brand Commitments

- Product name: "Simulateur Assurance Automobile". Neutral: it carries no insurer's brand.
- Developer credit stays visible: "Développé par Mohamed Aziz Jaouadi", linking to his LinkedIn profile.
- The previous visual style (dark blue, red/blue gradients, rainbow borders, emoji icons) is explicitly discarded; so is the road-signage direction that replaced it.
- Visual direction chosen by the user (September 2026): the modern insurance-app standard, played straight, professional and "futuriste et moderne" in the sense of precise and calm, never neon. Craft reference: Alan and Lemonade (clarity), Stripe and Linear (precision, quiet motion). The app opens in light mode; the night mode must remain available.

## Evidence on Hand

- FTUSA barème de responsabilité (1er juin 1999, 4 pages) and the FTUSA constat amiable (2 pages), provided by the user; source https://www.ftusanet.org/userfiles/file/pdf/bareme2.pdf. The PDFs are not redistributed in the repository.

- Real content: the tariff rules, guarantee names and descriptions, and the assistance text in `index.html`.
- No logo, photography, testimonials, customer names, or partner insurer. None may be invented, and no insurer branding may be implied.

## Product Principles

1. The number is the product: every premium must be exact, and every figure must be explainable from the page.
2. Agent speed first: the common quote takes three steps and no hunting.
3. The printed offer is a document a client keeps; it must read as one.
4. Preserve behavior and stored data: a redesign never changes a price or loses a saved quote.
