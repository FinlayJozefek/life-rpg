// Sound effects, synthesised with Web Audio (no sound files to download).
// Phones only allow sound after a tap, so unlock() is called on the first tap.
let ctx = null;
let muted = false;
try { muted = localStorage.getItem('liferpg.pref.muted') === '1'; } catch {}

export const isMuted = () => muted;
export function setMuted(m) { muted = m; try { localStorage.setItem('liferpg.pref.muted', m ? '1' : '0'); } catch {} }

export function unlock() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
}

// One note with a soft attack and decay.
function note(freq, { at = 0, dur = 0.18, type = 'triangle', vol = 0.12, slide = 0 } = {}) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// Short burst of noise, for booms and whooshes.
function noise({ at = 0, dur = 0.4, vol = 0.15, from = 800, to = 80 } = {}) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + at;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(t);
}

const N = (semis) => 440 * 2 ** (semis / 12);   // semitones from A4

// Each rarity sounds a step grander than the last.
export function dropSound(rarityIndex) {
  switch (rarityIndex) {
    case 0: note(N(3), { dur: 0.09, vol: 0.06 }); break;                                           // common: quiet blip
    case 1: note(N(3), { dur: 0.1, vol: 0.08 }); note(N(7), { at: 0.07, dur: 0.12, vol: 0.08 }); break;
    case 2: [3, 7, 10].forEach((s, i) => note(N(s), { at: i * 0.06, dur: 0.16, vol: 0.09 })); break;  // rare: arpeggio
    case 3: [3, 7, 10, 15].forEach((s, i) => note(N(s), { at: i * 0.06, dur: 0.22, vol: 0.09, type: 'square' }));
      note(N(22), { at: 0.26, dur: 0.4, vol: 0.04, type: 'sine' }); break;                         // epic: shimmer
    case 4: [-2, 2, 5, 10].forEach((s) => note(N(s), { dur: 0.6, vol: 0.06 }));                    // legendary: chord
      [14, 17, 22, 26].forEach((s, i) => note(N(s), { at: 0.15 + i * 0.07, dur: 0.3, vol: 0.05, type: 'sine' })); break;
    case 5: noise({ dur: 0.7, vol: 0.22, from: 400, to: 40 }); note(N(-21), { dur: 0.8, vol: 0.18, type: 'sine', slide: 0.5 });  // mythic: boom
      [3, 7, 10, 15, 19, 22].forEach((s, i) => note(N(s), { at: 0.25 + i * 0.07, dur: 0.35, vol: 0.07, type: 'square' })); break;
    default: noise({ dur: 1.0, vol: 0.18, from: 2500, to: 200 });                                    // divine: choir + bells
      [-9, -5, -2, 3].forEach((s) => note(N(s), { dur: 1.6, vol: 0.06, type: 'sine' }));
      [15, 19, 22, 27, 31, 34].forEach((s, i) => note(N(s), { at: 0.3 + i * 0.1, dur: 0.6, vol: 0.06, type: 'triangle' }));
  }
}

export function levelUpSound(milestone = false) {
  const steps = milestone ? [0, 4, 7, 12, 16, 19, 24] : [0, 4, 7, 12];
  steps.forEach((s, i) => note(N(s + 3), { at: i * 0.09, dur: 0.25, vol: 0.1, type: 'square' }));
  const end = steps.length * 0.09;
  [3, 7, 10, 15].forEach((s) => note(N(s + (milestone ? 12 : 0)), { at: end, dur: milestone ? 1.2 : 0.6, vol: 0.06 }));
  if (milestone) noise({ at: end, dur: 0.8, vol: 0.12, from: 3000, to: 300 });
}

export function chime() { [15, 22].forEach((s, i) => note(N(s), { at: i * 0.1, dur: 0.35, vol: 0.07, type: 'sine' })); }
