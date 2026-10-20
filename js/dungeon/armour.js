// Draws your Dungeon gear onto your pixel avatar (Camp, battles, the tower).
// Coordinates are in the 32x52 avatar grid: head x11-20 y5-15, torso x10-21 y18-29, arms x7-9 / x22-24,
// legs x11-15 / x16-20 y30-40, feet y41-42. Each piece follows its item art recipe (gearart2.js):
// same material, texture and features (capes, pauldrons, horns, glowing runes, fur...) at avatar size.
import { DITEMS } from './ddata.js';
import { MAT, GEM, TRIM } from './gearart.js';
import { RECIPES, M, TEX } from './gearart2.js';
import { avatarDataUrl, AW, AH } from '../sprites2.js';

const R_INDEX = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'];
const SOFT = new Set(['tunic', 'vest', 'jerkin', 'robe', 'shirt', 'coat', 'mantle', 'parka', 'ribcage', 'hood', 'coif', 'beast', 'cap', 'furhat', 'trousers', 'leggings', 'breeches', 'skirt']);
const SKIN = ['#8a5a3a', '#c08a62', '#d8a882', '#ecc6a2'];

function look(id) {
  const it = DITEMS[id];
  const rc = RECIPES[it.name] || {};
  const sec = Math.max(0, it.section || 0);
  const m = MAT[sec] || MAT[0];
  const R = R_INDEX.indexOf(it.rarity);
  const ramp = M[rc.mat] || m.metal;
  return { it, rc, sec, R, ramp, tex: TEX[rc.tex] || null, soft: SOFT.has(rc.shape || rc.style), trim: rc.trim ? M[rc.trim] : null, gem: GEM[it.rarity] };
}
const px = (g, x, y, c, glow) => g.px(x, y, c, glow);
// fill a box with the material: light top-left, dark bottom-right, then the texture
function box(g, x0, y0, x1, y1, L, ramp = L.ramp) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let c = ramp[1];
    if (x === x0 || y === y0) c = ramp[2];
    if (x === x1 || y === y1) c = ramp[0];
    if (L.tex && ramp === L.ramp) c = L.tex(x, y, c, ramp);
    g.px(x, y, c);
  }
}
const glowLine = (g, pts, col) => { for (const [x, y] of pts) px(g, x, y, col, true); };

