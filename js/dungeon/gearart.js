// Detailed 32x32 Dungeon gear art.
// Each item is built from shaded parts (blade, grip, guard, head...) instead of one flat symbol:
//   section  -> materials (goblin iron + rope, crypt bone + soulfire, runed stone, ice, obsidian + lava)
//   rarity   -> gems, gold trim, glow, shimmer, sparkles, halo
//   name     -> small shape variations so two swords never look identical
import { DITEMS } from './ddata.js';

const N = 32;
const RAR = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'];
const GEM = { rare: '#4a90e2', epic: '#b06af0', legendary: '#ffb02e', mythic: '#ff4a6a', divine: '#fff4b0' };
const AURA = { legendary: '#ffb02e', mythic: '#ff4a6a', divine: '#fff1a8' };
const TRIM = ['#7a5a12', '#c8962a', '#ffd84a', '#fff4b0'];      // gold ramp dark -> highlight

// Materials per section: metal ramp (dark -> highlight), grip ramp, accent, special
export const MAT = {
  0: { metal: ['#3a3430', '#6a625a', '#948a7e', '#c0b6a6'], grip: ['#2a1a10', '#5a3a1e', '#7a5430'], wood: ['#3a2414', '#6a4426', '#8a5c34'], accent: '#7a5a3a', fx: 'rust' },
  1: { metal: ['#363a44', '#666c7a', '#9ca2b0', '#dfe3ec'], grip: ['#3a2414', '#6a4426', '#9a6c40'], wood: ['#3a2414', '#6a4426', '#8a5c34'], accent: '#6ab03a', fx: 'notch' },
  2: { metal: ['#463f54', '#868096', '#c6c0d2', '#f6f2ff'], grip: ['#1e1828', '#36304a', '#504868'], wood: ['#2a2434', '#4a4258', '#6a6080'], accent: '#9a6ae0', glow: '#b48cff', fx: 'soul' },
  3: { metal: ['#222228', '#46464e', '#76767f', '#b2b2bc'], grip: ['#2e241a', '#5a4a3a', '#7a6650'], wood: ['#2e241a', '#5a4a3a', '#7a6650'], accent: '#e07a2a', glow: '#4ad0ff', fx: 'rune' },
  4: { metal: ['#1c4472', '#4682bc', '#9cd0fc', '#f0faff'], grip: ['#2e2016', '#6a4c30', '#8e6c48'], wood: ['#3a2a1a', '#7a5a3a', '#9a7a54'], accent: '#e8f0ff', glow: '#7ae0ff', fx: 'ice' },
  5: { metal: ['#100a0c', '#26141a', '#44262c', '#764446'], grip: ['#160c0c', '#2a1818', '#422828'], wood: ['#160c0c', '#2a1818', '#422828'], accent: '#ff8a2e', glow: '#ff7a2a', fx: 'lava' },
};
const HOLY_METAL = ['#7a5a20', '#c09a48', '#f0e2b0', '#ffffff'];
const FROST_METAL = ['#2a5a8a', '#5a9ad0', '#b0e0ff', '#ffffff'];

function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
function rngFrom(seed) { let a = seed; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

class Px {
  constructor() { this.c = new Array(N * N).fill(null); this.tag = new Array(N * N).fill(0); }
  set(x, y, col, tag = 0) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= N || y >= N || !col) return; this.c[y * N + x] = col; this.tag[y * N + x] = tag; }
  get(x, y) { return x < 0 || y < 0 || x >= N || y >= N ? null : this.c[y * N + x]; }
  // Paint every pixel whose centre satisfies fn(px, py) -> colour|null
  fill(fn, tag = 0) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const col = fn(x + 0.5, y + 0.5); if (col) this.set(x, y, col, tag); } }
  outline(col) {
    const add = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x + 1, y) || this.get(x - 1, y) || this.get(x, y + 1) || this.get(x, y - 1)) add.push([x, y]);
    }
    for (const [x, y] of add) this.set(x, y, col, 9);
  }
}

// Diagonal frame: handle bottom-left -> tip top-right. u = along the weapon, v = across (+v = lower-right, in shadow).
const O = { x: 5.5, y: 26.5 }, D = { x: Math.SQRT1_2, y: -Math.SQRT1_2 };
const uv = (px, py, o = O) => { const dx = px - o.x, dy = py - o.y; return [dx * D.x + dy * D.y, dx * -D.y + dy * D.x]; };
// Light from the top-left: pick a ramp step from the across-position t in [-1, 1]
const shade = (ramp, t) => (t < -0.55 ? ramp[3] ?? ramp[2] : t < -0.1 ? ramp[2] : t < 0.5 ? ramp[1] : ramp[0]);

function gemAt(g, cx, cy, r, col) {
  g.fill((x, y) => { const d = Math.hypot(x - cx, y - cy); if (d > r) return null; return (x - cx) + (y - cy) < -r * 0.5 ? mix(col, '#ffffff', 0.6) : d > r * 0.6 ? mix(col, '#000000', 0.35) : col; }, 2);
}

