import {
  RARITY, LUCK_MIN_RARITY, OUTFIT_XP_BOOST, PET_BOOST, XP_PER_UNIT, COINS_PER_UNIT,
  COLLECTION_COMPLETE_XP_BOOST, BADGE_COUNT, MAX_PER_RARITY_PER_ROLL, SKILLS, SKILL, ITEM, ITEMS_BY_SKILL,
} from './data.js';

// ---------- Levelling ----------
// 4 tiers. Each tier's share of the 100,000 XP total, and how steeply XP-per-level
// rises inside the tier (last level costs (1 + slope) x the first). Slopes are
// chosen so XP-per-level never goes down across a tier boundary.
export const MAX_LEVEL = 60;
const TOTAL_XP = 100_000;
const TIERS = [
  { from: 2,  to: 15, share: 0.04, slope: 1.0 }, // levels 1-15 (level 1 is free)
  { from: 16, to: 30, share: 0.12, slope: 1.0 },
  { from: 31, to: 45, share: 0.34, slope: 0.6 },
  { from: 46, to: 60, share: 0.50, slope: 0.3 },
];

// LEVEL_XP[L] = total XP needed to reach level L.
export const LEVEL_XP = (() => {
  const table = [0, 0];
  let total = 0;
  for (const t of TIERS) {
    const n = t.to - t.from + 1;
    const weights = Array.from({ length: n }, (_, i) => 1 + (t.slope * i) / (n - 1));
    const sum = weights.reduce((a, b) => a + b, 0);
    for (const w of weights) {
      total += Math.round((TOTAL_XP * t.share * w) / sum);
      table.push(total);
    }
  }
  table[MAX_LEVEL] = TOTAL_XP; // absorb rounding
  return table;
})();

export function levelForXp(xp) {
  let lvl = 1;
  while (lvl < MAX_LEVEL && xp >= LEVEL_XP[lvl + 1]) lvl++;
  return lvl;
}

export function levelProgress(xp) {
  const lvl = levelForXp(xp);
  if (lvl >= MAX_LEVEL) return { level: lvl, into: 0, needed: 0, pct: 1 };
  const into = xp - LEVEL_XP[lvl];
  const needed = LEVEL_XP[lvl + 1] - LEVEL_XP[lvl];
  return { level: lvl, into, needed, pct: into / needed };
}

// ---------- State ----------
const SAVE_KEY = 'liferpg.save.v1';

export function newState() {
  return {
    version: 1,
    createdAt: Date.now(),
    name: 'Adventurer',
    onboarded: false,
    lastBackupAt: null,
    coins: 0,
    skills: Object.fromEntries(SKILLS.map((s) => [s.id, { xp: 0, carryMin: 0, totalMin: 0 }])),
    items: {},        // itemId -> count currently held
    everOwned: {},    // itemId -> true (for collection completion / discovery)
    equipped: { pet: null, outfit: null },
    log: [],          // recent log entries, newest first
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return newState();
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.error('Failed to load save', e);
    // Keep the unreadable save so a fresh game doesn't overwrite it.
    try { localStorage.setItem(`${SAVE_KEY}.corrupt.${Date.now()}`, localStorage.getItem(SAVE_KEY)); } catch {}
    return newState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    // Storage full or blocked (e.g. some private-browsing modes).
    console.error('Failed to save', e);
    return false;
  }
}

function migrate(s) {
  const base = newState();
  const out = { ...base, ...s };
  if (s.onboarded === undefined) out.onboarded = true; // saves from before onboarding existed
  out.skills = { ...base.skills, ...(s.skills || {}) };
  out.equipped = { ...base.equipped, ...(s.equipped || {}) };
  return out;
}

export function validateImport(obj) {
  if (!obj || typeof obj !== 'object' || obj.version !== 1 || !obj.skills || !obj.items) {
    throw new Error("That doesn't look like a Life RPG save file.");
  }
  return migrate(obj);
}

