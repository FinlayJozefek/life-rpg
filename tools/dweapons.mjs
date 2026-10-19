// Weapon check: every droppable weapon in each section, fought against that section's
// mobs (floor 9) and boss with the same Epic armour. Higher-rarity weapons should win more and faster.
//   node tools/dweapons.mjs [section]
import { createBattle, takeTurn } from '../js/dungeon/engine.js';
import { buildPlayer, makeBoss, floorPlan, newDungeon, SECTION_FUDGE } from '../js/dungeon/dgame.js';
import { DITEMS_BY_SECTION, SECTION_SCALE, GEAR_SLOTS_D, SECTIONS } from '../js/dungeon/ddata.js';
import { smartBot } from '../js/dungeon/dbot.js';
import { loadout, BOSS_LEVEL, FLOOR_LEVEL } from './dsim.mjs';

function rng32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'];
const scaleOf = (sec) => SECTION_SCALE[sec - 1] * SECTION_FUDGE[sec - 1];

export function weaponReport(sec, n = 400, withGrind = false) {
  const eq0 = loadout(sec, 'epic');
  const weapons = DITEMS_BY_SECTION[sec].filter((i) => i.slot === 'weapon' && !i.shopOnly && (withGrind || !i.grindDrop)).sort((a, b) => R.indexOf(a.rarity) - R.indexOf(b.rarity));
  const rows = [];
  for (const w of weapons) {
    const eq = { ...eq0, weapon: w.id };
    let rng = rng32(sec * 991 + 7), bw = 0, br = 0;
    for (let i = 0; i < n; i++) {
      const p = buildPlayer(newDungeon(), { equipped: eq, level: BOSS_LEVEL[sec - 1], reached: sec, upgrades: {}, potions: { 'hp-medium': 3 } });
      const b = createBattle(p, [makeBoss(sec)], { isBoss: true, scale: scaleOf(sec) });
      while (!b.over) takeTurn(b, smartBot(b), rng);
      if (b.won) { bw++; br += b.round - 1; }
    }
    rng = rng32(sec * 313 + 3); let fr = 0, ff = 0, fw = 0;
    for (let i = 0; i < n; i++) {
      let p = buildPlayer(newDungeon(), { equipped: eq, level: FLOOR_LEVEL[sec - 1], reached: sec, upgrades: {}, potions: { 'hp-medium': 4 } });
      let ok = true;
      for (const g of floorPlan((sec - 1) * 10 + 9, rng)) {
        const b = createBattle(p, g, { isBoss: false, scale: scaleOf(sec) });
        while (!b.over) takeTurn(b, smartBot(b), rng);
        fr += b.round - 1; ff++;
        if (!b.won) { ok = false; break; }
        p = { ...p, hp: b.player.hp, potions: b.player.potions };
      }
      if (ok) fw++;
    }
    rows.push({ name: w.name, rarity: w.rarity, type: w.weaponType, dtype: w.dtype || '', atk: w.stats.atk, slayer: w.slayer ? `${w.slayer.family}+${w.slayer.bonus * 100}%` : '', sig: (w.sig || []).join('/'),
      boss: bw / n, bossTurns: bw ? br / bw : 0, floor: fw / n, floorTurns: fr / ff });
  }
  return rows;
}

if (process.argv[1]?.endsWith('dweapons.mjs')) {
  const only = +process.argv[2] || 0;
  for (let sec = 1; sec <= 5; sec++) {
    if (only && sec !== only) continue;
    console.log(`\n${SECTIONS[sec - 1].name} (${SECTIONS[sec - 1].family})`);
    for (const r of weaponReport(sec, 400, process.argv.includes('--grind'))) console.log(`  ${r.rarity.padEnd(9)} ${r.name.padEnd(24)} ${r.type.padEnd(8)} ${r.dtype.padEnd(9)} atk ${String(r.atk).padStart(4)} ${r.slayer.padEnd(16)} ${r.sig.padEnd(26)} boss ${String(Math.round(r.boss * 100)).padStart(3)}% in ${r.bossTurns.toFixed(1).padStart(4)}  floor9 ${String(Math.round(r.floor * 100)).padStart(3)}% ${r.floorTurns.toFixed(1)} turns/fight`);
  }
}
