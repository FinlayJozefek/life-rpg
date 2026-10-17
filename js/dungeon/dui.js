// Dungeon screens: tower hub, battles, floor results, gear, Blacksmith and Potion Shop.
// app.js calls init() once with shared helpers, view() to draw the tab, action() for clicks.
import {
  SECTIONS, FAMILIES, DITEMS, POTIONS, MATERIALS, RAR_NAME, TYPE_NAME, SETS, SLOT_NAME_D, GEAR_SLOTS_D, POTIONS_PER_FIGHT, SECTION_SCALE,
} from './ddata.js';
import {
  newDungeon, startDungeon, cryptsProgress, cryptsLevel, sectionOf, floorInSection, sectionStart, sectionUnlocked, canPlay,
  buildPlayer, powerScore, recommendedPower, floorPlan, enemyXp, enemyCoins, rollEnemyDrops, rollBossDrops, materialFor,
  itemStats, weaponMoves, activeSet, sellPrice, buyPrice, upgradeCost, MAX_PLUS, blacksmithStock, XP, SECTION_XP, SECTION_FUDGE,
} from './dgame.js';
import { createBattle, takeTurn, getActions, aliveEnemies, typeMult, moveType } from './engine.js';
import { gearIcon, mountEnemy, enemyIcon, BOSS_AURA, TOWER_PAL, towerTexture } from './dart.js';
import { uiIcon } from '../uiicons.js';

let api = null;          // helpers from app.js
let sub = 'hub';         // hub | gear | smith | potions
let battle = null;       // current fight UI state
let run = null;          // current floor run

export function init(helpers) { api = helpers; }
const S = () => api.state();
const d = () => { const st = S(); st.dungeon ||= newDungeon(); return st.dungeon; };
const esc = (s) => api.esc(s);
const fmt = (n) => api.fmt(n);
const rarTag = (r) => `<span class="rtag r-${r}">${RAR_NAME[r]}</span>`;
const scaleFor = (sec) => SECTION_SCALE[sec - 1] * SECTION_FUDGE[sec - 1];

// ---------- describing items and moves ----------
function moveText(mv, p) {
  const bits = [];
  if (mv.power > 0) bits.push(`${Math.round(mv.power * (mv.hits || 1) * 100)}% ${TYPE_NAME[moveType(p, mv)] || ''}${mv.hits > 1 ? ` (${mv.hits} hits)` : ''}`);
  if (mv.aoe) bits.push('hits all');
  if (mv.first) bits.push('strikes first');
  if (mv.bleed) bits.push('bleed');
  if (mv.poison) bits.push('poison');
  if (mv.burn) bits.push('burn');
  if (mv.stun) bits.push(`${Math.round(mv.stun * 100)}% stun`);
  if (mv.freeze) bits.push(mv.freeze >= 1 ? 'freezes' : `${Math.round(mv.freeze * 100)}% freeze`);
  if (mv.slow) bits.push('slows');
  if (mv.lifesteal) bits.push(`heals ${Math.round(mv.lifesteal * 100)}% of damage`);
  if (mv.critBonus) bits.push(`+${Math.round(mv.critBonus * 100)}% crit`);
  if (mv.ignoreDef) bits.push(`ignores ${Math.round(mv.ignoreDef * 100)}% Defence`);
  if (mv.aim) bits.push('aim one turn, then fire');
  if (mv.parry) bits.push('take less from the next hit, then counter');
  if (mv.brace) bits.push(mv.half ? 'guard: take less damage this turn' : 'brace: take half damage this turn');
  if (mv.ward) bits.push(`shield of ${Math.round(mv.ward * 100)}% Health`);
  if (mv.cleanse) bits.push('removes all effects and heals');
  if (mv.charges) bits.push(`${mv.charges} uses per fight`);
  return bits.join(' · ');
}
function passiveText(it) {
  const t = [];
  if (it.slayer) t.push(`+${Math.round(it.slayer.bonus * 100)}% damage to ${FAMILIES[it.slayer.family].name}s`);
  if (it.firstStrike) t.push('always strikes first');
  if (it.bleedOnHit) t.push(`${Math.round(it.bleedOnHit * 100)}% bleed on hit`);
  if (it.stunOnHit) t.push(`${Math.round(it.stunOnHit * 100)}% stun on hit`);
  if (it.freezeOnHit) t.push(`${Math.round(it.freezeOnHit * 100)}% freeze on hit`);
  if (it.slowOnHit) t.push(`${Math.round(it.slowOnHit * 100)}% slow on hit`);
  if (it.burnOnHit) t.push(`${Math.round(it.burnOnHit * 100)}% burn on hit`);
  if (it.lifesteal) t.push(`heals ${Math.round(it.lifesteal * 100)}% of damage dealt`);
  if (it.ignoreDef) t.push(`ignores ${Math.round(it.ignoreDef * 100)}% of enemy Defence`);
  if (it.titan) t.push('every third hit deals triple damage');
  if (it.blizzard) t.push('frost damage to all enemies every turn, even while defending');
  if (it.killHeal) t.push('beating an enemy fully restores Health');
  if (it.reflect) t.push(`reflects ${Math.round(it.reflect * 100)}% of damage taken`);
  if (it.burnAttackers) t.push('enemies that hit you may catch fire');
  if (it.healStart) t.push(`heals ${Math.round(it.healStart * 100)}% Health at the start of each fight`);
  if (it.revive) t.push(`revives you once per floor at ${Math.round(it.revive * 100)}% Health`);
  if (it.cheatDeath) t.push('once per fight, a killing blow leaves you on 1 Health');
  if (it.freezeImmune) t.push('immune to freeze');
  if (it.coinBonus) t.push(`+${Math.round(it.coinBonus * 100)}% dungeon coins`);
  if (it.dmgPct) t.push(`+${Math.round(it.dmgPct * 100)}% damage`);
  if (it.atkPct) t.push(`${Math.round(it.atkPct * 100)}% Attack`);
  if (it.grantMove) t.push(`grants the ${it.grantMove} move`);
  return t;
}
function statLine(id) {
  const s = itemStats(id, d().upgrades[id] || 0);
  return [s.atk && `+${s.atk} Atk`, s.def && `+${s.def} Def`, s.hp && `+${s.hp} HP`, s.crit && `+${Math.round(s.crit * 100)}% crit`, s.dodge && `+${Math.round(s.dodge * 100)}% dodge`].filter(Boolean).join(' · ');
}
const gearImg = (id, cls = '') => `<img class="d-gear ${cls} glow-${DITEMS[id].rarity}" src="${gearIcon(id)}" alt="">`;
const itemName = (id) => `${esc(DITEMS[id].name)}${d().upgrades[id] ? ` <b class="plus">+${d().upgrades[id]}</b>` : ''}`;

