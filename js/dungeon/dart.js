// Dungeon pixel art: enemies, bosses and gear icons.
// Enemies use the same 16x16 drawing format as pets (8-char rows are mirrored).
import { BASES } from '../pets.js';
import { DITEMS } from './ddata.js';
import { drawingIcon, mountDrawing } from '../sprites2.js';

const D = (pal, half) => ({ pal: { e: '#1a1630', w: '#ffffff', ...pal }, half });
const fromBase = (base, pal, rows = {}) => D(pal, BASES[base].map((r, i) => rows[i] ?? r));

// ---------- enemies ----------
const GOBLIN = ['........', '........', '....aaaa', 'a..aaaaa', 'aa.aaaaa', '.aaaewaa', '..aaeeaa', '...aaaaa', '....aaan', '...ccccc',
  '..accccc', '..acdddd', '...ccccc', '....cc..', '....bb..', '........'];
const BRUTE = ['........', '...aaaaa', '..aaaaaa', '..aaaaaa', '..aaewaa', '..aaeeaa', '..aaaaaa', '...awaan', '.ccccccc', 'cccccccc',
  'aacccccc', 'aa.ddddd', 'a..ccccc', '...ccc..', '...bbb..', '........'];
const SKELETON = ['........', '........', '....aaaa', '...aaaaa', '...aaaaa', '...aeeaa', '...aeeaa', '....aaaa', '....baba', '.....aaa',
  '..a.baba', '..a.aaaa', '..a.baba', '....a..a', '....a..a', '...bb.bb'];
const GHOST = ['........', '.....aaa', '....aaaa', '...aaaaa', '...aaaaa', '...aeeaa', '...aeeaa', '...aaaaa', '..aaaaaa', '..aaaaaa',
  '.aaaaaaa', '.aaaaaaa', '.aaaaaaa', '..a.aa.a', '..a..a..', '........'];
const STONE = ['........', '...bbbbb', '..baaaaa', '..baaaaa', '..baewaa', '..baeeaa', '..baaaaa', 'bbbbbbbb', 'baaaaaca', 'baaaaaaa',
  'baa.aaaa', 'baa.aaaa', '...aaaaa', '...aaa..', '...aaa..', '..bbbb..'];
const GARGOYLE = ['........', '.b......', 'bb...aaa', 'bbb.aaaa', 'bbbaaewa', 'bbbaaeea', '.bbaaaaa', '..baaaan', '...aaaaa', '..aaaaaa',
  '..aaaaaa', '...aaaaa', '...aa.aa', '...aa...', '..bbb...', '........'];
const IMP = ['..d.....', '..dd....', '...daaaa', 'b..aaaaa', 'bb.aewaa', 'bbbaeeaa', '.bbaaaan', '...aaaaa', '..aaaaaa', '.a.aaaaa',
  '...aaaaa', '....aa..', '....aa..', '...dd...', '........', '........'];

