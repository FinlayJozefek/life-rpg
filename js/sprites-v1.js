// SAVED ART v1 (frozen copy, kept for comparison in dev/art.html). Edit sprites2.js instead.
// TRIAL: more detailed pixel art. Avatar outfits change shape (robes, armour,
// suits, hats...) and scale up with rarity: trim -> gems -> capes -> aura ->
// animated mythic effects. Not used by the game yet; see dev/art.html.
import { ITEM, RARITY, SKILL } from './data.js';

export const AW = 32;           // avatar grid width
export const AH = 52;           // avatar grid height
const OY = 5;                   // top margin for hats/particles
const OUTLINE = '#0a0b18';

// ---------- colour helpers ----------
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s, l];
}
function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const f = (n) => {
    const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
const adj = (hex, dl, ds = 0, dh = 0) => { const [h, s, l] = hexToHsl(hex); return hsl(h + dh, s + ds, l + dl); };
// 4-tone ramp, light from the top-left. Shadows shift slightly cooler, highlights warmer.
const ramp = (hex) => ({ hi: adj(hex, 0.1, 0.02, -6), base: hex, lo: adj(hex, -0.12, 0.02, 8), dk: adj(hex, -0.24, 0, 14) });

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- pixel grid ----------
class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.c = Array.from({ length: h }, () => Array(w).fill(null)); this.glow = new Set(); }
  px(x, y, col, glow = false) {
    y += this.oy || 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !col) return;
    this.c[y][x] = col;
    if (glow) this.glow.add(`${x},${y}`); else this.glow.delete(`${x},${y}`);
  }
  rect(x0, y0, x1, y1, col, glow) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.px(x, y, col, glow); }
  shaded(x0, y0, x1, y1, base) {
    const r = ramp(base);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      let col = r.base;
      if (x === x0) col = r.hi;
      if (x === x1 || y === y1) col = r.lo;
      if (x === x1 && y === y1) col = r.dk;
      this.px(x, y, col);
    }
  }
  filled(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.c[y][x] !== null; }
  outline(col = OUTLINE) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.c[y][x]) continue;
      if (this.filled(x - 1, y) || this.filled(x + 1, y) || this.filled(x, y - 1) || this.filled(x, y + 1)) add.push([x, y]);
    }
    for (const [x, y] of add) this.c[y][x] = col;
  }
  toCanvas(glowBoost = 0) {
    const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h;
    const ctx = cv.getContext('2d');
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      let col = this.c[y][x]; if (!col) continue;
      if (glowBoost && this.glow.has(`${x},${y}`)) col = adj(col, 0.18 * glowBoost, 0.1);
      ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1);
    }
    return cv;
  }
}

// ---------- outfit classification & palettes ----------
const MYTHIC_THEMES = {
  'phoenix-gear':           { arch: 'armour', main: '#c8401a', sec: '#ff9a1e', trim: '#ffe066', gem: '#fff4b0', fx: 'embers', eyes: '#ffb21e' },
  'celestial-sage-robes':   { arch: 'robe',   main: '#1d2a78', sec: '#3448c4', trim: '#ffd76a', gem: '#bfe3ff', fx: 'stars', eyes: '#bfe3ff', hood: true },
  'ember-chef-s-coat':      { arch: 'robe',   main: '#efe7d8', sec: '#c8401a', trim: '#ff8a2e', gem: '#ffe066', fx: 'embers', eyes: '#ff8a2e' },
  'verdant-druid-robes':    { arch: 'robe',   main: '#2f6b2a', sec: '#5aa832', trim: '#d0a94a', gem: '#a6ff6a', fx: 'leaves', eyes: '#a6ff6a', hood: true },
  'forest-spirit-garb':     { arch: 'robe',   main: '#1d5a54', sec: '#36a893', trim: '#d6ffef', gem: '#7dffd8', fx: 'wisps', eyes: '#7dffd8' },
  'forgemaster-s-armour':   { arch: 'armour', main: '#555b6b', sec: '#2c2f38', trim: '#ff7a1a', gem: '#ffcf4a', fx: 'embers', eyes: '#ff7a1a' },
  'chromatic-cloak':        { arch: 'robe',   main: '#6a35d0', sec: '#22a9c9', trim: '#ffd84a', gem: '#ff5fa2', fx: 'rainbow', eyes: '#ff9de0', hood: true },
  'siren-s-stage-outfit':   { arch: 'suit',   main: '#13756f', sec: '#e05fa2', trim: '#d8fff9', gem: '#ffd6f0', fx: 'sparkles', eyes: '#7ffff0' },
  'ascendant-robes':        { arch: 'robe',   main: '#f1eee2', sec: '#d9b85a', trim: '#ffd84a', gem: '#bff6ff', fx: 'light', eyes: '#fff6c0' },
  'silver-tongued-regalia': { arch: 'suit',   main: '#3a2a6b', sec: '#c9ccd6', trim: '#eef0f8', gem: '#b98bff', fx: 'sparkles', eyes: '#d6c2ff' },
  'pristine-regalia':       { arch: 'robe',   main: '#e4eaf3', sec: '#8fa8cc', trim: '#ffffff', gem: '#9fe8ff', fx: 'sparkles', eyes: '#c8f4ff' },
  'titan-s-workwear':       { arch: 'armour', main: '#8a6a3d', sec: '#5a5248', trim: '#e0b04a', gem: '#ffd25e', fx: 'dust', eyes: '#ffd25e' },
};

