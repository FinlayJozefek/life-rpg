// Dungeon content: sections, enemy families and types, bosses, weapon moves,
// gear for every section, potions and materials. Numbers marked TUNED are set
// from the fight simulator (tools/dsim.mjs), not by hand.

export const RAR = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'];
export const RAR_NAME = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic', divine: 'Divine' };
export const RAR_COLOR = { common: '#b8b8b0', uncommon: '#5fbf5a', rare: '#4a90e2', epic: '#a35ae0', legendary: '#f0a020', mythic: '#e8435a', divine: '#fff1a8' };

// Item stat budget = SECTION_SCALE[section] x RARITY_MULT[rarity].
// Section 1 matches the spec's examples (Common weapon +5, Uncommon +10, Rare +18, Epic +28, Legendary ~40).
// Each section is ~2.2x the last, so a section's Rares ~= the previous section's Legendary.
export const SECTION_SCALE = [5, 11.1, 24.7, 54.8, 121.7];
// Health on gear grows a bit faster in later sections so the player's base 100 Health
// doesn't leave them proportionally squishier the higher they climb (section 1 = the spec's numbers).
export const HP_SCALE = [1, 1.87, 2.28, 2.47, 2.55];
export const RARITY_MULT = { common: 1, uncommon: 2, rare: 3.6, epic: 5.6, legendary: 8, mythic: 11, divine: 15 };

export const DMG_TYPES = ['slashing', 'piercing', 'blunt', 'fire', 'frost', 'lightning', 'holy', 'poison'];
export const TYPE_NAME = { slashing: 'Slashing', piercing: 'Piercing', blunt: 'Blunt', fire: 'Fire', frost: 'Frost', lightning: 'Lightning', holy: 'Holy', poison: 'Poison', bleed: 'Bleed' };

export const WEAK_MULT = 1.5;
export const RESIST_MULT = 0.5;

export const FAMILIES = {
  goblinoid: { name: 'Goblinoid', weak: ['slashing', 'fire'], resist: ['poison'] },
  undead: { name: 'Undead', weak: ['holy', 'blunt'], resist: ['poison', 'bleed'] },
  construct: { name: 'Construct', weak: ['blunt', 'lightning'], resist: ['slashing', 'bleed'] },
  beast: { name: 'Beast', weak: ['piercing', 'poison'], resist: ['frost'] },
  demon: { name: 'Demon', weak: ['holy', 'frost'], resist: ['fire'] },
};

export const SECTIONS = [
  { id: 1, name: 'Goblin Warrens', family: 'goblinoid', boss: 'goblin-king', crypts: 1, material: 'goblin-scrap', guest: 'beast' },
  { id: 2, name: 'Haunted Crypt', family: 'undead', boss: 'lich', crypts: 5, material: 'bone-dust', guest: 'goblinoid' },
  { id: 3, name: 'Stone Depths', family: 'construct', boss: 'stone-golem', crypts: 12, material: 'runestone', guest: 'undead' },
  { id: 4, name: 'Frozen Peaks', family: 'beast', boss: 'frost-wyrm', crypts: 20, material: 'frost-shard', guest: 'construct' },
  { id: 5, name: 'Infernal Spire', family: 'demon', boss: 'demon-lord', crypts: 30, material: 'demon-ember', guest: 'beast' },
];

export const MATERIALS = {
  'goblin-scrap': { name: 'Goblin Scrap', section: 1 },
  'bone-dust': { name: 'Bone Dust', section: 2 },
  runestone: { name: 'Runestone', section: 3 },
  'frost-shard': { name: 'Frost Shard', section: 4 },
  'demon-ember': { name: 'Demon Ember', section: 5 },
};

// ---------- enemies ----------
// Stats are multipliers on the section's enemy baseline (see ENEMY_BASE in dgame.js).
// move: { name, power, type, chance (weight), effect?, tele? (telegraphed: announced a turn early, hits much harder) }
const m = (name, power, type, weight, extra = {}) => ({ name, power, type, weight, ...extra });

