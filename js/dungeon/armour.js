// Draws your Dungeon gear onto your pixel avatar (Camp, battles, the tower).
// Coordinates are in the 32x52 avatar grid: head x11-20 y5-15, torso x10-21 y18-29, arms x7-9 / x22-24,
// legs x11-15 / x16-20 y30-40, feet y41-42. Colours come from each item's section material and rarity.
import { DITEMS } from './ddata.js';
import { MAT, GEM, TRIM } from './gearart.js';
import { avatarDataUrl } from '../sprites2.js';

const R_INDEX = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'];
const HOLY = ['#7a5a20', '#c09a48', '#f0e2b0', '#ffffff'];
const CLOTH = { 0: ['#3a2414', '#6a4426', '#8a5c34', '#a87a4a'], 1: ['#2a3418', '#4a5a2a', '#6a7a3a', '#8a9a52'], 2: ['#241a34', '#3e2e5a', '#5a4680', '#7a66a0'],
  3: ['#2a2622', '#4a443e', '#6a625a', '#8a8278'], 4: ['#6a8aa8', '#a8c4dc', '#d8e8f6', '#ffffff'], 5: ['#240a0a', '#4a1414', '#6a2420', '#8a3a30'] };
const isCloth = (it) => /hood|cap|hat|robe|tunic|vest|jerkin|mantle|parka|trousers|leggings|breeches|sandals|shoes|wrap|coat|cloth|hide/i.test(it.name) && !/plate|mail|chain/i.test(it.name);

function look(id) {
  const it = DITEMS[id];
  const sec = Math.max(0, it.section || 0);
  const m = MAT[sec] || MAT[0];
  const R = R_INDEX.indexOf(it.rarity);
  return { it, sec, R, metal: it.dtype === 'holy' ? HOLY : m.metal, cloth: CLOTH[sec] || CLOTH[0], glow: m.glow, fx: m.fx, gem: GEM[it.rarity], trim: R >= 3 ? TRIM : null };
}
// fill a box: light on the left/top, dark on the right/bottom (r = [dark, mid, light, highlight])
function box(g, x0, y0, x1, y1, r) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let c = r[1];
    if (x === x0 || y === y0) c = r[2];
    if (x === x1 || y === y1) c = r[0];
    g.px(x, y, c);
  }
}
const px = (g, x, y, c, glow) => g.px(x, y, c, glow);

// ---------- pieces ----------
function helmet(g, L) {
  const n = L.it.name.toLowerCase();
  if (/crown/.test(n)) {
    const gd = TRIM;
    for (let x = 11; x <= 20; x++) { px(g, x, 3, gd[2]); px(g, x, 4, gd[1]); }
    for (const x of [11, 14, 17, 20]) { px(g, x, 2, gd[3]); px(g, x, 1, gd[2]); }
    px(g, 15, 0, gd[3]); px(g, 16, 0, gd[3]); px(g, 15, 1, gd[2]); px(g, 16, 1, gd[2]);
    px(g, 15, 3, L.gem || '#e8435a', true); px(g, 16, 3, L.gem || '#e8435a', true);
    if (/phoenix|hellfire/.test(n)) for (const x of [12, 15, 18]) { px(g, x, -1, '#ff8a2e', true); px(g, x + 1, -2, '#ffd27a', true); }
    return;
  }
  if (isCloth(L.it)) {                         // hood: cloth over the hair and sides of the face
    const r = L.cloth;
    box(g, 11, 1, 20, 4, r); box(g, 10, 4, 11, 13, r); box(g, 20, 4, 21, 13, r);
    for (let x = 11; x <= 20; x++) px(g, x, 5, r[0]);
    if (L.trim) for (let x = 10; x <= 21; x++) px(g, x, 4, L.trim[2]);
    return;
  }
  const r = L.metal;                           // metal helm
  box(g, 11, 1, 20, 7, r); box(g, 10, 3, 10, 12, r); box(g, 21, 3, 21, 12, r);
  for (let x = 12; x <= 15; x++) px(g, x, 2, r[3]);
  for (let x = 10; x <= 21; x++) px(g, x, 7, L.trim ? L.trim[2] : r[0]);      // brow band
  box(g, 15, 8, 16, 11, r);                                                   // nose guard
  if (L.gem && L.R >= 2) { px(g, 15, 4, L.gem, true); px(g, 16, 4, L.gem, true); }
  if (L.fx === 'notch' || L.fx === 'lava' || /horn|dread|demon|warlord|goblin/.test(n)) {
    const hr = L.fx === 'lava' ? ['#1a0a0a', '#3a1a14', '#6a3a2a', '#ff8a2e'] : ['#5a4a30', '#a08a60', '#d8c8a0', '#fff4d8'];
    for (const [s, x] of [[-1, 9], [1, 22]]) { px(g, x, 3, hr[1]); px(g, x, 2, hr[2]); px(g, x + s, 1, hr[2]); px(g, x + s, 0, hr[3]); px(g, x + 2 * s, -1, hr[3]); }
  } else if (L.R >= 3) {
    for (let y = -2; y <= 1; y++) { px(g, 15, y, L.gem); px(g, 16, y, y < 0 ? '#ffffff' : L.gem); }   // plume
  }
}

