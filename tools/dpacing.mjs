// Crypts level pacing: works out how much XP a first clear of each section gives,
// and how many boss kills are then needed to reach the next section's gate.
//   node tools/dpacing.mjs
import { floorPlan, enemyXp, makeBoss, XP, SECTION_XP, xpForLevel, xpToNext, cryptsProgress } from '../js/dungeon/dgame.js';
import { SECTIONS } from '../js/dungeon/ddata.js';

const levelAt = (xp) => { const p = cryptsProgress(xp); return p.level + p.pct; };
function firstClearXp(sec, samples = 400) {
  let total = 0;
  for (let i = 0; i < samples; i++) {
    for (let f = 1; f <= 9; f++) for (const group of floorPlan((sec - 1) * 10 + f)) for (const e of group) total += enemyXp(e);
  }
  const floors = total / samples + 9 * XP.floorFirst * SECTION_XP[sec - 1];
  const boss = enemyXp(makeBoss(sec)) + XP.bossFirst * SECTION_XP[sec - 1];
  return floors + boss;
}
const gates = SECTIONS.map((s) => s.crypts).concat([40]);
console.log('section  gate  first-clear XP   level after   boss kills to next gate');
for (let s = 1; s <= 5; s++) {
  const start = xpForLevel(gates[s - 1]);
  const gained = firstClearXp(s);
  const after = start + gained;
  const nextGate = xpForLevel(gates[s]);
  const kills = Math.max(0, (nextGate - after) / enemyXp(makeBoss(s)));
  console.log(`  ${s}       ${String(gates[s - 1]).padStart(2)}   ${Math.round(gained).toString().padStart(8)}        ${levelAt(after).toFixed(2).padStart(5)}        ${kills.toFixed(1)} (next gate ${gates[s]})`);
}

// --solve: per-section multipliers so each first clear lands ~1.5 levels below the next gate,
// and a separate boss-XP scale so ~7 boss kills close the rest of the gap.
if (process.argv.includes('--solve')) {
  const xpAtLevel = (L) => { const whole = Math.floor(L); return xpForLevel(whole) + (L - whole) * xpToNext(whole); };
  const mults = [], bossScale = [];
  for (let s = 1; s <= 5; s++) {
    const saved = SECTION_XP[s - 1]; SECTION_XP[s - 1] = 1;
    const base = firstClearXp(s);
    const target = xpAtLevel(gates[s] - 1.5) - xpForLevel(gates[s - 1]);
    const m = target / base;
    SECTION_XP[s - 1] = m;
    const bossXp = enemyXp(makeBoss(s));
    const scale = (xpForLevel(gates[s]) - xpAtLevel(gates[s] - 1.5)) / (7 * bossXp);
    mults.push(+m.toFixed(2)); bossScale.push(+scale.toFixed(2));
    SECTION_XP[s - 1] = saved;
  }
  console.log('\nSECTION_XP =', JSON.stringify(mults));
  console.log('BOSS_XP_SCALE =', JSON.stringify(bossScale));
}