// ---------- hub ----------
export function view() {
  const dg = d();
  if (!dg.started) {
    return `<section class="panel d-intro">
      <div class="d-tower-art">${['goblin-king', 'lich', 'stone-golem', 'frost-wyrm', 'demon-lord'].map((b) => `<img src="${enemyIcon(b, 3)}" alt="">`).join('')}</div>
      <h2>The Dungeon</h2>
      <p>A 50-floor tower of goblins, the undead, living stone, frozen beasts and demons. Fights are turn-based: pick your moves, guard against big attacks and time your potions.</p>
      <p class="muted small">It has its own gear and its own level (your Crypts level). The only link to your life skills is coins: they're shared.</p>
      <button class="btn primary wide" data-action="d-start">Enter the Dungeon</button>
      <p class="hint">You'll get a starter kit: Rusty Sword, Leather Cap, Tattered Tunic, Worn Boots and 3 Health Potions.</p>
    </section>`;
  }
  if (sub === 'gear') return viewGear();
  if (sub === 'smith') return viewSmith();
  if (sub === 'potions') return viewPotions();
  const cp = cryptsProgress(dg.xp);
  const power = powerScore(buildPlayer(dg));
  const next = Math.min(50, dg.climb);
  const nextSec = sectionOf(next);
  const nextLocked = !sectionUnlocked(dg, nextSec);
  const bossRec = recommendedPower(nextSec);
  const hero = api.avatarUrl(3);
  const segs = SECTIONS.map((sec, k) => {
    const locked = !sectionUnlocked(dg, sec.id);
    const floors = Array.from({ length: 10 }, (_, i) => {
      const f = k * 10 + i + 1;
      const play = canPlay(dg, f) ? `data-action="d-floor" data-floor="${f}"` : 'disabled';
      if (i === 9) {
        return `<div class="d-tfl boss"><button class="d-balcony ${dg.cleared[f] ? 'dead' : ''} ${f === next ? 'here' : ''}" ${play} aria-label="Floor ${f} boss">
          <img src="${enemyIcon(sec.boss, 4)}" alt="">${f === next ? `<img class="d-hero" src="${hero}" alt="">` : ''}</button><div class="d-ledge"></div></div>`;
      }
      const cls = f === next ? 'next' : dg.cleared[f] ? 'lit' : canPlay(dg, f) ? 'open' : '';
      return `<div class="d-tfl"><button class="d-win ${cls}" ${play} aria-label="Floor ${f}">${f === next ? `<img src="${hero}" alt="">` : ''}</button><span class="d-plaque">${f}</span><span class="d-stair"></span></div>`;
    }).join('');
    return `<div class="d-seg ${locked ? 'locked' : ''}" style="--edge:${TOWER_PAL[k].edge};--aura:${BOSS_AURA[sec.boss]};background-image:url(${towerTexture(k)})">
      <div class="d-crenel"></div><div class="d-seg-name">${sec.id}. ${esc(sec.name)}</div>
      <div class="d-tfloors">${floors}</div>
      ${locked ? `<div class="d-fog"><img src="${uiIcon('lock', 'color', 3)}" alt=""><b>${esc(sec.name)}</b><span>Crypts level ${sec.crypts}</span></div>` : ''}
    </div>`;
  }).reverse().join('');
  const isBoss = floorInSection(next) === 10;
  const go = nextLocked
    ? `<button class="btn wide d-go" disabled>Crypts level ${SECTIONS[nextSec - 1].crypts} needed</button>`
    : `<button class="btn primary wide d-go" data-action="d-floor" data-floor="${next}">${isBoss ? `Fight the ${esc(SECTIONS[nextSec - 1].name)} boss` : `Climb floor ${next}`}</button>`;
  setTimeout(() => { if (window.scrollY < 10) document.querySelector('.d-tower .next, .d-tower .here')?.scrollIntoView({ block: 'center' }); }, 0);
  return `
    <div class="d-hud">
      <div class="d-lv" style="--p:${(cp.pct * 100).toFixed(1)}%"><b>${cp.level}</b></div>
      <div class="d-hud-mid"><div class="d-hud-t">Crypts level ${cp.level}</div><div class="d-hud-s">${fmt(cp.into)} / ${fmt(cp.needed)} XP</div></div>
      <span class="d-chip ${power < bossRec * 0.8 ? 'red' : 'ok'}" title="Your Power vs the recommended Power for the next boss">⚔ ${fmt(power)} <span>/ ${fmt(bossRec)}</span></span>
    </div>
    <div class="d-tower-wrap"><div class="d-tower">
      <div class="d-spire"><div class="d-flag"></div><div class="d-roof"></div></div>${segs}<div class="d-ground"><div class="d-door"></div></div>
    </div><p class="hint d-tower-hint">Tap a glowing window to replay that floor and farm gear. If you fall, you drop to the start of the section but keep everything you found.</p></div>
    <div class="d-bar"><div class="d-bar-row">
      <button class="d-hubbtn" data-action="d-sub" data-sub="gear"><img src="${uiIcon('swords', 'color', 3)}" alt="">Gear</button>
      <button class="d-hubbtn" data-action="d-sub" data-sub="smith"><img src="${uiIcon('anvil', 'color', 3)}" alt="">Smith</button>
      <button class="d-hubbtn" data-action="d-sub" data-sub="potions"><img src="${uiIcon('potion', 'color', 3)}" alt="">Potions</button>
      ${go}
    </div></div>`;
}