function chest(g, L) {
  const cloth = isCloth(L.it), r = cloth ? L.cloth : L.metal;
  box(g, 10, 18, 21, 28, r);
  if (!cloth) {
    for (let y = 19; y <= 26; y++) { px(g, 15, y, r[3]); px(g, 16, y, r[2]); }               // breast ridge
    for (const [x0, x1] of [[7, 10], [21, 24]]) box(g, x0, 17, x1, 20, r);                  // pauldrons
    for (const [x0, x1] of [[7, 9], [22, 24]]) box(g, x0, 25, x1, 29, r);                  // vambraces
    if (L.trim) { for (let x = 7; x <= 10; x++) px(g, x, 20, L.trim[2]); for (let x = 21; x <= 24; x++) px(g, x, 20, L.trim[2]); }
  } else {
    for (let x = 12; x <= 19; x++) px(g, x, 18, r[3]);                                       // collar
    for (const [x0, x1] of [[7, 9], [22, 24]]) box(g, x0, 19, x1, 26, r);                  // sleeves
  }
  for (let x = 10; x <= 21; x++) { px(g, x, 28, '#3a2414'); px(g, x, 29, '#2a1a0c'); }       // belt
  px(g, 15, 28, L.trim ? L.trim[2] : '#c8a050'); px(g, 16, 28, L.trim ? L.trim[2] : '#c8a050');
  if (L.fx === 'rune' && L.R >= 2) for (const y of [21, 23, 25]) { px(g, 12, y, L.glow, true); px(g, 19, y, L.glow, true); }
  if (L.fx === 'lava') for (const [x, y] of [[12, 21], [18, 23], [13, 25], [19, 20]]) px(g, x, y, '#ff6a1a', true);
  if (L.gem && L.R >= 2) { px(g, 15, 21, L.gem, true); px(g, 16, 21, L.gem, true); px(g, 15, 22, L.gem, true); px(g, 16, 22, L.gem, true); }
}

function legs(g, L) {
  const cloth = isCloth(L.it), r = cloth ? L.cloth : L.metal;
  box(g, 11, 30, 20, 31, r); box(g, 11, 32, 15, 40, r); box(g, 16, 32, 20, 40, r);
  if (!cloth) for (const x0 of [12, 17]) { box(g, x0, 35, x0 + 2, 36, [r[1], r[2], r[3], r[3]]); }   // knee plates
  if (L.trim) for (let x = 11; x <= 20; x++) px(g, x, 30, L.trim[2]);
  if (L.gem && L.R >= 2) { px(g, 15, 31, L.gem, true); px(g, 16, 31, L.gem, true); }
}

function boots(g, L) {
  const cloth = isCloth(L.it), r = cloth ? L.cloth : L.metal;
  for (const [x0, x1] of [[10, 15], [16, 21]]) {
    box(g, x0, 38, x1, 42, r);
    for (let x = x0; x <= x1; x++) { px(g, x, 38, L.trim ? L.trim[2] : r[3]); px(g, x, 43, '#1a1418'); }
  }
  if (L.fx === 'ice') for (const x of [11, 17]) px(g, x, 40, '#e8f8ff', true);
  if (L.fx === 'lava') for (const x of [12, 18]) px(g, x, 42, '#ff6a1a', true);
}