export const ENEMY_ART = {
  goblin: D({ a: '#7ac04a', b: '#3a7a1a', c: '#8a5a2a', d: '#c8a050', w: '#ffe066', n: '#3a1a10' }, GOBLIN),
  'goblin-archer': D({ a: '#7ac04a', b: '#3a7a1a', c: '#3a6a3a', d: '#a8743a', w: '#ffe066', n: '#3a1a10' }, GOBLIN.map((r, i) => (i === 2 ? '....cccc' : i === 3 ? 'a..ccccc' : r))),
  'goblin-shaman': D({ a: '#8ac05a', b: '#3a7a1a', c: '#6a3ab0', d: '#ffd84a', w: '#ff8ae0', n: '#3a1a10' }, GOBLIN.map((r, i) => (i === 1 ? '......dd' : r))),
  'orc-brute': D({ a: '#5a8a4a', b: '#2a5a1a', c: '#5a4a3a', d: '#9aa3b8', w: '#ffffff', e: '#c83a2a', n: '#2a1a10' }, BRUTE),
  troll: D({ a: '#8a9a7a', b: '#5a6a4a', c: '#6a5a4a', d: '#4a3a2a', w: '#ffe066', n: '#2a1a10' }, BRUTE),
  skeleton: D({ a: '#e8e4d8', b: '#9a968a' }, SKELETON),
  zombie: D({ a: '#8aa07a', b: '#5a6a4a', c: '#5a4a6a', d: '#6a3a3a', e: '#e8435a', w: '#ffe066', n: '#3a1a1a' }, GOBLIN.map((r, i) => (i === 3 ? '...aaaaa' : i === 4 ? '...aaaaa' : r))),
  wraith: D({ a: '#c8d0e8', b: '#8a90b8', e: '#4ab0ff' }, GHOST),
  ghoul: D({ a: '#9a8a7a', b: '#6a5a4a', c: '#5a4a3a', d: '#e8e4d8', e: '#c83a2a', w: '#ffe066', n: '#1a0a0a' }, GOBLIN.map((r, i) => (i === 10 ? '.daccccc' : r))),
  gargoyle: D({ a: '#8a8a92', b: '#5a5a62', e: '#c83a2a', w: '#ff8a2e', n: '#2a2a30' }, GARGOYLE),
  'stone-sentinel': D({ a: '#8a8a92', b: '#4a4a52', c: '#4ab0ff', e: '#4ab0ff', w: '#bff0ff' }, STONE),
  'animated-armour': D({ a: '#a8b0c4', b: '#4a5068', c: '#7dffd8', e: '#7dffd8', w: '#ffffff' }, STONE),
  'clay-golem': D({ a: '#b8865a', b: '#7a5430', c: '#e0b060', e: '#3a2a1a', w: '#ffe066' }, STONE),
  wolf: fromBase('cat', { a: '#8a90a0', b: '#5a6070', c: '#e0e4ea', d: '#3a3e48', n: '#1a1a20', e: '#ffe066' }),
  warg: fromBase('cat', { a: '#5a4a3a', b: '#3a2a1a', c: '#8a7a6a', d: '#1a1010', n: '#1a1010', e: '#e8435a' }),
  yeti: fromBase('round', { a: '#f4f6fb', b: '#c8d0e0', c: '#9fd3ff', d: '#6a8ab0', n: '#3a4a6a', e: '#3a4a6a' }, { 1: '........', 2: '........', 3: '........' }),
  'ice-bear': fromBase('round', { a: '#e8f0f8', b: '#a8c0d8', c: '#ffffff', d: '#a8c0d8', n: '#1a1a20' }),
  imp: D({ a: '#d8402a', b: '#8a1a10', d: '#2a1a1a', e: '#ffe066', w: '#ffffff', n: '#3a0a0a' }, IMP),
  hellhound: fromBase('dog', { a: '#2a1a1a', b: '#1a0a0a', c: '#4a2a2a', d: '#ff6a2a', e: '#ff8a2e', w: '#ffe066', n: '#ff6a2a' }),
  fiend: D({ a: '#a82a2a', b: '#5a0a0a', c: '#3a1a1a', d: '#2a1a1a', e: '#ffe066', w: '#ff8a2e', n: '#2a0a0a' }, BRUTE.map((r, i) => (i === 0 ? '..d.....' : i === 1 ? '..ddaaaa' : r))),
  'pit-demon': D({ a: '#7a1a1a', b: '#3a0a0a', c: '#2a1a1a', d: '#1a1010', e: '#ff8a2e', w: '#ffe066', n: '#ff6a2a' }, BRUTE.map((r, i) => (i === 0 ? '.dd.....' : i === 1 ? '..ddaaaa' : r))),
};

