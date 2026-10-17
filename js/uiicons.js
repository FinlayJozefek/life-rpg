// Pixel-art UI icons (TRIAL — shown on dev/ui-icons.html, not used by the game yet).
// Symbols are 16x16. `half` symbols are drawn as the left 8 columns and mirrored.
// Styles: 'color' (full colour), 'gold' (one-colour gold, like classic RPG menus), 'slot' (colour in an inventory slot).

const S = {
  // navigation
  helmet: { pal: { a: '#a8b0c4', b: '#4a5068', c: '#e4e9f4', d: '#c83a2a' }, half: [
    '.......d', '......dd', '....aaaa', '...acccc', '..acaaaa', '..acaaaa', '.acaaaaa', '.acbbbbb',
    '.acaaaaa', '.acaabab', '.acaaaaa', '..aaaaaa', '..bbbbbb', '........', '........', '........'] },
  swords: { pal: { a: '#9aa3b8', c: '#eef1f8', d: '#ffc94a', e: '#8a5a2a', f: '#ffc94a' }, half: [
    'aa......', 'aca.....', '.aca....', '..aca...', '...aca..', '....aca.', '.....aca', '......ac',
    '.....aca', '....aca.', '..daca..', '...dd...', '..ee....', '.ee.....', 'f.......', '........'] },
  scroll: { pal: { a: '#c8a060', b: '#8a6a3a', c: '#f4e6c0', d: '#a8906a', e: '#c83a2a' }, half: [
    '........', '........', '.bbbbbbb', 'baaaaaaa', '.bbbbbbb', '..cccccc', '..cddddd', '..cccccc',
    '..cddddc', '..cccccc', '..cddddd', '..ccccce', '.bbbbbbb', 'baaaaaaa', '.bbbbbbb', '........'] },
  chest: { pal: { a: '#a8743a', b: '#5a3a1a', c: '#ffc94a', e: '#ffe680' }, half: [
    '........', '........', '........', '..bbbbbb', '.baaaaaa', '.baaaaaa', '.bccccce', '.bbbbbbe',
    '.baaaaaa', '.bcaaaaa', '.bcaaaaa', '.baaaaaa', '.bcccccc', '.bbbbbbb', '........', '........'] },
  gear: { pal: { a: '#9aa3b8', b: '#5a6278' }, half: [
    '........', '......aa', '..aa.aaa', '..aaaaaa', '...aaaaa', '.aaaaaaa', '.aaaaabb', '..aaab..',
    '..aaab..', '.aaaaabb', '.aaaaaaa', '...aaaaa', '..aaaaaa', '..aa.aaa', '......aa', '........'] },
  // status
  flame: { pal: { a: '#c83a1a', b: '#ff8a2e', c: '#ffe066' }, half: [
    '........', '.......a', '......aa', '.....aaa', '....aaba', '..a.abba', '..aaabbb', '.aaabbbb',
    '.aabbbcc', '.aabbccc', '.aabbccc', '..abbccc', '...abbcc', '....aabb', '........', '........'] },
  coin: { pal: { a: '#ffc94a', b: '#b88a1c', c: '#fff0a0', d: '#b88a1c' }, half: [
    '........', '........', '....bbbb', '...baaaa', '..baaccc', '.bacaaaa', '.bacaaaa', '.bacaaad',
    '.bacaaad', '.bacaaaa', '.bacaaaa', '..baabbb', '...baaaa', '....bbbb', '........', '........'] },
  lock: { pal: { a: '#c4c9d6', b: '#b88a1c', c: '#ffc94a', d: '#3a2a10' }, half: [
    '........', '........', '.....aaa', '....a...', '...a....', '...a....', '...a....', '.bbbbbbb',
    '.bcccccc', '.bcccccd', '.bcccccd', '.bcccccc', '.bbbbbbb', '........', '........', '........'] },
  trophy: { pal: { a: '#ffc94a', b: '#b88a1c', c: '#fff0a0' }, half: [
    '........', '........', '..aaaaaa', 'b.acaaaa', 'b.acaaaa', '.bacaaaa', '...aaaaa', '....aaaa',
    '......aa', '......aa', '.....aaa', '....bbbb', '...bbbbb', '........', '........', '........'] },
  medal: { pal: { a: '#ffc94a', b: '#b88a1c', c: '#fff0a0', d: '#e8435a' }, half: [
    '..dddd..', '...dddd.', '....dddd', '.....ddd', '....bbbb', '...baaaa', '..baaaaa', '..baaaac',
    '..baaacc', '..baaaaa', '...baaaa', '....bbbb', '........', '........', '........', '........'] },
  title: { pal: { a: '#c83a2a', b: '#8a1a10', c: '#e8604a', d: '#ffc94a' }, half: [
    '........', '........', '........', '........', '...aaaaa', '..accccc', 'bbaccccc', 'bbacdddd',
    'bbaccccc', '.baaaaaa', 'bb......', 'b.......', '........', '........', '........', '........'] },
  card: { pal: { a: '#e8e0cc', b: '#8a7a5a', c: '#4a7ae0', d: '#e2b48c', e: '#8a7a5a', f: '#ffc94a' }, rows: [
    '................', '................', '................', '.bbbbbbbbbbbbbb.', '.baaaaaaaaaaaab.', '.bacccaaeeeeeab.',
    '.bacdcaaaaaaaab.', '.bacccaaeeeeaab.', '.baaaaaaaaaaaab.', '.baffffffffffab.', '.baaaaaaaaaaaab.', '.bbbbbbbbbbbbbb.',
    '................', '................', '................', '................'] },
  check: { pal: { a: '#3ee0a0', b: '#1f8a5c' }, rows: [
    '................', '................', '................', '................', '.............aa.', '............aab.',
    '..aa.......aab..', '..baa.....aab...', '...baa...aab....', '....baa.aab.....', '.....baaab......', '......bab.......',
    '.......b........', '................', '................', '................'] },
  sound: { pal: { a: '#c4c9d6', b: '#ffc94a' }, rows: [
    '................', '................', '................', '................', '......a.........', '.....aa....b....',
    '..aaaaa..b..b...', '..aaaaa...b.b...', '..aaaaa...b.b...', '..aaaaa..b..b...', '.....aa....b....', '......a.........',
    '................', '................', '................', '................'] },
  pencil: { pal: { a: '#ffc94a', c: '#e8c08a', d: '#3a3a48', e: '#e88aa8' }, rows: [
    '................', '................', '............ee..', '...........eeee.', '..........aaee..', '.........aaaa...',
    '........aaaa....', '.......aaaa.....', '......aaaa......', '.....aaaa.......', '....aaaa........', '...cccc.........',
    '..ccc...........', '..dd............', '................', '................'] },
  // equipment slots
  hat: { pal: { a: '#6a3ab0', b: '#3a1a6a', c: '#9a6ae0' }, half: [
    '........', '........', '........', '........', '........', '.....aaa', '....aaaa', '...acaaa',
    '...acaaa', '...aaaaa', '...bbbbb', 'aaaaaaaa', '.bbbbbbb', '........', '........', '........'] },
  tunic: { pal: { a: '#4a7ae0', b: '#2a4a9a', c: '#b8864a' }, half: [
    '........', '........', '..aaaa..', '.aaaaab.', 'aaaaaaab', 'aaaaaaaa', 'aa.aaaaa', '...aaaaa',
    '...aaaaa', '...ccccc', '...aaaaa', '...aaaaa', '...bbbbb', '........', '........', '........'] },
  boot: { pal: { a: '#8a5a2a', b: '#c8a070', c: '#3a2a1a' }, rows: [
    '................', '................', '....aaaa........', '....aaaa........', '....abaa........', '....aaaa........',
    '....aaba........', '....aaaa........', '....aaaaa.......', '....aaaaaaa.....', '....aaaaaaaaa...', '....aaaaaaaaaa..',
    '....cccccccccc..', '................', '................', '................'] },
  paw: { pal: { a: '#c89a6a' }, half: [
    '........', '........', '..aa.aa.', '..aa.aa.', '........', '........', '....aaaa', '...aaaaa',
    '...aaaaa', '...aaaaa', '....aaaa', '........', '........', '........', '........', '........'] },
  // quests
  hourglass: { pal: { a: '#c8e0f0', b: '#8a5a2a', c: '#e8c06a' }, half: [
    '........', '.bbbbbbb', '..accccc', '...acccc', '....accc', '.....acc', '......ac', '......ac',
    '.....a.c', '....a...', '...a..cc', '..a.cccc', '..accccc', '.bbbbbbb', '........', '........'] },
  calendar: { pal: { a: '#e8435a', b: '#5a5f6c', c: '#f4ead2', d: '#8a7a5a', e: '#3ee0a0' }, rows: [
    '................', '................', '...b......b.....', '.aaaaaaaaaaaaaa.', '.aaaaaaaaaaaaaa.', '.cccccccccccccc.',
    '.cdcdcdcdcdcdcc.', '.cccccccccccccc.', '.cdcdcdcdcdcdcc.', '.cccccccccccccc.', '.cdcdcdcecdcdcc.', '.cccccccccccccc.',
    '................', '................', '................', '................'] },
  // achievement symbols
  gem: { pal: { a: '#4ab0ff', b: '#1f5a9a', c: '#bff0ff' }, half: [
    '........', '........', '........', '...bbbbb', '..bccaaa', '.bcaaaaa', 'baaaaaaa', '.baaaaaa',
    '..baaaaa', '...baaaa', '....baaa', '.....baa', '......ba', '........', '........', '........'] },
  star: { pal: { a: '#ffc94a' }, half: [
    '........', '.......a', '......aa', '......aa', '.....aaa', 'aaaaaaaa', '.aaaaaaa', '..aaaaaa',
    '...aaaaa', '...aaaaa', '..aaaa..', '.aaa....', '.a......', '........', '........', '........'] },
  crown: { pal: { a: '#ffc94a', b: '#b88a1c', d: '#e8435a' }, half: [
    '........', '........', '........', '........', '.a.....a', '.aa....a', '.aaa..aa', '.aaaaaaa',
    '.aaaaaaa', '.aaadaaa', '.aaaaaaa', '.bbbbbbb', '........', '........', '........', '........'] },
};

