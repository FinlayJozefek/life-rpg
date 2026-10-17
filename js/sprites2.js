// TRIAL v2: more detailed pixel art (v1 is saved in sprites-v1.js). Avatar outfits change shape (robes, armour,
// suits, hats...) and scale up with rarity: trim -> gems -> capes -> aura ->
// animated mythic effects. Not used by the game yet; see dev/art.html.
import { ITEM, RARITY, SKILL, slotFor } from './data.js';
import { PET_ART, petDrawing } from './pets.js';

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
  const slot = slotFor(name);
  if (slot !== 'body') return slot;
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
  const high = /boot|welli/.test(n) && !L.underRobe;   // tall boots would poke through a robe
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

// ---------- v2 detail pass (Common to Legendary; Mythics keep the v1 look) ----------
const MATERIALS = [
  [/denim|jean/, 'denim'], [/cardigan|beanie|woolly|scarf|sweatband/, 'knit'], [/tweed/, 'tweed'],
  [/velvet|tuxedo/, 'velvet'], [/farmer|dungaree|harvest/, 'plaid'], [/fleece|hoodie|jogger|comfy|track|olympian/, 'fleece'],
  [/linen|robe|gown|smock|monk|lotus|cloak/, 'linen'], [/leather|wax|waterproof/, 'leather'], [/hi-vis|hydration|vest/, 'mesh'],
];
const materialFor = (name) => { const n = name.toLowerCase(); return (MATERIALS.find(([re]) => re.test(n)) || [null, 'cloth'])[1]; };

function get(g, x, y) { const yy = y + (g.oy || 0); return yy >= 0 && yy < g.h && x >= 0 && x < g.w ? g.c[yy][x] : null; }
function isOf(g, x, y, base) { const r = ramp(base); const c = get(g, x, y); return c === r.base || c === r.hi || c === r.lo; }
function onMain(g, L, pts, col) { if (!col) return; for (const [x, y] of pts) if (isOf(g, x, y, L.main)) g.px(x, y, col); }

// Fabric texture over the garment's own colour only (trims, skin and gems are left alone).
function texture(g, base, kind, seed) {
  const r = ramp(base);
  const own = new Set([r.base, r.hi]);
  const rnd = rng32(hashStr(seed));
  // Low-contrast, ordered patterns read as fabric; random speckle reads as stains.
  const dark = adj(base, -0.045, 0, 4), light = adj(base, 0.05, 0, -3), sheen = adj(base, 0.11, 0.04, -5);
  for (let y = -OY; y < AH - OY; y++) for (let x = 0; x < AW; x++) {
    if (!own.has(get(g, x, y))) continue;
    let out = null;
    switch (kind) {
      case 'knit': out = y % 2 === 0 ? (x % 2 === 0 ? dark : null) : (x % 2 === 1 ? light : null); break;
      case 'denim': out = (x + y) % 3 === 0 ? dark : null; break;
      case 'tweed': out = (x * 7 + y * 3) % 5 === 0 ? dark : (x * 3 + y * 5) % 7 === 0 ? light : null; break;
      case 'velvet': out = (x + y) % 7 === 0 ? sheen : (x + y) % 7 === 1 ? light : null; break;
      case 'plaid': out = x % 4 === 0 && y % 4 === 0 ? adj(base, -0.12) : x % 4 === 0 || y % 4 === 0 ? adj(base, -0.07) : null; break;
      case 'fleece': out = (x * 3 + y * 5) % 7 === 0 ? light : null; break;
      case 'linen': out = y % 3 === 0 && (x + y) % 2 === 0 ? light : null; break;
      case 'leather': out = (x * 5 + y * 3) % 11 === 0 ? sheen : null; break;
      case 'mesh': out = x % 2 === 0 && y % 2 === 0 ? dark : null; break;
      default: out = (x + 2 * y) % 6 === 0 ? light : null;
    }
    if (out) g.px(x, y, out);
  }
}

// Fabric folds/creases: shadows at elbows, waist and behind knees; light on kneecaps.
function folds(g, L) {
  // (Loose fold pixels on the chest read as stains, so only elbows, waist and knees get them.)
  const lo = adj(L.main, -0.09, 0.02, 0), hi = adj(L.main, 0.09, 0, 0);
  onMain(g, L, [[8, 24], [8, 25], [23, 24], [23, 25]], lo);
  for (let x = 11; x <= 20; x++) onMain(g, L, [[x, 28]], (x % 3 === 0) ? lo : null);   // gathered hem
  onMain(g, L, [[12, 35], [13, 35], [17, 35], [18, 35]], hi);
  onMain(g, L, [[13, 33], [18, 33], [12, 38], [19, 38], [14, 39], [17, 39]], lo);
}