export const ENEMIES = {
  // Goblinoid
  goblin: { name: 'Goblin', family: 'goblinoid', hp: 1, atk: 1, def: 1, moves: [m('Stab', 1, 'piercing', 3), m('Dirty Kick', 1.3, 'blunt', 1)] },
  'goblin-archer': { name: 'Goblin Archer', family: 'goblinoid', hp: 0.75, atk: 1.25, def: 0.7, fast: true, moves: [m('Arrow', 1, 'piercing', 3), m('Aimed Arrow', 2.2, 'piercing', 1, { tele: 'draws back a heavy arrow…' })] },
  'goblin-shaman': { name: 'Goblin Shaman', family: 'goblinoid', hp: 0.8, atk: 0.8, def: 0.8, healer: 0.18, moves: [m('Hex Bolt', 1, 'fire', 2), m('Mend', 0, 'heal', 2)] },
  'orc-brute': { name: 'Orc Brute', family: 'goblinoid', hp: 1.7, atk: 1.25, def: 1.3, moves: [m('Club', 1, 'blunt', 3), m('Overhead Smash', 2.4, 'blunt', 1, { tele: 'raises its club high…' })] },
  troll: { name: 'Troll', family: 'goblinoid', hp: 2.6, atk: 1.1, def: 1.1, regen: 0.04, moves: [m('Pummel', 1, 'blunt', 3), m('Boulder Toss', 2.3, 'blunt', 1, { tele: 'heaves up a boulder…' })] },
  // Undead
  skeleton: { name: 'Skeleton', family: 'undead', hp: 0.9, atk: 1, def: 1.1, moves: [m('Rusty Slash', 1, 'slashing', 3), m('Bone Throw', 1.3, 'blunt', 1)] },
  zombie: { name: 'Zombie', family: 'undead', hp: 1.5, atk: 0.9, def: 0.8, moves: [m('Claw', 1, 'slashing', 2), m('Infected Bite', 0.9, 'poison', 2, { poison: 0.12 })] },
  wraith: { name: 'Wraith', family: 'undead', hp: 0.8, atk: 1.2, def: 0.7, dodge: 0.3, moves: [m('Chill Touch', 1, 'frost', 3), m('Wail', 2.2, 'frost', 1, { tele: 'lets out a rising wail…' })] },
  ghoul: { name: 'Ghoul', family: 'undead', hp: 1.2, atk: 1.15, def: 0.9, fast: true, moves: [m('Rend', 1, 'slashing', 3, { bleed: 0.1 })] },
  // Construct
  gargoyle: { name: 'Gargoyle', family: 'construct', hp: 1, atk: 1, def: 1.6, moves: [m('Stone Claw', 1, 'slashing', 3), m('Dive', 2.2, 'blunt', 1, { tele: 'takes to the air…' })] },
  'stone-sentinel': { name: 'Stone Sentinel', family: 'construct', hp: 1.6, atk: 1.1, def: 1.4, moves: [m('Slam', 1, 'blunt', 3), m('Crush', 2.3, 'blunt', 1, { tele: 'grinds its fists together…' })] },
  'animated-armour': { name: 'Animated Armour', family: 'construct', hp: 1.1, atk: 1.15, def: 1.5, moves: [m('Halberd Swing', 1.1, 'slashing', 3)] },
  'clay-golem': { name: 'Clay Golem', family: 'construct', hp: 2, atk: 0.9, def: 1, regen: 0.05, moves: [m('Mud Fist', 1, 'blunt', 3)] },
  // Beast
  wolf: { name: 'Wolf', family: 'beast', hp: 0.8, atk: 1.1, def: 0.8, fast: true, moves: [m('Bite', 1, 'piercing', 3, { bleed: 0.1 })] },
  warg: { name: 'Warg', family: 'beast', hp: 1.2, atk: 1.2, def: 0.9, fast: true, moves: [m('Maul', 1, 'piercing', 3), m('Pounce', 2.1, 'piercing', 1, { tele: 'crouches low, ready to pounce…' })] },
  yeti: { name: 'Yeti', family: 'beast', hp: 1.9, atk: 1.15, def: 1.1, moves: [m('Swipe', 1, 'slashing', 3), m('Avalanche Slam', 2.2, 'blunt', 1, { tele: 'beats its chest…', stun: 0.4 })] },
  'ice-bear': { name: 'Ice Bear', family: 'beast', hp: 1.6, atk: 1.25, def: 1.2, moves: [m('Claw', 1, 'slashing', 3), m('Frost Breath', 1, 'frost', 1, { slow: 2 })] },
  // Demon
  imp: { name: 'Imp', family: 'demon', hp: 0.7, atk: 1.1, def: 0.8, fast: true, dodge: 0.15, moves: [m('Firebolt', 1, 'fire', 3, { burn: 0.25 })] },
  hellhound: { name: 'Hellhound', family: 'demon', hp: 1.1, atk: 1.2, def: 0.9, fast: true, moves: [m('Searing Bite', 1, 'fire', 3, { burn: 0.2 }), m('Inferno Breath', 2.2, 'fire', 1, { tele: 'smoke pours from its jaws…', burn: 0.6 })] },
  fiend: { name: 'Fiend', family: 'demon', hp: 1.4, atk: 1.2, def: 1.2, moves: [m('Claw', 1, 'slashing', 3), m('Hellstrike', 2.3, 'fire', 1, { tele: 'gathers hellfire…' })] },
  'pit-demon': { name: 'Pit Demon', family: 'demon', hp: 2.2, atk: 1.25, def: 1.3, moves: [m('Brimstone Fist', 1, 'fire', 3, { burn: 0.15 }), m('Pit Slam', 2.5, 'blunt', 1, { tele: 'rears up to its full height…' })] },
};

// Which enemy types each family uses, by how deep into the section you are (early → late).
export const FAMILY_ROSTER = {
  goblinoid: [['goblin', 'goblin-archer'], ['goblin', 'goblin-archer', 'goblin-shaman'], ['goblin-shaman', 'orc-brute', 'goblin-archer'], ['orc-brute', 'troll', 'goblin-shaman']],
  undead: [['skeleton', 'zombie'], ['skeleton', 'zombie', 'ghoul'], ['wraith', 'ghoul', 'zombie'], ['wraith', 'ghoul', 'skeleton']],
  construct: [['gargoyle', 'animated-armour'], ['gargoyle', 'stone-sentinel'], ['animated-armour', 'clay-golem', 'stone-sentinel'], ['stone-sentinel', 'clay-golem', 'gargoyle']],
  beast: [['wolf', 'warg'], ['wolf', 'warg', 'ice-bear'], ['warg', 'yeti', 'ice-bear'], ['yeti', 'ice-bear', 'warg']],
  demon: [['imp', 'hellhound'], ['imp', 'hellhound', 'fiend'], ['fiend', 'hellhound', 'pit-demon'], ['pit-demon', 'fiend', 'imp']],
};