// Circle-based symbols are generated rather than hand drawn.
function circleSymbol(draw) {
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    for (let x = 0; x < 16; x++) r += draw(x - 7.5, y - 7.5, Math.hypot(x - 7.5, y - 7.5)) || '.';
    rows.push(r);
  }
  return rows;
}
S.target = { pal: { a: '#e8435a', b: '#f4ead2', c: '#ffc94a' }, rows: circleSymbol((x, y, d) => (d > 7 ? null : d < 1.6 ? 'c' : Math.floor(d / 1.8) % 2 ? 'b' : 'a')) };
S.compass = { pal: { a: '#ffc94a', b: '#b88a1c', c: '#f4ead2', d: '#e8435a', e: '#5a6278' }, rows: circleSymbol((x, y, d) => {
  if (d > 7) return null;
  if (d > 5.8) return x + y < 0 ? 'a' : 'b';
  if (Math.abs(x) < 1 && y < 0 && y > -5) return 'd';      // north needle
  if (Math.abs(x) < 1 && y >= 0 && y < 5) return 'e';      // south needle
  return 'c';
}) };

export const UI_SYMBOLS = Object.keys(S);
export const UI_STYLES = [
  { id: 'color', name: 'Full colour', blurb: 'Coloured pixel art, like the items.' },
  { id: 'gold', name: 'Gold', blurb: 'One-colour gold, classic RPG menu look.' },
  { id: 'slot', name: 'Slot', blurb: 'Coloured, in a little inventory slot.' },
];

