// Pixel-art skill icons (TRIAL — shown on dev/skill-icons.html, not used by the game yet).
// Each skill has a 16x16 symbol; a "style" puts it on a frame (none, shield, medallion, stone).

const SYMBOLS = {
  fitness: { pal: { a: '#9aa3b8', b: '#5a6278', c: '#e4e9f4', d: '#c89a5a', e: '#8a6234' }, rows: [
    '................', '................', '................', '................',
    '...ca......ac...', '.caab......baac.', '.caab......baac.', '.caabddddddbaac.',
    '.caabeeeeeebaac.', '.caab......baac.', '.caab......baac.', '...ab......ba...',
    '................', '................', '................', '................'] },
  intelligence: { pal: { a: '#3a5ab8', b: '#1f2f6a', c: '#f4ead2', d: '#9a8e74' }, rows: [
    '................', '................', '................', '..cccc....cccc..',
    '.ccccccbbcccccc.', '.cddddcbbcddddc.', '.ccccccbbcccccc.', '.cdddccbbccdddc.',
    '.ccccccbbcccccc.', '.cddddcbbcddddc.', '.ccccccbbcccccc.', 'aaaaaaabbaaaaaaa',
    '.aaaaaa..aaaaaa.', '................', '................', '................'] },
  cooking: { pal: { a: '#c8703a', b: '#7a3a1a', c: '#f0b080', d: '#3a2a20', e: '#e8eef8' }, rows: [
    '................', '.....e...e......', '......e...e.....', '.....e...e......',
    '.......dd.......', '...bbbbbbbbbb...', '..bccccccccccb..', '.aaaaaaaaaaaaaa.',
    'a.baaaaaaaaaab.a', '..baaaaaaaaaab..', '..baaaaaaaaaab..', '..bbaaaaaaaabb..',
    '...bbbbbbbbbb...', '................', '................', '................'] },
  farming: { pal: { a: '#e8b840', b: '#8a8a2a', c: '#fff0a0', d: '#c83a2a' }, rows: [
    '................', '....a...a...a...', '...aca.aca.aca..', '...aca.aca.aca..',
    '...aca.aca.aca..', '....b...b...b...', '.....b..b..b....', '......b.b.b.....',
    '.......bbb......', '.......bbb......', '......ddddd.....', '.......bbb......',
    '......b.b.b.....', '.....b..b..b....', '................', '................'] },
  foraging: { pal: { a: '#d8402a', b: '#8a1a10', c: '#f8f0e0', d: '#4a9a3a', e: '#c8bca8' }, rows: [
    '................', '................', '.....aaaaaa.....', '...aaaaaaaaaa...',
    '..aacaaaaaacaa..', '.aaccaaaaaaccaa.', '.aaaaaacaaaaaaa.', '.aaaaaccaaaaaaa.',
    '..bbbbbbbbbbbb..', '......cccc......', '......cccc......', '......ccce......',
    '......ccce......', '....dddddddd....', '................', '................'] },
  crafting: { pal: { a: '#8a909c', b: '#4a4e5a', c: '#d4d8e2', d: '#b8864a', e: '#7a5428' }, rows: [
    '................', '................', '..cccccccccccc..', '..aaaaaaaaaaab..',
    '..aaaaaaaaaaab..', '...bbbbbbbbbb...', '......dde.......', '......dde.......',
    '......dde.......', '......dde.......', '......dde.......', '......dde.......',
    '......dde.......', '......eee.......', '................', '................'] },
  artistry: { pal: { a: '#d8b47a', b: '#8a6a3a', d: '#e8435a', e: '#4a90e2', f: '#f0d040', g: '#5fbf5a' }, rows: [
    '................', '................', '................', '....aaaaaaa.....',
    '..aaaaaaaaaaa...', '.aadaaaaeaaaaa..', '.adddaaeeeaaaaa.', '.aadaaaaeaa..aa.',
    '.aaaaaaaaaa..aa.', '.aafaaaaaaaaaaa.', '.afffaagaaaaaab.', '..aafaaggaaaabb.',
    '...aaaaaaaabbb..', '.....bbbbbb.....', '................', '................'] },
  music: { pal: { a: '#ffc94a', b: '#a8781a', c: '#fff0b0' }, rows: [
    '................', '......aaaaaaa...', '......aaaaaaa...', '......a.....a...',
    '......a.....a...', '......a.....a...', '......a.....a...', '......a.....a...',
    '......a.....a...', '......a.....a...', '...caaa...caaa..', '..caaaa..caaaa..',
    '..aaaab..aaaab..', '...bbb....bbb...', '................', '................'] },
  mindfulness: { pal: { a: '#e888b8', b: '#3ab0b0', c: '#fff0f6' }, rows: [
    '................', '................', '................', '.......aa.......',
    '......acca......', '......acca......', '..a...acca...a..', '..aa..acca..aa..',
    '..aca.acca.aca..', '...acaaccaaca...', '.aaaacaccacaaaa.', '.accccaccacccca.',
    '..aaaaaaaaaaaa..', '...bbbbbbbbbb...', '.b..b..b..b..b..', '................'] },
  charisma: { pal: { c: '#f4ead2', d: '#e8435a', e: '#ffc94a' }, rows: [
    '................', '..............e.', '...cccccccccc...', '..cccccccccccc..',
    '.ccccddcddccccc.', '.ccccdddddccccc.', '.cccccdddcccccc.', '.ccccccdccccccc.',
    '..cccccccccccc..', '...cccccccccc...', '...cc...........', '..c.............',
    '................', '................', '................', '................'] },
  housekeeping: { pal: { a: '#e0c060', b: '#c83a2a', c: '#fff0a0', d: '#a8784a' }, rows: [
    '.............dd.', '............dd..', '...........dd...', '..........dd....',
    '.........dd.....', '........dd......', '.......dd.......', '......bbb.......',
    '.....bbbb.......', '....aaaaa.......', '...aaaaaaa......', '..aacaacaaa.....',
    '.aacaacaaa......', '.acaacaa........', '................', '................'] },
  labour: { pal: { a: '#9aa3b8', b: '#5a6278', c: '#e4e9f4', d: '#b8864a', e: '#7a5428' }, rows: [
    '................', '.....ccccc......', '...caaaaaaac....', '..aab..de..baa..',
    '.ab....de....ba.', '.b.....de.....b.', '.......de.......', '.......de.......',
    '.......de.......', '.......de.......', '.......de.......', '.......de.......',
    '.......de.......', '.......de.......', '.......ee.......', '................'] },
};