// Dashed stitching along a hem.
function stitch(g, L, x0, x1, y, col) { for (let x = x0; x <= x1; x += 2) if (isOf(g, x, y, L.main)) g.px(x, y, col); }

function chestEmblem(g, L, cx = 13, cy = 21) {
  if (!isOf(g, cx, cy, L.main)) return;
  g.px(cx, cy - 1, L.trim); g.px(cx - 1, cy, L.trim); g.px(cx + 1, cy, L.trim); g.px(cx, cy + 1, L.trim);
  g.px(cx, cy, L.gem);
}

function epaulettes(g, L) {
  for (const [x0, x1] of [[7, 10], [21, 24]]) {
    g.rect(x0, 18, x1, 19, L.trim); g.rect(x0, 18, x1, 18, adj(L.trim, 0.12));
    for (let x = x0; x <= x1; x += 2) g.px(x, 20, adj(L.trim, -0.12));   // fringe
  }
}

function buttonsDown(g, x, y0, y1, col, step = 2) { for (let y = y0; y <= y1; y += step) { g.px(x, y, col); } }

function shoeDetail(g, L, kind) {
  // laces + light soles on trainers, shine on dress shoes, buckles on boots
  for (const [x0, x1] of [[10, 15], [16, 21]]) {
    if (kind === 'trainer') { g.px(x0 + 2, 41, '#f4f1ea'); g.px(x0 + 4, 41, '#f4f1ea'); g.rect(x0, 42, x1, 42, '#e6e0d4'); g.px(x1, 42, '#b8b0a2'); }
    else if (kind === 'dress') { g.px(x0 + 1, 41, '#9aa0b8'); g.px(x0 + 2, 41, '#c8ccdd'); }
    else if (kind === 'boot') { g.px(x0 + 2, 38, L.tier >= 2 ? L.trim : '#c9ccd6'); g.rect(x0, 42, x1, 42, '#2a221c'); }
  }
}

function hatDetail(g, L) {
  const n = L.name.toLowerCase();
  const r = ramp(L.main);
  if (/crown/.test(n)) {          // filigree band
    for (let x = 11; x <= 20; x += 2) g.px(x, 3, '#fff1a8');
    g.px(12, 1, '#ff4a6a'); g.px(19, 1, '#4ab0ff');
    return;
  }
  if (/beanie|woolly/.test(n)) { texture(g, L.main, 'knit', L.name); g.rect(15, -1, 16, 0, '#f4f1ea'); g.rect(11, 5, 20, 5, adj(L.main, -0.1)); return; }
  if (/straw/.test(n)) { for (let x = 7; x <= 24; x += 2) g.px(x, 5, '#f2d98a'); g.rect(11, 4, 20, 4, L.sec); return; }
  if (/cap$/.test(n) && !/graduation/.test(n)) { g.px(15, 0, r.hi); g.px(16, 0, r.hi); g.rect(15, 1, 15, 4, r.lo); g.rect(18, 1, 18, 4, r.lo); g.rect(17, 5, 23, 5, adj(L.main, 0.08)); return; }
  if (/chef/.test(n)) { g.rect(13, -2, 13, 3, '#e2dccd'); g.rect(17, -2, 17, 3, '#e2dccd'); g.rect(11, 4, 20, 4, '#cfc7b6'); return; }
  if (/ranger/.test(n)) { g.rect(11, 4, 20, 4, ramp(L.sec).dk); g.px(19, 3, L.gem); return; }
  if (/graduation/.test(n)) { g.px(23, 7, L.trim); g.px(22, 7, L.trim); return; }
  if (/hard hat/.test(n)) { g.rect(12, 2, 13, 4, '#ffe37a'); g.rect(10, 6, 21, 6, '#b88a14'); return; }
  if (/beret/.test(n)) { g.px(17, 0, r.lo); g.px(18, 0, r.lo); return; }
}

