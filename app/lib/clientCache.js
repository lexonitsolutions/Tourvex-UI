/**
 * Browser-side request cache: identical GETs made within `ttl` share one network call (in flight or finished),
 * so the home page, listings and search never refetch what the visitor just loaded. Failed requests are not kept.
 * Server rendering has its own cache (`next: { revalidate }`), so this is for the browser only.
 */

const store = new Map();
const MAX_ENTRIES = 80;

export function cachedRequest(key, fetcher, { ttl = 60_000 } = {}) {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.promise;

  const promise = fetcher().catch((error) => {
    if (store.get(key)?.promise === promise) store.delete(key);
    throw error;
  });
  store.delete(key);
  store.set(key, { at: Date.now(), promise });
  if (store.size > MAX_ENTRIES) store.delete(store.keys().next().value);
  return promise;
}

const abortError = () => Object.assign(new Error("Aborted"), { name: "AbortError" });

/** Lets one consumer abandon a shared request without cancelling it for everyone else. */
export function withSignal(promise, signal) {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    signal.addEventListener("abort", () => reject(abortError()), { once: true });
    promise.then(resolve, reject);
  });
}
