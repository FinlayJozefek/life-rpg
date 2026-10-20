// Trial (dev/gear-themes.html): every armour piece gets its own recipe -- shape, material and surface
// texture -- so no two items look alike and each set has a clearly different look.
// 32x32 front view, light from the top-left. Falls back to the current art for anything without a recipe.
import { buildGear, GEM, TRIM, setGearBuilder } from './gearart.js';

const N = 32;
function h2(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
const shade = (ramp, t) => (t < -0.55 ? ramp[3] : t < -0.1 ? ramp[2] : t < 0.5 ? ramp[1] : ramp[0]);

class Px {
  constructor() { this.c = new Array(N * N).fill(null); this.tag = new Array(N * N).fill(0); }
  set(x, y, col, tag = 1) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= N || y >= N || !col) return; this.c[y * N + x] = col; this.tag[y * N + x] = tag; }
  get(x, y) { return x < 0 || y < 0 || x >= N || y >= N ? null : this.c[y * N + x]; }
  each(fn, tag = 1) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = fn(x, y); if (c) this.set(x, y, c, tag); } }
  outline(col) { const add = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (this.get(x, y)) continue; if (this.get(x + 1, y) || this.get(x - 1, y) || this.get(x, y + 1) || this.get(x, y - 1)) add.push([x, y]); } for (const [x, y] of add) this.set(x, y, col, 9); }
}

// ---------- materials (dark -> highlight) ----------
const M = {
  rag: ['#3e3020', '#6a5638', '#8a7450', '#a8946a'], burlap: ['#5a4424', '#8a6a3a', '#b08a52', '#d0aa6e'], linen: ['#4a4640', '#7a746a', '#a49c90', '#c8c0b2'],
  mourn: ['#121018', '#24202e', '#3a3448', '#5a5270'], grave: ['#2e281e', '#4a4232', '#665c46', '#82765a'],
  leather: ['#3a2212', '#62391e', '#8a5530', '#b07448'], darkleather: ['#22160e', '#3e2818', '#5a3c24', '#7a5434'], hardleather: ['#40281a', '#6e4428', '#966236', '#b88050'],
  scout: ['#22301a', '#3a4e28', '#566e3a', '#76904e'], iron: ['#3a3e46', '#646a76', '#949aa6', '#d0d4dc'], rust: ['#4a2a18', '#7a4a2a', '#9a6a40', '#c09060'],
  chain: ['#2a2e36', '#5a606c', '#8e94a0', '#d6dae2'], bone: ['#6a5e48', '#b0a284', '#dcd0b0', '#f6eed8'], wraith: ['#1e3a44', '#3a6a76', '#6aa8b0', '#b8f0f0'],
  dwarf: ['#5a3a14', '#9a6a26', '#c8963a', '#f0c870'], obsidian: ['#06050a', '#16121e', '#2a2236', '#6a5aa0'], stone: ['#3a3632', '#625c54', '#8a8278', '#b2aa9c'],
  deep: ['#1e1a1a', '#3a3232', '#5a4e4a', '#8a7a70'], quilt: ['#22344a', '#3a5674', '#5a7a9e', '#86a6c6'], yeti: ['#8a96a6', '#c0ccd8', '#e8eef4', '#ffffff'],
  wolf: ['#3a3a40', '#62626a', '#8a8a92', '#b4b4bc'], rime: ['#1c4472', '#4682bc', '#9cd0fc', '#f0faff'], aurora: ['#1a3a5a', '#3a8a9a', '#7ad0b0', '#e0fff0'],
  cinder: ['#1a1414', '#302626', '#4a3a36', '#6a5650'], brim: ['#3a2a08', '#7a5a10', '#c8a020', '#f0e070'], demonhide: ['#3a0a0a', '#6a1a14', '#9a2a1e', '#c84a34'],
  dread: ['#08040a', '#1a0c12', '#2e1620', '#5a2a3a'], goblin: ['#3a3020', '#5e5232', '#7e7046', '#a09060'], gobcloth: ['#24361a', '#3a5428', '#567636', '#7a9a4a'],
  bloodcape: ['#1a0408', '#3a0a12', '#5a1420', '#7a2a36'],
  gold: TRIM, fur:['#4a3624', '#7a5c3c', '#a07c56', '#c8a47a'],
};

// ---------- surface textures: (x, y, base colour, ramp, t) -> colour ----------
const TEX = {
  plain: (x, y, c) => c,
  weave: (x, y, c, r) => ((x + y) % 2 ? c : mix(c, r[0], 0.18)),
  rough: (x, y, c, r) => (h2(x, y, 1) < 0.18 ? mix(c, r[0], 0.4) : h2(x, y, 2) < 0.08 ? mix(c, r[3], 0.3) : c),
  leather: (x, y, c, r) => (h2(x, y, 3) < 0.12 ? mix(c, r[0], 0.3) : c),
  quilt: (x, y, c, r) => ((x + y) % 6 === 0 || (x - y + 64) % 6 === 0 ? r[0] : c),
  chain: (x, y, c, r) => (y % 2 === 0 ? (x % 2 ? mix(c, r[3], 0.5) : r[0]) : (x % 2 ? r[0] : c)),
  scales: (x, y, c, r) => { const row = Math.floor(y / 3), lx = (x + (row % 2) * 2) % 4, ly = y % 3; return (ly === 2 && lx !== 1 && lx !== 2) || (ly === 1 && lx === 0) ? r[0] : ly === 0 && (lx === 1 || lx === 2) ? mix(c, r[3], 0.5) : lx === 3 ? mix(c, r[0], 0.3) : c; },
  plates: (x, y, c, r) => (y % 4 === 0 ? r[0] : y % 4 === 1 ? mix(c, r[3], 0.35) : c),
  fur: (x, y, c, r) => { const v = h2(x, Math.floor(y / 2), 4); return v < 0.25 ? mix(c, r[0], 0.35) : v > 0.85 ? mix(c, r[3], 0.4) : c; },
  crystal: (x, y, c, r) => ((x + 2 * y) % 9 === 0 ? r[3] : (2 * x - y + 64) % 11 === 0 ? r[0] : c),
  gloss: (x, y, c, r) => (Math.abs(x + y - 22) < 1.2 ? r[3] : Math.abs(x + y - 26) < 0.6 ? mix(c, r[3], 0.5) : (x * 3 + y) % 13 === 0 ? r[2] : c),
  stoneblock: (x, y, c, r) => (y % 5 === 0 || (x + (Math.floor(y / 5) % 2) * 3) % 6 === 0 ? r[0] : h2(x, y, 5) < 0.12 ? mix(c, r[3], 0.25) : c),
  ghost: (x, y, c, r) => ((x + y * 3) % 7 === 0 ? mix(c, '#e0ffff', 0.35) : (y % 3 === 0 && h2(x, y, 6) < 0.3) ? mix(c, r[0], 0.4) : c),
  ember: (x, y, c, r) => (h2(x, y, 7) < 0.06 ? '#ff7a2a' : h2(x, y, 8) < 0.1 ? mix(c, '#000000', 0.3) : c),
  sulfur: (x, y, c, r) => (h2(Math.floor(x / 2), Math.floor(y / 2), 9) < 0.22 ? mix(c, '#1a1408', 0.55) : c),
  hide: (x, y, c, r) => (h2(Math.floor(x / 3), Math.floor(y / 2), 10) < 0.2 ? mix(c, r[0], 0.45) : c),
  glowscales: (x, y, c, r) => { const row = Math.floor(y / 3), lx = (x + (row % 2) * 2) % 4, ly = y % 3; return ly === 2 && (lx === 0 || lx === 3) ? '#e8a020' : (ly === 2 && lx !== 1 && lx !== 2) || (ly === 1 && lx === 0) ? r[0] : ly === 0 && (lx === 1 || lx === 2) ? mix(c, r[3], 0.5) : c; },
  aurora: (x, y, c, r) => mix(c, ['#7ad0ff', '#b48cff', '#7affc0', '#ffd27a'][Math.floor((x + y) / 5) % 4], 0.35),
};

// Shade within a mask using distance from the centre column, then texture.
function paintMask(g, inside, ramp, tex = 'plain', opts = {}) {
  const T = TEX[tex] || TEX.plain;
  g.each((x, y) => {
    const hw = inside(x, y);
    if (!hw) return null;
    const t = (x + 0.5 - 16) / Math.max(hw, 1) + (opts.lightTop && y < opts.lightTop ? -0.4 : 0) + (opts.darkBottom && y > opts.darkBottom ? 0.35 : 0);
    return T(x, y, shade(ramp, t), ramp, t);
  }, opts.tag || 1);
}
// a mirrored row shape: rows(y) -> half width (or null)
const rowsMask = (rows) => (x, y) => { const r = rows(y); if (r == null) return 0; return Math.abs(x + 0.5 - 16) <= r ? r : 0; };
const ringRows = (rows) => (x, y) => { const r = rows(y); if (r == null) return 0; const [i, o] = r; const d = Math.abs(x + 0.5 - 16); return d <= o && d >= i ? o : 0; };
function hline(g, y, x0, x1, col, tag = 1) { for (let x = x0; x <= x1; x++) g.set(x, y, col, tag); }
function mirrorPx(g, x, y, col, tag = 1) { g.set(x, y, col, tag); g.set(31 - x, y, col, tag); }
function gem(g, cx, cy, r, col) { g.each((x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d > r) return null; return (x + 0.5 - cx) + (y + 0.5 - cy) < -r * 0.5 ? mix(col, '#ffffff', 0.6) : d > r * 0.6 ? mix(col, '#000000', 0.35) : col; }, 2); }