// ---------- helmet ----------
function helmet(g, L) {
  const rc = L.rc, r = L.ramp, s = rc.shape;
  if (s === 'crown') {
    const gold = rc.style === 'hellfire' ? M.dread : rc.style === 'crude' ? M.rust : TRIM;
    for (let x = 11; x <= 20; x++) { px(g, x, 3, gold[2]); px(g, x, 4, gold[1]); }
    const tips = rc.style === 'crude' ? [[11, 1], [13, 0], [16, 1], [18, -1], [20, 1]] : [[11, 1], [14, 1], [17, 1], [20, 1]];
    for (const [x, ty] of tips) for (let y = ty; y < 3; y++) px(g, x, y, gold[y === ty ? 3 : 2]);
    px(g, 15, 3, rc.style === 'crude' ? '#3ad06a' : L.gem || '#e8435a', true); px(g, 16, 3, rc.style === 'crude' ? '#3ad06a' : L.gem || '#e8435a', true);
    if (rc.style === 'hellfire') for (const x of [11, 13, 15, 17, 19]) { px(g, x, -1, '#ff6a1a', true); px(g, x + 1, -2, '#ffd27a', true); px(g, x, -3, '#ffd27a', true); }
    if (rc.style === 'phoenix') for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { px(g, 15.5 + sx * (4 + i) | 0, 1 - i, i % 2 ? '#ff8a2e' : '#ffd84a', true); px(g, 15.5 + sx * (4 + i) | 0, 2 - i, '#ffd84a', true); }
    return;
  }
  if (s === 'cap' || s === 'skull' || s === 'furhat') {
    box(g, 11, 1, 20, 5, L);
    for (let x = 12; x <= 19; x++) px(g, x, 0, r[2]);
    if (s === 'cap') { box(g, 10, 4, 11, 9, L); box(g, 20, 4, 21, 9, L); }
    if (s === 'furhat') { for (let x = 10; x <= 21; x++) { px(g, x, 5, M[rc.trim || 'fur'][2]); px(g, x, 6, M[rc.trim || 'fur'][(x % 2) + 1]); } }
    if (s === 'skull') for (let x = 10; x <= 21; x++) px(g, x, 6, r[0]);
  } else if (s === 'hood' || s === 'coif' || s === 'beast') {
    box(g, 11, 0, 20, 4, L); box(g, 10, 2, 11, 15, L); box(g, 20, 2, 21, 15, L);
    for (let x = 11; x <= 20; x++) px(g, x, 5, r[0]);
    if (rc.tatter) for (const x of [10, 12, 19, 21]) px(g, x, 16, r[1]);
    if (rc.eyes) { px(g, 12, 6, rc.eyes, true); px(g, 19, 6, rc.eyes, true); }
    if (s === 'beast') { for (const x of [11, 19]) { px(g, x, -1, r[2]); px(g, x + 1, -2, r[3]); px(g, x, -2, r[2]); } px(g, 13, 2, '#ffd84a', true); px(g, 18, 2, '#ffd84a', true); }
  } else {
    // full helms: cover the head, visor across the face
    box(g, 11, 0, 20, 7, L); box(g, 10, 2, 10, 14, L); box(g, 21, 2, 21, 14, L);
    const vis = rc.visor || 't';
    if (vis !== 'nasal') { box(g, 11, 8, 20, 14, L); }
    if (vis === 't') { for (let x = 12; x <= 19; x++) if (x !== 15 && x !== 16) px(g, x, 10, rc.visorGlow || '#06050c', !!rc.visorGlow); for (let y = 10; y <= 13; y++) { px(g, 15, y, '#06050c'); px(g, 16, y, '#06050c'); } }
    if (vis === 'slit') for (let x = 12; x <= 19; x++) px(g, x, 10, rc.visorGlow || '#06050c', !!rc.visorGlow);
    if (vis === 'grill') for (let x = 12; x <= 19; x++) for (let y = 9; y <= 13; y++) if (x % 2 === 0) px(g, x, y, rc.visorGlow && y < 11 ? rc.visorGlow : '#06050c', !!rc.visorGlow && y < 11);
    if (vis === 'nasal') { for (let x = 11; x <= 20; x++) px(g, x, 7, L.trim ? L.trim[2] : r[0]); for (let y = 8; y <= 11; y++) { px(g, 15, y, r[2]); px(g, 16, y, r[1]); } }
    if (vis === 'skull') { for (const x of [12, 13, 18, 19]) { px(g, x, 9, '#0a0808'); px(g, x, 10, '#0a0808'); } for (let x = 13; x <= 18; x += 2) px(g, x, 13, '#0a0808'); }
    if (rc.fangs) { px(g, 14, 12, '#f6eed8'); px(g, 17, 12, '#f6eed8'); }
    if (rc.eyes && vis !== 'skull') { px(g, 13, 10, rc.eyes, true); px(g, 18, 10, rc.eyes, true); }
    if (s === 'dwarf') for (let y = 14; y <= 17; y++) for (let x = 13 + (y - 14); x <= 18 - (y - 14); x++) px(g, x, y, M.rag[(x + y) % 2 + 1]);
  }
  if (L.trim && s !== 'furhat' && s !== 'crown') for (let x = 10; x <= 21; x++) px(g, x, 7, L.trim[2]);
  if (rc.horns) { const hr = M[rc.horns]; const big = rc.bigHorns; for (const [s2, x] of [[-1, 9], [1, 22]]) { px(g, x, 4, hr[1]); px(g, x, 3, hr[2]); px(g, x + s2, 2, hr[2]); px(g, x + s2, 1, hr[3]); px(g, x + 2 * s2, 0, hr[3]); if (big) { px(g, x + 2 * s2, -1, hr[3]); px(g, x + 3 * s2, -2, hr[3]); px(g, x + s2, 3, hr[1]); } } }
  if (rc.spikes) for (const x of [12, 14, 17, 19]) { px(g, x, -1, M[rc.spikes][2]); px(g, x, -2, M[rc.spikes][3]); }
  if (rc.spikes) for (const x of [15, 16]) { px(g, x, -1, M[rc.spikes][2]); px(g, x, -2, M[rc.spikes][2]); px(g, x, -3, M[rc.spikes][3]); }
  if (rc.crest) for (let y = -3; y <= 0; y++) { px(g, 15, y, rc.crest); px(g, 16, y, y < -1 ? '#ffffff' : rc.crest); }
  if (rc.fins) for (const [x, d] of [[9, -1], [22, 1]]) for (let i = 0; i < 4; i++) px(g, x + d * (i > 1 ? 1 : 0), 2 + i * 2, M[rc.fins][2]);
  if (rc.spires) for (const [x, h] of [[12, 2], [14, 3], [16, 4], [18, 3], [20, 2]]) for (let k = 1; k <= h; k++) px(g, x, -k, k === h ? M.rime[3] : M.rime[2]);
  if (rc.frost) for (let x = 11; x <= 20; x += 2) px(g, x, 0, '#e8f8ff');
  if (rc.tex === 'ember') for (const [x, y] of [[12, 1], [18, 3], [11, 9], [20, 12]]) px(g, x, y, '#ff7a2a', true);
  if (L.gem && L.R >= 2 && !rc.noGem && s !== 'crown') { px(g, 15, 2, L.gem, true); px(g, 16, 2, L.gem, true); }
}

