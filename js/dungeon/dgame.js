// Dungeon progression: Crypts level, floors, building fighters from gear, loot, shops.
// Pure logic (no screen code) so the simulator can use it too.
import {
  SECTIONS, ENEMIES, BOSSES, FAMILY_ROSTER, WEAPON_TYPES, SIGNATURES, DITEMS, DITEMS_BY_SECTION, SETS,
  SECTION_SCALE, RARITY_MULT, RAR, POTIONS, STARTER_KIT, STARTER_POTIONS, MATERIALS, GEAR_SLOTS_D,
} from './ddata.js';

// ---------- TUNED by tools/dsim.mjs ----------
// Normal enemy baseline per section = these x SECTION_SCALE (x SECTION_FUDGE).
export const ENEMY_BASE = { hp: 46.69, atk: 3.01, def: 1.8 };
export const SECTION_FUDGE = [1, 1.25, 1.34, 1.29, 1.38];
export const FLOOR_STEP = 0.06;          // enemies get 6% stronger per floor inside a section
// Crypts XP
export const XP = { enemy: 9, floorFirst: 12, boss: 150, bossFirst: 100 };
// TUNED with tools/dpacing.mjs: a first clear of section 1 ≈ Crypts 3.5, then ~7 Goblin King kills to reach 5;
// the same shape at every gate (12, 20, 30).
export const SECTION_XP = [0.87, 17.41, 58.85, 164.81, 293.36];
export const BOSS_XP_SCALE = [1.32, 0.36, 0.26, 0.19, 0.17];

// ---------- Crypts level ----------
// XP needed to go from level L to L+1.
export const xpToNext = (L) => Math.round(100 * L ** 1.6);
export function cryptsLevel(xp) {
  let L = 1, need = xpToNext(1);
  while (xp >= need && L < 99) { xp -= need; L++; need = xpToNext(L); }
  return L;
}
export function cryptsProgress(xp) {
  let L = 1, need = xpToNext(1);
  while (xp >= need && L < 99) { xp -= need; L++; need = xpToNext(L); }
  return { level: L, into: xp, needed: need, pct: xp / need };
}
export const xpForLevel = (L) => { let t = 0; for (let i = 1; i < L; i++) t += xpToNext(i); return t; };

// ---------- state ----------
export function newDungeon() {
  return {
    started: false, xp: 0, climb: 1, highest: 1, cleared: {}, bossKills: {},
    inv: {}, upgrades: {}, equipped: { weapon: null, helmet: null, chest: null, legs: null, boots: null, offhand: null },
    materials: {}, potions: {}, kills: 0, deaths: 0, seen: {},
  };
}
export function startDungeon(d) {
  if (d.started) return [];
  d.started = true;
  for (const id of STARTER_KIT) { d.inv[id] = (d.inv[id] || 0) + 1; d.equipped[DITEMS[id].slot] = id; d.seen[id] = true; }
  for (const [id, n] of Object.entries(STARTER_POTIONS)) d.potions[id] = (d.potions[id] || 0) + n;
  return STARTER_KIT;
}

export const sectionOf = (floor) => Math.ceil(floor / 10);
export const floorInSection = (floor) => ((floor - 1) % 10) + 1;
export const sectionStart = (floor) => (sectionOf(floor) - 1) * 10 + 1;
export const sectionUnlocked = (d, k) => k >= 1 && k <= SECTIONS.length && cryptsLevel(d.xp) >= SECTIONS[k - 1].crypts;
// Floors you can start: anything you've reached in an unlocked section.
export const canPlay = (d, floor) => floor >= 1 && floor <= Math.max(d.climb, d.highest) && sectionUnlocked(d, sectionOf(floor)) && floor <= 50;

// ---------- gear → fighter ----------
export const UPGRADE_STEP = 0.06;           // +6% stats per +1
export function itemStats(id, plus = 0) {
  const s = DITEMS[id].stats;
  const k = 1 + UPGRADE_STEP * plus;
  return { atk: Math.round(s.atk * k), def: Math.round(s.def * k), hp: Math.round(s.hp * k), crit: s.crit || 0, dodge: s.dodge || 0 };
}