// Bosses follow a fixed pattern (so players can learn it) and get a phase 2 at 50% Health.
// TUNED: hp / atk / def multipliers on the section baseline.
export const BOSSES = {
  'goblin-king': {
    name: 'Goblin King', family: 'goblinoid', hp: 9.75, atk: 3.617, def: 1.5,
    pattern: ['Royal Swipe', 'Royal Swipe', 'Call Guards', 'Crushing Blow'],
    phase2: { at: 0.5, atk: 1.25, text: 'The Goblin King flies into a rage!', pattern: ['Royal Swipe', 'Crushing Blow', 'Royal Swipe', 'Frenzy', 'Crushing Blow'] },
    moves: {
      'Royal Swipe': m('Royal Swipe', 1, 'slashing', 1),
      'Call Guards': m('Call Guards', 0, 'summon', 1, { summon: 'goblin' }),
      'Crushing Blow': m('Crushing Blow', 2.2, 'blunt', 1, { tele: 'The Goblin King raises his great club…' }),
      Frenzy: m('Frenzy', 0.7, 'slashing', 1, { hits: 3 }),
    },
  },
  lich: {
    name: 'Lich', family: 'undead', hp: 5.08, atk: 4.461, def: 1.4, extraWeak: ['holy'],
    pattern: ['Shadow Bolt', 'Curse', 'Shadow Bolt', 'Soul Drain'],
    phase2: { at: 0.5, atk: 1.25, text: 'The Lich tears open its phylactery! Dark energy floods the room.', pattern: ['Shadow Bolt', 'Soul Drain', 'Raise Dead', 'Shadow Bolt', 'Soul Drain'] },
    moves: {
      'Shadow Bolt': m('Shadow Bolt', 1, 'frost', 1),
      Curse: m('Curse', 0.5, 'poison', 1, { poison: 0.15 }),
      'Soul Drain': m('Soul Drain', 2.0, 'frost', 1, { tele: 'The Lich is gathering dark energy…', lowDefBonus: true, lifesteal: 0.5 }),
      'Raise Dead': m('Raise Dead', 0, 'summon', 1, { summon: 'skeleton' }),
    },
  },
  'stone-golem': {
    name: 'Stone Golem', family: 'construct', hp: 6.25, atk: 4.244, def: 2,
    pattern: ['Stone Fist', 'Stone Fist', 'Harden', 'Shatter'],
    phase2: { at: 0.5, atk: 1.25, text: 'Cracks glow across the Stone Golem — it begins to crumble and rage!', pattern: ['Stone Fist', 'Shatter', 'Stone Fist', 'Earthquake', 'Shatter'] },
    moves: {
      'Stone Fist': m('Stone Fist', 1, 'blunt', 1),
      Harden: m('Harden', 0, 'buff', 1, { defUp: 0.6 }),
      Shatter: m('Shatter', 2.1, 'blunt', 1, { tele: 'The Stone Golem winds up a shattering punch…', ignoreWeakArmour: true }),
      Earthquake: m('Earthquake', 1.5, 'blunt', 1, { stun: 0.35 }),
    },
  },
  'frost-wyrm': {
    name: 'Frost Wyrm', family: 'beast', hp: 8.58, atk: 3.834, def: 1.5,
    pattern: ['Bite', 'Frost Breath', 'Bite', 'Tail Sweep'],
    phase2: { at: 0.5, atk: 1.25, text: 'The Frost Wyrm takes to the air, the cold biting deeper!', pattern: ['Frost Breath', 'Bite', 'Blizzard', 'Tail Sweep', 'Bite'] },
    moves: {
      Bite: m('Bite', 1, 'piercing', 1),
      'Frost Breath': m('Frost Breath', 1.3, 'frost', 1, { freeze: 0.3 }),
      'Tail Sweep': m('Tail Sweep', 2.2, 'blunt', 1, { tele: 'The Frost Wyrm coils its tail…' }),
      Blizzard: m('Blizzard', 2.0, 'frost', 1, { tele: 'The air turns white around the Frost Wyrm…', slow: 2 }),
    },
  },
  'demon-lord': {
    name: 'Demon Lord', family: 'demon', hp: 10.52, atk: 3.882, def: 1.5,
    pattern: ['Hellblade', 'Hellblade', 'Brimstone', 'Infernal Cleave'],
    phase2: { at: 0.5, atk: 1.3, text: 'The Demon Lord unfurls his wings — the Spire erupts in flame!', pattern: ['Hellblade', 'Infernal Cleave', 'Brimstone', 'Hellblade', 'Doom'] },
    moves: {
      Hellblade: m('Hellblade', 1, 'slashing', 1),
      Brimstone: m('Brimstone', 0.8, 'fire', 1, { burn: 0.6 }),
      'Infernal Cleave': m('Infernal Cleave', 2.1, 'fire', 1, { tele: 'The Demon Lord drags his blade through the flames…' }),
      Doom: m('Doom', 2.5, 'fire', 1, { tele: 'The Demon Lord begins chanting a word of Doom…' }),
    },
  },
};