// ---------- chest garments ----------
// shape: tunic | vest | jerkin | hauberk | robe | shirt | ribcage | cuirass | plate | coat | mantle | parka
function chestShape(rc) {
  const s = rc.shape;
  const len = { tunic: 26, vest: 24, jerkin: 25, hauberk: 29, robe: 30, shirt: 26, ribcage: 25, cuirass: 25, plate: 27, coat: 30, mantle: 27, parka: 27 }[s];
  const shoulder = { cuirass: 14, plate: 14.5, mantle: 14.5, parka: 13, coat: 12.5 }[s] || 12;
  const body = { robe: 9, coat: 9.5, parka: 10.5, hauberk: 9.5 }[s] || 9;
  const flare = { robe: 0.45, coat: 0.3, hauberk: 0.2, tunic: 0.12 }[s] || 0;
  return (x, y) => {
    if (y < 5 || y > len) return 0;
    let r;
    if (y < 10) r = shoulder - (y < 6 ? 2.5 : 0);
    else r = body + Math.max(0, y - 18) * flare;
    // sleeves: everything except vests/ribcage hangs arms down the sides
    if (s !== 'vest' && s !== 'ribcage' && y >= 10 && y <= ({ tunic: 15, shirt: 17, robe: 24, coat: 22, parka: 20, hauberk: 18, jerkin: 16 }[s] || 14)) {
      const d = Math.abs(x + 0.5 - 16), arm = shoulder - (s === 'robe' ? 0 : 0.5) + (s === 'robe' ? (y - 10) * 0.25 : 0);
      if (d <= arm && d >= r + 0.6) return arm;
    }
    return Math.abs(x + 0.5 - 16) <= r ? r : 0;
  };
}
function drawChest(g, rc, it, R) {
  const ramp = M[rc.mat];
  const mask = chestShape(rc);
  if (rc.cape) { const cp = M[rc.cape]; g.each((x, y) => { const d = Math.abs(x + 0.5 - 16); if (y < 7 || y > 31) return null; const out = 12.5 + (y - 7) * 0.1; if (y < 10 || d < 9 || d > out) return null; if (y > 27 && h2(x, 3, 15) < 0.5) return null; return shade(cp, (d - 11) / 3 + ((x + y) % 5 === 0 ? 0.6 : 0)); }); }
  paintMask(g, mask, ramp, rc.tex, { lightTop: 8 });
  const s = rc.shape;
  // neckline
  const neck = rc.neck || (s === 'robe' || s === 'coat' ? 'v' : s === 'plate' || s === 'cuirass' ? 'gorget' : 'round');
  if (neck === 'v') g.each((x, y) => (y >= 5 && y <= 11 && Math.abs(x + 0.5 - 16) < (12 - y) * 0.45 ? '#0a0810' : null));
  if (neck === 'round') g.each((x, y) => (y >= 5 && y <= 6 && Math.abs(x + 0.5 - 16) < 3.5 ? '#0a0810' : null));
  if (neck === 'gorget') { g.each((x, y) => (y >= 3 && y <= 5 && Math.abs(x + 0.5 - 16) < 4.5 ? shade(rc.trim ? M[rc.trim] : ramp, (x - 16) / 4) : null)); }
  if (neck === 'laces') { g.each((x, y) => (y >= 5 && y <= 14 && Math.abs(x + 0.5 - 16) < 1 ? '#0a0810' : null)); for (let y = 7; y <= 13; y += 2) { g.set(14, y, ramp[3]); g.set(17, y, ramp[3]); g.set(15, y + 1, ramp[3]); g.set(16, y + 1, ramp[3]); } }
  // garment details
  if (s === 'ribcage') {
    for (let y = 9; y <= 21; y += 3) for (let x = 7; x <= 24; x++) if (Math.abs(x + 0.5 - 16) > 1.2 && Math.abs(x + 0.5 - 16) < 9 - Math.abs(y - 14) * 0.25) g.set(x, y + 1, '#0e0a08');
    g.each((x, y) => (y >= 6 && y <= 24 && Math.abs(x + 0.5 - 16) < 1.2 ? ramp[3] : null));   // spine/sternum
  }
  if (s === 'cuirass' || s === 'plate') {
    g.each((x, y) => (y >= 9 && y <= 10 && Math.abs(x + 0.5 - 16) > 9 && Math.abs(x + 0.5 - 16) < 14.5 ? ramp[0] : null));   // pauldron edge
    g.each((x, y) => (y >= 11 && y <= 23 && Math.abs(x + 0.5 - 16) < 0.8 ? ramp[3] : null));
  }
  if (s === 'mantle' || rc.furCollar) g.each((x, y) => { const d = Math.abs(x + 0.5 - 16); return y >= 4 && y <= 8 + (h2(x, 0, 11) < 0.5 ? 1 : 0) && d <= 14 && d >= 3 ? shade(M[rc.furMat || 'fur'], (x - 16) / 14) : null; });
  if (s === 'hauberk' || s === 'robe' || s === 'coat') { // ragged / split hem
    const len = { hauberk: 29, robe: 30, coat: 30 }[s];
    if (rc.tatter) for (let x = 0; x < N; x++) if (h2(x, 1, 12) < 0.5) for (let y = len - 2; y <= len; y++) if (g.get(x, y)) g.set(x, y, null);
    if (s === 'coat') g.each((x, y) => (y >= 12 && y <= 30 && Math.abs(x + 0.5 - 16) < 0.6 ? ramp[0] : null));
  }
  if (rc.patches) for (const [px, py] of [[11, 14], [19, 19], [13, 22]]) { g.each((x, y) => (x >= px && x <= px + 2 && y >= py && y <= py + 2 ? M[rc.patches][1] : null)); g.set(px - 1, py, '#2a2018'); g.set(px + 3, py + 2, '#2a2018'); }
  if (rc.studs) for (let y = 12; y <= 22; y += 3) for (let x = 10; x <= 22; x += 3) if (g.get(x, y)) { g.set(x, y, M.iron[3]); g.set(x, y + 1, M.iron[0]); }
  if (rc.straps) { for (let y = 6; y <= 24; y++) { const x = Math.round(9 + (y - 6) * 0.75); g.set(x, y, M.darkleather[1]); g.set(x + 1, y, M.darkleather[2]); } }
  if (rc.ribs) for (let y = 12; y <= 22; y += 4) hline(g, y, 11, 20, M[rc.mat][0]);
  // belt
  if (rc.belt) {
    const by = { robe: 17, coat: 17, hauberk: 21 }[s] || 22;
    const br = rc.belt === 'rope' ? M.burlap : rc.belt === 'gold' ? M.gold : rc.belt === 'iron' ? M.iron : M.darkleather;
    g.each((x, y) => (y >= by && y <= by + 1 && g.get(x, y) && g.tag[y * N + x] === 1 ? (rc.belt === 'rope' && (x + y) % 2 ? br[2] : shade(br, (x - 16) / 9)) : null), 3);
    if (rc.belt !== 'rope') { g.set(15, by, M.gold[2]); g.set(16, by, M.gold[2]); g.set(15, by + 1, M.gold[1]); g.set(16, by + 1, M.gold[1]); }
  }
  // trims & extras
  if (rc.trim) { const tr = M[rc.trim]; g.each((x, y) => { if (!g.get(x, y) || g.tag[y * N + x] !== 1) return null; const edge = !mask(x, y + 1) || (y < 10 && !mask(x, y - 1)) || !mask(x - 1, y) || !mask(x + 1, y); return edge ? shade(tr, (x - 16) / 14) : null; }, 1); }
  if (rc.spikes) for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const bx = 16 + sx * (10 + i * 1.6), by = 8 - i * 0.3; for (let k = 0; k < 4 - i; k++) g.set(Math.round(bx + sx * 0.2 * k), Math.round(by - k), k > 1 ? M[rc.spikes][3] : M[rc.spikes][2]); }
  if (rc.cracks) g.each((x, y) => (g.get(x, y) && g.tag[y * N + x] === 1 && (Math.abs((x * 2 + y * 3) % 17 - 8) < 0.6 || Math.abs((x * 5 - y * 2 + 99) % 19 - 9) < 0.5) && y > 8 && y < 26 ? rc.cracks : null), 4);
  if (rc.runes) for (const [x, y] of [[11, 13], [20, 13], [11, 17], [20, 17], [12, 21], [19, 21]]) g.set(x, y, rc.runes, 4);
  if (rc.core) { g.each((x, y) => { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 15); return d < 3.6 ? (d < 1.6 ? '#ffffff' : d < 2.6 ? rc.core : mix(rc.core, '#000000', 0.4)) : null; }, 4); }
  if (rc.flames) g.each((x, y) => { const d = Math.abs(x + 0.5 - 16); return y >= 2 && y <= 6 && d > 8 && d < 14 && (x + y) % 3 === 0 && h2(x, y, 13) < 0.7 ? (y < 4 ? '#ffd27a' : '#ff6a1a') : null; }, 4);
  if (rc.frost) g.each((x, y) => (g.get(x, y) && (y === 5 || y === 6) && (x + y) % 2 ? '#e8f8ff' : null));
  if (rc.seams) g.each((x, y) => { if (!g.get(x, y) || g.tag[y * N + x] !== 1) return null; const d = Math.abs(x + 0.5 - 16); return (y >= 10 && y <= 24 && Math.abs(d - 5) < 0.5) || (y === 14 && d < 9) || (y === 19 && d < 8.5) ? rc.seams : null; }, 4);
  if (rc.runeV) g.each((x, y) => { if (!g.get(x, y)) return null; const d = Math.abs(x + 0.5 - 16); return y >= 9 && y <= 21 && Math.abs(d - (9 - (y - 9) * 0.7)) < 0.55 ? rc.runeV : null; }, 4);
  if (rc.pauldrons) { const pr = M[rc.pauldrons]; for (const [cy, rad] of [[11, 5], [7.5, 6]]) for (const sx of [-1, 1]) g.each((x, y) => { const lx = (x + 0.5 - 16) * sx; const d = Math.hypot(lx - 11.5, (y + 0.5 - cy) * 1.35); if (lx < 6 || d > rad || y + 0.5 < cy - 4) return null; return d > rad - 1 ? (rc.trim ? M[rc.trim][2] : pr[3]) : shade(pr, -(lx - 11.5) / rad * 0.6 + (y + 0.5 < cy ? -0.5 : 0.3)); }); }
  if (rc.pauldrons && rc.spikes) for (const sx of [-1, 1]) for (const [bx, hgt] of [[9, 4], [12, 6], [15, 4]]) for (let k = 0; k < hgt; k++) g.set(Math.round(16 + sx * bx - (sx < 0 ? 1 : 0)), 3 - k + Math.abs(bx - 12), k > hgt - 3 ? M[rc.spikes][3] : M[rc.spikes][2]);
  if (rc.skull) { const b = M.bone; g.each((x, y) => { const dx = x + 0.5 - 16, dy = y + 0.5 - 14.5; if (Math.hypot(dx, dy * 1.15) < 3.4 && dy < 1.8) return shade(b, dx / 3); if (dy >= 1.8 && dy < 3.4 && Math.abs(dx) < 2) return x % 2 ? b[1] : '#0a0808'; return null; }, 2); for (const ex of [14, 17]) { g.set(ex, 14, rc.skull, 4); g.set(ex, 15, mix(rc.skull, '#000000', 0.4), 4); } g.set(15, 16, '#0a0808'); g.set(16, 16, '#0a0808'); }
  if (rc.emblem) { const e = rc.emblem; g.each((x, y) => { const dx = Math.abs(x + 0.5 - 16), dy = y + 0.5 - 15; return (dx < 3.2 - Math.abs(dy) * 0.6 && Math.abs(dy) < 4) ? e : null; }, 2); }
  if (GEM[RAR(R)] && R >= 2 && !rc.core && !rc.emblem && !rc.skull && !rc.noGem) gem(g, 16, 14, 1.7, GEM[RAR(R)]);
}

// ---------- helmets ----------
// shape: cap | skull | hood | coif | bonehelm | greathelm | dwarf | angular | furhat | beast | crystal | wyrm | horned | spiked | crown
function drawHelm(g, rc, it, R) {
  const ramp = M[rc.mat], s = rc.shape;
  const dome = (top, wide) => (x, y) => { if (y < top || y > 28) return 0; const k = (y - top) / (28 - top); const r = y < top + 9 ? Math.sqrt(Math.max(0, wide * wide - (top + 9 - y) ** 2 * (wide * wide) / 81)) : wide - (y - top - 9) * 0.25; return Math.abs(x + 0.5 - 16) <= r ? r : 0; };
  if (s === 'cap' || s === 'skull' || s === 'furhat') {
    const top = s === 'furhat' ? 4 : 7, bottom = s === 'skull' ? 19 : 20;
    const mk = (x, y) => { if (y < top || y > bottom) return 0; const r = Math.min(11.5, Math.sqrt(Math.max(0, 132 - (bottom - y) ** 2 * (132 / (bottom - top + 1) ** 2))) + 0.5); return Math.abs(x + 0.5 - 16) <= r ? r : 0; };
    paintMask(g, mk, ramp, rc.tex, { lightTop: top + 3 });
    if (s === 'cap') { g.each((x, y) => (y >= 18 && y <= 21 && Math.abs(x + 0.5 - 16) < 12 && Math.abs(x + 0.5 - 16) > 6 ? shade(ramp, (x - 16) / 12) : null)); for (let x = 11; x <= 20; x += 3) g.set(x, 12, ramp[0]); }   // ear flaps + stitches
    if (s === 'skull') { hline(g, 19, 6, 25, ramp[0]); g.each((x, y) => (y >= 8 && y <= 18 && Math.abs(x + 0.5 - 16) < 0.7 ? ramp[3] : null)); for (const x of [8, 12, 19, 23]) g.set(x, 17, ramp[3]); }
    if (s === 'furhat') { g.each((x, y) => (y >= 15 && y <= 20 && Math.abs(x + 0.5 - 16) < 13 ? shade(M[rc.trim || 'fur'], (x - 16) / 13) : null)); g.each((x, y) => (y >= 16 && y <= 20 && TEX.fur(x, y, '#000', M.fur) === '#000' ? null : null)); }
    if (s === 'cap' && rc.patches) { g.each((x, y) => (x >= 17 && x <= 19 && y >= 10 && y <= 12 ? M[rc.patches][1] : null)); g.set(16, 10, '#2a2018'); }
  } else if (s === 'hood' || s === 'coif' || s === 'beast') {
    const mk = (x, y) => { if (y < 3 || y > 29) return 0; const r = y < 13 ? Math.sqrt(Math.max(0, 110 - (13 - y) ** 2 * 1.05)) : 10.5 + (y - 13) * 0.18; return Math.abs(x + 0.5 - 16) <= r ? r : 0; };
    paintMask(g, mk, ramp, rc.tex, { lightTop: 8 });
    // face opening: shadowed oval
    g.each((x, y) => { const d = Math.hypot((x + 0.5 - 16) / 5.5, (y + 0.5 - 19) / 6.5); return d < 1 ? (d > 0.82 ? ramp[0] : '#08060c') : null; });
    if (rc.eyes) for (const ex of [13.5, 18.5]) gem(g, ex, 18, 1, rc.eyes);
    if (s === 'beast') {   // wolf pelt: ears + snout over the brow
      for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) for (let w = 0; w < 4 - i * 0.6; w++) g.set(Math.round(16 + sx * (7 + w - i * 0.3)), 6 - i, i > 3 ? ramp[3] : ramp[2]);
      g.each((x, y) => (y >= 9 && y <= 12 && Math.abs(x + 0.5 - 16) < 4 - (y - 9) * 0.6 ? shade(ramp, (x - 16) / 4) : null)); g.set(15, 12, '#0a0808'); g.set(16, 12, '#0a0808');
      for (const ex of [12.5, 19.5]) gem(g, ex, 10, 0.9, rc.eyes || '#ffd84a');
    }
    if (rc.tatter) for (let x = 0; x < N; x++) if (h2(x, 2, 14) < 0.55) for (let y = 27; y <= 29; y++) if (g.get(x, y)) g.set(x, y, null);
  } else {
    // full helms
    const wide = s === 'dwarf' ? 12 : s === 'angular' ? 11 : 10.5;
    const mk = s === 'angular' ? (x, y) => { if (y < 4 || y > 28) return 0; const r = y < 12 ? 4 + (y - 4) * 0.9 : 11 - Math.max(0, y - 22) * 0.6; return Math.abs(x + 0.5 - 16) <= r ? r : 0; } : dome(4, wide);
    paintMask(g, mk, ramp, rc.tex, { lightTop: 9, darkBottom: 24 });
    // visor
    const vis = rc.visor || 't';
    if (vis === 't') g.each((x, y) => { const eye = y >= 16 && y < 18 && Math.abs(x + 0.5 - 16) < 7 && Math.abs(x + 0.5 - 16) > 0.9; const mouth = y >= 18 && y < 25 && Math.abs(x + 0.5 - 16) < 2; return eye || mouth ? '#06050c' : null; });
    if (vis === 'slit') g.each((x, y) => (y >= 16 && y < 18 && Math.abs(x + 0.5 - 16) < 8 ? '#06050c' : null));
    if (vis === 'grill') g.each((x, y) => (y >= 15 && y < 25 && Math.abs(x + 0.5 - 16) < 6 && (x % 2 === 0 || y === 15) ? '#06050c' : null));
    if (vis === 'nasal') { g.each((x, y) => (y >= 16 && y < 26 && Math.abs(x + 0.5 - 16) < 7 && Math.abs(x + 0.5 - 16) > 1.2 ? '#1a120c' : null)); g.each((x, y) => (y >= 12 && y < 25 && Math.abs(x + 0.5 - 16) <= 1.2 ? shade(rc.trim ? M[rc.trim] : ramp, (x - 16)) : null)); }
    if (vis === 'skull') { for (const ex of [12.5, 19.5]) g.each((x, y) => (Math.hypot(x + 0.5 - ex, y + 0.5 - 16) < 2.4 ? '#0a0808' : null)); g.each((x, y) => (y >= 22 && y <= 26 && Math.abs(x + 0.5 - 16) < 5 && x % 2 === 0 ? '#0a0808' : null)); g.set(15, 19, '#0a0808'); g.set(16, 19, '#0a0808'); }
    if (rc.visorGlow) g.each((x, y) => (g.get(x, y) === '#06050c' && y >= 15 && y <= 17 ? rc.visorGlow : null), 4);
    if (rc.fangs) for (const fx of [14, 17]) { g.set(fx, 18, '#f6eed8'); g.set(fx, 19, '#dcd0b0'); g.set(fx, 20, '#b0a284'); }
    if (rc.eyes) for (const ex of [12.5, 19.5]) { g.set(Math.floor(ex), 16, rc.eyes, 4); g.set(Math.floor(ex) + 1, 16, rc.eyes, 4); }
    if (s === 'dwarf') { g.each((x, y) => (y >= 23 && y <= 29 && Math.abs(x + 0.5 - 16) < 7 - (y - 23) * 0.6 ? shade(M.rag, (x - 16) / 6) : null)); }   // braided beard guard
    if (s === 'bonehelm') { for (let y = 7; y <= 13; y += 2) hline(g, y, 9, 22, ramp[0]); }
  }
  // brow band / trim
  if (rc.trim && s !== 'furhat') g.each((x, y) => (y >= 14 && y <= 15 && g.get(x, y) && g.tag[y * N + x] === 1 ? shade(M[rc.trim], (x - 16) / 11) : null));
  // horns, spikes, crests, fins, crystal spires, flames
  if (rc.horns) { const hr = M[rc.horns]; for (const sx of [-1, 1]) g.each((x, y) => { const t = (13 - y) / 12; if (t < 0 || t > 1) return null; const hx = 16 + sx * (10 + t * (rc.bigHorns ? 7 : 5) - t * t * 4); return Math.abs(x + 0.5 - hx) < (rc.bigHorns ? 2.4 : 1.8) - t * 1.4 ? shade(hr, sx * 0.4 - t) : null; }); }
  if (rc.spikes) for (const sx of [-6, -3, 0, 3, 6]) for (let k = 0; k < 4 - Math.abs(sx) / 3; k++) g.set(16 + sx - (sx < 0 ? 1 : 0), 4 - k, k > 1 ? M[rc.spikes][3] : M[rc.spikes][2]);
  if (rc.crest) g.each((x, y) => (y >= 0 && y <= 8 && Math.abs(x + 0.5 - 16) < 1.2 + (8 - y) * 0.15 && (x + y) % 2 === 0 ? rc.crest : y >= 1 && y <= 8 && Math.abs(x + 0.5 - 16) < 1.2 ? mix(rc.crest, '#000000', 0.3) : null), 2);
  if (rc.fins) for (const sx of [-1, 1]) g.each((x, y) => { const lx = (x + 0.5 - 16) * sx; return lx > 9 && lx < 15 && y > 6 && y < 18 && y > 6 + (lx - 9) * 1.4 - 2 && (x + y) % 2 === 0 ? M[rc.fins][2] : lx > 9 && lx < 15 && y > 6 && y < 18 && y > 6 + (lx - 9) * 1.4 ? M[rc.fins][1] : null; });
  if (rc.spires) for (const [sx, hgt] of [[-7, 6], [-3, 9], [0, 11], [3, 9], [7, 6]]) g.each((x, y) => (Math.abs(x + 0.5 - 16 - sx) < 1.6 - (6 - y) * 0.12 && y >= 6 - hgt && y <= 6 ? ((x + y) % 3 ? M.rime[2] : M.rime[3]) : null), 2);
  if (rc.flames) g.each((x, y) => (y >= 0 && y <= 5 && [8, 12, 16, 20, 24].some((c) => Math.abs(x + 0.5 - c) < (6 - y) * 0.35) ? (y < 2 ? '#ffd27a' : '#ff6a1a') : null), 4);
  if (rc.frost) g.each((x, y) => (g.get(x, y) && y === 27 && x % 2 ? '#e8f8ff' : null));
  if (GEM[RAR(R)] && R >= 2 && !rc.noGem) gem(g, 16, s === 'hood' || s === 'beast' || s === 'coif' ? 9 : 11, 1.5, GEM[RAR(R)]);
}