// ---------- weapons ----------
function grip(g, m, u0, u1, r, R) {
  g.fill((x, y) => { const [u, v] = uv(x, y); if (u < u0 || u > u1 || Math.abs(v) > r) return null;
    const wrap = m.fx === 'notch' || m.fx === 'rust' ? Math.floor(u * 1.2) % 2 === 0 : false;   // rope wrap on crude gear
    return wrap ? mix(shade(m.grip, v / r), '#000000', 0.25) : shade(m.grip, v / r); });
  // pommel
  const [px, py] = [O.x + D.x * (u0 - 1.2), O.y + D.y * (u0 - 1.2)];
  const pm = R >= 3 ? TRIM : m.metal;
  g.fill((x, y) => { const d = Math.hypot(x - px, y - py); return d <= 1.9 ? shade(pm, ((x - px) + (y - py)) / 2.4) : null; });
  if (GEM[RAR[R]] && R >= 4) gemAt(g, px, py, 1.2, GEM[RAR[R]]);
}
function guard(g, m, u, half, R, curve, thick = 1.3) {
  const ramp = R >= 3 ? TRIM : m.metal;
  g.fill((x, y) => { const [uu, v] = uv(x, y); const c = u + curve * (v / half) ** 2; if (Math.abs(uu - c) > thick || Math.abs(v) > half) return null; return shade(ramp, (uu - c) / thick * -1); });
  if (GEM[RAR[R]] && R >= 2) gemAt(g, O.x + D.x * u, O.y + D.y * u, 1.5, GEM[RAR[R]]);
}
function blade(g, m, R, u0, u1, w, tip, opts = {}) {
  const ramp = opts.ramp || m.metal;
  g.fill((x, y) => {
    const [u, v] = uv(x, y);
    if (u < u0 || u > u1) return null;
    const hw = u > u1 - tip ? w * (u1 - u) / tip : w;
    if (Math.abs(v) > hw) return null;
    const t = v / Math.max(hw, 0.8);
    // fuller / rune channel down the middle
    if (u < u1 - tip - 1 && u > u0 + 1.5 && Math.abs(v) < 0.55 && w >= 1.9) {
      if (m.fx === 'rune' && R >= 2) return Math.floor(u) % 3 === 0 ? m.glow : ramp[0];
      if (m.fx === 'lava') return Math.floor(u * 0.7) % 2 ? '#ff6a1a' : '#ffb347';
      if (m.fx === 'soul' && R >= 3) return m.glow;
      return ramp[1];
    }
    if (t < -0.78) return ramp[3];   // bright cutting edge
    return shade(ramp, t);
  }, 1);
  // section flavour on the blade
  if (m.fx === 'ice') g.fill((x, y) => { const [u, v] = uv(x, y); return u > u0 + 2 && u < u1 - 2 && Math.abs(v + w + 0.6) < 0.6 && Math.floor(u) % 4 === 0 ? '#e8f8ff' : null; });
  if (m.fx === 'lava') g.fill((x, y) => { const [u, v] = uv(x, y); return u > u0 && u < u1 - tip && v > w - 1 && v <= w && Math.floor(u * 1.3) % 3 === 0 ? '#ff5a1a' : null; }, 3);
}