// Each skill's colour, used for the shield / medallion / stone frames.
export const SKILL_COLOR = {
  fitness: '#e0603a', intelligence: '#4a7ae0', cooking: '#e0a030', farming: '#8ab83a',
  foraging: '#3aa86a', crafting: '#a87a4a', artistry: '#c85ac0', music: '#8a5ae0',
  mindfulness: '#3ac0b0', charisma: '#e85a8a', housekeeping: '#5ab0e0', labour: '#c8963a',
};

export const STYLES = [
  { id: 'plain', name: 'Pixel', blurb: 'Just the pixel symbol, outlined.' },
  { id: 'shield', name: 'Crest', blurb: 'On a heraldic shield in the skill colour, gold trim.' },
  { id: 'medal', name: 'Medallion', blurb: 'On a round gold-rimmed coin.' },
  { id: 'stone', name: 'Rune stone', blurb: 'On a dark stone tile with a glowing edge.' },
];

const OUT = '#0a0b18';
const SIZE = 24;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v + amt * 255))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// Pixel grid helpers
const grid = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
function outline(g, col = OUT) {
  const add = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    if (g[y][x]) continue;
    const n = (dx, dy) => g[y + dy]?.[x + dx];
    if (n(-1, 0) || n(1, 0) || n(0, -1) || n(0, 1)) add.push([x, y]);
  }
  for (const [x, y] of add) g[y][x] = col;
}

function symbolGrid(skillId) {
  const s = SYMBOLS[skillId];
  const g = grid();
  s.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (s.pal[ch]) g[y + 4][x + 4] = s.pal[ch]; }));
  return g;
}