// ---------- Boosts ----------
export function boostsFor(state, skillId) {
  const b = { xp: 0, coins: 0, luck: 0, bonusRollChance: 0, sources: [] };
  const outfit = state.equipped.outfit && ITEM[state.equipped.outfit];
  if (outfit && outfit.skill === skillId) {
    const v = OUTFIT_XP_BOOST[outfit.rarity];
    b.xp += v;
    b.sources.push(`${outfit.name}: +${pct(v)} XP`);
  }
  const pet = state.equipped.pet && ITEM[state.equipped.pet];
  if (pet && pet.skill === skillId) {
    const p = PET_BOOST[pet.rarity];
    b.xp += p.xp || 0;
    b.coins += p.coins || 0;
    b.luck += p.luck || 0;
    b.bonusRollChance = p.bonusRollChance || 0;
    const parts = [`+${pct(p.xp)} XP`];
    if (p.coins) parts.push(`+${pct(p.coins)} coins`);
    if (p.luck) parts.push(`+${pct(p.luck)} luck`);
    if (p.bonusRollChance === 1) parts.push('bonus roll every log');
    else if (p.bonusRollChance) parts.push(`${pct(p.bonusRollChance)} bonus roll chance`);
    b.sources.push(`${pet.name}: ${parts.join(', ')}`);
  }
  if (isCollectionComplete(state, skillId)) {
    b.xp += COLLECTION_COMPLETE_XP_BOOST;
    b.sources.push(`Full collection: +${pct(COLLECTION_COMPLETE_XP_BOOST)} XP`);
  }
  return b;
}

export const pct = (v) => `${Math.round(v * 1000) / 10}%`;

export function isCollectionComplete(state, skillId) {
  return ITEMS_BY_SKILL[skillId].every((i) => state.everOwned[i.id]);
}

export function discoveredCount(state, skillId) {
  return ITEMS_BY_SKILL[skillId].filter((i) => state.everOwned[i.id]).length;
}

// ---------- Logging ----------
// Plan what a log of `minutes` would give (without randomness), for the confirm screen.
export function previewLog(state, skillId, minutes) {
  const skill = SKILL[skillId];
  const s = state.skills[skillId];
  const b = boostsFor(state, skillId);
  const units = minutes / skill.unit;
  const rolls = Math.floor((s.carryMin + minutes) / skill.unit);
  return {
    units,
    rolls,
    xp: Math.round(units * XP_PER_UNIT * (1 + b.xp)),
    coins: Math.round(units * COINS_PER_UNIT * (1 + b.coins)),
    carryAfter: (s.carryMin + minutes) % skill.unit,
    boosts: b,
  };
}

// The real chance that one specific item drops from a single roll, after the
// per-rarity cap, pets you already own (they leave the table) and luck.
// With n items each at chance p, the number that hit is Binomial(n, p); the cap
// keeps min(hits, cap) of them, shared evenly because items are checked in random order.
export function effectiveDropChance(state, itemId) {
  const item = ITEM[itemId];
  if (item.type === 'pet' && state.everOwned[itemId]) return 0;
  const rar = RARITY[item.rarity];
  const luck = boostsFor(state, item.skill).luck;
  const p = Math.min(1, rar.index >= LUCK_MIN_RARITY ? rar.chance * (1 + luck) : rar.chance);
  const n = ITEMS_BY_SKILL[item.skill].filter((i) =>
    i.rarity === item.rarity && !(i.type === 'pet' && state.everOwned[i.id])).length;
  const binom = (k) => choose(n, k) * p ** k * (1 - p) ** (n - k);
  let expectedKept = 0;
  for (let k = 1; k <= n; k++) expectedKept += Math.min(k, MAX_PER_RARITY_PER_ROLL) * binom(k);
  return expectedKept / n;
}

function choose(n, k) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

