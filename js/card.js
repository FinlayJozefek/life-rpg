// Shareable profile card, drawn straight onto a canvas so it can be saved or
// sent as an image (1080x1350, a good size for messages and stories).
import { SKILLS, ITEM, RARITY } from './data.js';
import { levelForXp, totalLevel, currentStreak } from './game.js';
import { titleLabel, bestDrops } from './engage.js';
import { buildAvatar, outfitIcon, petIcon } from './sprites2.js';
import { itemSprite } from './sprites.js';
import { tieredIcon } from './skillicons.js';
import { uiIcon } from './uiicons.js';

const W = 1080, H = 1350;
const C = { bg: '#0c0e24', glow: '#23285e', panel: '#161a3a', line: '#2f3670', gold: '#ffc94a', goldDark: '#b88a1c', text: '#eef0ff', muted: '#9aa0cc' };
const SERIF = "'Cinzel', Georgia, serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
const iconFor = (id) => (ITEM[id].type === 'outfit' ? outfitIcon(id) : ITEM[id].type === 'pet' ? petIcon(id) : itemSprite(id));

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = C.panel; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
}

function fitText(ctx, text, maxW, size, weight, family) {
  let s = size;
  do { ctx.font = `${weight} ${s}px ${family}`; s -= 2; } while (ctx.measureText(text).width > maxW && s > 12);
}

export async function drawCard(state) {
  try { await document.fonts.load(`700 60px Cinzel`); } catch {}
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // background + gold frame
  const g = ctx.createRadialGradient(W / 2, 260, 40, W / 2, 260, 900);
  g.addColorStop(0, C.glow); g.addColorStop(1, C.bg);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.goldDark; ctx.lineWidth = 10; ctx.strokeRect(22, 22, W - 44, H - 44);
  ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.strokeRect(38, 38, W - 76, H - 76);

  // header
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.muted; ctx.font = `700 26px ${SERIF}`; ctx.fillText('LIFE RPG', W / 2, 96);
  ctx.fillStyle = C.gold; fitText(ctx, state.name, W - 160, 76, 700, SERIF);
  ctx.shadowColor = '#000'; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4;
  ctx.fillText(state.name, W / 2, 176);
  ctx.shadowColor = 'transparent';
  const title = titleLabel(state);
  if (title) { ctx.fillStyle = C.text; ctx.font = `italic 500 34px ${SERIF}`; ctx.fillText(title, W / 2, 226); }

  // character + pet
  const { grid } = buildAvatar({ head: state.equipped.head, body: state.equipped.body, feet: state.equipped.feet });
  const av = grid.toCanvas(0);
  panel(ctx, 70, 262, 440, 600);
  ctx.drawImage(av, 70 + (440 - 32 * 10) / 2 - 30, 270, 32 * 10, 52 * 10);
  if (state.equipped.pet) {
    const pet = await loadImg(petIcon(state.equipped.pet, { scale: 8 }));
    if (pet) ctx.drawImage(pet, 330, 640, 176, 176);
  }

  // headline stats
  const flameImg = await loadImg(uiIcon('flame', 'color', 3));
  const streak = currentStreak(state);
  const found = Object.keys(state.everOwned).length;
  const stats = [['Total level', totalLevel(state)], ['Day streak', String(streak)], ['Items found', `${found}/288`], ['Coins', state.coins.toLocaleString()]];
  stats.forEach(([label, value], i) => {
    const y = 262 + i * 152;
    panel(ctx, 540, y, 470, 136);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.muted; ctx.font = `600 24px ${SANS}`; ctx.fillText(label.toUpperCase(), 570, y + 46);
    let vx = 570;
    if (label === 'Day streak' && flameImg) { ctx.drawImage(flameImg, 566, y + 58, 60, 60); vx = 634; }
    ctx.fillStyle = label === 'Coins' ? C.gold : C.text; ctx.font = `700 56px ${SERIF}`; ctx.fillText(String(value), vx, y + 110);
  });

  // skills grid
  const skillImgs = await Promise.all(SKILLS.map((s) => loadImg(tieredIcon(s.id, levelForXp(state.skills[s.id].xp), 3))));
  ctx.textAlign = 'left';
  ctx.fillStyle = C.gold; ctx.font = `700 34px ${SERIF}`; ctx.fillText('Skills', 70, 922);
  SKILLS.forEach((s, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 70 + col * 318, y = 944 + row * 68;
    panel(ctx, x, y, 304, 58);
    if (skillImgs[i]) ctx.drawImage(skillImgs[i], x + 6, y + 3, 52, 52);
    ctx.fillStyle = C.text; ctx.font = `600 24px ${SANS}`; ctx.fillText(s.name, x + 62, y + 38);
    ctx.textAlign = 'right'; ctx.fillStyle = C.gold; ctx.font = `700 28px ${SERIF}`;
    ctx.fillText(String(levelForXp(state.skills[s.id].xp)), x + 290, y + 40);
    ctx.textAlign = 'left';
  });

  // best drops (left of footer) + footer
  const best = bestDrops(state, 3);
  ctx.fillStyle = C.gold; ctx.font = `700 26px ${SERIF}`; ctx.fillText('Best drops', 70, 1238);
  let x = 260;
  for (const id of best) {
    const img = await loadImg(iconFor(id));
    if (img) { const r = Math.min(56 / img.width, 56 / img.height); ctx.drawImage(img, x, 1196, img.width * r, img.height * r); }
    ctx.fillStyle = RARITY[ITEM[id].rarity].color; ctx.font = `700 20px ${SANS}`;
    ctx.fillText(ITEM[id].name.length > 16 ? `${ITEM[id].name.slice(0, 15)}…` : ITEM[id].name, x + 62, 1220);
    ctx.fillStyle = C.muted; ctx.font = `600 16px ${SANS}`; ctx.fillText(RARITY[ITEM[id].rarity].name.toUpperCase(), x + 62, 1244);
    x += 260;
  }
  if (!best.length) { ctx.fillStyle = C.muted; ctx.font = `500 22px ${SANS}`; ctx.fillText('None yet: go log something!', 260, 1236); }

  ctx.textAlign = 'center'; ctx.fillStyle = C.muted; ctx.font = `500 22px ${SANS}`;
  ctx.fillText(`${new Date().toLocaleDateString()} · finlayjozefek.github.io/life-rpg`, W / 2, 1296);
  return cv;
}
