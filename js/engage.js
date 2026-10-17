// Engagement features: daily/weekly quests, achievements and titles.
// Everything here is worked out from the save (days logged, levels, items), so it
// needs no extra tracking beyond what game.js already records.
import { SKILLS, SKILL, ITEM, ITEMS, RARITY, BADGE_COUNT } from './data.js';
import { dayKey, currentStreak, levelForXp, isCollectionComplete, totalLevel } from './game.js';

// ---------- helpers ----------
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Monday that starts the week containing `d`.
export function weekStart(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function weekDays(d = new Date()) {
  const start = weekStart(d);
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(start); x.setDate(start.getDate() + i); return dayKey(x); });
}
const fmtMin = (m) => (m >= 60 ? `${m / 60} hr${m > 60 ? 's' : ''}` : `${m} min`);

const skillHours = (state, id) => (state.skills[id]?.totalMin || 0) / 60;
const totalHours = (state) => SKILLS.reduce((n, s) => n + skillHours(state, s.id), 0);
const maxLevel = (state) => Math.max(...SKILLS.map((s) => levelForXp(state.skills[s.id].xp)));
const ownedOfRarity = (state, r) => ITEMS.some((i) => i.rarity === r && state.everOwned[i.id]);
const petsOwned = (state) => ITEMS.filter((i) => i.type === 'pet' && state.everOwned[i.id]).length;
const skillsEverLogged = (state) => SKILLS.filter((s) => state.skills[s.id].totalMin > 0).length;

// ---------- quests ----------
// Daily: one skill-specific goal (rewards a bonus roll) + two general ones (coins).
// Weekly: two bigger goals. Which skill you get is picked from the date, so it's
// the same all day and changes tomorrow.
export function questsFor(state, now = new Date()) {
  const today = dayKey(now);
  const day = state.days[today] || { min: 0, skills: {} };
  const rnd = rng32(hashStr(today));
  const skill = SKILLS[Math.floor(rnd() * SKILLS.length)];
  const target = Math.min(skill.unit, 60);
  const week = weekDays(now).map((k) => state.days[k]).filter(Boolean);
  const weekSkills = new Set(week.flatMap((d) => Object.keys(d.skills)));
  const weekKey = dayKey(weekStart(now));
  const daily = [
    { id: 'skill', text: `Log ${fmtMin(target)} of ${skill.name}`, icon: skill.icon, progress: day.skills[skill.id] || 0, goal: target, unit: 'min', reward: { rolls: 1 } },
    { id: 'variety', text: 'Log 2 different skills', icon: '🎯', progress: Object.keys(day.skills).length, goal: 2, reward: { coins: 40 } },
    { id: 'total', text: 'Log 1 hour in total', icon: '⏳', progress: day.min, goal: 60, unit: 'min', reward: { coins: 30 } },
  ].map((q) => ({ ...q, key: `${today}#${q.id}`, period: 'daily' }));
  const weekly = [
    { id: 'w-variety', text: 'Log 3 different skills this week', icon: '🧭', progress: weekSkills.size, goal: 3, reward: { rolls: 2 } },
    { id: 'w-days', text: 'Log on 4 different days this week', icon: '📅', progress: week.length, goal: 4, reward: { coins: 200 } },
  ].map((q) => ({ ...q, key: `${weekKey}#${q.id}`, period: 'weekly' }));
  return [...daily, ...weekly].map((q) => ({ ...q, done: q.progress >= q.goal, claimed: !!state.quests.claimed[q.key] }));
}

export const rewardText = (r) => [r.coins && `${r.coins} coins`, r.rolls && `${r.rolls} bonus drop roll${r.rolls > 1 ? 's' : ''}`].filter(Boolean).join(' + ');