function detailPass(g, L) {
  const n = L.name.toLowerCase();
  const mat = materialFor(L.name);
  const piping = L.tier >= 3 ? L.trim : L.tier >= 1 ? adj(L.sec, 0.08) : adj(L.main, -0.14);
  const lo = adj(L.main, -0.15, 0.02, 8);

  if (!['head', 'feet'].includes(L.arch)) { texture(g, L.main, mat, L.name); folds(g, L); }

  switch (L.arch) {
    case 'top': {
      const short = /tee|t-shirt|polo|vest/.test(n);
      if (/tee|t-shirt/.test(n)) { g.rect(14, 18, 17, 18, ramp(SKIN).lo); g.rect(13, 18, 13, 18, lo); g.rect(18, 18, 18, 18, lo); if (/band/.test(n)) { g.rect(13, 22, 18, 25, ramp(L.sec).lo); g.px(14, 23, '#f4f1ea'); g.px(16, 24, '#f4f1ea'); g.px(17, 23, '#f4f1ea'); } }
      if (/polo/.test(n)) { g.rect(13, 18, 18, 19, L.sec); g.px(15, 20, '#f4f1ea'); g.px(15, 22, '#f4f1ea'); }
      if (/jacket|fleece|cardigan/.test(n)) {
        g.px(15, 20, '#c9ccd6'); g.px(16, 20, '#c9ccd6'); g.px(16, 21, '#9aa0b8');                          // zip pull
        g.rect(11, 25, 13, 25, lo); g.rect(18, 25, 20, 25, lo);                                               // pocket flaps
        g.rect(7, 28, 9, 29, adj(L.main, -0.1)); g.rect(22, 28, 24, 29, adj(L.main, -0.1));                   // cuffs
        g.rect(12, 17, 19, 17, L.sec); g.px(12, 18, L.sec); g.px(19, 18, L.sec);                            // raised collar
        if (/cardigan/.test(n)) { g.rect(15, 18, 16, 22, BASE.top); buttonsDown(g, 15, 23, 28, L.tier >= 2 ? L.trim : '#c9b48a'); }
        if (/chef/.test(n)) { buttonsDown(g, 13, 20, 28, '#f4f1ea'); buttonsDown(g, 18, 20, 28, '#f4f1ea'); }
      }
      if (/hoodie/.test(n)) { g.rect(11, 15, 20, 17, adj(L.main, -0.12)); g.px(14, 19, '#f4f1ea'); g.px(14, 20, '#f4f1ea'); g.px(17, 19, '#f4f1ea'); g.px(17, 20, '#f4f1ea'); g.rect(12, 24, 19, 24, lo); }
      if (/hi-vis/.test(n)) { g.rect(10, 22, 21, 22, '#e8eef4'); g.rect(10, 26, 21, 26, '#e8eef4'); g.rect(12, 18, 12, 29, '#e8eef4'); g.rect(19, 18, 19, 29, '#e8eef4'); }
      if (/hydration/.test(n)) { g.rect(11, 20, 12, 24, '#7fc4f0'); g.rect(19, 20, 20, 24, '#7fc4f0'); g.px(11, 20, '#e8eef4'); g.px(20, 20, '#e8eef4'); }
      if (/scarf/.test(n)) { g.rect(11, 17, 20, 19, L.sec); g.rect(17, 20, 18, 26, L.sec); g.px(17, 27, L.trim); g.px(18, 27, L.trim); texture(g, L.sec, 'knit', 'scarf'); }
      if (/paint/.test(n)) { g.px(12, 21, '#e8435a'); g.px(18, 24, '#4a90e2'); g.px(14, 27, '#f0c020'); g.px(20, 22, '#5fbf5a'); }
      stitch(g, L, 10, 21, 29, piping);
      if (!short) { stitch(g, L, 7, 9, 29, piping); stitch(g, L, 22, 24, 29, piping); }
      if (L.tier >= 2) chestEmblem(g, L);
      if (L.tier >= 3) { epaulettes(g, L); g.rect(12, 18, 19, 18, L.trim); }
      shoeDetail(g, L, 'trainer');
      break;
    }
    case 'outfit': {
      g.px(15, 19, '#c9ccd6'); g.px(16, 19, '#c9ccd6'); g.px(16, 20, '#9aa0b8');
      g.rect(7, 28, 9, 29, adj(L.main, -0.12)); g.rect(22, 28, 24, 29, adj(L.main, -0.12));    // elastic cuffs
      g.rect(11, 40, 15, 40, adj(L.main, -0.12)); g.rect(16, 40, 20, 40, adj(L.main, -0.12));
      if (L.tier >= 1) { const s2 = adj(L.sec, 0.12); g.rect(12, 32, 12, 39, s2); g.rect(19, 32, 19, 39, s2); }   // second leg stripe
      if (/explorer|trail|kit/.test(n)) {                                     // bandolier + pouches
        for (let i = 0; i < 10; i++) g.px(11 + i, 19 + i, ramp(L.sec).dk);
        g.rect(11, 30, 13, 32, ramp(L.sec).base); g.rect(18, 30, 20, 32, ramp(L.sec).base); g.px(12, 30, L.trim); g.px(19, 30, L.trim);
      }
      if (/harvest/.test(n)) { g.rect(10, 18, 21, 19, '#e8c06a'); for (let x = 10; x <= 21; x += 3) g.px(x, 20, '#c8401a'); }
      if (/maid/.test(n)) { g.rect(12, 22, 19, 35, '#f4f1ea'); g.rect(12, 22, 19, 22, '#ffffff'); g.rect(11, 35, 20, 35, '#ffffff'); }
      if (/rockstar|gallery/.test(n)) { buttonsDown(g, 13, 20, 28, L.tier >= 2 ? L.trim : '#c9ccd6', 3); g.px(19, 21, L.gem); g.px(20, 22, L.gem); }
      if (/linen/.test(n)) { g.rect(14, 18, 17, 19, ramp(SKIN).lo); g.rect(10, 29, 21, 29, adj(L.sec, 0.1)); }
      if (L.tier >= 2) chestEmblem(g, L, 18, 22);
      if (L.tier >= 3) { epaulettes(g, L); stitch(g, L, 10, 21, 29, L.trim); }
      shoeDetail(g, L, 'trainer');
      break;
    }
    case 'robe': {
      // stole draped over the shoulders, lining showing at the front, extra skirt folds
      const stole = L.tier >= 1 ? L.sec : adj(L.main, -0.1);
      g.rect(12, 18, 13, 27, stole); g.rect(18, 18, 19, 27, stole);
      if (L.tier >= 2) { g.px(12, 27, L.trim); g.px(13, 27, L.trim); g.px(18, 27, L.trim); g.px(19, 27, L.trim); }
      for (let y = 31; y <= 40; y++) { g.px(15, y, ramp(L.sec).lo); g.px(16, y, ramp(L.sec).base); }
      for (let y = 32; y <= 40; y += 2) { g.px(12, y, lo); g.px(19, y, lo); g.px(10, y + 1, lo); g.px(21, y + 1, lo); }
      g.rect(13, 17, 18, 17, adj(L.main, -0.12));                                          // collar
      if (L.tier >= 2) { for (let x = 10; x <= 21; x += 2) g.px(x, 39, L.trim); g.px(15, 18, L.gem); }  // embroidered hem + clasp
      if (L.tier >= 3) { g.rect(12, 18, 12, 27, L.trim); g.rect(19, 18, 19, 27, L.trim); for (let x = 9; x <= 22; x += 2) { g.px(x, 37, L.gem); } }
      if (/artisan|artist/.test(n)) { g.px(12, 32, '#e8435a'); g.px(19, 35, '#4a90e2'); g.px(14, 37, '#f0c020'); }
      break;
    }
    case 'suit': {
      g.rect(11, 25, 13, 25, lo); g.rect(18, 25, 20, 25, lo);                                // pocket flaps
      const btn = L.tier >= 3 ? L.trim : L.tier >= 2 ? '#c9ccd6' : adj(L.main, -0.2);
      g.px(15, 26, btn); g.px(15, 28, btn);
      g.rect(7, 29, 9, 29, '#eceff4'); g.rect(22, 29, 24, 29, '#eceff4');                     // shirt cuffs
      g.rect(13, 32, 13, 40, adj(ramp(L.main).lo, 0.06)); g.rect(18, 32, 18, 40, adj(ramp(L.main).lo, 0.06)); // creases
      if (/tailcoat/.test(n)) { g.shaded(11, 30, 13, 37, L.main); g.shaded(18, 30, 20, 37, L.main); }
      if (/butler/.test(n)) { g.rect(13, 22, 18, 28, '#3a3a44'); g.px(15, 24, L.trim); g.px(15, 26, L.trim); }
      if (L.tier >= 3) { for (const [x, y] of [[11, 27], [12, 28], [13, 28], [14, 27]]) g.px(x, y, L.trim); g.px(19, 20, L.gem); epaulettes(g, L); }  // watch chain, lapel pin
      shoeDetail(g, L, 'dress');
      break;
    }
    case 'uniform': {
      g.rect(12, 17, 19, 17, adj(L.main, -0.08));                                            // collar band
      if (/chef|michelin/.test(n)) { g.rect(13, 18, 18, 19, L.sec); g.px(15, 20, L.sec); g.px(16, 20, L.sec); }  // neckerchief
      g.px(19, 21, '#4a90e2'); g.px(19, 22, '#c9ccd6');                                      // pen in pocket
      g.rect(18, 23, 20, 23, lo);
      if (L.tier >= 3) { chestEmblem(g, L, 12, 22); for (let x = 10; x <= 21; x += 2) g.px(x, 29, L.trim); }
      shoeDetail(g, L, 'dress');
      break;
    }
    case 'overalls': {
      texture(g, L.sec, /farmer/.test(n) ? 'plaid' : 'cloth', L.name + 'shirt');
      g.rect(13, 22, 18, 22, lo); stitch(g, L, 13, 18, 25, adj(L.main, 0.15));                // bib pocket + stitching
      g.rect(12, 35, 14, 37, ramp(L.sec).base); g.px(12, 35, adj(L.sec, 0.15));               // knee patch
      g.px(20, 31, '#c9ccd6'); g.px(20, 32, '#8a8f9c');                                      // tool loop / hammer
      if (L.tier >= 2) chestEmblem(g, L, 15, 23);
      shoeDetail(g, L, 'boot');
      break;
    }
    case 'apron': {
      g.px(10, 26, L.sec); g.px(9, 27, L.sec); g.px(22, 26, L.sec); g.px(22, 27, L.sec);      // ties
      g.px(14, 26, '#c9b48a'); g.px(14, 25, '#c9b48a'); g.px(17, 26, '#8a8f9c'); g.px(17, 25, '#5a5f6c');  // pencil + tool in pocket
      stitch(g, L, 11, 20, 33, adj(L.main, 0.15));
      if (L.tier >= 1) { g.px(12, 21, L.trim); g.px(19, 21, L.trim); }
      shoeDetail(g, L, 'boot');
      break;
    }
    case 'shorts': case 'legs': {
      g.rect(11, 30, 20, 30, adj(L.main, -0.14)); g.px(15, 31, '#f4f1ea'); g.px(16, 31, '#f4f1ea');  // waistband + drawstring
      g.rect(11, 32, 11, L.arch === 'shorts' ? 34 : 40, adj(L.sec, 0.1)); g.rect(20, 32, 20, L.arch === 'shorts' ? 34 : 40, adj(L.sec, 0.1));
      shoeDetail(g, L, 'trainer');
      break;
    }
    case 'feet': {
      shoeDetail(g, L, /boot|welli/.test(n) ? (L.underRobe ? 'dress' : 'boot') : /loafer|clog|slipper/.test(n) ? 'dress' : /sandal/.test(n) ? 'none' : 'trainer');
      if (/sock/.test(n) && !L.underRobe) { for (const x0 of [11, 16]) g.rect(x0, 38, x0 + 4, 40, L.main); }
      break;
    }
    default: break;
  }
}

