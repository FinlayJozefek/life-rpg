// Turn-based combat engine. Pure logic, no screen code, so the same rules run the
// real fights and the balance simulator (tools/dsim.mjs).
import { FAMILIES, WEAK_MULT, RESIST_MULT, POTIONS, POTIONS_PER_FIGHT, TYPE_NAME } from './ddata.js';

const CRIT_MULT = 1.75;
// Defence mitigation constant, set per fight from the section (see createBattle).
const MIT = { C: 60 };
export const TUNE = { mitPerScale: 22, variance: 0.35, critMult: 2.5 };   // TUNED with tools/dsim.mjs   // C = mitPerScale x section scale (TUNED)
const SLOW_SKIP = 0.3;            // a slowed fighter loses ~30% of its turns (the other side gets "two in a row")
const MAX_ROUNDS = 80;

export const STATUS_INFO = {
  bleed: 'Bleeding', burn: 'Burning', poison: 'Poisoned', freeze: 'Frozen', slow: 'Slowed', stun: 'Stunned',
};

function emptyStatus() { return { bleed: null, burn: null, poison: null, freeze: 0, slow: 0, stunned: false }; }

// p: { name, maxHp, atk, def, crit, dodge, dtype, moves:[{...}], passive:{...}, potions:{id:n}, revive, cheatDeath }
// enemies: [{ name, family, maxHp, atk, def, dodge, fast, moves, boss?: {...} }]
export function createBattle(p, enemies, { isBoss = false, reviveUsed = false, scale = 5 } = {}) {
  MIT.C = TUNE.mitPerScale * scale;
  const player = {
    ...p, side: 'player', hp: Math.min(p.hp ?? p.maxHp, p.maxHp), st: emptyStatus(),
    charges: Object.fromEntries(p.moves.filter((m) => m.charges).map((m) => [m.name, m.charges])),
    buff: { atk: 1, def: 1, crit: 0 }, hitCount: 0, ward: 0,
  };
  const b = {
    player, enemies: enemies.map((e, i) => spawn(e, i)), isBoss, round: 1, over: false, won: null,
    potionsUsed: 0, reviveUsed, cheated: false, events: [], nextId: enemies.length,
  };
  if (p.passive?.healStart) heal(b, player, p.passive.healStart * player.maxHp, 'Holy Water');
  return b;
}

function spawn(e, i) {
  return { ...e, side: 'enemy', uid: i, hp: e.maxHp, st: emptyStatus(), buff: { atk: 1, def: 1, crit: 0 }, charging: null, pIdx: 0, phase: 1, defUps: 0 };
}

const alive = (b) => b.enemies.filter((e) => e.hp > 0);
const say = (b, text, extra = {}) => b.events.push({ t: 'text', text, ...extra });

// ---------- actions the player can choose ----------
export function getActions(b) {
  const p = b.player;
  if (p.aiming) return [{ kind: 'move', move: p.aiming, label: `Fire ${p.aiming.name}`, available: true, firing: true }];
  const acts = p.moves.map((move, idx) => {
    const left = move.charges ? p.charges[move.name] : null;
    return { kind: 'move', idx, move, chargesLeft: left, available: left === null || left > 0 };
  });
  if (p.shield) acts.push({ kind: 'block', label: 'Block', available: true });
  const potionsLeft = POTIONS_PER_FIGHT - b.potionsUsed;
  for (const [id, n] of Object.entries(p.potions || {})) {
    if (n > 0) acts.push({ kind: 'potion', id, label: POTIONS[id].name, count: n, available: potionsLeft > 0 });
  }
  return acts;
}

// How well a damage type works against an enemy: 1.5 weak, 0.5 resisted, 1 neutral.
export function typeMult(dtype, enemy) {
  const fam = FAMILIES[enemy.family];
  if (!fam) return 1;
  if (fam.weak.includes(dtype) || enemy.extraWeak?.includes(dtype)) return WEAK_MULT;
  if (fam.resist.includes(dtype)) return RESIST_MULT;
  return 1;
}
export const moveType = (p, move) => move.dtype || p.dtype;

