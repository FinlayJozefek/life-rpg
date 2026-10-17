// Visual celebrations: confetti, screen shake and a coloured flash.
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function confetti({ count = 90, colors = ['#ffc94a', '#3ee0a0', '#4a90e2', '#e8435a', '#b98bff'], duration = 2200 } = {}) {
  if (reduceMotion()) return;
  const cv = document.createElement('canvas');
  cv.className = 'confetti';
  cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const s = devicePixelRatio;
  const parts = Array.from({ length: count }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 11 - 4,
    size: 4 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
    col: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  const frame = (t) => {
    const k = (t - start) / duration;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of parts) {
      p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, k - 0.7) / 0.3);
      ctx.translate(p.x * s, p.y * s); ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      ctx.fillRect(-p.size * s / 2, -p.size * s / 4, p.size * s, p.size * s / 2);
      ctx.restore();
    }
    if (k < 1) requestAnimationFrame(frame); else cv.remove();
  };
  requestAnimationFrame(frame);
  setTimeout(() => cv.remove(), duration + 500);   // in case animation frames are paused
}

export function shake(el = document.body, strong = false) {
  if (reduceMotion()) return;
  el.classList.remove('shake', 'shake-strong');
  void el.offsetWidth;                               // restart the animation
  el.classList.add(strong ? 'shake-strong' : 'shake');
  setTimeout(() => el.classList.remove('shake', 'shake-strong'), 700);
}

export function flash(color) {
  const f = document.createElement('div');
  f.className = 'flash';
  f.style.background = `radial-gradient(circle at 50% 45%, ${color} 0%, transparent 70%)`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1200);
}

export function vibrate(pattern) { try { navigator.vibrate?.(pattern); } catch {} }
