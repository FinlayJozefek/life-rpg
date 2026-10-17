// Dungeon fight simulator. Runs thousands of battles with two bots and different
// gear loadouts, and tunes enemy / boss numbers to the spec's targets.
//   node tools/dsim.mjs                 report with the current numbers
//   node tools/dsim.mjs --tune          search for numbers that hit the targets, then report
//   node tools/dsim.mjs --curve         win rate vs Goblin King strength per loadout
//   knobs for experiments: --mit=12 --batk=8 --bdef=3 --bhp=100
import { createBattle, takeTurn, getActions, aliveEnemies, typeMult, moveType, TUNE } from '../js/dungeon/engine.js';
import { buildPlayer, makeBoss, floorPlan, newDungeon, ENEMY_BASE, SECTION_FUDGE, powerScore, BASE, weaponMoves } from '../js/dungeon/dgame.js';
import { DITEMS_BY_SECTION, STARTER_KIT, DITEMS, BOSSES, SECTIONS, GEAR_SLOTS_D, POTIONS, SECTION_SCALE, FAMILIES } from '../js/dungeon/ddata.js';

function rng32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- loadouts ----------
// A sensible player picks the weapon that suits the enemy family, so each loadout
// uses the best weapon it has access to (by Attack x type matchup).
function bestWeapon(ids, family) {
  const score = (id) => {
    const it = DITEMS[id];
    const dt = it.dtype || ({ sword: 'slashing', axe: 'slashing', dagger: 'piercing', spear: 'piercing', bow: 'piercing', hammer: 'blunt', gauntlet: 'blunt', staff: 'lightning' })[it.weaponType];
    const f = FAMILIES[family];
    const eff = f.weak.includes(dt) ? 1.5 : f.resist.includes(dt) ? 0.5 : 1;
    const slay = it.slayer?.family === family ? 1 + it.slayer.bonus : 1;
    return it.stats.atk * eff * slay;
  };
  return ids.slice().sort((a, b) => score(b) - score(a))[0];
}
const ofRarity = (sec, slot, rarities) => DITEMS_BY_SECTION[sec].filter((i) => i.slot === slot && rarities.includes(i.rarity)).map((i) => i.id);
export function loadout(sec, kind, family = SECTIONS[sec - 1].family) {
  const eq = {};
  if (kind === 'starter') {
    if (sec === 1) { for (const id of STARTER_KIT) eq[DITEMS[id].slot] = id; return eq; }
    for (const s of GEAR_SLOTS_D) eq[s] = ofRarity(sec, s, ['common'])[0] || null;
    return eq;
  }
  const armour = kind === 'rare' ? ['rare'] : ['epic'];
  for (const s of GEAR_SLOTS_D) {
    if (s === 'weapon') continue;
    eq[s] = ofRarity(sec, s, armour)[0] || ofRarity(sec, s, ['uncommon'])[0] || null;
  }
  eq.weapon = bestWeapon(ofRarity(sec, 'weapon', kind === 'rare' ? ['common', 'uncommon', 'rare'] : ['common', 'uncommon', 'rare', 'epic']), family);
  return eq;
}
// Crypts level a player typically has when fighting each section's boss / floors.
export const BOSS_LEVEL = [4, 10, 17, 26, 34];
export const FLOOR_LEVEL = [2, 7, 14, 22, 31];

// ---------- bots ----------
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