// ---------- one round ----------
export function takeTurn(b, action, rng = Math.random) {
  b.events = [];
  if (b.over) return b.events;
  const p = b.player;
  const target = b.enemies.find((e) => e.uid === action.target && e.hp > 0) || alive(b)[0];
  const firstStrike = p.passive?.firstStrike || (action.kind === 'move' && action.move?.first);

  const early = firstStrike ? [] : alive(b).filter((e) => e.fast);
  for (const e of early) { enemyAct(b, e, rng); if (b.over) return finish(b); }
  playerAct(b, action, target, rng);
  if (b.over) return finish(b);
  for (const e of alive(b)) {
    if (early.includes(e)) continue;
    enemyAct(b, e, rng);
    if (b.over) return finish(b);
  }
  endOfRound(b, rng);
  return finish(b);
}

function finish(b) {
  if (!b.over && alive(b).length === 0) { b.over = true; b.won = true; say(b, 'Victory!', { big: true }); }
  if (!b.over && b.round > MAX_ROUNDS) { b.over = true; b.won = false; say(b, 'You are exhausted and fall back…'); }
  return b.events;
}

function skipTurn(b, f, rng) {
  if (f.st.freeze > 0) { f.st.freeze--; say(b, `${f.name} is frozen solid!`, { who: f.side, status: 'freeze' }); return true; }
  if (f.st.stunned) { f.st.stunned = false; say(b, `${f.name} is stunned!`, { who: f.side, status: 'stun' }); return true; }
  if (f.st.slow > 0 && rng() < SLOW_SKIP) { say(b, `${f.name} is too slow to act!`, { who: f.side, status: 'slow' }); return true; }
  return false;
}

// ---------- player ----------
function playerAct(b, action, target, rng) {
  const p = b.player;
  p.brace = 0; p.blocking = false;
  if (skipTurn(b, p, rng)) return;

  if (action.kind === 'potion') {
    const pot = POTIONS[action.id];
    if (!p.potions[action.id] || b.potionsUsed >= POTIONS_PER_FIGHT) return;
    p.potions[action.id]--; b.potionsUsed++;
    b.events.push({ t: 'potion', id: action.id });
    if (pot.heal) heal(b, p, pot.heal * p.maxHp, pot.name);
    if (pot.buff) {
      if (pot.buff.atkPct) p.buff.atk += pot.buff.atkPct;
      if (pot.buff.defPct) p.buff.def += pot.buff.defPct;
      if (pot.buff.crit) p.buff.crit += pot.buff.crit;
      say(b, `You drink the ${pot.name}: ${pot.text}.`);
    }
    return;
  }
  if (action.kind === 'block') { p.blocking = true; say(b, 'You raise your shield.'); return; }

  const move = action.move;
  if (move.charges) {
    if (!(p.charges[move.name] > 0)) return;
    p.charges[move.name]--;
  }
  // utility moves
  if (move.parry) { p.parry = true; say(b, 'You ready a parry.'); return; }
  if (move.brace) { p.brace = move.half ? 0.7 : 0.5; say(b, move.half ? 'You put up your guard.' : 'You brace yourself.'); return; }
  if (move.ward) { p.ward = Math.round(move.ward * p.maxHp); say(b, `A ward of ${p.ward} shields you.`); return; }
  if (move.cleanse) {
    p.st = emptyStatus();
    if (move.heal) heal(b, p, move.heal * p.maxHp, move.name);
    say(b, 'Holy light washes away your afflictions.');
    return;
  }
  if (move.aim && !p.aiming) { p.aiming = move; say(b, 'You take careful aim…'); return; }
  if (p.aiming) p.aiming = null;

  const targets = move.aoe ? alive(b) : [target];
  const dtype = moveType(p, move);
  for (const t of targets) {
    for (let h = 0; h < (move.hits || 1); h++) {
      if (t.hp <= 0) break;
      p.hitCount++;
      let power = move.power;
      if (p.passive?.titan && p.hitCount % 3 === 0) { power *= 3; say(b, 'TITAN STRIKE!', { big: true }); }
      const r = calc(p, t, power, dtype, { critBonus: move.critBonus, ignoreDef: (move.ignoreDef || 0) + (p.passive?.ignoreDef || 0), sure: move.sure }, rng);
      if (r.miss) { say(b, `${t.name} dodges!`, { who: 'enemy', uid: t.uid, miss: true }); continue; }
      damage(b, t, r.dmg, { crit: r.crit, eff: r.eff, from: p, move: move.name });
      if (move.lifesteal || p.passive?.lifesteal) heal(b, p, r.dmg * ((move.lifesteal || 0) + (p.passive?.lifesteal || 0)), null, true);
      // statuses from the move (certain) and from gear (chance per hit)
      applyStatus(b, p, t, 'bleed', move.bleed ? 1 : p.passive?.bleedOnHit, rng);
      applyStatus(b, p, t, 'poison', move.poison ? 1 : 0, rng);
      applyStatus(b, p, t, 'burn', move.burn ? 1 : (p.passive?.burnOnHit || 0), rng, move.burn || 1);
      applyStatus(b, p, t, 'stun', move.stun || p.passive?.stunOnHit, rng);
      applyStatus(b, p, t, 'freeze', move.freeze || p.passive?.freezeOnHit, rng);
      applyStatus(b, p, t, 'slow', move.slow ? 1 : p.passive?.slowOnHit, rng, move.slow || 2);
      if (t.hp <= 0 && p.passive?.killHeal) heal(b, p, p.maxHp, 'Ashbringer');
    }
  }
}

