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
    // 404 from the Express catch-all router means the route doesn't exist.
    // Surface a helpful message instead of the raw "Not found." server text.
    if (res.status === 404) {
      const err = new Error(data.error === 'Not found.'
        ? `This endpoint (${path}) isn't ready yet.`
        : (data.error || `The server returned a ${res.status} error.`));
      err.status = 404;
      throw err;
    }
    const err = new Error(data.error || `Request failed (${res.status}).`);
    err.upgradeRequired = !!data.upgradeRequired;
    throw err;
  }
  return data;
}