// weapon gripped in the right hand (viewer's right), angled up and outwards; the fist is drawn over the handle
const HAND = { x: 23, y: 30.5 };
function stroke(g, dir, t0, t1, offs, colour) {
  const len = Math.hypot(dir[0], dir[1]), d = [dir[0] / len, dir[1] / len], n = [-d[1], d[0]];   // n points outwards/right
  for (let t = t0; t <= t1; t += 0.35) for (const o of offs) {
    const x = Math.round(HAND.x + d[0] * t + n[0] * o), y = Math.round(HAND.y + d[1] * t + n[1] * o);
    g.px(x, y, typeof colour === 'function' ? colour(t, o) : colour);
  }
}
function weapon(g, L) {
  const t = L.it.weaponType, r = L.metal, wood = ['#3a2414', '#6a4426', '#8a5c34', '#a87a4a'];
  const fistCol = g.c[30 + (g.oy || 0)]?.[23] || '#e2b48c';            // whatever skin the avatar has
  const trim = L.trim ? L.trim[2] : r[2];
  const glowAt = (x, y) => g.px(x, y, L.gem, true);
  const DIAG = [0.55, -1];                                             // up and a little outwards
  if (t === 'bow') {                                                   // held upright in the fist, string on the inside
    for (let y = 19; y <= 42; y++) { const dx = Math.round(3 * Math.sin(Math.PI * (y - 19) / 23)); g.px(23 + dx, y, wood[2]); g.px(24 + dx, y, wood[0]); }
    for (let y = 19; y <= 42; y++) g.px(22, y, '#e8e0d0');
    if (L.R >= 3) { g.px(23, 19, TRIM[2]); g.px(23, 42, TRIM[2]); }
  } else if (t === 'staff') {
    stroke(g, [0.2, -1], -9, 15, [0], wood[1]); stroke(g, [0.2, -1], -9, 15, [1], wood[0]);
    const orb = L.glow || L.gem || '#9fd3ff', cx = Math.round(HAND.x + 0.2 * 18 / 1.02), cy = Math.round(HAND.y - 18 / 1.02);
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 5) g.px(cx + x, cy + y, x + y < -1 ? '#ffffff' : orb, true);
    g.px(cx - 2, cy + 2, trim); g.px(cx + 2, cy + 2, trim);              // claws holding the orb
  } else if (t === 'gauntlet') {
    for (const x0 of [6, 21]) for (let y = 28; y <= 32; y++) for (let x = x0; x <= x0 + 4; x++) g.px(x, y, x === x0 ? r[2] : x === x0 + 4 || y === 32 ? r[0] : r[1]);
    if (L.it.titan) { g.px(23, 30, '#ffd84a', true); g.px(8, 30, '#ffd84a', true); }
    return;                                                            // the gauntlets are the fists
  } else if (t === 'spear') {
    stroke(g, DIAG, -8, 17, [0], wood[1]); stroke(g, DIAG, -8, 17, [1], wood[0]);
    stroke(g, DIAG, 17, 22, [-1, 0, 1, 2], (tt, o) => (Math.abs(o - 0.5) > (22 - tt) * 0.45 ? null : o <= 0 ? r[3] : r[1]));
    stroke(g, DIAG, 16, 16.6, [-1, 0, 1, 2], trim);
  } else if (t === 'hammer') {
    stroke(g, DIAG, -3, 12, [0], wood[1]); stroke(g, DIAG, -3, 12, [1], wood[0]);
    stroke(g, DIAG, 11, 15, [-3, -2, -1, 0, 1, 2, 3, 4], (tt, o) => (tt < 11.6 || tt > 14.4 || o === -3 || o === 4 ? r[0] : o < 0 ? r[3] : r[1]));
    if (L.fx === 'rune' && L.R >= 2) stroke(g, DIAG, 13, 13.3, [0, 1], L.glow);
  } else if (t === 'axe') {
    stroke(g, DIAG, -3, 15, [0], wood[1]); stroke(g, DIAG, -3, 15, [1], wood[0]);
    stroke(g, DIAG, 10, 15, [2, 3, 4, 5, 6], (tt, o) => (o > 4.6 - Math.abs(tt - 12.5) * 0.5 ? (o >= 5 - Math.abs(tt - 12.5) * 0.5 ? null : r[3]) : r[1]));   // curved blade head
    if (L.R >= 2) stroke(g, DIAG, 11, 14, [-1, -2], (tt) => (tt > 12 ? r[0] : null));                                                                   // back spike
  } else {                                                             // sword / dagger
    const len = t === 'dagger' ? 7 : 15;
    stroke(g, DIAG, -2.5, 1.5, [0, 1], wood[1]);                       // grip
    stroke(g, DIAG, -3.2, -2.6, [0, 1], trim);                         // pommel
    stroke(g, DIAG, 2, 2.6, [-2, -1, 0, 1, 2, 3], trim);               // cross-guard
    stroke(g, DIAG, 3, 2 + len, [0, 1], (tt, o) => (tt > len ? (o === 0 ? r[3] : null) : o === 0 ? r[3] : r[1]));
    if (L.fx === 'lava') stroke(g, DIAG, 8, 8.4, [1], '#ff6a1a');
    if (L.fx === 'rune' && L.R >= 2) stroke(g, DIAG, 7, 7.4, [0], L.glow);
  }
  // the fist closes over the handle
  for (let y = 29; y <= 31; y++) for (let x = 22; x <= 24; x++) g.px(x, y, x === 22 || y === 29 ? fistCol : x === 24 || y === 31 ? '#b8886a' : fistCol);
}