function sword(g, it, m, R, rnd) {
  const w = 2.3 + rnd() * 0.9 + (R >= 4 ? 0.4 : 0);
  grip(g, m, 0, 6, 1.35, R);
  blade(g, m, R, 7.2, 29.5, w, 4 + rnd() * 2, { ramp: it._ramp });
  guard(g, m, 6.8, 3.6 + rnd() * 1.8 + (R >= 3 ? 1 : 0), R, R >= 3 ? -1.2 : rnd() < 0.5 ? 0 : 0.8);
}
function dagger(g, it, m, R, rnd) {
  const o = { x: 9, y: 23 };
  const save = O.x; O.x = o.x; O.y = o.y;
  grip(g, m, 0, 4.5, 1, R);
  blade(g, m, R, 5.6, 18 + rnd() * 2, 1.6 + rnd() * 0.5, 4, { ramp: it._ramp });
  guard(g, m, 5.2, 2.8 + rnd(), R, 0.6, 1.1);
  O.x = save; O.y = 26.5;
}
function haft(g, m, u0, u1, r = 1.35) {
  g.fill((x, y) => { const [u, v] = uv(x, y); return u >= u0 && u <= u1 && Math.abs(v) <= r ? shade(m.wood, v / r) : null; });
  // metal bands
  for (const ub of [u0 + 1, u1 - 2]) g.fill((x, y) => { const [u, v] = uv(x, y); return Math.abs(u - ub) < 0.6 && Math.abs(v) <= r + 0.3 ? shade(m.metal, v / r) : null; });
}
function axe(g, it, m, R, rnd) {
  haft(g, m, -2, 26);
  const c = 20 + rnd(), flare = 0.55 + rnd() * 0.2, reach = 9.5 + rnd() * 1.5;
  const ramp = it._ramp || m.metal;
  g.fill((x, y) => {
    const [u, v] = uv(x, y);
    const edge = reach - ((u - c) ** 2) / 10;
    if (v < -1.6 || v > edge || Math.abs(u - c) > 2.6 + flare * Math.max(0, v)) return null;
    if (v > edge - 1.1) return ramp[3];                       // honed edge
    if (m.fx === 'lava' && Math.abs(v - edge / 2) < 0.5) return '#ff6a1a';
    if (m.fx === 'rune' && R >= 2 && Math.abs(u - c) < 0.5 && v > 1 && v < edge - 2) return m.glow;
    return shade(ramp, (u - c) / 3 - 0.3);
  }, 1);
  // back spike on better axes
  if (R >= 2) g.fill((x, y) => { const [u, v] = uv(x, y); return v < -1 && v > -4.5 && Math.abs(u - c) < 1.2 - (-v - 1) * 0.3 ? shade(ramp, (u - c)) : null; });
  if (GEM[RAR[R]] && R >= 2) gemAt(g, O.x + D.x * c, O.y + D.y * c, 1.3, GEM[RAR[R]]);
}
function hammer(g, it, m, R, rnd) {
  haft(g, m, -2, 24);
  const c = 22, hl = 4.2 + rnd(), hw = 6.2 + rnd() * 1.5;
  const ramp = it._ramp || m.metal;
  g.fill((x, y) => {
    const [u, v] = uv(x, y);
    if (Math.abs(u - c) > hl || Math.abs(v) > hw) return null;
    const bevel = Math.abs(u - c) > hl - 0.9 || Math.abs(v) > hw - 0.9;
    if (m.fx === 'rune' && R >= 2 && Math.abs(u - c) < 0.6 && Math.abs(v) < hw - 1.5) return m.glow;
    if (m.fx === 'lava' && !bevel && (Math.floor(v + u) % 3 === 0)) return '#ff6a1a';
    return bevel ? (u - c > 0 || v < 0 ? ramp[3] : ramp[0]) : shade(ramp, (v / hw) * 0.6 - (u - c) / hl * 0.4);
  }, 1);
  if (R >= 3) for (const s of [-1, 1]) g.fill((x, y) => { const [u, v] = uv(x, y); return Math.abs(u - c) < 1 && Math.abs(v - s * (hw - 0.4)) < 0.6 ? TRIM[2] : null; });
  if (GEM[RAR[R]] && R >= 2) gemAt(g, O.x + D.x * c, O.y + D.y * c, 1.4, GEM[RAR[R]]);
}
function spear(g, it, m, R, rnd) {
  haft(g, m, -4, 21, 1.1);
  const ramp = it._ramp || m.metal;
  const L = 9 + rnd() * 2, W = 3 + rnd() * 0.7;
  g.fill((x, y) => { const [u, v] = uv(x, y); if (u < 21 || u > 21 + L) return null; const hw = W * Math.sin(Math.PI * (u - 21) / L) ** 0.8; if (Math.abs(v) > hw) return null; return Math.abs(v) < 0.4 ? ramp[1] : shade(ramp, v / hw); }, 1);
  g.fill((x, y) => { const [u, v] = uv(x, y); return Math.abs(u - 20.6) < 0.7 && Math.abs(v) < 1.6 ? (R >= 3 ? TRIM[2] : m.accent) : null; });
  if (R >= 2) g.fill((x, y) => { const [u, v] = uv(x, y); return u > 17 && u < 20 && v > 0.8 && v < 1.6 + (20 - u) * 0.5 ? m.accent : null; });  // tassel
}
function staff(g, it, m, R, rnd) {
  haft(g, m, -4, 19, 1.3);
  const cu = 23.5, cx = O.x + D.x * cu, cy = O.y + D.y * cu;
  const glow = m.glow || GEM[RAR[R]] || '#9fd3ff';
  // claws holding the orb
  g.fill((x, y) => { const [u, v] = uv(x, y); const d = Math.hypot(x - cx, y - cy); return d > 4.3 && d < 5.8 && u < cu + 2 && Math.abs(v) > 1.2 ? shade(R >= 3 ? TRIM : m.metal, v / 4) : null; });
  g.fill((x, y) => { const d = Math.hypot(x - cx, y - cy); if (d > 4.3) return null; return (x - cx) + (y - cy) < -3.4 ? '#ffffff' : d > 3.2 ? mix(glow, '#000000', 0.3) : glow; }, 4);
}
function bow(g, it, m, R, rnd) {
  // upright recurve bow on the left, arrow nocked across to the right
  const cx = -12, cy = 16, r = 25, lim = 0.55, ramp = it._ramp || m.wood;
  g.fill((x, y) => { const d = Math.hypot(x - cx, y - cy), a = Math.atan2(y - cy, x - cx); if (Math.abs(a) > lim) return null; const th = 2 - Math.abs(a) / lim * 0.9; if (Math.abs(d - r) > th) return null; return shade(ramp, -(d - r) / th * 0.8 + (y < cy ? -0.3 : 0.3)); }, 1);
  const tipX = cx + r * Math.cos(lim), tipY = r * Math.sin(lim);
  // recurved tips
  for (const s of [-1, 1]) g.fill((x, y) => (Math.hypot(x - (tipX + 1.6), y - (cy + s * (tipY + 0.6))) < 1.3 ? (R >= 3 ? TRIM[2] : ramp[2]) : null));
  g.fill((x, y) => (x > tipX - 0.2 && x < tipX + 0.8 && Math.abs(y - cy) < tipY ? '#ece4d4' : null));   // string
  g.fill((x, y) => (Math.abs(y - cy) < 2.6 && Math.abs(Math.hypot(x - cx, y - cy) - r) < 2.3 ? shade(m.grip, (x - cx - r) / 2) : null));   // grip wrap
  // arrow
  g.fill((x, y) => (Math.abs(y - cy) <= 0.5 && x > tipX && x < 26 ? '#c8a070' : null), 1);
  g.fill((x, y) => (x >= 25 && x < 31 && Math.abs(y - cy) <= (31 - x) * 0.45 + 0.2 ? (y < cy ? m.metal[3] : m.metal[1]) : null), 1);
  g.fill((x, y) => (x > tipX + 0.8 && x < tipX + 4.5 && Math.abs(y - cy) > 0.6 && Math.abs(y - cy) < 2.6 - (x - tipX) * 0.35 ? (R >= 2 ? (GEM[RAR[R]] || m.accent) : m.accent) : null));   // fletching
  if (m.fx === 'ice') g.fill((x, y) => (Math.abs(Math.hypot(x - cx, y - cy) - r + 2.4) < 0.5 && Math.abs(y - cy) > 4 && y % 3 === 0 ? '#e8f8ff' : null));
}