// ---------- weapons ----------
// Each weapon type's 4 standard moves. power is a damage multiplier (0 = utility).
// charges: uses per fight (null = unlimited).
const mv = (name, power, extra = {}) => ({ name, power, charges: null, ...extra });
export const WEAPON_TYPES = {
  sword: { name: 'Sword', dtype: 'slashing', moves: [mv('Slash', 1), mv('Master Slash', 2.1, { charges: 3 }), mv('Parry', 0, { parry: true }), mv('Lacerate', 0.6, { bleed: 1 })] },
  dagger: { name: 'Dagger', dtype: 'piercing', moves: [mv('Stab', 1), mv('Quick Strike', 0.55, { hits: 2 }), mv('Backstab', 1.6, { charges: 3, critBonus: 0.45 }), mv('Poison Tip', 0.5, { poison: 1, dtype: 'poison' })] },
  axe: { name: 'Axe', dtype: 'slashing', moves: [mv('Chop', 1), mv('Cleave', 0.75, { aoe: true }), mv('Rend', 0.6, { bleed: 1 }), mv('Heavy Swing', 2, { charges: 3 })] },
  hammer: { name: 'Hammer', dtype: 'blunt', moves: [mv('Smash', 1), mv('Ground Pound', 1, { stun: 0.35 }), mv('Brace', 0, { brace: true }), mv('Crush', 1.6, { charges: 3, ignoreDef: 0.3 })] },
  spear: { name: 'Spear', dtype: 'piercing', moves: [mv('Thrust', 1), mv('Lunge', 1.1, { first: true }), mv('Impale', 2.1, { charges: 3 }), mv('Sweep', 0.6, { aoe: true })] },
  bow: { name: 'Bow', dtype: 'piercing', moves: [mv('Quick Shot', 1), mv('Aimed Shot', 2.4, { aim: true, critBonus: 0.4 }), mv('Volley', 0.7, { aoe: true }), mv('Pinning Shot', 0.7, { slow: 2 })] },
  staff: { name: 'Staff', dtype: 'element', moves: [mv('Bolt', 1), mv('Ward', 0, { ward: 0.3 }), mv('Elemental Spell', 2.2, { charges: 3 }), mv('Siphon', 0.7, { lifesteal: 0.5 })] },
  gauntlet: { name: 'Gauntlet', dtype: 'blunt', moves: [mv('Jab', 1), mv('Uppercut', 1.1, { stun: 0.3 }), mv('Combo', 0.38, { hits: 3 }), mv('Guard', 0, { brace: true, half: true })] },
};

// Signature moves. They replace the weapon type's 4th (and for 2 signatures, 3rd) standard move.
export const SIGNATURES = {
  'Savage Chop': mv('Savage Chop', 1.6, { charges: 3, bleed: 1 }),
  'Royal Decree': mv('Royal Decree', 1.2, { charges: 2, stun: 0.6 }),
  'Crown Smash': mv('Crown Smash', 2.2, { charges: 3 }),
  'Goblin Fury': mv('Goblin Fury', 0.4, { hits: 3, critBonus: 0.1 }),
  Smite: mv('Smite', 2.1, { charges: 3, dtype: 'holy' }),
  'Phantom Cut': mv('Phantom Cut', 1.1, { sure: true, ignoreDef: 0.3 }),
  'Soul Siphon': mv('Soul Siphon', 1.1, { charges: 3, lifesteal: 0.6, dtype: 'frost' }),
  'Grave Chill': mv('Grave Chill', 1, { freeze: 0.2, dtype: 'frost' }),
  'Rune Strike': mv('Rune Strike', 1.7, { charges: 3, dtype: 'lightning' }),
  Quake: mv('Quake', 0.7, { aoe: true, stun: 0.25 }),
  Landslide: mv('Landslide', 2.6, { charges: 2 }),
  'Titan Strike': mv('Titan Strike', 1.05, { titan: true }),
  Colossus: mv('Colossus', 2.8, { charges: 2 }),
  'Ice Arrow': mv('Ice Arrow', 1.05, { slow: 2, dtype: 'frost' }),
  'Glacial Edge': mv('Glacial Edge', 1.3, { charges: 2, freeze: 1, dtype: 'frost' }),
  'Frost Volley': mv('Frost Volley', 0.7, { aoe: true, slow: 1, dtype: 'frost' }),
  'Piercing Gale': mv('Piercing Gale', 2.4, { charges: 3, ignoreDef: 0.3 }),
  Whiteout: mv('Whiteout', 0.6, { charges: 1, aoe: true, freeze: 1, dtype: 'frost' }),
  Avalanche: mv('Avalanche', 2.6, { charges: 3, dtype: 'frost' }),
  'Soul Drink': mv('Soul Drink', 1.3, { charges: 3, lifesteal: 0.35 }),
  Hellfire: mv('Hellfire', 0.6, { aoe: true, burn: 1, dtype: 'fire' }),
  'Infernal Impale': mv('Infernal Impale', 2.4, { charges: 3, burn: 1, dtype: 'fire' }),
  'Brimstone Rain': mv('Brimstone Rain', 0.7, { aoe: true, burn: 1, dtype: 'fire' }),
  Dawnbreak: mv('Dawnbreak', 3.2, { charges: 2, dtype: 'holy' }),
  Purify: mv('Purify', 0, { charges: 1, cleanse: true, heal: 0.25 }),
  'Demonbane Strike': mv('Demonbane Strike', 1.9, { charges: 3, dtype: 'holy' }),
  'Hunter\'s Mark': mv('Hunter\'s Mark', 1.5, { charges: 3, critBonus: 0.3 }),
  'Stone Breaker': mv('Stone Breaker', 1.8, { charges: 3, ignoreDef: 0.3 }),
};