// ---------- gear ----------
function viewGear() {
  const dg = d();
  const p = buildPlayer(dg);
  const set = activeSet(dg.equipped);
  const slots = GEAR_SLOTS_D.map((slot) => {
    const id = dg.equipped[slot];
    return `<button class="d-slot" ${id ? `data-action="d-item" data-id="${id}"` : 'disabled'}>
      <span class="d-slot-icon">${id ? gearImg(id) : ''}</span>
      <span class="d-slot-text"><span class="slot-label">${SLOT_NAME_D[slot]}</span><span class="gear-name">${id ? itemName(id) : '<span class="muted">Empty</span>'}</span><span class="small muted">${id ? statLine(id) : ''}</span></span>
    </button>`;
  }).join('');
  const owned = Object.keys(dg.inv).filter((id) => dg.inv[id] > 0)
    .sort((a, b) => DITEMS[b].section - DITEMS[a].section || ['divine', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'].indexOf(DITEMS[a].rarity) - ['divine', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'].indexOf(DITEMS[b].rarity));
  const list = owned.map((id) => {
    const eq = Object.values(dg.equipped).includes(id);
    return `<button class="d-inv r-border-${DITEMS[id].rarity}" data-action="d-item" data-id="${id}">
      ${gearImg(id)}<span class="d-inv-text"><b>${itemName(id)}</b>${dg.inv[id] > 1 ? ` <span class="muted">x${dg.inv[id]}</span>` : ''}${eq ? ' <span class="eq">E</span>' : ''}<br>
      <span class="small">${rarTag(DITEMS[id].rarity)} <span class="muted">${SLOT_NAME_D[DITEMS[id].slot]} · ${statLine(id)}</span></span></span></button>`;
  }).join('');
  const mats = Object.entries(dg.materials).filter(([, n]) => n > 0).map(([m, n]) => `${esc(MATERIALS[m].name)} ×${n}`).join(' · ') || 'none yet';
  const pots = Object.entries(dg.potions).filter(([, n]) => n > 0).map(([k, n]) => `${esc(POTIONS[k].name)} ×${n}`).join(' · ') || 'none';
  return `
    <section class="panel">
      <button class="btn d-back" data-action="d-sub" data-sub="hub">‹ Tower</button>
      <h2>Dungeon gear</h2>
      <div class="d-stats"><span>Power <b>${fmt(powerScore(p))}</b></span><span>Atk <b>${p.atk}</b></span><span>Def <b>${p.def}</b></span><span>HP <b>${p.maxHp}</b></span><span>Crit <b>${Math.round(p.crit * 100)}%</b></span>${p.dodge ? `<span>Dodge <b>${Math.round(p.dodge * 100)}%</b></span>` : ''}</div>
      ${set ? `<p class="boost small">Set bonus · ${esc(SETS[set].name)}: ${esc(SETS[set].text)}</p>` : '<p class="muted small">Wear all 4 armour pieces of a section\'s Epic set for a set bonus.</p>'}
      <div class="d-slots">${slots}</div>
      <h3>Moves</h3>
      <ul class="d-moves">${p.moves.map((mv) => `<li><b>${esc(mv.name)}</b>${mv.sig ? ' <span class="new">SIGNATURE</span>' : ''}<br><span class="small muted">${moveText(mv, p)}</span></li>`).join('')}</ul>
    </section>
    <section class="panel"><h2>Backpack</h2><p class="small muted">Materials: ${mats}<br>Potions: ${pots}</p><div class="d-inv-list">${list || '<p class="muted">Nothing yet.</p>'}</div></section>`;
}