export function archetypeFor(name) {
  const n = name.toLowerCase();
  if (/(sandals|trainers|runners|racers|boots|wellies|clogs|loafers|slippers|socks)$/.test(n)) return 'feet';
  if (/crown|(hat|cap|beret|beanie|bandana|headscarf|sweatband)$/.test(n)) return 'head';
  if (/armour|gear$|workwear/.test(n)) return 'armour';
  if (/overall|dungaree/.test(n)) return 'overalls';
  if (/apron/.test(n)) return 'apron';
  if (/tracksuit/.test(n)) return 'outfit';
  if (/suit|tuxedo|tailcoat|blazer/.test(n)) return 'suit';
  if (/uniform|whites/.test(n)) return 'uniform';
  if (/robe|gown|garb|regalia|cloak|coat|smock/.test(n)) return 'robe';
  if (/tracksuit|outfit|\bset\b|\bkit\b/.test(n)) return 'outfit';
  if (/shorts/.test(n)) return 'shorts';
  if (/legging|jogger|chino/.test(n)) return 'legs';
  return 'top'; // tee, shirt, jacket, vest, fleece, hoodie, cardigan
}

const TRIM_BY_TIER = [null, null, '#c9ccd6', '#e8b84a', '#ffd84a', '#ffe680'];

export function outfitLook(itemId) {
  const item = ITEM[itemId];
  const key = itemId.split('.')[1];
  const tier = RARITY[item.rarity].index;
  const theme = MYTHIC_THEMES[key];
  if (theme) return { ...theme, tier, name: item.name, rarity: item.rarity };
  const rng = rng32(hashStr(itemId));
  const hue = SKILL[item.skill].hue + Math.floor(rng() * 50) - 25;
  const sat = 0.3 + rng() * 0.25 + tier * 0.04;
  const light = 0.34 + rng() * 0.14;
  const main = hsl(hue, sat, light);
  const sec = hsl(hue + 150 + rng() * 60, sat * 0.9, light - 0.06);
  return {
    arch: archetypeFor(item.name), tier, name: item.name, rarity: item.rarity,
    main, sec, trim: TRIM_BY_TIER[tier] || adj(main, 0.14), gem: RARITY[item.rarity].color,
    fx: null, eyes: null, hood: false,
  };
}

// ---------- avatar parts ----------
const SKIN = '#e2b48c', HAIR = '#4a3020';
const BASE = { top: '#5d6270', pants: '#363a47', shoes: '#3b2b21' };

function drawCape(g, L) {
  const r = ramp(L.sec);
  for (let y = 18; y <= 42; y++) {
    const spread = Math.min(4, Math.floor((y - 18) / 5));
    for (let x = 9 - spread; x <= 22 + spread; x++) {
      const edge = x === 9 - spread || x === 22 + spread;
      g.px(x, y, y >= 41 ? L.trim : edge ? r.lo : r.dk, y >= 41 && L.tier >= 5);
    }
  }
}

function drawHood(g, L) {
  const r = ramp(L.main);
  for (let y = 2; y <= 17; y++) for (let x = 9; x <= 22; x++) {
    if ((y < 4 && (x < 11 || x > 20)) || (y < 3 && (x < 12 || x > 19))) continue;
    g.px(x, y, x > 18 ? r.dk : r.lo);
  }
}

function drawHead(g, L, hatOn) {
  const s = ramp(SKIN);
  g.rect(14, 16, 17, 17, s.lo);                       // neck
  for (let y = 5; y <= 15; y++) for (let x = 11; x <= 20; x++) {
    if ((y === 5 || y === 15) && (x === 11 || x === 20)) continue;
    g.px(x, y, x === 20 || y === 15 ? s.lo : x === 11 ? s.hi : s.base);
  }
  if (!hatOn) {
    const h = ramp(HAIR);
    g.rect(12, 2, 19, 2, h.base); g.rect(11, 3, 20, 5, h.base); g.rect(11, 3, 12, 4, h.hi);
    g.rect(10, 5, 10, 9, h.lo); g.rect(21, 5, 21, 9, h.lo); g.rect(11, 6, 15, 7, h.base); g.px(16, 6, h.base);
    g.rect(19, 6, 20, 7, h.lo);
  } else {
    const h = ramp(HAIR);
    g.rect(10, 7, 10, 9, h.lo); g.rect(21, 7, 21, 9, h.lo);
  }
  const eye = L && L.eyes ? L.eyes : '#1a1630';
  g.px(13, 10, eye, !!(L && L.eyes)); g.px(13, 11, eye, !!(L && L.eyes));
  g.px(18, 10, eye, !!(L && L.eyes)); g.px(18, 11, eye, !!(L && L.eyes));
  g.rect(12, 8, 14, 8, ramp(HAIR).lo); g.rect(17, 8, 19, 8, ramp(HAIR).lo);
  g.px(15, 13, s.dk); g.px(16, 13, s.dk);
  g.px(12, 12, adj(SKIN, -0.02, 0.15, -12)); g.px(19, 12, adj(SKIN, -0.02, 0.15, -12));
}

