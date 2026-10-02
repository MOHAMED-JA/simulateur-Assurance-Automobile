/*
 * Rubrique « Sinistre » : déclaration d'accident guidée.
 *
 * Aide à préparer le constat amiable en sept étapes : l'accident, les deux
 * véhicules, les circonstances (reprises du constat interactif), un croquis
 * à composer, les points de choc avec photos, puis un récapitulatif imprimable.
 *
 * - Brouillon gardé sur l'appareil (clé sinDeclaration).
 * - Photos compressées et rangées dans IndexedDB (base simulateur-sinistre).
 * - Window.Declaration.mount(el) : construit l'interface (une seule fois).
 */
(function () {
  'use strict';

  const KEY = 'sinDeclaration';
  const NNBSP = ' ';
  const MAX_PHOTOS = 10; // par véhicule
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = id => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } },
  };
  const toast = (...args) => { if (window.appToast) window.appToast(...args); };
  const announce = m => { if (window.appAnnounce) window.appAnnounce(m); };
  const S = () => window.Sinistre;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmtDate = v => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return '';
    const [y, m, d] = v.split('-').map(Number);
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d));
  };

  /* ---------- Modèle ---------- */
  const STEPS = [
    { id: 'accident', label: 'Accident', title: 'L’accident' },
    { id: 'A', label: 'Véhicule A', title: 'Véhicule A' },
    { id: 'B', label: 'Véhicule B', title: 'Véhicule B' },
    { id: 'circ', label: 'Circonstances', title: 'Circonstances' },
    { id: 'croquis', label: 'Croquis', title: 'Croquis de l’accident' },
    { id: 'chocs', label: 'Chocs et photos', title: 'Points de choc, dégâts et photos' },
    { id: 'recap', label: 'Récapitulatif', title: 'Récapitulatif de la déclaration' },
  ];
  // Rubriques du constat amiable pour chaque véhicule
  const VEH = [
    { title: 'Conducteur', fields: [
      { k: 'condNom', label: 'Nom', ac: 'family-name' },
      { k: 'condPrenom', label: 'Prénom', ac: 'given-name' },
      { k: 'condAdresse', label: 'Adresse', ac: 'street-address', wide: true },
      { k: 'condTel', label: 'Téléphone', type: 'tel', ac: 'tel', im: 'tel' },
      { k: 'permis', label: 'Permis de conduire n°', spell: false },
      { k: 'permisDate', label: 'Délivré le', type: 'date' },
    ] },
    { title: 'Véhicule', fields: [
      { k: 'marque', label: 'Marque et type', ph: 'Ex. Kia Picanto' },
      { k: 'immat', label: 'N° d’immatriculation', spell: false, ph: 'Ex. 214 TU 5678' },
    ] },
    { title: 'Assurance', fields: [
      { k: 'assureur', label: 'Société d’assurance' },
      { k: 'police', label: 'N° de contrat', spell: false },
      { k: 'agence', label: 'Agence' },
      { k: 'valDu', label: 'Attestation valable du', type: 'date' },
      { k: 'valAu', label: 'au', type: 'date' },
    ] },
    { title: 'Assuré, s’il n’est pas le conducteur', optional: true, fields: [
      { k: 'assNom', label: 'Nom et prénom' },
      { k: 'assAdresse', label: 'Adresse', wide: true },
    ] },
  ];
  const VEH_KEYS = VEH.flatMap(g => g.fields.map(f => f.k));
  const ZONES = [
    { k: 'avg', label: 'Avant gauche' }, { k: 'av', label: 'Avant' }, { k: 'avd', label: 'Avant droit' },
    { k: 'g', label: 'Côté gauche' }, null, { k: 'd', label: 'Côté droit' },
    { k: 'arg', label: 'Arrière gauche' }, { k: 'ar', label: 'Arrière' }, { k: 'ard', label: 'Arrière droit' },
  ];
  const ZONE_LABEL = Object.fromEntries(ZONES.filter(Boolean).map(z => [z.k, z.label]));
  // Zones dessinées sur la silhouette (vue de dessus, avant en haut)
  const ZONE_RECT = {
    avg: [18, 10, 22, 36], av: [40, 10, 20, 36], avd: [60, 10, 22, 36],
    g: [18, 46, 22, 78], d: [60, 46, 22, 78],
    arg: [18, 124, 22, 36], ar: [40, 124, 20, 36], ard: [60, 124, 22, 36],
  };
  const ROADS = {
    meme: 'Chaussée à deux voies',
    rue: 'Rue avec stationnement',
    route: 'Route hors agglomération',
    carrefour: 'Carrefour',
    prive: 'Sortie de parking ou lieu privé',
  };
  // positions de départ : véhicules séparés, flèche de marche derrière chacun
  const SK_DEFAULT = {
    meme: { A: { x: 70, y: 97, rot: 0 }, B: { x: 166, y: 53, rot: 180 }, I: { x: 118, y: 75 } },
    rue: { A: { x: 70, y: 82, rot: 0 }, B: { x: 166, y: 50, rot: 180 }, I: { x: 118, y: 66 } },
    route: { A: { x: 78, y: 92, rot: 0 }, B: { x: 160, y: 58, rot: 180 }, I: { x: 120, y: 75 } },
    carrefour: { A: { x: 62, y: 88, rot: 0 }, B: { x: 132, y: 104, rot: -90 }, I: { x: 112, y: 88 } },
    prive: { A: { x: 90, y: 96, rot: 0 }, B: { x: 169, y: 126, rot: -90 }, I: { x: 150, y: 106 } },
  };

  const ROAD_OF_SCENE = { meme: 'meme', inverse: 'meme', rue: 'rue', route: 'route', carrefour: 'carrefour', prive: 'prive', prive2: 'prive' };

  const blankVeh = () => Object.fromEntries(VEH_KEYS.map(k => [k, '']));
  const blankChoc = () => ({ zones: [], initial: '', degats: '', obs: '' });
  const blank = () => ({
    v: 1, step: 0,
    acc: { date: '', heure: '', lieu: '', gps: '', agglo: '', blesses: '', degats: '', temoins: '' },
    A: blankVeh(), B: blankVeh(),
    sketch: { road: 'meme', touched: false, note: '', A: { ...SK_DEFAULT.meme.A }, B: { ...SK_DEFAULT.meme.B }, I: { ...SK_DEFAULT.meme.I } },
    chocs: { A: blankChoc(), B: blankChoc() },
  });

  // Relit un brouillon en ne gardant que des valeurs attendues
  function clean(src) {
    const d = blank();
    if (!src || typeof src !== 'object') return d;
    const str = (v, max = 400) => (typeof v === 'string' ? v.slice(0, max) : '');
    const yn = v => (v === 'oui' || v === 'non' ? v : '');
    const num = (v, a, b, def) => (Number.isFinite(v) ? clamp(v, a, b) : def);
    d.step = clamp(src.step | 0, 0, STEPS.length - 1);
    const a = src.acc || {};
    d.acc = { date: str(a.date, 10), heure: str(a.heure, 5), lieu: str(a.lieu), gps: str(a.gps, 60), agglo: yn(a.agglo), blesses: yn(a.blesses), degats: yn(a.degats), temoins: str(a.temoins, 1000) };
    ['A', 'B'].forEach(v => { VEH_KEYS.forEach(k => { d[v][k] = str((src[v] || {})[k]); }); });
    const sk = src.sketch || {};
    if (ROADS[sk.road]) d.sketch.road = sk.road;
    d.sketch.touched = !!sk.touched;
    d.sketch.note = str(sk.note, 300);
    ['A', 'B', 'I'].forEach(id => {
      const p = sk[id] || {}, def = SK_DEFAULT[d.sketch.road][id];
      d.sketch[id] = { x: num(p.x, 8, 232, def.x), y: num(p.y, 8, 142, def.y) };
      if (id !== 'I') d.sketch[id].rot = num(p.rot, -360, 360, def.rot);
    });
    ['A', 'B'].forEach(v => {
      const c = (src.chocs || {})[v] || {};
      d.chocs[v] = {
        zones: (Array.isArray(c.zones) ? c.zones : []).filter(z => ZONE_LABEL[z]),
        initial: ZONE_LABEL[c.initial] ? c.initial : '',
        degats: str(c.degats, 600), obs: str(c.obs, 600),
      };
    });
    return d;
  }

  // Véhicule A pré-rempli avec le client du devis, s'il existe
  function clientData() {
    try { return JSON.parse(store.get('userFormData')) || {}; } catch (e) { return {}; }
  }
  function fillFromClient(veh) {
    const u = clientData();
    const map = { condNom: u.nom, condPrenom: u.prenom, condAdresse: u.adresse, condTel: u.mobile, marque: [u.marque, u.modele].filter(Boolean).join(' '), agence: u.agence };
    let n = 0;
    Object.entries(map).forEach(([k, v]) => { if (v && String(v).trim()) { veh[k] = String(v).trim(); n++; } });
    return n;
  }

  let d = blank();
  let root = null;
  let saveTimer = null;
  const q = sel => root.querySelector(sel);
  const qa = sel => [...root.querySelectorAll(sel)];
  function save(now) {
    clearTimeout(saveTimer);
    const run = () => store.set(KEY, JSON.stringify(d));
    if (now) run(); else saveTimer = setTimeout(run, 250);
  }
  function setPath(path, value) {
    const parts = path.split('.');
    let o = d;
    parts.slice(0, -1).forEach(p => { o = o[p]; });
    o[parts[parts.length - 1]] = value;
  }
  const getPath = path => path.split('.').reduce((o, p) => (o == null ? '' : o[p]), d);

  /* ---------- Photos (IndexedDB, repli en mémoire) ---------- */
  const Photos = (() => {
    let dbp = null;
    let memory = false;
    const mem = [];
    let memId = 0;
    function open() {
      if (dbp) return dbp;
      dbp = new Promise((res, rej) => {
        if (!window.indexedDB) { rej(new Error('indisponible')); return; }
        const r = indexedDB.open('simulateur-sinistre', 1);
        r.onupgradeneeded = () => { r.result.createObjectStore('photos', { keyPath: 'id', autoIncrement: true }); };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      }).catch(() => { memory = true; return null; });
      return dbp;
    }
    const run = (db, mode, fn) => new Promise((res, rej) => {
      const t = db.transaction('photos', mode);
      const req = fn(t.objectStore('photos'));
      t.oncomplete = () => res(req ? req.result : undefined);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
    return {
      async all() { const db = await open(); return db ? run(db, 'readonly', s => s.getAll()) : mem.slice(); },
      async put(rec) {
        const db = await open();
        if (db) return run(db, 'readwrite', s => s.put(rec));
        if (rec.id == null) rec.id = ++memId;
        const i = mem.findIndex(p => p.id === rec.id);
        if (i >= 0) mem[i] = rec; else mem.push(rec);
        return rec.id;
      },
      async del(id) { const db = await open(); if (db) return run(db, 'readwrite', s => s.delete(id)); const i = mem.findIndex(p => p.id === id); if (i >= 0) mem.splice(i, 1); return undefined; },
      async clear() { const db = await open(); if (db) return run(db, 'readwrite', s => s.clear()); mem.length = 0; return undefined; },
      volatile: () => memory,
    };
  })();
  let photos = []; // { id, v, blob, w, h, t }
  const urls = new Map();
  const urlOf = p => { if (!urls.has(p.id)) urls.set(p.id, URL.createObjectURL(p.blob)); return urls.get(p.id); };
  function dropUrl(id) { if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); } }

  function loadImage(file) {
    return new Promise((res, rej) => {
      const u = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(u); res(img); };
      img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('image')); };
      img.src = u;
    });
  }
  // Réduit la photo à 1 600 px de côté au plus, en JPEG
  async function compress(file) {
    let src;
    try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { src = await loadImage(file); }
    const w0 = src.width, h0 = src.height;
    const k = Math.min(1, 1600 / Math.max(w0, h0));
    const w = Math.round(w0 * k), h = Math.round(h0 * k);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(src, 0, 0, w, h);
    if (src.close) src.close();
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
    return { blob: blob || file, w, h };
  }
  async function addPhotos(v, files) {
    const room = MAX_PHOTOS - photos.filter(p => p.v === v).length;
    const list = [...files].filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)).slice(0, Math.max(0, room));
    if (!list.length) { toast(room <= 0 ? `${MAX_PHOTOS} photos au plus par véhicule : supprimez-en une pour en ajouter.` : 'Choisissez une image (JPEG, PNG ou WebP).', 'warn'); return; }
    const box = q(`[data-photos="${v}"]`);
    if (box) box.setAttribute('aria-busy', 'true');
    let added = 0, failed = 0;
    for (const f of list) {
      try {
        const { blob, w, h } = await compress(f);
        const rec = { v, blob, w, h, t: Date.now() };
        rec.id = await Photos.put(rec);
        photos.push(rec);
        added++;
      } catch (e) { failed++; }
    }
    renderPhotos(v);
    if (added) announce(`${added} photo${added > 1 ? 's' : ''} ajoutée${added > 1 ? 's' : ''} au véhicule ${v}.`);
    if (failed) toast(`${failed} image${failed > 1 ? 's' : ''} illisible${failed > 1 ? 's' : ''} : utilisez le format JPEG, PNG ou WebP.`, 'warn');
  }
  async function removePhoto(id) {
    const p = photos.find(x => x.id === id);
    if (!p) return;
    photos = photos.filter(x => x.id !== id);
    await Photos.del(id);
    dropUrl(id);
    renderPhotos(p.v);
    const add = q(`[data-photos="${p.v}"] .dcl-photo-add`);
    if (add) add.focus({ preventScroll: true });
    toast('Photo supprimée.', null, { label: 'Annuler', run: async () => { await Photos.put(p); photos.push(p); photos.sort((a, b) => a.t - b.t); renderPhotos(p.v); } });
  }

  /* ---------- Rendu : champs ---------- */
  const field = (path, f, scope) => {
    const id = 'dcl-' + path.replace(/\./g, '-');
    const val = getPath(path);
    const ac = scope === 'A' && f.ac ? f.ac : 'off';
    return `
      <div class="field${f.wide ? ' dcl-wide' : ''}">
        <label for="${id}">${esc(f.label)}</label>
        <input class="input" id="${id}" name="${id}" data-f="${path}" type="${f.type || 'text'}" value="${esc(val)}" autocomplete="${ac}"${f.im ? ` inputmode="${f.im}"` : ''}${f.spell === false ? ' spellcheck="false"' : ''}${f.ph ? ` placeholder="${esc(f.ph)}"` : ''}${f.type === 'date' && /date$/i.test(f.k || '') ? ` max="${today()}"` : ''}>
      </div>`;
  };
  const today = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
  const yesNo = (path, label) => {
    const id = 'dcl-' + path.replace(/\./g, '-');
    const val = getPath(path);
    return `
      <div class="field">
        <span class="label" id="${id}-l">${esc(label)}</span>
        <div class="segmented" role="radiogroup" aria-labelledby="${id}-l">
          <label><input type="radio" name="${id}" data-f="${path}" value="non"${val === 'non' ? ' checked' : ''}><span>Non</span></label>
          <label><input type="radio" name="${id}" data-f="${path}" value="oui"${val === 'oui' ? ' checked' : ''}><span>Oui</span></label>
        </div>
      </div>`;
  };
  const area = (path, label, ph, rows = 3) => {
    const id = 'dcl-' + path.replace(/\./g, '-');
    return `
      <div class="field dcl-wide">
        <label for="${id}">${esc(label)}</label>
        <textarea class="input dcl-area" id="${id}" name="${id}" data-f="${path}" rows="${rows}" autocomplete="off"${ph ? ` placeholder="${esc(ph)}"` : ''}>${esc(getPath(path))}</textarea>
      </div>`;
  };

  /* ---------- Étapes ---------- */
  function stepAccident() {
    const a = d.acc;
    return `
      <div class="dcl-grid">
        <div class="field">
          <label for="dcl-acc-date">Date</label>
          <input class="input" id="dcl-acc-date" name="dcl-acc-date" data-f="acc.date" type="date" value="${esc(a.date)}" max="${today()}" autocomplete="off">
        </div>
        <div class="field">
          <label for="dcl-acc-heure">Heure</label>
          <input class="input" id="dcl-acc-heure" name="dcl-acc-heure" data-f="acc.heure" type="time" value="${esc(a.heure)}" autocomplete="off">
        </div>
        <div class="field dcl-wide">
          <label for="dcl-acc-lieu">Lieu</label>
          <div class="dcl-inline">
            <input class="input" id="dcl-acc-lieu" name="dcl-acc-lieu" data-f="acc.lieu" type="text" value="${esc(a.lieu)}" placeholder="Ex. avenue Habib Bourguiba, Tunis, devant le n° 12" autocomplete="off">
            <button type="button" class="btn btn--ghost" data-act="gps">${icon('i-target')}<span>Ma position</span></button>
          </div>
          <p class="hint" id="dcl-gps-hint"${a.gps ? '' : ' hidden'}>Coordonnées GPS : <b>${esc(a.gps)}</b></p>
        </div>
        ${yesNo('acc.agglo', 'En agglomération')}
        ${yesNo('acc.blesses', 'Blessés, même légers')}
        ${yesNo('acc.degats', 'Dégâts matériels autres qu’aux véhicules A et B')}
        ${area('acc.temoins', 'Témoins', 'Noms, adresses et téléphones (à souligner s’il s’agit d’un passager de A ou de B)')}
      </div>`;
  }

  function stepVehicle(v) {
    const hasClient = v === 'A' && Object.keys(clientData()).some(k => clientData()[k]);
    return `
      <div class="dcl-veh-head">
        <span class="veh-tag veh-tag--${v.toLowerCase()}">${v}</span>
        <p>${v === 'A' ? 'Véhicule de votre client, en général.' : 'Véhicule de l’autre conducteur : recopiez son attestation d’assurance et son permis.'}</p>
        ${hasClient ? `<button type="button" class="btn btn--ghost btn--sm" data-act="client">${icon('i-user')} Reprendre le client du devis</button>` : ''}
      </div>
      ${VEH.map(g => `
        <fieldset class="dcl-group">
          <legend>${esc(g.title)}${g.optional ? '<span class="label-optional">facultatif</span>' : ''}</legend>
          <div class="dcl-grid">${g.fields.map(f => field(`${v}.${f.k}`, f, v)).join('')}</div>
        </fieldset>`).join('')}`;
  }

  function stepCirc() {
    const s = S();
    if (!s || !s.current) return '<p class="hint">Le constat interactif n’est pas disponible.</p>';
    const cur = s.current();
    const res = s.verdict();
    const col = v => {
      const b = (cur.boxes[v] || []).slice().sort((x, y) => x - y);
      return `
        <div class="dcl-circ-col">
          <p class="dcl-circ-head"><span class="veh-tag veh-tag--${v.toLowerCase()}">${v}</span><b>${b.length} case${b.length > 1 ? 's' : ''} cochée${b.length > 1 ? 's' : ''}</b></p>
          ${b.length ? `<ul>${b.map(n => `<li><span class="dcl-num">${n}</span>${esc(s.CIRC[n])}</li>`).join('')}</ul>` : '<p class="hint">Aucune case cochée.</p>'}
        </div>`;
    };
    const pc = x => Math.round(x * 100) + NNBSP + '%';
    const verdict = res.status === 'ok'
      ? `<div class="dcl-verdict"><span class="dcl-verdict-k">Cas n° ${res.n} du barème FTUSA</span><strong>A ${pc(res.resp.A)} · B ${pc(res.resp.B)}</strong><span class="hint">Indication : la décision revient à l’assureur, au vu du constat complet.</span></div>`
      : `<div class="hint-warn">${icon('i-warn')}<span>${res.status === 'empty' ? 'Aucune circonstance n’est encore cochée.' : 'Les cases cochées ne suffisent pas encore à désigner un cas du barème.'} Complétez-les sur le constat interactif.</span></div>`;
    return `
      <p class="dcl-lead">Les circonstances viennent du <b>constat interactif</b> : cochez-y les cases de chaque conducteur, elles s’affichent ici.</p>
      <div class="dcl-circ">${col('A')}${col('B')}</div>
      ${verdict}
      <button type="button" class="btn btn--blue" data-act="constat">${icon('i-pen')} ${res.status === 'empty' ? 'Cocher les circonstances' : 'Modifier les circonstances'}</button>`;
  }

  /* ---------- Croquis ---------- */
  function skItem(id) {
    const s = S();
    const p = d.sketch[id];
    const halo = `<circle class="sk-halo" cx="${p.x}" cy="${p.y}" r="${id === 'I' ? 13 : 25}"/>`;
    if (id === 'I') return `${halo}${s.star(p.x, p.y, 9)}`;
    const arrow = `<g transform="translate(${p.x} ${p.y}) rotate(${p.rot})"><path class="sk-dir" d="M-50 0 H-25" marker-end="url(#${skHead})"/></g>`;
    return `${halo}${arrow}${s.carSvg(p.x, p.y, p.rot, s.COL[id], id)}`;
  }
  const ITEM_NAME = { A: 'Véhicule A', B: 'Véhicule B', I: 'Point de choc' };
  let svgUid = 0; // identifiants SVG uniques : le récapitulatif existe aussi dans la copie imprimée
  let skHead = 'skHead';
  function sketchSvg(interactive) {
    const s = S();
    skHead = 'skHead' + (++svgUid);
    const items = ['A', 'B', 'I'].map(id => interactive
      ? `<g class="sk-item" data-id="${id}" tabindex="0" role="button" aria-roledescription="élément déplaçable" aria-label="${ITEM_NAME[id]}" aria-describedby="dclSkHelp">${skItem(id)}</g>`
      : `<g>${skItem(id)}</g>`).join('');
    return `<svg class="scene dcl-sk-svg" viewBox="0 0 240 150" ${interactive ? 'role="group" aria-label="Croquis : déplacez les véhicules et le point de choc"' : 'role="img" aria-label="Croquis de l’accident"'}><defs><marker id="${skHead}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${s.COL.ink}"/></marker></defs>${s.roadSvg(d.sketch.road)}${items}</svg>`;
  }
  let skSel = 'A';
  function stepCroquis() {
    const s = S();
    const res = s && s.verdict ? s.verdict() : {};
    const canImport = res.status === 'ok' && s.layout && s.layout(res.n);
    return `
      <div class="dcl-sk">
        <div class="dcl-sk-side">
          <div class="field">
            <span class="label" id="dclRoadL">Type de voie</span>
            <div class="dcl-roads" role="radiogroup" aria-labelledby="dclRoadL">
              ${Object.entries(ROADS).map(([k, l]) => `<label><input type="radio" name="dcl-road" value="${k}"${d.sketch.road === k ? ' checked' : ''}><span>${esc(l)}</span></label>`).join('')}
            </div>
          </div>
          ${canImport ? `<button type="button" class="btn btn--ghost btn--sm" data-act="import">${icon('i-download')} Partir du croquis du cas n° ${res.n}</button>` : ''}
          <button type="button" class="btn btn--ghost btn--sm" data-act="replace">${icon('i-reset')} Replacer les véhicules</button>
        </div>
        <div class="dcl-sk-main">
          <figure class="dcl-sk-stage">${sketchSvg(true)}</figure>
          <div class="dcl-sk-tools" role="group" aria-label="Déplacer l’élément choisi">
            <div class="segmented segmented--3 dcl-sk-pick" role="radiogroup" aria-label="Élément à déplacer">
              ${['A', 'B', 'I'].map(id => `<label><input type="radio" name="dcl-sk-pick" value="${id}"${skSel === id ? ' checked' : ''}><span>${id === 'I' ? 'Choc' : 'Véhicule ' + id}</span></label>`).join('')}
            </div>
            <div class="dcl-pad">
              <button type="button" class="btn btn--ghost btn--sm icon-only" data-move="-1,0" aria-label="Vers la gauche">${icon('i-arrow-left')}</button>
              <button type="button" class="btn btn--ghost btn--sm icon-only dcl-up" data-move="0,-1" aria-label="Vers le haut">${icon('i-arrow-right')}</button>
              <button type="button" class="btn btn--ghost btn--sm icon-only dcl-down" data-move="0,1" aria-label="Vers le bas">${icon('i-arrow-right')}</button>
              <button type="button" class="btn btn--ghost btn--sm icon-only" data-move="1,0" aria-label="Vers la droite">${icon('i-arrow-right')}</button>
              <span class="dcl-pad-sep" aria-hidden="true"></span>
              <button type="button" class="btn btn--ghost btn--sm icon-only" data-rot="-15" aria-label="Pivoter vers la gauche"${skSel === 'I' ? ' disabled' : ''}>${icon('i-undo')}</button>
              <button type="button" class="btn btn--ghost btn--sm icon-only" data-rot="15" aria-label="Pivoter vers la droite"${skSel === 'I' ? ' disabled' : ''}>${icon('i-redo')}</button>
            </div>
          </div>
          <p class="hint" id="dclSkHelp">Faites glisser les véhicules et l’étoile du choc. Au clavier : flèches pour déplacer (Maj pour aller plus vite), R pour pivoter (Maj + R dans l’autre sens).</p>
          ${field('sketch.note', { label: 'Repères', ph: 'Ex. rue de Marseille, feu tricolore, passage piéton', wide: true })}
        </div>
      </div>`;
  }
  function drawItem(id) {
    const g = q(`.sk-item[data-id="${id}"]`);
    if (g) g.innerHTML = skItem(id);
  }
  function selectItem(id, focus) {
    skSel = id;
    qa('.sk-item').forEach(g => g.classList.toggle('is-sel', g.dataset.id === id));
    const r = q(`input[name="dcl-sk-pick"][value="${id}"]`);
    if (r) r.checked = true;
    qa('[data-rot]').forEach(b => { b.disabled = id === 'I'; });
    if (focus) { const g = q(`.sk-item[data-id="${id}"]`); if (g) g.focus({ preventScroll: true }); }
  }
  function moveItem(id, dx, dy) {
    const p = d.sketch[id];
    p.x = clamp(Math.round((p.x + dx) * 10) / 10, 8, 232);
    p.y = clamp(Math.round((p.y + dy) * 10) / 10, 8, 142);
    d.sketch.touched = true;
    drawItem(id);
    save();
  }
  function rotateItem(id, deg) {
    if (id === 'I') return;
    const p = d.sketch[id];
    p.rot = ((p.rot + deg + 540) % 360) - 180;
    d.sketch.touched = true;
    drawItem(id);
    save();
    announce(`${ITEM_NAME[id]} orienté à ${Math.round(p.rot)} degrés.`);
  }
  function placeDefaults() {
    const def = SK_DEFAULT[d.sketch.road];
    ['A', 'B', 'I'].forEach(id => { d.sketch[id] = { ...def[id] }; });
  }
  function bindSketch() {
    const svg = q('.dcl-sk-svg');
    if (!svg) return;
    selectItem(skSel);
    let drag = null;
    const toSvg = e => new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    svg.addEventListener('pointerdown', e => {
      const g = e.target.closest('.sk-item');
      if (!g || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      const id = g.dataset.id;
      selectItem(id);
      g.focus({ preventScroll: true });
      const pt = toSvg(e);
      drag = { id, pid: e.pointerId, dx: d.sketch[id].x - pt.x, dy: d.sketch[id].y - pt.y };
      g.setPointerCapture(e.pointerId);
      svg.classList.add('is-dragging');
    });
    svg.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.pid) return;
      const pt = toSvg(e);
      const p = d.sketch[drag.id];
      p.x = clamp(Math.round((pt.x + drag.dx) * 10) / 10, 8, 232);
      p.y = clamp(Math.round((pt.y + drag.dy) * 10) / 10, 8, 142);
      drawItem(drag.id);
    });
    const end = e => {
      if (!drag || e.pointerId !== drag.pid) return;
      drag = null;
      d.sketch.touched = true;
      svg.classList.remove('is-dragging');
      save();
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('keydown', e => {
      const g = e.target.closest('.sk-item');
      if (!g) return;
      const id = g.dataset.id;
      const step = e.shiftKey ? 10 : 2;
      const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (mv) { e.preventDefault(); selectItem(id); moveItem(id, ...mv); return; }
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); selectItem(id); rotateItem(id, e.shiftKey ? -15 : 15); return; }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectItem(id); }
    });
    svg.addEventListener('focusin', e => { const g = e.target.closest('.sk-item'); if (g) selectItem(g.dataset.id); });
  }

  /* ---------- Points de choc ---------- */
  function carTop(v, chocs, small) {
    const s = S();
    const fill = s ? s.COL[v] : '#ccc';
    const uid = v + (++svgUid);
    const ink = '#1b1d21';
    const zones = Object.entries(ZONE_RECT).map(([k, [x, y, w, h]]) => {
      const on = chocs.zones.includes(k);
      return `<rect class="dcl-zone${on ? ' is-on' : ''}" data-zone="${k}" x="${x}" y="${y}" width="${w}" height="${h}" clip-path="url(#dclBody${uid})"${on ? ` fill="url(#dclHatch${uid})"` : ''}/>`;
    }).join('');
    const ini = chocs.initial ? (() => { const [x, y, w, h] = ZONE_RECT[chocs.initial]; return s ? s.star(x + w / 2, y + h / 2, 8) : ''; })() : '';
    return `
      <svg class="dcl-car" viewBox="0 0 100 170" ${small ? 'role="img"' : 'aria-hidden="true"'}${small ? ` aria-label="Véhicule ${v} : ${chocs.zones.length ? esc(chocs.zones.map(z => ZONE_LABEL[z].toLowerCase()).join(', ')) : 'aucun point de choc'}"` : ''}>
        <defs>
          <clipPath id="dclBody${uid}"><rect x="18" y="10" width="64" height="150" rx="18"/></clipPath>
          <pattern id="dclHatch${uid}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#fff" opacity=".55"/><rect width="3.2" height="7" fill="#c4161c"/></pattern>
        </defs>
        <rect x="12" y="30" width="8" height="24" rx="3" fill="${ink}"/><rect x="80" y="30" width="8" height="24" rx="3" fill="${ink}"/>
        <rect x="12" y="116" width="8" height="24" rx="3" fill="${ink}"/><rect x="80" y="116" width="8" height="24" rx="3" fill="${ink}"/>
        <rect x="18" y="10" width="64" height="150" rx="18" fill="${fill}" stroke="${ink}" stroke-width="2"/>
        ${zones}
        <path d="M26 52 Q50 42 74 52 L70 68 Q50 62 30 68 Z" fill="${ink}" opacity=".55"/>
        <path d="M30 122 Q50 127 70 122 L73 136 Q50 144 27 136 Z" fill="${ink}" opacity=".4"/>
        <rect x="30" y="72" width="40" height="46" rx="6" fill="${ink}" opacity=".12"/>
        <text x="50" y="102" text-anchor="middle" font-size="22" font-weight="800" fill="${ink}" font-family="Geist, system-ui, sans-serif">${v}</text>
        <text x="50" y="7" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor" font-family="Geist, system-ui, sans-serif" class="dcl-car-front">AVANT</text>
        ${ini}
      </svg>`;
  }
  function chocPanel(v) {
    const c = d.chocs[v];
    const count = photos.filter(p => p.v === v).length;
    return `
      <section class="dcl-choc" aria-labelledby="dclChoc${v}">
        <h4 class="dcl-choc-title" id="dclChoc${v}"><span class="veh-tag veh-tag--${v.toLowerCase()}">${v}</span>Véhicule ${v}</h4>
        <div class="dcl-zones" role="group" aria-label="Zones touchées du véhicule ${v}">
          ${ZONES.map(z => z ? `<button type="button" class="dcl-zone-btn" data-v="${v}" data-z="${z.k}" aria-pressed="${c.zones.includes(z.k)}">${esc(z.label)}</button>` : `<div class="dcl-zone-car" data-carbox="${v}">${carTop(v, c)}</div>`).join('')}
        </div>
        <div class="field">
          <label for="dcl-chocs-${v}-initial">Point de choc initial</label>
          <select class="select" id="dcl-chocs-${v}-initial" name="dcl-chocs-${v}-initial" data-f="chocs.${v}.initial">
            <option value="">Non précisé</option>
            ${ZONES.filter(Boolean).map(z => `<option value="${z.k}"${c.initial === z.k ? ' selected' : ''}>${esc(z.label)}</option>`).join('')}
          </select>
        </div>
        ${area(`chocs.${v}.degats`, 'Dégâts apparents', 'Ex. pare-chocs avant enfoncé, phare gauche cassé', 2)}
        ${area(`chocs.${v}.obs`, 'Observations', '', 2)}
        <div class="dcl-photos" data-photos="${v}">
          <div class="dcl-photos-head">
            <span class="label">Photos <span class="label-optional" data-photo-count="${v}">${count}/${MAX_PHOTOS}</span></span>
            <div class="dcl-photo-btns">
              <button type="button" class="btn btn--ghost btn--sm dcl-photo-add" data-pick="${v}" data-capture="1">${icon('i-plus')} Prendre une photo</button>
              <button type="button" class="btn btn--ghost btn--sm" data-pick="${v}">${icon('i-upload')} Importer</button>
            </div>
          </div>
          <ul class="dcl-thumbs" data-thumbs="${v}"></ul>
        </div>
      </section>`;
  }
  function stepChocs() {
    return `
      <p class="dcl-lead">Touchez les zones abîmées de chaque véhicule, indiquez le point de choc initial et ajoutez des photos des dégâts.</p>
      ${Photos.volatile() ? `<p class="hint-warn">${icon('i-warn')}<span>Ce navigateur ne permet pas de garder les photos : elles seront perdues à la fermeture de la page.</span></p>` : ''}
      <div class="dcl-chocs">${chocPanel('A')}${chocPanel('B')}</div>
      <input type="file" id="dclFile" accept="image/*" multiple hidden>
      <input type="file" id="dclCamera" accept="image/*" capture="environment" hidden>`;
  }
  function renderPhotos(v) {
    const ul = q(`[data-thumbs="${v}"]`);
    if (!ul) return;
    const list = photos.filter(p => p.v === v);
    const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
    ul.innerHTML = list.length ? list.map((p, i) => `
      <li class="dcl-thumb">
        <img src="${urlOf(p)}" alt="Photo ${i + 1} du véhicule ${v}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async">
        <span class="dcl-thumb-cap">${v} · ${time.format(p.t)}</span>
        <button type="button" class="dcl-thumb-del" data-del="${p.id}" aria-label="Supprimer la photo ${i + 1} du véhicule ${v}">${icon('i-trash')}</button>
      </li>`).join('') : '';
    ul.hidden = !list.length;
    const box = q(`[data-photos="${v}"]`);
    if (box) box.removeAttribute('aria-busy');
    const cnt = q(`[data-photo-count="${v}"]`);
    if (cnt) cnt.textContent = `${list.length}/${MAX_PHOTOS}`;
  }
  function toggleZone(v, z) {
    const c = d.chocs[v];
    c.zones = c.zones.includes(z) ? c.zones.filter(x => x !== z) : [...c.zones, z];
    if (!c.zones.includes(c.initial) && c.initial === z) c.initial = '';
    const btn = q(`.dcl-zone-btn[data-v="${v}"][data-z="${z}"]`);
    if (btn) btn.setAttribute('aria-pressed', String(c.zones.includes(z)));
    const sel = q(`#dcl-chocs-${v}-initial`);
    if (sel) sel.value = c.initial;
    q(`[data-carbox="${v}"]`).innerHTML = carTop(v, c);
    save();
  }

  /* ---------- Récapitulatif ---------- */
  function missing() {
    const m = [];
    const a = d.acc;
    if (!a.date) m.push([0, 'date de l’accident']);
    if (!a.lieu && !a.gps) m.push([0, 'lieu de l’accident']);
    ['A', 'B'].forEach((v, i) => {
      if (!d[v].condNom) m.push([1 + i, `nom du conducteur ${v}`]);
      if (!d[v].immat) m.push([1 + i, `immatriculation du véhicule ${v}`]);
      if (!d[v].assureur) m.push([1 + i, `assureur du véhicule ${v}`]);
    });
    const s = S();
    if (s && s.current) { const c = s.current(); if (!c.boxes.A.length && !c.boxes.B.length) m.push([3, 'circonstances']); }
    if (!d.sketch.touched) m.push([4, 'croquis']);
    ['A', 'B'].forEach(v => { if (!d.chocs[v].zones.length) m.push([5, `points de choc du véhicule ${v}`]); });
    return m;
  }
  const filled = i => {
    const id = STEPS[i].id;
    if (id === 'recap') return false;
    return !missing().some(([s]) => s === i);
  };
  const row = (k, v) => `<div><dt>${esc(k)}</dt><dd>${v ? esc(v) : '<span class="dcl-none">—</span>'}</dd></div>`;
  const yn = v => (v === 'oui' ? 'Oui' : v === 'non' ? 'Non' : '');
  function vehDoc(v) {
    const x = d[v];
    const c = d.chocs[v];
    const name = [x.condPrenom, x.condNom].filter(Boolean).join(' ');
    const list = photos.filter(p => p.v === v);
    return `
      <section class="dcl-doc-veh dcl-doc-veh--${v.toLowerCase()}">
        <h4><span class="veh-tag veh-tag--${v.toLowerCase()}">${v}</span>Véhicule ${v}</h4>
        <dl class="dcl-dl">
          ${row('Conducteur', name)}
          ${row('Adresse', x.condAdresse)}
          ${row('Téléphone', x.condTel)}
          ${row('Permis', [x.permis, x.permisDate && 'délivré le ' + fmtDate(x.permisDate)].filter(Boolean).join(', '))}
          ${row('Véhicule', [x.marque, x.immat].filter(Boolean).join(' · '))}
          ${row('Assurance', [x.assureur, x.police && 'contrat ' + x.police, x.agence && 'agence ' + x.agence].filter(Boolean).join(' · '))}
          ${row('Attestation', x.valDu || x.valAu ? `du ${fmtDate(x.valDu) || '—'} au ${fmtDate(x.valAu) || '—'}` : '')}
          ${x.assNom || x.assAdresse ? row('Assuré', [x.assNom, x.assAdresse].filter(Boolean).join(', ')) : ''}
        </dl>
        <div class="dcl-doc-chocs">
          ${carTop(v, c, true)}
          <dl class="dcl-dl">
            ${row('Zones touchées', c.zones.map(z => ZONE_LABEL[z]).join(', '))}
            ${row('Choc initial', ZONE_LABEL[c.initial] || '')}
            ${row('Dégâts apparents', c.degats)}
            ${row('Observations', c.obs)}
          </dl>
        </div>
        ${list.length ? `<ul class="dcl-doc-photos">${list.map((p, i) => `<li><img src="${urlOf(p)}" alt="Photo ${i + 1} du véhicule ${v}" width="${p.w}" height="${p.h}" loading="lazy"></li>`).join('')}</ul>` : ''}
      </section>`;
  }
  function docHtml() {
    const s = S();
    const a = d.acc;
    const cur = s && s.current ? s.current() : { boxes: { A: [], B: [] } };
    const res = s && s.verdict ? s.verdict() : { status: 'empty' };
    const pc = x => Math.round(x * 100) + NNBSP + '%';
    const circ = v => {
      const b = (cur.boxes[v] || []).slice().sort((x, y) => x - y);
      return b.length ? `<ul>${b.map(n => `<li><span class="dcl-num">${n}</span>${esc(s.CIRC[n])}</li>`).join('')}</ul>` : '<p class="dcl-none">Aucune case cochée.</p>';
    };
    const when = [fmtDate(a.date), a.heure && 'à ' + a.heure.replace(':', ' h ')].filter(Boolean).join(' ');
    return `
      <article class="dcl-doc">
        <header class="dcl-doc-head">
          <div><p class="dcl-doc-kicker">Préparation du constat amiable</p><h3 class="dcl-doc-title">Déclaration d’accident</h3></div>
          <p class="dcl-doc-date">Établie le ${esc(new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date()))}</p>
        </header>
        <section class="dcl-doc-sec">
          <h4>L’accident</h4>
          <dl class="dcl-dl dcl-dl--2">
            ${row('Date et heure', when)}
            ${row('Lieu', [a.lieu, a.gps && 'GPS ' + a.gps].filter(Boolean).join(' · '))}
            ${row('En agglomération', yn(a.agglo))}
            ${row('Blessés, même légers', yn(a.blesses))}
            ${row('Autres dégâts matériels', yn(a.degats))}
            ${row('Témoins', a.temoins)}
          </dl>
        </section>
        <div class="dcl-doc-vehs">${vehDoc('A')}${vehDoc('B')}</div>
        <section class="dcl-doc-sec">
          <h4>Circonstances</h4>
          <div class="dcl-circ dcl-circ--doc">
            <div class="dcl-circ-col"><p class="dcl-circ-head"><span class="veh-tag veh-tag--a">A</span><b>Véhicule A</b></p>${circ('A')}</div>
            <div class="dcl-circ-col"><p class="dcl-circ-head"><span class="veh-tag veh-tag--b">B</span><b>Véhicule B</b></p>${circ('B')}</div>
          </div>
          ${res.status === 'ok' ? `<p class="dcl-doc-verdict">Barème FTUSA : cas n° ${res.n}, responsabilité A ${pc(res.resp.A)} · B ${pc(res.resp.B)}. Indication, la décision revient à l’assureur.</p>` : ''}
        </section>
        <section class="dcl-doc-sec">
          <h4>Croquis</h4>
          <figure class="dcl-doc-sketch">${s ? sketchSvg(false) : ''}${d.sketch.note ? `<figcaption>${esc(d.sketch.note)}</figcaption>` : ''}</figure>
        </section>
        <p class="dcl-doc-foot">Document d’aide à la préparation du constat amiable : il ne le remplace pas. Le constat est rempli et signé par les deux conducteurs.</p>
      </article>`;
  }
  function stepRecap() {
    const m = missing();
    return `
      ${m.length ? `
      <div class="dcl-missing" role="note">
        <p class="dcl-missing-title">${icon('i-info')} ${m.length} élément${m.length > 1 ? 's' : ''} à compléter</p>
        <ul>${m.map(([st, l]) => `<li><button type="button" class="dcl-link" data-go="${st}">${esc(l.charAt(0).toUpperCase() + l.slice(1))}</button></li>`).join('')}</ul>
      </div>` : `<p class="dcl-complete">${icon('i-check')} Déclaration complète : il reste à recopier ces éléments sur le constat et à le signer.</p>`}
      ${docHtml()}
      <div class="dcl-recap-actions">
        <button type="button" class="btn btn--blue" data-act="print">${icon('i-print')} Imprimer ou enregistrer en PDF</button>
        <button type="button" class="btn btn--ghost" data-act="new">${icon('i-reset')} Nouvelle déclaration</button>
      </div>`;
  }

  /* ---------- Assistant ---------- */
  const BODY = { accident: stepAccident, A: () => stepVehicle('A'), B: () => stepVehicle('B'), circ: stepCirc, croquis: stepCroquis, chocs: stepChocs, recap: stepRecap };
  function render(focus) {
    const i = d.step;
    const st = STEPS[i];
    root.innerHTML = `
      <div class="dcl">
        <nav class="dcl-nav" aria-label="Étapes de la déclaration">
          <ol class="dcl-steps">
            ${STEPS.map((s, j) => `
              <li class="${j === i ? 'is-cur' : ''}${filled(j) ? ' is-done' : ''}">
                <button type="button" data-go="${j}"${j === i ? ' aria-current="step"' : ''}>
                  <span class="dcl-step-n">${filled(j) && j !== i ? icon('i-check') : j + 1}</span>
                  <span class="dcl-step-l">${esc(s.label)}</span>
                  ${filled(j) ? '<span class="sr-only">(complété)</span>' : ''}
                </button>
              </li>`).join('')}
          </ol>
          <p class="dcl-progress" aria-hidden="true">Étape ${i + 1} sur ${STEPS.length}<span class="dcl-progress-bar"><span style="width:${(i + 1) / STEPS.length * 100}%"></span></span></p>
        </nav>
        <section class="panel dcl-panel" aria-labelledby="dclStepTitle">
          <h3 class="dcl-title" id="dclStepTitle" tabindex="-1"><span class="dcl-title-n">${i + 1}</span>${esc(st.title)}</h3>
          <div class="dcl-body">${BODY[st.id]()}</div>
          <div class="dcl-foot">
            ${i > 0 ? `<button type="button" class="btn btn--ghost" data-go="${i - 1}">${icon('i-arrow-left')} Précédent</button>` : '<span></span>'}
            ${i < STEPS.length - 1 ? `<button type="button" class="btn btn--blue" data-go="${i + 1}">Suivant<span class="dcl-next-l"> : ${esc(STEPS[i + 1].label)}</span> ${icon('i-arrow-right')}</button>` : ''}
          </div>
        </section>
        <p class="dcl-saved hint">${icon('i-lock')} Brouillon enregistré automatiquement sur cet appareil.</p>
      </div>`;
    // sur mobile, la barre d'étapes défile : l'étape en cours reste visible
    const ol = q('.dcl-steps'), cur = q('.dcl-steps .is-cur');
    if (ol && cur && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = cur.offsetLeft - (ol.clientWidth - cur.offsetWidth) / 2;
    if (st.id === 'croquis') bindSketch();
    if (st.id === 'chocs') { renderPhotos('A'); renderPhotos('B'); }
    if (focus) {
      const h = q('#dclStepTitle');
      h.focus({ preventScroll: true });
      const top = q('.dcl').getBoundingClientRect().top;
      if (top < 64) window.scrollBy({ top: top - 140, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
  }
  function go(i) {
    d.step = clamp(i, 0, STEPS.length - 1);
    save(true);
    render(true);
  }

  async function newDeclaration() {
    const before = JSON.stringify(d);
    const kept = photos.slice();
    d = blank();
    fillFromClient(d.A);
    photos = [];
    await Photos.clear();
    save(true);
    render(true);
    toast('Nouvelle déclaration commencée.', null, {
      label: 'Annuler',
      run: async () => {
        d = clean(JSON.parse(before));
        for (const p of kept) await Photos.put(p);
        photos = kept;
        save(true);
        render(true);
      },
    });
    setTimeout(() => { kept.forEach(p => { if (!photos.includes(p)) dropUrl(p.id); }); }, 10000);
  }

  function printDoc() {
    const pr = document.getElementById('printRoot');
    if (!pr) { window.print(); return; }
    pr.innerHTML = docHtml();
    window.print();
  }

  function locate(btn) {
    if (!navigator.geolocation) { toast('La localisation n’est pas disponible sur cet appareil : saisissez le lieu.', 'warn'); return; }
    btn.disabled = true;
    const label = btn.querySelector('span');
    label.textContent = 'Localisation…';
    navigator.geolocation.getCurrentPosition(pos => {
      d.acc.gps = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
      save();
      const hint = q('#dcl-gps-hint');
      if (hint) { hint.hidden = false; hint.innerHTML = `Coordonnées GPS : <b>${esc(d.acc.gps)}</b>`; }
      btn.disabled = false;
      label.textContent = 'Ma position';
      announce('Position ajoutée au lieu de l’accident.');
    }, () => {
      btn.disabled = false;
      label.textContent = 'Ma position';
      toast('Position introuvable : autorisez la localisation ou saisissez le lieu.', 'warn');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  function onClick(e) {
    const b = e.target.closest('button, [data-zone]');
    if (!b || b.disabled) return;
    if (b.dataset.go != null) { go(Number(b.dataset.go)); return; }
    if (b.dataset.z) { toggleZone(b.dataset.v, b.dataset.z); return; }
    if (b.dataset.zone) { const box = b.closest('[data-carbox]'); if (box) toggleZone(box.dataset.carbox, b.dataset.zone); return; }
    if (b.dataset.move) { const [x, y] = b.dataset.move.split(',').map(Number); moveItem(skSel, x * 4, y * 4); return; }
    if (b.dataset.rot) { rotateItem(skSel, Number(b.dataset.rot)); return; }
    if (b.dataset.pick) {
      const input = q(b.dataset.capture ? '#dclCamera' : '#dclFile');
      input.dataset.v = b.dataset.pick;
      input.value = '';
      input.click();
      return;
    }
    if (b.dataset.del) { removePhoto(Number(b.dataset.del)); return; }
    const act = b.dataset.act;
    if (act === 'gps') locate(b);
    else if (act === 'client') {
      const n = fillFromClient(d.A);
      save();
      render();
      q('[data-act="client"]').focus();
      toast(n ? 'Informations du client reprises.' : 'Aucune information client enregistrée.', n ? null : 'warn');
    } else if (act === 'constat') S().showTab('constat');
    else if (act === 'import') {
      const res = S().verdict();
      const lay = S().layout(res.n);
      if (!lay) return;
      const before = JSON.stringify(d.sketch);
      d.sketch.road = ROAD_OF_SCENE[lay.road] || 'meme';
      lay.cars.forEach(c => { const v = res.roles[c.r]; if (v) d.sketch[v] = { x: c.x, y: c.y, rot: c.rot }; });
      if (lay.impacts && lay.impacts[0]) d.sketch.I = { x: lay.impacts[0][0], y: lay.impacts[0][1] };
      d.sketch.touched = true;
      save();
      render();
      toast(`Croquis du cas n° ${res.n} repris : ajustez-le si besoin.`, null, { label: 'Annuler', run: () => { d.sketch = JSON.parse(before); save(); if (STEPS[d.step].id === 'croquis') render(); } });
    } else if (act === 'replace') {
      const before = JSON.stringify(d.sketch);
      placeDefaults();
      save();
      render();
      toast('Véhicules replacés.', null, { label: 'Annuler', run: () => { d.sketch = JSON.parse(before); save(); if (STEPS[d.step].id === 'croquis') render(); } });
    } else if (act === 'print') printDoc();
    else if (act === 'new') newDeclaration();
  }

  function onInput(e) {
    const t = e.target;
    if (t.name === 'dcl-road') {
      d.sketch.road = t.value;
      if (!d.sketch.touched) placeDefaults();
      save();
      const stage = q('.dcl-sk-stage');
      stage.innerHTML = sketchSvg(true);
      bindSketch();
      return;
    }
    if (t.name === 'dcl-sk-pick') { selectItem(t.value); return; }
    if (t.type === 'file') {
      if (t.files && t.files.length) addPhotos(t.dataset.v || 'A', t.files);
      return;
    }
    if (!t.dataset.f) return;
    if (t.type === 'radio' && !t.checked) return;
    setPath(t.dataset.f, t.value);
    if (/^chocs\.[AB]\.initial$/.test(t.dataset.f)) {
      const v = t.dataset.f.split('.')[1];
      const c = d.chocs[v];
      if (c.initial && !c.zones.includes(c.initial)) { c.zones.push(c.initial); const btn = q(`.dcl-zone-btn[data-v="${v}"][data-z="${c.initial}"]`); if (btn) btn.setAttribute('aria-pressed', 'true'); }
      q(`[data-carbox="${v}"]`).innerHTML = carTop(v, c);
    }
    save();
  }

  async function mount(el) {
    if (root || !el) return;
    root = el;
    let saved = null;
    try { saved = JSON.parse(store.get(KEY)); } catch (e) { saved = null; }
    if (saved) d = clean(saved);
    else { d = blank(); fillFromClient(d.A); }
    root.addEventListener('click', onClick);
    // champs texte à la frappe ; choix, listes et fichiers une seule fois, au changement
    const discrete = t => t.type === 'radio' || t.type === 'file' || t.tagName === 'SELECT';
    root.addEventListener('input', e => { if (!discrete(e.target)) onInput(e); });
    root.addEventListener('change', e => { if (discrete(e.target)) onInput(e); });
    window.addEventListener('pagehide', () => save(true));
    render();
    try { photos = (await Photos.all()).sort((a, b) => a.t - b.t); } catch (e) { photos = []; }
    if (STEPS[d.step].id === 'chocs') { renderPhotos('A'); renderPhotos('B'); }
    if (STEPS[d.step].id === 'recap') render();
  }

  window.Declaration = {
    mount,
    // ré-affiche l'étape (les circonstances changent sur le constat)
    refresh: () => { if (root && ['circ', 'croquis', 'recap'].includes(STEPS[d.step].id)) render(); },
    data: () => JSON.parse(JSON.stringify(d)),
    photos: () => photos.map(p => ({ id: p.id, v: p.v, w: p.w, h: p.h })),
  };
})();
