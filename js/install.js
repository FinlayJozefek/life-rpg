// "Add to Home Screen" help. iPhones have no install button for websites, so we
// show step-by-step instructions; Android/desktop Chrome gets a real Install button.

const ua = navigator.userAgent;
export const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = /Android/.test(ua);
// Links opened from these apps load in a built-in browser that can't install web apps.
export const inAppBrowser = /FBAN|FBAV|FB_IAB|Instagram|Snapchat|Line\/|MicroMessenger|TikTok|musical_ly|Twitter|LinkedInApp|GSA\//.test(ua);
const iosNonSafari = isIOS && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

let deferredPrompt = null;
const listeners = new Set();
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  listeners.forEach((fn) => fn());
});
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  listeners.forEach((fn) => fn());
});
export const onInstallChange = (fn) => listeners.add(fn);
export const canPromptInstall = () => !!deferredPrompt;

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
}

const SHARE_ICON = `<svg class="ios-share" viewBox="0 0 20 24" aria-label="Share icon"><path d="M10 1v14M5 6l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 10H2v13h16V10h-4" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

// HTML for the install instructions sheet.
export function installInstructions() {
  if (inAppBrowser) {
    return `
      <h2>Open in your browser first</h2>
      <p>You've opened Life RPG inside another app, which can't add it to your home screen.</p>
      <ol class="steps">
        <li>Tap the <b>⋯</b> or <b>share</b> menu in this app.</li>
        <li>Choose <b>Open in ${isIOS ? 'Safari' : 'browser'}</b>.</li>
        <li>Then come back to this screen for the next steps.</li>
      </ol>`;
  }
  if (isIOS) {
    return `
      <h2>Add Life RPG to your iPhone</h2>
      <ol class="steps">
        <li>Tap the <b>Share</b> button ${SHARE_ICON} ${iosNonSafari ? 'in the toolbar (or the ⋯ menu)' : 'at the bottom of Safari'}.</li>
        <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
        <li>Tap <b>Add</b>, then open <b>Life RPG</b> from your home screen.</li>
      </ol>
      ${iosNonSafari ? '<p class="hint">If you don\'t see "Add to Home Screen", open this page in Safari instead.</p>' : ''}
      <p class="hint">Start playing from the home screen icon. Progress made here in the browser stays in the browser and won't carry over to the app.</p>`;
  }
  if (canPromptInstall()) {
    return `
      <h2>Install Life RPG</h2>
      <p>Add it to your home screen so it opens like a normal app, full screen, and works offline.</p>
      <button class="btn primary wide" data-action="install-now">Install</button>`;
  }
  return `
    <h2>Add Life RPG to your home screen</h2>
    <ol class="steps">
      <li>Open your browser's menu (<b>⋮</b>).</li>
      <li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li>
      <li>Open <b>Life RPG</b> from your home screen.</li>
    </ol>`;
}
