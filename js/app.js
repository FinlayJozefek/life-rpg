import { SKILLS, SKILL, ITEM, ITEMS_BY_SKILL, RARITY, RARITIES, OUTFIT_XP_BOOST, PET_BOOST, BADGE_COUNT, COLLECTION_COMPLETE_XP_BOOST, GEAR_SLOTS, SLOT_LABEL } from './data.js';
import {
  load, save, newState, validateImport, levelProgress, previewLog, logActivity,
  boostsFor, pct, effectiveDropChance, sell, sellPrice, canSell, equip, isEquipped, totalLevel, discoveredCount, isCollectionComplete,
  MAX_LEVEL,
} from './game.js';
import { itemSprite } from './sprites.js';
import { mountAvatar, mountPet, outfitIcon, petIcon } from './sprites2.js';
import { startAutoUpdate } from './updates.js';
import { isInstalled, isIOS, inAppBrowser, installInstructions, promptInstall, onInstallChange, canPromptInstall } from './install.js';

let state = load();
let view = 'home';
let collectionSkill = SKILLS[0].id;
let logDraft = null; // { skill, hours, minutes }

const $main = document.getElementById('main');
const $modal = document.getElementById('modal-root');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString();
// Drop chances: 1 decimal above 1%, 2 below so 0.25% doesn't show as 0.3%.
const fmtChance = (p) => `${(p * 100).toFixed(p >= 0.01 ? 1 : p >= 0.001 ? 2 : 3)}%`;
let saveWarned = false;
const persist = () => {
  if (!save(state) && !saveWarned) {
    saveWarned = true;
    toast("Couldn't save — is private browsing on?");
  }
};

// Per-device UI preferences (not game progress).
const pref = {
  get(k) { try { return localStorage.getItem(`liferpg.pref.${k}`); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(`liferpg.pref.${k}`, v); } catch {} },
};
let installBannerHidden = pref.get('hideInstall') === '1';

function installBanner() {
  if (isInstalled() || installBannerHidden) return '';
  return `<section class="install-banner">
    <img src="icons/icon-192.png" alt="" width="44" height="44">
    <div class="install-text"><b>Get the app</b><br><span class="muted small">${inAppBrowser ? 'Open in your browser to install' : 'Add Life RPG to your home screen'}</span></div>
    <button class="btn primary" data-action="install">${canPromptInstall() ? 'Install' : 'How?'}</button>
    <button class="install-x" data-action="hide-install" aria-label="Hide">×</button>
  </section>`;
}

function welcome() {
  const suggestInstall = !isInstalled() && (isIOS || inAppBrowser || canPromptInstall());
  openModal(`
    <div class="welcome">
      <img class="welcome-icon" src="icons/icon-192.png" alt="" width="72" height="72">
      <h2>Welcome to Life RPG</h2>
      <p>Log real things you do. Earn XP, level up 12 skills and collect 288 items and pets.</p>
      ${suggestInstall ? `<div class="welcome-install">
        <p><b>Playing on your phone?</b> Install it first. Progress you make in the browser stays in the browser and won't move to the app.</p>
        <button class="btn wide" data-action="install">How to install</button>
      </div>` : ''}
      <label class="field">What's your character called?
        <input id="welcome-name" type="text" maxlength="24" autocomplete="off" autocapitalize="words" enterkeyhint="go" placeholder="Adventurer">
      </label>
      <button class="btn primary wide" data-action="start-game">Start adventure</button>
    </div>`, { cls: 'welcome-sheet', locked: true });
  document.getElementById('welcome-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.querySelector('[data-action=start-game]').click();
  });
}

function showInstall() {
  openModal(`${installInstructions()}
    <div class="btn-row"><button class="btn" data-action="${state.onboarded ? 'close' : 'back-to-welcome'}">${state.onboarded ? 'Close' : 'Back'}</button></div>`);
}