// `gear` is { head, body, feet } item ids (any may be missing), or a single item id.
function normGear(gear) {
  if (!gear) return {};
  if (typeof gear === 'string') return { [ITEM[gear].slot]: gear };
  return gear;
}

// Build the avatar as a static grid. Returns { grid, look } where `look` is the
// highest-rarity piece worn (it drives the aura and Mythic effects).
export function buildAvatar(gearIn) {
  const gear = normGear(gearIn);
  const g = new Grid(AW, AH);
  g.oy = OY;
  const Lb = gear.body ? outfitLook(gear.body) : null;
  const Lf = gear.feet ? { ...outfitLook(gear.feet), underRobe: Lb?.arch === 'robe' } : null;
  const Lh = gear.head ? outfitLook(gear.head) : null;
  if (Lb) { ARCH[Lb.arch](g, Lb); if (Lb.tier < 5) detailPass(g, Lb); }
  else baseClothes(g, { shoes: !Lf });
  if (Lf) { drawFeetItem(g, Lf); if (Lf.tier < 5) detailPass(g, Lf); }
  const looks = [Lb, Lf, Lh].filter(Boolean).sort((a, b) => b.tier - a.tier);
  drawHead(g, looks.find((l) => l.tier >= 5 && l.eyes) || null, !!Lh);
  if (Lh) { drawHat(g, Lh); if (Lh.tier < 5) hatDetail(g, Lh); }
  g.oy = 0;
  g.outline();
  return { grid: g, look: looks[0] || null };
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
export function mountAvatar(canvas, gear, { scale = 6, animate = true } = {}) {
  const { grid, look } = buildAvatar(gear);
  const outfitId = JSON.stringify(normGear(gear));
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
// Static picture of the character wearing `gear` (for the dungeon fall animation etc.).
export function avatarDataUrl(gear, scale = 4) {
  const { grid } = buildAvatar(gear);
  const src = grid.toCanvas(0);
  const cv = document.createElement('canvas'); cv.width = AW * scale; cv.height = AH * scale;
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, AW * scale, AH * scale);
  return cv.toDataURL();
}

const iconCache = new Map();
export function outfitIcon(outfitId, { scale = 4, hidden = false } = {}) {
  const key = `${outfitId}|${scale}|${hidden}`;
  if (iconCache.has(key)) return iconCache.get(key);
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
  if (hidden) {                                      // undiscovered: flat silhouette
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#2a2f55';
    ctx.fillRect(0, 0, cv.width, cv.height);
  }
  const url = cv.toDataURL();
  iconCache.set(key, url);
  return url;
}

// ---------- detailed pets (front-facing, 16x16, left half mirrored; art in pets.js) ----------
// Outline is added automatically, and the right-hand side is shaded a touch darker.
export const DETAILED_PETS = Object.keys(PET_ART);

// Build a 22x22 sprite grid from a drawing { half (or full rows), pal }.
// Shared by pets and dungeon enemies. Full 16-char rows are used as-is; 8-char rows are mirrored.
export function buildDrawing(P) {
  const g = new Grid(22, 22);
  const eyes = [];
  g.oy = 3;
  P.half.forEach((row, y) => {
    const full = row.length >= 16 ? row : row + [...row].reverse().join('');
    [...full].forEach((ch, x) => {
      const col = P.pal[ch];
      if (!col) return;
      const shade = x >= 9 && (ch === 'a' || ch === 'c') ? adj(col, -0.07, 0, 6) : col;
      g.px(x + 3, y, shade);
      if (ch === 'e' || ch === 'w') eyes.push([x + 3, y + 3]);
    });
  });
  g.oy = 0;
  g.outline();
  return { g, P, eyes };
}
function buildPet(id) { return buildDrawing(petDrawing(id)); }

// Static icon for any drawing.
export function drawingIcon(P, { scale = 4, hidden = false } = {}) {
  const { g } = buildDrawing(P);
  const src = g.toCanvas();
  const cv = document.createElement('canvas'); cv.width = 22 * scale; cv.height = 22 * scale;
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, 22 * scale, 22 * scale);
  if (hidden) { ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = '#2a2f55'; ctx.fillRect(0, 0, cv.width, cv.height); }
  return cv.toDataURL();
}