function gauntlet(g, it, m, R) {
  const ramp = it._ramp || m.metal;
  g.fill((x, y) => {
    if (y < 7 || y > 27) return null;
    const cx = 16, hw = y < 16 ? 7.5 : y < 21 ? 8 : 6.5;
    if (Math.abs(x - cx) > hw) return null;
    if (y < 15 && Math.floor(x - cx + 8) % 3 === 2) return ramp[0];            // finger gaps
    if (y === 15 || y === 21) return R >= 3 ? TRIM[2] : ramp[0];
    return shade(ramp, (x - cx) / hw - (y < 15 ? 0.2 : 0));
  }, 1);
  if (it.titan) g.fill((x, y) => (y > 16 && y < 20 && Math.abs(x - 16) < 3 ? (Math.abs(x - 16) < 1 ? '#ffd84a' : '#e07a2a') : null));
  if (GEM[RAR[R]] && R >= 2) gemAt(g, 16, 18, 1.6, GEM[RAR[R]]);
}

// ---------- armour (front view, mirrored) ----------
function sym(g, rows, ramp, opts = {}) {
  // rows: y -> half-width (or [inner, outer] for a gap down the middle)
  g.fill((x, y) => {
    const r = rows(Math.floor(y));
    if (r == null) return null;
    const [inner, outer] = Array.isArray(r) ? r : [0, r];
    const dx = Math.abs(x - 16);
    if (dx > outer || dx < inner) return null;
    const t = (x - 16) / Math.max(outer, 1);
    return shade(ramp, t * 0.9 + (opts.topLight && y < opts.topLight ? -0.5 : 0));
  }, 1);
}
function band(g, y0, y1, rows, ramp) { g.fill((x, y) => { if (y < y0 || y > y1) return null; const r = rows(Math.floor(y)); if (r == null) return null; const outer = Array.isArray(r) ? r[1] : r, inner = Array.isArray(r) ? r[0] : 0; const dx = Math.abs(x - 16); return dx <= outer && dx >= inner ? shade(ramp, (x - 16) / outer) : null; }); }

function helmet(g, it, m, R, rnd) {
  const ramp = it._ramp || m.metal;
  const rows = (y) => (y < 5 || y > 27 ? null : y < 17 ? Math.sqrt(Math.max(0, 110 - (16.5 - y) ** 2)) : 10.4 - (y - 17) * 0.35);
  g.fill((x, y) => { const r = rows(Math.floor(y)); if (r == null || Math.abs(x - 16) > r) return null; const t = (x - 16) / r; return shade(ramp, t * 0.8 + (y < 10 ? -0.45 : 0) + (y > 22 ? 0.25 : 0)); }, 1);
  g.fill((x, y) => (y >= 5 && y <= 16 && Math.abs(x - 15.5) < 0.9 ? ramp[3] : null));               // crest ridge
  g.fill((x, y) => { const r = rows(Math.floor(y)); return r != null && y >= 15 && y < 17 && Math.abs(x - 16) <= r ? shade(R >= 3 ? TRIM : ramp, (x - 16) / r) : null; });   // brow band
  // T-shaped face opening, eyes glow on Rare+
  g.fill((x, y) => { const eye = y >= 18 && y < 20 && Math.abs(x - 16) < 7.5 && Math.abs(x - 16) > 0.8; const mouth = y >= 20 && y < 26 && Math.abs(x - 16) < 2.2; if (!eye && !mouth) return null; return eye && R >= 2 && m.glow && Math.abs(Math.abs(x - 16) - 4) < 1.6 ? m.glow : '#06050c'; });
  for (const sx of [-8, 8]) g.fill((x, y) => (Math.hypot(x - 16 - sx, y - 23) < 0.8 ? ramp[3] : null));   // rivets
  if (m.fx === 'notch' || m.fx === 'lava' || /horn|dread|demon/i.test(it.name)) {
    const hr = m.fx === 'lava' ? ['#1a0a0a', '#3a1a14', '#7a3a2a', '#ff8a2e'] : ['#5a4a30', '#a08a60', '#d8c8a0', '#fff4d8'];
    for (const s of [-1, 1]) g.fill((x, y) => { const t = (14 - y) / 12; if (t < 0 || t > 1) return null; const hx = 16 + s * (10 + t * 5 - t * t * 4); return Math.abs(x - hx) < 1.9 - t * 1.4 ? shade(hr, s * 0.4 - t) : null; });
  } else if (R >= 3) {
    const pl = GEM[RAR[R]] || '#e8435a';
    g.fill((x, y) => { const t = (6 - y) / 6; if (t < 0 || t > 1) return null; return Math.abs(x - 16 + t * 5) < 1.8 - t * 0.6 ? (t > 0.6 ? mix(pl, '#ffffff', 0.3) : pl) : null; });   // plume
  }
  if (GEM[RAR[R]] && R >= 2) gemAt(g, 16, 12, 1.5, GEM[RAR[R]]);
  if (m.fx === 'ice') g.fill((x, y) => (y === 27 && Math.abs(x - 16) < 9 && x % 2 ? '#e8f8ff' : null));
}