function drawArms(g, sleeve, len = 29) {
  // sleeve colour down to `len`, skin below, hands at 30-31
  for (const [x0, x1] of [[7, 9], [22, 24]]) {
    g.shaded(x0, 19, x1, len, sleeve);
    if (len < 29) g.shaded(x0, len + 1, x1, 29, SKIN);
    g.shaded(x0, 30, x1, 31, SKIN);
  }
}

function drawTorso(g, col) { g.shaded(10, 18, 21, 29, col); g.rect(9, 18, 22, 18, ramp(col).hi); }

function drawLegs(g, col, to = 40) {
  g.shaded(11, 30, 20, 31, col);
  g.shaded(11, 32, 15, to, col);
  g.shaded(16, 32, 20, to, col);
  if (to < 40) { g.shaded(11, to + 1, 15, 40, SKIN); g.shaded(16, to + 1, 20, 40, SKIN); }
}

function drawShoes(g, col, trim) {
  const r = ramp(col);
  for (const [x0, x1] of [[10, 15], [16, 21]]) {
    g.rect(x0, 41, x1, 41, r.base); g.rect(x0, 42, x1, 42, r.dk); g.px(x0, 41, r.hi);
    if (trim) g.rect(x0, 42, x1, 42, trim);
  }
}

function trimLine(g, x0, y0, x1, y1, L, minTier = 1) {
  if (L.tier < minTier) return;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g.px(x, y, L.trim, L.tier >= 5);
}

function gem(g, x, y, L, size = 2) {
  const r = ramp(L.gem);
  g.px(x, y, r.hi, true);
  if (size > 1) { g.px(x + 1, y, r.base, true); g.px(x, y + 1, r.base, true); g.px(x + 1, y + 1, r.lo, true); }
}

// default clothes underneath partial items (hats, shoes, aprons...)
function baseClothes(g, { top = true, legs = true, shoes = true } = {}) {
  if (legs) drawLegs(g, BASE.pants);
  if (top) { drawTorso(g, BASE.top); drawArms(g, BASE.top, 22); }
  if (shoes) drawShoes(g, BASE.shoes);
}

function drawHat(g, L) {
  const n = L.name.toLowerCase();
  const r = ramp(L.main);
  if (/crown/.test(n)) {
    const gold = ramp(L.tier >= 4 ? '#ffcf3a' : L.trim);
    g.rect(11, 1, 20, 4, gold.base); g.rect(11, 4, 20, 4, gold.lo);
    for (const x of [11, 14, 17, 20]) { g.px(x, 0, gold.hi); g.px(x, -1, gold.hi); }
    g.px(15, -1, gold.hi); g.px(16, -1, gold.hi); g.px(15, -2, gold.hi);
    gem(g, 13, 2, L, 1); gem(g, 15, 2, { ...L, gem: '#ff4a6a' }, 2); gem(g, 18, 2, L, 1);
    const h = ramp(HAIR); g.rect(11, 5, 20, 6, h.base);
    return;
  }
  if (/graduation/.test(n)) {
    g.rect(11, 3, 20, 6, r.lo); g.rect(7, 2, 24, 2, r.base); g.rect(8, 1, 23, 1, r.hi);
    g.px(22, 3, L.trim || '#ffd84a'); g.rect(23, 3, 23, 6, L.trim || '#ffd84a');
    return;
  }
  if (/chef/.test(n)) {
    g.rect(11, -3, 20, 5, '#f4f1ea'); g.rect(10, -2, 21, 1, '#f4f1ea'); g.rect(19, -3, 21, 5, '#d8d2c4'); g.rect(11, 4, 20, 5, '#e2dccd');
    return;
  }
  if (/hard hat/.test(n)) {
    g.rect(11, 1, 20, 5, '#f2c12e'); g.rect(9, 5, 22, 6, '#d9a51a'); g.rect(15, 0, 16, 5, '#ffd84a');
    return;
  }
  if (/beret/.test(n)) { g.rect(10, 2, 21, 5, r.base); g.rect(9, 3, 12, 4, r.hi); g.px(17, 1, r.lo); return; }
  if (/beanie/.test(n)) { g.rect(11, 1, 20, 6, r.base); g.rect(11, 5, 20, 6, r.lo); g.px(15, 0, L.sec); g.px(16, 0, L.sec); return; }
  if (/bandana|headscarf|sweatband/.test(n)) {
    const h = ramp(HAIR); g.rect(12, 2, 19, 2, h.base); g.rect(11, 3, 20, 5, h.base);
    g.rect(11, 6, 20, 7, r.base); g.px(21, 7, r.lo); g.px(22, 8, r.lo); return;
  }
  // caps / flat cap / straw hat / ranger hat
  const wide = /straw|ranger/.test(n);
  g.rect(11, 1, 20, 5, r.base); g.rect(11, 1, 13, 3, r.hi); g.rect(19, 1, 20, 5, r.lo);
  if (wide) g.rect(7, 5, 24, 6, r.lo);
  else g.rect(11, 5, 24, 6, r.lo);
  trimLine(g, 11, 4, 20, 4, L);
  if (L.tier >= 2) gem(g, 15, 2, L, 1);
}

