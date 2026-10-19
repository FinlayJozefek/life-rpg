// Fight bots, and a quick win-chance estimate for the hub.
// The estimate plays the next floor a few hundred times with your real gear, level and potions,
// using the "smart" bot (guards big attacks, uses type matchups, drinks potions in time).
import { createBattle, takeTurn, getActions, aliveEnemies, typeMult, moveType } from './engine.js';
import { buildPlayer, itemStats, powerScore, floorPlan, cryptsLevel, sectionOf, floorInSection, SECTION_FUDGE } from './dgame.js';
import { POTIONS, SECTION_SCALE, DITEMS, GEAR_SLOTS_D } from './ddata.js';

function healPotion(acts) {
  return acts.filter((a) => a.kind === 'potion' && a.available && POTIONS[a.id].heal).sort((a, b) => POTIONS[b.id].heal - POTIONS[a.id].heal)[0];
}
export function spamBot(b) {
  const acts = getActions(b);
  if (acts[0].firing) return acts[0];
  const p = b.player;
  if (p.hp / p.maxHp < 0.35) { const pot = healPotion(acts); if (pot) return pot; }
  const dmg = acts.filter((a) => a.kind === 'move' && a.available && a.move.power > 0 && !a.move.aim);
  const best = dmg.sort((x, y) => y.move.power * (y.move.hits || 1) - x.move.power * (x.move.hits || 1))[0];
  return { ...best, target: aliveEnemies(b)[0].uid };
}
export function smartBot(b) {
  const acts = getActions(b);
  if (acts[0].firing) return acts[0];
  const p = b.player;
  const foes = aliveEnemies(b);
  const hp = p.hp / p.maxHp;
  const tele = foes.some((e) => e.charging);
  const pot = healPotion(acts);
  const guard = acts.find((a) => a.kind === 'move' && a.available && (a.move.parry || a.move.brace || a.move.ward)) || acts.find((a) => a.kind === 'block');
  if (b.round === 1 && b.isBoss) { const str = acts.find((a) => a.kind === 'potion' && a.id === 'strength' && a.available); if (str) return str; }
  if (tele) { if (guard) return guard; if (hp < 0.6 && pot) return pot; }
  if (hp < 0.4 && pot) return pot;
  // healers first; in boss fights focus the boss unless an add is nearly dead; otherwise the weakest
  const boss = foes.find((e) => e.boss);
  const weakAdd = foes.find((e) => !e.boss && e.hp < e.maxHp * 0.35);
  const target = foes.find((e) => e.healer) || (boss ? (weakAdd || boss) : foes.slice().sort((a, c) => a.hp - c.hp)[0]);
  const phase2 = foes.some((e) => e.boss && e.phase === 2);
  let best = null, bestScore = -1;
  for (const a of acts) {
    if (a.kind !== 'move' || !a.available || a.move.power <= 0 || (a.move.aim && tele)) continue;
    const mv = a.move;
    const eff = typeMult(moveType(p, mv), target);
    let score = mv.power * (mv.hits || 1) * (mv.aoe ? foes.reduce((n, e) => n + typeMult(moveType(p, mv), e), 0) : eff);
    if (mv.aim) score *= 0.55;
    if (mv.bleed && !target.st.bleed && target.hp > target.maxHp * 0.3) score += 0.5;
    if (mv.poison && !target.st.poison && target.hp > target.maxHp * 0.3) score += 0.6;
    if (mv.stun || mv.freeze) score += 0.35;
    if (mv.lifesteal && hp < 0.7) score += mv.lifesteal * 0.8;
    if (mv.charges && (b.isBoss ? (!phase2 && target.hp > target.maxHp * 0.75) : target.hp < target.maxHp * 0.35)) score *= 0.5;
    if (score > bestScore) { bestScore = score; best = a; }
  }
  return { ...best, target: target.uid };
}