// ---------- enemies ----------
function enemyAct(b, e, rng) {
  if (e.hp <= 0) return;
  if (skipTurn(b, e, rng)) return;
  const p = b.player;
  let move;
  if (e.charging) { move = e.charging; e.charging = null; }
  else {
    move = pickEnemyMove(b, e, rng);
    if (move.tele) {                                   // announce now, hit next turn
      e.charging = move;
      say(b, move.tele.startsWith('The') ? move.tele : `${e.name} ${move.tele}`, { who: 'enemy', uid: e.uid, tele: true });
      return;
    }
  }
  if (move.type === 'heal') {
    const hurt = alive(b).sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp)[0];
    heal(b, hurt, (e.healer || 0.15) * hurt.maxHp, `${e.name}'s ${move.name}`);
    return;
  }
  if (move.type === 'summon') {
    if (alive(b).length < 3 && e.summon) {
      const s = spawn({ ...e.summon }, b.nextId++);
      b.enemies.push(s);
      say(b, `${e.name} summons a ${s.name}!`, { who: 'enemy', summon: s.uid });
    } else say(b, `${e.name} shouts, but no one comes.`);
    return;
  }
  if (move.type === 'buff') {
    if (e.defUps < 2) { e.buff.def += move.defUp; e.defUps++; say(b, `${e.name} hardens its stone skin!`, { who: 'enemy', uid: e.uid }); }
    else say(b, `${e.name} grinds its stone skin.`);
    return;
  }
  for (let h = 0; h < (move.hits || 1); h++) {
    if (p.hp <= 0) break;
    let zeroDef = false, extra = 1;
    if (move.ignoreWeakArmour && p.def * p.buff.def < e.atk * 0.8) zeroDef = true;
    if (move.lowDefBonus) extra += Math.max(0, Math.min(0.6, 1 - (p.def * p.buff.def) / (e.atk * 1.1)));
    const r = calc(e, p, move.power * extra, move.type, { zeroDef }, rng);
    if (r.miss) { say(b, `You dodge ${e.name}'s ${move.name}!`, { who: 'player', miss: true }); continue; }
    let dmg = r.dmg;
    let countered = false;
    if (p.parry) {                       // parry: take a quarter of the hit, then counter-attack
      p.parry = false; countered = true;
      dmg *= 0.45;
      say(b, `You parry ${e.name}'s ${move.name}!`, { who: 'player', parry: true });
    }
    if (p.brace) dmg *= p.brace;
    if (p.blocking) dmg *= 0.55;
    if (p.ward > 0) { const a = Math.min(p.ward, dmg); p.ward -= a; dmg -= a; if (a) say(b, `Your ward absorbs ${Math.round(a)}.`); }
    dmg = Math.max(move.power > 0 ? 1 : 0, Math.round(dmg));
    damage(b, p, dmg, { crit: r.crit, from: e, move: move.name, eff: 1 });
    if (countered && p.hp > 0) { const c = calc(p, e, 0.8, p.dtype, {}, rng); if (!c.miss) damage(b, e, c.dmg, { crit: c.crit, eff: c.eff, from: p, move: 'Counter' }); }
    if (move.lifesteal) heal(b, e, dmg * move.lifesteal, null, true);
    if (p.passive?.reflect && dmg > 0) damage(b, e, Math.round(dmg * p.passive.reflect), { from: p, move: 'Reflect' });
    if (p.passive?.burnAttackers) applyStatus(b, p, e, 'burn', p.passive.burnAttackers, rng);
    applyStatus(b, e, p, 'bleed', move.bleed, rng);
    applyStatus(b, e, p, 'poison', move.poison ? Math.min(1, move.poison * 4) : 0, rng);
    applyStatus(b, e, p, 'burn', move.burn, rng);
    applyStatus(b, e, p, 'stun', move.stun, rng);
    if (!p.passive?.freezeImmune) applyStatus(b, e, p, 'freeze', move.freeze, rng);
    applyStatus(b, e, p, 'slow', move.slow ? 1 : 0, rng, move.slow || 2);
    if (b.over) return;
  }
}

