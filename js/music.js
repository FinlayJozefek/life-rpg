// Background music, played live with Web Audio (no music files to download).
// Two moods that cross-fade: 'calm' (menus and the tower: soft drifting pads, a low drone, twinkling bells)
// and 'battle' (darker chords, a heartbeat drum, a plucked minor riff). Starts after the first tap (phone rule).
import { audioCtx } from './sfx.js';

let enabled = true;
try { enabled = localStorage.getItem('liferpg.pref.music') !== '0'; } catch {}
export const isOn = () => enabled;

let out = null, echo = null, started = false, mood = 'calm', timer = null, nextBar = 0, bar = 0;
const moods = {};   // mood -> its own gain node, so the two can cross-fade
const N = (semis) => 220 * 2 ** (semis / 12);   // semitones from A3

// chord progressions (semitones from A3); calm drifts around A minor, battle is a darker D minor loop
const CALM = [[0, 3, 7, 12], [-4, 0, 3, 8], [-9, -5, -2, 3], [-2, 2, 5, 10]];          // Am  F  C  G
const BATTLE = [[5, 8, 12, 17], [1, 5, 8, 13], [-2, 2, 5, 10], [4, 8, 11, 16]];       // Dm  Bb Gm A
const BELLS = [12, 15, 17, 19, 22, 24, 27];                                            // A minor pentatonic, up high
const BAR = { calm: 8, battle: 2.67 };                                                  // seconds per chord

function setup(ctx) {
  out = ctx.createGain(); out.gain.value = 0.0001; out.connect(ctx.destination);
  // a simple echo for space: delay -> lowpass -> feedback
  echo = ctx.createDelay(1); echo.delayTime.value = 0.42;
  const fb = ctx.createGain(); fb.gain.value = 0.38;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
  echo.connect(lp).connect(fb).connect(echo); lp.connect(out);
  for (const m of ['calm', 'battle']) { const g = ctx.createGain(); g.gain.value = m === mood ? 1 : 0.0001; g.connect(out); g.connect(echo); moods[m] = g; }
}

function voice(ctx, dest, freq, at, dur, { type = 'sine', vol = 0.05, attack = 1.5, detune = 0 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(vol, at + attack);
  g.gain.setValueAtTime(vol, at + Math.max(attack, dur - 1.5));
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 1.5);
  o.connect(g).connect(dest); o.start(at); o.stop(at + dur + 1.6);
}
function bell(ctx, dest, freq, at, vol = 0.035) {
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = freq; o2.type = 'sine'; o2.frequency.value = freq * 2.76;   // a bell-like overtone
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + 3);
  const g2 = ctx.createGain(); g2.gain.value = 0.25;
  o.connect(g); o2.connect(g2).connect(g); g.connect(dest);
  o.start(at); o2.start(at); o.stop(at + 3.1); o2.stop(at + 3.1);
}
function drum(ctx, dest, at, vol = 0.22) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(110, at); o.frequency.exponentialRampToValueAtTime(42, at + 0.25);
  g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
  o.connect(g).connect(dest); o.start(at); o.stop(at + 0.45);
}

// schedule one chord-length of music for each mood (only the audible one costs anything noticeable)
function scheduleBar(ctx, at) {
  const m = mood, dest = moods[m];
  if (m === 'calm') {
    const ch = CALM[bar % CALM.length], len = BAR.calm;
    ch.forEach((s, i) => { voice(ctx, dest, N(s), at, len, { type: 'triangle', vol: 0.022, attack: 2.5, detune: -6 }); voice(ctx, dest, N(s), at, len, { vol: 0.02, attack: 2.5, detune: 7 + i }); });
    voice(ctx, dest, N(ch[0] - 24), at, len, { vol: 0.05, attack: 3 });                               // low drone
    for (let t = 0.6; t < len; t += 0.9 + Math.random() * 1.6) if (Math.random() < 0.7) bell(ctx, dest, N(BELLS[Math.floor(Math.random() * BELLS.length)]), at + t);
  } else {
    const ch = BATTLE[bar % BATTLE.length], len = BAR.battle;
    ch.forEach((s) => voice(ctx, dest, N(s - 12), at, len, { type: 'sawtooth', vol: 0.008, attack: 0.4 }));
    voice(ctx, dest, N(ch[0] - 24), at, len, { type: 'triangle', vol: 0.07, attack: 0.2 });
    const beat = len / 4;
    [0, 1, 2, 2.5, 3].forEach((b, i) => drum(ctx, dest, at + b * beat, i === 0 ? 0.26 : 0.16));                      // heartbeat drum
    [0, 2, 1, 3].forEach((k, i) => bell(ctx, dest, N(ch[k] + 12), at + i * beat + beat * 0.5, 0.025));             // plucked riff
  }
  bar++;
}

function loop() {
  const ctx = audioCtx();
  if (!ctx || !enabled) return;
  while (nextBar < ctx.currentTime + 1.5) { scheduleBar(ctx, nextBar); nextBar += BAR[mood]; }
}

// call on any tap: starts the music the first time sound is allowed
export function start() {
  const ctx = audioCtx();
  if (!enabled || !ctx || started) return;
  started = true;
  if (!out) setup(ctx);
  nextBar = ctx.currentTime + 0.2;
  out.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 4);   // fade in
  timer = setInterval(loop, 400);
  loop();
}
export function setMood(m) {
  if (m === mood) return;
  mood = m;
  const ctx = audioCtx();
  if (!ctx || !started) return;
  const t = ctx.currentTime;
  for (const [k, g] of Object.entries(moods)) { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(k === m ? 1 : 0.0001, t, 0.6); }
  nextBar = Math.min(nextBar, t + 0.3);   // start the new mood's pattern straight away
}
export function setOn(on) {
  enabled = on;
  try { localStorage.setItem('liferpg.pref.music', on ? '1' : '0'); } catch {}
  const ctx = audioCtx();
  if (!on) { if (out && ctx) out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3); clearInterval(timer); started = false; }
  else start();
}
// quiet when the game is in the background
document.addEventListener('visibilitychange', () => {
  const ctx = audioCtx();
  if (!ctx || !out) return;
  out.gain.setTargetAtTime(document.hidden ? 0.0001 : 0.9, ctx.currentTime, 0.3);
});