function chest(g, it, m, R) {
  const ramp = it._ramp || m.metal;
  const rows = (y) => (y < 5 || y > 28 ? null : y < 8 ? [y < 6 ? 4 : 3.5, 13] : y < 11 ? 13.5 : 10 - (y - 11) * 0.12);
  sym(g, rows, ramp);
  g.fill((x, y) => (y >= 8 && y <= 10 && Math.abs(x - 16) > 9 && Math.abs(x - 16) < 13.5 ? ramp[0] : null));     // pauldron seam
  g.fill((x, y) => (y >= 11 && y <= 25 && Math.abs(x - 16) < 0.6 ? ramp[3] : null));                             // centre ridge
  band(g, 24, 25, rows, R >= 3 ? TRIM : [m.grip[0], m.grip[1], m.grip[2], m.grip[2]]);                          // belt
  if (m.fx === 'rune' && R >= 2) g.fill((x, y) => (y >= 13 && y <= 21 && Math.abs(x - 16) > 3 && Math.abs(x - 16) < 4 && y % 2 ? m.glow : null));
  if (m.fx === 'lava') g.fill((x, y) => ((Math.abs(x - 16) * 2 + y) % 7 === 0 && y > 11 && y < 23 && Math.abs(x - 16) < 8 ? '#ff6a1a' : null));
  if (m.fx === 'ice') g.fill((x, y) => (y >= 5 && y <= 7 && Math.abs(x - 16) > 6 && (x + y) % 2 ? '#e8f8ff' : null));
  if (GEM[RAR[R]] && R >= 2) gemAt(g, 16, 16, 1.8, GEM[RAR[R]]);
  if (R >= 3) for (const s of [-1, 1]) g.fill((x, y) => (Math.abs(y - 9) < 0.6 && Math.abs(x - 16 - s * 11) < 2 ? TRIM[2] : null));
}
function legs(g, it, m, R) {
  const ramp = it._ramp || m.metal;
  const rows = (y) => (y < 5 || y > 28 ? null : y < 10 ? 10 : [1.2, 9.5 - (y - 10) * 0.12]);
  sym(g, rows, ramp);
  band(g, 5, 7, rows, R >= 3 ? TRIM : [m.grip[0], m.grip[1], m.grip[2], m.grip[2]]);
  for (const s of [-1, 1]) g.fill((x, y) => (Math.hypot(x - 16 - s * 5, y - 18) < 2.4 ? shade(ramp, ((x - 16 - s * 5) + (y - 18)) / 3) : null));   // knee plates
  if (GEM[RAR[R]] && R >= 2) gemAt(g, 16, 6, 1.2, GEM[RAR[R]]);
}
function boots(g, it, m, R) {
  const ramp = it._ramp || m.metal;
  g.fill((x, y) => {
    const inShaft = x >= 9 && x <= 18 && y >= 5 && y <= 22;
    const inFoot = y >= 18 && y <= 26 && x >= 9 && x <= 26 - Math.max(0, 21 - y) * 1.6;
    if (!inShaft && !inFoot) return null;
    if (y >= 25) return '#1a1418';                               // sole
    if (y <= 6) return R >= 3 ? TRIM[2] : ramp[3];               // cuff
    return shade(ramp, (x - 14) / 6 * (inShaft ? 1 : 0.4) + (y - 18) / 12);
  }, 1);
  if (m.fx === 'ice' || /wind/i.test(it.name)) g.fill((x, y) => (x >= 5 && x <= 8 && (y === 9 || y === 13 || y === 17) ? '#e8f8ff' : null));   // speed lines / frost
  if (m.fx === 'lava') g.fill((x, y) => (y === 24 && x > 10 && x < 25 && x % 3 === 0 ? '#ff6a1a' : null));
  if (GEM[RAR[R]] && R >= 2) gemAt(g, 13.5, 11, 1.3, GEM[RAR[R]]);
}
function shield(g, it, m, R, rnd) {
  const ramp = it._ramp || m.metal;
  // round buckler, tall tower shield / bulwark, otherwise a heater shield
  const shape = /coffin/i.test(it.name) ? 'coffin' : /plank/i.test(it.name) ? 'plank' : /buckler/i.test(it.name) ? 'round' : /tower|bulwark|aegis/i.test(it.name) ? 'tower' : 'heater';
  const wooden = /plank|wooden|coffin/i.test(it.name);
  const rows = shape === 'round' ? (y) => { const d = 13 ** 2 - (y - 16) ** 2; return d < 0 ? null : Math.sqrt(d); }
    : shape === 'coffin' ? (y) => (y < 2 || y > 30 ? null : y < 9 ? 6 + (y - 2) * 0.85 : 12 - (y - 9) * 0.3)
    : shape === 'plank' ? (y) => (y < 3 || y > 29 ? null : 9 - (y % 7 === 0 ? 1 : 0))
    : shape === 'tower' ? (y) => (y < 2 || y > 30 ? null : y < 4 ? 8 + (y - 2) * 1.5 : y > 26 ? 11 - (y - 26) * 1.5 : 11)
    : (y) => (y < 3 || y > 29 ? null : y < 13 ? 12 : 12 * Math.sqrt(Math.max(0, 1 - ((y - 13) / 17) ** 2)));
  const top = shape === 'round' ? 3.3 : shape === 'heater' ? 4.3 : 3.3;
  const ramp2 = wooden ? m.wood.concat([mix(m.wood[2], '#ffffff', 0.25)]) : ramp;
  sym(g, rows, ramp2);
  if (wooden) g.fill((x, y) => { const r = rows(Math.floor(y)); return r != null && Math.abs(x - 16) < r - 1 && Math.floor(x) % 5 === 1 ? m.wood[0] : null; });
  // rim
  g.fill((x, y) => { const r = rows(Math.floor(y)); if (r == null) return null; const dx = Math.abs(x - 16); if (dx > r) return null; const rim = r - dx < 1.3 || y < top; return rim ? (R >= 3 ? TRIM[2] : wooden ? m.metal[1] : ramp[3]) : null; });
  // emblem per section
  const em = { notch: '#6ab03a', soul: '#b48cff', rune: '#4ad0ff', ice: '#ffffff', lava: '#ff6a1a', rust: '#8a5a3a' }[m.fx];
  if (shape === 'plank') {
    for (const [nx, ny] of [[10, 7], [22, 7], [10, 25], [22, 25]]) g.fill((x, y) => (Math.hypot(x - nx, y - ny) < 0.8 ? m.metal[3] : null));
  } else if (shape === 'round') {
    g.fill((x, y) => { const d = Math.hypot(x - 16, y - 16); return d < 4.5 ? shade(R >= 3 ? TRIM : ramp, ((x - 16) + (y - 16)) / 6) : d < 5.5 ? em : null; });
  } else {
    const cy = shape === 'tower' ? 15 : 13;
    g.fill((x, y) => (Math.abs(x - 16) < 1 && y > 6 && y < (shape === 'tower' ? 27 : 24) ? em : null));
    g.fill((x, y) => (Math.abs(y - cy) < 1 && Math.abs(x - 16) < 6 ? em : null));
  }
  if (GEM[RAR[R]] && R >= 2) gemAt(g, 16, shape === 'round' ? 16 : shape === 'tower' ? 15 : 13, 2, GEM[RAR[R]]);
}
function tome(g, it, m, R) {
  const cover = it.dtype === 'fire' ? ['#3a0e0a', '#7a1e14', '#a83a22', '#d86a3a'] : it.dtype === 'lightning' ? ['#0e2a3a', '#1e4a6a', '#3a7aa0', '#7ab8e0'] : ['#2a0e3a', '#4a1e6a', '#6a3a9a', '#9a6ad0'];
  g.fill((x, y) => (x >= 8 && x <= 25 && y >= 4 && y <= 27 ? (x >= 24 ? '#f0e6cc' : x <= 9 ? cover[0] : shade(cover, (x - 16) / 9 + (y - 15) / 30)) : null), 1);
  g.fill((x, y) => (x >= 24 && x <= 25 && y >= 5 && y <= 26 && y % 2 ? '#c8bca0' : null));   // page edges
  for (const [cx, cy] of [[10, 5], [23, 5], [10, 26], [23, 26]]) g.fill((x, y) => (Math.abs(x - cx) < 1.5 && Math.abs(y - cy) < 1.5 ? (R >= 3 ? TRIM[2] : m.metal[2]) : null));
  const glow = it.dtype === 'fire' ? '#ff8a2e' : m.glow || GEM[RAR[R]] || '#b48cff';
  g.fill((x, y) => { const d = Math.hypot(x - 16.5, y - 15.5); return d < 4.5 && d > 3.4 ? glow : null; }, 4);
  g.fill((x, y) => (Math.hypot(x - 16.5, y - 15.5) < 1.6 ? mix(glow, '#ffffff', 0.5) : null), 4);
}
function lantern(g, it, m, R) {
  const glow = m.glow || '#ffd27a';
  g.fill((x, y) => (Math.abs(x - 16) < 3 && y >= 2 && y <= 4 && !(Math.abs(x - 16) < 1.5 && y === 3) ? m.metal[2] : null));
  g.fill((x, y) => (Math.abs(x - 16) <= 6 && y >= 5 && y <= 7 ? shade(m.metal, (x - 16) / 6) : null), 1);
  g.fill((x, y) => (Math.abs(x - 16) <= 5 && y >= 8 && y <= 22 ? (Math.abs(x - 16) > 4 || y === 15 ? shade(m.metal, (x - 16) / 5) : mix(glow, '#000000', 0.15 + Math.abs(x - 16) * 0.08)) : null), 4);
  g.fill((x, y) => { const fy = 16 - y, w = 2 - Math.abs(fy - 1) * 0.4; return fy >= -3 && fy <= 5 && Math.abs(x - 16) < w ? (Math.abs(x - 16) < w * 0.5 ? '#ffffff' : '#ffe680') : null; }, 4);
  g.fill((x, y) => (Math.abs(x - 16) <= 6 && y >= 23 && y <= 25 ? shade(m.metal, (x - 16) / 6) : null), 1);
}
function flask(g, it, m, R) {
  const liquid = it.revive || it.cheatDeath ? '#ffd84a' : it.healStart ? '#e8435a' : m.glow || '#7ae0ff';
  g.fill((x, y) => (Math.abs(x - 16) < 2 && y >= 3 && y <= 5 ? '#a07a50' : null));
  g.fill((x, y) => (Math.abs(x - 16) < 2.2 && y >= 6 && y <= 10 ? '#d8e8f0' : null), 1);
  g.fill((x, y) => { const d = Math.hypot(x - 16, y - 19); if (d > 9) return null; if (d > 8) return '#d8e8f0'; return y < 15 ? mix('#d8e8f0', '#203040', 0.5) : (x - 16) + (y - 19) < -6 ? '#ffffff' : mix(liquid, '#000000', Math.max(0, (d - 4) / 12)); }, 4);
  g.fill((x, y) => (Math.hypot(x - 13, y - 21) < 1 || Math.hypot(x - 18, y - 24) < 0.8 ? mix(liquid, '#ffffff', 0.6) : null), 4);   // bubbles
}
function crown(g, it, m, R) {
  const ramp = TRIM;
  g.fill((x, y) => { if (y < 6 || y > 24) return null; const dx = Math.abs(x - 16); if (dx > 12) return null; if (y >= 18) return shade(ramp, (x - 16) / 12); const k = Math.round(dx / 6) * 6; const spike = 18 - Math.max(0, 10 - Math.abs(dx - k) * 3.2); return y >= spike ? shade(ramp, (x - 16) / 12) : null; }, 1);
  for (const cx of [10, 16, 22]) gemAt(g, cx, 21, 1.4, cx === 16 ? (GEM[RAR[R]] || '#e8435a') : '#4a90e2');
  if (it.dtype === 'fire' || /hellfire|phoenix/i.test(it.name)) g.fill((x, y) => (y >= 2 && y <= 6 && [4, 10, 16, 22, 28].some((c) => Math.abs(x - c) < (6 - y) * 0.35) ? (y < 4 ? '#ffd27a' : '#ff6a1a') : null), 4);
}
function wings(g, it, m, R) {
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      g.fill((x, y) => { const lx = (x - 16) * s; if (lx < 2) return null; const fy = 6 + i * 4.2 - (lx - 2) * (0.55 - i * 0.05); const len = 13 - i * 1.6; return lx < 2 + len && Math.abs(y - fy) < 2.2 - (lx - 2) / len * 1.2 ? (i % 2 ? '#e8e2ff' : '#ffffff') : null; }, 1);
    }
  }
  g.fill((x, y) => { const d = Math.hypot(x - 16, (y - 5) * 2.4); return d > 4.2 && d < 5.6 ? '#ffd84a' : null; }, 4);   // halo
  gemAt(g, 16, 16, 2.2, '#fff4b0');
}