// ---------- chest ----------
function chest(g, L) {
  const rc = L.rc, r = L.ramp, s = rc.shape;
  const longSleeve = ['robe', 'coat', 'parka', 'hauberk', 'shirt', 'plate', 'cuirass'].includes(s);
  box(g, 10, 18, 21, 29, L);
  if (s !== 'vest' && s !== 'ribcage') for (const [x0, x1] of [[7, 9], [22, 24]]) box(g, x0, 18, x1, longSleeve ? 29 : 22, L);
  if (s === 'robe' || s === 'coat' || s === 'hauberk') {                      // skirt over the legs
    const end = s === 'hauberk' ? 34 : 38;
    for (let y = 30; y <= end; y++) { const w = (y - 30) * 0.3; for (let x = Math.round(10 - w); x <= Math.round(21 + w); x++) { if (rc.tatter && y === end && x % 2) continue; let c = x <= 11 ? r[2] : x >= 20 ? r[0] : r[1]; if (L.tex) c = L.tex(x, y, c, r); px(g, x, y, c); } }
    if (s === 'coat' || s === 'robe') for (let y = 20; y <= end; y++) px(g, 16, y, r[0]);
  }
  if (s === 'ribcage') { for (let y = 19; y <= 27; y += 2) for (let x = 11; x <= 20; x++) if (x !== 15 && x !== 16) px(g, x, y, '#0e0a08'); for (let y = 18; y <= 28; y++) { px(g, 15, y, r[3]); px(g, 16, y, r[2]); } }
  if (s === 'plate' || s === 'cuirass') { for (let y = 19; y <= 26; y++) { px(g, 15, y, r[3]); px(g, 16, y, r[2]); } for (const [x0, x1] of [[7, 10], [21, 24]]) box(g, x0, 17, x1, 20, L); }
  if (s === 'vest' && rc.neck === 'laces') for (let y = 19; y <= 25; y += 2) { px(g, 15, y, r[3]); px(g, 16, y + 1, r[3]); }
  if (s === 'mantle' || rc.furCollar) { const f = M[rc.furMat || 'fur']; for (let x = 8; x <= 23; x++) { px(g, x, 17, f[(x % 2) + 1]); px(g, x, 18, f[1 + ((x + 1) % 2)]); } }
  if (rc.pauldrons) { const pr = M[rc.pauldrons]; for (const [x0, x1] of [[6, 10], [21, 25]]) { for (let y = 16; y <= 20; y++) for (let x = x0; x <= x1; x++) px(g, x, y, y === 16 || (L.trim && y === 20) ? (L.trim ? L.trim[2] : pr[3]) : x === x0 || x === x1 ? pr[0] : pr[1 + ((y + x) % 2)]); } }
  if (rc.spikes) { const sp = M[rc.spikes]; for (const x of rc.pauldrons ? [6, 8, 23, 25] : [8, 23]) { px(g, x, 15, sp[2]); px(g, x, 14, sp[3]); } }
  if (rc.straps) for (let y = 18; y <= 28; y++) px(g, Math.round(10 + (y - 18) * 1.1), y, M.darkleather[2]);
  if (rc.studs) for (let y = 20; y <= 26; y += 3) for (let x = 11; x <= 20; x += 3) px(g, x, y, M.iron[3]);
  if (rc.patches) { box(g, 12, 21, 13, 22, L, M[rc.patches]); box(g, 18, 24, 19, 25, L, M[rc.patches]); }
  if (rc.belt) { const br = rc.belt === 'rope' ? M.burlap : rc.belt === 'gold' ? M.gold : rc.belt === 'iron' ? M.iron : M.darkleather; const by = s === 'robe' || s === 'coat' ? 25 : 28; for (let x = 10; x <= 21; x++) px(g, x, by, br[(x % 2) + 1]); if (rc.belt !== 'rope') { px(g, 15, by, M.gold[3]); px(g, 16, by, M.gold[3]); } }
  if (L.trim && !rc.pauldrons) { for (let x = 10; x <= 21; x++) px(g, x, 18, L.trim[2]); for (let y = 18; y <= 29; y++) { px(g, 10, y, L.trim[1]); px(g, 21, y, L.trim[0]); } }
  if (rc.seams) glowLine(g, [[13, 20], [13, 22], [13, 24], [13, 26], [18, 20], [18, 22], [18, 24], [18, 26], [11, 23], [12, 23], [19, 23], [20, 23]], rc.seams);
  if (rc.runeV) glowLine(g, [[11, 19], [12, 20], [13, 21], [14, 22], [15, 23], [16, 23], [17, 22], [18, 21], [19, 20], [20, 19]], rc.runeV);
  if (rc.cracks) glowLine(g, [[12, 20], [13, 21], [13, 22], [18, 21], [19, 23], [18, 24], [12, 26]], rc.cracks);
  if (rc.runes) glowLine(g, [[11, 21], [20, 21], [11, 24], [20, 24]], rc.runes);
  if (rc.tex === 'ember') glowLine(g, [[12, 21], [18, 23], [13, 25], [19, 20]], '#ff6a1a');
  if (rc.skull) { for (const [x, y] of [[14, 20], [15, 20], [16, 20], [17, 20], [14, 21], [17, 21], [15, 22], [16, 22]]) px(g, x, y, M.bone[2]); px(g, 15, 21, rc.skull, true); px(g, 16, 21, rc.skull, true); }
  if (rc.core) { px(g, 15, 22, '#ffffff', true); px(g, 16, 22, rc.core, true); px(g, 15, 23, rc.core, true); px(g, 16, 23, rc.core, true); }
  if (rc.frost) for (let x = 10; x <= 21; x += 2) px(g, x, 18, '#e8f8ff');
  if (L.gem && L.R >= 2 && !rc.skull && !rc.core && !rc.noGem) { px(g, 15, 21, L.gem, true); px(g, 16, 21, L.gem, true); }
}
function capeBehind(g, L) {
  const c = M[L.rc.cape];
  for (let y = 18; y <= 40; y++) for (let x = 8; x <= 23; x++) { if (y > 38 && (x + y) % 2) continue; px(g, x, y, x <= 9 ? c[2] : x >= 22 ? c[0] : c[1]); }
}

