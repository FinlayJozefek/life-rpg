// Auto-update. version.json changes whenever the code changes:
//  - locally, serve.mjs reports the newest file change time
//  - on GitHub Pages, the deploy workflow writes the commit id
// When it changes we reload to pick up the new code. Progress is safe: it's saved
// to the device after every action, separately from the code.

const isDev = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
const CHECK_EVERY_MS = isDev ? 1500 : 5 * 60 * 1000;

let current = null;
let pendingReload = false;

async function fetchVersion() {
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()).version ?? null;
  } catch {
    return null; // offline
  }
}

// Don't yank the screen away mid-action (e.g. while the log sheet or a drop
// reveal is open): wait until no pop-up is showing.
function reloadWhenIdle(isBusy) {
  pendingReload = true;
  const tryReload = () => {
    if (isBusy()) return setTimeout(tryReload, 1000);
    try { sessionStorage.setItem('liferpg.quickStart', '1'); } catch {}   // skip the splash after updating
    location.reload();
  };
  tryReload();
}

async function check(isBusy) {
  if (pendingReload || document.visibilityState !== 'visible') return;
  const v = await fetchVersion();
  if (v === null) return;
  if (current === null) { current = v; return; }
  if (v !== current) reloadWhenIdle(isBusy);
}

export function startAutoUpdate({ isBusy }) {
  check(isBusy);
  setInterval(() => check(isBusy), CHECK_EVERY_MS);
  // Phones resume home-screen apps without reloading, so check on every return.
  document.addEventListener('visibilitychange', () => check(isBusy));
  window.addEventListener('focus', () => check(isBusy));
}