function showItem(id) {
  const dg = d();
  const it = DITEMS[id];
  const eq = dg.equipped[it.slot] === id;
  const plus = dg.upgrades[id] || 0;
  const moves = it.slot === 'weapon' ? weaponMoves(id, dg.equipped.offhand) : null;
  const p = buildPlayer(dg);
  const passive = passiveText(it);
  api.openModal(`<div class="item-detail">
      ${gearImg(id, 'xl')}
      <h2>${itemName(id)}</h2>
      <div>${rarTag(it.rarity)} <span class="muted">${SLOT_NAME_D[it.slot]}${it.weaponType ? ` · ${esc(it.weaponType)}` : ''}${it.section ? ` · ${esc(SECTIONS[it.section - 1].name)}` : ''}</span></div>
      <p>${statLine(id)}</p>
      ${passive.length ? `<p class="boost small">${passive.map(esc).join('<br>')}</p>` : ''}
      ${it.set ? `<p class="small muted">Part of the ${esc(SETS[it.set].name)} set (4 pieces: ${esc(SETS[it.set].text)})</p>` : ''}
      ${moves ? `<ul class="d-moves left">${moves.map((mv) => `<li><b>${esc(mv.name)}</b>${mv.sig ? ' <span class="new">SIGNATURE</span>' : ''}<br><span class="small muted">${moveText(mv, { ...p, dtype: it.dtype || p.dtype })}</span></li>`).join('')}</ul>` : ''}
      <p class="small muted">Owned ×${dg.inv[id] || 0} · sells for ${fmt(sellPrice(id))} coins${plus < MAX_PLUS ? ` · upgrade at the Blacksmith (+${plus} → +${plus + 1})` : ' · fully upgraded'}</p>
    </div>
    <div class="btn-col">
      <button class="btn primary" data-action="d-equip" data-id="${id}">${eq ? 'Unequip' : `Equip (${SLOT_NAME_D[it.slot]})`}</button>
      ${(dg.inv[id] || 0) > (eq ? 1 : 0) ? `<button class="btn" data-action="d-sell" data-id="${id}">Sell 1 (+${fmt(sellPrice(id))} coins)</button>` : ''}
      <button class="btn" data-action="close">Close</button>
    </div>`);
}

// ---------- Blacksmith ----------
function viewSmith() {
  const dg = d();
  const coins = S().coins;
  const stock = blacksmithStock(dg).map((it) => `<div class="d-shop-row">${gearImg(it.id)}<span class="d-inv-text"><b>${esc(it.name)}</b><br><span class="small">${rarTag(it.rarity)} <span class="muted">${SLOT_NAME_D[it.slot]} · ${statLine(it.id)}</span></span></span>
    <button class="btn" data-action="d-buy" data-id="${it.id}" ${coins >= buyPrice(it.id) ? '' : 'disabled'}>${fmt(buyPrice(it.id))}</button></div>`).join('');
  const ups = Object.keys(dg.inv).filter((id) => dg.inv[id] > 0).map((id) => {
    const plus = dg.upgrades[id] || 0;
    if (plus >= MAX_PLUS) return `<div class="d-shop-row">${gearImg(id)}<span class="d-inv-text"><b>${itemName(id)}</b><br><span class="small muted">Fully upgraded</span></span></div>`;
    const c = upgradeCost(id, plus);
    const have = dg.materials[c.material] || 0;
    const ok = coins >= c.coins && have >= c.count;
    return `<div class="d-shop-row">${gearImg(id)}<span class="d-inv-text"><b>${itemName(id)}</b> → <b class="plus">+${plus + 1}</b><br><span class="small muted">${fmt(c.coins)} coins + ${c.count} ${esc(MATERIALS[c.material].name)} (have ${have})</span></span>
      <button class="btn" data-action="d-upgrade" data-id="${id}" ${ok ? '' : 'disabled'}>Upgrade</button></div>`;
  }).join('');
  return `<section class="panel"><button class="btn d-back" data-action="d-sub" data-sub="hub">‹ Tower</button>
      <h2>Blacksmith</h2><p class="small muted">Coins: <b class="coin">${fmt(coins)}</b> (shared with your life skills). Each upgrade adds ${6}% to an item's stats, up to +${MAX_PLUS}.</p>
      <h3>Upgrade</h3><div class="d-shop">${ups || '<p class="muted">No gear yet.</p>'}</div>
      <h3>Buy</h3><div class="d-shop">${stock}</div></section>`;
}

// ---------- Potion Shop ----------
function viewPotions() {
  const dg = d();
  const coins = S().coins;
  const rows = Object.entries(POTIONS).map(([id, pt]) => `<div class="d-shop-row"><span class="d-potion">${pt.heal ? '❤' : '✦'}</span>
    <span class="d-inv-text"><b>${esc(pt.name)}</b> <span class="muted">×${dg.potions[id] || 0}</span><br><span class="small muted">${pt.heal ? `Heals ${Math.round(pt.heal * 100)}% of your Health` : esc(pt.text)}</span></span>
    <button class="btn" data-action="d-potion-buy" data-id="${id}" data-n="1" ${coins >= pt.price ? '' : 'disabled'}>${fmt(pt.price)}</button>
    <button class="btn" data-action="d-potion-buy" data-id="${id}" data-n="5" ${coins >= pt.price * 5 ? '' : 'disabled'}>×5</button></div>`).join('');
  return `<section class="panel"><button class="btn d-back" data-action="d-sub" data-sub="hub">‹ Tower</button>
    <h2>Potion Shop</h2><p class="small muted">Coins: <b class="coin">${fmt(coins)}</b>. You can drink up to ${POTIONS_PER_FIGHT} potions per fight, and drinking one uses your whole turn.</p>
    <div class="d-shop">${rows}</div></section>`;
}

// ---------- runs & battles ----------
const statusChips = (f) => ['bleed', 'burn', 'poison', 'freeze', 'slow'].filter((k) => (k === 'freeze' || k === 'slow' ? f.st[k] > 0 : f.st[k])).map((k) => `<span class="d-st st-${k}">${k}</span>`).join('');
// Health shown on screen lags behind the real value so bars drop hit by hit during the animation.
const keyOf = (f) => (f.side === 'player' ? 'p' : `e${f.uid}`);
const shownHp = (f) => (battle?.shown && battle.shown[keyOf(f)] !== undefined ? battle.shown[keyOf(f)] : f.hp);
function startRun(floor) {
  const dg = d();
  if (!canPlay(dg, floor)) return;
  run = { floor, plan: floorPlan(floor), idx: 0, hp: null, xp: 0, coins: 0, drops: [], mats: 0, reviveUsed: false, kills: 0, startLevel: cryptsLevel(dg.xp) };
  api.sfx.unlock();
  startFight();
}