// Player stats before gear (TUNED), for section 1. Attack/Defence/Health grow with each
// Crypts tier you unlock, in step with that section's gear (see baseScale).
export const BASE = { hp: 220, atk: 34, def: 20, crit: 0.18, dodge: 0 };
export function baseScale(level) {
  let k = 0;
  for (let i = 0; i < SECTIONS.length; i++) if (level >= SECTIONS[i].crypts) k = i;
  return SECTION_SCALE[k] / SECTION_SCALE[0];
}

export function activeSet(equipped) {
  const counts = {};
  for (const id of Object.values(equipped)) if (id && DITEMS[id]?.set) counts[DITEMS[id].set] = (counts[DITEMS[id].set] || 0) + 1;
  return Object.keys(counts).find((s) => counts[s] >= 4) || null;
}

// The four moves a weapon gives (standard set with signature moves swapped in).
export function weaponMoves(weaponId, offhandId) {
  const w = weaponId ? DITEMS[weaponId] : null;
  const type = WEAPON_TYPES[w?.weaponType || 'gauntlet'];
  const moves = type.moves.map((mv) => ({ ...mv }));
  const sigs = w?.sig || [];
  if (sigs[0]) moves[3] = { ...SIGNATURES[sigs[0]], sig: true };
  if (sigs[1]) moves[2] = { ...SIGNATURES[sigs[1]], sig: true };
  const grant = offhandId && DITEMS[offhandId]?.grantMove;
  if (grant && !moves.some((mv) => mv.name === grant)) moves[sigs[1] ? 1 : 2] = { ...SIGNATURES[grant], sig: true, fromOffhand: true };
  return moves;
}

// Combine base stats, gear, upgrades, set bonus and Crypts perks into a fighter for the engine.
export function buildPlayer(d, { level = cryptsLevel(d.xp), equipped = d.equipped, upgrades = d.upgrades, potions = d.potions } = {}) {
  const bs = baseScale(level);
  const t = { hp: BASE.hp * bs, atk: BASE.atk * bs, def: BASE.def * bs, crit: BASE.crit, dodge: BASE.dodge };
  const passive = {};
  let dmgPct = 0.01 * (level - 1);            // Crypts perk: +1% damage per level
  let hpPct = 0, defPct = 0, atkPct = 0;
  for (const slot of GEAR_SLOTS_D) {
    const id = equipped[slot];
    if (!id) continue;
    const it = DITEMS[id];
    const s = itemStats(id, upgrades[id] || 0);
    t.atk += s.atk; t.def += s.def; t.hp += s.hp; t.crit += s.crit; t.dodge += s.dodge;
    if (it.atkPct) atkPct += it.atkPct;
    if (it.dmgPct) dmgPct += it.dmgPct;
    for (const k of ['bleedOnHit', 'stunOnHit', 'freezeOnHit', 'slowOnHit', 'burnOnHit', 'lifesteal', 'reflect', 'burnAttackers', 'healStart', 'ignoreDef', 'blizzard', 'killHeal'])
      if (it[k]) passive[k] = (passive[k] || 0) + it[k];
    for (const k of ['firstStrike', 'titan', 'freezeImmune']) if (it[k]) passive[k] = true;
    if (it.slayer) passive.slayer = it.slayer;
  }
  const set = activeSet(equipped);
  if (set) {
    const bon = SETS[set].bonus;
    if (bon.crit) t.crit += bon.crit;
    if (bon.dodge) t.dodge += bon.dodge;
    if (bon.hpPct) hpPct += bon.hpPct;
    if (bon.defPct) defPct += bon.defPct;
    if (bon.dmgPct) dmgPct += bon.dmgPct;
    if (bon.freezeImmune) passive.freezeImmune = true;
    if (bon.burnOnHit) passive.burnOnHit = (passive.burnOnHit || 0) + bon.burnOnHit;
  }
  const w = equipped.weapon ? DITEMS[equipped.weapon] : null;
  const off = equipped.offhand ? DITEMS[equipped.offhand] : null;
  const wtype = WEAPON_TYPES[w?.weaponType || 'gauntlet'];
  let dtype = w?.dtype || wtype.dtype;
  if (dtype === 'element') dtype = 'lightning';
  return {
    name: 'You', maxHp: Math.round(t.hp * (1 + hpPct)), atk: Math.round(t.atk * (1 + atkPct)), def: Math.round(t.def * (1 + defPct)),
    crit: Math.min(0.75, t.crit), dodge: Math.min(0.5, t.dodge), dmgPct, dtype,
    moves: weaponMoves(equipped.weapon, equipped.offhand), passive, set,
    shield: off?.kind === 'shield', revive: off?.revive || 0, cheatDeath: !!off?.cheatDeath,
    potions: { ...potions }, weapon: w?.id || null,
  };
}