const DRAW = { sword, dagger, axe, hammer, spear, staff, bow, gauntlet, helmet, chest, legs, boots, shield, tome, lantern, flask, relic: flask, crown, wings };
function kindOf(it) {
  if (/crown/i.test(it.name)) return 'crown';
  if (/wings/i.test(it.name)) return 'wings';
  if (it.slot === 'weapon') return it.weaponType;
  if (it.slot === 'offhand') return it.kind === 'relic' ? 'flask' : it.kind;
  return it.slot;
}

// Build the pixel grid for an item (or a fake item spec: { name, slot, kind/weaponType, section, rarity, dtype }).
export function buildGear(it) {
  const m = MAT[it.section] || MAT[0];
  const R = RAR.indexOf(it.rarity);
  const rnd = rngFrom(hash(it.name || it.id));
  const item = { ...it, _ramp: it.dtype === 'holy' ? HOLY_METAL : it.dtype === 'frost' && it.section !== 4 ? FROST_METAL : null };
  const g = new Px();
  (DRAW[kindOf(it)] || sword)(g, item, m, R, rnd);
  if (m.fx === 'rust' || (m.fx === 'notch' && R <= 1)) {           // grime on crude gear
    for (let i = 0; i < 10; i++) { const x = Math.floor(rnd() * N), y = Math.floor(rnd() * N); if (g.get(x, y) && g.tag[y * N + x] === 1) g.set(x, y, mix(g.get(x, y), '#6a3a1a', 0.5), 1); }
  }
  g.outline(R >= 4 ? mix('#05040a', AURA[RAR[R]], 0.25) : '#07060c');
  return { g, R, aura: AURA[RAR[R]] || null, glow: m.glow, rarity: RAR[R] };
}