// Bosses: their family's look plus crowns, capes, cores and wings. Drawn bigger and with an aura.
export const BOSS_ART = {
  'goblin-king': D({ a: '#7ac04a', b: '#3a7a1a', c: '#7a2ab0', d: '#ffd84a', w: '#ffe066', n: '#3a1a10', g: '#ffd84a' },
    ['..g.g.g.', '..gggggg', '...aaaaa', 'a.aaaaaa', 'aaaaaaaa', '.aaaewaa', '.aaaeeaa', '..aaaaaa', '...aaaan', '.ccccccc', 'cccdcccc', 'cc.ddddd', 'cc.ccccc', 'c..cc...', '...bb...', '........']),
  lich: D({ a: '#e8e4d8', b: '#3a2a5a', c: '#5a3a8a', d: '#ffd84a', e: '#7dffd8', g: '#9a6ae0' },
    ['..g..g..', '..bbbbbb', '..baaaaa', '.bbaaaaa', '.bbaeeaa', '.bbaeeaa', '.bbaaaaa', '.bbbaaaa', '.ccccccc', 'cccccccc', 'g.cccccc', '..cccccc', '..cccccc', '.ccccccc', 'cccccccc', '........']),
  'stone-golem': D({ a: '#8a8a92', b: '#4a4a52', c: '#ff8a2e', e: '#ff8a2e', w: '#ffe066' },
    ['...bbbbb', '..baaaaa', '..baaaaa', '..baewaa', '..baeeaa', 'bbbbbbbb', 'baaaaaaa', 'baaaacca', 'baaaacca', 'baa.aaaa', 'baa.aaaa', 'bb..aaaa', '...aaaaa', '...aaa..', '..aaaa..', '.bbbbb..']),
  'frost-wyrm': D({ a: '#9fd3ff', b: '#3a6a9a', c: '#e8f6ff', d: '#ffffff', e: '#1a3a6a', w: '#ffffff' },
    ['..d.....', '..dd....', '...db...', 'b..bbaaa', 'bb.baaaa', 'bbbaaaaa', 'bbaaewaa', '.baaeeaa', '.baaaaaa', '..baaacc', '..bacccc', '...bcccc', '...bacbc', '...baccc', '...ba.cc', '...dd...']),
  'demon-lord': D({ a: '#7a1a1a', b: '#2a0a0a', c: '#1a1010', d: '#ff8a2e', e: '#ffe066', w: '#ffffff', n: '#ff6a2a', g: '#ff6a2a' },
    ['g.d...g.', 'gdd..dd.', '..ddaaaa', 'b.aaaaaa', 'bbaaewaa', 'bbaaeeaa', 'bbaaaaaa', 'bbbawaan', 'bccccccc', 'bccccccc', 'aacccccc', 'aa.ddddd', 'a..ccccc', '...ccc..', '...bbb..', '........']),
};
export const BOSS_AURA = { 'goblin-king': '#ffd84a', lich: '#9a6ae0', 'stone-golem': '#ff8a2e', 'frost-wyrm': '#9fd3ff', 'demon-lord': '#ff4a2a' };

export function enemyDrawing(f) { return f.boss || f.isBoss ? BOSS_ART[f.id] : ENEMY_ART[f.id]; }
const iconCache = new Map();
export function enemyIcon(id, scale = 3) {
  const key = `${id}|${scale}`;
  if (!iconCache.has(key)) iconCache.set(key, drawingIcon(BOSS_ART[id] || ENEMY_ART[id], { scale }));
  return iconCache.get(key);
}
export function mountEnemy(canvas, f, scale = 5) {
  const isBoss = !!(f.boss || f.isBoss);
  return mountDrawing(canvas, enemyDrawing(f), { scale, tier: isBoss ? 5 : 0, auraColor: isBoss ? BOSS_AURA[f.id] : null });
}