function startFight() {
  const dg = d();
  const p = buildPlayer(dg);
  if (run.hp !== null) p.hp = Math.min(run.hp, p.maxHp);
  const b = createBattle(p, run.plan[run.idx], { isBoss: floorInSection(run.floor) === 10, reviveUsed: run.reviveUsed, scale: scaleFor(sectionOf(run.floor)) });
  battle = { b, target: b.enemies[0].uid, busy: false, log: [], stops: [], potionPick: false };
  const intro = b.enemies.length > 1 ? `${b.enemies.length} enemies appear!` : `${b.enemies[0].name} appears!`;
  battle.log.push(b.isBoss ? `The ${b.enemies[0].name} blocks your path!` : intro);
  renderBattle(true);
}

function battleRoot() {
  let el = document.getElementById('d-battle');
  if (!el) { el = document.createElement('div'); el.id = 'd-battle'; document.body.appendChild(el); }
  return el;
}

function renderBattle(full = false) {
  const { b } = battle;
  const p = b.player;
  const root = battleRoot();
  const sec = SECTIONS[sectionOf(run.floor) - 1];
  const target = b.enemies.find((e) => e.uid === battle.target && e.hp > 0) || aliveEnemies(b)[0];
  if (target) battle.target = target.uid;
  const statuses = statusChips;
  const enemies = b.enemies.map((e) => `<button class="d-enemy ${shownHp(e) <= 0 ? 'dead' : ''} ${e.uid === battle.target ? 'targeted' : ''} ${e.boss ? 'boss' : ''}" data-action="d-target" data-uid="${e.uid}" data-e="${e.uid}">
      ${e.charging ? `<div class="d-tele">⚠ ${esc(e.charging.name)}</div>` : ''}
      <canvas class="d-enemy-cv" data-ecv="${e.uid}"></canvas>
      <div class="d-ename">${esc(e.name)}${e.boss && e.phase === 2 ? ' <span class="d-red">ENRAGED</span>' : ''}</div>
      <div class="d-hpbar"><span style="width:${(shownHp(e) / e.maxHp * 100).toFixed(1)}%"></span></div>
      <div class="d-hptext">${fmt(shownHp(e))} / ${fmt(e.maxHp)}</div>
      <div class="d-sts">${statuses(e)}</div>
    </button>`).join('');
  const acts = getActions(b);
  let buttons;
  if (battle.potionPick) {
    const pots = acts.filter((a) => a.kind === 'potion');
    buttons = `${pots.map((a) => `<button class="btn d-act" data-action="d-act" data-kind="potion" data-id="${a.id}" ${a.available && !battle.busy ? '' : 'disabled'}><b>${esc(POTIONS[a.id].name)}</b><span class="small">×${a.count}</span></button>`).join('') || '<p class="muted small">No potions. Buy some at the Potion Shop.</p>'}
      <button class="btn d-act" data-action="d-potions" data-open="0">Back</button>`;
  } else {
    buttons = acts.filter((a) => a.kind === 'move').map((a) => {
      const mv = a.move;
      const eff = target && mv.power > 0 ? typeMult(moveType(p, mv), target) : 1;
      const tag = eff > 1 ? '<span class="d-eff good">Strong!</span>' : eff < 1 ? '<span class="d-eff bad">Weak</span>' : '';
      return `<button class="btn d-act ${mv.sig ? 'sig' : ''}" data-action="d-act" data-kind="move" data-idx="${a.idx ?? -1}" ${a.available && !battle.busy ? '' : 'disabled'} title="${esc(moveText(mv, p))}">
        <b>${esc(a.label || mv.name)}</b><span class="small">${mv.power > 0 ? esc(TYPE_NAME[moveType(p, mv)] || '') : 'Utility'}${a.chargesLeft !== null && a.chargesLeft !== undefined ? ` · ${a.chargesLeft}/${mv.charges}` : ''}</span>${tag}</button>`;
    }).join('');
    if (acts.some((a) => a.kind === 'block')) buttons += `<button class="btn d-act" data-action="d-act" data-kind="block" ${battle.busy ? 'disabled' : ''}><b>Block</b><span class="small">Shield</span></button>`;
    const potLeft = POTIONS_PER_FIGHT - b.potionsUsed;
    if (!acts[0]?.firing) buttons += `<button class="btn d-act" data-action="d-potions" data-open="1" ${battle.busy || potLeft <= 0 ? 'disabled' : ''}><b>Potion</b><span class="small">${potLeft}/${POTIONS_PER_FIGHT} left this fight</span></button>`;
  }
  root.innerHTML = `<div class="d-bg sec-${sec.id}"></div>
    <div class="d-top"><span>Floor ${run.floor} · ${esc(sec.name)}</span><span>Fight ${run.idx + 1}/${run.plan.length}</span><button class="d-flee" data-action="d-flee">Flee</button></div>
    <div class="d-enemies">${enemies}</div>
    <div class="d-log">${battle.log.slice(-4).map((l) => `<div>${esc(l)}</div>`).join('')}</div>
    <div class="d-player">
      <div class="d-pname"><b>${esc(S().name)}</b> <span class="small muted">Atk ${p.atk} · Def ${p.def}</span> <span class="d-sts">${statuses(p)}${p.ward > 0 ? '<span class="d-st st-ward">ward</span>' : ''}${p.parry ? '<span class="d-st st-ward">parry</span>' : ''}</span></div>
      <div class="d-hpbar me"><span style="width:${(shownHp(p) / p.maxHp * 100).toFixed(1)}%"></span></div>
      <div class="d-hptext">${fmt(shownHp(p))} / ${fmt(p.maxHp)}</div>
      <div class="d-acts">${buttons}</div>
    </div>`;
  root.classList.add('open');
  // enemy sprites
  battle.stops.forEach((s) => s()); battle.stops = [];
  for (const e of b.enemies) {
    const cv = root.querySelector(`[data-ecv="${e.uid}"]`);
    if (cv && e.hp > 0) battle.stops.push(mountEnemy(cv, e, e.boss ? 6 : 4));
  }
  if (full) root.scrollTop = 0;
}