function frame(style, skillId) {
  const g = grid();
  const col = SKILL_COLOR[skillId];
  const gold = '#ffc94a', goldDark = '#b88a1c';
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const cx = x - 11.5, cy = y - 11.5;
    if (style === 'shield') {
      // flat top, straight sides, tapering to a point
      const half = y < 14 ? 11 : 11 - Math.round((y - 13) * 1.15);
      if (y < 1 || y > 22 || Math.abs(cx) > half) continue;
      const edge = y === 1 || Math.abs(cx) > half - 1.2 || (y >= 14 && Math.abs(cx) > half - 1.5);
      g[y][x] = edge ? (cx < 0 ? gold : goldDark) : shade(col, (11.5 - y) * 0.012 - (cx > 0 ? 0.06 : 0));
    } else if (style === 'medal') {
      const r = Math.hypot(cx, cy);
      if (r > 11.6) continue;
      g[y][x] = r > 10.2 ? (cx + cy < 0 ? gold : goldDark) : r > 9 ? shade(col, -0.1) : shade('#161a3a', -cy * 0.006);
    } else if (style === 'stone') {
      const corner = (Math.abs(cx) > 9.5 && Math.abs(cy) > 9.5);
      if (Math.abs(cx) > 11.5 || Math.abs(cy) > 11.5 || corner) continue;
      const edge = Math.abs(cx) > 10.5 || Math.abs(cy) > 10.5 || (Math.abs(cx) > 8.5 && Math.abs(cy) > 8.5);
      g[y][x] = edge ? col : shade('#2a2e44', ((x * 7 + y * 13) % 5 === 0 ? 0.04 : 0) - cy * 0.004);
    }
  }
  return g;
}

// ---------- Tiered icons: the frame upgrades as the skill levels up ----------
// 1-14 rune stone · 15-29 bronze · 30-44 silver crest · 45-59 gold crest + laurels · 60 legendary (wings, crown, animated)
export const TIERS = [
  { start: 1, name: 'Rune stone' }, { start: 15, name: 'Bronze' }, { start: 30, name: 'Silver crest' },
  { start: 45, name: 'Gold crest' }, { start: 60, name: 'Legendary' },
];
export const tierOf = (level) => (level >= 60 ? 4 : level >= 45 ? 3 : level >= 30 ? 2 : level >= 15 ? 1 : 0);
// 0-5 pips filled towards the next tier
export function pipsFor(level) {
  const t = tierOf(level);
  if (t === 4) return 5;
  const start = TIERS[t].start, end = TIERS[t + 1].start;
  return Math.floor(((level - start) / (end - start)) * 5);
}

const G = 32;          // tiered icons are 32x32 so wings, crown and laurels fit
const B = 4;           // the 24x24 frame box starts at (4,4)
const g32 = () => Array.from({ length: G }, () => Array(G).fill(null));
const put = (g, x, y, c) => { if (x >= 0 && y >= 0 && x < G && y < G) g[y][x] = c; };
function outline32(g, col = OUT) {
  const add = [];
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    if (g[y][x]) continue;
    const n = (dx, dy) => g[y + dy]?.[x + dx];
    if (n(-1, 0) || n(1, 0) || n(0, -1) || n(0, 1)) add.push([x, y]);
  }
  for (const [x, y] of add) g[y][x] = col;
}
const inShield = (bx, by) => { const half = by < 14 ? 11 : 11 - Math.round((by - 13) * 1.15); return by >= 1 && by <= 22 && Math.abs(bx - 11.5) <= half; };
const shieldEdge = (bx, by) => { const half = by < 14 ? 11 : 11 - Math.round((by - 13) * 1.15); return by <= 2 || Math.abs(bx - 11.5) > half - 1.5 || (by >= 14 && Math.abs(bx - 11.5) > half - 2); };