// One number summarising how strong your gear is.
export function powerScore(p) {
  return Math.round(p.atk * 3 + p.def * 1.5 + p.maxHp * 0.5 + p.crit * 300 + p.dodge * 300 + p.dmgPct * 200);
}

// ---------- enemies & floors ----------
export function makeEnemy(typeId, section, fis = 1) {
  const t = ENEMIES[typeId];
  const S = SECTION_SCALE[section - 1] * SECTION_FUDGE[section - 1];
  const k = 1 + FLOOR_STEP * (fis - 1);
  return {
    id: typeId, name: t.name, family: t.family, fast: !!t.fast, dodge: t.dodge || 0, crit: 0.05, healer: t.healer, regen: t.regen,
    maxHp: Math.round(ENEMY_BASE.hp * S * t.hp * k), atk: Math.round(ENEMY_BASE.atk * S * t.atk * k), def: Math.round(ENEMY_BASE.def * S * t.def * k),
    moves: t.moves, xpMult: t.hp, section, fis,
  };
}

export function makeBoss(section) {
  const sec = SECTIONS[section - 1];
  const B = BOSSES[sec.boss];
  const S = SECTION_SCALE[section - 1] * SECTION_FUDGE[section - 1];
  const summonMove = Object.values(B.moves).find((mv) => mv.summon);
  return {
    id: sec.boss, name: B.name, family: B.family, extraWeak: B.extraWeak, dodge: 0, crit: 0.1,
    maxHp: Math.round(ENEMY_BASE.hp * S * B.hp), atk: Math.round(ENEMY_BASE.atk * S * B.atk), def: Math.round(ENEMY_BASE.def * S * B.def),
    boss: { pattern: B.pattern, phase2: B.phase2, moves: B.moves }, summon: summonMove ? makeEnemy(summonMove.summon, section, 1) : null,
    xpMult: 1, section, fis: 10, isBoss: true,
  };
}

// A floor = 2-3 fights in a row (Health carries between them). Floor 10 of each section is the boss.
export function floorPlan(floor, rng = Math.random) {
  const k = sectionOf(floor), fis = floorInSection(floor);
  const sec = SECTIONS[k - 1];
  if (fis === 10) return [[makeBoss(k)]];
  const stage = fis <= 3 ? 0 : fis <= 5 ? 1 : fis <= 7 ? 2 : 3;
  const roster = FAMILY_ROSTER[sec.family][stage];
  const fights = fis <= 3 ? 2 : fis <= 6 ? (rng() < 0.5 ? 2 : 3) : 3;
  const plan = [];
  for (let i = 0; i < fights; i++) {
    const n = fis <= 2 ? 1 : fis <= 6 ? (rng() < 0.55 ? 1 : 2) : (rng() < 0.5 ? 2 : rng() < 0.85 ? 1 : 3);
    const group = [];
    for (let j = 0; j < n; j++) {
      // now and then an enemy from another family wanders in (e.g. goblin grave-robbers in the Crypt)
      if (rng() < 0.15) { const g = FAMILY_ROSTER[sec.guest][Math.min(stage, 1)]; group.push(makeEnemy(g[Math.floor(rng() * g.length)], k, fis)); }
      else group.push(makeEnemy(roster[Math.floor(rng() * roster.length)], k, fis));
    }
    plan.push(group);
  }
  return plan;
}

// ---------- rewards ----------
export function enemyXp(e) {
  const base = e.isBoss ? XP.boss * BOSS_XP_SCALE[e.section - 1] : XP.enemy * (0.6 + 0.4 * e.xpMult) * (1 + 0.08 * (e.fis - 1));
  return Math.round(base * SECTION_XP[e.section - 1]);
}
export const enemyCoins = (e) => Math.round((e.isBoss ? 40 : 3) * SECTION_SCALE[e.section - 1] / 5 * (1 + 0.05 * (e.fis - 1)) * (e.isBoss ? 1 : 0.8 + Math.random() * 0.4));