// ---------- gear icons ----------
const SYM = {
  sword: ['..............cc', '.............cac', '............cab.', '...........cab..', '..........cab...', '.........cab....', '........cab.....', '.......cab......',
    '..d...cab.......', '..dd.cab........', '...ddab.........', '....dd..........', '...ee...........', '..ee............', '.f..............', '................'],
  dagger: ['................', '................', '................', '................', '...........cc...', '..........cac...', '.........cab....', '........cab.....',
    '.......cab......', '..d...cab.......', '..dd.cab........', '...ddab.........', '....dd..........', '...ee.d.........', '..ee............', '.f..............'],
  axe: ['................', '......ee.aaa....', '......eeaaaaaa..', '......eeaaaaaaa.', '......eecaaaaab.', '......ee.caaab..', '......ee..bbb...', '......ee........',
    '......ee........', '......ee........', '......ee........', '......ee........', '......ee........', '......ee........', '......ff........', '................'],
  hammer: ['................', '...cccccccccc...', '...aaaaaaaaaa...', '...aaaaaaaaaa...', '...bbbbbbbbbb...', '.......ee.......', '.......ee.......', '.......ee.......',
    '.......ee.......', '.......ee.......', '.......ee.......', '.......ee.......', '.......ee.......', '.......ee.......', '.......ff.......', '................'],
  spear: ['..............cc', '.............cac', '............cab.', '...........db...', '..........ee....', '.........ee.....', '........ee......', '.......ee.......',
    '......ee........', '.....ee.........', '....ee..........', '...ee...........', '..ee............', '.ee.............', 'ff..............', '................'],
  bow: ['................', '........ee......', '.......eb.d.....', '......eb..d.....', '.....eb...d.....', '.....eb...d.....', '....eb....d.....', '....ef....d.....',
    '....ef....d.....', '....eb....d.....', '.....eb...d.....', '.....eb...d.....', '......eb..d.....', '.......eb.d.....', '........ee......', '................'],
  staff: ['.......gg.......', '......gccg......', '......gccg......', '.......gg.......', '......dddd......', '.......ee.......', '.......ee.......', '.......ee.......',
    '.......ee.......', '.......ee.......', '.......ee.......', '.......ee.......', '.......ee.......', '.......ee.......', '.......ff.......', '................'],
  gauntlet: ['................', '................', '................', '....cacaca......', '...aaaaaaaa.....', '...aaaaaaaaa....', '...aaaaaaaaa....', '...baaaaaaab....',
    '....aaaaaaa.....', '....dddddd......', '....dddddd......', '....bbbbbb......', '................', '................', '................', '................'],
  helmet: ['........', '........', '....aaaa', '...acccc', '..acaaaa', '..acaaaa', '.acaaaaa', '.acbbbbb', '.acaaaaa', '.acaabab', '.acaaaaa', '..aaaaaa', '..dddddd', '........', '........', '........'],
  chest: ['........', '........', '..aaaa..', '.aaaaab.', 'aaaaaaab', 'aacaaaaa', 'aa.acaaa', '...aaaaa', '...aaaaa', '...ddddd', '...aaaaa', '...aaaaa', '...bbbbb', '........', '........', '........'],
  legs: ['........', '........', '..aaaaaa', '..dddddd', '..aaaaaa', '..aaaa..', '..acaa..', '..acaa..', '..aaaa..', '..aaaa..', '..aaaa..', '..bbbb..', '..bbbb..', '........', '........', '........'],
  boots: ['................', '................', '....aaaa........', '....aaaa........', '....acaa........', '....aaaa........', '....acaa........', '....aaaa........',
    '....aaaaa.......', '....aaaaaaa.....', '....aaaaaaaaa...', '....aaaaaaaaaa..', '....dddddddddd..', '................', '................', '................'],
  shield: ['........', '.bbbbbbb', '.baaaaaa', '.bacaaaa', '.bacaaad', '.bacaaad', '.bacaaaa', '..baaaaa', '..baaaaa', '...baaaa', '....baaa', '.....bba', '......bb', '........', '........', '........'],
  tome: ['........', '........', '..bbbbbb', '..baaaaa', '..baaaaa', '..baaagg', '..baaagg', '..baaaaa', '..baaaaa', '..baaaaa', '..bccccc', '..bbbbbb', '........', '........', '........', '........'],
  lantern: ['........', '.....bbb', '....b...', '....bbbb', '...baaaa', '...bgggg', '...bgccg', '...bgggg', '...bgggg', '...baaaa', '....bbbb', '........', '........', '........', '........', '........'],
  flask: ['........', '.....bbb', '......aa', '......aa', '.....aaa', '....aaaa', '...agggg', '..aggggg', '..agcggg', '..aggggg', '...agggg', '....aaaa', '........', '........', '........', '........'],
  crown: ['........', '........', '........', '........', '.a.....a', '.aa....a', '.aaa..aa', '.aaaaaaa', '.aaaaaaa', '.aaagaaa', '.aaaaaaa', '.bbbbbbb', '........', '........', '........', '........'],
  wings: ['........', 'c.......', 'cc......', 'acc.....', 'aacc....', 'aaacc...', 'aaaacc..', 'aaaaacg.', '.aaaaag.', '..aaaag.', '...aaag.', '....aag.', '.....ag.', '........', '........', '........'],
};