function tierFrame(tier, skillId) {
  const g = g32();
  const col = SKILL_COLOR[skillId];
  const METAL = [null, ['#e0a060', '#b87333', '#7a4318'], ['#f4f6fb', '#c4c9d6', '#7a8090'], ['#fff1a0', '#ffc94a', '#b88a1c'], ['#fff6c0', '#ffd84a', '#c8961c']][tier];
  for (let by = 0; by < 24; by++) for (let bx = 0; bx < 24; bx++) {
    const cx = bx - 11.5, cy = by - 11.5, x = bx + B, y = by + B;
    if (tier <= 1) {                                                  // stone tile
      if (Math.abs(cx) > 11.5 || Math.abs(cy) > 11.5 || (Math.abs(cx) > 9.5 && Math.abs(cy) > 9.5)) continue;
      const outer = Math.abs(cx) > 10.5 || Math.abs(cy) > 10.5 || (Math.abs(cx) > 8.5 && Math.abs(cy) > 8.5);
      const inner = !outer && (Math.abs(cx) > 9.5 || Math.abs(cy) > 9.5 || (Math.abs(cx) > 7.5 && Math.abs(cy) > 7.5));
      let c = shade('#2a2e44', ((bx * 7 + by * 13) % 5 === 0 ? 0.04 : 0) - cy * 0.004);
      if (tier === 0 && outer) c = shade(col, -0.18);
      if (tier === 1 && outer) c = cx + cy < 0 ? METAL[0] : cx + cy > 6 ? METAL[2] : METAL[1];
      if (tier === 1 && inner) c = col;
      put(g, x, y, c);
    } else {                                                          // shield crest
      if (!inShield(bx, by)) continue;
      const c = shieldEdge(bx, by)
        ? (cx < -1 ? METAL[0] : cx > 2 ? METAL[2] : METAL[1])
        : shade(col, (tier - 2) * 0.05 + (11.5 - by) * 0.012 - (cx > 0 ? 0.06 : 0));
      put(g, x, y, c);
    }
  }
  if (tier === 1) for (const [x, y] of [[B + 2, B + 2], [B + 21, B + 2], [B + 2, B + 21], [B + 21, B + 21]]) put(g, x, y, '#ffe0a0');   // rivets
  if (tier >= 2) { put(g, B + 11, B + 1, '#ffffff'); put(g, B + 12, B + 1, shade(col, 0.25)); put(g, B + 11, B + 2, shade(col, 0.2)); put(g, B + 12, B + 2, col); }  // top gem
  if (tier === 3) {                                                   // laurel wreath up both sides
    for (let y = 9; y <= 27; y += 3) {
      const d = Math.round((y - 9) / 6);
      for (const [x, s] of [[2 + d, 1], [29 - d, -1]]) {
        put(g, x, y, '#5aa83a'); put(g, x + s, y - 1, '#8ad06a'); put(g, x, y + 1, '#3a7a2a'); put(g, x - s, y + 1, '#5aa83a');
      }
    }
    put(g, 14, 29, '#c83a2a'); put(g, 15, 29, '#e8604a'); put(g, 16, 29, '#e8604a'); put(g, 17, 29, '#c83a2a');   // ribbon
  }
  if (tier === 4) {                                                   // wings + crown
    for (let y = 7; y <= 20; y++) {
      const reach = Math.max(0, 5 - Math.floor(Math.abs(y - 11) / 2));
      for (let i = 0; i < reach; i++) {
        const c = (y + i) % 3 === 0 ? '#ffe680' : i === reach - 1 ? '#ffffff' : '#f4f1ff';
        put(g, 4 - i, y, c); put(g, 27 + i, y, c);
      }
    }
    for (let x = 11; x <= 20; x++) { put(g, x, 3, '#c8961c'); put(g, x, 2, '#ffd84a'); }
    for (const x of [11, 15, 16, 20]) { put(g, x, 1, '#ffd84a'); put(g, x, 0, '#fff4b0'); }
    put(g, 13, 2, '#e8435a'); put(g, 18, 2, '#4ab0ff'); put(g, 15, 2, '#ffffff');
  }
  return g;
}

