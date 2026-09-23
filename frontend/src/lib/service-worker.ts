/**
 * The off switch for the service worker, and the thing that turns it on.
 *
 * A service worker is the only code Ani ships that outlives the page that
 * installed it. Ordinary code is fixed by deploying a fix; a worker keeps
 * running on somebody's phone until something removes it, and "clear your site
 * data" is not an instruction you can give a farmer in Caibiran over Messenger.
 *
 * So the removal path exists first and does not depend on the worker behaving.
 * Publishing `off` in `/sw-enabled` unregisters the worker on every device
 * that opens the app, with no deploy.
 */

const FLAG_URL = '/sw-enabled';
const SW_URL = '/sw.js';

/**
 * A fetch failure must never read as `off`. A phone on a bad signal would
 * otherwise unregister the worker every time the connection dropped, which is
 * the opposite of durable.
 */
async function killSwitchThrown(): Promise<boolean> {
  try {
    const response = await fetch(FLAG_URL, { cache: 'no-store' });
    if (!response.ok) return false;
    return (await response.text()).trim() !== 'on';
  } catch {
    return false;
  }
}

async function unregisterEverything(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch {
    // Nothing registered, or the API is unavailable. Absence is the goal.
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Same: failing to delete nothing is fine.
  }
}

export async function serviceWorkersPermitted(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  // An escape hatch for one person on one device while the flag stays `on`
  // for everyone else: send them a link ending in ?sw=off.
  const forcedOff = new URLSearchParams(window.location.search).get('sw') === 'off';

  if (forcedOff || (await killSwitchThrown())) {
    await unregisterEverything();
    return false;
  }

  return true;
}

export async function registerServiceWorker(): Promise<void> {
  if (!(await serviceWorkersPermitted())) return;

  try {
    const head = await fetch(SW_URL, { method: 'HEAD', cache: 'no-store' });
    if (!head.ok) return;
    await navigator.serviceWorker.register(SW_URL, { scope: '/' });
  } catch {
    // A worker that will not register leaves a working app. Nothing to say.
  }
}
