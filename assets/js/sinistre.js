/*
 * Rubrique « Sinistre » : constat amiable interactif, barème de responsabilité
 * FTUSA et entraînement.
 *
 * - determine(input) : moteur pur qui propose le cas du barème à partir des
 *   cases cochées sur le constat et de quelques précisions.
 * - scene(n, roles) : croquis SVG de chaque cas (dessins originaux inspirés des
 *   croquis du barème).
 * - mount(root) : construit l'interface dans la section #sinistreView.
 *
 * Les textes du barème viennent exclusivement de window.BAREME_FTUSA.
 */
(function () {
  'use strict';

  const B = window.BAREME_FTUSA;
  if (!B) return;
  const CAS = Object.fromEntries(B.cas.map(c => [c.n, c]));
  const CIRC = Object.fromEntries(B.circonstances.map(c => [c.n, c.texte]));
  const FRAC = { '0': 0, '1/4': 0.25, '1/2': 0.5, '3/4': 0.75, '1': 1 };
  const NNBSP = ' ';
  const other = v => (v === 'A' ? 'B' : 'A');
  const pct = v => Math.round(v * 100) + NNBSP + '%';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = id => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
  const two = n => String(n).padStart(2, '0');
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = () => (reduceMotion() ? 'auto' : 'smooth');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } },
  };
  const toast = (...args) => { if (window.appToast) window.appToast(...args); };
  const announce = m => { if (window.appAnnounce) window.appAnnounce(m); };

  const SIGNALS = {
    agent: 'une signalisation d\'un agent de circulation',
    priorite: 'une signalisation de priorité (balise, STOP)',
    feu: 'un feu de signalisation',
    sens_interdit: 'un panneau de sens interdit',
    depasser: 'un panneau d\'interdiction de dépasser',
    virer: 'un panneau d\'interdiction de virer à droite ou à gauche',
    ligne: 'une ligne continue (véhicules circulant dans le même sens)',
    fleches: 'une signalisation au sol (flèches directionnelles)',
    trottoir: 'l\'interdiction de circuler sur un trottoir',
  };
  const STATIONNEMENT = {
    regulier: { n: 10, label: 'Stationnement ou arrêt régulier' },
    interdit_sans_gene: { n: 11, label: 'Interdit, en agglomération, le long d\'un trottoir, sans gêner la circulation' },
    interdit_gene: { n: 12, label: 'Interdit, en agglomération, avec une gêne réelle prouvée par le constat' },
    irregulier_hors: { n: 13, label: 'Irrégulier, sur la chaussée, hors agglomération' },
  };
  const CONFIGS = {
    meme: 'Même sens, même chaussée',
    inverse: 'Sens inverse',
    carrefour: 'Carrefour (deux chaussées)',
  };

  /* ================================================================
   * Croquis
   * ================================================================ */
  const COL = { X: '#ffd23f', Y: '#22a87a', A: '#ffd23f', B: '#22a87a', park: '#a3a5a1', ink: '#1b1d21', road: '#c9ccc8', verge: '#efefeb', grass: '#dde5d3', mark: '#ffffff', curb: '#3b3e43', red: '#c4161c' };
  let uid = 0;

  function roadSvg(type) {
    const dash = 'stroke="#fff" stroke-width="2" stroke-dasharray="9 7"';
    const curbs = (y1, y2) => `<rect x="0" y="${y1 - 3}" width="240" height="3" fill="${COL.curb}"/><rect x="0" y="${y2}" width="240" height="3" fill="${COL.curb}"/>`;
    switch (type) {
      case 'meme':
        return `<rect width="240" height="150" fill="${COL.verge}"/><rect y="28" width="240" height="94" fill="${COL.road}"/>${curbs(28, 122)}<line x1="0" y1="75" x2="240" y2="75" ${dash}/>`;
      case 'inverse':
        return `<rect width="240" height="150" fill="${COL.verge}"/><rect y="28" width="240" height="94" fill="${COL.road}"/>${curbs(28, 122)}<line x1="0" y1="75" x2="240" y2="75" ${dash}/>`;
      case 'rue':
        return `<rect width="240" height="150" fill="${COL.verge}"/><rect y="34" width="240" height="82" fill="${COL.road}"/>${curbs(34, 116)}<line x1="0" y1="66" x2="240" y2="66" ${dash}/><line x1="0" y1="98" x2="240" y2="98" stroke="#fff" stroke-width="1.2" stroke-dasharray="3 5"/>`;
      case 'route':
        return `<rect width="240" height="150" fill="${COL.grass}"/><rect y="40" width="240" height="70" fill="${COL.road}"/><line x1="0" y1="43" x2="240" y2="43" stroke="#fff" stroke-width="1.6"/><line x1="0" y1="107" x2="240" y2="107" stroke="#fff" stroke-width="1.6"/><line x1="0" y1="75" x2="240" y2="75" ${dash}/>`;
      case 'prive':
        return `<rect width="240" height="150" fill="${COL.verge}"/><rect y="34" width="240" height="82" fill="${COL.road}"/><rect x="150" y="116" width="38" height="34" fill="${COL.road}"/><rect x="0" y="116" width="150" height="3" fill="${COL.curb}"/><rect x="188" y="116" width="52" height="3" fill="${COL.curb}"/><rect x="0" y="31" width="240" height="3" fill="${COL.curb}"/><rect x="146" y="116" width="4" height="34" fill="${COL.curb}"/><rect x="188" y="116" width="4" height="34" fill="${COL.curb}"/><line x1="0" y1="75" x2="240" y2="75" ${dash}/>`;
      case 'prive2':
        return `<rect width="240" height="150" fill="${COL.verge}"/><rect y="28" width="240" height="94" fill="${COL.road}"/><rect x="150" y="122" width="38" height="28" fill="${COL.road}"/><rect x="0" y="25" width="240" height="3" fill="${COL.curb}"/><rect x="0" y="122" width="150" height="3" fill="${COL.curb}"/><rect x="188" y="122" width="52" height="3" fill="${COL.curb}"/><rect x="146" y="122" width="4" height="28" fill="${COL.curb}"/><rect x="188" y="122" width="4" height="28" fill="${COL.curb}"/><line x1="0" y1="75" x2="240" y2="75" ${dash}/>`;
      case 'carrefour': {
        const corner = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${COL.verge}"/>`;
        return `<rect width="240" height="150" fill="${COL.road}"/>${corner(-6, -6, 101, 56)}${corner(145, -6, 101, 56)}${corner(-6, 100, 101, 56)}${corner(145, 100, 101, 56)}` +
          `<path d="M0 50 H89 Q95 50 95 44 V0 M145 0 V44 Q145 50 151 50 H240 M240 100 H151 Q145 100 145 106 V150 M95 150 V106 Q95 100 89 100 H0" fill="none" stroke="${COL.curb}" stroke-width="3"/>` +
          `<line x1="0" y1="75" x2="92" y2="75" ${dash}/><line x1="148" y1="75" x2="240" y2="75" ${dash}/><line x1="120" y1="0" x2="120" y2="47" ${dash}/><line x1="120" y1="103" x2="120" y2="150" ${dash}/>`;
      }
      default:
        return `<rect width="240" height="150" fill="${COL.road}"/>`;
    }
  }

  function carSvg(x, y, rot, fill, letter, o = {}) {
    const beams = o.beams ? `<path d="M18 -7 L70 -24 L70 24 L18 7 Z" fill="#fff4b8" opacity=".9"/>` : '';
    const door = o.door ? `<line x1="-3" y1="-9.5" x2="-12" y2="-21" stroke="${COL.ink}" stroke-width="2.6" stroke-linecap="round"/>` : '';
    const label = letter ? `<g transform="rotate(${-rot})"><circle r="7.2" fill="#fff" stroke="${COL.ink}" stroke-width="1.1"/><text y="3.7" text-anchor="middle" font-size="10.5" font-weight="800" fill="${COL.ink}" font-family="Geist, system-ui, sans-serif">${letter}</text></g>` : '';
    return `<g transform="translate(${x} ${y}) rotate(${rot})">${beams}<rect x="-18" y="-9.5" width="36" height="19" rx="4.5" fill="${fill}" stroke="${COL.ink}" stroke-width="1.3"/><rect x="4" y="-7.4" width="6.5" height="14.8" rx="1.6" fill="${COL.ink}" opacity=".55"/><rect x="-14.5" y="-6.4" width="4" height="12.8" rx="1.3" fill="${COL.ink}" opacity=".32"/>${door}${label}</g>`;
  }

  function star(x, y, r = 7.5) {
    let d = '';
    for (let i = 0; i < 16; i++) {
      const rad = (i % 2 ? r * 0.45 : r);
      const a = (Math.PI * 2 * i) / 16 - Math.PI / 2;
      d += (i ? 'L' : 'M') + (x + rad * Math.cos(a)).toFixed(1) + ' ' + (y + rad * Math.sin(a)).toFixed(1);
    }
    return `<path d="${d}Z" fill="${COL.red}" stroke="#fff" stroke-width="1"/>`;
  }

  const EXTRA = {
    stop: (x, y) => `<g transform="translate(${x} ${y})"><line x1="0" y1="8" x2="0" y2="22" stroke="${COL.ink}" stroke-width="1.6"/><path d="M-4.1 -10 H4.1 L10 -4.1 V4.1 L4.1 10 H-4.1 L-10 4.1 V-4.1 Z" fill="${COL.red}" stroke="#fff" stroke-width="1.3"/><text y="2.4" text-anchor="middle" font-size="5.6" font-weight="800" fill="#fff" font-family="Geist, system-ui, sans-serif">STOP</text></g>`,
    stopline: (x1, x2, y) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#fff" stroke-width="3"/>`,
    feu: (x, y) => `<g transform="translate(${x} ${y})"><line x1="0" y1="18" x2="0" y2="32" stroke="${COL.ink}" stroke-width="1.6"/><rect x="-6.5" y="-18" width="13" height="36" rx="3" fill="${COL.ink}"/><circle cy="-10" r="3.6" fill="#e4474d"/><circle cy="0" r="3.6" fill="#f5b400"/><circle cy="10" r="3.6" fill="#2fbf71"/><circle cx="17" cy="-12" r="8.5" fill="#fff" stroke="${COL.ink}" stroke-width="1.2"/><text x="17" y="-8.2" text-anchor="middle" font-size="11" font-weight="800" fill="${COL.ink}" font-family="Geist, system-ui, sans-serif">?</text></g>`,
    parking: (x, y) => `<g transform="translate(${x} ${y})"><line x1="0" y1="8" x2="0" y2="20" stroke="${COL.ink}" stroke-width="1.6"/><rect x="-8" y="-8" width="16" height="16" rx="2.5" fill="#0b4f94" stroke="#fff" stroke-width="1.2"/><text y="4.8" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" font-family="Geist, system-ui, sans-serif">P</text></g>`,
    interdit: (x, y) => `<g transform="translate(${x} ${y})"><line x1="0" y1="9" x2="0" y2="20" stroke="${COL.ink}" stroke-width="1.6"/><circle r="9" fill="#0b4f94" stroke="${COL.red}" stroke-width="3"/><line x1="-6" y1="-6" x2="6" y2="6" stroke="${COL.red}" stroke-width="2.6"/></g>`,
    panne: (x, y) => `<g transform="translate(${x} ${y})"><path d="M0 -8 L8 6 H-8 Z" fill="#fff" stroke="${COL.red}" stroke-width="2.2" stroke-linejoin="round"/></g>`,
    pierres: () => `<path d="M150 95 Q128 80 104 94" fill="none" stroke="${COL.ink}" stroke-width="1.2" stroke-dasharray="3 3"/>${[[142, 88], [132, 85], [122, 86], [113, 89]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#6b6e6a" stroke="${COL.ink}" stroke-width=".8"/>`).join('')}`,
    nuit: () => `<rect width="240" height="150" fill="#1d2330" opacity=".55"/>`,
  };

  // Scènes : r = rôle X ou Y (X en jaune, Y en vert comme dans le barème)
  const SCENES = {
    1: { road: 'meme', cars: [{ r: 'X', x: 150, y: 97, rot: 0 }, { r: 'Y', x: 113, y: 97, rot: 0 }], arrows: ['M34 97 H86', 'M176 97 H214'], impacts: [[132, 97]] },
    2: { road: 'meme', cars: [{ r: 'X', x: 138, y: 64, rot: 0 }, { r: 'Y', x: 132, y: 86, rot: 0 }], arrows: ['M40 64 H106', 'M40 86 H100'], impacts: [[141, 75]] },
    3: { road: 'inverse', cars: [{ r: 'X', x: 126, y: 68, rot: 0 }, { r: 'Y', x: 132, y: 93, rot: -24 }], arrows: ['M34 68 H94', 'M34 99 H100'], impacts: [[146, 80]] },
    4: { road: 'meme', cars: [{ r: 'X', x: 152, y: 99, rot: 0 }, { r: 'Y', x: 118, y: 76, rot: 26 }], arrows: ['M34 99 H100', 'M34 52 H84'], impacts: [[134, 88]] },
    5: { road: 'rue', cars: [{ r: 'X', x: 154, y: 82, rot: 0 }, { r: 'Y', x: 118, y: 99, rot: -24 }], parked: [[58, 107, 0], [206, 107, 0]], arrows: ['M34 82 H96'], impacts: [[136, 90]] },
    6: { road: 'inverse', cars: [{ r: 'X', x: 99, y: 97, rot: 0 }, { r: 'Y', x: 136, y: 83, rot: 180 }], arrows: ['M26 97 H66', 'M214 58 H172'], impacts: [[118, 90]] },
    7: { road: 'inverse', cars: [{ r: 'X', x: 99, y: 80, rot: 0 }, { r: 'Y', x: 137, y: 70, rot: 180 }], arrows: ['M26 92 H66', 'M214 58 H172'], impacts: [[118, 75]] },
    8: { road: 'carrefour', cars: [{ r: 'X', x: 152, y: 88, rot: 180 }, { r: 'Y', x: 132, y: 116, rot: -90 }], arrows: ['M226 108 H196', 'M154 146 V128'], impacts: [[133, 97]] },
    9: { road: 'carrefour', cars: [{ r: 'X', x: 142, y: 62, rot: 180 }, { r: 'Y', x: 132, y: 92, rot: -90 }], arrows: ['M226 42 H196', 'M154 146 V118'], impacts: [[132, 72]] },
    10: { road: 'rue', cars: [{ r: 'X', x: 142, y: 107, rot: 0 }, { r: 'Y', x: 104, y: 99, rot: -8 }], arrows: ['M26 88 H74'], impacts: [[122, 99]], extras: [['parking', 182, 124]] },
    11: { road: 'rue', cars: [{ r: 'X', x: 142, y: 107, rot: 0 }, { r: 'Y', x: 104, y: 99, rot: -8 }], arrows: ['M26 88 H74'], impacts: [[122, 99]], extras: [['interdit', 182, 124]] },
    12: { road: 'rue', cars: [{ r: 'X', x: 142, y: 82, rot: 0 }, { r: 'Y', x: 104, y: 82, rot: 0 }], parked: [[142, 107, 0], [196, 107, 0], [60, 107, 0]], arrows: ['M26 82 H72'], impacts: [[123, 82]], extras: [['interdit', 222, 124]] },
    13: { road: 'route', cars: [{ r: 'X', x: 152, y: 92, rot: 0 }, { r: 'Y', x: 115, y: 92, rot: 0 }], arrows: ['M26 92 H84'], impacts: [[134, 92]] },
    14: { road: 'carrefour', cars: [{ r: 'X', x: 122, y: 88, rot: 0 }, { r: 'Y', x: 132, y: 117, rot: -90 }], arrows: ['M40 88 H90', 'M110 146 V130'], impacts: [[132, 98]], extras: [['stopline', 121, 145, 101], ['stop', 160, 116]] },
    15: { road: 'meme', cars: [{ r: 'X', x: 86, y: 97, rot: 0 }, { r: 'Y', x: 123, y: 97, rot: 0 }], arrows: ['M150 82 H116'], dashedArrows: true, impacts: [[104, 97]] },
    16: { road: 'prive', cars: [{ r: 'X', x: 150, y: 96, rot: 0 }, { r: 'Y', x: 169, y: 128, rot: -90 }], arrows: ['M34 96 H112', 'M204 146 V128'], impacts: [[168, 108]] },
    17: { road: 'prive', cars: [{ r: 'X', x: 160, y: 104, rot: 38 }, { r: 'Y', x: 124, y: 96, rot: 0 }], arrows: ['M34 96 H92'], impacts: [[144, 96]] },
    18: { road: 'prive2', cars: [{ r: 'X', x: 150, y: 84, rot: 34 }, { r: 'Y', x: 124, y: 102, rot: 0 }], arrows: ['M34 52 H104', 'M34 102 H92'], impacts: [[142, 96]] },
    19: { road: 'rue', cars: [{ r: 'X', x: 122, y: 84, rot: 0 }, { r: 'Y', x: 152, y: 107, rot: 0, door: true }], arrows: ['M26 84 H90'], impacts: [[140, 88]] },
    20: { road: 'meme', cars: [{ r: 'X', x: 84, y: 97, rot: 0 }, { r: 'Y', x: 170, y: 97, rot: 0 }], arrows: ['M196 110 H224'], impacts: [[102, 94]], extras: [['pierres']] },
    21: { road: 'route', night: true, cars: [{ r: 'X', x: 88, y: 92, rot: 0, beams: true }, { r: 'Y', x: 126, y: 92, rot: 0 }], arrows: [], impacts: [[107, 92]] },
    22: { road: 'rue', night: true, cars: [{ r: 'X', x: 88, y: 82, rot: 0, beams: true }, { r: 'Y', x: 126, y: 82, rot: 0 }], arrows: [], impacts: [[107, 82]] },
    23: { road: 'carrefour', cars: [{ r: 'X', x: 122, y: 88, rot: 0 }, { r: 'Y', x: 132, y: 117, rot: -90 }], arrows: ['M40 88 H90', 'M110 146 V130'], impacts: [[132, 98]], extras: [['feu', 160, 124]] },
  };

  function scene(n, roles, opts = {}) {
    const s = SCENES[n];
    if (!s) return '';
    const id = 'ah' + (++uid);
    const mapLetter = r => (roles ? roles[r] : r);
    const fillOf = r => (roles ? COL[roles[r]] : COL[r]);
    let body = roadSvg(s.road);
    (s.extras || []).forEach(([k, ...a]) => { if (k !== 'pierres') body += EXTRA[k](...a); });
    (s.parked || []).forEach(([x, y, rot]) => { body += carSvg(x, y, rot, COL.park, ''); });
    if (s.night) body += EXTRA.nuit();
    const mover = c => `<g class="mover" data-r="${c.r}">${carSvg(c.x, c.y, c.rot, fillOf(c.r), mapLetter(c.r), c)}</g>`;
    s.cars.filter(c => c.beams).forEach(c => { body += mover(c); });
    s.cars.filter(c => !c.beams).forEach(c => { body += mover(c); });
    (s.extras || []).forEach(([k, ...a]) => { if (k === 'pierres') body += EXTRA.pierres(...a); });
    const arrowColor = s.night ? '#fff' : COL.ink;
    (s.arrows || []).forEach(d => { body += `<path class="trail" d="${d}" fill="none" stroke="${arrowColor}" stroke-width="1.8" ${s.dashedArrows ? 'stroke-dasharray="4 3"' : ''} marker-end="url(#${id})"/>`; });
    (s.impacts || []).forEach(([x, y]) => { body += `<g class="impact">${star(x, y)}</g>`; });
    const label = opts.label || `Croquis du cas ${n}`;
    return `<svg class="scene" viewBox="0 0 240 150" data-case="${n}" role="img" aria-label="${esc(label)}"><defs><marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${arrowColor}"/></marker></defs>${body}</svg>`;
  }

  // Accidents en chaîne (24) et chocs successifs (25)
  function chainScene(kind, count, payers) {
    const n = Math.max(2, Math.min(6, count));
    const letters = 'ABCDEF'.slice(0, n).split('');
    const gap = Math.min(52, 200 / n);
    const width = 40 + gap * (n - 1) + 40;
    const id = 'ah' + (++uid);
    let body = `<rect width="${width}" height="80" fill="${COL.verge}"/><rect y="18" width="${width}" height="44" fill="${COL.road}"/>`;
    letters.forEach((l, i) => {
      const x = width - 30 - i * gap;
      const fill = payers.includes(l) ? '#ff8a8e' : '#e6e7e3';
      body += carSvg(x, 40, 0, fill, l);
      if (i > 0) {
        body += star(x + 19, 40, 6);
        body += `<path d="M${x - 34} 70 H${x - 8}" fill="none" stroke="${COL.ink}" stroke-width="1.6" marker-end="url(#${id})"/>`;
      }
    });
    return `<svg class="scene scene--chain" viewBox="0 0 ${width} 80" role="img" aria-label="${kind === 24 ? 'Accident en chaîne' : 'Chocs successifs'} avec ${n} véhicules"><defs><marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${COL.ink}"/></marker></defs>${body}</svg>`;
  }

  /* ================================================================
   * Moteur : du constat au cas du barème
   * ================================================================ */
  function determine(input) {
    const inp = input || {};
    const bx = { A: new Set((inp.boxes && inp.boxes.A) || []), B: new Set((inp.boxes && inp.boxes.B) || []) };
    const sp = inp.specials || {};
    const has = (v, n) => bx[v].has(n);
    const who = n => ['A', 'B'].filter(v => has(v, n));
    const box = n => `la case ${n} « ${CIRC[n]} »`;
    const anySpecial = sp.desaccord || sp.signal || sp.portiere || sp.jets || sp.eclairage || sp.demitour;
    if (!bx.A.size && !bx.B.size && !anySpecial) return { status: 'empty' };

    const result = (n, X, extra = {}) => {
      const c = CAS[n];
      const Y = other(X);
      return { status: 'ok', n, roles: { X, Y }, resp: { [X]: FRAC[c.x], [Y]: FRAC[c.y] }, why: extra.why || '', checks: extra.checks || c.notes || [], variant: extra.variant || null };
    };
    const shared = (n, why, variant) => ({ status: 'ok', n, roles: { X: 'A', Y: 'B' }, resp: { A: 0.5, B: 0.5 }, why, checks: variant ? [] : (CAS[n].notes || []), variant: variant || null });
    const conflict = message => ({ status: 'conflict', message });
    const incomplete = (ask, message) => ({ status: 'incomplete', ask, message });
    const none = message => ({ status: 'none', message });

    // Cas 23 : désaccord
    if (sp.desaccord) return shared(23, 'Les conducteurs sont en désaccord sur la couleur des feux ou sur l\'origine de l\'accident.');

    // Cas 14 : signalisation non respectée
    const sig = new Set(who(17));
    if (sp.signal) sig.add(sp.signal);
    if (sig.size === 2) return conflict('A et B sont tous deux déclarés en infraction à une signalisation : situation contradictoire que le barème ne tranche pas. En cas de désaccord sur l\'origine de l\'accident, le cas 23 s\'applique (50 / 50).');

    let base;
    if (sig.size === 1) {
      const Y = [...sig][0];
      const why = sp.signal === Y && sp.signalType ? `${Y} n'a pas respecté ${SIGNALS[sp.signalType]}.` : `${Y} a coché ${box(17)}.`;
      base = result(14, other(Y), { why });
    } else if (sp.portiere) {
      base = result(19, other(sp.portiere), { why: `Ouverture d'une portière du véhicule ${sp.portiere}.` });
    } else if (sp.jets) {
      base = result(20, other(sp.jets), { why: `Le véhicule ${sp.jets} a causé des dommages par jets de pierres ou par des objets transportés.` });
    } else {
      base = fromBoxes();
    }

    // Cas 21 / 22 : circulation sans éclairage
    if (sp.eclairage) {
      const Y = sp.eclairage;
      const X = other(Y);
      if (inp.agglo == null) return incomplete(['agglo'], `${Y} circulait sans éclairage : précisez si l'accident a eu lieu en agglomération (cas 22) ou hors agglomération (cas 21).`);
      if (!inp.agglo) return result(21, X, { why: `${Y} circulait sans éclairage hors agglomération.` });
      if (base.status === 'ok' && base.resp[X] > 0) {
        const grave = base.n === 14 && sig.has(X) && sp.signal === X && ['agent', 'feu', 'sens_interdit'].includes(sp.signalType);
        if (grave) {
          return { ...result(22, X), resp: { [X]: 1, [Y]: 0 }, why: `${Y} circulait sans éclairage en agglomération, mais ${X} n'a pas respecté ${SIGNALS[sp.signalType]}.`, checks: [], variant: `Exception prévue au cas 22 : ${X} ne respecte pas une signalisation d'un agent de circulation, un feu de signalisation ou un panneau de sens interdit, ${X} est responsable à 100 %.` };
        }
        return result(22, X, { why: `${Y} circulait sans éclairage en agglomération et ${X} a lui-même commis une faute prévue par le barème (cas ${base.n}).` });
      }
      const note = `Éclairage : le cas 22 ne s'applique que si le véhicule ${X} a commis une faute prévue par le barème.`;
      if (base.status === 'ok') return { ...base, checks: [...base.checks, note] };
      if (base.status === 'empty') return none(`${Y} circulait sans éclairage en agglomération, mais aucune faute de ${X} n'est déclarée : le cas 22 ne s'applique pas. Complétez le constat.`);
      return { ...base, message: base.message + ' ' + note };
    }
    return base;

    function fromBoxes() {
      if (!bx.A.size && !bx.B.size && !sp.demitour) return { status: 'empty' };
      // 10 à 13 : stationnement
      if (has('A', 1) && has('B', 1)) return conflict('Les deux véhicules ne peuvent pas être tous deux « en stationnement » au moment du choc.');
      const parked = who(1);
      if (parked.length) {
        const X = parked[0];
        if (!inp.stationnement) return incomplete(['stationnement'], `${X} était en stationnement : précisez sa nature pour choisir entre les cas 10 à 13.`);
        const st = STATIONNEMENT[inp.stationnement];
        return result(st.n, X, { why: `${X} a coché ${box(1)} : ${st.label.toLowerCase()}.` });
      }
      // 5 et 15 : manœuvres
      const man = v => has(v, 2) || has(v, 3) || has(v, 14) || sp.demitour === v;
      const m = ['A', 'B'].filter(man);
      if (m.length === 2) {
        const parkingOnly = ['A', 'B'].every(v => (has(v, 2) || has(v, 3)) && !has(v, 14) && sp.demitour !== v);
        return parkingOnly
          ? shared(5, 'A et B manœuvraient tous les deux pour quitter ou prendre un stationnement.', CAS[5].notes[1])
          : shared(15, 'A et B effectuaient chacun une manœuvre prévue au cas 15 (marche arrière, demi-tour, stationnement).', CAS[15].notes[1]);
      }
      if (m.length === 1) {
        const Y = m[0];
        const X = other(Y);
        if (has(Y, 14)) return result(15, X, { why: `${Y} a coché ${box(14)}.` });
        if (sp.demitour === Y) return result(15, X, { why: `${Y} effectuait un demi-tour.` });
        if (has(Y, 3)) return result(15, X, { why: `${Y} a coché ${box(3)}.` });
        return result(5, X, { why: `${Y} a coché ${box(2)} : il déboîtait pour quitter le stationnement.` });
      }
      // 16, 17, 18 : parking, lieu privé, chemin de terre
      const sortie = who(4);
      const entree = who(5);
      if (sortie.length === 2 || entree.length === 2) return conflict('A et B ont coché la même case 4 ou 5 : déclarations incompatibles pour un même choc.');
      if (sortie.length === 1) {
        const Y = sortie[0];
        if (entree.length === 1 && has(entree[0], 10)) return conflict('Les cas 16 (sortie d\'un lieu privé) et 18 (engagement avec changement de file) désignent chacun un véhicule différent : le barème ne tranche pas.');
        return result(16, other(Y), { why: `${Y} a coché ${box(4)}.` });
      }
      if (entree.length === 1) {
        const X = entree[0];
        if (has(X, 10)) return result(18, X, { why: `${X} a coché ${box(5)} et ${box(10)}.` });
        return result(17, X, { why: `${X} a coché ${box(5)}, sans changement de file.` });
      }
      // 3 et 4 : changement de file
      const lc = who(10);
      if (lc.length === 2) return none('A et B changeaient tous les deux de file : ce cas n\'est pas prévu par le barème FTUSA. La responsabilité relève de l\'appréciation du gestionnaire ; en cas de désaccord sur l\'origine de l\'accident, le cas 23 s\'applique (50 / 50).');
      if (lc.length === 1) {
        const Y = lc[0];
        const X = other(Y);
        if (has(X, 11) && has(X, 15)) return result(3, X, { why: `${Y} a coché ${box(10)} pendant que ${X} doublait (case 11) en empiétant sur l'axe médian (case 15).` });
        return result(4, X, { why: `${Y} a coché ${box(10)}.` });
      }
      // 1 : choc arrière
      const arr = who(8);
      if (arr.length === 2) return conflict('A et B déclarent chacun avoir heurté l\'autre à l\'arrière : déclarations contradictoires.');
      if (arr.length === 1) return result(1, other(arr[0]), { why: `${arr[0]} a coché ${box(8)} : le véhicule heurté à l'arrière n'est pas en tort.` });
      // 2 : frottement
      if (who(7).length) return shared(2, `${who(7).join(' et ')} ${who(7).length > 1 ? 'ont' : 'a'} coché ${box(7)}.`);
      // Configuration du croquis
      const cfg = inp.config;
      if (!cfg) return incomplete(['config'], 'Les cases cochées ne suffisent pas à elles seules : indiquez la configuration de l\'accident (même sens, sens inverse ou carrefour), comme sur le croquis.');
      if (cfg === 'inverse') {
        const emp = ['A', 'B'].filter(v => has(v, 15) || has(v, 13));
        if (emp.length === 2) return shared(7, 'A et B empiétaient l\'un et l\'autre sur l\'axe médian.');
        if (emp.length === 1) {
          const Y = emp[0];
          const detail = has(Y, 15) ? box(15) : `${box(13)} (il coupait la voie inverse pour emprunter une chaussée à gauche)`;
          if (inp.axeProuve == null) return incomplete(['axe'], `${Y} a coché ${detail} : précisez si la position des véhicules par rapport à l'axe médian est prouvée.`);
          if (!inp.axeProuve) return shared(7, `La position des véhicules par rapport à l'axe médian n'est pas établie.`);
          return result(6, other(Y), { why: `${Y} a coché ${detail} ; ${other(Y)} circulait dans son couloir de marche.` });
        }
        return shared(7, 'Aucun des deux véhicules ne déclare avoir empiété : leur position par rapport à l\'axe médian ne peut être déterminée.');
      }
      if (cfg === 'carrefour') {
        const dr = who(16);
        if (dr.length === 2) return conflict('A et B déclarent tous deux venir de droite : déclarations incompatibles.');
        if (!dr.length) return incomplete(['droite'], 'Au carrefour, le barème s\'appuie sur la priorité de droite : cochez la case 16 « venait de droite » pour le véhicule concerné.');
        const X = dr[0];
        if (has(X, 15)) {
          if (inp.axeProuve == null) return incomplete(['axe'], `${X}, prioritaire de droite, a aussi coché ${box(15)} : précisez si sa position par rapport à l'axe médian est prouvée sans ambiguïté.`);
          if (inp.axeProuve) return result(8, X, { why: `${X} venait de droite (case 16) mais empiétait sur l'axe médian (case 15), position prouvée.` });
          return result(9, X, { why: `${X} venait de droite (case 16). Son empiètement n'étant pas prouvé sans ambiguïté, le cas 8 ne s'applique pas.` });
        }
        return result(9, X, { why: `${X} a coché ${box(16)} : il est prioritaire de droite.` });
      }
      return none('Même sens de circulation : aucune case cochée ne correspond à un cas du barème (changement de file, choc arrière, frottement, stationnement…). Complétez le constat.');
    }
  }

  // Un constat type par cas, pour « Simuler » et l'entraînement
  const PRESETS = {
    1: { boxes: { A: [6], B: [8] } },
    2: { config: 'meme', boxes: { A: [7, 9], B: [7, 9] } },
    3: { config: 'meme', boxes: { A: [11, 15], B: [10] } },
    4: { config: 'meme', boxes: { A: [9], B: [10] } },
    5: { boxes: { A: [], B: [2] } },
    6: { config: 'inverse', boxes: { A: [], B: [15] }, axeProuve: true },
    7: { config: 'inverse', boxes: { A: [15], B: [15] } },
    8: { config: 'carrefour', boxes: { A: [16, 15], B: [] }, axeProuve: true },
    9: { config: 'carrefour', boxes: { A: [16], B: [13] } },
    10: { boxes: { A: [1], B: [] }, stationnement: 'regulier' },
    11: { boxes: { A: [1], B: [] }, stationnement: 'interdit_sans_gene' },
    12: { boxes: { A: [1], B: [] }, stationnement: 'interdit_gene' },
    13: { boxes: { A: [1], B: [] }, stationnement: 'irregulier_hors' },
    14: { config: 'carrefour', boxes: { A: [], B: [17] } },
    15: { boxes: { A: [6], B: [14] } },
    16: { boxes: { A: [], B: [4] } },
    17: { boxes: { A: [5, 12], B: [] } },
    18: { boxes: { A: [5, 10, 12], B: [9] } },
    19: { boxes: { A: [], B: [1] }, stationnement: 'regulier', specials: { portiere: 'B' } },
    20: { boxes: { A: [], B: [] }, specials: { jets: 'B' } },
    21: { boxes: { A: [8], B: [] }, specials: { eclairage: 'B' }, agglo: false },
    22: { boxes: { A: [8], B: [6] }, specials: { eclairage: 'B' }, agglo: true },
    23: { config: 'carrefour', boxes: { A: [], B: [] }, specials: { desaccord: true } },
  };

  function swapInput(p) {
    const s = JSON.parse(JSON.stringify(p));
    s.boxes = { A: (p.boxes && p.boxes.B) || [], B: (p.boxes && p.boxes.A) || [] };
    if (s.specials) Object.keys(s.specials).forEach(k => { if (s.specials[k] === 'A' || s.specials[k] === 'B') s.specials[k] = other(s.specials[k]); });
    return s;
  }

  /* ================================================================
   * Interface
   * ================================================================ */
  const blank = () => ({ config: null, boxes: { A: [], B: [] }, stationnement: null, axeProuve: null, agglo: null, specials: { signal: null, signalType: 'priorite', demitour: null, portiere: null, jets: null, eclairage: null, desaccord: false } });
  let st = blank();
  let root = null;
  const q = sel => root.querySelector(sel);
  const qa = sel => Array.from(root.querySelectorAll(sel));

  function verdictLabel(v) {
    if (v === 0) return { cls: 'ok', txt: 'Non fautif' };
    if (v === 1) return { cls: 'fault', txt: 'Fautif' };
    if (v === 0.5) return { cls: 'shared', txt: 'Responsabilité partagée' };
    return { cls: 'shared', txt: v > 0.5 ? 'Responsabilité majoritaire' : 'Responsabilité minoritaire' };
  }
  const caseNoHtml = n => `<span class="case-plate" aria-hidden="true">${two(n)}</span>`;

  function respBar(resp, labels = { A: 'A', B: 'B' }, keys = ['A', 'B']) {
    const [k1, k2] = keys;
    return `<div class="resp-bar" role="img" aria-label="${labels[k1]} ${pct(resp[k1])}, ${labels[k2]} ${pct(resp[k2])}">
      ${[k1, k2].filter(k => resp[k] > 0).map(k => `<span class="resp-seg resp-seg--${k.toLowerCase()}" style="flex-grow:${resp[k]}">${labels[k]} ${pct(resp[k])}</span>`).join('')}
    </div>`;
  }

  function buildHtml() {
    const rows = B.circonstances.map(c => `
      <div class="cst-row">
        <label class="cst-box cst-box--a"><input type="checkbox" data-v="A" data-n="${c.n}"><span class="cst-mark" aria-hidden="true"></span><span class="sr-only">Véhicule A : ${esc(c.texte)}</span></label>
        <div class="cst-label"><span class="cst-num">${c.n}</span><span class="cst-text">${esc(c.texte)}</span><span class="cst-num">${c.n}</span></div>
        <label class="cst-box cst-box--b"><input type="checkbox" data-v="B" data-n="${c.n}"><span class="cst-mark" aria-hidden="true"></span><span class="sr-only">Véhicule B : ${esc(c.texte)}</span></label>
      </div>`).join('');
    const seg3 = (name, labels) => `<div class="tri" role="radiogroup" aria-label="${esc(labels)}">
      <label><input type="radio" name="${name}" value=""><span>Aucun</span></label>
      <label><input type="radio" name="${name}" value="A"><span>A</span></label>
      <label><input type="radio" name="${name}" value="B"><span>B</span></label></div>`;
    const specials = [
      ['signal', 'N\'a pas respecté une signalisation', 14],
      ['demitour', 'Effectuait un demi-tour', 15],
      ['portiere', 'Ouverture d\'une portière', 19],
      ['jets', 'Jets de pierres ou objets transportés', 20],
      ['eclairage', 'Circulait sans éclairage', '21-22'],
    ];
    return `
    <div class="sin-tabs" role="tablist" aria-label="Rubrique sinistre">
      <button type="button" role="tab" class="sin-tab" id="sinTabConstat" aria-controls="sinPanelConstat" aria-selected="true">${icon('i-list')}<span class="tab-long">Constat interactif</span><span class="tab-short">Constat</span></button>
      <button type="button" role="tab" class="sin-tab" id="sinTabDecl" aria-controls="sinPanelDecl" aria-selected="false">${icon('i-pen')}<span class="tab-long">Déclaration</span><span class="tab-short">Déclarer</span></button>
      <button type="button" role="tab" class="sin-tab" id="sinTabBareme" aria-controls="sinPanelBareme" aria-selected="false">${icon('i-receipt')}<span class="tab-long">Barème FTUSA · 25 cas</span><span class="tab-short">Barème</span></button>
      <button type="button" role="tab" class="sin-tab" id="sinTabQuiz" aria-controls="sinPanelQuiz" aria-selected="false">${icon('i-check')}<span class="tab-long">Entraînement</span><span class="tab-short">Quiz</span></button>
    </div>

    <div class="sin-panel" id="sinPanelConstat" role="tabpanel" aria-labelledby="sinTabConstat">
      <div class="sin-work">
        <div class="sin-form">
          <div class="constat" aria-labelledby="cstTitle">
            <div class="constat-top">
              <span class="constat-brand">ftusa</span>
              <h3 id="cstTitle">constat amiable d'accident automobile</h3>
            </div>
            <div class="constat-head">
              <div class="cst-col cst-col--a"><small>VÉHICULE</small><b>A</b></div>
              <div class="cst-mid"><strong>12. circonstances</strong><span>Mettre une croix (x) dans chacune des cases utiles pour préciser le croquis</span></div>
              <div class="cst-col cst-col--b"><small>VÉHICULE</small><b>B</b></div>
            </div>
            <div class="cst-rows">${rows}</div>
            <div class="constat-foot">
              <span class="cst-count cst-count--a" id="cstCountA">0</span>
              <span class="cst-count-label">nombre de cases marquées d'une croix</span>
              <span class="cst-count cst-count--b" id="cstCountB">0</span>
            </div>
          </div>

          <section class="panel sin-block" aria-labelledby="cfgTitle">
            <h3 class="sin-block-title" id="cfgTitle">13. Croquis : configuration de l'accident</h3>
            <p class="hint">La direction des véhicules est le premier élément du barème. Indiquez-la quand les cases ne suffisent pas.</p>
            <div class="cfg-choice" role="radiogroup" aria-labelledby="cfgTitle">
              ${Object.entries(CONFIGS).map(([k, label]) => `<label class="cfg-card"><input type="radio" name="sinConfig" value="${k}"><span class="cfg-ico" aria-hidden="true">${cfgIcon(k)}</span><span>${label}</span></label>`).join('')}
            </div>
          </section>

          <section class="panel sin-block" id="sinPrecisions" hidden aria-labelledby="precTitle">
            <h3 class="sin-block-title" id="precTitle">Précisions demandées par le barème</h3>
            <div class="prec" data-prec="stationnement" hidden>
              <p class="label">Nature du stationnement ou de l'arrêt</p>
              <div class="prec-options">
                ${Object.entries(STATIONNEMENT).map(([k, o]) => `<label class="prec-opt"><input type="radio" name="sinStat" value="${k}"><span>${esc(o.label)}<small>Cas ${o.n}</small></span></label>`).join('')}
              </div>
            </div>
            <div class="prec" data-prec="axe" hidden>
              <p class="label">La position des véhicules par rapport à l'axe médian est-elle prouvée (croquis, constat) ?</p>
              <div class="prec-options prec-options--inline">
                <label class="prec-opt"><input type="radio" name="sinAxe" value="1"><span>Oui, prouvée</span></label>
                <label class="prec-opt"><input type="radio" name="sinAxe" value="0"><span>Non, pas établie</span></label>
              </div>
            </div>
            <div class="prec" data-prec="agglo" hidden>
              <p class="label">Lieu de l'accident</p>
              <div class="prec-options prec-options--inline">
                <label class="prec-opt"><input type="radio" name="sinAgglo" value="1"><span>En agglomération</span></label>
                <label class="prec-opt"><input type="radio" name="sinAgglo" value="0"><span>Hors agglomération</span></label>
              </div>
            </div>
          </section>

          <section class="panel sin-block" aria-labelledby="spTitle">
            <h3 class="sin-block-title" id="spTitle">Circonstances particulières (cas 14 à 23)</h3>
            <p class="hint">Situations du barème qui ne figurent pas dans les 17 cases du constat.</p>
            <div class="sp-list">
              ${specials.map(([k, label, n]) => `<div class="sp-row" data-sp="${k}"><div class="sp-label">${esc(label)}<small>Cas ${n}</small></div>${seg3('sp_' + k, label)}</div>`).join('')}
              <div class="sp-row sp-row--sub" data-sp-sub="signal" hidden>
                <label class="label" for="sinSignalType">Signalisation non respectée</label>
                <select class="select" id="sinSignalType">${Object.entries(SIGNALS).map(([k, t]) => `<option value="${k}">${esc(t.charAt(0).toUpperCase() + t.slice(1))}</option>`).join('')}</select>
              </div>
              <label class="sp-row sp-toggle"><span class="sp-label">Désaccord sur la couleur des feux ou sur l'origine de l'accident<small>Cas 23</small></span><input type="checkbox" class="checkbox" id="sinDesaccord"></label>
            </div>
          </section>
        </div>

        <aside class="sin-aside" aria-label="Résultat selon le barème">
          <div id="sinResult" aria-live="polite"></div>
          <section class="panel sin-whatif" id="sinWhatIf" aria-labelledby="whatIfTitle" hidden></section>
          <div class="sin-aside-actions">
            <button type="button" class="btn btn--ghost" id="sinPresent">${icon('i-present')} Présenter au client</button>
            <button type="button" class="btn btn--ghost" id="sinShare">${icon('i-share')} Partager</button>
            <button type="button" class="btn btn--ghost" id="sinCopy">${icon('i-save')} Copier le résultat</button>
            <button type="button" class="btn btn--ghost" id="sinReset">${icon('i-reset')} Nouveau constat</button>
          </div>
        </aside>
      </div>
    </div>

    <div class="sin-panel" id="sinPanelDecl" role="tabpanel" aria-labelledby="sinTabDecl" hidden>
      <div id="declMount"></div>
    </div>

    <div class="sin-panel" id="sinPanelBareme" role="tabpanel" aria-labelledby="sinTabBareme" hidden>
      <div class="bar-tools">
        <div class="bar-filters" role="group" aria-label="Filtrer par famille">
          <button type="button" class="chip is-on" data-cat="" aria-pressed="true">Tous les cas</button>
          ${B.categories.map(c => `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="false">${esc(shortCat(c.id))}</button>`).join('')}
        </div>
        <label class="bar-search"><span class="sr-only">Rechercher dans le barème</span><input class="input" type="search" id="barSearch" name="barSearch" autocomplete="off" spellcheck="false" placeholder="Rechercher : stationnement, feu, portière, 14…"></label>
      </div>
      <details class="panel bar-rules">
        <summary>Règles d'application du barème, définitions</summary>
        <div class="bar-rules-body">
          <div><h4>Éléments à prendre en considération</h4><ul>${B.elementsAConsiderer.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
          <div><h4>Éléments à exclure</h4><ul>${B.elementsAExclure.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
          <div class="bar-defs"><h4>Définitions</h4><dl>${B.definitions.map(d => `<div><dt>${esc(d.terme)}</dt><dd>${esc(d.texte).replace(/\n/g, '<br>')}</dd></div>`).join('')}</dl></div>
          <p class="bar-obs"><strong>Observation :</strong> ${esc(B.observation)}</p>
        </div>
      </details>
      <div id="barList"></div>
      <p class="hint bar-empty" id="barEmpty" hidden>Aucun cas ne correspond à cette recherche.</p>
    </div>

    <div class="sin-panel" id="sinPanelQuiz" role="tabpanel" aria-labelledby="sinTabQuiz" hidden>
      <div id="quizBox"></div>
    </div>

    <p class="sin-source">${icon('i-info')}<span>Outil pédagogique fondé sur le <a href="${B.source}" target="_blank" rel="noopener">barème de responsabilité de la FTUSA</a> (${esc(B.date)}). Le cas proposé à partir des cases cochées est une aide : la décision revient à l'assureur, au vu du constat complet (croquis, points de choc, observations).</span></p>`;
  }

  function shortCat(id) {
    return { meme: 'Même sens · 1 à 5', inverse: 'Sens inverse · 6 et 7', chaussees: 'Carrefour · 8 et 9', stationnement: 'Stationnement · 10 à 13', speciaux: 'Cas spéciaux · 14 à 25' }[id];
  }

  function cfgIcon(k) {
    const ar = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" marker-end="url(#cfgHead-${k})"/>`;
    const base = `<svg viewBox="0 0 44 32" width="44" height="32"><defs><marker id="cfgHead-${k}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="currentColor"/></marker></defs>`;
    if (k === 'meme') return base + ar(6, 11, 34, 11) + ar(6, 22, 34, 22) + '</svg>';
    if (k === 'inverse') return base + ar(38, 10, 10, 10) + ar(6, 22, 34, 22) + '</svg>';
    return base + ar(38, 9, 12, 9) + ar(22, 30, 22, 14) + '</svg>';
  }

  /* ---------- Constat interactif ---------- */
  function readForm() {
    st.boxes = { A: [], B: [] };
    qa('.cst-rows input:checked').forEach(cb => st.boxes[cb.dataset.v].push(Number(cb.dataset.n)));
    const cfg = q('input[name="sinConfig"]:checked');
    st.config = cfg ? cfg.value : null;
    const stat = q('input[name="sinStat"]:checked');
    st.stationnement = stat ? stat.value : null;
    const axe = q('input[name="sinAxe"]:checked');
    st.axeProuve = axe ? axe.value === '1' : null;
    const ag = q('input[name="sinAgglo"]:checked');
    st.agglo = ag ? ag.value === '1' : null;
    ['signal', 'demitour', 'portiere', 'jets', 'eclairage'].forEach(k => {
      const r = q(`input[name="sp_${k}"]:checked`);
      st.specials[k] = r && r.value ? r.value : null;
    });
    st.specials.signalType = q('#sinSignalType').value;
    st.specials.desaccord = q('#sinDesaccord').checked;
  }

  function writeForm() {
    qa('.cst-rows input').forEach(cb => { cb.checked = (st.boxes[cb.dataset.v] || []).includes(Number(cb.dataset.n)); });
    qa('input[name="sinConfig"]').forEach(r => { r.checked = r.value === st.config; });
    qa('input[name="sinStat"]').forEach(r => { r.checked = r.value === st.stationnement; });
    qa('input[name="sinAxe"]').forEach(r => { r.checked = st.axeProuve != null && r.value === (st.axeProuve ? '1' : '0'); });
    qa('input[name="sinAgglo"]').forEach(r => { r.checked = st.agglo != null && r.value === (st.agglo ? '1' : '0'); });
    ['signal', 'demitour', 'portiere', 'jets', 'eclairage'].forEach(k => {
      qa(`input[name="sp_${k}"]`).forEach(r => { r.checked = r.value === (st.specials[k] || ''); });
    });
    q('#sinSignalType').value = st.specials.signalType || 'priorite';
    q('#sinDesaccord').checked = Boolean(st.specials.desaccord);
  }

  // Constat repris d'un brouillon ou d'un lien : seules les valeurs connues sont gardées
  function cleanState(src) {
    const x = blank();
    if (!src || typeof src !== 'object') return x;
    const nums = a => (Array.isArray(a) ? [...new Set(a.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 17))] : []);
    x.boxes = { A: nums(src.boxes && src.boxes.A), B: nums(src.boxes && src.boxes.B) };
    if (CONFIGS[src.config]) x.config = src.config;
    if (STATIONNEMENT[src.stationnement]) x.stationnement = src.stationnement;
    if (typeof src.axeProuve === 'boolean') x.axeProuve = src.axeProuve;
    if (typeof src.agglo === 'boolean') x.agglo = src.agglo;
    const sp = src.specials || {};
    ['signal', 'demitour', 'portiere', 'jets', 'eclairage'].forEach(k => { if (sp[k] === 'A' || sp[k] === 'B') x.specials[k] = sp[k]; });
    if (SIGNALS[sp.signalType]) x.specials.signalType = sp.signalType;
    x.specials.desaccord = sp.desaccord === true;
    return x;
  }
  const clone = o => JSON.parse(JSON.stringify(o));

  /* ---------- Lien du constat : #sinistre/constat?a=…&b=… ---------- */
  const SPK = { signal: 'si', demitour: 'dt', portiere: 'po', jets: 'je', eclairage: 'ec' };
  function encodeConstat(x) {
    const p = new URLSearchParams();
    const mask = v => x.boxes[v].reduce((m, n) => m | (1 << (n - 1)), 0).toString(36);
    p.set('a', mask('A'));
    p.set('b', mask('B'));
    if (x.config) p.set('c', x.config);
    if (x.stationnement) p.set('s', x.stationnement);
    if (x.axeProuve != null) p.set('x', x.axeProuve ? '1' : '0');
    if (x.agglo != null) p.set('g', x.agglo ? '1' : '0');
    Object.entries(SPK).forEach(([k, key]) => { if (x.specials[k]) p.set(key, x.specials[k]); });
    if (x.specials.signal) p.set('st', x.specials.signalType);
    if (x.specials.desaccord) p.set('d', '1');
    return p.toString();
  }
  function decodeConstat(str) {
    const p = new URLSearchParams(str);
    const unmask = k => { const m = parseInt(p.get(k) || '0', 36) || 0; return Array.from({ length: 17 }, (_, i) => i + 1).filter(n => m & (1 << (n - 1))); };
    const bool = k => (p.has(k) ? p.get(k) === '1' : null);
    const specials = {};
    Object.entries(SPK).forEach(([k, key]) => { specials[k] = p.get(key); });
    specials.signalType = p.get('st');
    specials.desaccord = p.get('d') === '1';
    return cleanState({ boxes: { A: unmask('a'), B: unmask('b') }, config: p.get('c'), stationnement: p.get('s'), axeProuve: bool('x'), agglo: bool('g'), specials });
  }
  const pageUrl = () => window.location.href.split('#')[0];
  const constatLink = () => `${pageUrl()}#sinistre/constat?${encodeConstat(st)}`;

  /* ---------- Analyse « Et si… » : les cases qui, seules, changeraient le verdict ---------- */
  function whatIf(base) {
    const cur = determine(base);
    const key = r => (r.status === 'ok' ? `${r.n}|${r.resp.A}` : r.status);
    const out = [];
    ['A', 'B'].forEach(v => B.circonstances.forEach(c => {
      const t = clone(base);
      const list = t.boxes[v];
      const i = list.indexOf(c.n);
      const add = i < 0;
      if (add) list.push(c.n); else list.splice(i, 1);
      const r = determine(t);
      if (r.status !== 'ok' || (cur.status === 'ok' && key(r) === key(cur))) return;
      out.push({ v, n: c.n, add, r, delta: cur.status === 'ok' ? Math.abs(r.resp.A - cur.resp.A) : 1 });
    }));
    return out.sort((a, b) => b.delta - a.delta || a.n - b.n || a.v.localeCompare(b.v));
  }
  let whatIfItems = [];
  function renderWhatIf(res) {
    const box = q('#sinWhatIf');
    qa('.cst-box.is-pivot').forEach(b => b.classList.remove('is-pivot'));
    if (res.status === 'empty') { box.hidden = true; box.innerHTML = ''; whatIfItems = []; return; }
    const list = whatIf(st);
    list.forEach(it => {
      const cb = q(`.cst-rows input[data-v="${it.v}"][data-n="${it.n}"]`);
      if (cb) cb.closest('.cst-box').classList.add('is-pivot');
    });
    whatIfItems = list.slice(0, 5);
    box.hidden = false;
    const head = `<div class="whatif-head"><h3 class="whatif-title" id="whatIfTitle">${icon('i-compare')}Et si…</h3>`;
    if (!list.length) {
      box.innerHTML = `${head}<p class="hint">Aucune case seule ne change ce verdict : il tient au regard des circonstances cochées.</p></div>`;
      return;
    }
    box.innerHTML = `${head}<p class="hint">${res.status === 'ok' ? 'Cases qui, à elles seules, changeraient le verdict' : 'Cases qui, à elles seules, mèneraient à un cas du barème'} ; elles sont repérées d'un point sur le constat.</p></div>
      <ul class="whatif-list">${whatIfItems.map((it, i) => `<li>
        <span class="veh-tag veh-tag--${it.v.toLowerCase()}" aria-hidden="true">${it.v}</span>
        <div class="whatif-text"><p><span class="sr-only">Véhicule ${it.v} : </span>${it.add ? 'Cocher' : 'Décocher'} la case ${it.n} <span class="whatif-circ">« ${esc(CIRC[it.n])} »</span></p>
          <p class="whatif-out">Cas ${it.r.n} · A ${pct(it.r.resp.A)} · B ${pct(it.r.resp.B)}</p></div>
        <button type="button" class="btn btn--ghost btn--sm" data-whatif="${i}" aria-label="Essayer : ${it.add ? 'cocher' : 'décocher'} la case ${it.n} pour ${it.v}">Essayer</button></li>`).join('')}</ul>
      ${list.length > 5 ? `<p class="hint">Et ${list.length - 5} autre${list.length - 5 > 1 ? 's' : ''} sur le constat.</p>` : ''}`;
  }
  function tryWhatIf(i) {
    const it = whatIfItems[i];
    if (!it) return;
    const before = clone(st);
    const list = st.boxes[it.v];
    if (it.add) list.push(it.n); else list.splice(list.indexOf(it.n), 1);
    writeForm();
    renderConstat();
    toast(`Case ${it.n} ${it.add ? 'cochée' : 'décochée'} pour ${it.v} : cas ${it.r.n}.`, null, { label: 'Annuler', run: () => { st = before; writeForm(); renderConstat(); } });
  }

  /* ---------- Rejouer l'accident : les véhicules rejoignent le point de choc ---------- */
  // Distance parcourue par X et Y avant le choc (0 : immobile ; négatif : marche arrière)
  const MOVES = {
    1: { X: 22, Y: 60 }, 2: { X: 50, Y: 50 }, 3: { X: 50, Y: 50 }, 4: { X: 40, Y: 50 }, 5: { X: 60, Y: 15 },
    6: { X: 45, Y: 45 }, 7: { X: 45, Y: 45 }, 8: { X: 45, Y: 45 }, 9: { X: 45, Y: 45 }, 10: { X: 0, Y: 55 },
    11: { X: 0, Y: 55 }, 12: { X: 0, Y: 55 }, 13: { X: 0, Y: 60 }, 14: { X: 45, Y: 30 }, 15: { X: 40, Y: -35 },
    16: { X: 50, Y: 25 }, 17: { X: 40, Y: 50 }, 18: { X: 40, Y: 50 }, 19: { X: 55, Y: 0 }, 20: { X: 50, Y: 50 },
    21: { X: 55, Y: 25 }, 22: { X: 55, Y: 25 }, 23: { X: 45, Y: 45 },
  };
  function replayScene(svg) {
    if (!svg || reduceMotion() || !svg.animate) return;
    const n = Number(svg.dataset.case);
    const sc = SCENES[n];
    if (!sc) return;
    const mv = MOVES[n] || {};
    svg.getAnimations({ subtree: true }).forEach(a => a.cancel());
    svg.querySelectorAll('.mover').forEach(g => {
      const car = sc.cars.find(c => c.r === g.dataset.r);
      const d = mv[g.dataset.r] == null ? 45 : mv[g.dataset.r];
      if (!car || !d) return;
      const a = car.rot * Math.PI / 180;
      g.animate([{ transform: `translate(${(-Math.cos(a) * d).toFixed(1)}px, ${(-Math.sin(a) * d).toFixed(1)}px)` }, { transform: 'translate(0px, 0px)' }],
        { duration: 1100, easing: 'cubic-bezier(.3, .1, .25, 1)', fill: 'backwards' });
    });
    svg.querySelectorAll('.trail').forEach(p => p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 150, fill: 'backwards' }));
    svg.querySelectorAll('.impact').forEach(g => {
      g.style.transformBox = 'fill-box';
      g.style.transformOrigin = 'center';
      g.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.4)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }],
        { duration: 420, delay: 1000, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'backwards' });
    });
  }
  let lastCase = null;

  function renderConstat() {
    const res = determine(st);
    q('#cstCountA').textContent = st.boxes.A.length;
    q('#cstCountB').textContent = st.boxes.B.length;
    qa('.cst-row').forEach((row, i) => {
      const n = i + 1;
      row.classList.toggle('is-a', st.boxes.A.includes(n));
      row.classList.toggle('is-b', st.boxes.B.includes(n));
    });
    // Précisions pertinentes
    const needStat = st.boxes.A.includes(1) || st.boxes.B.includes(1);
    const needAgglo = Boolean(st.specials.eclairage);
    const emp = v => st.boxes[v].includes(15) || (st.config === 'inverse' && st.boxes[v].includes(13));
    const needAxe = (st.config === 'inverse' && (emp('A') !== emp('B'))) || (st.config === 'carrefour' && ['A', 'B'].some(v => st.boxes[v].includes(16) && st.boxes[v].includes(15)));
    const show = { stationnement: needStat, axe: needAxe, agglo: needAgglo };
    let any = false;
    qa('.prec').forEach(p => {
      const on = show[p.dataset.prec];
      p.hidden = !on;
      p.classList.toggle('is-asked', res.status === 'incomplete' && res.ask.includes(p.dataset.prec));
      any = any || on;
    });
    q('#sinPrecisions').hidden = !any;
    q('[data-sp-sub="signal"]').hidden = !st.specials.signal;
    root.querySelector('.cfg-choice').classList.toggle('is-asked', res.status === 'incomplete' && res.ask.includes('config'));
    q('#sinResult').innerHTML = resultHtml(res);
    const jump = q('#sinResult [data-jump]');
    if (jump) jump.addEventListener('click', () => {
      const target = jump.dataset.jump === 'config' ? q('.cfg-choice') : q(`.prec[data-prec="${jump.dataset.jump}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: behavior(), block: 'center' });
      const first = target.querySelector('input');
      if (first) first.focus({ preventScroll: true });
    });
    const goto = q('#sinResult [data-goto-case]');
    if (goto) goto.addEventListener('click', () => { showTab('bareme'); focusCase(Number(goto.dataset.gotoCase)); });
    updateMobileBar(res);
    renderWhatIf(res);
    store.set('sinConstat', JSON.stringify(st));
    // nouveau verdict : le croquis se rejoue une fois
    const n = res.status === 'ok' ? res.n : null;
    if (n && n !== lastCase) requestAnimationFrame(() => replayScene(q('#sinResult svg.scene')));
    lastCase = n;
    return res;
  }

  function resultHtml(res) {
    if (res.status === 'empty') {
      return `<div class="sin-empty">${scene(1, null, { label: 'Exemple de croquis' })}<p><strong>Cochez les cases du constat</strong> comme le feraient les conducteurs A et B : le cas du barème et le partage de responsabilité s'affichent ici.</p><p class="hint">Astuce : dans l'onglet « Barème », chaque cas peut être simulé en un clic.</p></div>`;
    }
    if (res.status !== 'ok') {
      const titles = { incomplete: 'Précision nécessaire', conflict: 'Déclarations contradictoires', none: 'Aucun cas du barème ne s\'applique' };
      const jump = res.status === 'incomplete' ? `<button type="button" class="btn btn--sm sin-jump" data-jump="${res.ask[0]}">Répondre ${icon('i-arrow-right')}</button>` : '';
      return `<div class="sin-alert sin-alert--${res.status}"><p class="sin-alert-title">${icon('i-warn')}${titles[res.status]}</p><p>${esc(res.message)}</p>${jump}</div>`;
    }
    const c = CAS[res.n];
    const vA = verdictLabel(res.resp.A);
    const vB = verdictLabel(res.resp.B);
    const checks = [].concat(res.variant ? [res.variant] : [], res.checks || []);
    return `
      <div class="sign sin-sign">
        <div class="sin-sign-head">${caseNoHtml(res.n)}<div><p class="sin-sign-label">Barème FTUSA · cas n° ${res.n}</p><p class="sin-sign-text">${esc(c.texte)}${c.liste ? ' ' + esc((SIGNALS[st.specials.signalType] || '').trim()) : ''}</p></div></div>
        ${respBar(res.resp)}
      </div>
      <div class="panel sin-verdict">
        <ul class="verdicts">
          <li class="verdict verdict--a"><span class="veh-tag veh-tag--a">A</span><span class="verdict-txt">${vA.txt}</span><span class="badge badge--${vA.cls}">${pct(res.resp.A)}</span></li>
          <li class="verdict verdict--b"><span class="veh-tag veh-tag--b">B</span><span class="verdict-txt">${vB.txt}</span><span class="badge badge--${vB.cls}">${pct(res.resp.B)}</span></li>
        </ul>
        ${res.why ? `<p class="sin-why"><strong>Pourquoi ?</strong> ${esc(res.why)}</p>` : ''}
        <p class="sin-roles">Dans le barème : X = véhicule ${res.roles.X}, Y = véhicule ${res.roles.Y}.</p>
        ${SCENES[res.n] ? `<figure class="sin-scene">${scene(res.n, res.roles, { label: `Croquis du cas ${res.n} avec les véhicules A et B` })}<button type="button" class="replay-btn" data-replay aria-label="Rejouer l'accident" title="Rejouer l'accident">${icon('i-play')}<span>Rejouer</span></button></figure>` : ''}
        ${checks.length ? `<div class="sin-checks"><p class="label">À vérifier sur le constat</p><ul>${checks.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
        <button type="button" class="btn btn--ghost btn--sm" data-goto-case="${res.n}">${icon('i-receipt')} Voir le cas ${res.n} dans le barème</button>
      </div>`;
  }

  function resultText(res) {
    if (res.status !== 'ok') return '';
    const c = CAS[res.n];
    const fmt = v => (st.boxes[v].length ? st.boxes[v].slice().sort((a, b) => a - b).join(', ') : 'aucune');
    return `Barème de responsabilité FTUSA (${B.date}) — cas n° ${res.n} : ${c.texte}\nResponsabilité : A ${pct(res.resp.A)}, B ${pct(res.resp.B)}${res.variant ? ' (' + res.variant + ')' : ''}.\nCases cochées : A : ${fmt('A')} ; B : ${fmt('B')}.${res.why ? '\nMotif : ' + res.why : ''}`;
  }

  function updateMobileBar(res) {
    const bar = document.getElementById('sinMobileBar');
    if (!bar) return;
    if (res.status === 'ok') bar.innerHTML = `<span>Cas n° ${res.n}</span><strong>A ${pct(res.resp.A)} · B ${pct(res.resp.B)}</strong>`;
    else if (res.status === 'empty') bar.innerHTML = '<span>Constat</span><strong>Cochez les circonstances</strong>';
    else bar.innerHTML = '<span>Barème</span><strong>Précision nécessaire</strong>';
    bar.setAttribute('aria-label', `Voir le résultat : ${bar.textContent.replace(/\s+/g, ' ').trim()}`);
  }

  function loadPreset(n, swap) {
    const p = PRESETS[n];
    if (!p) return;
    const src = swap ? swapInput(p) : p;
    st = blank();
    st.config = src.config || null;
    st.boxes = { A: (src.boxes && src.boxes.A) || [], B: (src.boxes && src.boxes.B) || [] };
    st.stationnement = src.stationnement || null;
    st.axeProuve = src.axeProuve == null ? null : src.axeProuve;
    st.agglo = src.agglo == null ? null : src.agglo;
    Object.assign(st.specials, src.specials || {});
    writeForm();
    showTab('constat');
    renderConstat();
    const top = root.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: Math.max(0, top), behavior: behavior() });
  }

  /* ---------- Partager le constat : lien et code QR ---------- */
  let shareDlg = null;
  function makeDialog(id, cls, labelledby) {
    const dlg = document.createElement('dialog');
    dlg.className = cls;
    dlg.id = id;
    dlg.setAttribute('aria-labelledby', labelledby);
    dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
    document.body.appendChild(dlg);
    return dlg;
  }
  function openShareConstat() {
    const res = determine(st);
    if (res.status === 'empty') { toast('Cochez d’abord les circonstances du constat à partager.', 'warn'); return; }
    if (!shareDlg) shareDlg = makeDialog('sinShareModal', 'dialog', 'sinShareTitle');
    const link = constatLink();
    const summary = res.status === 'ok' ? `Cas n° ${res.n} · A ${pct(res.resp.A)} · B ${pct(res.resp.B)}` : 'Constat à compléter';
    const text = `Constat amiable, barème FTUSA : ${summary}. Ouvrir le constat : ${link}`;
    shareDlg.innerHTML = `
      <header class="dialog-head"><h2 id="sinShareTitle">Partager le constat</h2><button type="button" class="icon-btn" data-close aria-label="Fermer">${icon('i-close')}</button></header>
      <div class="dialog-scroll"><div class="share-grid">
        <figure class="share-qr">${window.appQr ? window.appQr(link, 'Code QR du constat') : ''}</figure>
        <div class="share-body">
          <p class="share-total">Barème FTUSA<strong>${esc(summary)}</strong></p>
          <p class="hint">Ce lien et ce code QR rouvrent le constat à l'identique : cases cochées, configuration, précisions et circonstances particulières. Ils ne contiennent aucune donnée personnelle.</p>
          <div class="share-link"><label class="sr-only" for="sinShareLink">Lien du constat</label><input class="input" type="text" id="sinShareLink" readonly value="${esc(link)}"><button type="button" class="btn btn--ghost" id="sinShareCopy">Copier</button></div>
          <div class="share-actions">
            <a class="btn btn--green" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">${icon('i-chat')} WhatsApp</a>
            ${navigator.share ? `<button type="button" class="btn btn--ghost" id="sinShareNative">${icon('i-share')} Autre application</button>` : ''}
          </div>
        </div>
      </div></div>`;
    const copyBtn = shareDlg.querySelector('#sinShareCopy');
    copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(link); } catch (err) { shareDlg.querySelector('#sinShareLink').select(); try { document.execCommand('copy'); } catch (er) { /* copie manuelle */ } }
      if (window.appConfirmButton) window.appConfirmButton(copyBtn, 'Copié', 'Lien du constat copié.'); else announce('Lien du constat copié.');
    });
    const nat = shareDlg.querySelector('#sinShareNative');
    if (nat) nat.addEventListener('click', async () => { try { await navigator.share({ title: 'Constat amiable', text, url: link }); } catch (err) { /* partage annulé */ } });
    shareDlg.showModal();
  }

  /* ---------- Présentation du verdict au client (plein écran) ---------- */
  let presentDlg = null;
  function openPresent() {
    const res = determine(st);
    if (res.status !== 'ok') { toast('Pas encore de verdict à présenter : complétez le constat jusqu’à obtenir un cas du barème.', 'warn'); return; }
    if (!presentDlg) {
      presentDlg = makeDialog('sinPresentModal', 'dialog dialog--present sin-present', 'sinPresentTitle');
      presentDlg.addEventListener('close', () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); });
    }
    const c = CAS[res.n];
    const vA = verdictLabel(res.resp.A);
    const vB = verdictLabel(res.resp.B);
    const verdict = (v, lab) => `<li class="sinp-v sinp-v--${v.toLowerCase()}"><span class="veh-tag veh-tag--${v.toLowerCase()}">${v}</span><div><b>${lab.txt}</b><span class="badge badge--${lab.cls}">${pct(res.resp[v])}</span></div></li>`;
    presentDlg.innerHTML = `
      <header class="present-head">
        <p class="present-brand"><span class="brand-glyph" aria-hidden="true">${icon('i-shield')}</span><span class="present-brand-name">Analyse du constat · Barème FTUSA</span></p>
        <button type="button" class="btn btn--ghost btn--sm" data-close aria-label="Quitter la présentation">${icon('i-close')}<span>Quitter<span class="present-quit-long"> la présentation</span></span></button>
      </header>
      <div class="present-body sinp-body">
        <section class="sinp-main">
          <p class="present-eyebrow present-anim" style="--i: 0">Barème de responsabilité FTUSA · ${esc(B.date)}</p>
          <div class="sinp-case present-anim" style="--i: 1"><span class="sinp-plate" aria-hidden="true">${two(res.n)}</span><div><p class="sinp-label">Cas n° ${res.n}</p><h2 class="sinp-title" id="sinPresentTitle">${esc(c.texte)}</h2></div></div>
          <div class="sinp-resp present-anim" style="--i: 2">${respBar(res.resp)}</div>
          <ul class="sinp-verdicts present-anim" style="--i: 3">${verdict('A', vA)}${verdict('B', vB)}</ul>
          ${res.why ? `<p class="sinp-why present-anim" style="--i: 4"><strong>Pourquoi ?</strong> ${esc(res.why)}</p>` : ''}
          ${res.variant ? `<p class="sinp-why present-anim" style="--i: 5">${esc(res.variant)}</p>` : ''}
        </section>
        <aside class="sinp-side">
          ${SCENES[res.n] ? `<figure class="sin-scene sinp-scene present-anim" style="--i: 2">${scene(res.n, res.roles, { label: `Croquis du cas ${res.n} avec les véhicules A et B` })}${`<button type="button" class="replay-btn" data-replay aria-label="Rejouer l'accident" title="Rejouer l'accident">${icon('i-play')}<span>Rejouer</span></button>`}</figure>` : ''}
          <section class="present-card present-anim" style="--i: 3"><h3>Circonstances déclarées</h3>${describe(st)}</section>
          <p class="sinp-note present-anim" style="--i: 4">${icon('i-info')}<span>Aide à la décision fondée sur le barème FTUSA : la décision revient à l'assureur, au vu du constat complet.</span></p>
        </aside>
      </div>`;
    const show = () => {
      presentDlg.showModal();
      presentDlg.querySelector('[data-close]').focus({ preventScroll: true });
      setTimeout(() => replayScene(presentDlg.querySelector('svg.scene')), 450);
    };
    if (document.fullscreenEnabled && !document.fullscreenElement) document.documentElement.requestFullscreen().then(show, show);
    else show();
  }

  /* ---------- Barème ---------- */
  function caseCard(c) {
    const resp = c.chaine ? null : { X: FRAC[c.x], Y: FRAC[c.y] };
    const list = c.liste ? `<ul class="case-list">${c.liste.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
    const notes = c.notes ? `<div class="case-notes">${c.notes.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : '';
    const art = c.chaine
      ? `<div class="chain-sim" data-chain="${c.n}"><div class="chain-controls"><label for="chainN${c.n}">Véhicules impliqués</label><select class="select" id="chainN${c.n}">${[3, 4, 5, 6].map(k => `<option value="${k}"${k === (c.n === 24 ? 4 : 3) ? ' selected' : ''}>${k}</option>`).join('')}</select></div><div class="chain-out"></div></div>`
      : `<figure class="case-scene">${scene(c.n, null)}<button type="button" class="replay-btn" data-replay aria-label="Rejouer l'accident" title="Rejouer l'accident">${icon('i-play')}<span>Rejouer</span></button></figure>`;
    return `
      <article class="case-card" id="cas-${c.n}" data-cat="${c.cat}" data-search="${esc((c.texte + ' ' + (c.liste || []).join(' ') + ' ' + (c.notes || []).join(' ') + ' ' + (c.groupe || '')).toLowerCase())}">
        <header class="case-head">${caseNoHtml(c.n)}<div class="case-title"><h4>${esc(c.texte)}</h4>${c.groupe ? `<p class="case-group">${esc(c.groupe)}</p>` : ''}</div></header>
        ${art}
        ${list}
        ${resp ? respBar(resp, { X: 'X', Y: 'Y' }, ['X', 'Y']) : ''}
        ${notes}
        ${PRESETS[c.n] ? `<button type="button" class="btn btn--blue btn--sm" data-simulate="${c.n}">${icon('i-arrow-right')} Simuler sur le constat</button>` : ''}
      </article>`;
  }

  function renderBareme() {
    const html = B.categories.map(cat => `
      <section class="bar-cat" data-cat-section="${cat.id}">
        <h3 class="bar-cat-title">${esc(cat.titre)} <span>(${esc(cat.plage)})</span></h3>
        <div class="case-grid">${B.cas.filter(c => c.cat === cat.id).map(caseCard).join('')}</div>
      </section>`).join('');
    q('#barList').innerHTML = html;
    qa('[data-simulate]').forEach(b => b.addEventListener('click', () => loadPreset(Number(b.dataset.simulate))));
    qa('.chain-sim').forEach(box => {
      const n = Number(box.dataset.chain);
      const sel = box.querySelector('select');
      const draw = () => {
        const k = Number(sel.value);
        const letters = 'ABCDEF'.slice(0, k).split('');
        const last = letters[k - 1];
        let payers; let text;
        if (n === 24 && k <= 4) {
          payers = [last];
          text = `Le dernier de la chaîne, <strong>${last}</strong>, prend en charge directement les dégâts matériels de tous les véhicules (${letters.join(', ')}).`;
        } else {
          payers = letters.slice(1);
          text = (n === 24 ? `Plus de 4 véhicules : ` : '') + `chaque véhicule règle les dégâts de l'arrière du véhicule le devançant : ` + letters.slice(1).map((l, i) => `<strong>${l}</strong> → arrière de ${letters[i]}`).join(' · ') + '.';
        }
        box.querySelector('.chain-out').innerHTML = `${chainScene(n, k, payers)}<p>${text}</p>`;
      };
      sel.addEventListener('change', draw);
      draw();
    });
  }

  function filterBareme() {
    const cat = (q('.chip.is-on') || {}).dataset.cat || '';
    const term = q('#barSearch').value.trim().toLowerCase();
    let shown = 0;
    qa('.case-card').forEach(card => {
      const ok = (!cat || card.dataset.cat === cat) && (!term || card.dataset.search.includes(term) || String(card.id.replace('cas-', '')) === term);
      card.hidden = !ok;
      if (ok) shown++;
    });
    qa('.bar-cat').forEach(sec => { sec.hidden = !sec.querySelector('.case-card:not([hidden])'); });
    q('#barEmpty').hidden = shown > 0;
  }

  function setChip(cat) {
    qa('.chip').forEach(c => { const on = c.dataset.cat === cat; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
  }
  function focusCase(n) {
    setChip('');
    q('#barSearch').value = '';
    filterBareme();
    const card = q('#cas-' + n);
    if (!card) return;
    setHash('cas-' + n);
    card.classList.add('is-flash');
    setTimeout(() => card.classList.remove('is-flash'), 1600);
    const top = card.getBoundingClientRect().top + window.scrollY - 130;
    window.scrollTo({ top: Math.max(0, top), behavior: behavior() });
  }

  /* ---------- Entraînement ---------- */
  const ANSWERS = [
    { k: 'A0', resp: { A: 0, B: 1 }, label: `A non fautif · B 100${NNBSP}%` },
    { k: 'A1', resp: { A: 1, B: 0 }, label: `A 100${NNBSP}% · B non fautif` },
    { k: 'AB', resp: { A: 0.5, B: 0.5 }, label: 'Partagée 50 / 50' },
    { k: 'A25', resp: { A: 0.25, B: 0.75 }, label: `A 25${NNBSP}% · B 75${NNBSP}%` },
    { k: 'A75', resp: { A: 0.75, B: 0.25 }, label: `A 75${NNBSP}% · B 25${NNBSP}%` },
  ];
  function describe(inp) {
    const lines = [];
    if (inp.config) lines.push(`<li><strong>Configuration :</strong> ${esc(CONFIGS[inp.config].toLowerCase())}.</li>`);
    ['A', 'B'].forEach(v => {
      const b = (inp.boxes[v] || []).slice().sort((x, y) => x - y);
      lines.push(`<li><span class="veh-tag veh-tag--${v.toLowerCase()}">${v}</span> ${b.length ? b.map(n => esc(CIRC[n])).join(' ; ') : 'aucune case cochée'}.</li>`);
    });
    if (inp.stationnement) lines.push(`<li><strong>Stationnement :</strong> ${esc(STATIONNEMENT[inp.stationnement].label.toLowerCase())}.</li>`);
    if (inp.axeProuve != null) lines.push(`<li><strong>Position par rapport à l'axe médian :</strong> ${inp.axeProuve ? 'prouvée' : 'non établie'}.</li>`);
    const sp = inp.specials || {};
    if (sp.portiere) lines.push(`<li>${sp.portiere} a ouvert une portière.</li>`);
    if (sp.jets) lines.push(`<li>${sp.jets} a causé des dommages par jets de pierres ou objets transportés.</li>`);
    if (sp.eclairage) lines.push(`<li>${sp.eclairage} circulait sans éclairage, ${inp.agglo ? 'en agglomération' : 'hors agglomération'}.</li>`);
    if (sp.desaccord) lines.push('<li>Les conducteurs sont en désaccord sur la couleur des feux.</li>');
    return `<ul class="quiz-facts">${lines.join('')}</ul>`;
  }

  /* L'entraînement : plusieurs modes, une progression gardée sur l'appareil (clé sinTraining) */
  const QUIZ_LEN = 10;
  const CHRONO = 20; // secondes par question, contre la montre
  const TRAIN_KEY = 'sinTraining';
  const MODES = {
    serie: { label: 'Série de 10', ic: 'i-list' },
    chrono: { label: 'Contre la montre', ic: 'i-history' },
    erreurs: { label: 'Révision des erreurs', ic: 'i-undo' },
  };
  let quiz = null; // null : écran de choix du mode
  let tick = null;
  let training = null;

  function shuffle(a) {
    const s = a.slice();
    for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
    return s;
  }
  // familles du barème, limitées aux cas que le constat sait reproduire
  const families = () => B.categories
    .map(c => ({ id: c.id, cases: Object.keys(PRESETS).map(Number).filter(n => CAS[n] && CAS[n].cat === c.id) }))
    .filter(f => f.cases.length);

  function loadTraining() {
    const out = { cases: {}, sessions: [] };
    try {
      const t = JSON.parse(store.get(TRAIN_KEY));
      if (!t || typeof t !== 'object') return out;
      Object.entries(t.cases || {}).forEach(([n, r]) => {
        if (PRESETS[n] && r && typeof r === 'object') out.cases[n] = { ok: Math.max(0, r.ok | 0), ko: Math.max(0, r.ko | 0), last: r.last ? 1 : 0 };
      });
      out.sessions = (Array.isArray(t.sessions) ? t.sessions : [])
        .filter(s => s && typeof s.mode === 'string' && s.total > 0 && s.score >= 0 && s.score <= s.total && Number.isFinite(s.t))
        .slice(-30);
    } catch (e) { /* progression illisible : on repart de zéro */ }
    return out;
  }
  const tr = () => training || (training = loadTraining());
  const saveTraining = () => store.set(TRAIN_KEY, JSON.stringify(tr()));
  const toReview = () => Object.keys(tr().cases).filter(n => tr().cases[n].last === 0).map(Number).sort((a, b) => a - b);
  const sessionMode = () => (quiz.mode === 'famille' ? 'famille:' + quiz.fam : quiz.mode);
  const modeName = m => (m.startsWith('famille:') ? 'Famille ' + (shortCat(m.slice(8)) || '').split(' · ')[0].toLowerCase() : (MODES[m] || MODES.serie).label);

  function startQuiz(mode, fam, list) {
    let pool;
    if (list) pool = list;
    else if (mode === 'famille') pool = (families().find(f => f.id === fam) || {}).cases || [];
    else if (mode === 'erreurs') pool = toReview();
    else pool = Object.keys(PRESETS).map(Number);
    pool = shuffle(pool.filter(n => PRESETS[n])).slice(0, QUIZ_LEN);
    if (!pool.length) return;
    quiz = { mode, fam: fam || null, items: pool.map(n => ({ n, swap: Math.random() < 0.5, ok: null })), i: 0, score: 0, answered: false, missed: [] };
    renderQuiz(true);
  }

  function renderQuiz(focus) {
    stopTimer();
    const box = q('#quizBox');
    if (!quiz) box.innerHTML = trainHome();
    else if (quiz.i >= quiz.items.length) box.innerHTML = trainEnd();
    else renderQuestion(box);
    if (!focus) return;
    const h = box.querySelector('h3');
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
    if (box.getBoundingClientRect().top < 72) box.scrollIntoView({ behavior: behavior(), block: 'start' });
  }

  const modeBtn = (mode, text, off) => `
    <button type="button" class="quiz-mode" data-mode="${mode}"${off ? ' disabled' : ''}>
      <span class="quiz-mode-ic">${icon(MODES[mode].ic)}</span>
      <span class="quiz-mode-txt"><strong>${MODES[mode].label}</strong><span>${text}</span></span>
      ${icon('i-arrow-right')}
    </button>`;

  function histChart(ses) {
    const last = ses.slice(-10);
    if (last.length < 2) return '';
    const day = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
    return `
      <figure class="quiz-hist">
        <figcaption>${last.length} dernières séries</figcaption>
        <ol>${last.map(s => {
          const lab = `${day.format(s.t)} · ${modeName(s.mode)} : ${s.score} sur ${s.total}`;
          return `<li title="${esc(lab)}"><span class="quiz-hist-bar" style="height:${Math.max(6, Math.round(s.score / s.total * 100))}%"></span><span class="sr-only">${esc(lab)}</span></li>`;
        }).join('')}</ol>
      </figure>`;
  }

  function trainHome() {
    const t = tr();
    const review = toReview();
    const ses = t.sessions;
    const total = Object.keys(PRESETS).length;
    const mastered = Object.values(t.cases).filter(r => r.last === 1).length;
    const ratios = ses.map(s => s.score / s.total);
    const best = ratios.length ? Math.max(...ratios) : null;
    const avg = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;
    const any = ses.length || Object.keys(t.cases).length;
    return `
      <div class="quiz-home">
        <section class="panel quiz-pane" aria-labelledby="quizModesTitle">
          <h3 class="quiz-h" id="quizModesTitle">Choisissez un entraînement</h3>
          <div class="quiz-modes">
            ${modeBtn('serie', `${QUIZ_LEN} situations tirées au hasard parmi les ${total} cas simulables.`)}
            ${modeBtn('chrono', `${CHRONO} secondes par question ; le temps écoulé compte comme une erreur.`)}
            ${modeBtn('erreurs', review.length ? `${review.length} cas manqué${review.length > 1 ? 's' : ''} à retravailler.` : 'Aucune erreur à revoir pour l’instant.', !review.length)}
          </div>
          <h4 class="quiz-h4">Par famille du barème</h4>
          <div class="quiz-fams">
            ${families().map(f => {
              const m = f.cases.filter(n => (t.cases[n] || {}).last === 1).length;
              return `
              <button type="button" class="quiz-fam" data-mode="famille" data-fam="${f.id}">
                <span class="quiz-fam-name">${esc(shortCat(f.id))}</span>
                <span class="quiz-fam-meta">${m} cas maîtrisé${m > 1 ? 's' : ''} sur ${f.cases.length}</span>
                <span class="quiz-meter" aria-hidden="true"><span style="width:${m / f.cases.length * 100}%"></span></span>
              </button>`;
            }).join('')}
          </div>
        </section>
        <section class="panel quiz-pane quiz-stats" aria-labelledby="quizStatsTitle">
          <h3 class="quiz-h" id="quizStatsTitle">Ma progression</h3>
          ${any ? `
          <dl class="quiz-kpis">
            <div><dt>Séries</dt><dd>${ses.length}</dd></div>
            <div><dt>Meilleur score</dt><dd>${best == null ? '—' : pct(best)}</dd></div>
            <div><dt>Moyenne</dt><dd>${avg == null ? '—' : pct(avg)}</dd></div>
            <div><dt>Cas maîtrisés</dt><dd>${mastered}<small>/${total}</small></dd></div>
          </dl>
          ${histChart(ses)}
          ${review.length ? `
          <div class="quiz-review">
            <h4 class="quiz-h4">Cas à revoir dans le barème</h4>
            <div class="quiz-review-list">${review.map(n => `<button type="button" class="quiz-case" data-case="${n}" aria-label="Voir le cas ${n} dans le barème">Cas ${n}</button>`).join('')}</div>
          </div>` : ''}
          <button type="button" class="btn btn--ghost btn--sm quiz-wipe" data-act="wipe">${icon('i-trash')} Effacer ma progression</button>`
          : '<p class="quiz-empty">Votre progression s’affichera ici dès la première réponse : scores, cas maîtrisés par famille et cas à revoir. Elle reste sur cet appareil.</p>'}
        </section>
      </div>`;
  }

  function renderQuestion(box) {
    const item = quiz.items[quiz.i];
    const inp = item.swap ? swapInput(PRESETS[item.n]) : PRESETS[item.n];
    const res = determine(inp);
    quiz.res = res;
    const chrono = quiz.mode === 'chrono';
    box.innerHTML = `
      <div class="panel quiz-card">
        <div class="quiz-top">
          <span class="quiz-tag">${icon(quiz.mode === 'famille' ? 'i-folder' : MODES[quiz.mode].ic)}${esc(modeName(sessionMode()))}</span>
          <span class="quiz-count">Question ${quiz.i + 1} sur ${quiz.items.length}<span aria-hidden="true"> · </span>Score : <strong>${quiz.score}</strong></span>
          <button type="button" class="btn btn--ghost btn--sm" data-act="quit">${icon('i-close')} Arrêter</button>
        </div>
        <ol class="quiz-steps" aria-hidden="true">${quiz.items.map((it, j) => `<li class="${it.ok === true ? 'is-ok' : it.ok === false ? 'is-ko' : j === quiz.i ? 'is-cur' : ''}"></li>`).join('')}</ol>
        ${chrono ? `<div class="quiz-timer"><span class="quiz-timer-track"><span class="quiz-timer-bar"></span></span><span class="quiz-timer-txt" role="timer" id="quizClock">${CHRONO}${NNBSP}s</span></div>` : ''}
        <div class="quiz-body">
          <figure class="quiz-scene">${scene(item.n, res.roles, { label: 'Croquis de la situation' })}<button type="button" class="replay-btn" data-replay aria-label="Rejouer l'accident" title="Rejouer l'accident">${icon('i-play')}<span>Rejouer</span></button></figure>
          <div>
            <h3 class="quiz-q">Selon le barème FTUSA, comment se partage la responsabilité ?</h3>
            ${describe(inp)}
          </div>
        </div>
        <div class="quiz-answers" role="group" aria-label="Réponses">
          ${ANSWERS.map((a, j) => `<button type="button" class="quiz-answer" data-k="${a.k}" aria-keyshortcuts="${j + 1}"><kbd aria-hidden="true">${j + 1}</kbd><span>${a.label}</span></button>`).join('')}
        </div>
        <p class="quiz-keys">Touches 1 à 5 pour répondre, Entrée pour continuer.</p>
        <div class="quiz-feedback" id="quizFeedback" aria-live="polite"></div>
      </div>`;
    requestAnimationFrame(() => replayScene(box.querySelector('svg.scene')));
    if (chrono) startTimer();
  }

  // Contre la montre : en pause dès que l'entraînement n'est plus à l'écran
  function startTimer() {
    let left = CHRONO;
    const bar = q('#quizBox .quiz-timer-bar');
    const txt = q('#quizClock');
    const paint = () => {
      txt.textContent = `${left}${NNBSP}s`;
      bar.style.transform = `scaleX(${left / CHRONO})`;
      bar.parentNode.parentNode.classList.toggle('is-low', left <= 5);
    };
    paint();
    tick = setInterval(() => {
      const view = document.getElementById('sinistreView');
      if (document.hidden || q('#sinPanelQuiz').hidden || (view && view.hidden) || document.querySelector('dialog[open]')) return;
      left--;
      paint();
      if (left === 5) announce('Plus que 5 secondes.');
      if (left <= 0) { stopTimer(); answerQuiz(null); }
    }, 1000);
  }
  function stopTimer() { clearInterval(tick); tick = null; }

  function answerQuiz(k) {
    if (!quiz || quiz.answered || quiz.i >= quiz.items.length) return;
    stopTimer();
    quiz.answered = true;
    const res = quiz.res;
    const item = quiz.items[quiz.i];
    const good = ANSWERS.find(a => a.resp.A === res.resp.A && a.resp.B === res.resp.B);
    const ok = !!(good && good.k === k);
    item.ok = ok;
    if (ok) quiz.score++; else quiz.missed.push(item.n);
    const t = tr();
    const rec = t.cases[item.n] || { ok: 0, ko: 0, last: 0 };
    rec[ok ? 'ok' : 'ko']++;
    rec.last = ok ? 1 : 0;
    t.cases[item.n] = rec;
    const lastOne = quiz.i + 1 >= quiz.items.length;
    if (lastOne) recordSession(); else saveTraining();
    const box = q('#quizBox');
    box.querySelectorAll('.quiz-answer').forEach(b => {
      b.disabled = true;
      if (good && b.dataset.k === good.k) b.classList.add('is-good');
      else if (b.dataset.k === k) b.classList.add('is-bad');
    });
    const dot = box.querySelectorAll('.quiz-steps li')[quiz.i];
    if (dot) dot.className = ok ? 'is-ok' : 'is-ko';
    box.querySelector('.quiz-count strong').textContent = quiz.score;
    const timer = box.querySelector('.quiz-timer');
    if (timer) timer.classList.add('is-done');
    const c = CAS[res.n];
    q('#quizFeedback').innerHTML = `
      <div class="quiz-result quiz-result--${ok ? 'ok' : 'ko'}">
        <p class="quiz-result-title">${icon(ok ? 'i-check' : 'i-no')}${ok ? 'Bonne réponse' : k ? 'Ce n’est pas la bonne réponse' : 'Temps écoulé'}</p>
        <p><strong>Cas n° ${res.n} :</strong> ${esc(c.texte)}</p>
        ${res.variant ? `<p>${esc(res.variant)}</p>` : ''}
        ${res.why ? `<p class="hint">${esc(res.why)}</p>` : ''}
        <button type="button" class="btn btn--blue" data-act="next">${lastOne ? 'Voir mon score' : 'Question suivante'} ${icon('i-arrow-right')}</button>
      </div>`;
    q('#quizFeedback [data-act="next"]').focus({ preventScroll: true });
  }

  function recordSession() {
    const t = tr();
    const m = sessionMode();
    const ratio = quiz.score / quiz.items.length;
    const prev = t.sessions.filter(s => s.mode === m).map(s => s.score / s.total);
    quiz.newBest = (quiz.mode === 'serie' || quiz.mode === 'chrono') && prev.length > 0 && ratio > Math.max(...prev);
    t.sessions.push({ t: Date.now(), mode: m, score: quiz.score, total: quiz.items.length });
    t.sessions = t.sessions.slice(-30);
    saveTraining();
  }

  function trainEnd() {
    const s = quiz.score;
    const n = quiz.items.length;
    const r = s / n;
    const missed = [...new Set(quiz.missed)];
    const msg = r === 1 ? 'Sans faute : le barème n’a plus de secret pour vous.'
      : r >= 0.8 ? 'Excellent résultat.'
      : r >= 0.5 ? 'Bon résultat : revoyez les cas manqués ci-dessous.'
      : 'Revoyez les cas manqués, puis relancez une série.';
    return `
      <div class="panel quiz-card quiz-end">
        <span class="case-plate case-plate--xl">${s}/${n}</span>
        <p class="quiz-end-mode">${esc(modeName(sessionMode()))} · ${pct(s / n)}${quiz.newBest ? ' · <strong>nouveau record</strong>' : ''}</p>
        <h3>${msg}</h3>
        <ol class="quiz-steps quiz-steps--end" aria-hidden="true">${quiz.items.map(it => `<li class="${it.ok ? 'is-ok' : 'is-ko'}"></li>`).join('')}</ol>
        ${missed.length ? `
        <div class="quiz-missed">
          <h4 class="quiz-h4">Cas manqués</h4>
          <ul>${missed.map(c => `
            <li>
              <span class="case-plate">${c}</span>
              <span class="quiz-missed-txt">${esc(CAS[c].texte)}</span>
              <button type="button" class="btn btn--ghost btn--sm" data-case="${c}">Voir dans le barème</button>
            </li>`).join('')}</ul>
        </div>` : ''}
        <div class="quiz-end-actions">
          ${missed.length ? `<button type="button" class="btn btn--blue" data-act="missed">${icon('i-undo')} Revoir ${missed.length > 1 ? `ces ${missed.length} cas` : 'ce cas'}</button>` : ''}
          <button type="button" class="btn btn--green" data-act="again">${icon('i-reset')} Rejouer ce mode</button>
          <button type="button" class="btn btn--ghost" data-act="home">${icon('i-arrow-left')} Tous les entraînements</button>
        </div>
      </div>`;
  }

  function onQuizClick(e) {
    const b = e.target.closest('button');
    if (!b || b.disabled || b.hasAttribute('data-replay')) return;
    const act = b.dataset.act;
    if (b.dataset.mode) startQuiz(b.dataset.mode, b.dataset.fam);
    else if (b.dataset.k) answerQuiz(b.dataset.k);
    else if (b.dataset.case) { showTab('bareme'); requestAnimationFrame(() => focusCase(Number(b.dataset.case))); }
    else if (act === 'next') { quiz.i++; quiz.answered = false; renderQuiz(true); }
    else if (act === 'again') startQuiz(quiz.mode, quiz.fam);
    else if (act === 'missed') startQuiz('erreurs', null, [...new Set(quiz.missed)]);
    else if (act === 'home') { quiz = null; renderQuiz(true); }
    else if (act === 'quit') {
      quiz = null;
      renderQuiz(true);
      toast('Série arrêtée : les réponses données restent dans votre progression.');
    } else if (act === 'wipe') {
      const before = JSON.stringify(tr());
      training = { cases: {}, sessions: [] };
      saveTraining();
      renderQuiz(true);
      toast('Progression effacée.', null, { label: 'Annuler', run: () => { training = JSON.parse(before); saveTraining(); if (!quiz) renderQuiz(); } });
    }
  }

  // Touches 1 à 5 : répondre sans la souris
  function onQuizKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || !root || !quiz || quiz.answered || quiz.i >= quiz.items.length) return;
    const view = document.getElementById('sinistreView');
    if (q('#sinPanelQuiz').hidden || (view && view.hidden) || document.querySelector('dialog[open]')) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const i = '12345'.indexOf(e.key);
    if (e.key.length !== 1 || i < 0) return;
    e.preventDefault();
    answerQuiz(ANSWERS[i].k);
  }

  /* ---------- Onglets et montage ---------- */
  // onglet : [bouton, panneau, chemin dans l'adresse]
  const TABS = {
    constat: ['sinTabConstat', 'sinPanelConstat', ''],
    declaration: ['sinTabDecl', 'sinPanelDecl', 'declaration'],
    bareme: ['sinTabBareme', 'sinPanelBareme', 'bareme'],
    quiz: ['sinTabQuiz', 'sinPanelQuiz', 'entrainement'],
  };
  // L'adresse reflète l'onglet (#sinistre/bareme…) : un lien rouvre la même vue
  function setHash(path) {
    const view = document.getElementById('sinistreView');
    if (view && view.hidden) return;
    history.replaceState(null, '', `${pageUrl()}#sinistre${path ? '/' + path : ''}`);
  }
  function showTab(name) {
    if (!TABS[name]) name = 'constat';
    Object.entries(TABS).forEach(([k, [tab, panel]]) => {
      const on = k === name;
      q('#' + tab).setAttribute('aria-selected', String(on));
      q('#' + tab).tabIndex = on ? 0 : -1;
      q('#' + panel).hidden = !on;
    });
    if (name === 'quiz' && (!quiz || !q('#quizBox').firstElementChild)) renderQuiz();
    if (name === 'declaration' && window.Declaration) { window.Declaration.refresh(); window.Declaration.mount(q('#declMount')); }
    const bar = document.getElementById('sinMobileBar');
    if (bar) bar.dataset.tab = name;
    setHash(TABS[name][2]);
  }
  // Ouverture par une adresse : #sinistre/bareme, #sinistre/cas-14, #sinistre/constat?a=…
  function route(hash) {
    const h = String(hash || '').replace(/^#sinistre\/?/, '');
    if (!h) return;
    if (h.startsWith('constat?')) {
      const before = clone(st);
      st = decodeConstat(h.slice(8));
      writeForm();
      showTab('constat');
      renderConstat();
      setHash('');
      toast('Constat ouvert depuis un lien partagé.', null, { label: 'Annuler', run: () => { st = before; writeForm(); renderConstat(); } });
      return;
    }
    const m = /^cas-(\d+)$/.exec(h);
    if (m && CAS[m[1]]) { showTab('bareme'); requestAnimationFrame(() => focusCase(Number(m[1]))); return; }
    const tab = Object.keys(TABS).find(k => TABS[k][2] === h);
    if (tab) showTab(tab);
  }

  function mount(el) {
    if (root) return;
    root = el.querySelector('#sinistreMount') || el;
    root.innerHTML = buildHtml();
    renderBareme();
    root.addEventListener('change', e => {
      if (e.target.closest('.sin-form')) { readForm(); renderConstat(); }
    });
    q('#sinReset').addEventListener('click', () => {
      const before = JSON.parse(JSON.stringify(st));
      st = blank(); writeForm(); renderConstat();
      if (window.appToast) window.appToast('Constat réinitialisé.', null, { label: 'Annuler', run: () => { st = before; writeForm(); renderConstat(); } });
    });
    q('#sinCopy').addEventListener('click', async () => {
      const txt = resultText(determine(st));
      const btn = q('#sinCopy');
      if (!txt) {
        btn.classList.add('is-shake'); setTimeout(() => btn.classList.remove('is-shake'), 400);
        toast('Rien à copier : cochez les circonstances jusqu’à obtenir un cas du barème.', 'warn');
        return;
      }
      try { await navigator.clipboard.writeText(txt); } catch (e) { /* presse-papiers indisponible */ }
      announce('Résultat copié.');
      btn.innerHTML = `${icon('i-check')} Résultat copié`;
      setTimeout(() => { btn.innerHTML = `${icon('i-save')} Copier le résultat`; }, 1800);
    });
    const order = Object.keys(TABS);
    order.forEach((name, i) => {
      const t = q('#' + TABS[name][0]);
      t.addEventListener('click', () => showTab(name));
      t.addEventListener('keydown', e => {
        const j = { ArrowRight: (i + 1) % order.length, ArrowLeft: (i + order.length - 1) % order.length, Home: 0, End: order.length - 1 }[e.key];
        if (j == null) return;
        e.preventDefault();
        showTab(order[j]);
        q('#' + TABS[order[j]][0]).focus();
      });
    });
    q('#quizBox').addEventListener('click', onQuizClick);
    document.addEventListener('keydown', onQuizKey);
    q('#sinShare').addEventListener('click', openShareConstat);
    q('#sinPresent').addEventListener('click', openPresent);
    q('#sinWhatIf').addEventListener('click', e => { const b = e.target.closest('[data-whatif]'); if (b) tryWhatIf(Number(b.dataset.whatif)); });
    root.addEventListener('click', e => { const b = e.target.closest('[data-replay]'); if (b) replayScene(b.closest('figure').querySelector('svg.scene')); });
    qa('.chip').forEach(ch => ch.addEventListener('click', () => { setChip(ch.dataset.cat); filterBareme(); }));
    q('#barSearch').addEventListener('input', filterBareme);
    const bar = document.getElementById('sinMobileBar');
    if (bar) bar.addEventListener('click', () => { q('#sinResult').scrollIntoView({ behavior: behavior(), block: 'start' }); const t = q('#sinResult .sin-sign, #sinResult .sin-alert, #sinResult .sin-empty'); if (t) { t.tabIndex = -1; t.focus({ preventScroll: true }); } });
    try { const saved = JSON.parse(store.get('sinConstat')); if (saved) st = cleanState(saved); } catch (e) { /* brouillon illisible */ }
    showTab('constat');
    writeForm();
    renderConstat();
  }

  window.Sinistre = {
    mount, determine, PRESETS, swapInput, scene, CAS, loadPreset, showTab, focusCase, route,
    syncHash: () => { if (!root) return; const cur = Object.keys(TABS).find(k => q('#' + TABS[k][0]).getAttribute('aria-selected') === 'true'); setHash(TABS[cur || 'constat'][2]); },
    // pour la déclaration : croquis et constat en cours
    carSvg, roadSvg, star, COL, CIRC, describe: inp => describe(inp), current: () => clone(st), verdict: () => determine(st),
    layout: n => (SCENES[n] ? clone(SCENES[n]) : null),
  };
})();