function fmtDuration(min) {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  if (!h) return `${m} min`;
  if (!m) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${h} hr${h > 1 ? 's' : ''} ${m} min`;
}

function timeAgo(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function rarityTag(r) {
  return `<span class="rtag r-${r}">${RARITY[r].name}</span>`;
}

function itemImg(id, { hidden = false, cls = '' } = {}) {
  const item = ITEM[id];
  const src = item.type === 'outfit' ? outfitIcon(id, { hidden })
    : item.type === 'pet' ? petIcon(id, { hidden })
    : itemSprite(id, { hidden });
  return `<img class="sprite ${cls} ${item.type !== 'collection' ? 'outfit-icon' : ''} ${hidden ? '' : 'glow-' + item.rarity}" src="${src}" alt="${hidden ? 'Unknown item' : esc(item.name)}">`;
}

const SLOT_EMPTY_ICON = { head: '🎩', body: '👕', feet: '👢', pet: '🐾' };

function itemEffect(item) {
  if (item.type === 'outfit') return `${SLOT_LABEL[item.slot]} · +${pct(OUTFIT_XP_BOOST[item.rarity])} ${SKILL[item.skill].name} XP when worn`;
  if (item.type === 'pet') {
    const p = PET_BOOST[item.rarity];
    const parts = [`+${pct(p.xp)} XP`];
    if (p.coins) parts.push(`+${pct(p.coins)} coins`);
    if (p.luck) parts.push(`+${pct(p.luck)} luck`);
    if (p.bonusRollChance === 1) parts.push('guaranteed bonus roll every log');
    else if (p.bonusRollChance) parts.push(`${pct(p.bonusRollChance)} chance of a bonus roll`);
    return `Pet · ${parts.join(', ')} to ${SKILL[item.skill].name}`;
  }
  return 'Collection item';
}

// ---------- Views ----------
function viewHome() {
  const totalDiscovered = SKILLS.reduce((n, s) => n + discoveredCount(state, s.id), 0);
  const slot = (type) => {
    const item = state.equipped[type] && ITEM[state.equipped[type]];
    return `
    <button class="slot" data-action="pick-slot" data-type="${type}">
      <div class="slot-icon">${item ? itemImg(item.id) : `<span class="slot-empty">${SLOT_EMPTY_ICON[type]}</span>`}</div>
      <div class="slot-text">
        <div class="slot-label">${SLOT_LABEL[type]}</div>
        <div class="slot-name">${item ? esc(item.name) : 'Empty'}</div>
        ${item ? `<div class="slot-sub">${rarityTag(item.rarity)} ${SKILL[item.skill].name}</div>` : '<div class="slot-sub muted">Tap to equip</div>'}
      </div>
    </button>`;
  };
  const recent = state.log.slice(0, 8).map((e) => {
    const n = Object.values(e.drops).reduce((a, b) => a + b, 0);
    return `<li><span class="li-icon">${SKILL[e.skill].icon}</span>
      <span class="li-main"><b>${SKILL[e.skill].name}</b> · ${fmtDuration(e.minutes)}<br>
      <span class="muted">+${fmt(e.xp)} XP · +${fmt(e.coins)} coins · ${n} drop${n === 1 ? '' : 's'}</span></span>
      <span class="li-time muted">${timeAgo(e.at)}</span></li>`;
  }).join('');
  return `
    ${installBanner()}
    <section class="hero panel">
      <div class="avatar-wrap">
        <canvas class="avatar" id="avatar-canvas" role="img" aria-label="Your character"></canvas>
        ${state.equipped.pet ? `<canvas class="avatar-pet detailed" id="pet-canvas" role="img" aria-label="${esc(ITEM[state.equipped.pet].name)}"></canvas>` : ''}
      </div>
      <button class="name" data-action="rename">${esc(state.name)} <span class="muted">✎</span></button>
      <div class="stats">
        <div><div class="stat-num">${totalLevel(state)}</div><div class="stat-label">Total level</div></div>
        <div><div class="stat-num coin">${fmt(state.coins)}</div><div class="stat-label">Coins</div></div>
        <div><div class="stat-num">${totalDiscovered}<span class="muted">/288</span></div><div class="stat-label">Items found</div></div>
      </div>
    </section>
    <section class="panel">
      <h2>Equipped</h2>
      <div class="slots">${GEAR_SLOTS.map(slot).join('')}</div>
      <p class="hint">Each piece only boosts its own skill, so wear a full matching set when you log. Anything else is just for looks.</p>
    </section>
    <section class="panel">
      <h2>Recent activity</h2>
      ${recent ? `<ul class="list">${recent}</ul>` : `<p class="muted">Nothing logged yet. Head to <a href="#" data-action="nav" data-view="skills">Skills</a> and log your first session.</p>`}
    </section>`;
}

function viewSkills() {
  return `<section class="panel"><h2>Skills</h2><ul class="skill-list">${SKILLS.map((s) => {
    const sk = state.skills[s.id];
    const p = levelProgress(sk.xp);
    const b = boostsFor(state, s.id);
    return `<li><button class="skill-row" data-action="open-log" data-skill="${s.id}">
      <span class="skill-icon">${s.icon}</span>
      <span class="skill-body">
        <span class="skill-top"><b>${s.name}</b><span class="lvl">Lv ${p.level}</span></span>
        <span class="bar"><span style="width:${(p.pct * 100).toFixed(1)}%"></span></span>
        <span class="skill-sub muted">${p.level >= MAX_LEVEL ? `MAX · ${fmt(sk.xp)} XP` : `${fmt(p.into)} / ${fmt(p.needed)} XP`} · 1 unit = ${fmtDuration(s.unit)}${b.xp ? ` · <span class="boost">+${pct(b.xp)}</span>` : ''}</span>
      </span>
    </button></li>`;
  }).join('')}</ul></section>`;
}

function viewCollection() {
  const sid = collectionSkill;
  const chips = SKILLS.map((s) => `<button class="chip ${s.id === sid ? 'on' : ''}" data-action="coll-skill" data-skill="${s.id}">${s.icon} ${s.name}${isCollectionComplete(state, s.id) ? ' ★' : ''}</button>`).join('');
  const groups = RARITIES.map((r) => {
    const items = ITEMS_BY_SKILL[sid].filter((i) => i.rarity === r.id);
    const tiles = items.map((i) => {
      const seen = state.everOwned[i.id];
      const n = state.items[i.id] || 0;
      const isEq = isEquipped(state, i.id);
      return `<button class="tile ${seen ? 'r-border-' + i.rarity : 'unknown'}" data-action="item" data-id="${i.id}" ${seen ? '' : 'disabled'}>
        ${itemImg(i.id, { hidden: !seen })}
        <span class="tile-name">${seen ? esc(i.name) : '???'}</span>
        ${seen && i.type !== 'pet' ? `<span class="count">x${fmt(n)}</span>` : ''}
        ${n >= BADGE_COUNT ? '<span class="badge" title="100+ owned">🏅</span>' : ''}
        ${isEq ? '<span class="eq">E</span>' : ''}
        ${i.type === 'pet' && seen ? '<span class="type-dot">🐾</span>' : ''}
      </button>`;
    }).join('');
    const droppable = items.find((i) => !(i.type === 'pet' && state.everOwned[i.id]));
    const chance = droppable ? `${fmtChance(effectiveDropChance(state, droppable.id))} each per roll` : 'pet owned';
    return `<h3 class="r-${r.id}">${r.name} <span class="muted">· ${chance}</span></h3><div class="grid">${tiles}</div>`;
  }).join('');
  const done = discoveredCount(state, sid);
  return `<section class="panel">
    <h2>Collection</h2>
    <div class="chip-scroller">
      <button class="chip-arrow left" data-action="chip-scroll" data-dir="-1" aria-label="Scroll skills left">‹</button>
      <div class="chips skill-chips">${chips}</div>
      <button class="chip-arrow right" data-action="chip-scroll" data-dir="1" aria-label="Scroll skills right">›</button>
    </div>
    <div class="coll-head"><b>${SKILL[sid].name}</b> · ${done}/24 found
      ${done === 24 ? `<span class="boost">Complete! +${pct(COLLECTION_COMPLETE_XP_BOOST)} XP</span>` : `<span class="muted">Find all 24 for +${pct(COLLECTION_COMPLETE_XP_BOOST)} ${SKILL[sid].name} XP</span>`}
    </div>
    ${groups}
  </section>`;
}

function viewSettings() {
  const installed = isInstalled();
  return `
    <section class="panel">
      <h2>App</h2>
      ${installed
        ? '<p>✓ Installed on this device. Your progress saves automatically after every action.</p>'
        : `<p>You're playing in the browser. Install Life RPG to get a home screen icon, full-screen play and offline support.</p>
           <button class="btn primary" data-action="install">${canPromptInstall() ? 'Install' : 'How to install'}</button>`}
    </section>
    <section class="panel">
      <h2>Backup &amp; restore</h2>
      <p>Your progress is saved on this device only. If you delete the app, clear browser data or change phones, it's gone, so save a backup now and then (e.g. to Files, iCloud Drive or a message to yourself).</p>
      <p class="muted small">Last backup: ${state.lastBackupAt ? new Date(state.lastBackupAt).toLocaleDateString() : 'never'}</p>
      <div class="btn-row">
        <button class="btn primary" data-action="backup">Save backup</button>
        <label class="btn">Restore from file<input type="file" accept="application/json,.json" id="restore-input" hidden></label>
      </div>
    </section>
    <section class="panel">
      <h2>How it works</h2>
      <ul class="rules">
        <li>Each skill has a unit length. Every unit = <b>100 XP</b>, <b>10 coins</b> and <b>one drop roll</b>.</li>
        <li>Partial units still give XP and coins. Leftover minutes carry over toward your next drop roll.</li>
        <li>Every item in a skill's table gets its own chance on each roll, so you can get several drops at once — but at most <b>2 of any one rarity per roll</b>.</li>
        <li>Pets drop once; after that they leave the table. Everything else stacks.</li>
        <li>Luck from pets boosts Rare drops and above.</li>
        <li>Max level is ${MAX_LEVEL} (100,000 XP).</li>
      </ul>
    </section>
    <section class="panel danger">
      <h2>Danger zone</h2>
      <button class="btn danger-btn" data-action="reset">Reset all progress</button>
    </section>
    <p class="muted center small">Life RPG v1 · solo edition</p>`;
}

const VIEWS = { home: viewHome, skills: viewSkills, collection: viewCollection, settings: viewSettings };

let stopAnimations = [];

function render() {
  stopAnimations.forEach((stop) => stop());
  stopAnimations = [];
  $main.innerHTML = VIEWS[view]();
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
  document.getElementById('coin-pill').textContent = fmt(state.coins);
  if (view === 'collection') setupChipScroller();
  if (view === 'home') mountCharacter();
}

// The animated character (and pet, if it has detailed art) on the home screen.
function mountCharacter() {
  const cv = document.getElementById('avatar-canvas');
  if (cv) stopAnimations.push(mountAvatar(cv, { head: state.equipped.head, body: state.equipped.body, feet: state.equipped.feet }, { scale: 6 }));
  const pv = document.getElementById('pet-canvas');
  if (pv) stopAnimations.push(mountPet(pv, state.equipped.pet, { scale: 4 }));
}

// The skill chip row re-renders on every tap, so restore its scroll position by
// centring the selected chip, and let mouse wheels scroll it sideways.
function setupChipScroller() {
  const row = document.querySelector('.skill-chips');
  if (!row) return;
  const on = row.querySelector('.chip.on');
  if (on) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2;
  const updateArrows = () => {
    const max = row.scrollWidth - row.clientWidth;
    row.parentElement.classList.toggle('at-start', row.scrollLeft <= 2);
    row.parentElement.classList.toggle('at-end', row.scrollLeft >= max - 2);
  };
  row.addEventListener('scroll', updateArrows, { passive: true });
  row.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { row.scrollLeft += e.deltaY; e.preventDefault(); }
  }, { passive: false });
  updateArrows();
}

// ---------- Modals ----------
function openModal(html, { cls = '', locked = false } = {}) {
  $modal.dataset.locked = locked ? '1' : '';
  const existing = $modal.classList.contains('open') && $modal.querySelector('.sheet');
  if (existing) {
    // A sheet is already showing: swap its contents in place so it doesn't
    // re-play the open animation (no flash when e.g. tapping +15m).
    const scroll = existing.scrollTop;
    const sameSheet = existing.dataset.cls === cls;
    existing.className = `sheet ${cls} no-anim`;
    existing.dataset.cls = cls;
    existing.innerHTML = html;
    if (sameSheet) existing.scrollTop = scroll;
    const backdrop = $modal.querySelector('.backdrop');
    if (locked) backdrop.removeAttribute('data-action'); else backdrop.dataset.action = 'close';
    return;
  }
  $modal.innerHTML = `<div class="backdrop" ${locked ? '' : 'data-action="close"'}></div><div class="sheet ${cls}" data-cls="${cls}" role="dialog" aria-modal="true">${html}</div>`;
  $modal.classList.add('open');
}
function closeModal() {
  $modal.classList.remove('open');
  $modal.innerHTML = '';
}

function renderLogSheet() {
  const s = SKILL[logDraft.skill];
  const minutes = (Number(logDraft.hours) || 0) * 60 + (Number(logDraft.minutes) || 0);
  const sk = state.skills[s.id];
  const p = levelProgress(sk.xp);
  const prev = minutes > 0 ? previewLog(state, s.id, minutes) : null;
  const b = boostsFor(state, s.id);
  openModal(`
    <div class="sheet-head"><span class="skill-icon big">${s.icon}</span><div><h2>${s.name}</h2>
      <div class="muted">Level ${p.level} · 1 unit = ${fmtDuration(s.unit)}${sk.carryMin ? ` · ${fmtDuration(sk.carryMin)} carried over` : ''}</div></div></div>
    <div class="time-inputs">
      <label>Hours<input type="number" inputmode="numeric" min="0" max="24" id="in-hours" value="${logDraft.hours}"></label>
      <label>Minutes<input type="number" inputmode="numeric" min="0" max="59" id="in-mins" value="${logDraft.minutes}"></label>
    </div>
    <div class="chips quick">
      ${[15, 30, 60, 120].map((m) => `<button class="chip" data-action="add-time" data-min="${m}">+${m < 60 ? m + 'm' : m / 60 + 'h'}</button>`).join('')}
      <button class="chip" data-action="add-time" data-min="${s.unit}">+1 unit</button>
      <button class="chip" data-action="clear-time">Clear</button>
    </div>
    <div class="preview">${prev ? `
      <div><b>+${fmt(prev.xp)}</b><span>XP</span></div>
      <div><b class="coin">+${fmt(prev.coins)}</b><span>coins</span></div>
      <div><b>${prev.rolls}</b><span>drop roll${prev.rolls === 1 ? '' : 's'}</span></div>` : '<p class="muted">Enter how long you spent.</p>'}
    </div>
    ${prev && prev.rolls === 0 ? `<p class="hint">Not a full unit yet, so no drop roll — the time carries over (${fmtDuration(prev.carryAfter)} of ${fmtDuration(s.unit)}).</p>` : ''}
    ${gearSection(s.id)}
    ${b.sources.length ? `<div class="boost-list">${b.sources.map((x) => `<div>✦ ${esc(x)}</div>`).join('')}</div>` : ''}
    <div class="btn-row">
      <button class="btn" data-action="close">Cancel</button>
      <button class="btn primary" data-action="confirm-log" ${minutes > 0 ? '' : 'disabled'}>Log it</button>
    </div>`);
  const sync = () => {
    logDraft.hours = document.getElementById('in-hours').value;
    logDraft.minutes = document.getElementById('in-mins').value;
  };
  const hours = document.getElementById('in-hours');
  const mins = document.getElementById('in-mins');
  for (const el of [hours, mins]) el.addEventListener('change', () => { sync(); normaliseDraft(); renderLogSheet(); });
}

function normaliseDraft() {
  let total = Math.max(0, (Number(logDraft.hours) || 0) * 60 + (Number(logDraft.minutes) || 0));
  total = Math.min(total, 24 * 60);
  logDraft.hours = Math.floor(total / 60);
  logDraft.minutes = total % 60;
}

function confirmLog() {
  const minutes = logDraft.hours * 60 + logDraft.minutes;
  const s = SKILL[logDraft.skill];
  openModal(`
    <h2>Are you sure?</h2>
    <p class="big-q">Log <b>${fmtDuration(minutes)}</b> of <b>${s.name}</b>?</p>
    <div class="btn-row">
      <button class="btn" data-action="back-to-log">No</button>
      <button class="btn primary" data-action="do-log">Yes</button>
    </div>`, { cls: 'small' });
}

function doLog() {
  const minutes = logDraft.hours * 60 + logDraft.minutes;
  const result = logActivity(state, logDraft.skill, minutes);
  persist();
  logDraft = null;
  showResult(result);
  render();
}

function showResult(r) {
  const s = SKILL[r.skill];
  const drops = Object.entries(r.drops).sort(([a], [b]) => RARITY[ITEM[a].rarity].index - RARITY[ITEM[b].rarity].index);
  const best = drops.length ? RARITY[ITEM[drops[drops.length - 1][0]].rarity].index : -1;
  const p = levelProgress(state.skills[r.skill].xp);
  openModal(`
    <div class="roll-stage" id="roll-stage">
      <div class="roller"><div class="die">${s.icon}</div><div class="muted">Rolling ${r.rolls}× the ${s.name} table…</div></div>
    </div>
    <div class="result hidden" id="result">
      <h2>${s.name} · ${fmtDuration(r.minutes)}</h2>
      ${r.bonusRoll ? '<div class="banner bonus">✦ Pet bonus roll! ✦</div>' : ''}
      <div class="gains">
        <div><b id="xp-count">+0</b><span>XP</span></div>
        <div><b class="coin" id="coin-count">+0</b><span>coins</span></div>
      </div>
      <div class="bar big"><span id="xp-bar" style="width:0%"></span></div>
      <div class="muted small center">Level ${p.level}${p.level < MAX_LEVEL ? ` · ${fmt(p.into)} / ${fmt(p.needed)} XP` : ' · MAX'}</div>
      ${r.levelAfter > r.levelBefore ? `<div class="banner levelup">LEVEL UP! ${s.name} ${r.levelBefore} → ${r.levelAfter}</div>` : ''}
      <h3>${drops.length ? 'Drops' : 'No drops this time'}</h3>
      <div class="drops">${drops.map(([id, n], i) => {
        const it = ITEM[id];
        const isNew = r.newDiscoveries.includes(id);
        return `<div class="drop r-border-${it.rarity} ${RARITY[it.rarity].index >= 2 ? 'fancy' : ''}" style="animation-delay:${200 + i * 160 + (RARITY[it.rarity].index >= 3 ? 400 : 0)}ms">
          ${itemImg(id)}
          <div class="drop-text"><div>${esc(it.name)}${n > 1 ? ` <b>x${n}</b>` : ''}</div>
          <div>${rarityTag(it.rarity)}${isNew ? '<span class="new">NEW</span>' : ''}${it.type === 'pet' ? '<span class="new pet">PET</span>' : ''}</div></div>
        </div>`;
      }).join('')}</div>
      ${r.completedCollection ? `<div class="banner levelup">Collection complete! Permanent +${pct(COLLECTION_COMPLETE_XP_BOOST)} ${s.name} XP</div>` : ''}
      ${r.newBadges.map((id) => `<div class="banner bonus">🏅 Badge earned: ${BADGE_COUNT}× ${esc(ITEM[id].name)}</div>`).join('')}
      <button class="btn primary wide" data-action="close">Continue</button>
    </div>`, { cls: 'result-sheet' });

  setTimeout(() => {
    document.getElementById('roll-stage')?.remove();
    document.getElementById('result')?.classList.remove('hidden');
    countUp('xp-count', r.xp, '+');
    countUp('coin-count', r.coins, '+');
    setTimeout(() => {
      const bar = document.getElementById('xp-bar');
      if (bar) bar.style.width = `${(p.pct * 100).toFixed(1)}%`;
    }, 50);
    if (best >= 2 && navigator.vibrate) navigator.vibrate(best >= 4 ? [80, 60, 160] : 60);
  }, 1100);
}

function countUp(id, target, prefix = '') {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now(), dur = 900;
  const step = (t) => {
    const k = Math.min(1, (t - start) / dur);
    el.textContent = prefix + fmt(target * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  // rAF pauses in background tabs; make sure the final number always lands.
  setTimeout(() => { el.textContent = prefix + fmt(target); }, dur + 100);
}

function showItem(id) {
  const it = ITEM[id];
  const n = state.items[id] || 0;
  const isEq = isEquipped(state, id);
  const price = sellPrice(id);
  const extras = n - 1;
  openModal(`
    <div class="item-detail">
      ${itemImg(id, { cls: 'xl' })}
      <h2>${esc(it.name)}</h2>
      <div>${rarityTag(it.rarity)} <span class="muted">${SKILL[it.skill].name}</span></div>
      <p>${itemEffect(it)}</p>
      <p class="muted">${it.type === 'pet' && state.everOwned[id]
        ? 'Pet owned — it no longer drops.'
        : `Drop chance: <b>${fmtChance(effectiveDropChance(state, id))}</b> per roll (1 roll = ${fmtDuration(SKILL[it.skill].unit)} of ${SKILL[it.skill].name})`}</p>
      ${it.type !== 'pet' ? `<p class="muted">Owned: <b>${fmt(n)}</b> · Sells for ${fmt(price)} coins each${n >= BADGE_COUNT ? ' · 🏅 badge earned' : ` · ${BADGE_COUNT} for a badge`}</p>` : ''}
    </div>
    <div class="btn-col">
      ${it.slot && n > 0 ? `<button class="btn primary" data-action="equip" data-id="${id}">${isEq ? 'Unequip' : `Equip (${SLOT_LABEL[it.slot]})`}</button>` : ''}
      ${canSell(id) && n > 0 ? `
        <button class="btn" data-action="sell" data-id="${id}" data-qty="1">Sell 1 (+${fmt(price)})</button>
        ${extras > 0 ? `<button class="btn" data-action="sell" data-id="${id}" data-qty="${extras}">Sell all but 1 (+${fmt(price * extras)})</button>` : ''}
        ${n > 1 ? `<button class="btn danger-btn" data-action="sell-all" data-id="${id}">Sell all ${fmt(n)} (+${fmt(price * n)})</button>` : ''}` : ''}
      <button class="btn" data-action="close">Close</button>
    </div>`);
}

// Best owned piece for a slot and skill (highest rarity = biggest boost).
function bestGear(skillId, slot) {
  return Object.keys(state.items)
    .filter((id) => state.items[id] > 0 && ITEM[id].slot === slot && ITEM[id].skill === skillId)
    .sort((a, b) => RARITY[ITEM[b].rarity].index - RARITY[ITEM[a].rarity].index)[0] || null;
}

// Is there something better for this skill than what's in the slot now?
function canUpgrade(skillId, slot) {
  const best = bestGear(skillId, slot), cur = state.equipped[slot];
  return !!best && best !== cur && !(cur && ITEM[cur].skill === skillId && RARITY[ITEM[cur].rarity].index >= RARITY[ITEM[best].rarity].index);
}

// "Gear" block on the log screen: what you're wearing, whether each piece boosts
// this skill, and a one-tap swap to your best set for it.
function gearSection(skillId) {
  const skill = SKILL[skillId];
  const slot = (type) => {
    const id = state.equipped[type];
    const matches = id && ITEM[id].skill === skillId;
    const status = !id ? '<span class="muted">Empty</span>'
      : matches ? '<span class="boost">✓ boosting</span>'
      : '<span class="muted">no boost here</span>';
    const icon = id ? itemImg(id) : `<span class="slot-empty">${SLOT_EMPTY_ICON[type]}</span>`;
    return `<button class="gear-slot ${matches ? 'match' : ''}" data-action="gear-pick" data-type="${type}" data-skill="${skillId}">
      <span class="gear-icon">${icon}</span>
      <span class="gear-text"><span class="slot-label">${SLOT_LABEL[type]}</span>
        <span class="gear-name">${id ? esc(ITEM[id].name) : '—'}</span><span class="small">${status}</span></span>
      ${canUpgrade(skillId, type) ? '<span class="gear-up">▲</span>' : ''}
    </button>`;
  };
  const upgrades = GEAR_SLOTS.filter((t) => canUpgrade(skillId, t));
  const bestBtn = upgrades.length
    ? `<button class="btn wide gear-best" data-action="equip-best" data-skill="${skillId}">Equip best ${skill.name} gear</button>`
    : '';
  return `<div class="gear"><div class="gear-slots">${GEAR_SLOTS.map(slot).join('')}</div>${bestBtn}</div>`;
}

// Owned items for a slot, as picker buttons. With a skill, that skill's gear comes first.
function slotPickList(slot, action, skillId = null) {
  const owned = Object.keys(state.items).filter((id) => state.items[id] > 0 && ITEM[id].slot === slot)
    .sort((a, b) => (skillId ? (ITEM[b].skill === skillId) - (ITEM[a].skill === skillId) : 0)
      || RARITY[ITEM[b].rarity].index - RARITY[ITEM[a].rarity].index);
  const current = state.equipped[slot];
  if (!owned.length) {
    const what = slot === 'pet' ? 'pets' : `${SLOT_LABEL[slot].toLowerCase()} gear`;
    return `<p class="muted">You don't have any ${what} yet. Log some activities to get drops.</p>`;
  }
  const rows = owned.map((id) => {
    const it = ITEM[id];
    let sub;
    if (!skillId) sub = itemEffect(it).split(' · ')[1];
    else if (it.skill === skillId) sub = `<span class="boost">boosts ${SKILL[skillId].name}</span>`;
    else sub = `<span class="muted">${SKILL[it.skill].name}</span>`;
    return `<button class="pick ${id === current ? 'on' : ''}" data-action="${action}" data-id="${id}">
        ${itemImg(id)}<span><b>${esc(it.name)}</b><br><span class="small">${rarityTag(it.rarity)} ${sub}</span></span>
      </button>`;
  });
  return `<div class="pick-list">${rows.join('')}</div>`;
}

