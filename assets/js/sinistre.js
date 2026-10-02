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
    s.cars.filter(c => c.beams).forEach(c => { body += carSvg(c.x, c.y, c.rot, fillOf(c.r), mapLetter(c.r), c); });
    s.cars.filter(c => !c.beams).forEach(c => { body += carSvg(c.x, c.y, c.rot, fillOf(c.r), mapLetter(c.r), c); });
    (s.extras || []).forEach(([k, ...a]) => { if (k === 'pierres') body += EXTRA.pierres(...a); });
    const arrowColor = s.night ? '#fff' : COL.ink;
    (s.arrows || []).forEach(d => { body += `<path d="${d}" fill="none" stroke="${arrowColor}" stroke-width="1.8" ${s.dashedArrows ? 'stroke-dasharray="4 3"' : ''} marker-end="url(#${id})"/>`; });
    (s.impacts || []).forEach(([x, y]) => { body += star(x, y); });
    const label = opts.label || `Croquis du cas ${n}`;
    return `<svg class="scene" viewBox="0 0 240 150" role="img" aria-label="${esc(label)}"><defs><marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${arrowColor}"/></marker></defs>${body}</svg>`;
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
      <button type="button" role="tab" class="sin-tab" id="sinTabBareme" aria-controls="sinPanelBareme" aria-selected="false">${icon('i-receipt')}<span class="tab-long">Barème FTUSA · 25 cas</span><span class="tab-short">Barème</span></button>
      <button type="button" role="tab" class="sin-tab" id="sinTabQuiz" aria-controls="sinPanelQuiz" aria-selected="false">${icon('i-check')}Entraînement</button>
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

        <aside class="sin-aside" aria-live="polite" aria-label="Résultat selon le barème">
          <div id="sinResult"></div>
          <div class="sin-aside-actions">
            <button type="button" class="btn btn--ghost" id="sinReset">${icon('i-reset')} Nouveau constat</button>
            <button type="button" class="btn btn--ghost" id="sinCopy">${icon('i-save')} Copier le résultat</button>
          </div>
        </aside>
      </div>
    </div>

    <div class="sin-panel" id="sinPanelBareme" role="tabpanel" aria-labelledby="sinTabBareme" hidden>
      <div class="bar-tools">
        <div class="bar-filters" role="group" aria-label="Filtrer par famille">
          <button type="button" class="chip is-on" data-cat="">Tous les cas</button>
          ${B.categories.map(c => `<button type="button" class="chip" data-cat="${c.id}">${esc(shortCat(c.id))}</button>`).join('')}
        </div>
        <label class="bar-search"><span class="sr-only">Rechercher dans le barème</span><input class="input" type="search" id="barSearch" placeholder="Rechercher : stationnement, feu, portière…"></label>
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
    const ar = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" marker-end="url(#cfgHead)"/>`;
    const base = '<svg viewBox="0 0 44 32" width="44" height="32"><defs><marker id="cfgHead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="currentColor"/></marker></defs>';
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
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const first = target.querySelector('input');
      if (first) first.focus({ preventScroll: true });
    });
    const goto = q('#sinResult [data-goto-case]');
    if (goto) goto.addEventListener('click', () => { showTab('bareme'); focusCase(Number(goto.dataset.gotoCase)); });
    updateMobileBar(res);
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
        ${SCENES[res.n] ? `<figure class="sin-scene">${scene(res.n, res.roles, { label: `Croquis du cas ${res.n} avec les véhicules A et B` })}</figure>` : ''}
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
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  /* ---------- Barème ---------- */
  function caseCard(c) {
    const resp = c.chaine ? null : { X: FRAC[c.x], Y: FRAC[c.y] };
    const list = c.liste ? `<ul class="case-list">${c.liste.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
    const notes = c.notes ? `<div class="case-notes">${c.notes.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : '';
    const art = c.chaine
      ? `<div class="chain-sim" data-chain="${c.n}"><div class="chain-controls"><label for="chainN${c.n}">Véhicules impliqués</label><select class="select" id="chainN${c.n}">${[3, 4, 5, 6].map(k => `<option value="${k}"${k === (c.n === 24 ? 4 : 3) ? ' selected' : ''}>${k}</option>`).join('')}</select></div><div class="chain-out"></div></div>`
      : `<figure class="case-scene">${scene(c.n, null)}</figure>`;
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

  function focusCase(n) {
    qa('.chip').forEach(c => c.classList.toggle('is-on', c.dataset.cat === ''));
    q('#barSearch').value = '';
    filterBareme();
    const card = q('#cas-' + n);
    if (!card) return;
    card.classList.add('is-flash');
    setTimeout(() => card.classList.remove('is-flash'), 1600);
    const top = card.getBoundingClientRect().top + window.scrollY - 130;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  /* ---------- Entraînement ---------- */
  const ANSWERS = [
    { k: 'A0', resp: { A: 0, B: 1 }, label: 'A non fautif · B 100 %' },
    { k: 'A1', resp: { A: 1, B: 0 }, label: 'A 100 % · B non fautif' },
    { k: 'AB', resp: { A: 0.5, B: 0.5 }, label: 'Partagée 50 / 50' },
    { k: 'A25', resp: { A: 0.25, B: 0.75 }, label: 'A 25 % · B 75 %' },
    { k: 'A75', resp: { A: 0.75, B: 0.25 }, label: 'A 75 % · B 25 %' },
  ];
  let quiz = null;

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

  function newQuiz() {
    const pool = Object.keys(PRESETS).map(Number);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    quiz = { items: pool.slice(0, 10).map(n => ({ n, swap: Math.random() < 0.5 })), i: 0, score: 0, answered: false };
    renderQuiz();
  }

  function renderQuiz() {
    const box = q('#quizBox');
    if (!quiz) { newQuiz(); return; }
    if (quiz.i >= quiz.items.length) {
      const s = quiz.score;
      box.innerHTML = `<div class="panel quiz-card quiz-end"><span class="case-plate case-plate--xl">${s}/${quiz.items.length}</span><h3>${s >= 8 ? 'Excellent, le barème n\'a plus de secret pour vous.' : s >= 5 ? 'Bon résultat : revoyez les cas manqués dans le barème.' : 'Continuez à vous entraîner avec l\'onglet « Barème ».'}</h3><button type="button" class="btn btn--green" id="quizRestart">${icon('i-reset')} Nouvelle série</button></div>`;
      box.querySelector('#quizRestart').addEventListener('click', newQuiz);
      return;
    }
    const item = quiz.items[quiz.i];
    const inp = item.swap ? swapInput(PRESETS[item.n]) : PRESETS[item.n];
    const res = determine(inp);
    const sceneHtml = scene(item.n, res.roles, { label: 'Croquis de la situation' });
    box.innerHTML = `
      <div class="panel quiz-card">
        <div class="quiz-top"><span>Question ${quiz.i + 1} sur ${quiz.items.length}</span><span>Score : <strong>${quiz.score}</strong></span></div>
        <div class="quiz-body">
          <figure class="quiz-scene">${sceneHtml}</figure>
          <div>
            <h3 class="quiz-q">Selon le barème FTUSA, comment se partage la responsabilité ?</h3>
            ${describe(inp)}
          </div>
        </div>
        <div class="quiz-answers" role="group" aria-label="Réponses">
          ${ANSWERS.map(a => `<button type="button" class="quiz-answer" data-k="${a.k}">${a.label}</button>`).join('')}
        </div>
        <div class="quiz-feedback" id="quizFeedback" aria-live="polite"></div>
      </div>`;
    box.querySelectorAll('.quiz-answer').forEach(btn => btn.addEventListener('click', () => answerQuiz(btn.dataset.k, res)));
  }

  function answerQuiz(k, res) {
    if (quiz.answered) return;
    quiz.answered = true;
    const good = ANSWERS.find(a => a.resp.A === res.resp.A && a.resp.B === res.resp.B);
    const ok = good && good.k === k;
    if (ok) quiz.score++;
    q('#quizBox').querySelectorAll('.quiz-answer').forEach(b => {
      b.disabled = true;
      if (good && b.dataset.k === good.k) b.classList.add('is-good');
      else if (b.dataset.k === k) b.classList.add('is-bad');
    });
    const c = CAS[res.n];
    q('#quizFeedback').innerHTML = `
      <div class="quiz-result quiz-result--${ok ? 'ok' : 'ko'}">
        <p class="quiz-result-title">${icon(ok ? 'i-check' : 'i-no')}${ok ? 'Bonne réponse' : 'Ce n\'est pas la bonne réponse'}</p>
        <p><strong>Cas n° ${res.n} :</strong> ${esc(c.texte)}</p>
        ${res.variant ? `<p>${esc(res.variant)}</p>` : ''}
        ${res.why ? `<p class="hint">${esc(res.why)}</p>` : ''}
        <button type="button" class="btn btn--blue" id="quizNext">${quiz.i + 1 < quiz.items.length ? 'Question suivante' : 'Voir mon score'} ${icon('i-arrow-right')}</button>
      </div>`;
    q('#quizNext').addEventListener('click', () => { quiz.i++; quiz.answered = false; renderQuiz(); });
    q('#quizNext').focus();
  }

  /* ---------- Onglets et montage ---------- */
  function showTab(name) {
    const map = { constat: ['sinTabConstat', 'sinPanelConstat'], bareme: ['sinTabBareme', 'sinPanelBareme'], quiz: ['sinTabQuiz', 'sinPanelQuiz'] };
    Object.entries(map).forEach(([k, [tab, panel]]) => {
      const on = k === name;
      q('#' + tab).setAttribute('aria-selected', String(on));
      q('#' + tab).tabIndex = on ? 0 : -1;
      q('#' + panel).hidden = !on;
    });
    if (name === 'quiz' && !quiz) newQuiz();
    const bar = document.getElementById('sinMobileBar');
    if (bar) bar.dataset.tab = name;
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
      if (!txt) { btn.classList.add('is-shake'); setTimeout(() => btn.classList.remove('is-shake'), 400); return; }
      try { await navigator.clipboard.writeText(txt); } catch (e) { /* presse-papiers indisponible */ }
      btn.innerHTML = `${icon('i-check')} Résultat copié`;
      setTimeout(() => { btn.innerHTML = `${icon('i-save')} Copier le résultat`; }, 1800);
    });
    const tabs = [['sinTabConstat', 'constat'], ['sinTabBareme', 'bareme'], ['sinTabQuiz', 'quiz']];
    tabs.forEach(([id, name], i) => {
      const t = q('#' + id);
      t.addEventListener('click', () => showTab(name));
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        showTab(next[1]);
        q('#' + next[0]).focus();
      });
    });
    qa('.chip').forEach(ch => ch.addEventListener('click', () => { qa('.chip').forEach(c => c.classList.toggle('is-on', c === ch)); filterBareme(); }));
    q('#barSearch').addEventListener('input', filterBareme);
    const bar = document.getElementById('sinMobileBar');
    if (bar) bar.addEventListener('click', () => q('#sinResult').scrollIntoView({ behavior: 'smooth', block: 'start' }));
    showTab('constat');
    writeForm();
    renderConstat();
  }

  window.Sinistre = { mount, determine, PRESETS, swapInput, scene, CAS, loadPreset, showTab, focusCase };
})();