function pickEnemyMove(b, e, rng) {
  if (e.boss) {
    const pattern = e.phase === 2 ? e.boss.phase2.pattern : e.boss.pattern;
    const name = pattern[e.pIdx % pattern.length];
    e.pIdx++;
    return e.boss.moves[name];
  }
  let moves = e.moves;
  if (e.healer && !alive(b).some((a) => a.hp < a.maxHp * 0.6)) moves = moves.filter((mv) => mv.type !== 'heal');
  const total = moves.reduce((n, mv) => n + mv.weight, 0);
  let r = rng() * total;
  for (const mv of moves) { r -= mv.weight; if (r <= 0) return mv; }
  return moves[0];
}

// ---------- damage, healing, statuses ----------
function calc(att, def, power, dtype, opts, rng) {
  if (!opts.sure && rng() < (def.dodge || 0)) return { miss: true };
  const A = att.atk * att.buff.atk;
  const D = opts.zeroDef ? 0 : def.def * def.buff.def * (1 - Math.min(0.9, opts.ignoreDef || 0));
  // Damage grows in line with Attack; Defence has diminishing returns (C = the section's mitigation constant).
  let dmg = power * A * (MIT.C / (MIT.C + D));
  let eff = 1;
  if (def.side === 'enemy') {
    eff = typeMult(dtype, def);
    dmg *= eff;
    if (att.passive?.slayer && def.family === att.passive.slayer.family) dmg *= 1 + att.passive.slayer.bonus;
  }
  dmg *= 1 + (att.dmgPct || 0);
  const crit = rng() < (att.crit || 0) + att.buff.crit + (opts.critBonus || 0);
  if (crit) dmg *= TUNE.critMult;
  dmg *= 1 - TUNE.variance + rng() * 2 * TUNE.variance;
  return { dmg: Math.max(1, Math.round(dmg)), crit, eff };
}

function damage(b, f, amount, { crit = false, eff = 1, from = null, move = '', status = null } = {}) {
  if (amount <= 0 || f.hp <= 0) return;
  f.hp = Math.max(0, f.hp - amount);
  b.events.push({ t: 'dmg', who: f.side, uid: f.uid, amount, crit, eff, move, status, by: from?.name, fromUid: from?.uid });
  if (f.side === 'enemy' && f.boss && f.phase === 1 && f.hp > 0 && f.hp <= f.maxHp * f.boss.phase2.at) {
    f.phase = 2; f.buff.atk *= f.boss.phase2.atk; f.pIdx = 0; f.charging = null;
    b.events.push({ t: 'phase', uid: f.uid, text: f.boss.phase2.text });
  }
  if (f.hp <= 0) onDeath(b, f);
}