// Drop chances per normal enemy kill; rise with floor height inside the section.
const DROP = { common: 0.09, uncommon: 0.045, rare: 0.016, epic: 0.005, mythic: 0.0006 };
export function rollEnemyDrops(e, rng = Math.random, luck = 1) {
  const drops = [];
  const height = 0.7 + 0.06 * e.fis;
  const pool = DITEMS_BY_SECTION[e.section].filter((i) => !i.bossOnly && !i.shopOnly);
  for (const r of ['common', 'uncommon', 'rare', 'epic', 'mythic']) {
    if (r === 'mythic' && e.section < 3) continue;
    if (rng() < DROP[r] * height * (r === 'common' ? 1 : luck)) {
      const opts = pool.filter((i) => i.rarity === r);
      if (opts.length) drops.push(opts[Math.floor(rng() * opts.length)].id);
    }
  }
  return drops;
}
// Bosses: two rolls; Legendaries only come from bosses.
const BOSS_TABLE = [['divine', 0.006], ['mythic', 0.03], ['legendary', 0.12], ['epic', 0.3], ['rare', 0.55]];
export function rollBossDrops(section, rng = Math.random, luck = 1) {
  const drops = [];
  const items = DITEMS_BY_SECTION[section].filter((i) => !i.shopOnly);
  for (let roll = 0; roll < 2; roll++) {
    let r = rng();
    for (const [rar, p] of BOSS_TABLE) {
      const chance = rar === 'rare' ? p : p * luck;
      if (r < chance) {
        const opts = items.filter((i) => i.rarity === rar);
        if (opts.length) { drops.push(opts[Math.floor(rng() * opts.length)].id); break; }
      }
      r -= chance;
    }
  }
  return drops;
}
export const materialFor = (section) => SECTIONS[section - 1].material;

// ---------- inventory & shops ----------
const SELL = { common: 2, uncommon: 5, rare: 12, epic: 30, legendary: 80, mythic: 200, divine: 600 };
export const sellPrice = (id) => (DITEMS[id].section === 0 ? 1 : Math.round(SELL[DITEMS[id].rarity] * SECTION_SCALE[DITEMS[id].section - 1]));
export const buyPrice = (id) => sellPrice(id) * (DITEMS[id].shopOnly ? 3 : DITEMS[id].rarity === 'common' ? 4 : 5);
export const MAX_PLUS = 10;
export function upgradeCost(id, plus) {
  const it = DITEMS[id];
  const sec = Math.max(1, it.section);
  return {
    coins: Math.round(SECTION_SCALE[sec - 1] * RARITY_MULT[it.rarity] * 4 * (plus + 1)),
    material: materialFor(sec), count: plus + 1,
  };
}
// The Blacksmith sells Commons and Uncommons from sections you've unlocked.
export function blacksmithStock(d) {
  return Object.values(DITEMS).filter((i) => i.section >= 1 && (i.shopOnly || ['common', 'uncommon'].includes(i.rarity)) && sectionUnlocked(d, i.section));
}
export { POTIONS, MATERIALS, DITEMS, SECTIONS, RAR };

// Recommended Power for a boss = the Power of a good Rare loadout from that section.
export function rarelLoadout(section) {
  const eq = {};
  for (const slot of GEAR_SLOTS_D) {
    const c = DITEMS_BY_SECTION[section].filter((i) => i.slot === slot && i.rarity === 'rare' && !i.slayer);
    const fallback = DITEMS_BY_SECTION[section].filter((i) => i.slot === slot && i.rarity === 'uncommon');
    eq[slot] = (c[0] || fallback[0])?.id || null;
  }
  return eq;
}
export function recommendedPower(section) {
  const gate = section < 5 ? SECTIONS[section].crypts - 1 : 33;
  return powerScore(buildPlayer(newDungeon(), { equipped: rarelLoadout(section), level: gate, upgrades: {}, potions: {} }));
}