// crowns keep their own drawer, with three distinct designs
function drawCrown(g, rc, it, R) {
  const ramp = M[rc.mat];
  if (rc.style === 'crude') {   // Goblin King: dented iron-and-gold band with uneven spikes and a big ugly gem
    g.each((x, y) => { const dx = Math.abs(x + 0.5 - 16); if (dx > 12 || y > 24) return null; const spike = [9, 13, 7, 12, 10][Math.floor((x + 1) / 7) % 5]; return y >= 18 || (y >= spike && (x % 7) > 1 && (x % 7) < 6) ? TEX.rough(x, y, shade(ramp, (x - 16) / 12), ramp) : null; });
    gem(g, 16, 21, 2, '#3ad06a'); gem(g, 9, 21, 1.2, '#e8435a'); gem(g, 23, 21, 1.2, '#e8435a');
  } else if (rc.style === 'hellfire') {
    g.each((x, y) => { const dx = Math.abs(x + 0.5 - 16); if (dx > 12 || y > 24 || y < 12) return null; return y >= 18 || (dx % 6 < 3 && y >= 12 + dx % 6) ? shade(M.dread, (x - 16) / 12) : null; });
    g.each((x, y) => (y >= 2 && y <= 13 && [6, 11, 16, 21, 26].some((c) => Math.abs(x + 0.5 - c) < (y - 1) * 0.24) ? (y < 6 ? '#ffd27a' : y < 9 ? '#ff8a2e' : '#e0401a') : null), 4);
    gem(g, 16, 21, 1.8, '#ff4a2a');
  } else {   // phoenix: golden wings sweeping up from the band, flame jewel
    g.each((x, y) => { const dx = Math.abs(x + 0.5 - 16); return y >= 17 && y <= 24 && dx < 11 ? shade(M.gold, (x - 16) / 11) : null; });
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) g.each((x, y) => { const lx = (x + 0.5 - 16) * sx; const fy = 16 - i * 3 - (lx - 3) * (0.5 - i * 0.06); return lx > 3 && lx < 15 - i && Math.abs(y + 0.5 - fy) < 1.3 ? (i % 2 ? '#ff8a2e' : '#ffd84a') : null; }, 4);
    gem(g, 16, 20, 2.2, '#ff4a6a');
  }
}

// ---------- legs (front view) ----------
// shape: trousers | leggings | breeches | greaves | skirt
function drawLegs(g, rc, it, R) {
  const ramp = M[rc.mat], s = rc.shape;
  const legW = (y) => (s === 'leggings' ? 4.4 : s === 'breeches' ? (y < 19 ? 6 : 4.3) : 5) - (y - 12) * 0.05;
  const mask = (x, y) => {
    if (y < 4 || y > 29) return 0;
    const d = Math.abs(x + 0.5 - 16);
    if (y < 12) return d <= 10.5 ? 10.5 : 0;
    const w = legW(y); return Math.abs(d - 5.25) <= w ? w : 0;
  };
  paintMask(g, (x, y) => { const w = mask(x, y); return w ? 10.5 : 0; }, ramp, rc.tex, { lightTop: 6 });
  // inner leg shadow + crotch
  g.each((x, y) => (y >= 12 && y <= 29 && g.get(x, y) && Math.abs(x + 0.5 - 16) < 1.6 ? ramp[0] : null));
  if (s === 'skirt') { const sk = M[rc.skirt || rc.mat]; g.each((x, y) => { const d = Math.abs(x + 0.5 - 16); if (y < 6 || y > 22 || d > 10.5 + (y - 6) * 0.2) return null; if (y > 19 && h2(x, 4, 16) < 0.5) return null; return TEX[rc.tex](x, y, shade(sk, (x - 16) / 12), sk); }); }
  if (rc.tassets) { const ts = M[rc.tassets]; for (const cx of [9, 16, 23]) g.each((x, y) => (y >= 7 && y <= 15 - Math.abs(cx - 16) * 0.2 && Math.abs(x + 0.5 - cx) < 3.2 ? (y === 7 || Math.abs(x + 0.5 - cx) > 2.4 ? (rc.trim ? M[rc.trim][2] : ts[3]) : shade(ts, (x - cx) / 3)) : null)); }
  // waistband
  const belt = rc.belt === 'rope' ? M.burlap : rc.belt === 'iron' ? M.iron : rc.belt === 'gold' ? M.gold : M.darkleather;
  g.each((x, y) => (y >= 4 && y <= 5 && Math.abs(x + 0.5 - 16) <= 10.5 ? (rc.belt === 'rope' && (x + y) % 2 ? belt[2] : shade(belt, (x - 16) / 10)) : null), 3);
  if (rc.belt && rc.belt !== 'rope') { g.set(15, 4, M.gold[2]); g.set(16, 4, M.gold[2]); g.set(15, 5, M.gold[1]); g.set(16, 5, M.gold[1]); }
  if (s === 'breeches' || rc.wraps) { const wr = M[rc.wraps || 'darkleather']; g.each((x, y) => (y >= 19 && y <= 28 && g.get(x, y) && g.tag[y * N + x] === 1 && Math.abs(Math.abs(x + 0.5 - 16) - 5.25) < 4.5 && ((x + y) % 4 === 0) ? wr[2] : null)); }
  if (rc.knees) { const kn = M[rc.knees]; for (const cx of [10.75, 21.25]) g.each((x, y) => { const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - 19) * 1.2); return d < 3 ? (d > 2.2 ? kn[0] : shade(kn, (x + 0.5 - cx) / 3 + (y + 0.5 - 19) / 4)) : null; }); }
  if (s === 'greaves') for (const cx of [10.75, 21.25]) g.each((x, y) => (y >= 22 && y <= 28 && Math.abs(x + 0.5 - cx + 1.5) < 0.6 ? ramp[3] : null));
  if (rc.bones) for (const cx of [10.75, 21.25]) for (const off of [-2, 2]) g.each((x, y) => (y >= 13 && y <= 28 && Math.abs(x + 0.5 - cx - off) < 0.9 ? (y % 5 === 0 ? M.bone[3] : shade(M.bone, (x + 0.5 - cx - off))) : null));
  if (rc.cuff) g.each((x, y) => (y >= 26 && y <= 29 && g.get(x, y) && Math.abs(Math.abs(x + 0.5 - 16) - 5.25) < 5.6 ? TEX.fur(x, y, shade(M[rc.cuff], (x - 16) / 10), M[rc.cuff]) : null));
  if (rc.cuff) for (let x = 0; x < N; x++) if (h2(x, 5, 17) < 0.4 && g.get(x, 29)) g.set(x, 30, M[rc.cuff][1]);
  if (rc.patches) for (const [px, py] of [[8, 15], [20, 22]]) { g.each((x, y) => (x >= px && x <= px + 2 && y >= py && y <= py + 2 ? M[rc.patches][1] : null)); g.set(px - 1, py, '#2a2018'); }
  if (rc.studs) for (let y = 13; y <= 27; y += 3) for (const cx of [10.75, 21.25]) for (const o of [-2, 2]) { g.set(Math.floor(cx + o), y, M.iron[3]); g.set(Math.floor(cx + o), y + 1, M.iron[0]); }
  if (rc.mud) g.each((x, y) => (y >= 26 && g.get(x, y) && g.tag[y * N + x] === 1 && h2(x, y, 18) < 0.6 ? '#3a2a14' : null));
  if (rc.tatter) for (let x = 0; x < N; x++) if (h2(x, 6, 19) < 0.5) for (let y = 28; y <= 29; y++) if (g.get(x, y)) g.set(x, y, null);
  if (rc.seams) g.each((x, y) => (y >= 13 && y <= 28 && g.get(x, y) && Math.abs(Math.abs(x + 0.5 - 16) - 5.25) < 0.5 ? rc.seams : null), 4);
  if (rc.runes) for (const cx of [10, 21]) for (const y of [14, 17, 23, 26]) g.set(cx, y, rc.runes, 4);
  if (rc.cracks) g.each((x, y) => (g.get(x, y) && g.tag[y * N + x] === 1 && y > 6 && (Math.abs((x * 2 + y * 3) % 17 - 8) < 0.6) ? rc.cracks : null), 4);
  if (rc.spikes) for (const cx of [10, 21]) for (let k = 0; k < 3; k++) { g.set(cx + (cx < 16 ? -3 - k : 3 + k), 19 - k, M[rc.spikes][k > 1 ? 3 : 2]); }
  if (rc.flames) g.each((x, y) => (y >= 27 && y <= 31 && Math.abs(Math.abs(x + 0.5 - 16) - 5.25) < 5 && (x * 3 + y) % 4 === 0 ? (y > 29 ? '#ffd27a' : '#ff6a1a') : null), 4);
  if (rc.frost) g.each((x, y) => (g.get(x, y) && y === 29 && x % 2 ? '#e8f8ff' : null));
  if (rc.trim) g.each((x, y) => (y === 6 && g.get(x, y) ? shade(M[rc.trim], (x - 16) / 10) : null));
  if (GEM[RAR(R)] && R >= 2 && !rc.noGem) gem(g, 16, 8, 1.3, GEM[RAR(R)]);
}

// ---------- boots (side view, toe to the right) ----------
// style: boot | low | wrap | sandal | sabaton | snowshoe | furboot
function drawBoots(g, rc, it, R) {
  const ramp = M[rc.mat], st = rc.style;
  const top = { low: 14, sandal: 9, wrap: 12, furboot: 6 }[st] ?? 5;
  const toeX = st === 'sabaton' ? 29 : 26;
  const mask = (x, y) => {
    const inShaft = x >= 9 && x <= 18 && y >= top && y <= 22;
    const inFoot = y >= 18 && y <= 25 && x >= 9 && x <= toeX - Math.max(0, 21 - y) * (st === 'sabaton' ? 2.2 : 1.6) - (st === 'sabaton' && y > 22 ? 0 : 0);
    return inShaft || inFoot ? 6 : 0;
  };
  if (st === 'snowshoe') g.each((x, y) => { const d = Math.hypot((x + 0.5 - 17) / 14, (y + 0.5 - 27.5) / 2.6); return d < 1 && d > 0.62 ? shade(M.leather, (x - 17) / 14) : d <= 0.62 && (x + y) % 3 === 0 ? M.burlap[1] : null; });
  paintMask(g, (x, y) => (mask(x, y) ? 1 : 0), ramp, rc.tex, {});
  // reshade along the boot: light front/top
  g.each((x, y) => { if (!mask(x, y) || g.tag[y * N + x] !== 1) return null; const t = (x - 14) / 6 * (y < 18 ? 1 : 0.4) + (y - 18) / 12; return TEX[rc.tex] ? TEX[rc.tex](x, y, shade(ramp, t), ramp) : shade(ramp, t); });
  // sole
  g.each((x, y) => (y >= 25 && y <= 26 && x >= 9 && x <= toeX - 0.5 ? (rc.sole || '#1a1418') : null));
  if (st === 'sandal') {   // bare foot and shin with leather straps criss-crossing up the leg
    const skin = ['#8a5a3a', '#c08a62', '#d8a882', '#ecc6a2'];
    g.each((x, y) => (mask(x, y) && y < 25 ? shade(skin, (x - 14) / 6 * (y < 18 ? 1 : 0.4)) : null));
    g.each((x, y) => (mask(x, y) && y < 25 && ((x + y) % 5 === 0 || (x - y + 40) % 5 === 0) && y >= 10 ? ramp[2] : null));
    g.each((x, y) => (mask(x, y) && (y === 20 || y === 23) ? ramp[1] : null));
  }
  if (st === 'wrap') { g.each((x, y) => (mask(x, y) && (x + y * 2) % 5 === 0 ? ramp[0] : null)); for (let x = 9; x <= 18; x++) if (h2(x, 7, 20) < 0.5) g.set(x, top - 1, ramp[1]); }
  if (st === 'sabaton') { for (const sy of [8, 12, 16, 20]) hline(g, sy, 9, 18, ramp[0]); for (const sx of [20, 23, 26]) g.each((x, y) => (x === sx && y >= 19 && y <= 24 && mask(x, y) ? ramp[0] : null)); }
  if (st === 'furboot' || rc.cuff) { const fc = M[rc.cuff || rc.mat]; g.each((x, y) => (x >= 8 && x <= 19 && y >= top - 1 && y <= top + 3 ? TEX.fur(x, y, shade(fc, (x - 13) / 6), fc) : null)); for (let x = 8; x <= 19; x++) if (h2(x, 8, 21) < 0.5) g.set(x, top - 2, fc[2]); }
  else g.each((x, y) => (y >= top && y <= top + 1 && x >= 9 && x <= 18 ? (rc.trim ? shade(M[rc.trim], (x - 13) / 5) : ramp[3]) : null));
  if (rc.studs) for (let y = top + 3; y <= 22; y += 3) for (const x of [11, 14, 17]) g.set(x, y, M.iron[3]);
  if (rc.nails) for (let x = 10; x <= toeX - 2; x += 2) g.set(x, 26, M.iron[3]);
  if (rc.wraps) for (let y = top + 2; y <= 22; y += 2) for (let x = 9; x <= 18; x++) if ((x + y) % 4 === 0) g.set(x, y, M[rc.wraps][2]);
  if (rc.bones) { for (let y = top + 2; y <= 22; y += 3) hline(g, y, 9, 18, M.bone[2]); }
  if (rc.claws) for (const cx of [toeX - 1, toeX - 4]) { g.set(cx, 26, M[rc.claws][3]); g.set(cx + 1, 27, M[rc.claws][2]); }
  if (rc.spikes) for (const [sx, sy] of [[19, 9], [19, 13], [19, 17]]) { g.set(sx, sy, M[rc.spikes][2]); g.set(sx + 1, sy - 1, M[rc.spikes][3]); }
  if (rc.wing) for (let i = 0; i < 3; i++) g.each((x, y) => { const lx = 8 - x, fy = 10 + i * 3 - lx * 0.7; return lx >= 0 && lx < 7 - i && Math.abs(y + 0.5 - fy) < 1.1 ? (i % 2 ? '#e8e2ff' : '#ffffff') : null; }, 2);
  if (rc.speed) for (const y of [11, 15, 19]) for (let x = 2; x <= 6; x++) if ((x + y) % 2) g.set(x, y, '#e8f8ff', 4);
  if (rc.seams) g.each((x, y) => (mask(x, y) && g.tag[y * N + x] === 1 && (x === 13 || y === 21) && y >= top + 2 ? rc.seams : null), 4);
  if (rc.runes) for (const [x, y] of [[12, 10], [15, 14], [12, 18]]) g.set(x, y, rc.runes, 4);
  if (rc.frost) g.each((x, y) => (mask(x, y) && y === top + 2 && x % 2 ? '#e8f8ff' : null));
  if (rc.tatter) for (let x = 9; x <= 18; x++) if (h2(x, 9, 22) < 0.5) { g.set(x, top, null); g.set(x, top + 1, null); }
  if (GEM[RAR(R)] && R >= 2 && !rc.noGem) gem(g, 13.5, top + 5, 1.2, GEM[RAR(R)]);
}

