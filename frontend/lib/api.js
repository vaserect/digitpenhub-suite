// Set once by AppShell on mount so any `upgradeRequired` response (a locked
// module, or a plan usage limit reached) can surface the upgrade modal
// automatically, without every single call site needing to check for it.
let upgradeHandler = null;
export function setUpgradeHandler(fn) {
  upgradeHandler = fn;
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.upgradeRequired && upgradeHandler) upgradeHandler(data);
    const err = new Error(data.error || 'Request failed.');
    err.upgradeRequired = !!data.upgradeRequired;
    throw err;
  }
  return data;
}
