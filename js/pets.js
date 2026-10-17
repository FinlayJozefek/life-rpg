// Detailed pet pixel art. Each pet is 16x16, front-facing, drawn as its LEFT half
// (8 columns) and mirrored. A pet either gives its own `half`, or starts from a
// shared body shape (`base`) and replaces some rows (`rows: { rowIndex: '........' }`).
// Letters map to the pet's palette `pal`; '.' is empty. Shared letters:
//   e = eye, w = eye shine (both get closed when blinking), n = nose/mouth.
// `aura` sets the glow colour for Legendary/Divine pets (defaults to the rarity colour).

export const BASES = {
  cat: ['........', '.b......', '.ab.....', '.adb....', '.adab...', '.aaaaaaa', 'baaaaaaa', 'aaewaaaa', 'aaeeaaaa', 'caaaaaaa',
    'cccaaaac', '.ccccccn', '..cccccc', '...aaacc', '...aaacc', '...bb.cc'],
  dog: ['........', '........', '...aaaaa', '..aaaaaa', 'bbaaaaaa', 'bbaaaaaa', 'bbaewaaa', 'bbaeeaaa', 'bbaaaaaa', '.baaaccc',
    '..aacccc', '..accccn', '...ccccc', '...aaacc', '...aaacc', '...dd.dd'],
  round: ['........', '.bb.....', 'baab....', 'badb....', '.baaaaaa', '..aaaaaa', '..aaaaaa', '..aewaaa', '..aeeaaa', '..aaaaac',
    '..caaacn', '...ccccc', '...aaccc', '...aaccc', '...bb.cc', '........'],
  bird: ['........', '........', '....bbbb', '...baaaa', '..baaaaa', '..aaaaaa', '..aewaaa', '..aeeaaa', '..aaaaan', '..addaan',
    'bbaccccc', 'bbbccccc', '.bbacccc', '..bbaccc', '...bbbbb', '.....g.g'],
  hoof: ['........', '........', '.....aaa', '....aaaa', 'bba.aaaa', '.bbaaaaa', '...aewaa', '...aeeaa', '....aaaa', '....aaaa',
    '....cccc', '....cncc', '....cccc', '.....aaa', '....aaaa', '....d.dd'],
  bug: ['...b....', '....b...', '.....aaa', '....aaaa', '...aaaaa', '...aewaa', '...aeeaa', '...aaaan', 'b..ddddd', '.b.ccccc',
    'b.cccccc', '.bcccccc', 'b.dddddd', '..cccccc', '...ccccc', '....b.b.'],
  sea: ['........', '........', '........', '....aaaa', '...aaaaa', '..aaaaaa', '..aewaaa', '.baeeaaa', 'bbaaaaaa', 'bbaccccc',
    '.bcccccc', '..ccccnn', '...ccccc', '....aaaa', '........', '........'],
  shell: ['........', '........', '.....aaa', '....aaaa', '.....ewa', '.....eea', '....aaan', '..bbbbbb', '.bdddddd', 'bdddfddd',
    'bddfffdd', 'bdddfddd', '.bdddddd', '..bbbbbb', '.aa...aa', '........'],
  humanoid: ['........', '....aaaa', '...aaaaa', '...aaaaa', '...aewaa', '...aeeaa', '...aaaaa', '....aaan', '..bbbbbb', '.bbaaaaa',
    'bb.aaaaa', 'b..aaaaa', 'a..aaaaa', '...bbbbb', '....bb..', '...dd...'],
};

const DEFAULT_PAL = { e: '#1a1630', w: '#ffffff' };

// The pet's full left-half rows and palette, with base shapes and defaults applied.
export function petDrawing(id) {
  const P = PET_ART[id];
  if (!P) return null;
  const half = P.half || BASES[P.base].map((row, i) => P.rows?.[i] ?? row);
  return { half, pal: { ...DEFAULT_PAL, ...P.pal }, aura: P.aura };
}