// Section palettes: a main metal, b dark, c highlight, d accent/trim, e grip, f pommel, g glow
const PAL = {
  0: { a: '#8a7a6a', b: '#4a3a2a', c: '#b8a890', d: '#7a5a3a', e: '#5a3a1a', f: '#7a5a3a', g: '#8a7a6a' },
  1: { a: '#8a909c', b: '#4a4e5a', c: '#d4d8e2', d: '#6a8a3a', e: '#6a4a2a', f: '#c8a050', g: '#6ab03a' },
  2: { a: '#d8d0c0', b: '#6a6478', c: '#ffffff', d: '#7a4ab0', e: '#3a3448', f: '#c0c4d0', g: '#9a6ae0' },
  3: { a: '#6a6a72', b: '#2a2a30', c: '#a8a8b0', d: '#e07a2a', e: '#5a4a3a', f: '#e0a040', g: '#4ab0ff' },
  4: { a: '#9fd3ff', b: '#3a6a9a', c: '#f0faff', d: '#e8e8f0', e: '#7a5a3a', f: '#c8e8ff', g: '#6ad0ff' },
  5: { a: '#4a2a2e', b: '#1a1014', c: '#c84a2a', d: '#ff8a2e', e: '#2a1a1a', f: '#ffc94a', g: '#ff6a2a' },
};
const GOLD = { a: '#ffc94a', b: '#b88a1c', c: '#fff0a0', d: '#e8435a', e: '#8a5a2a', f: '#ffc94a', g: '#4ab0ff' };
const HOLY = { a: '#f4f1e6', b: '#c8a050', c: '#ffffff', d: '#ffd84a', e: '#8a6a3a', f: '#ffd84a', g: '#fff4b0' };
const SERAPH = { a: '#f4f1ff', b: '#c8c0ea', c: '#ffffff', g: '#ffd84a' };

function symbolFor(it) {
  if (/crown/i.test(it.name)) return 'crown';
  if (/wings/i.test(it.name)) return 'wings';
  if (it.slot === 'weapon') return it.weaponType;
  if (it.slot === 'offhand') return it.kind === 'relic' ? 'flask' : it.kind;
  return it.slot;
}
function paletteFor(it) {
  if (/crown/i.test(it.name)) return GOLD;
  if (/wings/i.test(it.name)) return SERAPH;
  if (it.dtype === 'holy') return HOLY;
  return PAL[it.section] || PAL[0];
}
const gearCache = new Map();
export function gearIcon(id, scale = 3) {
  const key = `${id}|${scale}`;
  if (gearCache.has(key)) return gearCache.get(key);
  const it = DITEMS[id];
  const url = drawingIcon({ pal: paletteFor(it), half: SYM[symbolFor(it)] }, { scale });
  gearCache.set(key, url);
  return url;
}