function paint(ctx, g, scale, f = null) {
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let col = g.c[y * N + x];
    if (!col) continue;
    if (f) col = f(x, y, col, g.tag[y * N + x]);
    ctx.fillStyle = col; ctx.fillRect(x * scale, y * scale, scale, scale);
  }
}

const cache = new Map();
// Static icon (data URL). Legendary+ get a soft coloured glow baked in.
export function gearArtIcon(it, scale = 3) {
  const key = `${it.id || it.name}|${it.rarity}|${it.section}|${scale}`;
  if (cache.has(key)) return cache.get(key);
  const { g, aura } = buildGear(it);
  const pad = 4 * scale;   // same padding for every item so icons line up; Legendary+ glow fills it
  const cv = document.createElement('canvas'); cv.width = cv.height = N * scale + pad * 2;
  const ctx = cv.getContext('2d');
  ctx.translate(pad, pad);
  if (aura) {
    const off = document.createElement('canvas'); off.width = off.height = N * scale;
    paint(off.getContext('2d'), g, scale);
    ctx.shadowColor = aura; ctx.shadowBlur = 5 * scale; ctx.drawImage(off, 0, 0); ctx.shadowBlur = 0;
  }
  paint(ctx, g, scale);
  const url = cv.toDataURL();
  cache.set(key, url);
  return url;
}