function shuffled(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Each roll gives every item in the skill's table its own chance, but at most
// MAX_PER_RARITY_PER_ROLL items of any one rarity can drop. Items are checked in a
// random order so the cap doesn't favour whichever item is listed first.
function rollDrops(state, skillId, rolls, luck, rng) {
  const drops = {};
  const ownedPets = new Set(Object.keys(state.everOwned).filter((id) => ITEM[id].type === 'pet'));
  for (let r = 0; r < rolls; r++) {
    const perRarity = {};
    for (const item of shuffled(ITEMS_BY_SKILL[skillId], rng)) {
      if (item.type === 'pet' && (ownedPets.has(item.id) || drops[item.id])) continue;
      if ((perRarity[item.rarity] || 0) >= MAX_PER_RARITY_PER_ROLL) continue;
      const rar = RARITY[item.rarity];
      const chance = rar.index >= LUCK_MIN_RARITY ? rar.chance * (1 + luck) : rar.chance;
      if (rng() < chance) {
        drops[item.id] = (drops[item.id] || 0) + 1;
        perRarity[item.rarity] = (perRarity[item.rarity] || 0) + 1;
      }
    }
  }
  return drops;
}

export function logActivity(state, skillId, minutes, rng = Math.random) {
  const p = previewLog(state, skillId, minutes);
  const s = state.skills[skillId];
  const levelBefore = levelForXp(s.xp);

  let bonusRoll = false;
  if (p.boosts.bonusRollChance > 0 && rng() < p.boosts.bonusRollChance) bonusRoll = true;
  const totalRolls = p.rolls + (bonusRoll ? 1 : 0);
  const drops = rollDrops(state, skillId, totalRolls, p.boosts.luck, rng);

  s.xp += p.xp;
  s.carryMin = p.carryAfter;
  s.totalMin += minutes;
  state.coins += p.coins;

  const newDiscoveries = [];
  const newBadges = [];
  const wasComplete = isCollectionComplete(state, skillId);
  for (const [id, n] of Object.entries(drops)) {
    const before = state.items[id] || 0;
    if (!state.everOwned[id]) newDiscoveries.push(id);
    state.everOwned[id] = true;
    state.items[id] = before + n;
    if (before < BADGE_COUNT && before + n >= BADGE_COUNT) newBadges.push(id);
  }
  const completedCollection = !wasComplete && isCollectionComplete(state, skillId);

  const levelAfter = levelForXp(s.xp);
  const result = {
    at: Date.now(), skill: skillId, minutes, xp: p.xp, coins: p.coins, rolls: totalRolls,
    bonusRoll, drops, newDiscoveries, newBadges, completedCollection,
    levelBefore, levelAfter,
  };
  state.log.unshift({ at: result.at, skill: skillId, minutes, xp: p.xp, coins: p.coins, drops });
  state.log = state.log.slice(0, 50);
  return result;
}

// ---------- Inventory ----------
export function sellPrice(itemId) {
  return RARITY[ITEM[itemId].rarity].sell;
}

export function canSell(itemId) {
  return ITEM[itemId].type !== 'pet';
}

export function sell(state, itemId, qty) {
  if (!canSell(itemId)) throw new Error("Pets can't be sold.");
  const have = state.items[itemId] || 0;
  qty = Math.min(qty, have);
  if (qty <= 0) return 0;
  state.items[itemId] = have - qty;
  // Keep at least one equipped copy: if you sell the last one, unequip it.
  if (state.items[itemId] === 0 && state.equipped.outfit === itemId) state.equipped.outfit = null;
  const earned = qty * sellPrice(itemId);
  state.coins += earned;
  return earned;
}

export function equip(state, itemId) {
  const item = ITEM[itemId];
  if (!(state.items[itemId] > 0)) throw new Error("You don't own that.");
  if (item.type === 'pet') state.equipped.pet = state.equipped.pet === itemId ? null : itemId;
  else if (item.type === 'outfit') state.equipped.outfit = state.equipped.outfit === itemId ? null : itemId;
}

export function totalLevel(state) {
  return SKILLS.reduce((sum, s) => sum + levelForXp(state.skills[s.id].xp), 0);
}