// ---------- runs ----------
const scaleOf = (sec) => SECTION_SCALE[sec - 1] * SECTION_FUDGE[sec - 1];
function fight(player, enemies, bot, rng, isBoss, sec) {
  const b = createBattle(player, enemies, { isBoss, scale: scaleOf(sec) });
  while (!b.over) takeTurn(b, bot(b), rng);
  return { won: b.won, rounds: b.round - 1, hp: b.player.hp, potions: b.player.potions };
}
export function bossRuns(sec, kind, botName, n = 1500, seed = 1) {
  const rng = rng32(seed * 7919 + sec * 31 + kind.length);
  const bot = botName === 'smart' ? smartBot : spamBot;
  const eq = loadout(sec, kind);
  let wins = 0, rounds = 0;
  for (let i = 0; i < n; i++) {
    const p = buildPlayer(newDungeon(), { equipped: eq, level: BOSS_LEVEL[sec - 1], upgrades: {}, potions: { 'hp-medium': 3 } });
    const r = fight(p, [makeBoss(sec)], bot, rng, true, sec);
    if (r.won) wins++;
    rounds += r.rounds;
  }
  return { win: wins / n, rounds: rounds / n };
}
export function floorRuns(floor, kind, botName, n = 600, seed = 2) {
  const rng = rng32(seed * 104729 + floor);
  const sec = Math.ceil(floor / 10);
  const bot = botName === 'smart' ? smartBot : spamBot;
  const eq = loadout(sec, kind);
  let wins = 0, rounds = 0, fights = 0;
  for (let i = 0; i < n; i++) {
    let p = buildPlayer(newDungeon(), { equipped: eq, level: FLOOR_LEVEL[sec - 1], upgrades: {}, potions: { 'hp-medium': 4 } });
    let ok = true;
    for (const group of floorPlan(floor, rng)) {
      const r = fight(p, group, bot, rng, false, sec);
      rounds += r.rounds; fights++;
      if (!r.won) { ok = false; break; }
      p = { ...p, hp: r.hp, potions: r.potions };
    }
    if (ok) wins++;
  }
  return { win: wins / n, rounds: rounds / fights };
}

// ---------- tuning ----------
const pct = (x) => `${Math.round(x * 100)}%`.padStart(4);
function bisect(get, set, lo, hi, test, steps = 12) {
  for (let i = 0; i < steps; i++) { const mid = (lo + hi) / 2; set(mid); if (test()) lo = mid; else hi = mid; }
  set((lo + hi) / 2);
}
export function tune() {
  // 1. normal enemies: fights ~3-6 turns at mid-section; late floors winnable (~90%) with good gear
  for (let it = 0; it < 6; it++) {
    bisect(null, (v) => { ENEMY_BASE.hp = v; }, 3, 80, () => (floorRuns(3, 'rare', 'smart', 150, it + 3).rounds + floorRuns(6, 'rare', 'smart', 150, it + 4).rounds + floorRuns(9, 'rare', 'smart', 150, it + 6).rounds) / 3 < 4.2, 9);
    bisect(null, (v) => { ENEMY_BASE.atk = v; }, 0.3, 8, () => floorRuns(9, 'rare', 'smart', 200, it + 5).win > 0.9, 9);
  }
  for (let s = 2; s <= 5; s++) bisect(null, (v) => { SECTION_FUDGE[s - 1] = v; }, 0.4, 2, () => floorRuns((s - 1) * 10 + 9, 'rare', 'smart', 200, s).win > 0.9, 9);
  // 2. bosses: Health for ~14-turn fights, then Attack for ~50% win with good Rare gear (smart play)
  for (let s = 1; s <= 5; s++) {
    const B = BOSSES[SECTIONS[s - 1].boss];
    for (let it = 0; it < 3; it++) {
      bisect(null, (v) => { B.hp = v; }, 1, 200, () => bossRuns(s, 'rare', 'smart', 300, it + 1).rounds < 14, 9);
      bisect(null, (v) => { B.atk = v; }, 0.3, 25, () => bossRuns(s, 'rare', 'smart', 400, it + 7).win > 0.5, 10);
    }
  }
}