// Picker opened from the log screen.
function gearPicker(slot, skillId) {
  const unequip = state.equipped[slot] ? `<button class="btn" data-action="gear-none" data-type="${slot}">Unequip</button>` : '';
  openModal(`
    <h2>${SLOT_LABEL[slot]} for ${SKILL[skillId].name}</h2>
    <p class="muted small">Only ${SKILL[skillId].name} gear boosts this log. Anything else is just for looks.</p>
    ${slotPickList(slot, 'gear-choose', skillId)}
    <div class="btn-row">${unequip}<button class="btn" data-action="back-to-log">Back</button></div>`);
}

// Picker opened from the Equipped panel on the home screen.
function pickSlot(slot) {
  const unequip = state.equipped[slot] ? `<button class="btn" data-action="unequip-slot" data-type="${slot}">Unequip</button>` : '';
  openModal(`
    <h2>Choose ${slot === 'pet' ? 'a pet' : `${SLOT_LABEL[slot].toLowerCase()} gear`}</h2>
    ${slotPickList(slot, 'equip-pick')}
    <div class="btn-row">${unequip}<button class="btn" data-action="close">Close</button></div>`);
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

// ---------- Backup ----------
async function backup() {
  const name = `life-rpg-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const json = JSON.stringify({ ...state, lastBackupAt: Date.now() }, null, 1);
  const markDone = (msg) => { state.lastBackupAt = Date.now(); persist(); render(); toast(msg); };
  // Phones (especially iPhone home-screen apps) handle the share sheet far better
  // than downloads: it offers Save to Files, AirDrop, Messages, email, etc.
  const file = new File([json], name, { type: 'application/json' });
  if ((isIOS || /Android/.test(navigator.userAgent)) && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Life RPG backup' });
      markDone('Backup saved');
      return;
    } catch (e) {
      if (e.name === 'AbortError') return; // user closed the share sheet
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  markDone('Backup downloaded');
}

async function restore(file) {
  try {
    const next = validateImport(JSON.parse(await file.text()));
    openModal(`
      <h2>Restore backup?</h2>
      <p>This replaces your current progress on this device with the backup from <b>${new Date(next.log[0]?.at || next.createdAt).toLocaleDateString()}</b> (${totalLevel(next)} total level, ${fmt(next.coins)} coins).</p>
      <div class="btn-row"><button class="btn" data-action="close">Cancel</button><button class="btn primary" id="do-restore">Restore</button></div>`, { cls: 'small' });
    document.getElementById('do-restore').onclick = () => {
      state = next; persist(); closeModal(); view = 'home'; render(); toast('Backup restored');
    };
  } catch (e) {
    toast(e.message || 'Could not read that file');
  }
}

// ---------- Events ----------
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  switch (a) {
    case 'nav': e.preventDefault(); view = el.dataset.view; render(); window.scrollTo(0, 0); break;
    case 'close': closeModal(); break;
    case 'open-log': logDraft = { skill: el.dataset.skill, hours: SKILL[el.dataset.skill].unit >= 60 ? SKILL[el.dataset.skill].unit / 60 : 0, minutes: SKILL[el.dataset.skill].unit % 60 }; renderLogSheet(); break;
    case 'add-time': logDraft.minutes = Number(logDraft.minutes) + Number(el.dataset.min); normaliseDraft(); renderLogSheet(); break;
    case 'clear-time': logDraft.hours = 0; logDraft.minutes = 0; renderLogSheet(); break;
    case 'confirm-log': {
      logDraft.hours = document.getElementById('in-hours').value;
      logDraft.minutes = document.getElementById('in-mins').value;
      normaliseDraft();
      if (logDraft.hours * 60 + logDraft.minutes > 0) confirmLog();
      break;
    }
    case 'back-to-log': renderLogSheet(); break;
    case 'do-log': doLog(); break;
    case 'coll-skill': collectionSkill = el.dataset.skill; render(); break;
    case 'chip-scroll': {
      const row = document.querySelector('.skill-chips');
      row.scrollLeft += Number(el.dataset.dir) * row.clientWidth * 0.7;
      break;
    }
    case 'item': showItem(el.dataset.id); break;
    case 'equip': equip(state, el.dataset.id); persist(); render(); showItem(el.dataset.id); break;
    case 'equip-best': {
      for (const t of GEAR_SLOTS) if (canUpgrade(el.dataset.skill, t)) state.equipped[t] = bestGear(el.dataset.skill, t);
      persist(); render(); renderLogSheet(); toast(`${SKILL[el.dataset.skill].name} gear equipped`);
      break;
    }
    case 'gear-pick': gearPicker(el.dataset.type, el.dataset.skill); break;
    case 'gear-choose': state.equipped[ITEM[el.dataset.id].slot] = el.dataset.id; persist(); render(); renderLogSheet(); break;
    case 'gear-none': state.equipped[el.dataset.type] = null; persist(); render(); renderLogSheet(); break;
    case 'equip-pick': {
      const id = el.dataset.id;
      if (state.equipped[ITEM[id].slot] !== id) equip(state, id);
      persist(); closeModal(); render(); toast(`Equipped ${ITEM[id].name}`);
      break;
    }
    case 'unequip-slot': state.equipped[el.dataset.type] = null; persist(); closeModal(); render(); break;
    case 'pick-slot': pickSlot(el.dataset.type); break;
    case 'sell': {
      const got = sell(state, el.dataset.id, Number(el.dataset.qty));
      persist(); render(); toast(`+${fmt(got)} coins`);
      if (state.items[el.dataset.id] > 0) showItem(el.dataset.id); else closeModal();
      break;
    }
    case 'sell-all': {
      const id = el.dataset.id, n = state.items[id];
      openModal(`<h2>Sell all?</h2><p>Sell all ${fmt(n)} × ${esc(ITEM[id].name)} for ${fmt(n * sellPrice(id))} coins?</p>
        <div class="btn-row"><button class="btn" data-action="item" data-id="${id}">No</button>
        <button class="btn primary" data-action="sell" data-id="${id}" data-qty="${n}">Yes, sell</button></div>`, { cls: 'small' });
      break;
    }
    case 'rename':
      openModal(`<h2>Rename character</h2>
        <label class="field">Name<input id="rename-input" type="text" maxlength="24" autocomplete="off" autocapitalize="words" value="${esc(state.name)}"></label>
        <div class="btn-row"><button class="btn" data-action="close">Cancel</button><button class="btn primary" data-action="rename-save">Save</button></div>`, { cls: 'small' });
      break;
    case 'rename-save': {
      const name = document.getElementById('rename-input').value.trim();
      if (name) { state.name = name.slice(0, 24); persist(); render(); }
      closeModal();
      break;
    }
    case 'start-game': {
      const name = document.getElementById('welcome-name').value.trim();
      state.name = (name || 'Adventurer').slice(0, 24);
      state.onboarded = true;
      persist(); closeModal(); render();
      break;
    }
    case 'install':
      if (canPromptInstall()) promptInstall().then(() => render());
      else showInstall();
      break;
    case 'install-now': promptInstall().then(() => { closeModal(); render(); }); break;
    case 'back-to-welcome': welcome(); break;
    case 'hide-install': installBannerHidden = true; pref.set('hideInstall', '1'); render(); break;
    case 'backup': backup(); break;
    case 'reset':
      openModal(`<h2>Reset everything?</h2><p>This deletes all your XP, items and coins on this device. Download a backup first if you might want it back.</p>
        <div class="btn-row"><button class="btn" data-action="close">Cancel</button><button class="btn danger-btn" data-action="reset-confirm">Delete progress</button></div>`, { cls: 'small' });
      break;
    case 'reset-confirm': state = newState(); persist(); closeModal(); view = 'home'; render(); welcome(); break;
  }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'restore-input' && e.target.files[0]) {
    restore(e.target.files[0]);
    e.target.value = '';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $modal.classList.contains('open') && !$modal.dataset.locked) closeModal();
});

// Ask the browser not to evict our storage (best effort).
navigator.storage?.persist?.().catch(() => {});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW registration failed', e));
}

// Fade the splash (in index.html) out once the first screen is drawn. It stays at
// least long enough for the logo to fade in, and is skipped after an auto-update
// reload so updates feel instant.
function hideSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return Promise.resolve();
  let quick = false;
  try { quick = sessionStorage.getItem('liferpg.quickStart') === '1'; sessionStorage.removeItem('liferpg.quickStart'); } catch {}
  const minShow = quick ? 0 : 2400;
  const wait = Math.max(0, minShow - performance.now());
  return new Promise((resolve) => {
    setTimeout(() => {
      splash.classList.add('out');
      setTimeout(() => { splash.remove(); resolve(); }, quick ? 0 : 950);
    }, wait);
  });
}

// Re-render when the install state changes (Android/desktop install prompt becomes available, or app installed).
onInstallChange(() => { if (state.onboarded && !$modal.classList.contains('open')) render(); });

render();
hideSplash().then(() => { if (!state.onboarded) welcome(); });
startAutoUpdate({ isBusy: () => $modal.classList.contains('open') && state.onboarded });