const petIconCache = new Map();
// Static pet icon for lists and the Collection. `hidden` gives an undiscovered silhouette.
export function petIcon(id, { scale = 4, hidden = false } = {}) {
  const key = `${id}|${scale}|${hidden}`;
  if (petIconCache.has(key)) return petIconCache.get(key);
  const { g } = buildPet(id);
  const src = g.toCanvas();
  const cv = document.createElement('canvas'); cv.width = 22 * scale; cv.height = 22 * scale;
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, 22 * scale, 22 * scale);
  if (hidden) { ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = '#2a2f55'; ctx.fillRect(0, 0, cv.width, cv.height); }
  const url = cv.toDataURL();
  petIconCache.set(key, url);
  return url;
}

export function mountPet(canvas, id, opts = {}) {
  return mountDrawing(canvas, petDrawing(id), { tier: RARITY[ITEM[id].rarity].index, ...opts });
}

// Animated sprite (bob + blink; tier 4+ glows, tier 6 sparkles). Returns stop().
export function mountDrawing(canvas, drawing, { scale = 6, animate = true, tier = 0, auraColor = null } = {}) {
  const { g, P, eyes } = buildDrawing(drawing);
  const img = g.toCanvas();
  // blink frame: replace eye pixels with lid colour
  const blink = new Grid(22, 22);
  blink.c = g.c.map((row) => row.slice());
  for (const [x, y] of eyes) blink.c[y][x] = adj(P.pal.a, -0.15);
  const blinkImg = blink.toCanvas();
  const aura = tier >= 4 ? auraMask(g, tier >= 6 ? 3 : 2) : [];
  canvas.width = 22 * scale; canvas.height = 22 * scale;
  const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const rnd = rng32(hashStr(drawing.half.join("")));
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
        ctx.fillStyle = auraColor || P.aura || '#ffd84a';
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
