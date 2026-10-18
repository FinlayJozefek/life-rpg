// Dungeon screens: tower hub, battles, floor results, and the Camp (gear, bag, forge, shop, potions).
// app.js calls init() once with shared helpers, view() to draw the tab, action() for clicks.
import {
  SECTIONS, FAMILIES, BOSSES, DITEMS, POTIONS, MATERIALS, RAR_NAME, TYPE_NAME, SETS, SLOT_NAME_D, GEAR_SLOTS_D, POTIONS_PER_FIGHT, SECTION_SCALE,
} from './ddata.js';
import {
  newDungeon, startDungeon, cryptsProgress, cryptsLevel, sectionOf, floorInSection, sectionStart, sectionUnlocked, canPlay,
  buildPlayer, powerScore, recommendedPower, floorPlan, enemyXp, enemyCoins, rollEnemyDrops, rollBossDrops, materialFor,
  itemStats, weaponMoves, activeSet, sellPrice, buyPrice, upgradeCost, MAX_PLUS, blacksmithStock, XP, SECTION_XP, SECTION_FUDGE,
  chestKey, chestName, chestInfo, rollChest, CHEST_TIERS, CHEST_ORDER,
} from './dgame.js';
import { createBattle, takeTurn, getActions, aliveEnemies, typeMult, moveType } from './engine.js';
import { gearIcon, mountEnemy, enemyIcon, BOSS_AURA, TOWER_PAL, towerTexture, chestIcon } from './dart.js';
import { uiIcon } from '../uiicons.js';
import { bestForSlot, bestGear } from './dbot.js';
import { mountGearArt } from './gearart.js';

let api = null;          // helpers from app.js
let sub = 'hub';         // hub | camp
let battle = null;       // current fight UI state
let run = null;          // current floor run
let campTab = 'gear';    // gear | bag | forge | shop | potions
let bagFilter = 'all', bagSec = 0, shopSec = 0, forgeSel = null;

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
const gearImg = (id, cls = '') => `<img class="d-gear ${cls}" src="${gearIcon(id, cls === 'xl' ? 5 : 3)}" alt="">`;
const itemName = (id) => `${esc(DITEMS[id].name)}${d().upgrades[id] ? ` <b class="plus">+${d().upgrades[id]}</b>` : ''}`;