// ---------- special off-hands (Legendary and up) ----------
function drawOff(g, rc, it, R) {
  if (rc.shape === 'phylactery') {      // black-silver cage on a chain holding a green soul-gem
    g.each((x, y) => (Math.abs(x + 0.5 - 16) < 0.6 && y >= 1 && y <= 6 && y % 2 ? M.iron[2] : null));
    g.each((x, y) => { const d = Math.hypot((x + 0.5 - 16) / 7, (y + 0.5 - 17) / 10); return d < 1 && d > 0.8 ? shade(M.iron, (x - 16) / 7) : null; });
    g.each((x, y) => { const d = Math.hypot((x + 0.5 - 16) / 4.5, (y + 0.5 - 17) / 6.5); return d < 1 ? (d < 0.35 ? '#e8ffe8' : d < 0.7 ? '#5af07a' : '#1a8a3a') : null; }, 4);
    for (const [x, y] of [[16, 7], [10, 17], [22, 17], [16, 27]]) { g.set(x, y, M.mourn[3]); g.set(x - 1, y, M.iron[3]); }
    g.each((x, y) => (Math.abs(x + 0.5 - 16) < 4 && y === 17 ? M.iron[1] : null));
  } else if (rc.shape === 'heart') {    // faceted mountain-stone heart with molten gold veins
    g.each((x, y) => { const X = (x + 0.5 - 16) / 21, Y = (y + 0.5 - 17.5) / 21; const v = (X * X + Y * Y - 0.3) ** 3 - X * X * (-Y) ** 3; if (v > 0) return null; return TEX.crystal(x, y, shade(M.stone, X * 1.2 + Y * 0.6), M.stone); });
    g.each((x, y) => (g.get(x, y) && (Math.abs((x * 3 + y * 2) % 13 - 6) < 0.6 || Math.abs((x * 2 - y * 3 + 99) % 11 - 5) < 0.5) ? (h2(x, y, 23) < 0.5 ? '#ffb02e' : '#ffd84a') : null), 4);
    g.each((x, y) => { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16); return d < 2.6 ? (d < 1.3 ? '#ffffff' : '#ffb02e') : null; }, 4);
  } else if (rc.shape === 'icelantern') {
    g.each((x, y) => (Math.abs(x + 0.5 - 16) < 3 && y >= 1 && y <= 3 && !(Math.abs(x + 0.5 - 16) < 1.5 && y === 2) ? M.iron[2] : null));
    for (const [sx, hgt] of [[-6, 5], [6, 5], [-3, 3], [3, 3]]) g.each((x, y) => (Math.abs(x + 0.5 - 16 - sx) < 1.3 && y >= 4 - hgt + 4 && y <= 6 ? M.rime[3] : null), 2);
    g.each((x, y) => (Math.abs(x + 0.5 - 16) <= 7 && y >= 6 && y <= 25 ? (Math.abs(x + 0.5 - 16) > 5.8 || y === 6 || y === 25 ? TEX.crystal(x, y, shade(M.rime, (x - 16) / 7), M.rime) : mix('#7ae0ff', '#0a2a4a', 0.15 + Math.abs(x + 0.5 - 16) * 0.08)) : null), 4);
    g.each((x, y) => { const fy = 16 - y, w = 2.4 - Math.abs(fy - 1) * 0.35; return fy >= -5 && fy <= 6 && Math.abs(x + 0.5 - 16) < w ? (Math.abs(x + 0.5 - 16) < w * 0.5 ? '#ffffff' : '#9fe8ff') : null; }, 4);
    g.each((x, y) => (Math.abs(x + 0.5 - 16) <= 8 && y >= 26 && y <= 28 ? shade(M.rime, (x - 16) / 8) : null));
  } else if (rc.shape === 'ashtome') {  // charred black book, burning page edges, glowing demon sigil
    g.each((x, y) => (x >= 7 && x <= 25 && y >= 4 && y <= 28 ? (x >= 24 ? (h2(x, y, 24) < 0.4 ? '#ff8a2e' : '#3a2a20') : x <= 8 ? M.dread[0] : TEX.ember(x, y, shade(M.cinder, (x - 16) / 9 + (y - 16) / 30), M.cinder)) : null));
    g.each((x, y) => (y >= 1 && y <= 4 && x >= 9 && x <= 24 && (x * 3 + y) % 4 === 0 ? (y < 3 ? '#ffd27a' : '#ff6a1a') : null), 4);
    g.each((x, y) => { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16); return (d < 5 && d > 4) || (Math.abs(x + 0.5 - 16) < 0.6 && d < 5) || (Math.abs(y + 0.5 - 16 - (x + 0.5 - 16) * 0.6) < 0.5 && d < 4.5) ? '#ff4a2a' : null; }, 4);
    for (const [cx, cy] of [[9, 5], [23, 5], [9, 27], [23, 27]]) g.each((x, y) => (Math.abs(x + 0.5 - cx) < 1.5 && Math.abs(y + 0.5 - cy) < 1.5 ? M.gold[2] : null));
  } else if (rc.shape === 'seraph') {   // big six-feather wings, gold-tipped, halo and light gem
    for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) g.each((x, y) => { const lx = (x + 0.5 - 16) * sx; if (lx < 2) return null; const fy = 7 + i * 3.6 - (lx - 2) * (0.62 - i * 0.06); const len = 14 - i * 1.5; if (lx > 2 + len || Math.abs(y + 0.5 - fy) > 2.2 - (lx - 2) / len * 1.1) return null; return lx > len - 1 ? '#ffd84a' : i % 2 ? '#ece6ff' : '#ffffff'; }, 1);
    g.each((x, y) => { const d = Math.hypot(x + 0.5 - 16, (y + 0.5 - 4) * 2.4); return d > 4.4 && d < 6 ? '#ffd84a' : null; }, 4);
    gem(g, 16, 16, 2.6, '#fff4b0');
    for (const [x, y] of [[4, 4], [27, 6], [6, 27], [26, 26]]) { g.set(x, y, '#ffffff', 4); g.set(x - 1, y, '#fff4b0', 4); g.set(x + 1, y, '#fff4b0', 4); g.set(x, y - 1, '#fff4b0', 4); g.set(x, y + 1, '#fff4b0', 4); }
  }
}

const RAR = (R) => ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'][R];