function drawFeetItem(g, L) {
  const n = L.name.toLowerCase();
  if (/sandal/.test(n)) {
    const s = ramp(SKIN);
    for (const [x0, x1] of [[10, 15], [16, 21]]) {
      g.rect(x0, 41, x1, 41, s.base); g.rect(x0, 42, x1, 42, L.trim); g.rect(x0 + 1, 40, x0 + 1, 41, L.trim); g.rect(x1 - 1, 39, x1 - 1, 41, L.trim);
    }
    if (/thunder/.test(n)) {      // golden wings at the heels
      for (const [x, d] of [[9, -1], [22, 1]]) {
        g.px(x, 40, '#ffe680', true); g.px(x + d, 39, '#ffd84a', true); g.px(x + d * 2, 38, '#ffd84a', true); g.px(x + d, 40, '#ffe680', true); g.px(x + d * 2, 39, '#fff4b0', true);
      }
      g.px(13, 36, '#bfe3ff', true); g.px(18, 37, '#bfe3ff', true); // static crackle
    }
    return;
  }
  const r = ramp(L.main);
  const high = /boot|welli/.test(n);
  for (const [x0, x1] of [[10, 15], [16, 21]]) {
    if (high) g.shaded(x0 + 1, 36, x1 - 1, 40, L.main);
    g.rect(x0, 41, x1, 41, r.base); g.rect(x0, 42, x1, 42, r.dk); g.px(x0, 41, r.hi);
    if (L.tier >= 1) g.rect(x0, 42, x1, 42, L.tier >= 2 ? L.trim : L.sec);
    if (L.tier >= 3) g.px(x0 + 2, 41, L.gem);
  }
}