// ---------- legs ----------
function legs(g, L) {
  const rc = L.rc, r = L.ramp, s = rc.shape;
  box(g, 11, 30, 20, 31, L); box(g, 11, 32, 15, 40, L); box(g, 16, 32, 20, 40, L);
  if (s === 'breeches') { box(g, 10, 31, 15, 34, L); box(g, 16, 31, 21, 34, L); }
  if (s === 'skirt') { const sk = M[rc.skirt || rc.mat]; for (let y = 30; y <= 37; y++) for (let x = 10 - Math.floor((y - 30) / 3); x <= 21 + Math.floor((y - 30) / 3); x++) { if (y === 37 && x % 2) continue; px(g, x, y, L.tex ? L.tex(x, y, sk[1 + (x % 2)], sk) : sk[1]); } }
  if (rc.tassets) { const ts = M[rc.tassets]; for (const x0 of [10, 14, 18]) box(g, x0, 30, x0 + 3, 33, L, ts); }
  if (rc.knees) { const kn = M[rc.knees]; for (const x0 of [12, 17]) box(g, x0, 35, x0 + 2, 36, L, [kn[1], kn[2], kn[3], kn[3]]); }
  if (rc.bones) for (const x of [12, 14, 17, 19]) for (let y = 33; y <= 40; y++) px(g, x, y, y % 3 ? M.bone[2] : M.bone[3]);
  if (rc.wraps || s === 'breeches') for (let y = 35; y <= 40; y++) for (const x0 of [11, 16]) px(g, x0 + ((y * 2) % 5), y, M[rc.wraps || 'darkleather'][2]);
  if (rc.cuff) for (let x = 10; x <= 21; x++) if (x !== 15 && x !== 16) { px(g, x, 39, M[rc.cuff][(x % 2) + 1]); px(g, x, 40, M[rc.cuff][1]); }
  if (rc.studs) for (let y = 33; y <= 39; y += 3) for (const x of [12, 14, 17, 19]) px(g, x, y, M.iron[3]);
  if (rc.patches) { box(g, 12, 33, 13, 34, L, M[rc.patches]); box(g, 18, 37, 19, 38, L, M[rc.patches]); }
  if (rc.mud) for (let x = 11; x <= 20; x++) if (x % 3) px(g, x, 40, '#3a2a14');
  if (rc.spikes) { px(g, 11, 35, M[rc.spikes][3]); px(g, 10, 34, M[rc.spikes][3]); px(g, 20, 35, M[rc.spikes][3]); px(g, 21, 34, M[rc.spikes][3]); }
  if (rc.seams) glowLine(g, [[13, 32], [13, 34], [13, 37], [18, 32], [18, 34], [18, 37]], rc.seams);
  if (rc.runes) glowLine(g, [[12, 33], [19, 33], [12, 38], [19, 38]], rc.runes);
  if (rc.cracks) glowLine(g, [[12, 33], [13, 34], [18, 36], [19, 37], [14, 39]], rc.cracks);
  if (rc.tex === 'ember') glowLine(g, [[12, 34], [19, 36], [14, 38]], '#ff6a1a');
  if (rc.flames) for (const x of [11, 13, 15, 16, 18, 20]) { px(g, x, 41, '#ff6a1a', true); px(g, x, 40, '#ffd27a', true); }
  if (rc.frost) for (let x = 11; x <= 20; x += 2) px(g, x, 40, '#e8f8ff');
  const belt = rc.belt === 'rope' ? M.burlap : rc.belt === 'gold' ? M.gold : rc.belt === 'iron' ? M.iron : rc.belt ? M.darkleather : null;
  if (belt) for (let x = 11; x <= 20; x++) px(g, x, 30, belt[(x % 2) + 1]);
  if (L.trim) for (let x = 11; x <= 20; x++) px(g, x, 31, L.trim[2]);
  if (L.gem && L.R >= 2 && !rc.noGem) { px(g, 15, 31, L.gem, true); px(g, 16, 31, L.gem, true); }
}