// ---------- one recipe per item ----------
export const RECIPES = {
  // chestpieces
  'Tattered Tunic': { shape: 'tunic', mat: 'rag', tex: 'rough', belt: 'rope', patches: 'burlap' },
  'Burlap Tunic': { shape: 'tunic', mat: 'burlap', tex: 'weave', belt: 'rope', neck: 'laces' },
  'Studded Leather Vest': { shape: 'vest', mat: 'leather', tex: 'leather', studs: true, neck: 'laces', belt: 'leather' },
  "Scout's Jerkin": { shape: 'jerkin', mat: 'scout', tex: 'leather', straps: true, belt: 'leather', furCollar: true },
  'Goblin Chain Hauberk': { shape: 'hauberk', mat: 'goblin', tex: 'chain', belt: 'iron', spikes: 'rust', trim: 'rust', tatter: true },
  "Mourner's Robe": { shape: 'robe', mat: 'mourn', tex: 'weave', belt: 'rope', tatter: true },
  'Chainmail Shirt': { shape: 'shirt', mat: 'chain', tex: 'chain', belt: 'leather', neck: 'round' },
  'Bonecage Chestplate': { shape: 'ribcage', mat: 'bone', tex: 'rough', belt: 'leather' },
  'Wraithweave Robe': { shape: 'robe', mat: 'wraith', tex: 'ghost', tatter: true, trim: 'mourn', runes: '#b8f0ff', noGem: false },
  'Quarry Vest': { shape: 'vest', mat: 'grave', tex: 'rough', belt: 'rope', patches: 'leather' },
  'Iron Breastplate': { shape: 'cuirass', mat: 'iron', tex: 'plates', belt: 'leather' },
  'Dwarven Cuirass': { shape: 'cuirass', mat: 'dwarf', tex: 'plates', belt: 'gold', trim: 'iron', runes: '#4ad0ff' },
  'Obsidian Plate': { shape: 'plate', mat: 'obsidian', tex: 'gloss', trim: 'gold', belt: 'gold' },
  'Golemheart Plate': { shape: 'plate', mat: 'stone', tex: 'stoneblock', core: '#4ad0ff', cracks: '#4ad0ff' },
  'Deepforge Cuirass': { shape: 'cuirass', mat: 'deep', tex: 'plates', trim: 'gold', cracks: '#ff8a2e', belt: 'gold' },
  'Padded Parka': { shape: 'parka', mat: 'quilt', tex: 'quilt', furCollar: true, furMat: 'yeti' },
  'Yeti-Hide Coat': { shape: 'coat', mat: 'yeti', tex: 'fur', belt: 'leather' },
  'Wolf-Pelt Mantle': { shape: 'mantle', mat: 'leather', tex: 'leather', furMat: 'wolf', belt: 'leather', straps: true },
  'Rimeguard Armour': { shape: 'plate', mat: 'rime', tex: 'crystal', trim: 'iron', frost: true, belt: 'iron' },
  'Aurora Plate': { shape: 'plate', mat: 'aurora', tex: 'aurora', trim: 'gold', core: '#e0fff0', frost: true },
  'Cinder Tunic': { shape: 'tunic', mat: 'cinder', tex: 'ember', seams: '#ff7a2a', belt: 'iron', neck: 'laces' },
  'Brimstone Mail': { shape: 'hauberk', mat: 'cinder', tex: 'glowscales', pauldrons: 'cinder', belt: 'iron', trim: 'brim' },
  'Demonhide Vest': { shape: 'jerkin', mat: 'demonhide', tex: 'scales', pauldrons: 'bone', spikes: 'bone', skull: '#ffb02e', belt: 'leather' },
  'Dread Plate': { shape: 'plate', mat: 'dread', tex: 'gloss', cape: 'bloodcape', pauldrons: 'dread', spikes: 'dread', trim: 'demonhide', runeV: '#ff3a3a', skull: '#ff3a3a', belt: 'iron' },
  // helmets
  'Leather Cap': { shape: 'cap', mat: 'leather', tex: 'leather' },
  'Patched Leather Cap': { shape: 'cap', mat: 'darkleather', tex: 'leather', patches: 'burlap' },
  'Iron Skullcap': { shape: 'skull', mat: 'rust', tex: 'rough' },
  "Scout's Hood": { shape: 'hood', mat: 'scout', tex: 'weave', tatter: true },
  'Goblin Warlord Helm': { shape: 'greathelm', mat: 'goblin', tex: 'rough', visor: 'grill', horns: 'bone', trim: 'rust' },
  "Goblin King's Crown": { shape: 'crown', style: 'crude', mat: 'rust' },
  'Grave-Dirt Hood': { shape: 'hood', mat: 'grave', tex: 'rough', tatter: true },
  'Chain Coif': { shape: 'coif', mat: 'chain', tex: 'chain' },
  'Bonecage Helm': { shape: 'bonehelm', mat: 'bone', tex: 'rough', visor: 'skull' },
  'Wraithweave Hood': { shape: 'hood', mat: 'wraith', tex: 'ghost', eyes: '#b8f0ff', tatter: true },
  'Hard Leather Helm': { shape: 'skull', mat: 'hardleather', tex: 'leather' },
  'Iron Helm': { shape: 'greathelm', mat: 'iron', tex: 'plain', visor: 't' },
  'Dwarven Helm': { shape: 'dwarf', mat: 'dwarf', tex: 'plates', visor: 'nasal', trim: 'iron', horns: 'bone' },
  'Obsidian Helm': { shape: 'angular', mat: 'obsidian', tex: 'gloss', visor: 'slit', trim: 'gold', eyes: '#b48cff' },
  'Fur Hat': { shape: 'furhat', mat: 'quilt', tex: 'quilt', trim: 'fur' },
  'Yeti-Hide Cap': { shape: 'furhat', mat: 'yeti', tex: 'fur', trim: 'yeti' },
  'Wolf-Pelt Hood': { shape: 'beast', mat: 'wolf', tex: 'fur', eyes: '#ffd84a' },
  'Rimeguard Helm': { shape: 'greathelm', mat: 'rime', tex: 'crystal', visor: 'slit', spires: true, eyes: '#e8f8ff' },
  'Wyrmscale Helm': { shape: 'angular', mat: 'rime', tex: 'scales', visor: 'slit', fins: 'iron', eyes: '#7ae0ff', crest: '#e8f8ff' },
  'Ashen Hood': { shape: 'hood', mat: 'cinder', tex: 'ember', tatter: true, eyes: '#ff7a2a', horns: 'cinder' },
  'Brimstone Helm': { shape: 'greathelm', mat: 'cinder', tex: 'glowscales', visor: 'grill', visorGlow: '#ffd84a', horns: 'brim', trim: 'brim' },
  'Demonhorn Helm': { shape: 'greathelm', mat: 'demonhide', tex: 'scales', visor: 't', fangs: true, horns: 'cinder', bigHorns: true, eyes: '#ffd84a', visorGlow: '#ff8a2e' },
  'Dread Helm': { shape: 'angular', mat: 'dread', tex: 'gloss', visor: 'slit', visorGlow: '#ff3a3a', spikes: 'dread', horns: 'dread', bigHorns: true, trim: 'demonhide' },
  'Hellfire Crown': { shape: 'crown', style: 'hellfire', mat: 'dread' },
  'Crown of the Phoenix': { shape: 'crown', style: 'phoenix', mat: 'gold' },
  // legs
  'Ragged Trousers': { shape: 'trousers', mat: 'rag', tex: 'rough', patches: 'burlap', belt: 'rope', tatter: true },
  'Studded Leggings': { shape: 'leggings', mat: 'leather', tex: 'leather', studs: true, belt: 'leather' },
  "Scout's Breeches": { shape: 'breeches', mat: 'scout', tex: 'weave', wraps: 'darkleather', belt: 'leather' },
  'Goblin Warlord Greaves': { shape: 'greaves', mat: 'goblin', tex: 'rough', tassets: 'rust', knees: 'rust', spikes: 'rust', belt: 'iron' },
  "Gravedigger's Trousers": { shape: 'trousers', mat: 'grave', tex: 'rough', patches: 'leather', belt: 'rope', mud: true },
  'Chainmail Leggings': { shape: 'leggings', mat: 'chain', tex: 'chain', knees: 'iron', belt: 'leather' },
  'Bonecage Legguards': { shape: 'greaves', mat: 'darkleather', tex: 'leather', bones: true, knees: 'bone', belt: 'leather' },
  'Wraithweave Leggings': { shape: 'skirt', mat: 'mourn', skirt: 'wraith', tex: 'ghost', runes: '#b8f0ff' },
  'Quarry Trousers': { shape: 'trousers', mat: 'linen', tex: 'rough', patches: 'grave', belt: 'rope', mud: true },
  'Iron Greaves': { shape: 'greaves', mat: 'iron', tex: 'plates', knees: 'iron', belt: 'leather' },
  'Dwarven Legplates': { shape: 'greaves', mat: 'dwarf', tex: 'plates', tassets: 'dwarf', trim: 'iron', runes: '#4ad0ff', belt: 'gold' },
  'Obsidian Greaves': { shape: 'greaves', mat: 'obsidian', tex: 'gloss', knees: 'gold', trim: 'gold', belt: 'gold' },
  'Fur Leggings': { shape: 'trousers', mat: 'quilt', tex: 'quilt', cuff: 'yeti', belt: 'leather' },
  'Yeti-Hide Leggings': { shape: 'leggings', mat: 'yeti', tex: 'fur', cuff: 'yeti', belt: 'leather' },
  'Wolf-Pelt Leggings': { shape: 'breeches', mat: 'leather', tex: 'leather', cuff: 'wolf', wraps: 'wolf', belt: 'leather' },
  'Rimeguard Greaves': { shape: 'greaves', mat: 'rime', tex: 'crystal', knees: 'iron', frost: true, belt: 'iron' },
  'Cinder Leggings': { shape: 'trousers', mat: 'cinder', tex: 'ember', seams: '#ff7a2a', belt: 'iron' },
  'Brimstone Greaves': { shape: 'greaves', mat: 'cinder', tex: 'glowscales', tassets: 'brim', knees: 'brim', belt: 'iron' },
  'Demonhide Leggings': { shape: 'leggings', mat: 'demonhide', tex: 'scales', knees: 'bone', spikes: 'bone', belt: 'leather' },
  'Dread Greaves': { shape: 'greaves', mat: 'dread', tex: 'gloss', tassets: 'dread', trim: 'demonhide', knees: 'dread', spikes: 'dread', seams: '#ff3a3a', belt: 'iron' },
  'Cinderwalker Greaves': { shape: 'greaves', mat: 'deep', tex: 'plates', tassets: 'gold', knees: 'gold', cracks: '#ff8a2e', flames: true, belt: 'gold' },
  // boots
  'Worn Boots': { style: 'low', mat: 'leather', tex: 'rough' },
  'Frayed Boots': { style: 'wrap', mat: 'rag', tex: 'rough' },
  'Studded Boots': { style: 'boot', mat: 'leather', tex: 'leather', studs: true },
  "Scout's Treads": { style: 'boot', mat: 'scout', tex: 'weave', wraps: 'darkleather' },
  'Goblin Warlord Boots': { style: 'sabaton', mat: 'goblin', tex: 'rough', spikes: 'rust', trim: 'rust' },
  'Crypt Sandals': { style: 'sandal', mat: 'grave', tex: 'rough' },
  'Iron Sabatons': { style: 'sabaton', mat: 'iron', tex: 'plain' },
  'Bonecage Boots': { style: 'boot', mat: 'darkleather', tex: 'leather', bones: true, claws: 'bone' },
  'Wraithweave Boots': { style: 'boot', mat: 'wraith', tex: 'ghost', tatter: true, runes: '#b8f0ff' },
  'Hobnail Boots': { style: 'low', mat: 'hardleather', tex: 'leather', nails: true },
  'Iron Boots': { style: 'boot', mat: 'iron', tex: 'plates' },
  'Dwarven Boots': { style: 'boot', mat: 'dwarf', tex: 'plates', trim: 'iron', runes: '#4ad0ff' },
  'Obsidian Boots': { style: 'sabaton', mat: 'obsidian', tex: 'gloss', trim: 'gold' },
  'Snowshoes': { style: 'snowshoe', mat: 'quilt', tex: 'quilt' },
  'Yeti-Hide Boots': { style: 'furboot', mat: 'yeti', tex: 'fur' },
  'Wolf-Pelt Boots': { style: 'furboot', mat: 'leather', tex: 'leather', cuff: 'wolf' },
  'Rimeguard Boots': { style: 'sabaton', mat: 'rime', tex: 'crystal', frost: true },
  'Windrunner Boots': { style: 'boot', mat: 'yeti', tex: 'plain', trim: 'gold', wing: true, speed: true },
  'Ember Boots': { style: 'low', mat: 'cinder', tex: 'ember', seams: '#ff7a2a' },
  'Brimstone Boots': { style: 'boot', mat: 'cinder', tex: 'glowscales', trim: 'brim' },
  'Demonhide Boots': { style: 'boot', mat: 'demonhide', tex: 'scales', claws: 'bone', spikes: 'bone' },
  'Dread Sabatons': { style: 'sabaton', mat: 'dread', tex: 'gloss', spikes: 'dread', runes: '#ff3a3a', trim: 'demonhide', claws: 'dread' },
  // top-rarity off-hands
  "Lich's Phylactery": { shape: 'phylactery' },
  'Heart of the Mountain': { shape: 'heart' },
  'Everfrost Lantern': { shape: 'icelantern' },
  'Tome of Ash': { shape: 'ashtome' },
  'Wings of the Seraph': { shape: 'seraph' },
};

// ---------- weapons (diagonal: handle bottom-left, tip top-right) ----------
// u = along the weapon, v = across (+v = lower-right side, in shadow)
Object.assign(M, {
  wood: ['#3a2414', '#6a4426', '#8a5c34', '#a87a4a'], darkwood: ['#1a120c', '#32221a', '#4a3424', '#6a4c34'], silver: ['#5a6070', '#a0a8b8', '#dce2ec', '#ffffff'],
  holy: ['#7a5a20', '#c09a48', '#f0e2b0', '#ffffff'], ice: ['#3a7ab0', '#7ac0f0', '#c8ecff', '#ffffff'], spectral: ['#2a4a6a', '#5a8ab0', '#a0d8f0', '#e8ffff'],
  hellsteel: ['#1a0a0a', '#4a1a14', '#7a2418', '#b83a20'], granite: ['#4a4642', '#7a746c', '#a49c90', '#cac2b4'], fang: ['#8a7a5a', '#d8ccae', '#f0e8d4', '#ffffff'],
  steel: ['#2e323a', '#5e6672', '#a4acb8', '#eef2f8'], slate: ['#262a30', '#3e444c', '#5a626c', '#7e8892'],
});
const WO = { x: 5.5, y: 26.5 };
const uvf = (px, py) => { const dx = px - WO.x, dy = py - WO.y; return [(dx - dy) * Math.SQRT1_2, (dx + dy) * Math.SQRT1_2]; };
const ptf = (u, v) => [WO.x + (u + v) * Math.SQRT1_2, WO.y + (v - u) * Math.SQRT1_2];
const fillUV = (g, fn, tag = 1) => g.each((x, y) => { const [u, v] = uvf(x + 0.5, y + 0.5); return fn(u, v, x, y); }, tag);