const ARCH = {
  top(g, L) {
    drawLegs(g, BASE.pants); drawShoes(g, BASE.shoes);
    const n = L.name.toLowerCase();
    const short = /tee|t-shirt|polo|vest/.test(n);
    drawTorso(g, L.main); drawArms(g, L.main, short ? 22 : 29);
    if (/vest/.test(n)) { drawArms(g, BASE.top, 22); if (/hi-vis/.test(n)) { g.rect(10, 24, 21, 25, '#d9e0e8'); } }
    if (/jacket|fleece|hoodie|cardigan/.test(n)) { g.rect(15, 19, 16, 29, ramp(L.main).dk); g.rect(13, 18, 18, 18, L.sec); }
    if (/hoodie/.test(n)) { g.rect(11, 16, 20, 17, ramp(L.main).lo); g.rect(12, 24, 19, 27, ramp(L.main).lo); }
    trimLine(g, 10, 29, 21, 29, L);
    if (!short) { trimLine(g, 7, 29, 9, 29, L); trimLine(g, 22, 29, 24, 29, L); }
    if (L.tier >= 2) gem(g, 12, 20, L, 1);
  },
  outfit(g, L) {                       // tracksuits, sets, kits: matching top + bottoms with stripes
    drawLegs(g, L.main); drawShoes(g, BASE.shoes, L.tier >= 2 ? L.trim : null);
    drawTorso(g, L.main); drawArms(g, L.main, 29);
    const stripe = L.tier >= 2 ? L.trim : L.sec;
    g.rect(7, 19, 7, 29, stripe); g.rect(24, 19, 24, 29, stripe);
    g.rect(11, 32, 11, 40, stripe); g.rect(20, 32, 20, 40, stripe);
    g.rect(15, 19, 16, 29, ramp(L.main).dk); g.rect(13, 18, 18, 18, L.sec);
    if (/kit|explorer|trail/.test(L.name.toLowerCase())) { g.rect(10, 26, 21, 27, ramp(L.sec).lo); g.px(13, 27, L.trim); g.px(18, 27, L.trim); }
    if (L.tier >= 3) { gem(g, 18, 21, { ...L, gem: '#ffd84a' }, 2); g.px(18, 20, '#c8401a'); g.px(19, 20, '#2f5bd0'); } // medal
  },
  robe(g, L) {
    if (L.tier >= 3) drawCape(g, L);
    if (L.hood) drawHood(g, L);
    const r = ramp(L.main);
    drawShoes(g, BASE.shoes);
    // floor-length body that flares out
    for (let y = 18; y <= 41; y++) {
      const flare = y < 30 ? 0 : Math.floor((y - 30) / 4) + 1;
      const x0 = 10 - flare, x1 = 21 + flare;
      for (let x = x0; x <= x1; x++) {
        let col = r.base;
        if (x === x0) col = r.hi;
        if (x >= x1 - 1) col = r.lo;
        if (y >= 30 && (x === 15 || x === 16)) col = r.lo;     // fold down the middle
        if (y === 41) col = r.dk;
        g.px(x, y, col);
      }
    }
    // wide sleeves
    for (const [x0, x1, fl] of [[7, 9, 6], [22, 24, 25]]) {
      g.shaded(x0, 19, x1, 28, L.main);
      g.rect(Math.min(x0, fl), 27, Math.max(x1, fl), 30, r.lo);
      g.shaded(x0, 31, x1, 31, SKIN);
    }
    g.rect(10, 28, 21, 29, L.sec);                              // sash
    g.px(17, 30, L.sec); g.px(18, 31, L.sec); g.px(16, 30, L.sec);
    trimLine(g, 9, 41, 22, 41, L);
    trimLine(g, 6, 30, 9, 30, L); trimLine(g, 22, 30, 25, 30, L);
    trimLine(g, 15, 18, 16, 27, L, 2);                          // front panel
    if (L.tier >= 2) gem(g, 15, 28, L);
    if (L.tier >= 4) { trimLine(g, 8, 36, 23, 36, L); }
    if (L.tier >= 5) {                                           // runes on the hem
      for (let x = 9; x <= 22; x += 3) { g.px(x, 38, L.gem, true); g.px(x + 1, 39, L.gem, true); }
      gem(g, 13, 19, L, 1); gem(g, 18, 19, L, 1);
    }
  },
  suit(g, L) {
    if (L.tier >= 5) drawCape(g, L);
    const pants = ramp(L.main).lo;
    drawLegs(g, pants); drawShoes(g, '#1a1a22', L.tier >= 3 ? L.trim : null);
    drawTorso(g, L.main); drawArms(g, L.main, 29);
    // shirt V, tie, lapels
    for (let y = 18; y <= 23; y++) { const w = Math.max(0, 3 - Math.floor((y - 18) / 2)); g.rect(15 - w, y, 16 + w, y, '#eceff4'); }
    g.rect(15, 19, 16, 25, L.sec); g.rect(15, 19, 16, 19, ramp(L.sec).hi);
    const lapel = L.tier >= 2 ? L.trim : ramp(L.main).dk;
    for (let i = 0; i < 5; i++) { g.px(12 + Math.floor(i / 2), 18 + i, lapel, L.tier >= 5); g.px(19 - Math.floor(i / 2), 18 + i, lapel, L.tier >= 5); }
    g.px(15, 27, ramp(L.main).dk); g.px(15, 25, ramp(L.main).dk);
    if (L.tier >= 1) { g.px(12, 22, L.sec); g.px(12, 23, L.sec); }      // pocket square
    if (L.tier >= 2) gem(g, 19, 22, L, 1);                          // brooch
    trimLine(g, 7, 29, 9, 29, L, 3); trimLine(g, 22, 29, 24, 29, L, 3);
    if (L.tier >= 5) { trimLine(g, 10, 29, 21, 29, L); g.rect(8, 17, 10, 19, L.trim, true); g.rect(21, 17, 23, 19, L.trim, true); }
  },
  uniform(g, L) {
    drawLegs(g, L.main); drawShoes(g, '#1a1a22', L.tier >= 2 ? L.trim : null);
    drawTorso(g, L.main); drawArms(g, L.main, 29);
    for (let y = 20; y <= 28; y += 2) { g.px(13, y, L.tier >= 2 ? L.trim : L.sec); g.px(18, y, L.tier >= 2 ? L.trim : L.sec); }
    g.rect(12, 18, 19, 18, L.sec);
    trimLine(g, 10, 29, 21, 29, L);
    if (L.tier >= 3) { g.rect(8, 18, 10, 19, L.trim); g.rect(21, 18, 23, 19, L.trim); gem(g, 17, 21, L, 1); }
  },
  overalls(g, L) {
    drawShoes(g, BASE.shoes);
    drawTorso(g, L.sec); drawArms(g, L.sec, 22);
    drawLegs(g, L.main);
    g.shaded(12, 21, 19, 29, L.main);
    g.rect(12, 18, 13, 21, L.main); g.rect(18, 18, 19, 21, L.main);
    g.rect(14, 24, 17, 26, ramp(L.main).lo);
    gem(g, 12, 21, L.tier >= 2 ? L : { ...L, gem: '#c9ccd6' }, 1); gem(g, 19, 21, L.tier >= 2 ? L : { ...L, gem: '#c9ccd6' }, 1);
    trimLine(g, 11, 40, 15, 40, L); trimLine(g, 16, 40, 20, 40, L);
  },
  apron(g, L) {
    baseClothes(g);
    g.shaded(11, 20, 20, 36, L.main);
    g.rect(12, 18, 12, 19, L.main); g.rect(19, 18, 19, 19, L.main);
    g.rect(13, 27, 18, 30, ramp(L.main).lo);
    g.rect(10, 26, 21, 26, L.sec);
    trimLine(g, 11, 36, 20, 36, L);
    if (L.tier >= 2) { g.px(14, 28, L.trim); g.px(17, 28, L.trim); }
  },
  armour(g, L) {
    if (L.tier >= 3) drawCape(g, L);
    const m = ramp(L.main);
    drawLegs(g, L.sec);
    // greaves + boots
    for (const [x0, x1] of [[11, 15], [16, 20]]) {
      g.shaded(x0, 36, x1, 40, L.main); g.rect(x0, 35, x1, 35, m.hi); g.px(x0 + 2, 37, L.trim, L.tier >= 5);
    }
    drawShoes(g, m.dk, L.trim);
    // chest plate
    g.shaded(10, 18, 21, 29, L.main);
    g.rect(12, 19, 12, 27, m.hi); g.rect(11, 23, 20, 23, m.lo); g.rect(11, 26, 20, 26, m.lo);
    g.rect(15, 18, 16, 28, m.lo); g.rect(15, 18, 15, 28, m.base);
    // gauntlets
    drawArms(g, L.sec, 26); g.shaded(7, 27, 9, 31, L.main); g.shaded(22, 27, 24, 31, L.main);
    // pauldrons
    for (const [x0, x1] of [[6, 10], [21, 25]]) {
      g.rect(x0, 17, x1, 20, m.base); g.rect(x0, 17, x1, 17, m.hi); g.rect(x0, 20, x1, 20, m.dk);
      g.rect(x0 + 1, 16, x1 - 1, 16, m.hi);
      trimLine(g, x0, 21, x1, 21, L);
      if (L.tier >= 4) gem(g, x0 + 2, 18, L, 1);
    }
    g.rect(10, 29, 21, 29, ramp(L.sec).lo);                      // belt
    gem(g, 15, 29, L.tier >= 2 ? L : { ...L, gem: '#c9ccd6' }, 1); g.px(16, 29, ramp(L.tier >= 2 ? L.gem : '#c9ccd6').lo);
    if (L.tier >= 2) gem(g, 15, 21, L);
    if (L.tier >= 5) {                                            // glowing seams
      for (const y of [23, 26]) for (let x = 11; x <= 20; x += 2) g.px(x, y, L.trim, true);
      g.rect(14, 20, 17, 20, L.trim, true);
    }
  },
  shorts(g, L) {
    drawTorso(g, BASE.top); drawArms(g, BASE.top, 22); drawShoes(g, BASE.shoes);
    drawLegs(g, L.main, 34); trimLine(g, 11, 34, 20, 34, L);
  },
  legs(g, L) {
    drawTorso(g, BASE.top); drawArms(g, BASE.top, 22); drawShoes(g, BASE.shoes);
    drawLegs(g, L.main); g.rect(11, 30, 20, 30, ramp(L.main).dk); trimLine(g, 11, 40, 20, 40, L);
  },
  head(g, L) { baseClothes(g); },
  feet(g, L) { baseClothes(g, { shoes: false }); drawFeetItem(g, L); },
};