function tieredGrid(skillId, level) {
  const tier = tierOf(level);
  const g = tierFrame(tier, skillId);
  outline32(g);
  const sym = SYMBOLS[skillId];
  const oy = tier >= 2 ? 7 : 8;
  sym.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (sym.pal[ch]) put(g, x + 8, y + oy, sym.pal[ch]); }));
  // symbol outline (only where it sits on the frame)
  const symMask = g32();
  sym.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (sym.pal[ch]) symMask[y + oy][x + 8] = 1; }));
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    if (symMask[y][x]) continue;
    if (symMask[y]?.[x - 1] || symMask[y]?.[x + 1] || symMask[y - 1]?.[x] || symMask[y + 1]?.[x]) put(g, x, y, OUT);
  }
  // progress pips along the bottom (not at max level)
  if (tier < 4) {
    const filled = pipsFor(level);
    for (let i = 0; i < 5; i++) {
      const x0 = 8 + i * 3.4 | 0;
      const c = i < filled ? '#ffc94a' : '#3a3f62';
      put(g, x0, 30, c); put(g, x0 + 1, 30, c); put(g, x0, 31, OUT); put(g, x0 + 1, 31, OUT);
    }
  }
  return g;
}

function gridToCanvas(g, scale, bright = 0) {
  const cv = document.createElement('canvas'); cv.width = cv.height = G * scale;
  const ctx = cv.getContext('2d');
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    if (!g[y][x]) continue;
    ctx.fillStyle = bright && g[y][x] !== OUT ? shade(g[y][x], bright) : g[y][x];
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }
  return cv;
}

const tierCache = new Map();
export function tieredIcon(skillId, level, scale = 3) {
  const key = `${skillId}|${tierOf(level)}|${pipsFor(level)}|${scale}`;
  if (!tierCache.has(key)) tierCache.set(key, gridToCanvas(tieredGrid(skillId, level), scale).toDataURL());
  return tierCache.get(key);
}

// Draw onto a canvas; level 60 icons animate (glow pulse, shimmer sweep, sparkles). Returns stop().
export function mountSkillIcon(canvas, skillId, level, { scale = 3 } = {}) {
  const g = tieredGrid(skillId, level);
  const base = gridToCanvas(g, scale);
  canvas.width = canvas.height = G * scale;
  const ctx = canvas.getContext('2d');
  if (tierOf(level) < 4) { ctx.drawImage(base, 0, 0); return () => {}; }
  const bright = gridToCanvas(g, scale, 0.25);
  const size = G * scale;
  let t = 0, raf = 0, stopped = false;
  const sparks = [];
  const frame = () => {
    t++;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.shadowColor = `rgba(255, 216, 74, ${0.45 + 0.35 * Math.sin(t / 20)})`;
    ctx.shadowBlur = scale * 4;
    ctx.drawImage(base, 0, 0);
    ctx.restore();
    const band = ((t * 1.2) % (size * 3)) - size;                       // shimmer sweep every few seconds
    ctx.save();
    ctx.beginPath(); ctx.moveTo(band, 0); ctx.lineTo(band + size * 0.25, 0); ctx.lineTo(band + size * 0.25 - size, size); ctx.lineTo(band - size, size); ctx.closePath(); ctx.clip();
    ctx.drawImage(bright, 0, 0);
    ctx.restore();
    if (sparks.length < 6 && Math.random() < 0.08) sparks.push({ x: Math.random() * G | 0, y: Math.random() * G | 0, life: 0, max: 25 + Math.random() * 25 });
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.life++;
      if (s.life > s.max) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = Math.sin((s.life / s.max) * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x * scale, s.y * scale, scale, scale);
      ctx.globalAlpha = 1;
    }
    if (!stopped) raf = requestAnimationFrame(frame);
  };
  frame();
  return () => { stopped = true; cancelAnimationFrame(raf); };
}

const cache = new Map();
export function skillIcon(skillId, style = 'shield', scale = 4) {
  const key = `${skillId}|${style}|${scale}`;
  if (cache.has(key)) return cache.get(key);
  const sym = symbolGrid(skillId);
  outline(sym);
  const g = style === 'plain' ? grid() : frame(style, skillId);
  if (style !== 'plain') outline(g);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (sym[y][x]) g[y][x] = sym[y][x];
  const cv = document.createElement('canvas'); cv.width = cv.height = SIZE * scale;
  const ctx = cv.getContext('2d');
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    if (!g[y][x]) continue;
    ctx.fillStyle = g[y][x]; ctx.fillRect(x * scale, y * scale, scale, scale);
  }
  const url = cv.toDataURL();
  cache.set(key, url);
  return url;
}