function wGrip(g, u0, u1, r, mat, wrap) { fillUV(g, (u, v) => (u >= u0 && u <= u1 && Math.abs(v) <= r ? (wrap && Math.floor(u * 1.4) % 2 ? mix(shade(M[mat], v / r), '#000000', 0.3) : shade(M[mat], v / r)) : null)); }
function wPommel(g, u, r, mat, gemCol) { const [cx, cy] = ptf(u, 0); g.each((x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); return d <= r ? shade(M[mat], ((x + 0.5 - cx) + (y + 0.5 - cy)) / r / 1.4) : null; }); if (gemCol) gem(g, cx, cy, r * 0.6, gemCol); }
function wGuard(g, u, half, mat, style, gemCol) {
  const ramp = M[mat];
  if (style === 'skull') { const [cx, cy] = ptf(u, 0); g.each((x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; const d = Math.hypot(dx, dy * 1.1); if (d > 3) return null; if (Math.hypot(dx + 1.1, dy + 0.3) < 0.8 || Math.hypot(dx - 1.1, dy + 0.3) < 0.8) return '#0a0808'; return shade(M.bone, dx / 3); }, 2); return; }
  if (style === 'disc') { const [cx, cy] = ptf(u, 0); g.each((x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); return d < 3.4 ? (d > 2.6 ? ramp[0] : d < 1.4 ? '#ffffff' : shade(ramp, ((x + 0.5 - cx) + (y + 0.5 - cy)) / 4)) : null; }, 2); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.set(Math.round(cx + Math.cos(a) * 4.4), Math.round(cy + Math.sin(a) * 4.4), '#fff4b0', 4); } return; }
  fillUV(g, (uu, v) => {
    if (Math.abs(v) > half) return null;
    const k = Math.abs(v) / half;
    const c = style === 'curved' ? u - 1.6 * k * k : style === 'wing' ? u - 2.5 * k : style === 'horns' ? u + 2.8 * k * k : u;
    const th = style === 'wing' ? 1.4 - k * 0.6 : style === 'horns' ? 1.2 - k * 0.5 : 1.15;
    if (Math.abs(uu - c) > th) return null;
    return shade(ramp, -(uu - c) / th);
  });
  if (gemCol) { const [cx, cy] = ptf(u, 0); gem(g, cx, cy, 1.5, gemCol); }
}
// blade profiles: straight | broad | great | leaf | curved | serrated | flame | rapier | broken | kris
function wBlade(g, u0, u1, w, profile, mat, opts = {}) {
  const ramp = M[mat], tip = opts.tip || (profile === 'great' || profile === 'broad' ? 5 : 4);
  const centre = (u) => { const t = (u - u0) / (u1 - u0); return profile === 'curved' ? -2.4 * t * t : profile === 'flame' || profile === 'kris' ? 0.7 * Math.sin(u * (profile === 'kris' ? 1.1 : 0.85)) : 0; };
  const half = (u) => {
    const t = (u - u0) / (u1 - u0);
    let hw = profile === 'leaf' ? w * (0.75 + 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.2))) : profile === 'rapier' ? w * 0.55 : profile === 'great' ? w * 1.25 : profile === 'broad' ? w * 1.12 : profile === 'curved' ? w * (1 + 0.35 * t) : w;
    if (u > u1 - tip) hw *= (u1 - u) / tip;
    return hw;
  };
  fillUV(g, (u, v) => {
    if (u < u0 || u > u1) return null;
    const c = centre(u), hw = half(u), vv = v - c;
    let lim = hw;
    if (profile === 'serrated' && vv > 0 && u < u1 - tip) lim = hw + (Math.floor(u * 1.2) % 2 ? 0.9 : 0);
    if (profile === 'broken' && u > u1 - 6 && vv < 0 && h2(Math.floor(u), 3, 31) < 0.5) lim = hw * 0.4;
    if (Math.abs(vv) > lim) return null;
    const t = vv / Math.max(hw, 0.8);
    if (u < u1 - tip - 0.5 && u > u0 + 1.2 && Math.abs(vv) < 0.55 && hw >= 1.6) {
      const f = opts.fuller;
      if (f === 'glow') return opts.glow;
      if (f === 'runes') return Math.floor(u) % 3 === 0 ? opts.glow : ramp[0];
      if (f === 'lava') return Math.floor(u * 0.8) % 2 ? '#ff6a1a' : '#ffb347';
      if (f === 'groove') return ramp[0];
    }
    if (t < -0.72) return opts.edge || ramp[3];
    const base = shade(ramp, t);
    return opts.tex ? TEX[opts.tex](Math.floor(u), Math.floor(v + 9), base, ramp) : base;
  }, 1);
  // effects
  if (opts.fx === 'flames') fillUV(g, (u, v) => { const c = centre(u), hw = half(u); const out = -(v - c) - hw; return u > u0 + 2 && u < u1 - 1 && out > 0 && out < 2.4 * (0.5 + h2(Math.floor(u), 1, 32)) && (Math.floor(u) + Math.floor(v)) % 2 === 0 ? (out < 1 ? '#ff6a1a' : '#ffd27a') : null; }, 4);
  if (opts.fx === 'frost') fillUV(g, (u, v) => { const c = centre(u), hw = half(u); const out = Math.abs(v - c) - hw; return u > u0 + 2 && u < u1 - 2 && out > 0 && out < 1.4 && Math.floor(u) % 3 === 0 ? '#e8f8ff' : null; }, 4);
  if (opts.fx === 'ghost') fillUV(g, (u, v) => { const c = centre(u), hw = half(u); const out = (v - c) - hw; return u > u0 + 1 && u < u1 && out > 0 && out < 2.6 && (Math.floor(u) + Math.floor(v * 2)) % 3 === 0 ? mix('#b8f0ff', '#2a4a6a', out / 3) : null; }, 4);
  if (opts.fx === 'holy') fillUV(g, (u, v) => { const c = centre(u), hw = half(u); const out = Math.abs(v - c) - hw; return u > u0 + 1 && u < u1 && out > 0 && out < 1 ? '#fff4b0' : null; }, 4);
  if (opts.fx === 'soul') fillUV(g, (u, v) => { const c = centre(u), hw = half(u); const out = -(v - c) - hw; return u > u0 + 1 && u < u1 && out > 0 && out < 2.2 && h2(Math.floor(u), Math.floor(v), 33) < 0.55 ? (out < 1 ? '#7affb0' : '#b48cff') : null; }, 4);
  if (opts.fx === 'embers') fillUV(g, (u, v) => (u > u0 && u < u1 && Math.abs(v - centre(u)) < half(u) && h2(Math.floor(u * 2), Math.floor(v * 2), 34) < 0.12 ? '#ff7a2a' : null), 4);
  if (opts.fx === 'rust') fillUV(g, (u, v) => (u > u0 && u < u1 && Math.abs(v - centre(u)) < half(u) && h2(Math.floor(u * 2), Math.floor(v * 2), 35) < 0.25 ? '#7a4a2a' : null), 1);
}
function wHaft(g, u0, u1, r, mat, bands, tex) { fillUV(g, (u, v) => (u >= u0 && u <= u1 && Math.abs(v) <= r ? (tex ? TEX[tex](Math.floor(u * 2), Math.floor(v * 3), shade(M[mat], v / r), M[mat]) : shade(M[mat], v / r)) : null)); if (bands) for (const ub of [u0 + 1, u1 - 1.5]) fillUV(g, (u, v) => (Math.abs(u - ub) < 0.6 && Math.abs(v) <= r + 0.35 ? shade(M[bands], v / r) : null)); }
// axe heads: single | double | cleaver | crescent | pick
function wAxe(g, c, shape, mat, opts = {}) {
  const ramp = M[mat];
  const side = (sgn, reach, spread) => fillUV(g, (u, v) => {
    const vv = v * sgn; if (vv < -1.4) return null;
    if (shape === 'cleaver') { if (vv > reach || Math.abs(u - c) > 3.6) return null; if (vv > reach - 1.2 && h2(Math.floor(u), 2, 36) < 0.4) return null; return vv > reach - 1.1 ? ramp[3] : opts.tex ? TEX[opts.tex](Math.floor(u * 2), Math.floor(v * 2), shade(ramp, (u - c) / 4 - 0.2), ramp) : shade(ramp, (u - c) / 4 - 0.2); }
    const edge = reach - ((u - c) ** 2) / spread;
    if (vv > edge || Math.abs(u - c) > 2.4 + 0.55 * Math.max(0, vv)) return null;
    if (vv > edge - 1.1) return opts.edge || ramp[3];
    if (opts.runes && Math.abs(u - c) < 0.5 && vv > 1 && vv < edge - 2) return opts.runes;
    if (opts.lava && Math.abs(vv - edge * 0.55) < 0.5) return '#ff6a1a';
    return shade(ramp, (u - c) / 3 - 0.3);
  }, 1);
  if (shape === 'pick') { for (const sgn of [1, -1]) fillUV(g, (u, v) => { const vv = v * sgn; const cu = c - (vv * vv) / 14; return vv > 0 && vv < 9 && Math.abs(u - cu) < 1.4 - vv * 0.13 ? shade(ramp, (u - cu)) : null; }, 1); return; }
  if (shape === 'double') { side(1, 8.5, 9); side(-1, 8.5, 9); }
  else if (shape === 'crescent') { side(1, 11, 7); fillUV(g, (u, v) => (v < -1 && v > -4 && Math.abs(u - c) < 1.2 - (-v - 1) * 0.3 ? shade(ramp, u - c) : null)); }
  else if (shape === 'cleaver') side(1, 8, 1);
  else { side(1, 9.5, 10); fillUV(g, (u, v) => (v < -1 && v > -4.5 && Math.abs(u - c) < 1.2 - (-v - 1) * 0.3 ? shade(ramp, u - c) : null)); }
  if (opts.gem) { const [cx, cy] = ptf(c, 0); gem(g, cx, cy, 1.3, opts.gem); }
}
// hammer heads: club | mace | block | maul | sceptre | spiked
function wHammer(g, c, shape, mat, opts = {}) {
  const ramp = M[mat];
  if (shape === 'club') { fillUV(g, (u, v) => { if (u < 8 || u > 30) return null; const r = 1.4 + (u - 8) * 0.17 + (Math.abs(u - 26) < 2 ? 1 : 0); if (Math.abs(v) > r) return null; return opts.tex ? TEX[opts.tex](Math.floor(u * 2), Math.floor(v * 2), shade(ramp, v / r), ramp) : shade(ramp, v / r); }, 1); return; }
  if (shape === 'mace') { const [cx, cy] = ptf(c, 0); g.each((x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); const r = 4 + (Math.cos(a * 6) > 0.6 ? 1.6 : 0); return d < r ? shade(ramp, (dx + dy) / 6) : null; }, 1); return; }
  if (shape === 'sceptre') {
    const [cx, cy] = ptf(c, 0);
    g.each((x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy); return d < 4.2 ? shade(ramp, (dx + dy) / 6) : null; }, 1);
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 4 - Math.PI / 2 + (k - 2) * 0.45; for (let r = 4; r < 7.5; r += 0.5) g.set(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), r > 6.4 ? ramp[3] : ramp[2]); }
    if (opts.flames) g.each((x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); return d > 7 && d < 9.5 && (x + y) % 2 === 0 && h2(x, y, 37) < 0.6 ? (d < 8.2 ? '#ff6a1a' : '#ffd27a') : null; }, 4);
    if (opts.gem) gem(g, cx, cy, 2, opts.gem);
    return;
  }
  const hl = shape === 'maul' ? 5.5 : 4.4, hw = shape === 'maul' ? 8 : 6.6;
  fillUV(g, (u, v) => {
    if (Math.abs(u - c) > hl || Math.abs(v) > hw) return null;
    const bevel = Math.abs(u - c) > hl - 0.9 || Math.abs(v) > hw - 0.9;
    if (opts.runes && !bevel && (Math.abs(u - c) < 0.6 || (Math.abs(v) < hw - 2 && Math.floor(v + 20) % 3 === 0 && Math.abs(u - c) < 2.4))) return opts.runes;
    if (opts.cracks && !bevel && Math.abs((Math.floor(u * 2) + Math.floor(v * 2)) % 7 - 3) < 0.6) return opts.cracks;
    const base = bevel ? (u - c > 0 || v < 0 ? ramp[3] : ramp[0]) : shade(ramp, (v / hw) * 0.6 - (u - c) / hl * 0.4);
    return opts.tex && !bevel ? TEX[opts.tex](Math.floor(u * 2), Math.floor(v * 2), base, ramp) : base;
  }, 1);
  if (opts.bands) for (const s of [-1, 1]) fillUV(g, (u, v) => (Math.abs(u - c) < 1.1 && Math.abs(v - s * (hw - 0.5)) < 0.7 ? M[opts.bands][2] : null));
  if (shape === 'spiked') for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const [x, y] = ptf(c, s * (hw + 0.8 + k * 0.8)); g.set(Math.round(x), Math.round(y), k ? ramp[3] : ramp[2]); }
  if (opts.core) { const [cx, cy] = ptf(c, 0); g.each((x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); return d < 2.6 ? (d < 1.2 ? '#ffffff' : opts.core) : null; }, 4); }
  if (opts.gem) { const [cx, cy] = ptf(c, 0); gem(g, cx, cy, 1.5, opts.gem); }
}
// spear tips: leaf | barbed | fang | icicle | trident
function wSpear(g, base, shape, mat, opts = {}) {
  const ramp = M[mat];
  if (shape === 'trident') {
    fillUV(g, (u, v) => (u > base - 1 && u < base + 1 && Math.abs(v) < 4.6 ? shade(ramp, -(u - base)) : null), 1);
    for (const off of [-3.8, 0, 3.8]) fillUV(g, (u, v) => { const L = off ? 7 : 10; if (u < base || u > base + L || Math.abs(v - off) > 0.9 * (1 - (u - base) / L) + 0.3) return null; return shade(ramp, (v - off) / 1.2); }, 1);
    for (const off of [-3.8, 3.8]) fillUV(g, (u, v) => (u > base + 5 && u < base + 6.5 && v * Math.sign(off) > Math.abs(off) && v * Math.sign(off) < Math.abs(off) + 1.3 ? ramp[3] : null), 1);
    return;
  }
  const L = shape === 'icicle' ? 13 : shape === 'fang' ? 11 : 10, W = shape === 'icicle' ? 1.7 : shape === 'fang' ? 2.4 : 3.1;
  fillUV(g, (u, v) => {
    if (u < base || u > base + L) return null;
    const t = (u - base) / L;
    const c = shape === 'fang' ? 1.6 * t * t : 0;
    let hw = shape === 'leaf' || shape === 'barbed' ? W * Math.sin(Math.PI * Math.min(1, t * 1.1)) ** 0.8 : W * (1 - t * 0.92);
    if (shape === 'barbed' && t < 0.3) hw += (Math.floor((u - base) * 1.3) % 2) * 1.1;
    if (Math.abs(v - c) > hw) return null;
    return Math.abs(v - c) < 0.4 && shape !== 'icicle' ? ramp[1] : shape === 'icicle' && (Math.floor(u) % 3 === 0) ? '#ffffff' : shade(ramp, (v - c) / Math.max(hw, 0.7));
  }, 1);
}
function wStaffHead(g, c, shape, opts = {}) {
  const [cx, cy] = ptf(c, 0);
  if (shape === 'skull') {
    g.each((x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; const d = Math.hypot(dx, dy * 1.1); if (d < 5 && dy < 3.2) { if (Math.hypot(dx + 1.9, dy + 0.4) < 1.3 || Math.hypot(dx - 1.9, dy + 0.4) < 1.3) return opts.eyes || '#7ae0ff'; if (dy > 1.6 && Math.abs(dx) < 2.6 && x % 2) return '#0a0808'; return shade(M.bone, dx / 5 + (dy < -2 ? -0.4 : 0)); } return null; }, 2);
    g.each((x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - (cy + 4.4)); return d < 1.7 ? (d < 0.8 ? '#ffffff' : opts.orb || '#7ae0ff') : null; }, 4);
    for (const [x, y] of [[cx - 5, cy - 4], [cx + 4, cy - 6], [cx + 6, cy + 1]]) g.set(Math.round(x), Math.round(y), '#e8f8ff', 4);
    return;
  }
  if (shape === 'crystal') {
    for (const [ox, oy, hgt, w] of [[0, 0, 10, 2.2], [-3.4, 1.4, 7, 1.6], [3.2, 1.6, 7.5, 1.6], [-1.6, 2.4, 5, 1.2], [1.8, 2.6, 5.5, 1.2]]) g.each((x, y) => { const dx = x + 0.5 - (cx + ox), dy = (cy + oy) - (y + 0.5); if (dy < 0 || dy > hgt) return null; const hw = w * (1 - (dy / hgt) ** 2); return Math.abs(dx) < hw ? (dx < -hw * 0.3 ? M.ice[3] : dx > hw * 0.4 ? M.ice[1] : M.ice[2]) : null; }, 4);
    g.each((x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy - 1); return d > 3.5 && d < 4.5 && (x + y) % 2 === 0 ? '#e8f8ff' : null; }, 4);
    return;
  }
  // claws holding an orb
  g.each((x, y) => { const [u, v] = uvf(x + 0.5, y + 0.5); const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); return d > 4.3 && d < 5.8 && u < c + 2 && Math.abs(v) > 1.2 ? shade(M[opts.claws || 'gold'], v / 4) : null; });
  g.each((x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d > 4.3) return null; return (x + 0.5 - cx) + (y + 0.5 - cy) < -3.4 ? '#ffffff' : d > 3.2 ? mix(opts.orb, '#000000', 0.3) : opts.orb; }, 4);
}
function wBow(g, mat, opts = {}) {
  const ramp = M[mat], cx = -12, cy = 16, r = 25, lim = 0.55;
  g.each((x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy), a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx); if (Math.abs(a) > lim) return null; const th = (opts.thick || 2) - Math.abs(a) / lim * 0.9; if (Math.abs(d - r) > th) return null; const base = shade(ramp, -(d - r) / th * 0.8 + (y < cy ? -0.3 : 0.3)); return opts.tex ? TEX[opts.tex](x, y, base, ramp) : base; }, 1);
  const tipX = cx + r * Math.cos(lim), tipY = r * Math.sin(lim);
  for (const s of [-1, 1]) g.each((x, y) => (Math.hypot(x + 0.5 - (tipX + 1.6), y + 0.5 - (cy + s * (tipY + 0.6))) < 1.4 ? (opts.tips ? M[opts.tips][2] : ramp[2]) : null));
  if (opts.fins) for (const s of [-1, 1]) g.each((x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx); return Math.abs(a) < lim && Math.abs(a) > 0.15 && d > r + 1.5 && d < r + 3.6 - Math.abs(a) * 3 && Math.sign(a) === s && (x + y) % 2 === 0 ? M[opts.fins][2] : null; });
  g.each((x, y) => (x + 0.5 > tipX - 0.2 && x + 0.5 < tipX + 0.8 && Math.abs(y + 0.5 - cy) < tipY ? '#ece4d4' : null));
  g.each((x, y) => (Math.abs(y + 0.5 - cy) < 2.6 && Math.abs(Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - r) < 2.3 ? shade(M[opts.grip || 'leather'], (x + 0.5 - cx - r) / 2) : null));
  g.each((x, y) => (Math.abs(y + 0.5 - cy) <= 0.5 && x + 0.5 > tipX && x < 25 ? (opts.arrow || '#c8a070') : null), 1);
  g.each((x, y) => (x >= 25 && x < 31 && Math.abs(y + 0.5 - cy) <= (31 - x) * 0.45 + 0.2 ? (y + 0.5 < cy ? (opts.head ? M[opts.head][3] : M.steel[3]) : (opts.head ? M[opts.head][1] : M.steel[1])) : null), 1);
  g.each((x, y) => (x + 0.5 > tipX + 0.8 && x + 0.5 < tipX + 4.5 && Math.abs(y + 0.5 - cy) > 0.6 && Math.abs(y + 0.5 - cy) < 2.6 - (x + 0.5 - tipX) * 0.35 ? (opts.fletch || '#c84a34') : null));
  if (opts.frost) g.each((x, y) => (Math.abs(Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - r + 2.4) < 0.5 && Math.abs(y + 0.5 - cy) > 4 && y % 3 === 0 ? '#e8f8ff' : null), 4);
  if (opts.gem) gem(g, cx + r - 0.5, cy, 1.4, opts.gem);
}
function wGauntlet(g, rc) {
  const ramp = M[rc.mat];
  g.each((x, y) => { if (y < 6 || y > 28) return null; const hw = y < 16 ? 8 : y < 22 ? 8.6 : 7; if (Math.abs(x + 0.5 - 16) > hw) return null; if (y < 15 && Math.floor(x + 0.5 - 16 + 8) % 3 === 2) return ramp[0]; if (y === 15 || y === 22) return M[rc.trim || 'gold'][2]; return TEX[rc.tex || 'plain'](x, y, shade(ramp, (x + 0.5 - 16) / hw - (y < 15 ? 0.2 : 0)), ramp); }, 1);
  for (const [kx] of [[10], [13], [16], [19]]) g.set(kx, 7, M.gold[3]);
  if (rc.core) g.each((x, y) => { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 18.5); return d < 3 ? (d < 1.3 ? '#ffffff' : rc.core) : null; }, 4);
  if (rc.cracks) g.each((x, y) => (g.get(x, y) && g.tag[y * N + x] === 1 && Math.abs((x * 2 + y * 3) % 13 - 6) < 0.5 && y > 15 ? rc.cracks : null), 4);
}
function drawWeapon(g, rc, it, R) {
  const t = rc.type || it.weaponType;
  const gemCol = R >= 2 && !rc.noGem ? GEM[RAR(R)] : null;
  if (t === 'sword' || t === 'dagger') {
    if (t === 'dagger') { WO.x = 9; WO.y = 23; }
    const L = t === 'dagger' ? 18 : rc.profile === 'great' ? 30.5 : 29.5;
    wGrip(g, 0, t === 'dagger' ? 4.5 : rc.profile === 'great' ? 7 : 6, t === 'dagger' ? 1 : 1.35, rc.grip || 'leather', rc.wrap !== false);
    wBlade(g, t === 'dagger' ? 5.6 : rc.profile === 'great' ? 8.2 : 7.2, L, rc.w || (t === 'dagger' ? 1.7 : 2.5), rc.profile || 'straight', rc.mat, { fuller: rc.fuller, glow: rc.glow, fx: rc.fx, edge: rc.edge, tex: rc.tex });
    wGuard(g, t === 'dagger' ? 5.2 : rc.profile === 'great' ? 7.6 : 6.8, rc.guardW || (t === 'dagger' ? 2.8 : 4.4), rc.guardMat || 'iron', rc.guard || 'cross', rc.guard === 'skull' || rc.guard === 'disc' ? null : gemCol);
    wPommel(g, -1.2, t === 'dagger' ? 1.4 : 1.9, rc.guardMat || 'iron', R >= 4 ? gemCol : null);
    WO.x = 5.5; WO.y = 26.5;
    return;
  }
  if (t === 'axe') { wHaft(g, -2, 26, 1.35, rc.haft || 'wood', rc.bands, rc.haftTex); wAxe(g, 20.5, rc.head || 'single', rc.mat, { runes: rc.runes, lava: rc.lava, edge: rc.edge, gem: gemCol, tex: rc.tex }); return; }
  if (t === 'hammer') { if (rc.head !== 'club') wHaft(g, -2, rc.head === 'sceptre' ? 21 : 24, rc.head === 'sceptre' ? 1.1 : 1.35, rc.haft || 'wood', rc.bands, rc.haftTex); wHammer(g, rc.head === 'sceptre' ? 23 : 22, rc.head || 'block', rc.mat, { runes: rc.runes, cracks: rc.cracks, core: rc.core, tex: rc.tex, bands: rc.headBands, flames: rc.flames, gem: rc.head === 'club' ? null : gemCol }); if (rc.head === 'club') wGrip(g, 0, 8, 1.4, rc.grip || 'leather', true); return; }
  if (t === 'spear') { wHaft(g, -4, 21, 1.1, rc.haft || 'wood', rc.bands, rc.haftTex); wSpear(g, 21, rc.tip || 'leaf', rc.mat); if (rc.tassel) fillUV(g, (u, v) => (u > 16.5 && u < 20 && v > 0.8 && v < 1.6 + (20 - u) * 0.55 ? shade(M[rc.tassel], (u - 18) / 2) : null)); if (rc.fx === 'flames') fillUV(g, (u, v) => (u > 21 && u < 33 && Math.abs(v) > 3 && Math.abs(v) < 6 && (Math.floor(u) + Math.floor(v)) % 2 === 0 && h2(Math.floor(u), Math.floor(v), 38) < 0.5 ? (Math.abs(v) < 4.5 ? '#ff6a1a' : '#ffd27a') : null), 4); return; }
  if (t === 'staff') { wHaft(g, -4, 19, 1.3, rc.haft || 'darkwood', rc.bands); wStaffHead(g, 23.5, rc.head || 'orb', { orb: rc.orb || GEM[RAR(R)] || '#9fd3ff', claws: rc.claws, eyes: rc.eyes }); return; }
  if (t === 'bow') { wBow(g, rc.mat, rc); return; }
  if (t === 'gauntlet') { wGauntlet(g, rc); }
}