// Build the avatar as a static grid. Returns { grid, look }.
export function buildAvatar(outfitId) {
  const g = new Grid(AW, AH);
  g.oy = OY;
  const L = outfitId ? outfitLook(outfitId) : null;
  if (!L) {
    baseClothes(g);
    drawHead(g, null, false);
  } else {
    ARCH[L.arch](g, L);
    const hat = L.arch === 'head';
    drawHead(g, L.tier >= 5 ? L : null, hat);
    if (hat) drawHat(g, L);
  }
  g.oy = 0;
  g.outline();
  return { grid: g, look: L };
}

// ---------- animated rendering ----------
function auraMask(grid, dist = 2) {
  const out = [];
  for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) {
    if (grid.c[y][x]) continue;
    let near = 99;
    for (let dy = -dist; dy <= dist; dy++) for (let dx = -dist; dx <= dist; dx++) if (grid.filled(x + dx, y + dy)) near = Math.min(near, Math.max(Math.abs(dx), Math.abs(dy)));
    if (near <= dist) out.push([x, y, near]);
  }
  return out;
}

function makeParticle(fx, look, w, h, rnd) {
  const p = { x: 6 + rnd() * (w - 12), y: h - 8 - rnd() * 10, vx: 0, vy: 0, life: 0, max: 60 + rnd() * 60, col: look.trim, size: 1 };
  switch (fx) {
    case 'embers': p.vy = -(0.15 + rnd() * 0.25); p.vx = (rnd() - 0.5) * 0.1; p.col = rnd() < 0.5 ? look.sec : look.trim; break;
    case 'stars': p.x = 2 + rnd() * (w - 4); p.y = 4 + rnd() * (h - 12); p.max = 40 + rnd() * 50; p.col = rnd() < 0.3 ? '#ffffff' : look.gem; p.twinkle = true; break;
    case 'leaves': p.y = 4 + rnd() * 8; p.vy = 0.12 + rnd() * 0.12; p.vx = 0.08; p.col = rnd() < 0.5 ? look.sec : look.gem; p.sway = rnd() * 6; break;
    case 'wisps': p.vy = -(0.08 + rnd() * 0.1); p.col = look.gem; p.sway = rnd() * 6; p.size = 1; break;
    case 'rainbow': p.vy = -(0.1 + rnd() * 0.2); p.hue = rnd() * 360; break;
    case 'light': p.x = 8 + rnd() * (w - 16); p.vy = -(0.25 + rnd() * 0.2); p.col = rnd() < 0.5 ? '#fff6c0' : look.trim; break;
    case 'dust': p.vy = -(0.05 + rnd() * 0.08); p.vx = (rnd() - 0.5) * 0.2; p.y = h - 6; p.col = look.trim; break;
    default: p.x = 2 + rnd() * (w - 4); p.y = 4 + rnd() * (h - 10); p.max = 30 + rnd() * 40; p.col = rnd() < 0.5 ? '#ffffff' : look.gem; p.twinkle = true;
  }
  return p;
}