// Animated icon: Epic+ shimmer sweep, glowing parts pulse, Mythic sparkles, Divine halo rays. Returns stop().
export function mountGearArt(canvas, it, scale = 4) {
  const { g, R, aura } = buildGear(it);
  const pad = 5 * scale;
  canvas.width = canvas.height = N * scale + pad * 2;
  const ctx = canvas.getContext('2d');
  const rnd = rngFrom(hash(it.name) ^ 99);
  const sparks = Array.from({ length: R >= 5 ? 7 : R >= 4 ? 3 : 0 }, () => ({ x: rnd() * N, y: rnd() * N, p: rnd() * 6, s: 0.6 + rnd() * 0.8 }));
  const base = document.createElement('canvas'); base.width = base.height = N * scale; paint(base.getContext('2d'), g, scale);
  let raf = 0, t0 = performance.now();
  const frame = (now) => {
    const t = (now - t0) / 1000;
    if (!canvas.isConnected && t > 0.3) return;   // removed from the page: stop animating
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(pad, pad);
    if (R >= 6) {                      // divine: slow rotating rays
      ctx.save(); ctx.translate(N * scale / 2, N * scale / 2); ctx.rotate(t * 0.4);
      for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillStyle = 'rgba(255, 241, 168, 0.13)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3 * scale, -N * scale * 0.75); ctx.lineTo(3 * scale, -N * scale * 0.75); ctx.fill(); }
      ctx.restore();
    }
    if (aura) { ctx.shadowColor = aura; ctx.shadowBlur = (4 + Math.sin(t * 3) * 2) * scale; ctx.drawImage(base, 0, 0); ctx.shadowBlur = 0; }
    const sweep = ((t * 0.45) % 1.6) * (N * 2) - N * 0.4;       // diagonal band position
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    paint(ctx, g, scale, (x, y, col, tag) => {
      if (tag === 4) return mix(col, '#ffffff', pulse * 0.35);  // glowing orbs, flames, potions
      if (tag === 3) return mix(col, '#ffd27a', pulse * 0.6);   // lava
      if (R >= 3 && (tag === 1 || tag === 2) && Math.abs(x + y - sweep) < 1.5) return mix(col, '#ffffff', 0.55);
      return col;
    });
    ctx.shadowBlur = 0;
    for (const s of sparks) {          // twinkling sparkles
      const a = Math.max(0, Math.sin(t * 2.2 * s.s + s.p));
      if (a < 0.2) continue;
      ctx.fillStyle = R >= 6 ? `rgba(255,250,220,${a})` : R >= 5 ? `rgba(255,170,190,${a})` : `rgba(255,220,140,${a})`;
      const px = Math.floor(s.x) * scale, py = Math.floor(s.y) * scale;
      ctx.fillRect(px, py - scale, scale, scale * 3); ctx.fillRect(px - scale, py, scale * 3, scale);
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