// ---------- hub ----------
export function view() {
  const dg = d();
  if (sub !== 'camp') delete document.body.dataset.camp;
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
  if (sub === 'camp') return viewCamp();
  const cp = cryptsProgress(dg.xp);
  const power = powerScore(buildPlayer(dg));
  const next = Math.min(50, dg.climb);
  const nextSec = sectionOf(next);
  document.body.dataset.sec = nextSec;   // lets a look theme the backdrop to the section you are in
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
      <div class="d-hud-mid"><div class="d-hud-row"><span class="d-hud-t">Crypts level ${cp.level}</span><span class="d-hud-s">${fmt(cp.into)} / ${fmt(cp.needed)} XP</span></div>
        <div class="bar d-xpbar"><span style="width:${(cp.pct * 100).toFixed(1)}%"></span></div></div>
      <span class="d-chip" title="Your total gear Power">⚔ ${fmt(power)}</span>
    </div>
    <div class="d-tower-wrap"><div class="d-tower">
      <div class="d-spire"><div class="d-flag"></div><div class="d-roof"></div></div>${segs}<div class="d-ground"><div class="d-door"></div></div>
    </div><p class="hint d-tower-hint">Tap a glowing window to replay that floor and farm gear. If you fall, you drop to the start of the section but keep everything you found.</p></div>
    <div class="d-bar">${matchupHtml(dg)}<div class="d-bar-row">
      <button class="d-hubbtn" data-action="d-camp" data-tab="gear"><img src="${uiIcon('chest', 'color', 3)}" alt="">Camp</button>
      <button class="d-hubbtn" data-action="d-camp" data-tab="shop"><img src="${uiIcon('anvil', 'color', 3)}" alt="">Shop</button>
      <button class="d-hubbtn" data-action="d-camp" data-tab="potions"><img src="${uiIcon('potion', 'color', 3)}" alt="">Potions</button>
      ${go}
    </div></div>`;
}

// ---------- win chance ----------
// "How likely am I to beat the next floor?" from a quick simulation with your real gear.
function nextFloor(dg) {
  const f = Math.min(50, dg.climb), sec = SECTIONS[sectionOf(f) - 1];
  return { f, sec, boss: floorInSection(f) === 10, locked: !sectionUnlocked(dg, sec.id) };
}
function matchupHtml(dg) {
  const nf = nextFloor(dg);
  if (nf.locked) return '';
  const fam = FAMILIES[nf.sec.family];
  const B = BOSSES[nf.sec.boss];
  const weak = [...fam.weak, ...(nf.boss && B.extraWeak ? B.extraWeak : [])];
  const p = buildPlayer(dg);
  const m = typeMult(p.dtype, { family: nf.sec.family, extraWeak: nf.boss ? B.extraWeak : null });
  const word = m > 1 ? 'super effective' : m < 1 ? 'resisted' : 'neutral';
  const names = (list) => list.map((t) => TYPE_NAME[t]).join(' & ');
  return `<div class="d-match">${fam.name}s are weak to <b class="d-good">${names(weak)}</b>${fam.resist.length ? ` and resist <b class="d-red">${names(fam.resist)}</b>` : ''}. Your weapon: <b class="${m > 1 ? 'd-good' : m < 1 ? 'd-red' : ''}">${TYPE_NAME[p.dtype]} (${word})</b></div>`;
}

// ---------- Camp: gear, bag, forge, shop and potions in one screen ----------
const RAR_ORDER = ['divine', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
const byRarity = (a, b) => RAR_ORDER.indexOf(DITEMS[a].rarity) - RAR_ORDER.indexOf(DITEMS[b].rarity);
const homeSection = (id) => Math.max(1, DITEMS[id].section);   // starter kit lives with section 1
const ownedIds = (dg) => Object.keys(dg.inv).filter((id) => dg.inv[id] > 0).sort(byRarity);
const isWorn = (dg, id) => dg.equipped[DITEMS[id].slot] === id;
const coinImg = () => `<img class="d-coin" src="${uiIcon('coin', 'color', 2)}" alt="coins">`;
const tileArt = (id) => `<img src="${gearIcon(id, 3)}" alt="">`;
const artCanvas = (id) => `<canvas data-art="${id}"></canvas>`;
// Animated art (cards, anvil, item sheet) is mounted after the HTML lands on the page.
function mountArt() {
  document.querySelectorAll('canvas[data-art]:not([data-live])').forEach((cv) => { cv.dataset.live = '1'; mountGearArt(cv, DITEMS[cv.dataset.art], 3); });
}
const CAMP_TABS = [['gear', 'Gear', 'swords'], ['bag', 'Bag', 'chest'], ['forge', 'Forge', 'anvil'], ['shop', 'Shop', 'coin'], ['potions', 'Potions', 'potion']];
const BAG_FILTERS = [['all', 'All'], ['weapon', 'Weapons'], ['armour', 'Armour'], ['offhand', 'Off-hand']];
const inFilter = (id) => { const s = DITEMS[id].slot; return bagFilter === 'all' || (bagFilter === 'armour' ? ['helmet', 'chest', 'legs', 'boots'].includes(s) : s === bagFilter); };

function viewCamp() {
  document.body.dataset.camp = campTab;
  const body = { gear: campGear, bag: campBag, forge: campForge, shop: campShop, potions: campPotions }[campTab]();
  setTimeout(() => { mountArt(); document.querySelectorAll('.d-flt .on, .d-strip .sel').forEach((b) => { b.parentElement.scrollLeft = b.offsetLeft - b.parentElement.clientWidth / 2 + b.clientWidth / 2; }); }, 0);
  return `<div class="d-camp">
    <div class="d-camp-head"><button class="btn d-back" data-action="d-sub" data-sub="hub">‹ Tower</button><h2>Camp</h2></div>
    <div class="d-ctabs">${CAMP_TABS.map(([k, l, ic]) => `<button class="${campTab === k ? 'on' : ''}" data-action="d-camp" data-tab="${k}"><img src="${uiIcon(ic, 'color', 3)}" alt="">${l}</button>`).join('')}</div>
    <div class="d-camp-body">${body}</div>
  </div>`;
}

function dollSlot(dg, slot) {
  const id = dg.equipped[slot];
  if (!id) return `<button class="d-dslot empty" disabled><span class="d-dlbl">${SLOT_NAME_D[slot]}</span></button>`;
  return `<button class="d-dslot r-${DITEMS[id].rarity}-bg" data-action="d-item" data-id="${id}">${tileArt(id)}${dg.upgrades[id] ? `<span class="d-dplus">+${dg.upgrades[id]}</span>` : ''}<span class="d-dlbl">${SLOT_NAME_D[slot]}</span></button>`;
}
function campGear() {
  const dg = d();
  const p = buildPlayer(dg);
  const set = activeSet(dg.equipped);
  return `<div class="d-doll">
      <div class="d-dcol">${dollSlot(dg, 'helmet')}${dollSlot(dg, 'chest')}${dollSlot(dg, 'legs')}</div>
      <div class="d-dhero"><img src="${api.avatarUrl(4)}" alt=""><div class="d-dpow">${fmt(powerScore(p))}</div><div class="d-dpowl">Power</div></div>
      <div class="d-dcol">${dollSlot(dg, 'weapon')}${dollSlot(dg, 'offhand')}${dollSlot(dg, 'boots')}</div>
    </div>
    <div class="d-chips"><span>Atk <b>${fmt(p.atk)}</b></span><span>Def <b>${fmt(p.def)}</b></span><span>HP <b>${fmt(p.maxHp)}</b></span><span>Crit <b>${Math.round(p.crit * 100)}%</b></span>${p.dodge ? `<span>Dodge <b>${Math.round(p.dodge * 100)}%</b></span>` : ''}</div>
    ${matchupHtml(dg)}
    <div class="center"><button class="btn primary d-bestall" data-action="d-best-all">Equip best gear</button></div>
    <p class="hint center">Tap a slot to compare, upgrade or swap.</p>
    ${set ? `<p class="boost small center">Set bonus · ${esc(SETS[set].name)}: ${esc(SETS[set].text)}</p>` : ''}
    <h3>Moves</h3>
    <ul class="d-moves">${p.moves.map((mv) => `<li><b>${esc(mv.name)}</b>${mv.sig ? ' <span class="new">SIGNATURE</span>' : ''}<br><span class="small muted">${moveText(mv, p)}</span></li>`).join('')}</ul>`;
}

function campBag() {
  const dg = d();
  const list = ownedIds(dg).filter(inFilter).filter((id) => !bagSec || homeSection(id) === bagSec);
  const tiles = list.map((id) => `<button class="d-tile r-${DITEMS[id].rarity}-bg ${isWorn(dg, id) ? 'worn' : ''}" data-action="d-item" data-id="${id}">${tileArt(id)}${dg.upgrades[id] ? `<span class="d-tup">+${dg.upgrades[id]}</span>` : ''}${dg.inv[id] > 1 ? `<span class="d-tn">×${dg.inv[id]}</span>` : ''}</button>`).join('');
  const empties = Math.max(0, (5 - (list.length % 5)) % 5 + (list.length < 10 ? 5 : 0));
  const mats = Object.entries(dg.materials).filter(([, n]) => n > 0).map(([m, n]) => `${esc(MATERIALS[m].name)} ×${n}`).join(' · ') || 'none yet';
  const chests = Object.entries(dg.chests || {}).filter(([, n]) => n > 0).sort(([a], [b]) => CHEST_ORDER.indexOf(chestInfo(a).tier) - CHEST_ORDER.indexOf(chestInfo(b).tier) || b.localeCompare(a));
  const chestRow = chests.length ? `<div class="ch-row"><div class="ch-row-h">Chests to open</div><div class="ch-list">${chests.map(([k, n]) => `<button class="ch-btn tier-${chestInfo(k).tier}" data-action="d-chest" data-key="${k}"><img src="${chestIcon(k, { scale: 3 })}" alt=""><span class="ch-n">×${n}</span><span class="ch-name"><b style="color:${CHEST_TIERS[chestInfo(k).tier].colour}">${CHEST_TIERS[chestInfo(k).tier].name}</b> ${esc(chestName(k).replace(' Chest', '').replace(/^\w+ /, ''))}</span></button>`).join('')}</div></div>` : '';
  return `${chestRow}<div class="d-flt">${BAG_FILTERS.map(([k, l]) => `<button class="${bagFilter === k ? 'on' : ''}" data-action="d-bagf" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="d-flt"><button class="${!bagSec ? 'on' : ''}" data-action="d-bags" data-s="0">Every section</button>${SECTIONS.map((s) => `<button class="${bagSec === s.id ? 'on' : ''}" data-action="d-bags" data-s="${s.id}"><img src="${enemyIcon(s.boss, 1)}" alt="">${esc(s.name)}</button>`).join('')}</div>
    <div class="d-cap"><span>${list.length} item${list.length === 1 ? '' : 's'} · best first</span><span>${mats}</span></div>
    <div class="d-bag">${tiles}${'<div class="d-tile empty"></div>'.repeat(empties)}</div>
    ${list.length ? '' : '<p class="muted center">Nothing here yet. Climb and farm floors to find gear.</p>'}`;
}

function campForge() {
  const dg = d();
  const list = ownedIds(dg);
  if (!list.length) return '<p class="muted">No gear yet.</p>';
  if (!forgeSel || !(dg.inv[forgeSel] > 0)) forgeSel = dg.equipped.weapon || list[0];
  const it = DITEMS[forgeSel], plus = dg.upgrades[forgeSel] || 0;
  const strip = `<div class="d-strip">${list.map((id) => `<button class="d-tile r-${DITEMS[id].rarity}-bg ${id === forgeSel ? 'sel' : ''} ${isWorn(dg, id) ? 'worn' : ''}" data-action="d-forge-sel" data-id="${id}">${tileArt(id)}${dg.upgrades[id] ? `<span class="d-tup">+${dg.upgrades[id]}</span>` : ''}</button>`).join('')}</div>`;
  const pips = `<div class="d-pips">${Array.from({ length: MAX_PLUS }, (_, i) => `<i class="${i < plus ? 'on' : i === plus ? 'nx' : ''}"></i>`).join('')}</div>`;
  if (plus >= MAX_PLUS) {
    return `${strip}<div class="d-anvil" id="d-anvil">${artCanvas(forgeSel)}<div class="d-anvil-lv">${esc(it.name)} <span class="plus">+${plus}</span></div>${pips}<p class="d-gold">Fully upgraded. Nothing more the hammer can do.</p></div>`;
  }
  const c = upgradeCost(forgeSel, plus), have = dg.materials[c.material] || 0;
  const a = itemStats(forgeSel, plus), b = itemStats(forgeSel, plus + 1);
  const ok = S().coins >= c.coins && have >= c.count;
  const diffs = [['atk', 'Atk'], ['def', 'Def'], ['hp', 'HP']].filter(([k]) => a[k]).map(([k, l]) => `<span>${l} ${fmt(a[k])} → <b>${fmt(b[k])}</b></span>`).join('');
  return `${strip}<div class="d-anvil" id="d-anvil">${artCanvas(forgeSel)}
      <div class="d-anvil-lv">${esc(it.name)} <span class="plus">+${plus}</span> → <span class="d-gold">+${plus + 1}</span></div>
      ${pips}<div class="d-diff">${diffs}</div>
      <div class="d-cost"><span class="${S().coins >= c.coins ? '' : 'bad'}">${coinImg()}${fmt(c.coins)}</span><span class="${have >= c.count ? '' : 'bad'}">${esc(MATERIALS[c.material].name)} ${have}/${c.count}</span></div>
      <button class="btn primary wide" data-action="d-upgrade" data-id="${forgeSel}" ${ok ? '' : 'disabled'}>Strike the anvil!</button>
      ${ok ? '' : `<p class="hint">${have < c.count ? `Farm ${esc(SECTIONS[Math.max(1, it.section) - 1].name)} for more ${esc(MATERIALS[c.material].name)}.` : 'Not enough coins yet.'}</p>`}
    </div>
    <p class="hint center">Each strike adds 6% to the item's stats, up to +${MAX_PLUS}.</p>`;
}

function campShop() {
  const dg = d();
  const coins = S().coins;
  const stock = blacksmithStock(dg);
  const feat = stock.filter((i) => i.shopOnly).sort((x, y) => byRarity(x.id, y.id));
  const secs = SECTIONS.filter((s) => stock.some((i) => i.section === s.id && !i.shopOnly));
  const sel = shopSec && secs.some((s) => s.id === shopSec) ? shopSec : secs[secs.length - 1]?.id;
  const basic = stock.filter((i) => !i.shopOnly && i.section === sel).sort((x, y) => byRarity(x.id, y.id) || GEAR_SLOTS_D.indexOf(x.slot) - GEAR_SLOTS_D.indexOf(y.slot));
  const price = (i) => `<button class="d-price ${coins >= buyPrice(i.id) ? '' : 'no'}" data-action="d-buy" data-id="${i.id}" ${coins >= buyPrice(i.id) ? '' : 'disabled'}>${coinImg()}${fmt(buyPrice(i.id))}</button>`;
  return `<div class="d-smith"><img src="${uiIcon('anvil', 'color', 4)}" alt=""><div class="d-bubble">${feat.length ? 'Masterworks fresh off the anvil. Not cheap, but nothing out there drops like these.' : 'Common steel for common folk. Reach the Stone Depths and I\'ll forge you something special.'}</div></div>
    ${feat.length ? `<h4 class="d-sh">✦ Masterworks</h4><div class="d-feat">${feat.map((i) => `<div class="d-fcard r-${i.rarity}-bg">
        <button class="d-fart" data-action="d-item" data-id="${i.id}">${artCanvas(i.id)}</button>
        <div class="d-fname">${esc(i.name)}</div>${rarTag(i.rarity)} <span class="small muted">${SLOT_NAME_D[i.slot]}</span>
        <div class="d-fpass">${esc(passiveText(i).join(' · ') || statLine(i.id))}</div>
        ${dg.inv[i.id] ? '<div class="small muted">Owned</div>' : ''}${price(i)}</div>`).join('')}</div>` : ''}
    <h4 class="d-sh">Everyday gear</h4>
    <div class="d-flt">${secs.map((s) => `<button class="${s.id === sel ? 'on' : ''}" data-action="d-shops" data-s="${s.id}"><img src="${enemyIcon(s.boss, 1)}" alt="">${esc(s.name)}</button>`).join('')}</div>
    <div class="d-stock">${basic.map((i) => `<div class="d-scard r-${i.rarity}-bg"><button class="d-sart" data-action="d-item" data-id="${i.id}">${tileArt(i.id)}</button><div class="d-sname">${esc(i.name)}</div>${dg.inv[i.id] ? '<div class="small muted">Owned</div>' : ''}${price(i)}</div>`).join('')}</div>`;
}

const POTION_COL = { 'hp-small': '#ff6a7a', 'hp-medium': '#e8435a', 'hp-large': '#c8203a', strength: '#ff9a3a', ironskin: '#9aa3b8', fortune: '#ffd84a' };
function campPotions() {
  const dg = d();
  const coins = S().coins;
  // what the battle offers first: healing potions, then the rest, up to the per-fight limit
  const packed = Object.entries(dg.potions).filter(([, n]) => n > 0).sort(([a], [b]) => (POTIONS[b].heal || 0) - (POTIONS[a].heal || 0)).flatMap(([k, n]) => Array(n).fill(k)).slice(0, POTIONS_PER_FIGHT);
  return `<p class="small muted center" style="margin:0">You can drink up to ${POTIONS_PER_FIGHT} per fight; each one uses your turn.</p>
    <div class="d-pack">${Array.from({ length: POTIONS_PER_FIGHT }, (_, i) => packed[i] ? `<div class="f" style="color:${POTION_COL[packed[i]]}">${POTIONS[packed[i]].heal ? '❤' : '✦'}</div>` : '<div>+</div>').join('')}</div>
    <div class="d-shelf">${Object.entries(POTIONS).map(([k, pt]) => `<div class="d-pcard" style="--pc:${POTION_COL[k]}"><div class="d-pic">${pt.heal ? '❤' : '✦'}</div><b>${esc(pt.name)}</b>
      <span class="small muted">${pt.heal ? `Heals ${Math.round(pt.heal * 100)}%` : esc(pt.text)}</span><span class="small">You have <b>${dg.potions[k] || 0}</b></span>
      <div class="d-pbuy"><button class="d-price ${coins >= pt.price ? '' : 'no'}" data-action="d-potion-buy" data-id="${k}" data-n="1" ${coins >= pt.price ? '' : 'disabled'}>${coinImg()}${fmt(pt.price)}</button><button class="d-price ${coins >= pt.price * 5 ? '' : 'no'}" data-action="d-potion-buy" data-id="${k}" data-n="5" ${coins >= pt.price * 5 ? '' : 'disabled'}>${coinImg()}${fmt(pt.price * 5)} ×5</button></div></div>`).join('')}</div>`;
}

// ---------- in-game question windows ----------
function replayWindow(f) {
  const dg = d();
  const climb = Math.min(50, dg.climb);
  const boss = floorInSection(f) === 10;
  api.openModal(`<div class="q-win">
      <div class="q-ico"><img src="${boss ? enemyIcon(SECTIONS[sectionOf(f) - 1].boss, 3) : chestIcon(`${sectionOf(f)}w`, { scale: 4 })}" alt=""></div>
      <h2>Replay floor ${f}?</h2>
      <p>You've already cleared this floor. Replaying it is a good way to farm <b>coins, gear, materials and another chest</b>.</p>
      <p class="q-note">Note: replaying won't move you up the tower, and if you're defeated here you won't fall. Your climb stays at <b>floor ${climb}</b>. To keep climbing, take on floor ${climb}.</p>
    </div>
    <div class="btn-col">
      <button class="btn primary" data-action="d-floor-go" data-floor="${f}">Replay floor ${f}</button>
      ${canPlay(dg, climb) && climb !== f ? `<button class="btn" data-action="d-floor-go" data-floor="${climb}">Climb floor ${climb} instead</button>` : ''}
      <button class="btn" data-action="close">Cancel</button>
    </div>`);
}
function fleeWindow() {
  api.openModal(`<div class="q-win">
      <h2>Flee this floor?</h2>
      <p>You keep everything you've found so far, but the floor <b>won't count as cleared</b> and you won't get its chest.</p>
    </div>
    <div class="btn-col">
      <button class="btn danger-btn" data-action="d-flee-go">Flee</button>
      <button class="btn primary" data-action="close">Keep fighting</button>
    </div>`);
}

// ---------- opening a chest ----------
function openChest(key) {
  const dg = d();
  if (!(dg.chests?.[key] > 0)) { api.closeModal(); return; }
  dg.chests[key]--;
  const r = rollChest(key);
  S().coins += r.coins;
  for (const id of r.items) { dg.inv[id] = (dg.inv[id] || 0) + 1; dg.seen[id] = true; }
  const mat = materialFor(Number(key[0]));
  if (r.mats) dg.materials[mat] = (dg.materials[mat] || 0) + r.mats;
  if (r.potion) dg.potions[r.potion] = (dg.potions[r.potion] || 0) + 1;
  api.persist();
  // the reel: random rewards whizz past, then it lands on what you actually got
  const coinIc = uiIcon('coin', 'color', 3);
  const got = [
    `<div class="ch-cell coin"><img src="${coinIc}" alt=""><b>${fmt(r.coins)}</b></div>`,
    ...r.items.map((id) => `<div class="ch-cell r-${DITEMS[id].rarity}-bg"><img src="${gearIcon(id, 3)}" alt=""><b class="r-${DITEMS[id].rarity}">${esc(DITEMS[id].name)}</b></div>`),
    ...(r.mats ? [`<div class="ch-cell"><img src="${uiIcon('gem', 'color', 3)}" alt=""><b>${r.mats} ${esc(MATERIALS[mat].name)}</b></div>`] : []),
    ...(r.potion ? [`<div class="ch-cell"><span class="ch-pot">❤</span><b>${esc(POTIONS[r.potion].name)}</b></div>`] : []),
  ];
  const pool = DITEMS_BY_SECTION_UI(Number(key[0]));
  // CS:GO-style reel: ~50 random rewards, the real one sits at LAND, and the strip glides there over a few seconds
  const LAND = 44, AFTER = 6;
  const cellFor = () => { const id = pool[Math.floor(Math.random() * pool.length)]; return Math.random() < 0.3 ? `<div class="ch-cell coin"><img src="${coinIc}" alt=""></div>` : `<div class="ch-cell r-${DITEMS[id].rarity}-bg"><img src="${gearIcon(id, 3)}" alt=""></div>`; };
  const strip = [...Array.from({ length: LAND }, cellFor), got[r.items.length ? 1 : 0].replace('ch-cell', 'ch-cell win'), ...Array.from({ length: AFTER }, cellFor)];
  const best = r.items.length ? DITEMS[r.items[0]].rarity : 'common';
  const left = dg.chests[key];
  const tier = chestInfo(key).tier;
  api.openModal(`<div class="ch-open tier-${tier}">
      <h2 style="color:${CHEST_TIERS[tier].colour}">${esc(chestName(key))}</h2>
      <div class="ch-stage"><img class="ch-closed" src="${chestIcon(key, { scale: 6 })}" alt=""><img class="ch-opened" src="${chestIcon(key, { open: true, scale: 6 })}" alt=""><i class="ch-burst"></i></div>
      <div class="ch-reel"><div class="ch-strip">${strip.join('')}</div><i class="ch-pointer"></i></div>
      <div class="ch-got">${got.join('')}</div>
    </div>
    <div class="btn-col ch-btns">${left > 0 ? `<button class="btn primary" data-action="d-chest" data-key="${key}">Open another (${left} left)</button>` : ''}<button class="btn" data-action="close">Done</button></div>`);
  const root = document.getElementById('modal-root');
  const box = root.querySelector('.ch-open'), stripEl = root.querySelector('.ch-strip'), reel = root.querySelector('.ch-reel');
  box.classList.add('go');
  const openDelay = tier === 'a' ? 1300 : 900;
  setTimeout(() => {
    if (!stripEl.isConnected) return;
    const win = stripEl.querySelector('.win');
    const cellW = win.offsetWidth + 6;
    // stop somewhere inside the winning cell, not always dead centre
    const end = -(win.offsetLeft - reel.clientWidth / 2 + win.offsetWidth / 2 + (Math.random() - 0.5) * win.offsetWidth * 0.7);
    const dur = tier === 'a' ? 5200 : 4300;
    const anim = stripEl.animate([{ transform: 'translateX(0px)' }, { transform: `translateX(${end}px)` }], { duration: dur, easing: 'cubic-bezier(0.08, 0.6, 0.12, 1)', fill: 'forwards' });
    // a tick each time a new item passes the line
    let lastIdx = -1;
    const tick = () => {
      if (!stripEl.isConnected || anim.playState === 'finished') return;
      const x = new DOMMatrixReadOnly(getComputedStyle(stripEl).transform).m41;
      const idx = Math.floor((reel.clientWidth / 2 - x - 6) / cellW);
      if (idx !== lastIdx) { lastIdx = idx; api.sfx.tick?.(); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    anim.finished.then(() => {
      if (!box.isConnected) return;
      win.classList.add('landed');
      box.classList.add('done');
      api.sfx.dropSound(['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(best));
      if (['epic', 'legendary'].includes(best) || tier === 'g' || tier === 'a') api.confetti({ count: tier === 'a' ? 220 : 90, duration: tier === 'a' ? 2600 : 1600 });
      if (tier === 'a') api.flash?.('#b48cff88');
    });
  }, openDelay);
  api.render();
}
const DITEMS_BY_SECTION_UI = (sec) => Object.values(DITEMS).filter((i) => i.section === sec && !i.shopOnly && !i.grindDrop).map((i) => i.id);

// ---------- item sheet: compare with what you wear ----------
function showItem(id) {
  const dg = d();
  const it = DITEMS[id];
  const owned = dg.inv[id] > 0;
  const eq = isWorn(dg, id);
  const plus = dg.upgrades[id] || 0;
  const cur = dg.equipped[it.slot];
  const p = buildPlayer(dg);
  const a = itemStats(id, plus), b = cur && !eq ? itemStats(cur, dg.upgrades[cur] || 0) : null;
  const row = (k, lab, pct) => {
    const x = a[k] || 0, y = b ? b[k] || 0 : null;
    if (!x && !y) return '';
    const f = (v) => (pct ? `${Math.round(v * 100)}%` : fmt(v));
    const dlt = y === null ? '' : x - y;
    return `<tr><td>${lab}</td><td>${f(x)}</td>${b ? `<td class="${dlt > 0 ? 'd-good' : dlt < 0 ? 'd-red' : 'muted'}">${dlt === 0 ? '–' : `${dlt > 0 ? '▲' : '▼'} ${f(Math.abs(dlt))}`}</td>` : ''}</tr>`;
  };
  const powDelta = eq ? 0 : powerScore(buildPlayer(dg, { equipped: { ...dg.equipped, [it.slot]: id } })) - powerScore(p);
  const passive = passiveText(it);
  const moves = it.slot === 'weapon' ? weaponMoves(id, dg.equipped.offhand) : null;
  const inStock = blacksmithStock(dg).some((i) => i.id === id);
  api.openModal(`<div class="d-sheet">
      <div class="d-sheet-top"><div class="d-sheet-art r-${it.rarity}-bg">${artCanvas(id)}</div>
        <div><h2>${itemName(id)}</h2>${rarTag(it.rarity)} <span class="small muted">${SLOT_NAME_D[it.slot]}${it.weaponType ? ` · ${esc(it.weaponType)}` : ''} · ${it.section ? esc(SECTIONS[it.section - 1].name) : 'Starter kit'}</span>
        <div class="small" style="margin-top:4px">${eq ? '<span class="d-gold">WEARING</span>' : `Power <b class="${powDelta > 0 ? 'd-good' : powDelta < 0 ? 'd-red' : ''}">${powDelta > 0 ? '+' : ''}${fmt(powDelta)}</b>`}</div></div>
      </div>
      <table class="d-cmp">${b ? `<tr class="muted small"><td>vs ${esc(DITEMS[cur].name)}</td><td>this</td><td>change</td></tr>` : ''}${row('atk', 'Attack')}${row('def', 'Defence')}${row('hp', 'Health')}${row('crit', 'Crit', true)}${row('dodge', 'Dodge', true)}</table>
      ${it.grindDrop ? `<p class="small d-gold">Ultra-rare: 1 in ${fmt(Math.round(1 / it.grindDrop))} kills from ${esc(SECTIONS[it.section - 1].name)} enemies, or a lucky boss drop.</p>` : ''}
      ${passive.length ? `<p class="boost small">${passive.map(esc).join('<br>')}</p>` : ''}
      ${it.set ? `<p class="small muted">Part of the ${esc(SETS[it.set].name)} set (4 pieces: ${esc(SETS[it.set].text)})</p>` : ''}
      ${moves ? `<ul class="d-moves left">${moves.map((mv) => `<li><b>${esc(mv.name)}</b>${mv.sig ? ' <span class="new">SIGNATURE</span>' : ''}<br><span class="small muted">${moveText(mv, { ...p, dtype: it.dtype || p.dtype })}</span></li>`).join('')}</ul>` : ''}
      ${owned ? `<p class="small muted">Owned ×${dg.inv[id]} · sells for ${fmt(sellPrice(id))} coins · ${plus < MAX_PLUS ? `+${plus} of +${MAX_PLUS}` : 'fully upgraded'}</p>` : ''}
    </div>
    <div class="btn-col">
      ${owned ? `<button class="btn primary" data-action="d-best" data-slot="${it.slot}">Equip best ${SLOT_NAME_D[it.slot].toLowerCase()}</button>
      <div class="d-sheet-acts"><button class="btn" data-action="d-equip" data-id="${id}">${eq ? 'Unequip' : 'Equip'}</button><button class="btn" data-action="d-to-forge" data-id="${id}">Upgrade</button>${(dg.inv[id] || 0) > (eq ? 1 : 0) ? `<button class="btn" data-action="d-sell" data-id="${id}">Sell</button>` : ''}</div>`
        : inStock ? `<button class="btn primary" data-action="d-buy" data-id="${id}" ${S().coins >= buyPrice(id) ? '' : 'disabled'}>Buy for ${coinImg()}${fmt(buyPrice(id))}</button>` : ''}
      <button class="btn" data-action="close">Close</button>
    </div>`);
  setTimeout(mountArt, 0);
}

function sparks() {
  const an = document.getElementById('d-anvil');
  if (!an) return;
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('i'); s.className = 'd-spark';
    s.style.setProperty('--dx', `${Math.random() * 180 - 90}px`); s.style.setProperty('--dy', `${Math.random() * -120 - 10}px`);
    an.appendChild(s); setTimeout(() => s.remove(), 800);
  }
  an.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(3px)' }, { transform: 'translateY(0)' }], { duration: 160 });
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
  battle = { b, target: b.enemies[0].uid, busy: false, log: [], stops: [], potionPick: false, deal: true };
  api.music?.setMood('battle');
  const intro = b.enemies.length > 1 ? `${b.enemies.length} enemies appear!` : `${b.enemies[0].name} appears!`;
  battle.log.push(b.isBoss ? `The ${b.enemies[0].name} blocks your path!` : intro);
  renderBattle(true);
  if (b.isBoss && run.idx === 0) bossIntro(b.enemies[0].name, run.floor);
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
  battle.hero ||= api.avatarUrl(4);
  const statuses = statusChips;
  const foes = b.enemies.map((e) => `<button class="d-enemy fo-foe ${shownHp(e) <= 0 ? 'dead' : ''} ${e.uid === battle.target ? 'targeted' : ''} ${e.boss ? 'boss' : ''} ${e.charging ? 'tele' : ''}" data-action="d-target" data-uid="${e.uid}" data-e="${e.uid}">
      <span class="fo-mark">▼</span>${e.charging ? '<span class="fo-bang">!</span><span class="fo-warn"></span>' : ''}
      <canvas class="d-enemy-cv" data-ecv="${e.uid}"></canvas><span class="fo-shadow"></span>
    </button>`).join('');
  const rows = b.enemies.map((e) => `<div class="fo-erow ${shownHp(e) <= 0 ? 'dead' : ''} ${e.uid === battle.target ? 'targeted' : ''}" data-ehp="${e.uid}">
      <div class="fo-ename">${foeName(e)}</div>
      <div class="d-hpbar"><span style="width:${(shownHp(e) / e.maxHp * 100).toFixed(1)}%"></span></div>
      <div class="fo-erow-sub"><span class="d-hptext">${fmt(shownHp(e))} / ${fmt(e.maxHp)}</span><span class="d-sts">${statuses(e)}</span></div>
    </div>`).join('');
  const acts = getActions(b);
  const potLeft = POTIONS_PER_FIGHT - b.potionsUsed;
  let hand;
  if (battle.potionPick) {
    const pots = acts.filter((x) => x.kind === 'potion');
    hand = `<div class="d-acts">${pots.map((x) => `<button class="btn d-act" data-action="d-act" data-kind="potion" data-id="${x.id}" ${x.available && !battle.busy ? '' : 'disabled'}><b>${esc(POTIONS[x.id].name)}</b><span class="small">×${x.count}</span></button>`).join('') || '<p class="muted small">No potions. Buy some in the Camp.</p>'}
      <button class="btn d-act" data-action="d-potions" data-open="0">Back to your cards</button></div>`;
  } else {
    const cards = acts.filter((x) => x.kind === 'move' || x.kind === 'block');
    const n = cards.length, weaponArt = d().equipped.weapon ? gearIcon(d().equipped.weapon, 3) : null;
    hand = `<div class="tc-hand" style="--ov:${n > 4 ? 30 : 14}px"><span class="tc-deck"></span>${cards.map((x, i) => {
      const mv = x.move || { name: 'Block', power: 0 };
      const util = x.kind === 'block' || !(mv.power > 0);
      const type = util ? 'utility' : moveType(p, mv);
      const eff = target && !util ? typeMult(type, target) : 1;
      const off = !x.available || battle.busy;
      const tilt = i - (n - 1) / 2;
      const pending = battle.drawSlot === i && battle.busy;
      const art = util ? typeIcon('utility', 'tc-big') : weaponArt ? `<img src="${weaponArt}" alt="">` : typeIcon(type, 'tc-big');
      const text = x.kind === 'block' ? 'Shield block' : util ? (mv.parry ? 'Block, then counter' : mv.ward ? 'Magic shield' : mv.cleanse ? 'Cleanse and heal' : mv.brace ? 'Brace for the hit' : 'Defend') : `${TYPE_NAME[type] || ''}${mv.aoe ? ' · hits all' : ''}${mv.bleed ? ' · bleed' : ''}${mv.burn ? ' · burn' : ''}${mv.poison ? ' · poison' : ''}${mv.stun ? ' · stun' : ''}${mv.freeze ? ' · freeze' : ''}`;
      const pips = x.chargesLeft !== null && x.chargesLeft !== undefined ? `<span class="tc-uses">${Array.from({ length: mv.charges }, (_, k) => `<i class="${k < x.chargesLeft ? 'on' : ''}"></i>`).join('')}</span>` : '';
      const hint = util && b.enemies.some((e) => e.charging && e.hp > 0) && !off ? 'hint' : '';
      return `<button class="tc-card ${mv.sig ? 'sig' : ''} ${off ? 'off' : ''} ${pending ? 'pending' : ''} ${hint}" style="--tc:${TYPE_COLOR[type] || '#c8ccd8'};--r:${(tilt * 6).toFixed(1)}deg;--y:${(Math.abs(tilt) * 6).toFixed(1)}px" data-action="${off ? '' : 'd-card'}" data-slot="${i}" data-kind="${x.kind}" data-idx="${x.idx ?? -1}" title="${esc(x.kind === 'block' ? 'Block with your shield' : moveText(mv, p))}">
        <span class="tc-face"></span><span class="tc-art">${art}</span><span class="tc-ribbon">${esc(x.label || mv.name)}</span><span class="tc-txt">${esc(text)}</span>${pips}
        <span class="tc-seal">${util ? 'DEF' : Math.round(mv.power * (mv.hits || 1) * 100) + '%'}</span>
        ${eff > 1 ? '<span class="tc-tag good">STRONG</span>' : eff < 1 ? '<span class="tc-tag bad">WEAK</span>' : ''}${hint ? '<span class="tc-tag hint">BLOCK IT!</span>' : ''}</button>`;
    }).join('')}</div>
    <div class="tc-under">${acts[0]?.firing ? '' : `<button class="btn tc-pot" data-action="d-potions" data-open="1" ${battle.busy || potLeft <= 0 ? 'disabled' : ''}>❤ Potions · ${potLeft} left</button>`}<span class="tc-hint">Tap a card, then tap again to play it</span></div>`;
  }
  root.className = 'open fo';
  root.innerHTML = `<div class="d-bg sec-${sec.id}"></div>
    <div class="d-top"><span>Floor ${run.floor} · ${esc(sec.name)}</span><span>Fight ${run.idx + 1}/${run.plan.length}</span><button class="d-flee" data-action="d-flee">Flee</button></div>
    <div class="fo-stage">
      <div class="fo-plates">${rows}</div>
      <div class="fo-plat fo-plat-foe"></div>
      <div class="fo-foes n${Math.min(4, b.enemies.length)}">${foes}</div>
      <div class="fo-plat fo-plat-me"></div>
      <div class="fo-hero"><img src="${battle.hero}" alt=""></div>
    </div>
    <div class="d-player fo-ui">
      <div class="fo-me"><div class="fo-me-top"><b>${esc(S().name)}</b><span class="d-sts">${statuses(p)}${p.ward > 0 ? '<span class="d-st st-ward">ward</span>' : ''}${p.parry ? '<span class="d-st st-ward">parry</span>' : ''}</span></div>
        <div class="d-hpbar me"><span style="width:${(shownHp(p) / p.maxHp * 100).toFixed(1)}%"></span></div><div class="d-hptext">${fmt(shownHp(p))} / ${fmt(p.maxHp)}</div></div>
      <div class="d-log fo-text">${battle.log.slice(-2).map((l) => `<div>${esc(l)}</div>`).join('')}</div>
      ${hand}
    </div>
    <div class="fo-flash"></div><div class="fo-vig"></div>`;
  battle.stops.forEach((st) => st()); battle.stops = [];
  for (const e of b.enemies) {
    const cv = root.querySelector(`[data-ecv="${e.uid}"]`);
    if (cv && e.hp > 0) battle.stops.push(mountEnemy(cv, e, e.boss ? 6 : 4));
  }
  if (full) root.scrollTop = 0;
  if (battle.deal && !battle.potionPick) {
    // deal the hand: cards fly out of the deck one after another and flip face up
    battle.deal = false;
    const deck = root.querySelector('.tc-deck');
    const cards = [...root.querySelectorAll('.tc-card')];
    if (deck && cards.length) {
      battle.cardLock = true;
      const dr = deck.getBoundingClientRect();
      cards.forEach((card, i) => {
        const cr = card.getBoundingClientRect();
        card.style.setProperty('--dx', `${dr.left + dr.width / 2 - (cr.left + cr.width / 2)}px`);
        card.style.setProperty('--dy', `${dr.top + dr.height / 2 - (cr.top + cr.height / 2)}px`);
        card.style.animationDelay = `${0.25 + i * 0.13}s`;
        card.classList.add('draw', 'dealing');
        setTimeout(() => api.sfx.tick?.(), 250 + i * 130);
      });
      setTimeout(() => { cards.forEach((c) => { c.classList.remove('draw', 'dealing'); c.style.animationDelay = ''; }); if (battle) battle.cardLock = false; }, 250 + cards.length * 130 + 520);
    }
  }
  if (battle.drawSlot !== undefined && !battle.busy) {
    const slot = battle.drawSlot; battle.drawSlot = undefined;
    const card = root.querySelector(`.tc-card[data-slot="${slot}"]`), deck = root.querySelector('.tc-deck');
    if (card && deck) {
      const cr = card.getBoundingClientRect(), dr = deck.getBoundingClientRect();
      card.style.setProperty('--dx', `${dr.left + dr.width / 2 - (cr.left + cr.width / 2)}px`);
      card.style.setProperty('--dy', `${dr.top + dr.height / 2 - (cr.top + cr.height / 2)}px`);
      card.classList.add('draw');
      setTimeout(() => card.classList.remove('draw'), 520);
    }
  }
}
const TYPE_COLOR = { slashing: '#c8ccd8', piercing: '#d8c890', blunt: '#b8a088', fire: '#ff7a2a', frost: '#7ad0ff', lightning: '#ffe04a', holy: '#fff0a0', poison: '#8ae05a', bleed: '#e8435a', utility: '#6ab0ff' };
const TYPE_SVG = {
  slashing: '<path d="M4 20 19 5l1 1L5 21z" fill="#fff"/><path d="M15 4h5v5" stroke="#fff" stroke-width="2" fill="none"/>',
  piercing: '<path d="M3 21 17 7l-2-2h6v6l-2-2L5 23z" fill="#fff"/>',
  blunt: '<path d="M4 4h10v6H4z" fill="#fff"/><path d="M8 10h2v12H8z" fill="#fff"/>',
  fire: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 0 3 1 4 2 4 0-4-1-6 1-9z" fill="#fff"/>',
  frost: '<path d="M11 2h2v20h-2zM2 11h20v2H2zM4.9 6.3l1.4-1.4 12.8 12.8-1.4 1.4zM17.7 4.9l1.4 1.4L6.3 19.1l-1.4-1.4z" fill="#fff"/>',
  lightning: '<path d="M13 2 4 14h6l-2 8 9-12h-6z" fill="#fff"/>',
  holy: '<circle cx="12" cy="12" r="5" fill="#fff"/><path d="M11 1h2v5h-2zM11 18h2v5h-2zM1 11h5v2H1zM18 11h5v2h-5z" fill="#fff"/>',
  poison: '<path d="M12 3c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12z" fill="#fff"/><circle cx="10" cy="15" r="1.5" fill="#3a6a1a"/><circle cx="14" cy="16" r="1.2" fill="#3a6a1a"/>',
  bleed: '<path d="M12 3c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12z" fill="#fff"/>',
  utility: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="#fff"/>',
};
const typeIcon = (t, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24">${TYPE_SVG[t] || TYPE_SVG.slashing}</svg>`;
const foeName = (e) => `${esc(e.name)}${e.boss && e.phase === 2 ? ' <span class="d-red">ENRAGED</span>' : ''}${e.charging ? ` <span class="fo-telename">⚠ ${esc(e.charging.name)}</span>` : ''}`;

// ---------- battle effects ----------
const replay = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
function fxBits(host, colour, count) {
  const root = battleRoot();
  const a = host.getBoundingClientRect(), r = root.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const bit = document.createElement('i'); bit.className = 'fo-bit';
    bit.style.left = `${a.left - r.left + a.width / 2}px`; bit.style.top = `${a.top - r.top + a.height / 2}px`; bit.style.background = colour;
    bit.style.setProperty('--dx', `${Math.random() * 160 - 80}px`); bit.style.setProperty('--dy', `${Math.random() * 140 - 100}px`);
    root.appendChild(bit); setTimeout(() => bit.remove(), 850);
  }
}
function fxSlash(host) {
  const s = document.createElement('i'); s.className = 'fo-slash';
  host.appendChild(s); setTimeout(() => s.remove(), 320);
}
function bossIntro(name, floor) {
  const root = battleRoot();
  root.insertAdjacentHTML('beforeend', `<div class="fo-bar top"></div><div class="fo-bar bot"></div><div class="fo-bossname"><small>FLOOR ${floor} · BOSS</small>${esc(name)}</div>`);
  requestAnimationFrame(() => root.querySelectorAll('.fo-bar').forEach((x) => x.classList.add('on')));
  api.shake(root, true); api.sfx.dropSound(5);
  setTimeout(() => root.querySelectorAll('.fo-bar').forEach((x) => x.classList.remove('on')), 2100);
  setTimeout(() => root.querySelectorAll('.fo-bar, .fo-bossname').forEach((x) => x.remove()), 2600);
}

// Floating damage / heal numbers over a fighter.
function popNumber(ev) {
  const root = battleRoot();
  const host = ev.who === 'player' ? root.querySelector('.fo-hero') : root.querySelector(`[data-e="${ev.uid}"]`);
  if (!host) return;
  const n = document.createElement('div');
  n.className = `d-pop ${ev.t === 'heal' ? 'heal' : ev.crit ? 'crit' : ''} ${ev.status ? `st-${ev.status}` : ''} ${ev.eff > 1 ? 'eff' : ''} ${ev.who === 'player' && ev.t === 'dmg' ? 'me' : ''}`;
  n.innerHTML = ev.t === 'heal' ? `+${fmt(ev.amount)}` : `${fmt(ev.amount)}${ev.eff > 1 ? '<small>super effective!</small>' : ev.eff < 1 ? '<small>resisted</small>' : ''}`;
  host.appendChild(n);
  setTimeout(() => n.remove(), 1000);
  if (ev.t !== 'dmg') return;
  replay(host, 'hit');
  if (!ev.status) {
    if (ev.who === 'enemy') { replay(root.querySelector('.fo-hero'), 'lunge'); fxSlash(host); }
    else {
      const att = root.querySelector(`[data-e="${ev.fromUid}"]`);
      replay(att, 'lunge');
      replay(root.querySelector('.fo-vig'), 'go');
      if (ev.amount > b0().player.maxHp * 0.2) api.vibrate(60);
      api.shake(root);
    }
    if (ev.crit) { replay(root.querySelector('.fo-flash'), 'go'); api.shake(root, true); fxBits(host, '#ffd84a', 14); }
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
    if (ev.t === 'death' && ev.who === 'enemy') {
      const el = battleRoot().querySelector(`[data-e="${ev.uid}"]`);
      const foe = battle.b.enemies.find((x) => x.uid === ev.uid);
      if (el) { el.classList.add('dying'); setTimeout(() => fxBits(el, foe?.boss ? BOSS_AURA[foe.id] : '#e6dcc4', foe?.boss ? 40 : 22), 250); }
      wait = 700;
    }
    if (wait) { updateBars(); setTimeout(step, wait); } else step();
  };
  step();
}
function updateBars() {
  const root = battleRoot();
  const b = battle.b;
  for (const e of b.enemies) {
    const row = root.querySelector(`[data-ehp="${e.uid}"]`), sp = root.querySelector(`[data-e="${e.uid}"]`);
    if (!row || !sp) { renderBattle(); return; }            // a summoned enemy appeared
    const hp = shownHp(e);
    row.querySelector('.d-hpbar span').style.width = `${(hp / e.maxHp * 100).toFixed(1)}%`;
    row.querySelector('.d-hptext').textContent = `${fmt(hp)} / ${fmt(e.maxHp)}`;
    row.classList.toggle('dead', hp <= 0);
    row.querySelector('.d-sts').innerHTML = statusChips(e);
    row.querySelector('.fo-ename').innerHTML = foeName(e);
    sp.classList.toggle('tele', !!e.charging);
    if (e.charging && !sp.querySelector('.fo-bang')) sp.insertAdjacentHTML('afterbegin', '<span class="fo-bang">!</span><span class="fo-warn"></span>');
    if (!e.charging) sp.querySelectorAll('.fo-bang, .fo-warn').forEach((x) => x.remove());
  }
  const p = b.player;
  const pe = root.querySelector('.d-player');
  pe.querySelector('.d-hpbar span').style.width = `${(shownHp(p) / p.maxHp * 100).toFixed(1)}%`;
  pe.querySelector('.d-hptext').textContent = `${fmt(shownHp(p))} / ${fmt(p.maxHp)}`;
  root.querySelector('.d-log').innerHTML = battle.log.slice(-2).map((l) => `<div>${esc(l)}</div>`).join('');
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
    dg.chests ||= {};
    run.chest = chestKey(run.floor);
    dg.chests[run.chest] = (dg.chests[run.chest] || 0) + 1;
    dg.cleared[run.floor] = true;
    if (floorInSection(run.floor) === 10) dg.bossKills[k] = (dg.bossKills[k] || 0) + 1;
    if (run.floor === dg.climb) dg.climb = Math.min(50, run.floor + 1);
    dg.highest = Math.max(dg.highest, dg.climb);
  } else if (!fled) {
    dg.deaths++;
    // fall back to the start of the section you're climbing (not when farming an earlier section)
    // fall back to the start of the section only when dying on a floor you have not beaten yet
    if (!dg.cleared[run.floor] && sectionOf(run.floor) === sectionOf(dg.climb)) dg.climb = sectionStart(run.floor);
  }
  return { first, mat };
}

function finishRun(won) {
  const fellFrom = run.floor;
  const wasCleared = !!d().cleared[fellFrom];
  const fallTo = !won && !wasCleared && sectionOf(fellFrom) === sectionOf(d().climb) ? sectionStart(fellFrom) : null;
  const { first, mat } = grantRewards(won);
  const dg = d();
  api.persist();
  const levelNow = cryptsLevel(dg.xp);
  const drops = run.drops.slice().sort((a, b) => ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'].indexOf(DITEMS[a].rarity) - ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'].indexOf(DITEMS[b].rarity));
  const root = battleRoot();
  root.className = 'open';
  const dropHtml = drops.map((id, i) => `<div class="drop rar-${DITEMS[id].rarity}" style="animation-delay:${300 + i * (['epic', 'legendary', 'mythic', 'divine'].includes(DITEMS[id].rarity) ? 600 : 160)}ms">${gearImg(id)}<div class="drop-text"><div>${esc(DITEMS[id].name)}</div><div>${rarTag(DITEMS[id].rarity)}</div></div></div>`).join('');
  const summary = `<div class="d-gains"><div><b>+${fmt(run.xp)}</b><span>Crypts XP</span></div><div><b class="coin">+${fmt(run.coins)}</b><span>coins</span></div><div><b>${run.mats}</b><span>${esc(MATERIALS[mat].name)}</span></div></div>
    ${levelNow > run.startLevel ? `<div class="banner levelup">CRYPTS LEVEL ${levelNow}!${SECTIONS.find((s) => s.crypts === levelNow) ? `<span>${esc(SECTIONS.find((s) => s.crypts === levelNow).name)} unlocked!</span>` : ''}</div>` : ''}
    <h3>${drops.length ? 'Loot' : 'No gear dropped'}</h3><div class="drops">${dropHtml}</div>`;
  if (won) {
    const boss = floorInSection(fellFrom) === 10;
    root.innerHTML = `<div class="d-bg sec-${sectionOf(fellFrom)}"></div><div class="d-result">
      <h2>${boss ? `${esc(SECTIONS[sectionOf(fellFrom) - 1].name)} conquered!` : `Floor ${fellFrom} cleared!`}</h2>
      ${first ? '<p class="boost center">First clear bonus!</p>' : ''}
      ${run.chest ? `<div class="ch-earned tier-${chestInfo(run.chest).tier}"><img src="${chestIcon(run.chest, { scale: 4 })}" alt=""><div><b style="color:${CHEST_TIERS[chestInfo(run.chest).tier].colour}">+1 ${esc(chestName(run.chest))}</b><span class="small muted">Open it in Camp › Bag</span></div></div>` : ''}
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
      <p class="center">${to ? `You tumble down the tower to <b>floor ${to}</b>.` : wasCleared ? `You'd already beaten this floor, so you don't fall. Your climb stays at <b>floor ${Math.min(50, d().climb)}</b>.` : 'You crawl back to the tower entrance.'} You keep everything you found.</p>
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
  api.music?.setMood('calm');
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
    case 'd-camp': sub = 'camp'; campTab = el.dataset.tab; api.render(); window.scrollTo(0, 0); return true;
    case 'd-bagf': bagFilter = el.dataset.f; api.render(); return true;
    case 'd-bags': bagSec = Number(el.dataset.s); api.render(); return true;
    case 'd-shops': shopSec = Number(el.dataset.s); api.render(); return true;
    case 'd-forge-sel': forgeSel = el.dataset.id; api.render(); return true;
    case 'd-to-forge': forgeSel = el.dataset.id; sub = 'camp'; campTab = 'forge'; api.closeModal(); api.render(); window.scrollTo(0, 0); return true;
    case 'd-best': {
      const slot = el.dataset.slot, was = dg.equipped[slot], best = bestForSlot(dg, slot);
      dg.equipped[slot] = best; api.persist(); api.closeModal(); api.render();
      api.toast(best === was ? `You're already wearing your best ${SLOT_NAME_D[slot].toLowerCase()}` : `Equipped ${DITEMS[best].name}`);
      return true;
    }
    case 'd-best-all': {
      el.textContent = 'Thinking…'; el.disabled = true;
      setTimeout(() => {
        const before = { ...dg.equipped };
        dg.equipped = bestGear(dg);
        const changed = GEAR_SLOTS_D.filter((k) => before[k] !== dg.equipped[k] && dg.equipped[k]).map((k) => DITEMS[dg.equipped[k]].name);
        api.persist(); api.render();
        api.toast(changed.length ? `Swapped in: ${changed.join(', ')}` : 'Already wearing your best gear');
      }, 30);
      return true;
    }
    case 'd-floor': {
      const f = Number(el.dataset.floor);
      closeBattle();
      if (f !== dg.climb && dg.cleared[f]) { replayWindow(f); return true; }
      startRun(f); return true;
    }
    case 'd-floor-go': api.closeModal(); closeBattle(); startRun(Number(el.dataset.floor)); return true;
    case 'd-target': if (battle && !battle.busy) { const uid = Number(el.dataset.uid); if (battle.b.enemies.find((e) => e.uid === uid && e.hp > 0)) { battle.target = uid; renderBattle(); } } return true;
    case 'd-card': {
      if (!battle || battle.busy || battle.cardLock) return true;
      const root = battleRoot();
      if (!el.classList.contains('lift')) { root.querySelectorAll('.tc-card').forEach((c) => c.classList.toggle('lift', c === el)); return true; }
      battle.cardLock = true;
      el.classList.remove('lift'); el.classList.add('play');
      const slot = Number(el.dataset.slot), kind = el.dataset.kind, idx = Number(el.dataset.idx);
      setTimeout(() => {
        battle.cardLock = false;
        if (!battle) return;
        battle.drawSlot = slot;
        if (kind === 'block') { act({ kind: 'block' }); return; }
        const acts = getActions(battle.b);
        const chosen = idx < 0 ? acts[0] : acts.find((x) => x.kind === 'move' && x.idx === idx);
        if (chosen) act({ kind: 'move', move: chosen.move });
      }, 300);
      return true;
    }
    case 'd-chest': openChest(el.dataset.key); return true;
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
      fleeWindow(); return true;
    }
    case 'd-flee-go': {
      api.closeModal();
      if (!battle || battle.busy) return true;
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
      if (document.getElementById('modal-root')?.classList.contains('open')) showItem(id);   // now you can equip it
      return true;
    }
    case 'd-upgrade': {
      const id = el.dataset.id; const plus = dg.upgrades[id] || 0; const c = upgradeCost(id, plus);
      if (plus >= MAX_PLUS || S().coins < c.coins || (dg.materials[c.material] || 0) < c.count) return true;
      S().coins -= c.coins; dg.materials[c.material] -= c.count; dg.upgrades[id] = plus + 1;
      api.persist(); api.render(); api.sfx.chime(); api.toast(`${DITEMS[id].name} is now +${plus + 1}`);
      setTimeout(sparks, 0);
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