export const PET_ART = {
  // ---------- Fitness ----------
  'fitness.pigeon': { base: 'bird', pal: { a: '#8d93a6', b: '#5f6478', c: '#c9cede', d: '#6fb08a', g: '#e0a050', n: '#3a3a48' } },
  'fitness.squirrel': { base: 'round', pal: { a: '#c47a3a', b: '#8a4e20', c: '#f2dcc0', d: '#e8a080', n: '#3a2418' },
    rows: { 0: '.b......', 15: '..bbb...' } },
  'fitness.fox': {
    pal: { a: '#e0782a', b: '#a8501c', c: '#f6efe4', d: '#3a2418', n: '#1a1630' },
    half: ['........', '.b......', '.ab.....', '.adb....', '.adab...', '.aaaaaaa', 'baaaaaaa', 'aaewaaaa', 'aaeeaaaa', 'caaaaaaa',
      'cccaaaac', '.ccccccn', '..cccccc', '...aaacc', '...aaacc', '...dd.cc'],
  },
  'fitness.greyhound': { base: 'dog', pal: { a: '#b8b0a8', b: '#847c74', c: '#ece6dc', d: '#5a524a', n: '#2a2420' },
    rows: { 2: '....aaaa', 3: '...aaaaa', 9: '..baaccc', 10: '...acccc' } },
  'fitness.cheetah': {
    pal: { a: '#e8b648', b: '#b58324', c: '#f7ecd2', s: '#3a2a18', n: '#3a2a18' },
    half: ['........', '..b.....', '.bab....', '.aaaaaaa', 'aasaaasa', 'aaaaasaa', 'aaewaaaa', 'saeeaaaa', 'aaasaaaa', 'caasaaac',
      'ccaaaaac', '.ccccccn', '..cccccc', '...asacc', '...aaacc', '...bb.cc'],
  },
  'fitness.pegasus': {
    pal: { a: '#f6f3ff', b: '#c8c0ea', c: '#ffffff', d: '#ffd84a', f: '#9fd3ff', g: '#ffd84a', n: '#e8a0b0' },
    half: ['.......g', '......gg', '.f...agg', 'ff..aaag', 'ffbaaaaa', 'fffbaaaa', 'fff.ewaa', 'fff.eeaa', '.ff.aaaa', '..f.aaaa',
      '....cccc', '....cncc', '....cccc', '.....aaa', '....aaaa', '....d.dd'],
    aura: '#ffe680',
  },

  // ---------- Intelligence ----------
  'intelligence.bookworm': {
    pal: { a: '#8ccf5a', b: '#5a9a34', c: '#c8f0a0', d: '#c8a050', n: '#2a4a1a' },
    half: ['........', '........', '........', '.....aaa', '....aaaa', '...dddda', '...dewda', '...deeda', '...dddda', '....aaan',
      '...bcccc', '..baaaaa', '..bcccca', '...baaaa', '....bbbb', '........'],
  },
  'intelligence.hedgehog': { base: 'round', pal: { a: '#c9a27a', b: '#5a3e28', c: '#f0dcc0', d: '#7a5636', n: '#2a1a10' },
    rows: { 0: '.b.b.b.b', 1: 'bdbdbdbd', 2: 'bddddddd', 3: 'bddddddd', 4: '.bdaaaaa', 5: '.bdaaaaa' } },
  'intelligence.owl': {
    pal: { a: '#8a5a34', b: '#5e3a1e', c: '#e8d2a8', d: '#f2c14e' },
    half: ['........', '.b......', '.bb.....', '..baaaaa', '.baaaaaa', '.acccaaa', 'acddddca', 'acdweedc', 'acddddca', 'aaccccad',
      'bacccccd', 'baccbccc', 'bacccccc', '.baccbcc', '..bacccc', '....d..d'],
  },
  'intelligence.raven': { base: 'bird', pal: { a: '#2a2a3a', b: '#15151f', c: '#45455a', d: '#6a4a9a', g: '#3a3a48', n: '#6a6a7a' },
    rows: { 1: '.......b', 2: '....bbbb' } },
  'intelligence.octopus': {
    pal: { a: '#c8507a', b: '#8a2a50', c: '#f0a0c0', d: '#f8d0e0' },
    half: ['........', '.....aaa', '....aaaa', '...aaaaa', '...aaaaa', '...aewaa', '...aeeaa', '...aaaaa', '...aaaaa', '..aaaaaa',
      '.aa.aa.a', 'ad..ad.a', 'a...a..d', 'aa..aa.a', '........', '........'],
    aura: '#ff9ac8',
  },
  'intelligence.sphinx': {
    pal: { a: '#e0b860', b: '#a8823a', c: '#f4e0a8', d: '#2f5bd0', g: '#ffd84a', n: '#6a4a2a' },
    half: ['....gggg', '...ggggg', '..gdgddd', '.gdgdaaa', 'gdgdaaaa', 'dgdaaaaa', 'gdaewaaa', 'dgaeeaaa', 'gdaaaaaa', 'dgcaaaac',
      'gdcaaacc', 'dg.ccccn', 'g..ccccc', '...aaacc', '...aaacc', '...bb.cc'],
    aura: '#ffe680',
  },

  // ---------- Cooking ----------
  'cooking.mouse': { base: 'round', pal: { a: '#a8a4b0', b: '#787484', c: '#e6e2ea', d: '#f0a0b0', n: '#f07090' } },
  'cooking.kitchen-cat': { base: 'cat', pal: { a: '#e09a4a', b: '#a8641e', c: '#f6ecdc', d: '#f0a0b0', n: '#e07080' },
    rows: { 5: '.aaaabab', 6: 'baaaaaba' } },
  'cooking.truffle-pig': {
    pal: { a: '#f0a8b8', b: '#c87888', c: '#f8c8d0', d: '#d87890', n: '#8a3a50' },
    half: ['........', '.bb.....', '.bab....', '..baaaaa', '..aaaaaa', '.aaaaaaa', '.aaewaaa', '.aaeeaaa', '.aaaaddd', '.aaaadnd',
      '.aaaaddd', '..aaaaaa', '..aacccc', '...aaccc', '...aaaaa', '...bb.bb'],
  },
  'cooking.lobster': {
    pal: { a: '#d8402a', b: '#9a2416', c: '#f07a50', d: '#ffb08a', n: '#5a1a10' },
    half: ['........', 'aa......', 'aba.....', '.a......', '.a...aaa', '..a.aaaa', '...aewaa', '...aeeaa', '...aaaan', '..bccccc',
      '..abbbbb', '..accccc', '...bbbbb', '...acccc', '....bbbb', '...b.b.b'],
  },
  'cooking.dragon-chilli': {
    pal: { a: '#e0301e', b: '#a01810', c: '#ff6a4a', d: '#3a9a3a', f: '#ffb21e', n: '#4a0a08' },
    half: ['.......f', '......ff', '.....fff', '......dd', '....dddd', '...aaaaa', '..aaaaaa', '..aewaaa', '..aeeaaa', '..acaaaa',
      '..aaaann', '...aaaaa', '....aaaa', '.....aaa', '......aa', '.......a'],
    aura: '#ff9a3a',
  },
  'cooking.golden-goose': { base: 'bird', pal: { a: '#ffd84a', b: '#d0a020', c: '#fff2b0', d: '#ffffff', g: '#ff9a1e', n: '#ff9a1e' },
    aura: '#fff2a0' },

  // ---------- Farming ----------
  'farming.snail': { base: 'shell', pal: { a: '#c8d080', b: '#8a6a3a', c: '#e0e8a8', d: '#c88a4a', f: '#8a5a2a', n: '#3a3020' },
    rows: { 0: '....e...', 1: '....a...', 4: '....aaaa', 5: '....aaaa' } },
  'farming.hen': { base: 'bird', pal: { a: '#f4efe6', b: '#c8bfb0', c: '#ffffff', d: '#d83a2a', g: '#f0a020', n: '#f0a020' },
    rows: { 0: '......dd', 1: '.....ddd', 2: '....bbdd', 9: '..aaaaan', 10: 'bbaccccd' } },
  'farming.sheepdog': { base: 'dog', pal: { a: '#e8e4dc', b: '#5a5a66', c: '#ffffff', d: '#3a3a44', n: '#1a1a20' },
    rows: { 5: 'bbbbaaaa', 6: 'bbaaaaaa', 7: 'bbaewaaa', 8: 'bbaeeaaa' } },
  'farming.highland-cow': { base: 'hoof', pal: { a: '#c8682a', b: '#8a3e14', c: '#e8a070', d: '#3a2a1a', f: '#f0e6d0', n: '#3a1a10' },
    rows: { 2: 'ff...aaa', 3: '.ff.aaaa', 5: '.bbabbab', 6: '...abwaa' } },
  'farming.bumblebee-queen': { base: 'bug', pal: { a: '#f0c020', b: '#2a2010', c: '#f8dc60', d: '#2a2010', f: '#cfeaff', g: '#ffd84a', n: '#2a2010' },
    rows: { 0: '...b.g.g', 1: '....gggg', 8: 'ff.ddddd', 9: 'fffccccc', 10: 'ff.ddddd', 11: '..cccccc', 12: '..dddddd' },
    aura: '#ffd84a' },
  'farming.golden-stag': { base: 'hoof', pal: { a: '#e8c060', b: '#b08a30', c: '#fff0b8', d: '#8a6a20', g: '#fff4b0', n: '#6a4a10' },
    rows: { 0: 'g.g.....', 1: 'gg.g....', 2: '.ggg.aaa', 3: '...gaaaa' }, aura: '#fff2a0' },

  // ---------- Foraging ----------
  'foraging.rabbit': { base: 'round', pal: { a: '#c8b8a8', b: '#8a7a6a', c: '#f4ece4', d: '#f0b0c0', n: '#e07090' },
    rows: { 0: '..b.....', 1: '.bdb....', 2: '.bdb....', 3: '.bdb....', 4: '..baaaaa' } },
  'foraging.badger': { base: 'round', pal: { a: '#3a3a42', b: '#1f1f26', c: '#f0f0f0', d: '#5a5a62', n: '#0f0f14' },
    rows: { 4: '.baaaacc', 5: '..aaaacc', 6: '..aaaacc', 7: '..aewacc', 8: '..aeeacc', 9: '..ccaacc' } },
  'foraging.red-squirrel': { base: 'round', pal: { a: '#c8502a', b: '#8a2e14', c: '#f4d8c0', d: '#8a2e14', n: '#3a1408' },
    rows: { 0: '.b......', 1: '.bb.....', 15: '..bbb...' } },
  'foraging.wolf': { base: 'cat', pal: { a: '#8a90a0', b: '#5a6070', c: '#e0e4ea', d: '#3a3e48', n: '#1a1a20' } },
  'foraging.mini-treant': {
    pal: { a: '#6a4a2a', b: '#3e2a16', c: '#8a6a40', d: '#4a9a3a', f: '#8ad06a', e: '#ffd84a', n: '#2a1a0a' },
    half: ['...fdfdf', '..fddddd', '.fdddfdd', '..dddddd', '...aaaaa', '...acaaa', '...aewaa', '...aeeaa', '...aacaa', '...aabbb',
      '.b.aaaaa', 'b.baaaaa', '...aacaa', '...aaaaa', '..b.bb.b', '.b..b..b'],
    aura: '#a6ff6a',
  },
  'foraging.great-elk': { base: 'hoof', pal: { a: '#8a5a34', b: '#5a3a1e', c: '#c89a6a', d: '#3a2a1a', g: '#f0e0c0', n: '#2a1a10' },
    rows: { 0: 'g.g.g...', 1: 'ggg.g...', 2: '.ggg.aaa', 3: '..gg.aaa' }, aura: '#fff2c0' },

  // ---------- Crafting ----------
  'crafting.spider': { base: 'bug', pal: { a: '#3a3040', b: '#1a141f', c: '#5a4a68', d: '#c83a5a', e: '#e8435a', n: '#1a141f' },
    rows: { 0: '........', 1: '........', 8: 'bb.ccccc', 9: '..bccdcc', 10: 'b.bccddc', 11: '.b.ccccc', 12: 'b..ccccc', 13: '...ccccc' } },
  'crafting.beaver': { base: 'round', pal: { a: '#8a5a34', b: '#5a3a1e', c: '#c89a6a', d: '#f4f0e8', n: '#2a1a10' },
    rows: { 11: '...ccccd', 12: '...aaccd', 15: '...bbbbb' } },
  'crafting.magpie': { base: 'bird', pal: { a: '#1f1f2a', b: '#0f0f18', c: '#f4f4f8', d: '#3a6ad0', g: '#3a3a48', n: '#2a2a34' } },
  'crafting.clockwork-beetle': { base: 'bug', pal: { a: '#b8863a', b: '#6a4a1a', c: '#d8b060', d: '#8a8f9c', f: '#ffd84a', e: '#4ab0ff', w: '#bff0ff', n: '#3a2a10' },
    rows: { 10: 'b.cdfdcc', 11: '.bcfdfcc' } },
  'crafting.brass-automaton': { base: 'humanoid', pal: { a: '#c8963a', b: '#7a5420', c: '#e8c070', d: '#4ab0ff', e: '#4ab0ff', w: '#bff0ff', n: '#3a2a10' },
    rows: { 0: '.......d', 7: '....aabb', 10: 'bb.aaadd', 11: 'b..aaaaa' }, aura: '#ffd25e' },
  'crafting.golem': { base: 'humanoid', pal: { a: '#8a8a92', b: '#5a5a62', c: '#b0b0b8', d: '#7dffd8', e: '#7dffd8', w: '#ffffff', f: '#6a9a5a', n: '#3a3a42' },
    rows: { 1: '....ffaa', 10: 'bb.aaaad', 11: 'b..aadaa' }, aura: '#7dffd8' },

  // ---------- Artistry ----------
  'artistry.chameleon': {
    pal: { a: '#5ac06a', b: '#2a8a3a', c: '#a6e8a0', d: '#f0c020', f: '#e8435a', n: '#1a4a1a' },
    half: ['........', '........', '.....ddd', '....aaaa', '...aaaaa', '.bbaaaaa', 'bewbaaaa', 'beebaaaa', '.bbaaaaa', '..aaaaaa',
      '..aaaaan', '...ccccc', '...acfcc', '...aaccc', '...aaaac', '...bb..b'],
  },
  'artistry.peacock': { base: 'bird', pal: { a: '#2f6bd0', b: '#1d3f88', c: '#4ab0e0', d: '#3aa86a', f: '#f0c020', g: '#c8a050', n: '#3a3a48' },
    rows: { 0: '.d.d.d.b', 1: 'dfdfdf..', 2: 'ddddbbbb', 3: 'dfdbaaaa', 4: 'ddbaaaaa', 5: 'd.aaaaaa' } },
  'artistry.flamingo': { base: 'bird', pal: { a: '#f08aa8', b: '#c85a7a', c: '#f8c0d0', d: '#f8c0d0', g: '#f08aa8', n: '#2a1a20' } },
  'artistry.hummingbird': { base: 'bird', pal: { a: '#3ac0a0', b: '#1f8a70', c: '#c8f0e0', d: '#e8435a', g: '#3a3a48', n: '#2a2a34' },
    rows: { 10: 'bbaccccn' } },
  'artistry.koi-spirit': { base: 'sea', pal: { a: '#f4f0e8', b: '#c8c0b0', c: '#ffffff', d: '#e8602a', f: '#ffd84a', n: '#3a2a20' },
    rows: { 3: '....ddaa', 4: '...dddaa', 8: 'bbaaddda', 9: 'fbaccccc', 10: 'f.cccccc' }, aura: '#ffb07a' },
  'artistry.muse': {
    pal: { a: '#f4e0d0', b: '#8a5ac8', c: '#fff4f8', d: '#ffd84a', f: '#c8a0ff', e: '#5a3a8a', n: '#c8607a' },
    half: ['...bbbbb', '..bbbbbb', '.bbbaaaa', '.bbaaaaa', '.bbaewaa', '.bbaeeaa', '.bbaaaaa', '.bbbaaan', '.bb.dddd', 'bb.ccccc',
      'b.cccccc', '.cccfccc', 'ccccfccc', 'cccccccc', '.ccccccc', '..f.f.f.'],
    aura: '#e0c8ff',
  },

  // ---------- Music ----------
  'music.cricket': { base: 'bug', pal: { a: '#6ab03a', b: '#3a6a1a', c: '#a6e070', d: '#3a6a1a', n: '#1a2a10' },
    rows: { 0: 'b.......', 1: '.b......', 2: '..b..aaa' } },
  'music.songbird': { base: 'bird', pal: { a: '#f0c040', b: '#b88a20', c: '#fff0b0', d: '#e8602a', g: '#8a6a3a', n: '#8a6a3a' } },
  'music.parrot': { base: 'bird', pal: { a: '#3ab04a', b: '#1f7a2a', c: '#f0d040', d: '#e8302a', g: '#3a3a48', n: '#2a2a34' },
    rows: { 0: '......dd', 1: '.....ddd' } },
  'music.whale': { base: 'sea', pal: { a: '#3a6ab0', b: '#24447a', c: '#c8dcf0', d: '#ffffff', n: '#1a2a4a' },
    rows: { 0: '.....d.d', 1: '......dd', 2: '.......d' } },
  'music.nightingale': { base: 'bird', pal: { a: '#8a6a4a', b: '#5a3e28', c: '#e8d8c0', d: '#c8a070', g: '#6a5a4a', n: '#3a2a1a' },
    aura: '#ffd890' },
  'music.lyre-of-apollo': {
    pal: { a: '#ffd84a', b: '#c89a20', d: '#fff4b0', f: '#ffffff', e: '#5a3a10', n: '#5a3a10' },
    half: ['.aa.....', 'a..a....', 'a...aaaa', '.a..d.d.', '.a..d.d.', '.a..d.d.', '..a.d.d.', '..a.d.d.', '..aabbbb', '...aewaa',
      '...aeeaa', '...aaaan', '....aaaa', '.....bbb', '........', '....f.f.'],
    aura: '#fff4b0',
  },

  // ---------- Mindfulness ----------
  'mindfulness.turtle': { base: 'shell', pal: { a: '#8ac86a', b: '#3a6a2a', c: '#c8e8a0', d: '#5a9a3a', f: '#8ac86a', n: '#2a3a1a' } },
  'mindfulness.sloth': { base: 'round', pal: { a: '#a89878', b: '#6a5a44', c: '#e8dcc4', d: '#4a3a2a', n: '#2a2018' },
    rows: { 1: '........', 2: '........', 3: '........', 6: '..dddaaa', 7: '..dewaaa', 8: '..deeaaa' } },
  'mindfulness.red-panda': { base: 'cat', pal: { a: '#c85a2a', b: '#6a2a10', c: '#f8f0e8', d: '#f8f0e8', n: '#1a1010' },
    rows: { 9: 'cabaaaaa' } },
  'mindfulness.snow-leopard': { base: 'cat', pal: { a: '#e8e8ee', b: '#9a9aa8', c: '#ffffff', d: '#c8c8d8', f: '#4a4a58', e: '#3a8ac8', n: '#6a5a6a' },
    rows: { 5: '.afaaafa', 6: 'bafaaaaa', 9: 'caaafaaa' } },
  'mindfulness.spirit-fox': { base: 'cat', pal: { a: '#9fe0ff', b: '#5aa8e0', c: '#e8f8ff', d: '#ffffff', e: '#2a4a8a', n: '#2a4a6a' },
    aura: '#bff0ff' },
  'mindfulness.jade-dragon': {
    pal: { a: '#2fae6a', b: '#1d7a48', c: '#cdeeb0', d: '#ffd25e' },
    half: ['..d.....', '..dd....', '...db...', 'b..bbaaa', 'bb.baaaa', 'bbbaaaaa', 'bbaaewaa', '.baaeeaa', '.baaaaaa', '..baaacc',
      '..bacccc', '...bcccc', '...bacbc', '...baccc', '...ba.cc', '...dd...'],
    aura: '#7dffc0',
  },

  // ---------- Charisma ----------
  'charisma.puppy': { base: 'dog', pal: { a: '#e0b880', b: '#a07840', c: '#f8ecd8', d: '#8a6a40', f: '#f07090', n: '#2a1a10' },
    rows: { 12: '...cccff' } },
  'charisma.golden-retriever': { base: 'dog', pal: { a: '#e8b048', b: '#c08020', c: '#f8dca0', d: '#a87020', n: '#2a1a10' } },
  'charisma.dolphin': { base: 'sea', pal: { a: '#6a9ad0', b: '#3a6aa0', c: '#d8e8f8', d: '#ffffff', n: '#2a3a5a' },
    rows: { 1: '.......b', 2: '......bb' } },
  'charisma.lion-cub': { base: 'cat', pal: { a: '#e8b860', b: '#b07828', c: '#f8e8c0', d: '#f0a0a0', n: '#6a3a20' },
    rows: { 2: '.bb.bbbb', 3: 'bbbbbbbb', 4: 'bbbaaaaa', 5: 'bbaaaaaa', 6: 'bbaaaaaa', 7: 'baewaaaa', 8: 'baeeaaaa', 9: 'bbaaaaaa' } },
  'charisma.swan': { base: 'bird', pal: { a: '#f8f8fc', b: '#c8c8d8', c: '#ffffff', d: '#f8f8fc', g: '#2a2a34', n: '#f08a2a' },
    aura: '#ffffff' },
  'charisma.unicorn': { base: 'hoof', pal: { a: '#fff6fb', b: '#e0c8e8', c: '#ffffff', d: '#ffd84a', f: '#ffd84a', g: '#ff8ac8', n: '#e8a0b0' },
    rows: { 0: '.......f', 1: '.......f', 2: '.....aaf', 3: '...gaaaa', 4: 'bbggaaaa', 5: '.bgaaaaa', 6: '..gaewaa', 7: '..gaeeaa', 8: '...gaaaa' },
    aura: '#ffb8e8' },

  // ---------- Housekeeping ----------
  'housekeeping.hamster': { base: 'round', pal: { a: '#e8a860', b: '#b07030', c: '#fff0dc', d: '#f0b0b0', n: '#8a4a30' },
    rows: { 9: '.caaaaac', 10: '.ccaaacn' } },
  'housekeeping.tortoise': { base: 'shell', pal: { a: '#a89060', b: '#5a4a2a', c: '#d8c8a0', d: '#8a6a3a', f: '#c8a060', n: '#3a2a1a' } },
  'housekeeping.raccoon': { base: 'cat', pal: { a: '#8a8a96', b: '#4a4a56', c: '#e8e8ee', d: '#3a3a44', f: '#2a2a34', n: '#1a1a20' },
    rows: { 6: 'bfffffaa', 7: 'afewfaaa', 8: 'afeefaaa', 9: 'caffaaaa' } },
  'housekeeping.persian-cat': { base: 'cat', pal: { a: '#f4ece0', b: '#c8b8a0', c: '#ffffff', d: '#f0b0c0', e: '#4a8ad0', n: '#e08090' },
    rows: { 9: 'ccaaaaaa', 10: 'cccaaacc' } },
  'housekeeping.house-brownie': { base: 'humanoid', pal: { a: '#c89a6a', b: '#6a4a2a', c: '#8a5a3a', d: '#3a7a3a', n: '#6a3a2a' },
    rows: { 0: '......dd', 1: '.....ddd', 2: '...ddddd', 3: '..dddddd', 4: '.a.aewaa', 9: '.bbccccc', 10: 'bb.ccccc', 11: 'b..ccccc', 12: 'a..ccccc', 15: '...bb...' },
    aura: '#c8f0a0' },
  'housekeeping.kitsune': {
    pal: { a: '#f6f2ec', b: '#cfc6d8', c: '#ffffff', d: '#e0587a', f: '#6ad0ff', n: '#e0587a' },
    half: ['f.......', 'ff.a....', '.f.ab...', 'ff.adb..', '.fadaab.', 'f.aaaaaa', '.baaaaaa', '.adeaaaa', '.adeeaaa', '.aaaaaaa',
      '..baaaaa', '..bccccn', '...ccccc', 'f..aaacc', 'ff.aaacc', '.f.dd.cc'],
    aura: '#9fe0ff',
  },

  // ---------- Labour ----------
  'labour.office-plant': {
    pal: { a: '#4a9a3a', b: '#2a6a1a', c: '#c87a4a', d: '#a85a2a', n: '#4a2410' },
    half: ['....a.a.', '..a.aba.', '.aba.aba', '.abaabba', '..abbaab', '...abbbb', '..dddddd', '..cccccc', '..cewccc', '..ceeccc',
      '..cccccc', '...ccccn', '...ccccc', '....cccc', '....dddd', '........'],
  },
  'labour.pug': { base: 'dog', pal: { a: '#e0c8a0', b: '#3a2e28', c: '#f0e0c0', d: '#3a2e28', n: '#1a1410' },
    rows: { 5: 'bbaabaab', 9: '.baabbbb', 10: '..abbbbb', 11: '..abbbbn' } },
  'labour.ox': { base: 'hoof', pal: { a: '#8a6a4a', b: '#5a3e28', c: '#c8a880', d: '#3a2a1a', f: '#e8dcc0', n: '#2a1a10' },
    rows: { 2: 'f....aaa', 3: 'ff..aaaa' } },
  'labour.eagle': { base: 'bird', pal: { a: '#f8f4ec', b: '#3e2a16', c: '#6a4a2a', d: '#6a4a2a', g: '#f0b020', n: '#f0b020' } },
  'labour.bull': { base: 'hoof', pal: { a: '#3a2a2a', b: '#1f1414', c: '#6a4a4a', d: '#1f1414', f: '#f0e0c0', g: '#ffd84a', n: '#0f0a0a' },
    rows: { 2: 'f....aaa', 3: 'ff..aaaa', 12: '....cgcc' }, aura: '#ff7a5a' },
  'labour.atlas': {
    pal: { a: '#c8a070', b: '#8a6a40', c: '#4a6ad0', d: '#4ac06a', n: '#5a3a20' },
    half: ['.....ccc', '....cdcc', '....ccdd', '..a..ccc', '..a.aaaa', '..aaaaaa', '..aaewaa', '...aeeaa', '...aaaan', '..bbbbbb',
      '..baaaaa', '...aabaa', '...bbbbb', '....aa..', '....aa..', '...bbb..'],
    aura: '#ffe680',
  },
};