// ---------- shields, tomes, lanterns, flasks, drums ----------
function drawOff2(g, rc, it, R) {
  const k = rc.kind;
  if (k === 'shield') {
    const shape = rc.shape;
    const rows = shape === 'round' ? (y) => { const d = 13 ** 2 - (y + 0.5 - 16) ** 2; return d < 0 ? null : Math.sqrt(d); }
      : shape === 'coffin' ? (y) => (y < 2 || y > 30 ? null : y < 9 ? 6 + (y - 2) * 0.85 : 12 - (y - 9) * 0.3)
      : shape === 'plank' ? (y) => (y < 3 || y > 29 ? null : 9.5 - (y % 7 === 0 ? 1.2 : 0) - (y > 26 && h2(y, 1, 40) < 0.5 ? 2 : 0))
      : shape === 'tower' ? (y) => (y < 2 || y > 30 ? null : y < 4 ? 8 + (y - 2) * 1.5 : y > 26 ? 11 - (y - 26) * 1.5 : 11)
      : shape === 'kite' ? (y) => (y < 2 || y > 30 ? null : y < 10 ? 7 + (y - 2) * 0.7 : 12.6 * (1 - (y - 10) / 21))
      : (y) => (y < 3 || y > 29 ? null : y < 13 ? 12 : 12 * Math.sqrt(Math.max(0, 1 - ((y - 13) / 17) ** 2)));
    const mask = (x, y) => { const r = rows(y); return r != null && Math.abs(x + 0.5 - 16) <= r ? r : 0; };
    paintMask(g, mask, M[rc.mat], rc.tex, { lightTop: 8 });
    if (rc.boards) g.each((x, y) => (mask(x, y) && Math.floor(x + 0.5) % 5 === 1 ? M[rc.mat][0] : null));
    if (rc.cross) { g.each((x, y) => (mask(x, y) && ((Math.abs(x + 0.5 - 16) < 1 && y > 6 && y < 26) || (Math.abs(y + 0.5 - 12) < 1 && Math.abs(x + 0.5 - 16) < 5)) ? rc.cross : null), 2); }
    // rim
    if (rc.rim) g.each((x, y) => { const r = rows(y); if (r == null) return null; const dx = Math.abs(x + 0.5 - 16); if (dx > r) return null; const top = shape === 'round' ? null : rows(y - 1) == null; return r - dx < 1.3 || top || rows(y + 1) == null ? shade(M[rc.rim], (x - 16) / 12) : null; });
    if (rc.boss) g.each((x, y) => { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 15); return d < 3.4 ? (d > 2.6 ? M[rc.boss][0] : shade(M[rc.boss], ((x + 0.5 - 16) + (y + 0.5 - 15)) / 3)) : null; });
    if (rc.rivets) for (const [x, y] of [[8, 7], [23, 7], [8, 24], [23, 24], [16, 4], [16, 27]]) if (mask(x, y)) { g.set(x, y, M.iron[3]); g.set(x, y + 1, M.iron[0]); }
    if (rc.emblem === 'skull') { const ey = 14; g.each((x, y) => { const dx = x + 0.5 - 16, dy = y + 0.5 - ey; if (Math.hypot(dx, dy * 1.1) < 4 && dy < 2) return Math.hypot(Math.abs(dx) - 1.6, dy + 0.4) < 1 ? (rc.eyes || '#0a0808') : shade(M.bone, dx / 4); if (dy >= 2 && dy < 4 && Math.abs(dx) < 2.4) return x % 2 ? M.bone[1] : '#0a0808'; return null; }, 2); }
    if (rc.emblem === 'snowflake') for (let a = 0; a < 6; a++) for (let r = 0; r < 6; r += 0.5) { const ang = a * Math.PI / 3; g.set(Math.round(16 + Math.cos(ang) * r - 0.5), Math.round(15 + Math.sin(ang) * r - 0.5), r > 4 ? '#ffffff' : '#e8f8ff', 2); }
    if (rc.emblem === 'ember') g.each((x, y) => { const dx = x + 0.5 - 16, dy = y + 0.5 - 16; const r = 4.5 - Math.max(0, -dy) * 0.4; return Math.abs(dx) < r * (1 - Math.max(0, -dy) / 8) && dy > -7 && dy < 4 ? (Math.abs(dx) < r * 0.4 && dy > -3 ? '#ffd27a' : '#ff6a1a') : null; }, 4);
    if (rc.emblem === 'rune') g.each((x, y) => (mask(x, y) && ((Math.abs(x + 0.5 - 16) < 0.7 && y > 8 && y < 24) || Math.abs(Math.abs(x + 0.5 - 16) - (y - 8) * 0.5) < 0.6 && y > 8 && y < 18) ? rc.glow : null), 4);
    if (rc.cracks) g.each((x, y) => (mask(x, y) && g.tag[y * N + x] === 1 && Math.abs((x * 2 + y * 3) % 15 - 7) < 0.5 ? rc.cracks : null), 4);
    if (rc.spikes) { for (const [x, y, dx, dy] of [[4, 4, -1, -1], [27, 4, 1, -1], [3, 15, -1, 0], [28, 15, 1, 0], [16, 1, 0, -1]]) for (let s = 0; s < 3; s++) g.set(x + dx * s, y + dy * s, s ? M[rc.spikes][3] : M[rc.spikes][2]); }
    if (rc.frost) g.each((x, y) => (mask(x, y) && rows(y - 2) == null && x % 2 ? '#e8f8ff' : null));
    if (rc.scorch) g.each((x, y) => (mask(x, y) && h2(x, y, 41) < 0.25 ? '#140c08' : mask(x, y) && h2(x, y, 42) < 0.05 ? '#ff7a2a' : null));
    if (GEM[RAR(R)] && R >= 2 && !rc.noGem) gem(g, 16, shape === 'round' ? 15 : 13, 1.8, GEM[RAR(R)]);
    return;
  }
  if (k === 'tome') {
    const cover = M[rc.mat];
    g.each((x, y) => (x >= 7 && x <= 25 && y >= 4 && y <= 28 ? (x >= 24 ? (rc.pages || '#f0e6cc') : x <= 8 ? cover[0] : TEX[rc.tex || 'leather'](x, y, shade(cover, (x - 16) / 9 + (y - 16) / 30), cover)) : null), 1);
    g.each((x, y) => (x >= 24 && x <= 25 && y >= 5 && y <= 27 && y % 2 ? '#c8bca0' : null));
    for (const [cx, cy] of [[9.5, 5.5], [23.5, 5.5], [9.5, 27.5], [23.5, 27.5]]) g.each((x, y) => (Math.abs(x + 0.5 - cx) < 1.6 && Math.abs(y + 0.5 - cy) < 1.6 ? M[rc.corners || 'gold'][2] : null));
    if (rc.emblem === 'cross') g.each((x, y) => ((Math.abs(x + 0.5 - 16.5) < 1 && y > 9 && y < 23) || (Math.abs(y + 0.5 - 14) < 1 && Math.abs(x + 0.5 - 16.5) < 5) ? (Math.abs(x + 0.5 - 16.5) < 0.4 || Math.abs(y + 0.5 - 14) < 0.4 ? '#fff4b0' : M.gold[2]) : null), 4);
    if (rc.emblem === 'runes') g.each((x, y) => { const d = Math.hypot(x + 0.5 - 16.5, y + 0.5 - 16); return (d < 5 && d > 4) || (d < 4 && ((x + y) % 4 === 0)) ? rc.glow : null; }, 4);
    if (rc.emblem === 'fire') g.each((x, y) => { const dx = x + 0.5 - 16.5, dy = y + 0.5 - 18; const r = 4 - Math.max(0, -dy) * 0.35; return Math.abs(dx) < r * (1 - Math.max(0, -dy) / 9) && dy > -8 && dy < 3 ? (Math.abs(dx) < r * 0.4 ? '#ffd27a' : '#ff4a1a') : null; }, 4);
    if (rc.emblem === 'eye') { g.each((x, y) => { const d = Math.hypot((x + 0.5 - 16.5) / 4.5, (y + 0.5 - 16) / 2.6); return d < 1 ? (d < 0.4 ? '#0a0808' : d < 0.6 ? rc.glow : '#f0e8d4') : null; }, 4); }
    if (rc.strap) g.each((x, y) => (y >= 15 && y <= 17 && x >= 20 && x <= 26 ? shade(M[rc.strap], (y - 16) / 2) : null));
    return;
  }
  if (k === 'lantern') {
    const fr = M[rc.mat], flame = rc.flame || '#ffd27a';
    g.each((x, y) => (Math.abs(x + 0.5 - 16) < 3 && y >= 2 && y <= 4 && !(Math.abs(x + 0.5 - 16) < 1.5 && y === 3) ? fr[2] : null));
    g.each((x, y) => (Math.abs(x + 0.5 - 16) <= 6.5 && y >= 5 && y <= 7 ? shade(fr, (x - 16) / 6) : null), 1);
    g.each((x, y) => (Math.abs(x + 0.5 - 16) <= 5.5 && y >= 8 && y <= 22 ? (Math.abs(x + 0.5 - 16) > 4.5 || y === 15 ? shade(fr, (x - 16) / 5) : mix(flame, '#000000', 0.15 + Math.abs(x + 0.5 - 16) * 0.09)) : null), 4);
    if (rc.candle) g.each((x, y) => (Math.abs(x + 0.5 - 16) < 1.4 && y >= 16 && y <= 21 ? (x === 15 ? '#fff4e0' : '#e8d8b8') : null), 2);
    g.each((x, y) => { const fy = (rc.candle ? 14 : 16) - y, w = 1.8 - Math.abs(fy - 1) * 0.4; return fy >= -2 && fy <= 4 && Math.abs(x + 0.5 - 16) < w ? (Math.abs(x + 0.5 - 16) < w * 0.5 ? '#ffffff' : rc.flameCore || '#ffe680') : null; }, 4);
    g.each((x, y) => (Math.abs(x + 0.5 - 16) <= 6.5 && y >= 23 && y <= 25 ? shade(fr, (x - 16) / 6) : null), 1);
    if (rc.frost) g.each((x, y) => (g.get(x, y) && (y === 5 || y === 23) && x % 2 ? '#e8f8ff' : null));
    if (rc.cobweb) for (let i = 0; i < 5; i++) g.set(10 + i, 8 + i, '#c8c8c8');
    return;
  }
  if (k === 'flask') {
    const liq = rc.liquid || '#7ae0ff';
    g.each((x, y) => (Math.abs(x + 0.5 - 16) < 2.2 && y >= 2 && y <= 4 ? M[rc.cap || 'gold'][2] : null));
    g.each((x, y) => (Math.abs(x + 0.5 - 16) < 2.2 && y >= 5 && y <= 10 ? '#d8e8f0' : null), 1);
    g.each((x, y) => { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 19); if (d > 9) return null; if (d > 8) return '#d8e8f0'; return y < 14 ? mix('#d8e8f0', '#203040', 0.5) : (x + 0.5 - 16) + (y + 0.5 - 19) < -6 ? '#ffffff' : mix(liq, '#000000', Math.max(0, (d - 4) / 12)); }, 4);
    if (rc.cross) g.each((x, y) => ((Math.abs(x + 0.5 - 16) < 0.8 && y >= 16 && y <= 24) || (Math.abs(y + 0.5 - 19) < 0.8 && Math.abs(x + 0.5 - 16) < 3) ? '#fff4b0' : null), 4);
    g.each((x, y) => (Math.hypot(x + 0.5 - 13, y + 0.5 - 22) < 1 || Math.hypot(x + 0.5 - 19, y + 0.5 - 25) < 0.8 ? mix(liq, '#ffffff', 0.6) : null), 4);
    return;
  }
  if (k === 'drum') {   // goblin war drum: hide top, wooden body, rope lacing, bone beater
    g.each((x, y) => { const dx = Math.abs(x + 0.5 - 16); return y >= 9 && y <= 27 && dx < 11 - (y > 24 ? (y - 24) * 0.8 : 0) ? TEX.rough(x, y, shade(M.wood, (x - 16) / 11), M.wood) : null; }, 1);
    g.each((x, y) => { const d = Math.hypot((x + 0.5 - 16) / 11, (y + 0.5 - 9) / 3.4); return d < 1 ? (d > 0.85 ? M.rust[1] : shade(M.bone, (x - 16) / 14 - 0.3)) : null; }, 1);
    g.each((x, y) => (y >= 12 && y <= 25 && Math.abs(x + 0.5 - 16) < 10.5 && Math.abs(((x + 0.5 - 16) + (y % 6 < 3 ? y % 6 : 6 - y % 6) * 1.2) % 4.2) < 0.6 ? M.burlap[2] : null));
    for (const sx of [-1, 1]) g.each((x, y) => (y >= 15 && y <= 19 && Math.abs(x + 0.5 - 16 - sx * 6) < 2 ? (Math.abs(x + 0.5 - 16 - sx * 6) < 0.8 ? '#0a0808' : M.gobcloth[2]) : null), 2);   // painted goblin eyes
    g.each((x, y) => (Math.abs((x + 0.5) - (y + 0.5) * -0.9 - 26) < 0.9 && y >= 1 && y <= 9 ? M.bone[2] : null));
    g.each((x, y) => (Math.hypot(x + 0.5 - 25, y + 0.5 - 1.5) < 1.6 ? M.bone[3] : null));
    if (GEM[RAR(R)] && R >= 2) gem(g, 16, 21, 1.4, GEM[RAR(R)]);
  }
}