// ---------- gear ----------
// Item spec shorthand: [rarity, slot, name, kind/weaponType, extras]
// slot: weapon | helmet | chest | legs | boots | offhand
// grindDrop: fixed chance per normal-enemy kill instead of the usual rarity roll (final-boss weapons).
// extras: crit, dodge, slayer:{family,bonus}, sig:[...], passive fields (see engine), set: setId, dtype override
const SETS = {
  'goblin-warlord': { name: 'Goblin Warlord', section: 1, bonus: { crit: 0.1 }, text: '+10% crit chance' },
  wraithweave: { name: 'Wraithweave', section: 2, bonus: { hpPct: 0.15 }, text: '+15% Health' },
  obsidian: { name: 'Obsidian', section: 3, bonus: { defPct: 0.2 }, text: '+20% Defence' },
  rimeguard: { name: 'Rimeguard', section: 4, bonus: { dodge: 0.1, freezeImmune: true }, text: '+10% dodge, immune to freeze' },
  dread: { name: 'Dread', section: 5, bonus: { dmgPct: 0.15, burnOnHit: 0.25 }, text: '+15% damage, 25% chance to burn on hit' },
};
export { SETS };

const G = {
  1: [
    ['common', 'weapon', 'Rusty Dagger', 'dagger'], ['common', 'helmet', 'Patched Leather Cap'], ['common', 'chest', 'Burlap Tunic'],
    ['common', 'legs', 'Ragged Trousers'], ['common', 'boots', 'Frayed Boots'], ['common', 'offhand', 'Splintered Plank', 'shield'],
    ['uncommon', 'weapon', 'Iron Shortsword', 'sword'], ['uncommon', 'helmet', 'Iron Skullcap'], ['uncommon', 'chest', 'Studded Leather Vest'],
    ['uncommon', 'legs', 'Studded Leggings'], ['uncommon', 'boots', 'Studded Boots'], ['uncommon', 'offhand', 'Wooden Buckler', 'shield'],
    ['rare', 'weapon', 'Goblin Cleaver', 'axe', { bleedOnHit: 0.05, sig: ['Savage Chop'] }], ['rare', 'helmet', "Scout's Hood", null, { crit: 0.05 }],
    ['rare', 'chest', "Scout's Jerkin"], ['rare', 'legs', "Scout's Breeches"], ['rare', 'boots', "Scout's Treads", null, { dodge: 0.03 }],
    ['rare', 'offhand', 'Goblin War Drum', 'tome'], ['rare', 'weapon', 'Goblin Bane Axe', 'axe', { slayer: { family: 'goblinoid', bonus: 0.4 }, sig: ['Goblin Fury'] }],
    ['epic', 'weapon', 'Warg-Fang Spear', 'spear', { firstStrike: true, sig: ['Hunter\'s Mark'] }], ['epic', 'helmet', 'Goblin Warlord Helm', null, { set: 'goblin-warlord' }],
    ['epic', 'chest', 'Goblin Chain Hauberk', null, { set: 'goblin-warlord' }], ['epic', 'legs', 'Goblin Warlord Greaves', null, { set: 'goblin-warlord' }],
    ['epic', 'boots', 'Goblin Warlord Boots', null, { set: 'goblin-warlord' }], ['epic', 'offhand', "Warlord's Shield", 'shield'],
    ['legendary', 'helmet', "Goblin King's Crown", null, { defMult: 0.85, crit: 0.15, coinBonus: 0.1 }],
    ['legendary', 'weapon', "Goblin King's Sceptre", 'hammer', { sig: ['Royal Decree', 'Crown Smash'] }],
  ],
  2: [
    ['common', 'weapon', 'Bone Club', 'hammer'], ['common', 'helmet', 'Grave-Dirt Hood'], ['common', 'chest', "Mourner's Robe"],
    ['common', 'legs', "Gravedigger's Trousers"], ['common', 'boots', 'Crypt Sandals'], ['common', 'offhand', 'Coffin Lid', 'shield'],
    ['uncommon', 'weapon', 'Silver Mace', 'hammer', { slayer: { family: 'undead', bonus: 0.25 } }], ['uncommon', 'helmet', 'Chain Coif'],
    ['uncommon', 'chest', 'Chainmail Shirt'], ['uncommon', 'legs', 'Chainmail Leggings'], ['uncommon', 'boots', 'Iron Sabatons'],
    ['uncommon', 'offhand', 'Candle Lantern', 'lantern', { dodge: 0.05 }],
    ['rare', 'weapon', 'Blessed Longsword', 'sword', { dtype: 'holy', sig: ['Smite'] }], ['rare', 'helmet', 'Bonecage Helm'],
    ['rare', 'chest', 'Bonecage Chestplate'], ['rare', 'legs', 'Bonecage Legguards'], ['rare', 'boots', 'Bonecage Boots'],
    ['rare', 'offhand', 'Holy Water Flask', 'flask', { healStart: 0.1 }],
    ['epic', 'weapon', 'Spectral Blade', 'sword', { ignoreDef: 0.2, sig: ['Phantom Cut'] }], ['epic', 'helmet', 'Wraithweave Hood', null, { set: 'wraithweave' }],
    ['epic', 'chest', 'Wraithweave Robe', null, { set: 'wraithweave' }], ['epic', 'legs', 'Wraithweave Leggings', null, { set: 'wraithweave', dodge: 0.1 }],
    ['epic', 'boots', 'Wraithweave Boots', null, { set: 'wraithweave' }], ['epic', 'offhand', 'Tome of Rites', 'tome', { dtype: 'holy' }],
    ['legendary', 'offhand', "Lich's Phylactery", 'relic', { revive: 0.3, grantMove: 'Soul Siphon' }],
    ['legendary', 'weapon', 'Deathwhisper Staff', 'staff', { dtype: 'frost', sig: ['Grave Chill', 'Soul Siphon'] }],
  ],
  3: [
    ['common', 'weapon', "Miner's Pickaxe", 'axe'], ['common', 'helmet', 'Hard Leather Helm'], ['common', 'chest', 'Quarry Vest'],
    ['common', 'legs', 'Quarry Trousers'], ['common', 'boots', 'Hobnail Boots'], ['common', 'offhand', 'Slate Buckler', 'shield'],
    ['uncommon', 'weapon', 'Granite Warhammer', 'hammer'], ['uncommon', 'helmet', 'Iron Helm'], ['uncommon', 'chest', 'Iron Breastplate'],
    ['uncommon', 'legs', 'Iron Greaves'], ['uncommon', 'boots', 'Iron Boots'], ['uncommon', 'offhand', 'Tower Shield', 'shield', { defMult: 1.5, atkPct: -0.1 }],
    ['rare', 'weapon', 'Runed Battleaxe', 'axe', { sig: ['Rune Strike'] }], ['rare', 'helmet', 'Dwarven Helm'], ['rare', 'chest', 'Dwarven Cuirass'],
    ['rare', 'legs', 'Dwarven Legplates'], ['rare', 'boots', 'Dwarven Boots'], ['rare', 'offhand', 'Runestone Tome', 'tome', { dtype: 'lightning' }],
    ['rare', 'weapon', 'Golembreaker', 'hammer', { slayer: { family: 'construct', bonus: 0.4 }, sig: ['Stone Breaker'] }],
    ['epic', 'weapon', 'Earthshaker Maul', 'hammer', { stunOnHit: 0.1, sig: ['Quake'] }], ['epic', 'helmet', 'Obsidian Helm', null, { set: 'obsidian' }],
    ['epic', 'chest', 'Obsidian Plate', null, { set: 'obsidian' }], ['epic', 'legs', 'Obsidian Greaves', null, { set: 'obsidian' }],
    ['epic', 'boots', 'Obsidian Boots', null, { set: 'obsidian' }], ['epic', 'offhand', 'Obsidian Bulwark', 'shield'],
    ['legendary', 'chest', 'Golemheart Plate', null, { defMult: 1.5, reflect: 0.15 }],
    ['legendary', 'weapon', 'Mountainheart Hammer', 'hammer', { sig: ['Quake', 'Landslide'] }],
    ['mythic', 'weapon', "Titan's Fist", 'gauntlet', { titan: true, sig: ['Titan Strike', 'Colossus'] }],
    // Blacksmith exclusives (bought, never dropped)
    ['legendary', 'chest', 'Deepforge Cuirass', null, { shopOnly: true, defMult: 1.3, healStart: 0.15 }],
    ['legendary', 'weapon', "Runesmith's Maul", 'hammer', { shopOnly: true, ignoreDef: 0.25, sig: ['Rune Strike', 'Landslide'] }],
    ['mythic', 'offhand', 'Heart of the Mountain', 'relic', { shopOnly: true, allStats: 0.2, reflect: 0.2, cheatDeath: true }],
  ],
  4: [
    ['common', 'weapon', 'Ice Pick', 'dagger'], ['common', 'helmet', 'Fur Hat'], ['common', 'chest', 'Padded Parka'],
    ['common', 'legs', 'Fur Leggings'], ['common', 'boots', 'Snowshoes'], ['common', 'offhand', 'Iceblock Buckler', 'shield'],
    ['uncommon', 'weapon', 'Frostbite Spear', 'spear', { slowOnHit: 0.2, dtype: 'frost' }], ['uncommon', 'helmet', 'Yeti-Hide Cap'],
    ['uncommon', 'chest', 'Yeti-Hide Coat'], ['uncommon', 'legs', 'Yeti-Hide Leggings'], ['uncommon', 'boots', 'Yeti-Hide Boots'],
    ['uncommon', 'offhand', 'Ice Shield', 'shield'],
    ['rare', 'weapon', 'Glacier Bow', 'bow', { sig: ['Ice Arrow'] }], ['rare', 'helmet', 'Wolf-Pelt Hood'], ['rare', 'chest', 'Wolf-Pelt Mantle'],
    ['rare', 'legs', 'Wolf-Pelt Leggings'], ['rare', 'boots', 'Wolf-Pelt Boots'], ['rare', 'offhand', 'Frost Lantern', 'lantern', { dodge: 0.06 }],
    ['rare', 'weapon', "Huntsman's Spear", 'spear', { slayer: { family: 'beast', bonus: 0.4 }, sig: ['Hunter\'s Mark'] }],
    ['epic', 'weapon', 'Frostbrand Longsword', 'sword', { freezeOnHit: 0.1, sig: ['Glacial Edge'] }], ['epic', 'helmet', 'Rimeguard Helm', null, { set: 'rimeguard' }],
    ['epic', 'chest', 'Rimeguard Armour', null, { set: 'rimeguard' }], ['epic', 'legs', 'Rimeguard Greaves', null, { set: 'rimeguard' }],
    ['epic', 'boots', 'Rimeguard Boots', null, { set: 'rimeguard' }], ['epic', 'offhand', 'Rimeguard Shield', 'shield'],
    ['legendary', 'helmet', 'Wyrmscale Helm', null, { freezeImmune: true, crit: 0.2 }],
    ['legendary', 'weapon', 'Wyrmfang Bow', 'bow', { sig: ['Frost Volley', 'Piercing Gale'] }],
    ['mythic', 'weapon', 'Blizzard Staff', 'staff', { grindDrop: 1 / 2000, dtype: 'frost', blizzard: 0.25, sig: ['Whiteout', 'Avalanche'] }],
    // Blacksmith exclusives
    ['legendary', 'boots', 'Windrunner Boots', null, { shopOnly: true, dodge: 0.12, firstStrike: true }],
    ['legendary', 'offhand', 'Everfrost Lantern', 'lantern', { shopOnly: true, dodge: 0.1, freezeImmune: true, slowOnHit: 0.3 }],
    ['mythic', 'chest', 'Aurora Plate', null, { shopOnly: true, defMult: 1.4, healStart: 0.25, freezeImmune: true }],
  ],
  5: [
    ['common', 'weapon', 'Charred Blade', 'sword'], ['common', 'helmet', 'Ashen Hood'], ['common', 'chest', 'Cinder Tunic'],
    ['common', 'legs', 'Cinder Leggings'], ['common', 'boots', 'Ember Boots'], ['common', 'offhand', 'Scorched Buckler', 'shield'],
    ['uncommon', 'weapon', 'Hellforged Axe', 'axe'], ['uncommon', 'helmet', 'Brimstone Helm'], ['uncommon', 'chest', 'Brimstone Mail'],
    ['uncommon', 'legs', 'Brimstone Greaves'], ['uncommon', 'boots', 'Brimstone Boots'], ['uncommon', 'offhand', 'Ember Ward', 'shield'],
    ['rare', 'weapon', 'Soulfire Dagger', 'dagger', { lifesteal: 0.1, sig: ['Soul Drink'] }], ['rare', 'helmet', 'Demonhorn Helm'],
    ['rare', 'chest', 'Demonhide Vest'], ['rare', 'legs', 'Demonhide Leggings'], ['rare', 'boots', 'Demonhide Boots'],
    ['rare', 'offhand', 'Infernal Tome', 'tome', { dtype: 'fire' }],
    ['mythic', 'weapon', 'Demonbane Blade', 'sword', { grindDrop: 1 / 2000, dtype: 'holy', slayer: { family: 'demon', bonus: 0.4 }, sig: ['Demonbane Strike'] }],
    ['epic', 'weapon', 'Infernal Greatsword', 'sword', { burnOnHit: 0.3, sig: ['Hellfire'] }], ['epic', 'helmet', 'Dread Helm', null, { set: 'dread' }],
    ['epic', 'chest', 'Dread Plate', null, { set: 'dread' }], ['epic', 'legs', 'Dread Greaves', null, { set: 'dread' }],
    ['epic', 'boots', 'Dread Sabatons', null, { set: 'dread' }], ['epic', 'offhand', 'Dread Aegis', 'shield'],
    ['legendary', 'helmet', 'Hellfire Crown', null, { dmgPct: 0.25, burnAttackers: 0.5 }],
    ['legendary', 'weapon', "Demon Lord's Trident", 'spear', { dtype: 'fire', sig: ['Infernal Impale', 'Brimstone Rain'] }],
    ['mythic', 'weapon', 'Ashbringer', 'sword', { grindDrop: 1 / 2000, dtype: 'holy', killHeal: 1, sig: ['Dawnbreak', 'Purify'] }],
    ['divine', 'offhand', 'Wings of the Seraph', 'relic', { allStats: 0.3, cheatDeath: true }],
    // Blacksmith exclusives
    ['legendary', 'legs', 'Cinderwalker Greaves', null, { shopOnly: true, dmgPct: 0.1, burnAttackers: 0.5 }],
    ['legendary', 'offhand', 'Tome of Ash', 'tome', { shopOnly: true, dtype: 'fire', burnOnHit: 0.25 }],
    ['mythic', 'helmet', 'Crown of the Phoenix', null, { shopOnly: true, crit: 0.15, healStart: 0.3, dmgPct: 0.15 }],
  ],
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Base stats per slot, as fractions of the item's budget b.
function slotStats(slot, kind, b) {
  switch (slot) {
    case 'weapon': return { atk: b };
    case 'helmet': return { def: 0.6 * b, hp: 0.5 * b };
    case 'chest': return { def: 1.0 * b, hp: 1.1 * b };
    case 'legs': return { def: 0.8 * b, hp: 0.8 * b };
    case 'boots': return { def: 0.4 * b, hp: 1.0 * b };
    default: // offhand
      if (kind === 'shield') return { def: 0.8 * b };
      if (kind === 'tome') return { atk: 0.4 * b, crit: 0.03 };
      if (kind === 'lantern') return { def: 0.3 * b };
      if (kind === 'flask') return { hp: 0.8 * b };
      return { def: 0.4 * b, hp: 0.6 * b };   // relic
  }
}

export const DITEMS = {};
for (const [sec, list] of Object.entries(G)) {
  const S = SECTION_SCALE[sec - 1];
  for (const [rarity, slot, name, kind, extra = {}] of list) {
    const b = S * RARITY_MULT[rarity];
    const base = slotStats(slot, kind, b);
    if (extra.defMult && base.def) base.def *= extra.defMult;
    if (extra.allStats) { for (const k of ['atk', 'def', 'hp']) base[k] = (base[k] || 0) + b * extra.allStats * (k === 'hp' ? 3 : 1); }
    const stats = { atk: Math.round(base.atk || 0), def: Math.round(base.def || 0), hp: Math.round((base.hp || 0) * HP_SCALE[sec - 1]), crit: (base.crit || 0) + (extra.crit || 0), dodge: extra.dodge || 0 };
    const id = `d${sec}.${slug(name)}`;
    DITEMS[id] = {
      id, name, section: Number(sec), rarity, slot,
      kind: slot === 'weapon' ? kind : slot === 'offhand' ? kind : 'armour',
      weaponType: slot === 'weapon' ? kind : null,
      stats, ...extra,
      bossOnly: !extra.shopOnly && (rarity === 'legendary' || rarity === 'divine'),
    };
  }
}
export const DITEMS_BY_SECTION = Object.fromEntries([1, 2, 3, 4, 5].map((s) => [s, Object.values(DITEMS).filter((i) => i.section === s)]));

// Starter kit (given on first entry). Not from any section's drop table.
DITEMS['d0.rusty-sword'] = { id: 'd0.rusty-sword', name: 'Rusty Sword', section: 0, rarity: 'common', slot: 'weapon', kind: 'sword', weaponType: 'sword', stats: { atk: 4, def: 0, hp: 0, crit: 0, dodge: 0 } };
DITEMS['d0.leather-cap'] = { id: 'd0.leather-cap', name: 'Leather Cap', section: 0, rarity: 'common', slot: 'helmet', kind: 'armour', stats: { atk: 0, def: 2, hp: 2, crit: 0, dodge: 0 } };
DITEMS['d0.tattered-tunic'] = { id: 'd0.tattered-tunic', name: 'Tattered Tunic', section: 0, rarity: 'common', slot: 'chest', kind: 'armour', stats: { atk: 0, def: 4, hp: 4, crit: 0, dodge: 0 } };
DITEMS['d0.worn-boots'] = { id: 'd0.worn-boots', name: 'Worn Boots', section: 0, rarity: 'common', slot: 'boots', kind: 'armour', stats: { atk: 0, def: 1, hp: 4, crit: 0, dodge: 0 } };
export const STARTER_KIT = ['d0.rusty-sword', 'd0.leather-cap', 'd0.tattered-tunic', 'd0.worn-boots'];
export const GEAR_SLOTS_D = ['weapon', 'helmet', 'chest', 'legs', 'boots', 'offhand'];
export const SLOT_NAME_D = { weapon: 'Weapon', helmet: 'Helmet', chest: 'Chestplate', legs: 'Legs', boots: 'Boots', offhand: 'Off-hand' };

// ---------- potions ----------
export const POTIONS = {
  'hp-small': { name: 'Small Health Potion', heal: 0.25, price: 15 },
  'hp-medium': { name: 'Health Potion', heal: 0.45, price: 40 },
  'hp-large': { name: 'Large Health Potion', heal: 0.7, price: 100 },
  strength: { name: 'Potion of Strength', buff: { atkPct: 0.25 }, price: 60, text: '+25% Attack for this fight' },
  ironskin: { name: 'Ironskin Potion', buff: { defPct: 0.3 }, price: 60, text: '+30% Defence for this fight' },
  fortune: { name: 'Potion of Fortune', buff: { crit: 0.1 }, price: 50, text: '+10% crit chance for this fight' },
};
export const POTIONS_PER_FIGHT = 3;   // open question default
export const STARTER_POTIONS = { 'hp-medium': 3 };