// Floating damage / heal numbers over a fighter.
function popNumber(ev) {
  const root = battleRoot();
  const host = ev.who === 'player' ? root.querySelector('.d-player') : root.querySelector(`[data-e="${ev.uid}"]`);
  if (!host) return;
  const n = document.createElement('div');
  n.className = `d-pop ${ev.t === 'heal' ? 'heal' : ev.crit ? 'crit' : ''} ${ev.status ? `st-${ev.status}` : ''} ${ev.eff > 1 ? 'eff' : ''}`;
  n.textContent = ev.t === 'heal' ? `+${fmt(ev.amount)}` : `${ev.crit ? 'CRIT ' : ''}-${fmt(ev.amount)}${ev.eff > 1 ? '!' : ''}`;
  host.appendChild(n);
  setTimeout(() => n.remove(), 1100);
  if (ev.t === 'dmg') {
    host.classList.remove('hit'); void host.offsetWidth; host.classList.add('hit');
    if (ev.who === 'player' && ev.amount > b0().player.maxHp * 0.2) { api.shake(root); api.vibrate(60); }
  }
}
const b0 = () => battle.b;

function playEvents(events, done) {
  const queue = events.slice();
  const step = () => {
    if (!battle) return;
    const ev = queue.shift();
    if (!ev) { battle.shown = null; done(); return; }
    let wait = 0;
    if (ev.t === 'text') { battle.log.push(ev.text); if (ev.tele) { api.sfx.chime(); wait = 500; } else wait = ev.big ? 600 : 180; }
    const k = ev.who === 'player' ? 'p' : `e${ev.uid}`;
    if (ev.t === 'dmg' && battle.shown && battle.shown[k] !== undefined) battle.shown[k] = Math.max(0, battle.shown[k] - ev.amount);
    if (ev.t === 'heal' && battle.shown && battle.shown[k] !== undefined) battle.shown[k] += ev.amount;
    if (ev.t === 'dmg') {
      const target = ev.who === 'player' ? 'you' : (battle.b.enemies.find((x) => x.uid === ev.uid)?.name || 'it');
      battle.log.push(ev.status
        ? `${ev.who === 'player' ? 'You take' : `${target} takes`} ${fmt(ev.amount)} ${ev.status} damage`
        : `${ev.who === 'player' ? ev.by : 'You'} · ${ev.move}: ${fmt(ev.amount)}${ev.crit ? ' CRIT!' : ''}${ev.eff > 1 ? ' (super effective!)' : ev.eff < 1 ? ' (resisted)' : ''}`);
      popNumber(ev); api.sfx.hit(ev.crit, ev.who === 'player'); wait = 330;
    }
    if (ev.t === 'heal' && !ev.quiet) { popNumber(ev); wait = 250; }
    if (ev.t === 'heal' && ev.quiet) wait = 60;
    if (ev.t === 'phase') { battle.log.push(ev.text); api.shake(battleRoot(), true); api.flash('#ff4a2a88'); api.sfx.dropSound(4); wait = 900; }
    if (ev.t === 'status') wait = 80;
    if (ev.t === 'potion') { api.sfx.chime(); wait = 150; }
    if (ev.t === 'death' && ev.who === 'enemy') wait = 300;
    if (wait) { updateBars(); setTimeout(step, wait); } else step();
  };
  step();
}
function updateBars() {
  const root = battleRoot();
  const b = battle.b;
  for (const e of b.enemies) {
    const el = root.querySelector(`[data-e="${e.uid}"]`);
    if (!el) { renderBattle(); return; }            // a summoned enemy appeared
    const hp = shownHp(e);
    el.querySelector('.d-hpbar span').style.width = `${(hp / e.maxHp * 100).toFixed(1)}%`;
    el.querySelector('.d-hptext').textContent = `${fmt(hp)} / ${fmt(e.maxHp)}`;
    el.classList.toggle('dead', hp <= 0);
    el.querySelector('.d-sts').innerHTML = statusChips(e);
    const t = el.querySelector('.d-tele');
    if (e.charging && !t) el.insertAdjacentHTML('afterbegin', `<div class="d-tele">⚠ ${esc(e.charging.name)}</div>`);
    if (!e.charging && t) t.remove();
  }
  const p = b.player;
  const pe = root.querySelector('.d-player');
  pe.querySelector('.d-hpbar span').style.width = `${(shownHp(p) / p.maxHp * 100).toFixed(1)}%`;
  pe.querySelector('.d-hptext').textContent = `${fmt(shownHp(p))} / ${fmt(p.maxHp)}`;
  root.querySelector('.d-log').innerHTML = battle.log.slice(-4).map((l) => `<div>${esc(l)}</div>`).join('');
}