export function report() {
  console.log(`\nmitigation/scale ${TUNE.mitPerScale}  player base ${JSON.stringify(BASE)}`);
  console.log(`Enemy baseline: hp ${ENEMY_BASE.hp.toFixed(2)}  atk ${ENEMY_BASE.atk.toFixed(2)}  def ${ENEMY_BASE.def.toFixed(2)}   section fudge ${SECTION_FUDGE.map((x) => x.toFixed(2)).join(' ')}`);
  console.log('\nBOSS (smart play)          starter   good Rare   full Epic | Rare: smart vs spam | turns');
  for (let s = 1; s <= 5; s++) {
    const B = BOSSES[SECTIONS[s - 1].boss];
    const st = bossRuns(s, 'starter', 'smart'), ra = bossRuns(s, 'rare', 'smart'), ep = bossRuns(s, 'epic', 'smart'), sp = bossRuns(s, 'rare', 'spam');
    console.log(`${B.name.padEnd(13)} hp${B.hp.toFixed(1).padStart(5)} atk${B.atk.toFixed(2)}  ${pct(st.win)}      ${pct(ra.win)}        ${pct(ep.win)}   | ${pct(ra.win)} vs ${pct(sp.win)} (${ra.win - sp.win >= 0 ? '+' : ''}${Math.round((ra.win - sp.win) * 100)}) | ${ra.rounds.toFixed(1)}`);
  }
  console.log('\nFLOORS (smart)      starter   rare (spam)        turns/fight');
  for (const f of [1, 5, 9, 15, 19, 25, 29, 35, 39, 45, 49]) {
    const st = floorRuns(f, 'starter', 'smart', 300), ra = floorRuns(f, 'rare', 'smart', 300), sp = floorRuns(f, 'rare', 'spam', 300);
    console.log(`floor ${String(f).padStart(2)} (s${Math.ceil(f / 10)})       ${pct(st.win)}     ${pct(ra.win)} (${pct(sp.win)})       ${ra.rounds.toFixed(1)}`);
  }
}

// quick experiment: tune only the Goblin King for the current knobs, report starter/rare/epic
function quick() {
  const B = BOSSES['goblin-king'];
  for (let it = 0; it < 3; it++) {
    bisect(null, (v) => { B.hp = v; }, 1, 200, () => bossRuns(1, 'rare', 'smart', 300, it + 1).rounds < 14, 9);
    bisect(null, (v) => { B.atk = v; }, 0.3, 25, () => bossRuns(1, 'rare', 'smart', 400, it + 7).win > 0.5, 10);
  }
  const r = ['starter', 'rare', 'epic'].map((k) => bossRuns(1, k, 'smart', 1200).win);
  const sp = bossRuns(1, 'rare', 'spam', 1200).win;
  console.log(`mit ${TUNE.mitPerScale} var ${TUNE.variance} critx ${TUNE.critMult} base ${JSON.stringify(BASE)} -> starter ${pct(r[0])} rare ${pct(r[1])} epic ${pct(r[2])}  spam ${pct(sp)}  (King hp ${B.hp.toFixed(1)} atk ${B.atk.toFixed(2)})`);
}

function curve() {
  const B = BOSSES['goblin-king'];
  const base = B.atk;
  console.log('Goblin King atk  | starter  rare  epic   (smart)');
  for (const k of [0.6, 0.75, 0.9, 1, 1.1, 1.25, 1.4]) {
    B.atk = base * k;
    const r = ['starter', 'rare', 'epic'].map((kind) => bossRuns(1, kind, 'smart', 600).win);
    console.log(`  x${k.toFixed(2)} (${B.atk.toFixed(2)})   | ${r.map(pct).join('   ')}`);
  }
  B.atk = base;
}

const isMain = import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  for (const a of process.argv) {
    const [k, v] = a.replace(/^--/, '').split('=');
    if (k === 'mit') TUNE.mitPerScale = +v; if (k === 'var') TUNE.variance = +v; if (k === 'critm') TUNE.critMult = +v; if (k === 'bcrit') BASE.crit = +v; if (k === 'batk') BASE.atk = +v; if (k === 'bdef') BASE.def = +v; if (k === 'bhp') BASE.hp = +v;
  }
  if (process.argv.includes('--tune')) {
    tune();
    console.log('\nTUNED VALUES:');
    console.log('ENEMY_BASE =', JSON.stringify({ hp: +ENEMY_BASE.hp.toFixed(2), atk: +ENEMY_BASE.atk.toFixed(3), def: ENEMY_BASE.def }));
    console.log('SECTION_FUDGE =', JSON.stringify(SECTION_FUDGE.map((x) => +x.toFixed(3))));
    for (const B of Object.values(BOSSES)) console.log(`${B.name}: hp ${B.hp.toFixed(2)} atk ${B.atk.toFixed(3)}`);
  }
  if (process.argv.includes('--quick')) quick(); else if (process.argv.includes('--curve')) curve(); else report();
}