// ---------- boots ----------
function boots(g, L) {
  const rc = L.rc, r = L.ramp, st = rc.style;
  const top = st === 'low' || st === 'sandal' ? 40 : st === 'furboot' ? 37 : 38;
  for (const [x0, x1] of [[10, 15], [16, 21]]) {
    if (st === 'sandal') { box(g, x0, 40, x1, 42, L, SKIN); for (let x = x0; x <= x1; x++) { px(g, x, 41, r[2]); px(g, x, 43, '#1a1418'); } continue; }
    box(g, x0, top, x1, 42, L);
    for (let x = x0; x <= x1; x++) { px(g, x, top, L.trim ? L.trim[2] : r[3]); px(g, x, 43, '#1a1418'); }
    if (st === 'sabaton') for (let x = x0; x <= x1; x += 2) px(g, x, 41, r[0]);
    if (st === 'furboot' || rc.cuff) { const f = M[rc.cuff || rc.mat]; for (let x = x0 - 1; x <= x1 + 1; x++) { px(g, x, top, f[(x % 2) + 1]); px(g, x, top - 1, f[2]); } }
    if (st === 'wrap') for (let x = x0; x <= x1; x++) if (x % 2) px(g, x, top - 1, r[1]);
  }
  if (st === 'snowshoe') for (let x = 8; x <= 23; x++) px(g, x, 44, M.leather[x % 3 ? 1 : 2]);
  if (st === 'sabaton') { px(g, 9, 42, r[2]); px(g, 22, 42, r[2]); }
  if (rc.claws) { const c = M[rc.claws]; for (const x of [9, 11, 20, 22]) px(g, x, 43, c[3]); }
  if (rc.spikes) { px(g, 9, 39, M[rc.spikes][3]); px(g, 22, 39, M[rc.spikes][3]); }
  if (rc.bones) for (const x of [11, 14, 17, 20]) px(g, x, 40, M.bone[3]);
  if (rc.studs) for (const x of [11, 14, 17, 20]) px(g, x, 40, M.iron[3]);
  if (rc.nails) for (let x = 10; x <= 21; x += 2) px(g, x, 43, M.iron[3]);
  if (rc.wing) for (const [x, d] of [[8, -1], [23, 1]]) { px(g, x, 39, '#ffffff'); px(g, x + d, 38, '#ffffff'); px(g, x + d, 39, '#e8e2ff'); px(g, x + 2 * d, 37, '#ffffff'); }
  if (rc.seams) glowLine(g, [[12, 41], [18, 41]], rc.seams);
  if (rc.runes) glowLine(g, [[12, 40], [19, 40]], rc.runes);
  if (rc.tex === 'ember') glowLine(g, [[12, 42], [18, 42]], '#ff6a1a');
  if (rc.frost) for (const x of [11, 17]) px(g, x, 40, '#e8f8ff', true);
}