// off-hand on the left arm (viewer's left)
function offhand(g, L) {
  const k = L.it.kind;
  if (k === 'shield') {
    const r = /plank|wooden|coffin/i.test(L.it.name) ? ['#3a2414', '#6a4426', '#8a5c34', '#a87a4a'] : L.metal;
    for (let y = 21; y <= 32; y++) { const w = y < 28 ? 3 : 3 - (y - 27); for (let x = 5 - w; x <= 5 + w; x++) px(g, x, y, x === 5 - w ? r[2] : x === 5 + w ? r[0] : r[1]); }
    for (let y = 22; y <= 29; y++) px(g, 5, y, L.trim ? L.trim[2] : r[3]);
    for (let x = 3; x <= 7; x++) px(g, x, 24, L.trim ? L.trim[2] : r[3]);
    if (L.gem && L.R >= 2) px(g, 5, 24, L.gem, true);
    return;
  }
  if (k === 'tome') { box(g, 3, 27, 8, 32, ['#2a0e3a', '#4a1e6a', '#6a3a9a', '#9a6ad0']); px(g, 5, 29, L.glow || '#ffd84a', true); px(g, 6, 29, L.glow || '#ffd84a', true); return; }
  if (k === 'lantern') { px(g, 5, 28, '#8a8a92'); box(g, 4, 29, 7, 33, ['#3a3a42', '#ffd27a', '#ffe8a0', '#ffffff']); px(g, 5, 31, '#ffffff', true); return; }
  // relic / flask: a small glowing bottle (the Wings of the Seraph are drawn behind the body instead)
  if (/wings/i.test(L.it.name)) return;
  const liq = L.it.revive || L.it.cheatDeath ? '#ffd84a' : L.it.healStart ? '#e8435a' : L.glow || '#7ae0ff';
  px(g, 5, 27, '#a07a50'); box(g, 4, 28, 7, 32, ['#203040', liq, liq, '#ffffff']); px(g, 5, 29, '#ffffff', true);
}

function wingsBehind(g) {
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const len = 9 - i * 1.5;
      for (let d = 0; d < len; d++) {
        const x = Math.round(15.5 + s * (5 + d)), y = 16 + i * 3 - Math.round(d * 0.7);
        px(g, x, y, i % 2 ? '#e8e2ff' : '#ffffff'); px(g, x, y + 1, i % 2 ? '#c8c0ea' : '#e8e2ff');
      }
    }
  }
}

// avatar image with your life-skill outfit underneath and Dungeon armour on top
export function dungeonAvatarUrl(lifeGear, dEquipped = {}, scale = 4) {
  const L = (slot) => (dEquipped[slot] && DITEMS[dEquipped[slot]] ? look(dEquipped[slot]) : null);
  const off = L('offhand');
  return avatarDataUrl(lifeGear, scale, {
    behind: (g) => { if (off && /wings/i.test(off.it.name)) wingsBehind(g); },
    over: (g) => {
      const parts = { legs: L('legs'), boots: L('boots'), chest: L('chest'), helmet: L('helmet'), weapon: L('weapon'), offhand: off };
      if (parts.legs) legs(g, parts.legs);
      if (parts.boots) boots(g, parts.boots);
      if (parts.chest) chest(g, parts.chest);
      if (parts.helmet) helmet(g, parts.helmet);
      if (parts.weapon) weapon(g, parts.weapon);
      if (parts.offhand) offhand(g, parts.offhand);
    },
  });
}