// Draw an animated avatar onto a canvas. Returns a stop() function.
export function mountAvatar(canvas, outfitId, { scale = 6, animate = true } = {}) {
  const { grid, look } = buildAvatar(outfitId);
  const tier = look ? look.tier : 0;
  const base = grid.toCanvas(0);
  const bright = grid.toCanvas(1);
  const aura = tier >= 4 ? auraMask(grid, tier >= 5 ? 3 : 2) : [];
  const auraCol = look ? (tier >= 5 ? look.gem : look.trim) : null;
  canvas.width = AW * scale; canvas.height = AH * scale;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const rnd = rng32(hashStr(outfitId || 'none') ^ 99);
  const parts = [];
  let raf = 0, t = 0, stopped = false;

  const frame = () => {
    t++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bob = animate && Math.floor(t / 30) % 2 ? scale : 0;       // 2-frame idle breathing
    // aura
    if (aura.length) {
      const pulse = 0.5 + 0.5 * Math.sin(t / 22);
      for (const [x, y, d] of aura) {
        const a = (tier >= 5 ? 0.42 : 0.28) * (1 - (d - 1) / 3) * (0.55 + 0.45 * pulse);
        ctx.fillStyle = auraCol; ctx.globalAlpha = a;
        ctx.fillRect(x * scale, y * scale + bob, scale, scale);
      }
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(base, 0, bob, AW * scale, AH * scale);
    if (tier >= 5) {                                                  // glowing runes pulse
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t / 14);
      ctx.drawImage(bright, 0, bob, AW * scale, AH * scale);
      ctx.globalAlpha = 1;
    }
    // particles
    if (look && look.fx && animate) {
      if (parts.length < 18 && rnd() < 0.35) parts.push(makeParticle(look.fx, look, AW, AH, rnd));
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life++;
        p.x += p.vx + (p.sway ? Math.sin((p.life + p.sway * 10) / 12) * 0.12 : 0);
        p.y += p.vy;
        if (p.life > p.max) { parts.splice(i, 1); continue; }
        const k = p.life / p.max;
        let a = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
        if (p.twinkle) a = Math.sin(k * Math.PI);
        ctx.globalAlpha = Math.max(0, a);
        ctx.fillStyle = p.hue !== undefined ? hsl(p.hue + t * 2, 0.9, 0.65) : p.col;
        const px = Math.round(p.x) * scale, py = Math.round(p.y) * scale;
        ctx.fillRect(px, py, scale, scale);
        if (p.twinkle && a > 0.7) {                                   // little cross sparkle
          ctx.globalAlpha = a * 0.6;
          ctx.fillRect(px - scale, py, scale, scale); ctx.fillRect(px + scale, py, scale, scale);
          ctx.fillRect(px, py - scale, scale, scale); ctx.fillRect(px, py + scale, scale, scale);
        }
      }
      ctx.globalAlpha = 1;
    }
    if (animate && !stopped) raf = requestAnimationFrame(frame);
  };
  frame();
  return () => { stopped = true; cancelAnimationFrame(raf); };
}

// Static icon of an outfit item: the relevant part of the avatar wearing it.
export function outfitIcon(outfitId, scale = 4) {
  const { grid, look } = buildAvatar(outfitId);
  const crop = look.arch === 'head' ? [7, 0, 18, 22]
    : look.arch === 'feet' ? [5, 40, 22, 10]
    : look.arch === 'shorts' || look.arch === 'legs' ? [7, 34, 18, 15]
    : [3, 20, 26, 28];
  const [x, y, w, h] = crop;
  const src = grid.toCanvas(look.tier >= 5 ? 0.6 : 0);
  const cv = document.createElement('canvas'); cv.width = w * scale; cv.height = h * scale;
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, x, y, w, h, 0, 0, w * scale, h * scale);
  return cv.toDataURL();
}

