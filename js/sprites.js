// Placeholder pixel art, generated deterministically from each item's id so the
// same item always looks the same. Swap for hand-drawn sprites later.
import { RARITY, SKILL, ITEM } from './data.js';

const OUTLINE = '#120f17';
const cache = new Map();

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZE = 12;
const HALF = SIZE / 2;

const SHIRT_MASK = [
  '............',
  '...##..##...',
  '..########..',
  '.##########.',
  '.##########.',
  '.##.####.##.',
  '...######...',
  '...######...',
  '...######...',
  '...######...',
  '...######...',
  '............',
];

function makeGrid(item, rng) {
  const g = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  if (item.type === 'outfit') {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) g[y][x] = SHIRT_MASK[y][x] === '#' ? 1 : 0;
    // pattern: accent band, collar or stripes
    const style = Math.floor(rng() * 3);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (!g[y][x]) continue;
      if (style === 0 && (y === 6 || y === 7)) g[y][x] = 2;
      if (style === 1 && y === 2 && x >= 4 && x <= 7) g[y][x] = 2;
      if (style === 1 && x >= 5 && x <= 6 && y > 2) g[y][x] = 2;
      if (style === 2 && y % 3 === 0) g[y][x] = 2;
    }
    return g;
  }
  if (item.type === 'pet') {
    const rx = 3.2 + rng() * 1.6, ry = 3 + rng() * 1.8, cy = 6.5;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < HALF; x++) {
      const dx = (x - 5.5) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) g[y][x] = rng() < 0.2 ? 2 : 1;
    }
    // ears / horns
    const earX = 2 + Math.floor(rng() * 3);
    const top = Math.max(0, Math.floor(cy - ry) - 1);
    if (rng() < 0.75) { g[top][earX] = 2; if (top > 0) g[top - 1][earX] = 2; }
    // feet
    const fx = 3 + Math.floor(rng() * 2);
    if (rng() < 0.7 && Math.floor(cy + ry) + 1 < SIZE) g[Math.floor(cy + ry) + 1][fx] = 1;
    mirror(g);
    // eyes
    const ey = Math.round(cy - 1);
    g[ey][3] = g[ey][8] = 3;
    g[ey][4] = g[ey][7] = 4;
    return g;
  }
  // collection object: random symmetric blob, denser in the middle
  for (let y = 1; y < SIZE - 1; y++) for (let x = 1; x < HALF; x++) {
    const d = Math.hypot(x - 5.5, y - 5.5);
    const p = 0.95 - d * 0.14;
    if (rng() < p) g[y][x] = rng() < 0.3 ? 2 : 1;
  }
  mirror(g);
  return g;
}

function mirror(g) {
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < HALF; x++) g[y][SIZE - 1 - x] = g[y][x];
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v + amt * 255))));
  return `rgb(${c.join(',')})`;
}

function paletteFor(item, rng) {
  const skill = SKILL[item.skill];
  const rar = RARITY[item.rarity];
  const hue = (skill.hue + Math.floor(rng() * 60) - 30 + 360) % 360;
  const sat = 25 + Math.floor(rng() * 35);
  const light = 38 + Math.floor(rng() * 20);
  return {
    1: `hsl(${hue} ${sat}% ${light}%)`,
    1.5: `hsl(${hue} ${sat}% ${light - 12}%)`,
    2: rar.index >= 2 ? rar.color : `hsl(${(hue + 180) % 360} ${sat}% ${light + 10}%)`,
    2.5: rar.index >= 2 ? shade(rar.color, -0.2) : `hsl(${(hue + 180) % 360} ${sat}% ${light}%)`,
    3: '#f4f0e8',
    4: '#120f17',
  };
}

// Returns a data URL for the item sprite. `hidden` draws an undiscovered silhouette.
export function itemSprite(itemId, { hidden = false, scale = 4 } = {}) {
  const key = `${itemId}|${hidden}|${scale}`;
  if (cache.has(key)) return cache.get(key);
  const item = ITEM[itemId];
  const rng = mulberry32(hashStr(itemId));
  const grid = makeGrid(item, rng);
  const pal = paletteFor(item, rng);
  const c = document.createElement('canvas');
  c.width = c.height = SIZE * scale;
  const ctx = c.getContext('2d');
  const filled = (x, y) => y >= 0 && y < SIZE && x >= 0 && x < SIZE && grid[y][x] > 0;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const v = grid[y][x];
    let col = null;
    if (v) {
      if (hidden) col = '#2c2936';
      else {
        const lower = y > SIZE * 0.6 || !filled(x, y + 1) ;
        col = v === 1 ? (lower ? pal[1.5] : pal[1]) : v === 2 ? (lower ? pal[2.5] : pal[2]) : pal[v];
      }
    } else if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) {
      col = hidden ? '#1a1822' : OUTLINE;
    }
    if (col) { ctx.fillStyle = col; ctx.fillRect(x * scale, y * scale, scale, scale); }
  }
  // tiny highlight pixel for a bit of depth
  if (!hidden) {
    for (let y = 0; y < SIZE; y++) {
      const x = grid[y].findIndex((v) => v === 1);
      if (x >= 0) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect((x + 1) * scale, (y + 1) * scale, scale, scale); break; }
    }
  }
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}

// ---------- Avatar ----------
const AVATAR = [
  '................',
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohssssssho...',
  '...osesssseso...',
  '...osssssssso...',
  '....ossmmsso....',
  '.....osssso.....',
  '...otttttttto...',
  '..otttttttttto..',
  '.otTttttttttTto.',
  '.otTttttttttTto.',
  '.otTttttttttTto.',
  '.osottttttttoso.',
  '....oTTTTTTo....',
  '....oppppppo....',
  '....oppppppo....',
  '....oppooppo....',
  '....oppooppo....',
  '....oppooppo....',
  '...obbboobbbo...',
  '...oooooooooo...',
  '................',
];

export function avatarSprite(outfitId, scale = 8) {
  const key = `avatar|${outfitId}|${scale}`;
  if (cache.has(key)) return cache.get(key);
  let top = '#5d6270', topShade = '#4a4e5a', pants = '#363a47', boots = '#2b2420';
  if (outfitId) {
    const item = ITEM[outfitId];
    const pal = paletteFor(item, mulberry32(hashStr(outfitId)));
    top = pal[1]; topShade = pal[2]; pants = pal[1.5]; boots = pal[2.5];
  }
  const colors = {
    o: OUTLINE, h: '#4a3020', s: '#e0b088', m: '#b07858', e: '#1a1a1a',
    t: top, T: topShade, p: pants, b: boots,
  };
  const w = 16, h = AVATAR.length;
  const c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale;
  const ctx = c.getContext('2d');
  AVATAR.forEach((row, y) => [...row].forEach((ch, x) => {
    if (colors[ch]) { ctx.fillStyle = colors[ch]; ctx.fillRect(x * scale, y * scale, scale, scale); }
  }));
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}