function act(action) {
  if (!battle || battle.busy || battle.b.over) return;
  battle.busy = true;
  battle.potionPick = false;
  const before = { p: battle.b.player.hp };
  for (const e of battle.b.enemies) before[`e${e.uid}`] = e.hp;
  battle.shown = before;
  const events = takeTurn(battle.b, { ...action, target: battle.target });
  for (const e of battle.b.enemies) if (before[`e${e.uid}`] === undefined) before[`e${e.uid}`] = e.maxHp;   // summoned this turn
  renderBattle();
  playEvents(events, () => {
    battle.busy = false;
    const b = battle.b;
    if (b.over) return setTimeout(() => endFight(b.won), 500);
    renderBattle();
  });
}

function endFight(won) {
  const dg = d();
  const b = battle.b;
  run.reviveUsed = b.reviveUsed;
  dg.potions = { ...b.player.potions };
  // rewards for every enemy beaten (kept even if you die later)
  const coinBonus = 1 + (Object.values(dg.equipped).reduce((n, id) => n + (id && DITEMS[id].coinBonus || 0), 0));
  for (const e of b.enemies.filter((x) => x.hp <= 0)) {
    const tpl = { ...e, isBoss: !!e.boss, section: sectionOf(run.floor), fis: floorInSection(run.floor) };
    run.xp += enemyXp(tpl);
    run.coins += Math.round(enemyCoins(tpl) * coinBonus);
    run.kills++;
    if (e.boss) run.drops.push(...rollBossDrops(sectionOf(run.floor)));
    else run.drops.push(...rollEnemyDrops(tpl));
    if (Math.random() < (e.boss ? 1 : 0.6)) run.mats += e.boss ? 5 + Math.floor(Math.random() * 4) : 1 + (Math.random() < 0.3 ? 1 : 0);
  }
  battle.stops.forEach((s) => s());
  if (!won) { finishRun(false); return; }
  run.hp = b.player.hp;
  run.idx++;
  if (run.idx < run.plan.length) {
    battle.log.push('Victory! On to the next fight…');
    renderBattle();
    setTimeout(startFight, 900);
  } else finishRun(true);
}

function grantRewards(won, { fled = false } = {}) {
  const dg = d();
  const st = S();
  const k = sectionOf(run.floor);
  const first = won && !dg.cleared[run.floor];
  if (first) run.xp += Math.round((floorInSection(run.floor) === 10 ? XP.bossFirst : XP.floorFirst) * SECTION_XP[k - 1]);
  dg.xp += run.xp;
  st.coins += run.coins;
  dg.kills += run.kills;
  const mat = materialFor(k);
  if (run.mats) dg.materials[mat] = (dg.materials[mat] || 0) + run.mats;
  for (const id of run.drops) { dg.inv[id] = (dg.inv[id] || 0) + 1; dg.seen[id] = true; }
  if (won) {
    dg.cleared[run.floor] = true;
    if (floorInSection(run.floor) === 10) dg.bossKills[k] = (dg.bossKills[k] || 0) + 1;
    if (run.floor === dg.climb) dg.climb = Math.min(50, run.floor + 1);
    dg.highest = Math.max(dg.highest, dg.climb);
  } else if (!fled) {
    dg.deaths++;
    // fall back to the start of the section you're climbing (not when farming an earlier section)
    if (sectionOf(run.floor) === sectionOf(dg.climb)) dg.climb = sectionStart(run.floor);
  }
  return { first, mat };
}

function finishRun(won) {
  const fellFrom = run.floor;
  const fallTo = !won && sectionOf(fellFrom) === sectionOf(d().climb) ? sectionStart(fellFrom) : null;
  const { first, mat } = grantRewards(won);
  const dg = d();
  api.persist();
  const levelNow = cryptsLevel(dg.xp);
  const drops = run.drops.slice().sort((a, b) => ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'].indexOf(DITEMS[a].rarity) - ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'].indexOf(DITEMS[b].rarity));
  const root = battleRoot();
  const dropHtml = drops.map((id, i) => `<div class="drop rar-${DITEMS[id].rarity}" style="animation-delay:${300 + i * (['epic', 'legendary', 'mythic', 'divine'].includes(DITEMS[id].rarity) ? 600 : 160)}ms">${gearImg(id)}<div class="drop-text"><div>${esc(DITEMS[id].name)}</div><div>${rarTag(DITEMS[id].rarity)}</div></div></div>`).join('');
  const summary = `<div class="d-gains"><div><b>+${fmt(run.xp)}</b><span>Crypts XP</span></div><div><b class="coin">+${fmt(run.coins)}</b><span>coins</span></div><div><b>${run.mats}</b><span>${esc(MATERIALS[mat].name)}</span></div></div>
    ${levelNow > run.startLevel ? `<div class="banner levelup">CRYPTS LEVEL ${levelNow}!${SECTIONS.find((s) => s.crypts === levelNow) ? `<span>${esc(SECTIONS.find((s) => s.crypts === levelNow).name)} unlocked!</span>` : ''}</div>` : ''}
    <h3>${drops.length ? 'Loot' : 'No gear dropped'}</h3><div class="drops">${dropHtml}</div>`;
  if (won) {
    const boss = floorInSection(fellFrom) === 10;
    root.innerHTML = `<div class="d-bg sec-${sectionOf(fellFrom)}"></div><div class="d-result">
      <h2>${boss ? `${esc(SECTIONS[sectionOf(fellFrom) - 1].name)} conquered!` : `Floor ${fellFrom} cleared!`}</h2>
      ${first ? '<p class="boost center">First clear bonus!</p>' : ''}
      ${summary}
      <div class="btn-row">${canPlay(dg, fellFrom + 1) && fellFrom < 50 ? `<button class="btn primary" data-action="d-floor" data-floor="${fellFrom + 1}">Next floor</button>` : ''}<button class="btn" data-action="d-leave">Back to the tower</button></div>
    </div>`;
    if (boss) { api.confetti({ count: 200, duration: 3200 }); api.sfx.levelUpSound(true); }
    else api.sfx.levelUpSound(false);
  } else {
    // the fall: your character tumbles down past the floors back to the start of the section
    const to = fallTo;
    const floors = [];
    for (let f = fellFrom; f >= (to || fellFrom); f--) floors.push(f);
    root.innerHTML = `<div class="d-bg sec-${sectionOf(fellFrom)} dark"></div><div class="d-result">
      <div class="d-fall"><div class="d-fall-floors">${floors.map((f) => `<div>${f}</div>`).join('')}</div><div class="d-faller">${api.avatarImg()}</div></div>
      <h2>You were defeated…</h2>
      <p class="center">${to ? `You tumble down the tower to <b>floor ${to}</b>.` : 'You crawl back to the tower entrance.'} You keep everything you found.</p>
      ${summary}
      <div class="btn-row"><button class="btn primary" data-action="d-leave">Back to the tower</button></div>
    </div>`;
    root.querySelector('.d-fall')?.style.setProperty('--fall-n', floors.length);
    api.sfx.dropSound(5);
    api.vibrate([200, 100, 300]);
  }
  battle = null;
  run = null;
}