function rng32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const cache = new Map();
// Chance (0..1) to clear `floor` with the save's current gear. Cached until gear, level or potions change.
export function winChance(d, floor, n = 240) {
  const key = JSON.stringify([floor, d.equipped, d.upgrades, d.potions, cryptsLevel(d.xp)]);
  if (cache.has(key)) return cache.get(key);
  const rng = rng32(floor * 7919 + 17);
  const isBoss = floorInSection(floor) === 10;
  const sec = sectionOf(floor);
  const scale = SECTION_SCALE[sec - 1] * SECTION_FUDGE[sec - 1];
  let wins = 0;
  for (let i = 0; i < n; i++) {
    let p = buildPlayer(d);
    let ok = true, reviveUsed = false;
    for (const group of floorPlan(floor, rng)) {
      const bt = createBattle(p, group, { isBoss, reviveUsed, scale });
      let guard = 0;
      while (!bt.over && guard++ < 120) takeTurn(bt, smartBot(bt), rng);
      if (!bt.won) { ok = false; break; }
      reviveUsed = bt.reviveUsed || reviveUsed;
      p = { ...p, hp: bt.player.hp, potions: bt.player.potions };
    }
    if (ok) wins++;
  }
  const r = wins / n;
  if (cache.size > 50) cache.clear();
  cache.set(key, r);
  return r;
}

// Words and colour for a win chance.
export function oddsLabel(c) {
  if (c >= 0.8) return { text: 'Should win', cls: 'odds-good' };
  if (c >= 0.5) return { text: 'Good chance', cls: 'odds-ok' };
  if (c >= 0.2) return { text: 'Risky', cls: 'odds-risky' };
  if (c > 0) return { text: 'Very unlikely', cls: 'odds-bad' };
  return { text: 'No chance yet', cls: 'odds-bad' };
}

// ---------- "Equip best" ----------
// Best = highest chance to beat the current section's boss (counted in 5% steps once it is 10%+,
// so simulation noise never beats a real gain), then the most Power.
function gearScore(d, eq, bossFloor) {
  const d2 = { ...d, equipped: eq };
  const c = winChance(d2, bossFloor, 200);
  return (c >= 0.1 ? Math.floor(c * 20) : 0) * 1e6 + powerScore(buildPlayer(d2));
}
// Armour (helmet, chest, legs, boots) is picked on the piece's own Defence + Health first, so a set bonus
// or rarity never swaps in a weaker piece; only a tie falls back to the full score below.
const ARMOUR_SLOTS = new Set(['helmet', 'chest', 'legs', 'boots']);
const toughness = (d, id) => { if (!id) return -1; const s = itemStats(id, d.upgrades[id] || 0); return s.def * 1.5 + s.hp * 0.5; };
export function bestForSlot(d, slot, eq = d.equipped) {
  const bossFloor = sectionOf(Math.min(50, d.climb)) * 10;
  const armour = ARMOUR_SLOTS.has(slot);
  let best = eq[slot], bestTough = armour ? toughness(d, best) : 0, bestScore = gearScore(d, eq, bossFloor);
  for (const id of Object.keys(d.inv)) {
    if (!(d.inv[id] > 0) || DITEMS[id].slot !== slot || id === eq[slot]) continue;
    if (armour) {
      const t = toughness(d, id);
      if (t < bestTough) continue;
      if (t > bestTough) { best = id; bestTough = t; bestScore = gearScore(d, { ...eq, [slot]: id }, bossFloor); continue; }
    }
    const sc = gearScore(d, { ...eq, [slot]: id }, bossFloor);
    if (sc > bestScore) { best = id; bestScore = sc; }
  }
  return best;
}
export function bestGear(d) {
  let eq = { ...d.equipped };
  for (let pass = 0; pass < 2; pass++) for (const slot of GEAR_SLOTS_D) eq = { ...eq, [slot]: bestForSlot(d, slot, eq) };   // 2 passes so set bonuses can click in
  return eq;
}