// ---------- hand-drawn pets (front-facing, 16x16, left half mirrored) ----------
// Letters map to each pet's palette; '.' is empty. Outline is added automatically,
// and the right-hand side is shaded darker for depth.
const PETS = {
  'fitness.fox': {
    pal: { a: '#e0782a', b: '#a8501c', c: '#f6efe4', d: '#3a2418', e: '#1a1630', w: '#ffffff', n: '#1a1630' },
    half: ['........', '.b......', '.ab.....', '.adb....', '.adab...', '.aaaaaaa', 'baaaaaaa', 'aaewaaaa', 'aaeeaaaa', 'caaaaaaa',
      'cccaaaac', '.ccccccn', '..cccccc', '...aaacc', '...aaacc', '...dd.cc'],
  },
  'intelligence.owl': {
    pal: { a: '#8a5a34', b: '#5e3a1e', c: '#e8d2a8', d: '#f2c14e', e: '#1a1630', w: '#ffffff' },
    half: ['........', '.b......', '.bb.....', '..baaaaa', '.baaaaaa', '.acccaaa', 'acddddca', 'acdweedc', 'acddddca', 'aaccccad',
      'bacccccd', 'baccbccc', 'bacccccc', '.baccbcc', '..bacccc', '....d..d'],
  },
  'fitness.cheetah': {
    pal: { a: '#e8b648', b: '#b58324', c: '#f7ecd2', s: '#3a2a18', e: '#1a1630', w: '#ffffff', n: '#3a2a18' },
    half: ['........', '..b.....', '.bab....', '.aaaaaaa', 'aasaaasa', 'aaaaasaa', 'aaewaaaa', 'saeeaaaa', 'aaasaaaa', 'caasaaac',
      'ccaaaaac', '.ccccccn', '..cccccc', '...asacc', '...aaacc', '...bb.cc'],
  },
  'fitness.pegasus': {
    pal: { a: '#f4f1ff', b: '#c3bce6', c: '#ffd84a', d: '#9fd3ff', e: '#1a1630', w: '#ffffff', n: '#e8a0b0' },
    half: ['......cc', '....a.cc', '....aacc', 'd...aaac', 'dd..aaaa', 'ddd.aaaa', 'dddaewaa', 'ddbaeeaa', '.dbaaaaa', '..baaaaa',
      '...baaaa', '...bbaaa', '...bbnaa', '....bbbb', '....a.aa', '....c.cc'],
    aura: '#ffe680',
  },
  'mindfulness.jade-dragon': {
    pal: { a: '#2fae6a', b: '#1d7a48', c: '#cdeeb0', d: '#ffd25e', e: '#1a1630', w: '#ffffff' },
    half: ['..d.....', '..dd....', '...db...', 'b..bbaaa', 'bb.baaaa', 'bbbaaaaa', 'bbaaewaa', '.baaeeaa', '.baaaaaa', '..baaacc',
      '..bacccc', '...bcccc', '...bacbc', '...baccc', '...ba.cc', '...dd...'],
    aura: '#7dffc0',
  },
  'housekeeping.kitsune': {
    pal: { a: '#f6f2ec', b: '#cfc6d8', c: '#ffffff', d: '#e0587a', e: '#1a1630', w: '#ffffff', f: '#6ad0ff', n: '#e0587a' },
    half: ['f.......', 'ff.a....', '.f.ab...', 'ff.adb..', '.fadaab.', 'f.aaaaaa', '.baaaaaa', '.adeaaaa', '.adeeaaa', '.aaaaaaa',
      '..baaaaa', '..bccccn', '...ccccc', 'f..aaacc', 'ff.aaacc', '.f.dd.cc'],
    aura: '#9fe0ff',
  },
};
export const DETAILED_PETS = Object.keys(PETS);

function buildPet(id) {
  const P = PETS[id];
  const g = new Grid(22, 22);
  const eyes = [];
  g.oy = 3;
  P.half.forEach((row, y) => {
    const full = row + [...row].reverse().join('');
    [...full].forEach((ch, x) => {
      const col = P.pal[ch];
      if (!col) return;
      const shade = x >= 11 && (ch === 'a' || ch === 'c') ? adj(col, -0.08, 0, 8) : col;
      g.px(x + 3, y, shade);
      if (ch === 'e' || ch === 'w') eyes.push([x + 3, y + 3]);
    });
  });
  g.oy = 0;
  g.outline();
  return { g, P, eyes };
}

export function mountPet(canvas, id, { scale = 6, animate = true } = {}) {
  const { g, P, eyes } = buildPet(id);
  const tier = RARITY[ITEM[id].rarity].index;
  const img = g.toCanvas();
  // blink frame: replace eye pixels with lid colour
  const blink = new Grid(22, 22);
  blink.c = g.c.map((row) => row.slice());
  for (const [x, y] of eyes) blink.c[y][x] = adj(P.pal.a, -0.15);
  const blinkImg = blink.toCanvas();
  const aura = P.aura || tier >= 4 ? auraMask(g, tier >= 6 ? 3 : 2) : [];
  canvas.width = 22 * scale; canvas.height = 22 * scale;
  const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const rnd = rng32(hashStr(id));
  let t = 0, raf = 0, stopped = false;
  const sparkles = [];
  const frame = () => {
    t++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const hop = animate && Math.floor(t / 24) % 2 ? scale : 0;
    if (aura.length) {
      const pulse = 0.5 + 0.5 * Math.sin(t / 20);
      for (const [x, y, d] of aura) {
        ctx.globalAlpha = 0.35 * (1 - (d - 1) / 3) * (0.5 + 0.5 * pulse);
        ctx.fillStyle = P.aura || RARITY[ITEM[id].rarity].color;
        ctx.fillRect(x * scale, y * scale + hop, scale, scale);
      }
      ctx.globalAlpha = 1;
    }
    const blinking = animate && t % 180 > 172;
    ctx.drawImage(blinking ? blinkImg : img, 0, hop, 22 * scale, 22 * scale);
    if (tier >= 6 && animate) {
      if (sparkles.length < 8 && rnd() < 0.2) sparkles.push({ x: Math.floor(rnd() * 22), y: Math.floor(rnd() * 22), life: 0, max: 30 + rnd() * 30 });
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i]; s.life++;
        if (s.life > s.max) { sparkles.splice(i, 1); continue; }
        ctx.globalAlpha = Math.sin((s.life / s.max) * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(s.x * scale, s.y * scale, scale, scale);
      }
      ctx.globalAlpha = 1;
    }
    if (animate && !stopped) raf = requestAnimationFrame(frame);
  };
  frame();
  return () => { stopped = true; cancelAnimationFrame(raf); };
}