export function symbolRows(id) {
  const s = S[id];
  return s.rows || s.half.map((r) => r + [...r].reverse().join(''));
}
export const symbolPal = (id) => S[id].pal;

const OUT = '#0a0b18';
function lum(hex) { const n = parseInt(hex.slice(1), 16); return (0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255; }
const GOLD = ['#8a6418', '#c8961c', '#ffc94a', '#fff0a0'];

const cache = new Map();
export function uiIcon(id, style = 'color', scale = 3) {
  const key = `${id}|${style}|${scale}`;
  if (cache.has(key)) return cache.get(key);
  const rows = symbolRows(id), pal = symbolPal(id);
  const N = style === 'slot' ? 22 : 18, off = style === 'slot' ? 3 : 1;
  const g = Array.from({ length: N }, () => Array(N).fill(null));
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (!pal[ch]) return;
    const c = style === 'gold' ? GOLD[Math.min(3, Math.floor(lum(pal[ch]) * 4.2))] : pal[ch];
    g[y + off][x + off] = c;
  }));
  // outline the symbol
  const add = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (g[y][x]) continue;
    if (g[y][x - 1] || g[y][x + 1] || g[y - 1]?.[x] || g[y + 1]?.[x]) add.push([x, y]);
  }
  for (const [x, y] of add) g[y][x] = OUT;
  const cv = document.createElement('canvas'); cv.width = cv.height = N * scale;
  const ctx = cv.getContext('2d');
  if (style === 'slot') {                               // bevelled dark slot behind the symbol
    ctx.fillStyle = '#0a0b18'; ctx.fillRect(0, 0, N * scale, N * scale);
    ctx.fillStyle = '#2f3670'; ctx.fillRect(scale, scale, (N - 2) * scale, (N - 2) * scale);
    ctx.fillStyle = '#161a3a'; ctx.fillRect(2 * scale, 2 * scale, (N - 4) * scale, (N - 4) * scale);
    ctx.fillStyle = '#1e2350'; ctx.fillRect(2 * scale, (N - 3) * scale, (N - 4) * scale, scale);
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!g[y][x]) continue;
    ctx.fillStyle = g[y][x]; ctx.fillRect(x * scale, y * scale, scale, scale);
  }
  const url = cv.toDataURL();
  cache.set(key, url);
  return url;
}