// ---------- off-hand on the left arm (viewer's left) ----------
function offhand(g, L) {
  const rc = L.rc;
  if (rc.shape === 'seraph') return;                       // wings are drawn behind the body
  const k = rc.kind || (rc.shape === 'phylactery' || rc.shape === 'heart' ? 'charm' : rc.shape === 'icelantern' ? 'lantern' : rc.shape === 'ashtome' ? 'tome' : L.it.kind);
  if (k === 'shield') {
    const sr = M[rc.mat] || L.ramp, rim = rc.rim ? M[rc.rim] : sr;
    for (let y = 21; y <= 33; y++) { const w = rc.shape === 'round' ? Math.round(Math.sqrt(Math.max(0, 36 - (y - 27) ** 2)) * 0.75) : rc.shape === 'tower' || rc.shape === 'plank' || rc.shape === 'coffin' ? 3 : y < 28 ? 3 : 3 - (y - 27); if (w < 0) continue; for (let x = 5 - w; x <= 5 + w; x++) { let c = x === 5 - w || x === 5 + w || y === 21 || y === 33 ? rim[2] : sr[1 + ((x + y) % 2)]; if (L.tex && !(x === 5 - w || x === 5 + w)) c = L.tex(x, y, c, sr); px(g, x, y, c); } }
    if (rc.emblem === 'skull') { px(g, 4, 25, M.bone[3]); px(g, 5, 25, M.bone[3]); px(g, 6, 25, M.bone[3]); px(g, 4, 26, rc.eyes || '#0a0808', !!rc.eyes); px(g, 6, 26, rc.eyes || '#0a0808', !!rc.eyes); px(g, 5, 27, M.bone[2]); }
    else if (rc.emblem === 'snowflake') { for (let y = 24; y <= 30; y++) px(g, 5, y, '#ffffff'); for (let x = 2; x <= 8; x++) px(g, x, 27, '#ffffff'); }
    else if (rc.emblem === 'ember') { px(g, 5, 25, '#ffd27a', true); px(g, 5, 26, '#ff6a1a', true); px(g, 4, 27, '#ff6a1a', true); px(g, 6, 27, '#ff6a1a', true); }
    else if (rc.emblem === 'rune') for (let y = 24; y <= 30; y++) px(g, 5, y, rc.glow, true);
    else if (rc.cross) { for (let y = 23; y <= 31; y++) px(g, 5, y, rc.cross); for (let x = 3; x <= 7; x++) px(g, x, 25, rc.cross); }
    else if (rc.boss) { px(g, 5, 27, M[rc.boss][3]); px(g, 4, 27, M[rc.boss][2]); px(g, 6, 27, M[rc.boss][1]); }
    if (rc.spikes) { px(g, 1, 22, M[rc.spikes][3]); px(g, 9, 22, M[rc.spikes][3]); px(g, 5, 19, M[rc.spikes][3]); }
    if (L.gem && L.R >= 2 && !rc.emblem) px(g, 5, 24, L.gem, true);
    return;
  }
  if (k === 'tome') { const cv = rc.shape === 'ashtome' ? M.cinder : M[rc.mat] || M.mourn; box(g, 3, 27, 8, 32, L, cv); px(g, 8, 28, '#f0e6cc'); px(g, 8, 30, '#f0e6cc'); const gl = rc.shape === 'ashtome' ? '#ff4a2a' : rc.glow || (rc.emblem === 'cross' ? '#fff4b0' : '#ffd84a'); px(g, 5, 29, gl, true); px(g, 6, 29, gl, true); px(g, 5, 30, gl, true); return; }
  if (k === 'lantern') { const fr = M[rc.mat] || M.rime; const fl = rc.shape === 'icelantern' || rc.flame === '#7ae0ff' ? '#9fe8ff' : '#ffd27a'; px(g, 5, 27, fr[2]); box(g, 4, 28, 7, 33, L, [fr[0], fl, mix2(fl), '#ffffff']); px(g, 5, 30, '#ffffff', true); return; }
  if (k === 'flask') { const liq = rc.liquid || '#7ae0ff'; px(g, 5, 27, M.gold[2]); box(g, 4, 28, 7, 32, L, ['#203040', liq, liq, '#ffffff']); px(g, 5, 29, '#ffffff', true); return; }
  if (k === 'drum') { box(g, 2, 27, 8, 32, L, M.wood); for (let x = 2; x <= 8; x++) px(g, x, 27, M.bone[2]); px(g, 3, 29, M.gobcloth[2]); px(g, 7, 29, M.gobcloth[2]); return; }
  if (rc.shape === 'phylactery') { px(g, 5, 26, M.iron[2]); px(g, 5, 27, M.iron[2]); box(g, 4, 28, 6, 31, L, M.iron); px(g, 5, 29, '#5af07a', true); px(g, 5, 30, '#5af07a', true); return; }
  if (rc.shape === 'heart') { for (const [x, y] of [[3, 27], [4, 27], [6, 27], [7, 27], [3, 28], [4, 28], [5, 28], [6, 28], [7, 28], [4, 29], [5, 29], [6, 29], [5, 30]]) px(g, x, y, M.stone[(x + y) % 2 + 1]); px(g, 5, 28, '#ffb02e', true); return; }
  const liq = L.it.revive || L.it.cheatDeath ? '#ffd84a' : L.it.healStart ? '#e8435a' : '#7ae0ff';
  px(g, 5, 27, '#a07a50'); box(g, 4, 28, 7, 32, L, ['#203040', liq, liq, '#ffffff']);
}
const mix2 = (c) => c;