Object.assign(RECIPES, {
  // ---- weapons ----
  'Rusty Sword': { profile: 'straight', mat: 'rust', fx: 'rust', guard: 'cross', guardMat: 'rust', grip: 'leather' },
  'Rusty Dagger': { type: 'dagger', profile: 'broken', mat: 'rust', fx: 'rust', guard: 'cross', guardMat: 'rust', grip: 'rag' },
  'Iron Shortsword': { profile: 'straight', w: 2.2, mat: 'iron', fuller: 'groove', guard: 'cross', guardMat: 'iron', grip: 'leather' },
  'Goblin Cleaver': { head: 'cleaver', mat: 'rust', tex: 'rough', haft: 'wood', bands: 'rust' },
  'Goblin Bane Axe': { head: 'crescent', mat: 'steel', runes: '#6ab03a', haft: 'darkwood', bands: 'iron' },
  'Warg-Fang Spear': { tip: 'fang', mat: 'fang', haft: 'wood', bands: 'leather', tassel: 'wolf' },
  "Goblin King's Sceptre": { head: 'sceptre', mat: 'gold', haft: 'gold', flames: true, gem: true },
  'Bone Club': { head: 'club', mat: 'bone', tex: 'rough', grip: 'rag' },
  'Silver Mace': { head: 'mace', mat: 'silver', haft: 'darkwood', bands: 'silver' },
  'Blessed Longsword': { profile: 'straight', w: 2.5, mat: 'silver', fuller: 'glow', glow: '#fff4b0', fx: 'holy', guard: 'wing', guardMat: 'gold', grip: 'holy' },
  'Spectral Blade': { profile: 'curved', w: 2.4, mat: 'spectral', fuller: 'glow', glow: '#e8ffff', fx: 'ghost', guard: 'skull', guardMat: 'bone', grip: 'mourn' },
  'Deathwhisper Staff': { head: 'skull', haft: 'dread', bands: 'bone', orb: '#7ae0ff', eyes: '#b8f0ff' },
  "Miner's Pickaxe": { head: 'pick', mat: 'iron', haft: 'wood', bands: 'rust' },
  'Granite Warhammer': { head: 'block', mat: 'granite', tex: 'stoneblock', haft: 'wood', bands: 'iron' },
  'Runed Battleaxe': { head: 'double', mat: 'steel', runes: '#4ad0ff', haft: 'darkwood', bands: 'dwarf' },
  'Golembreaker': { head: 'spiked', mat: 'steel', runes: '#ff8a2e', haft: 'darkwood', bands: 'iron', headBands: 'dwarf' },
  'Earthshaker Maul': { head: 'maul', mat: 'granite', tex: 'stoneblock', cracks: '#ffb02e', haft: 'darkwood', bands: 'dwarf', headBands: 'dwarf' },
  'Mountainheart Hammer': { head: 'maul', mat: 'dwarf', core: '#4ad0ff', runes: '#4ad0ff', haft: 'darkwood', bands: 'gold', headBands: 'gold' },
  "Runesmith's Maul": { head: 'block', mat: 'deep', runes: '#7ae0ff', haft: 'darkwood', bands: 'gold', headBands: 'gold' },
  "Titan's Fist": { type: 'gauntlet', mat: 'stone', tex: 'stoneblock', trim: 'gold', core: '#ffb02e', cracks: '#ff8a2e' },
  'Ice Pick': { type: 'dagger', profile: 'rapier', w: 1.4, mat: 'steel', guard: 'cross', guardMat: 'iron', grip: 'fur', fx: 'frost' },
  'Frostbite Spear': { tip: 'icicle', mat: 'ice', haft: 'wood', bands: 'iron', haftTex: 'fur' },
  'Glacier Bow': { mat: 'ice', tex: 'crystal', tips: 'ice', grip: 'quilt', head: 'ice', fletch: '#e8f8ff', frost: true },
  "Huntsman's Spear": { tip: 'barbed', mat: 'steel', haft: 'wood', bands: 'leather', tassel: 'fur' },
  'Frostbrand Longsword': { profile: 'broad', w: 2.5, mat: 'ice', fuller: 'glow', glow: '#ffffff', fx: 'frost', guard: 'curved', guardMat: 'steel', grip: 'quilt' },
  'Wyrmfang Bow': { mat: 'fang', thick: 2.4, tips: 'rime', fins: 'rime', grip: 'leather', head: 'ice', fletch: '#7ae0ff', frost: true, gem: '#7ae0ff' },
  'Blizzard Staff': { head: 'crystal', haft: 'silver', bands: 'ice' },
  'Charred Blade': { profile: 'broken', mat: 'cinder', fx: 'embers', guard: 'cross', guardMat: 'cinder', grip: 'darkleather' },
  'Hellforged Axe': { head: 'crescent', mat: 'hellsteel', lava: true, edge: '#ff8a2e', haft: 'dread', bands: 'cinder' },
  'Soulfire Dagger': { type: 'dagger', profile: 'kris', w: 2.2, mat: 'dread', edge: '#b48cff', fx: 'soul', guard: 'horns', guardMat: 'bone', grip: 'demonhide' },
  'Infernal Greatsword': { profile: 'flame', w: 2.7, mat: 'hellsteel', fuller: 'lava', fx: 'flames', guard: 'horns', guardMat: 'dread', grip: 'demonhide', edge: '#ff8a2e' },
  "Demon Lord's Trident": { tip: 'trident', mat: 'dread', haft: 'dread', bands: 'demonhide', fx: 'flames' },
  'Demonbane Blade': { profile: 'broad', w: 2.6, mat: 'holy', fuller: 'glow', glow: '#ffffff', fx: 'holy', guard: 'wing', guardMat: 'gold', grip: 'holy', edge: '#ffffff' },
  'Ashbringer': { profile: 'great', w: 2.6, mat: 'silver', fuller: 'runes', glow: '#ffd84a', fx: 'holy', guard: 'disc', guardMat: 'gold', grip: 'holy', edge: '#fff4b0' },
  // ---- off-hands ----
  'Splintered Plank': { kind: 'shield', shape: 'plank', mat: 'wood', tex: 'rough', boards: true, rivets: true },
  'Wooden Buckler': { kind: 'shield', shape: 'round', mat: 'wood', tex: 'leather', boards: true, rim: 'iron', boss: 'iron' },
  'Goblin War Drum': { kind: 'drum' },
  "Warlord's Shield": { kind: 'shield', shape: 'heater', mat: 'goblin', tex: 'rough', rim: 'rust', spikes: 'rust', emblem: 'skull', eyes: '#6ab03a' },
  'Coffin Lid': { kind: 'shield', shape: 'coffin', mat: 'darkwood', tex: 'leather', boards: true, cross: '#c8c0b0', rivets: true },
  'Candle Lantern': { kind: 'lantern', mat: 'rust', candle: true, cobweb: true },
  'Holy Water Flask': { kind: 'flask', liquid: '#9fd8ff', cap: 'gold', cross: true },
  'Tome of Rites': { kind: 'tome', mat: 'linen', tex: 'weave', emblem: 'cross', corners: 'gold' },
  'Slate Buckler': { kind: 'shield', shape: 'round', mat: 'slate', tex: 'stoneblock', rim: 'iron', boss: 'granite' },
  'Tower Shield': { kind: 'shield', shape: 'tower', mat: 'iron', tex: 'plates', rim: 'steel', rivets: true },
  'Runestone Tome': { kind: 'tome', mat: 'granite', tex: 'stoneblock', emblem: 'runes', glow: '#4ad0ff', corners: 'iron', pages: '#d8d0c0' },
  'Obsidian Bulwark': { kind: 'shield', shape: 'tower', mat: 'obsidian', tex: 'gloss', rim: 'gold', emblem: 'rune', glow: '#b48cff' },
  'Iceblock Buckler': { kind: 'shield', shape: 'round', mat: 'ice', tex: 'crystal', rim: 'rime' },
  'Ice Shield': { kind: 'shield', shape: 'heater', mat: 'rime', tex: 'crystal', rim: 'iron', frost: true },
  'Frost Lantern': { kind: 'lantern', mat: 'steel', flame: '#7ae0ff', flameCore: '#c8f0ff', frost: true },
  'Rimeguard Shield': { kind: 'shield', shape: 'kite', mat: 'rime', tex: 'crystal', rim: 'steel', emblem: 'snowflake', frost: true },
  'Scorched Buckler': { kind: 'shield', shape: 'round', mat: 'wood', tex: 'rough', boards: true, rim: 'cinder', boss: 'cinder', scorch: true },
  'Ember Ward': { kind: 'shield', shape: 'heater', mat: 'cinder', tex: 'ember', rim: 'brim', emblem: 'ember' },
  'Infernal Tome': { kind: 'tome', mat: 'demonhide', tex: 'hide', emblem: 'eye', glow: '#ff4a2a', corners: 'dread', strap: 'dread' },
  'Dread Aegis': { kind: 'shield', shape: 'kite', mat: 'dread', tex: 'gloss', rim: 'demonhide', spikes: 'dread', emblem: 'skull', eyes: '#ff3a3a', cracks: '#ff3a3a' },
});

// Build an item: themed recipe if there is one, otherwise the current art.
export function buildGear2(it) {
  const rc = RECIPES[it.name];
  if (!rc) return buildGear(it);
  const R = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'].indexOf(it.rarity);
  const g = new Px();
  if (rc.shape === 'crown') drawCrown(g, rc, it, R);
  else if (it.slot === 'helmet') drawHelm(g, rc, it, R);
  else if (it.slot === 'legs') drawLegs(g, rc, it, R);
  else if (it.slot === 'boots') drawBoots(g, rc, it, R);
  else if (it.slot === 'weapon') drawWeapon(g, rc, it, R);
  else if (it.slot === 'offhand') (rc.kind ? drawOff2 : drawOff)(g, rc, it, R);
  else drawChest(g, rc, it, R);
  const AURA = { legendary: '#ffb02e', mythic: '#ff4a6a', divine: '#fff1a8' };
  g.outline(R >= 4 ? mix('#05040a', AURA[it.rarity], 0.25) : '#07060c');
  return { g, R, aura: AURA[it.rarity] || null };
}
const cache = new Map();
export function gearArtIcon2(it, scale = 3) {
  const key = `${it.id || it.name}|${scale}`;
  if (cache.has(key)) return cache.get(key);
  const { g, aura } = buildGear2(it);
  const pad = 4 * scale;
  const cv = document.createElement('canvas'); cv.width = cv.height = N * scale + pad * 2;
  const ctx = cv.getContext('2d'); ctx.translate(pad, pad);
  const draw = (c) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const col = g.c[y * N + x]; if (col) { c.fillStyle = col; c.fillRect(x * scale, y * scale, scale, scale); } } };
  if (aura) { const off = document.createElement('canvas'); off.width = off.height = N * scale; draw(off.getContext('2d')); ctx.shadowColor = aura; ctx.shadowBlur = 5 * scale; ctx.drawImage(off, 0, 0); ctx.shadowBlur = 0; }
  draw(ctx);
  const url = cv.toDataURL(); cache.set(key, url); return url;
}

export { M, TEX };
setGearBuilder(buildGear2);   // every gear icon in the game now uses the themed art