// Grant rewards for any quests just completed. Returns the quests that paid out.
function claimQuests(state) {
  const paid = [];
  for (const q of questsFor(state)) {
    if (!q.done || q.claimed) continue;
    state.quests.claimed[q.key] = Date.now();
    if (q.reward.coins) state.coins += q.reward.coins;
    if (q.reward.rolls) state.bonusRolls = (state.bonusRolls || 0) + q.reward.rolls;
    paid.push(q);
  }
  // Forget claims older than two weeks so the save doesn't grow forever.
  const cutoff = Date.now() - 14 * 864e5;
  for (const [k, t] of Object.entries(state.quests.claimed)) if (t < cutoff) delete state.quests.claimed[k];
  return paid;
}

// ---------- achievements ----------
// `have` gives [current, goal] so locked badges can show progress.
export const ACHIEVEMENTS = [
  { id: 'first-log', icon: '👣', name: 'First Steps', desc: 'Log your first activity', have: (s) => [Math.min(1, s.log.length), 1] },
  { id: 'first-rare', icon: '💎', name: 'Shiny', desc: 'Find your first Rare item', have: (s) => [+ownedOfRarity(s, 'rare'), 1] },
  { id: 'first-epic', icon: '🔮', name: 'Epic Find', desc: 'Find your first Epic item', have: (s) => [+ownedOfRarity(s, 'epic'), 1] },
  { id: 'first-legendary', icon: '🌟', name: 'First Legendary', desc: 'Find your first Legendary item', have: (s) => [+ownedOfRarity(s, 'legendary'), 1] },
  { id: 'first-mythic', icon: '🔥', name: 'Myth Maker', desc: 'Find your first Mythic item', have: (s) => [+ownedOfRarity(s, 'mythic'), 1] },
  { id: 'first-divine', icon: '👑', name: 'Touched by the Gods', desc: 'Find a Divine pet', have: (s) => [+ownedOfRarity(s, 'divine'), 1] },
  { id: 'lvl-15', icon: '🥉', name: 'Apprentice', desc: 'Reach level 15 in any skill', have: (s) => [Math.min(15, maxLevel(s)), 15] },
  { id: 'lvl-30', icon: '🥈', name: 'Adept', desc: 'Reach level 30 in any skill', have: (s) => [Math.min(30, maxLevel(s)), 30] },
  { id: 'lvl-45', icon: '🥇', name: 'Master', desc: 'Reach level 45 in any skill', have: (s) => [Math.min(45, maxLevel(s)), 45] },
  { id: 'lvl-60', icon: '🏆', name: 'Maxed Out', desc: 'Reach level 60 in any skill', have: (s) => [Math.min(60, maxLevel(s)), 60] },
  { id: 'total-100', icon: '📈', name: 'Well Rounded', desc: 'Reach 100 total level', have: (s) => [Math.min(100, totalLevel(s)), 100] },
  { id: 'all-skills', icon: '🧭', name: 'Jack of All Trades', desc: 'Log every one of the 12 skills', have: (s) => [skillsEverLogged(s), 12] },
  { id: 'hours-10', icon: '⏱️', name: 'Getting Into It', desc: 'Log 10 hours in total', have: (s) => [Math.min(10, Math.floor(totalHours(s))), 10] },
  { id: 'hours-100', icon: '⌛', name: 'Committed', desc: 'Log 100 hours in total', have: (s) => [Math.min(100, Math.floor(totalHours(s))), 100] },
  { id: 'fitness-100', icon: '🏃', name: 'Iron Lungs', desc: 'Log 100 hours of Fitness', have: (s) => [Math.min(100, Math.floor(skillHours(s, 'fitness'))), 100] },
  { id: 'streak-7', icon: '🔥', name: 'On Fire', desc: 'Reach a 7-day streak', have: (s) => [Math.min(7, s.bestStreak || 0), 7] },
  { id: 'streak-30', icon: '☄️', name: 'Unstoppable', desc: 'Reach a 30-day streak', have: (s) => [Math.min(30, s.bestStreak || 0), 30] },
  { id: 'pets-10', icon: '🐾', name: 'Pet Lover', desc: 'Own 10 pets', have: (s) => [Math.min(10, petsOwned(s)), 10] },
  { id: 'common-pets', icon: '🐣', name: 'Petting Zoo', desc: 'Own every Common pet', have: (s) => [ITEMS.filter((i) => i.type === 'pet' && i.rarity === 'common' && s.everOwned[i.id]).length, 12] },
  { id: 'collection', icon: '📚', name: 'Completionist', desc: "Complete a skill's collection (all 24 items)", have: (s) => [Math.max(...SKILLS.map((k) => ITEMS.filter((i) => i.skill === k.id && s.everOwned[i.id]).length)), 24] },
  { id: 'hoarder', icon: '🏅', name: 'Hoarder', desc: `Own ${BADGE_COUNT} of one item`, have: (s) => [Math.min(BADGE_COUNT, Math.max(0, ...Object.values(s.items))), BADGE_COUNT] },
  { id: 'rich', icon: '💰', name: 'Moneybags', desc: 'Hold 10,000 coins', have: (s) => [Math.min(10000, s.coins), 10000] },
];