function closeBattle() {
  const root = document.getElementById('d-battle');
  if (root) { root.classList.remove('open'); root.innerHTML = ''; }
  battle?.stops.forEach((s) => s());
  battle = null;
}

// ---------- click handling ----------
export function action(a, el) {
  const dg = d();
  switch (a) {
    case 'd-start': {
      startDungeon(dg); api.persist(); api.render();
      api.toast('Starter kit added to your Dungeon gear');
      return true;
    }
    case 'd-sub': sub = el.dataset.sub; api.render(); window.scrollTo(0, 0); return true;
    case 'd-floor': {
      const f = Number(el.dataset.floor);
      closeBattle();
      if (f !== dg.climb && dg.cleared[f] && !confirm(`Replay floor ${f} to farm? Your climb stays at floor ${dg.climb}.`)) return true;
      startRun(f); return true;
    }
    case 'd-target': if (battle && !battle.busy) { const uid = Number(el.dataset.uid); if (battle.b.enemies.find((e) => e.uid === uid && e.hp > 0)) { battle.target = uid; renderBattle(); } } return true;
    case 'd-potions': if (battle) { battle.potionPick = el.dataset.open === '1'; renderBattle(); } return true;
    case 'd-act': {
      if (!battle) return true;
      const kind = el.dataset.kind;
      if (kind === 'potion') act({ kind: 'potion', id: el.dataset.id });
      else if (kind === 'block') act({ kind: 'block' });
      else {
        const acts = getActions(battle.b);
        const idx = Number(el.dataset.idx);
        const chosen = idx < 0 ? acts[0] : acts.find((x) => x.kind === 'move' && x.idx === idx);
        if (chosen) act({ kind: 'move', move: chosen.move });
      }
      return true;
    }
    case 'd-flee': {
      if (!battle || battle.busy) return true;
      if (!confirm('Flee the floor? You keep what you have found so far, but this floor is not cleared.')) return true;
      battle.stops.forEach((s) => s());
      grantRewards(false, { fled: true });   // keep what you found, no fall
      api.persist(); closeBattle(); run = null; api.render();
      return true;
    }
    case 'd-leave': closeBattle(); sub = 'hub'; api.render(); return true;
    case 'd-item': showItem(el.dataset.id); return true;
    case 'd-equip': {
      const it = DITEMS[el.dataset.id];
      dg.equipped[it.slot] = dg.equipped[it.slot] === it.id ? null : it.id;
      api.persist(); api.render(); showItem(it.id); return true;
    }
    case 'd-sell': {
      const id = el.dataset.id;
      if (!(dg.inv[id] > 0)) return true;
      dg.inv[id]--; S().coins += sellPrice(id);
      if (dg.inv[id] === 0 && dg.equipped[DITEMS[id].slot] === id) dg.equipped[DITEMS[id].slot] = null;
      api.persist(); api.render(); api.toast(`+${fmt(sellPrice(id))} coins`);
      if (dg.inv[id] > 0) showItem(id); else api.closeModal();
      return true;
    }
    case 'd-buy': {
      const id = el.dataset.id; const price = buyPrice(id);
      if (S().coins < price) return true;
      S().coins -= price; dg.inv[id] = (dg.inv[id] || 0) + 1; dg.seen[id] = true;
      api.persist(); api.render(); api.toast(`Bought ${DITEMS[id].name}`);
      return true;
    }
    case 'd-upgrade': {
      const id = el.dataset.id; const plus = dg.upgrades[id] || 0; const c = upgradeCost(id, plus);
      if (plus >= MAX_PLUS || S().coins < c.coins || (dg.materials[c.material] || 0) < c.count) return true;
      S().coins -= c.coins; dg.materials[c.material] -= c.count; dg.upgrades[id] = plus + 1;
      api.persist(); api.render(); api.sfx.chime(); api.toast(`${DITEMS[id].name} is now +${plus + 1}`);
      return true;
    }
    case 'd-potion-buy': {
      const id = el.dataset.id; const n = Number(el.dataset.n); const price = POTIONS[id].price * n;
      if (S().coins < price) return true;
      S().coins -= price; dg.potions[id] = (dg.potions[id] || 0) + n;
      api.persist(); api.render(); api.toast(`Bought ${n} × ${POTIONS[id].name}`);
      return true;
    }
    default: return false;
  }
}