function wingsBehind(g) {
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const len = 9 - i * 1.5;
      for (let d = 0; d < len; d++) {
        const x = Math.round(15.5 + s * (5 + d)), y = 16 + i * 3 - Math.round(d * 0.7);
        const tip = d > len - 2;
        px(g, x, y, tip ? '#ffd84a' : i % 2 ? '#e8e2ff' : '#ffffff'); px(g, x, y + 1, i % 2 ? '#c8c0ea' : '#e8e2ff');
      }
    }
  }
}

// ---------- rarity glow ----------
// Each piece glows in its own rarity colour from Rare up (a Mythic crown glows red round your head,
// an Epic chestplate purple round your body). Drawn as a separate layer the page blurs behind the avatar.
const GLOW = { rare: ['#4a90e2', 0.5], epic: ['#b06af0', 0.75], legendary: ['#ffb02e', 0.9], mythic: ['#ff3a5a', 1], divine: ['#fff1a8', 1] };

// Returns { url, glow, top }: the avatar, its glow layer (null if nothing is Rare+) and the best rarity worn.
export function dungeonAvatar(lifeGear, dEquipped = {}, scale = 4) {
  const L = (slot) => (dEquipped[slot] && DITEMS[dEquipped[slot]] ? look(dEquipped[slot]) : null);
  const off = L('offhand');
  const parts = { legs: L('legs'), boots: L('boots'), chest: L('chest'), helmet: L('helmet'), offhand: off };
  const marks = new Map();
  const tracked = (g, piece, draw) => {               // remember which pixels each piece drew
    const orig = g.px, gl = GLOW[piece.it.rarity];
    if (gl) g.px = function (x, y, c, glow) { orig.call(this, x, y, c, glow); if (c) marks.set(`${x},${y + (this.oy || 0)}`, gl); };
    try { draw(); } finally { g.px = orig; }
  };
  const url = avatarDataUrl(lifeGear, scale, {
    behind: (g) => {
      if (parts.chest?.rc.cape) tracked(g, parts.chest, () => capeBehind(g, parts.chest));
      if (off && /wings/i.test(off.it.name)) tracked(g, off, () => wingsBehind(g));
    },
    over: (g) => {
      if (parts.legs) tracked(g, parts.legs, () => legs(g, parts.legs));
      if (parts.boots) tracked(g, parts.boots, () => boots(g, parts.boots));
      if (parts.chest) tracked(g, parts.chest, () => chest(g, parts.chest));
      if (parts.helmet) tracked(g, parts.helmet, () => helmet(g, parts.helmet));
      if (parts.offhand) tracked(g, parts.offhand, () => offhand(g, parts.offhand));
    },
  });
  const R = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'];
  const top = R[Math.max(-1, ...Object.values(parts).filter(Boolean).map((p) => p.R))] || null;
  if (!marks.size) return { url, glow: null, top };
  const cv = document.createElement('canvas'); cv.width = AW * scale; cv.height = AH * scale;
  const ctx = cv.getContext('2d');
  for (const [k, [col, alpha]] of marks) {                      // spread each pixel a little so the glow reaches past the outline
    const [x, y] = k.split(',').map(Number); ctx.fillStyle = col;
    ctx.globalAlpha = alpha * 0.35; ctx.fillRect((x - 2) * scale, (y - 2) * scale, 5 * scale, 5 * scale);
    ctx.globalAlpha = alpha * 0.6; ctx.fillRect((x - 1) * scale, (y - 1) * scale, 3 * scale, 3 * scale);
  }
  return { url, glow: cv.toDataURL(), top };
}

// avatar image with your life-skill outfit underneath and Dungeon armour on top
export const dungeonAvatarUrl = (lifeGear, dEquipped = {}, scale = 4) => dungeonAvatar(lifeGear, dEquipped, scale).url;