// ---------- titles ----------
const L60 = {
  fitness: 'the Unstoppable', intelligence: 'the Sage', cooking: 'the Iron Chef', farming: 'the Harvester',
  foraging: 'the Wayfinder', crafting: 'the Artisan', artistry: 'the Visionary', music: 'the Virtuoso',
  mindfulness: 'the Enlightened', charisma: 'the Charming', housekeeping: 'the Immaculate', labour: 'the Titan',
};
export const TITLES = [
  { id: 'beginner', label: 'the Beginner', how: 'Log your first activity', ok: (s) => s.log.length > 0 },
  { id: 'apprentice', label: 'the Apprentice', how: 'Reach level 15 in any skill', ok: (s) => maxLevel(s) >= 15 },
  { id: 'adept', label: 'the Adept', how: 'Reach level 30 in any skill', ok: (s) => maxLevel(s) >= 30 },
  { id: 'master', label: 'the Master', how: 'Reach level 45 in any skill', ok: (s) => maxLevel(s) >= 45 },
  { id: 'devoted', label: 'the Devoted', how: 'Reach a 30-day streak', ok: (s) => (s.bestStreak || 0) >= 30 },
  { id: 'collector', label: 'the Collector', how: "Complete a skill's collection", ok: (s) => SKILLS.some((k) => isCollectionComplete(s, k.id)) },
  { id: 'lucky', label: 'the Lucky', how: 'Find a Divine pet', ok: (s) => ownedOfRarity(s, 'divine') },
  { id: 'unlucky', label: 'the Unlucky', how: 'Log 500 hours without finding a Mythic', ok: (s) => totalHours(s) >= 500 && !ownedOfRarity(s, 'mythic') },
  ...SKILLS.map((k) => ({ id: `max-${k.id}`, label: L60[k.id], how: `Reach level 60 ${k.name}`, ok: (s) => levelForXp(s.skills[k.id].xp) >= 60 })),
];
export const TITLE = Object.fromEntries(TITLES.map((t) => [t.id, t]));

// ---------- after every log / sale ----------
// Pays out finished quests and records new achievements and titles.
export function checkProgress(state) {
  const quests = claimQuests(state);
  const achievements = [];
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id]) continue;
    const [have, goal] = a.have(state);
    if (have >= goal) { state.achievements[a.id] = Date.now(); achievements.push(a); }
  }
  state.titlesUnlocked ||= {};
  const titles = [];
  for (const t of TITLES) {
    if (state.titlesUnlocked[t.id] || !t.ok(state)) continue;
    state.titlesUnlocked[t.id] = Date.now();
    titles.push(t);
  }
  if (!state.title && titles.length) state.title = titles[0].id;   // first title is worn automatically
  return { quests, achievements, titles };
}

export const titleLabel = (state) => (state.title && TITLE[state.title] ? TITLE[state.title].label : '');

// Best items owned, rarest first (for the profile card).
export function bestDrops(state, n = 3) {
  return Object.keys(state.everOwned)
    .sort((a, b) => RARITY[ITEM[b].rarity].index - RARITY[ITEM[a].rarity].index)
    .slice(0, n);
}

export { currentStreak, SKILL };
