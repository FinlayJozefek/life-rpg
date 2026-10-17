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