function onDeath(b, f) {
  if (f.side === 'player') {
    const p = f;
    if (p.revive && !b.reviveUsed) { b.reviveUsed = true; p.hp = Math.round(p.maxHp * p.revive); say(b, "The Lich's Phylactery pulls your soul back!", { big: true, who: 'player' }); return; }
    if (p.cheatDeath && !b.cheated) { b.cheated = true; p.hp = 1; say(b, 'The Wings of the Seraph refuse to let you fall!', { big: true, who: 'player' }); return; }
    b.over = true; b.won = false;
    b.events.push({ t: 'death', who: 'player' });
  } else {
    b.events.push({ t: 'death', who: 'enemy', uid: f.uid });
    say(b, `${f.name} is defeated!`);
  }
}

function heal(b, f, amount, source, quiet = false) {
  if (f.hp <= 0) return;
  const a = Math.round(Math.min(amount, f.maxHp - f.hp));
  if (a <= 0) return;
  f.hp += a;
  b.events.push({ t: 'heal', who: f.side, uid: f.uid, amount: a, source, quiet });
}

const STATUS_TURNS = { bleed: 3, burn: 3, poison: 4 };
function applyStatus(b, from, to, kind, chance, rng, strength = 1) {
  if (!chance || to.hp <= 0 || rng() >= chance) return;
  const fam = FAMILIES[to.family];
  const resisted = fam?.resist.includes(kind) || (kind === 'burn' && fam?.resist.includes('fire'));
  const A = from.atk * from.buff.atk * (resisted ? 0.5 : 1);
  switch (kind) {
    case 'bleed': to.st.bleed = { dmg: Math.max(1, Math.round(A * 0.22)), turns: STATUS_TURNS.bleed }; break;
    case 'burn': {
      const stacks = Math.min(5, (to.st.burn?.stacks || 0) + strength);
      to.st.burn = { stacks, per: Math.max(1, Math.round(A * 0.12)), turns: STATUS_TURNS.burn };
      break;
    }
    case 'poison': to.st.poison = { base: Math.max(1, Math.round(A * 0.1)), n: 0, turns: STATUS_TURNS.poison }; break;
    case 'stun': to.st.stunned = true; break;
    case 'freeze': if (to.st.freeze === 0) to.st.freeze = 1; break;
    case 'slow': to.st.slow = Math.max(to.st.slow, strength); break;
    default: return;
  }
  b.events.push({ t: 'status', who: to.side, uid: to.uid, kind });
}

function tick(b, f) {
  if (f.hp <= 0) return;
  const s = f.st;
  if (s.bleed) { damage(b, f, s.bleed.dmg, { status: 'bleed' }); if (--s.bleed.turns <= 0) s.bleed = null; }
  if (f.hp > 0 && s.burn) { damage(b, f, s.burn.per * s.burn.stacks, { status: 'burn' }); if (--s.burn.turns <= 0) s.burn = null; }
  if (f.hp > 0 && s.poison) { damage(b, f, Math.round(s.poison.base * (1 + 0.5 * s.poison.n)), { status: 'poison' }); s.poison.n++; if (--s.poison.turns <= 0) s.poison = null; }
  if (s.slow > 0) s.slow--;
  if (f.hp > 0 && f.regen) heal(b, f, f.regen * f.maxHp, `${f.name} regenerates`, true);
}

function endOfRound(b, rng) {
  const p = b.player;
  if (p.passive?.blizzard) {
    for (const e of alive(b)) {
      const r = calc(p, e, p.passive.blizzard, 'frost', { sure: true }, rng);
      damage(b, e, r.dmg, { eff: r.eff, from: p, move: 'Blizzard' });
    }
  }
  tick(b, p);
  for (const e of alive(b)) tick(b, e);
  p.brace = 0; p.blocking = false; p.parry = p.parry && false;
  b.round++;
  if (!b.over && alive(b).length === 0) { b.over = true; b.won = true; say(b, 'Victory!', { big: true }); }
}

export const isTelegraphing = (b) => alive(b).some((e) => e.charging);
export const aliveEnemies = alive;
export { TYPE_NAME };
