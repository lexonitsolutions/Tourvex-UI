"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../../components/AppProvider";
import { isAbortError, useAdminApi } from "./adminApi";

/*
 * GET helper for every admin list/detail screen.
 *  - request de-duplication: identical in-flight requests (same user, path, query) share ONE network call; the call is aborted only
 *    when every consumer has gone away (AbortController per consumer, ref-counted);
 *  - cancellation: leaving the page, changing a filter or typing again aborts the superseded request;
 *  - stale-while-revalidate: a small in-memory cache answers repeat visits and prefetched pages instantly, then revalidates;
 *  - keep-previous-data: while a NEW key (next page / filter) loads, the previous rows stay on screen (`loading` is true so tables dim
 *    them) instead of flashing empty;
 *  - idle prefetch of the next page when the answer carries `pagination: { page, pages }`.
 * `path` null skips the request. `reload()` always refetches. Never calls setState synchronously inside an effect.
 */

const FRESH_MS = 8000; // an answer this young is used as-is (no refetch): dedupes mount storms and strict-mode double effects
const MAX_ENTRIES = 80;
const cache = new Map(); // key -> { data, at }
const inflight = new Map(); // key -> { controller, refs, promise }

const stable = (query) =>
  JSON.stringify(Object.entries(query || {}).filter(([, v]) => v !== undefined && v !== null && v !== "").sort(([a], [b]) => (a < b ? -1 : 1)));
const keyOf = (scope, path, query) => `${scope}|${path}?${stable(query)}`;

function remember(key, data) {
  cache.delete(key);
  cache.set(key, { data, at: Date.now() });
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
}

/** Shared request. Resolves with the data; rejects with an AbortError as soon as THIS consumer's signal aborts. */
function fetchShared(api, key, path, query, signal) {
  let entry = inflight.get(key);
  if (!entry || entry.controller.signal.aborted) {
    const controller = new AbortController();
    const fresh = { controller, refs: 0, promise: null };
    fresh.promise = api
      .get(path, { query, signal: controller.signal })
      .then((data) => {
        remember(key, data);
        return data;
      })
      .finally(() => {
        if (inflight.get(key) === fresh) inflight.delete(key);
      });
    inflight.set(key, fresh);
    entry = fresh;
  }
  const current = entry;
  current.refs += 1;
  return new Promise((resolve, reject) => {
    let done = false;
    const leave = () => {
      if (done) return false;
      done = true;
      current.refs -= 1;
      return true;
    };
    signal.addEventListener(
      "abort",
      () => {
        if (leave() && current.refs <= 0) current.controller.abort();
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
    current.promise.then(
      (data) => leave() && resolve(data),
      (error) => leave() && reject(error)
    );
  });
}

const idle = (fn) => (typeof requestIdleCallback === "function" ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
const cancelIdle = (id) => (typeof cancelIdleCallback === "function" ? cancelIdleCallback(id) : clearTimeout(id));

export function useAdminQuery(path, query, { prefetchNext = true } = {}) {
  const api = useAdminApi();
  const { user } = useApp();
  const scope = user?.id || "";
  const [tick, setTick] = useState(0);
  const forced = useRef(false);
  const qkey = path ? keyOf(scope, path, query) : null;
  const key = qkey ? `${qkey}#${tick}` : null;
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  });

  useEffect(() => {
    if (!qkey) return undefined;
    const force = forced.current;
    forced.current = false;
    const hit = cache.get(qkey);
    if (hit && !force && Date.now() - hit.at < FRESH_MS) return undefined; // answered from the cache, rendered directly
    const controller = new AbortController();
    fetchShared(api, qkey, path, queryRef.current, controller.signal)
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (isAbortError(error)) return;
        setResult((prev) => ({ key, data: prev.data, error }));
      });
    return () => controller.abort();
    // key already encodes path + query + tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, key]);

  const reload = useCallback(() => {
    forced.current = true;
    setTick((n) => n + 1);
  }, []);

  const hit = qkey ? cache.get(qkey) : null;
  const settled = result.key === key;
  const data = settled ? result.data : hit ? hit.data : result.data;
  const pagination = data?.pagination;
  const page = pagination?.page;
  const pages = pagination?.pages;

  // idle prefetch of the next page (cached; the click then renders instantly and revalidates)
  useEffect(() => {
    if (!prefetchNext || !qkey || !path || !page || !pages || page >= pages) return undefined;
    const controller = new AbortController();
    const nextQuery = { ...(queryRef.current || {}), page: page + 1 };
    const nextKey = keyOf(scope, path, nextQuery);
    if (cache.has(nextKey)) return undefined;
    const id = idle(() => {
      fetchShared(api, nextKey, path, nextQuery, controller.signal).catch(() => {});
    });
    return () => {
      cancelIdle(id);
      controller.abort();
    };
  }, [prefetchNext, qkey, path, page, pages, scope, api]);

  if (!path) return { data: null, error: null, loading: false, refreshing: false, reload };
  return {
    data,
    error: settled ? result.error : null,
    // no answer for THIS key yet and nothing cached for it: callers dim the previous rows (or show skeletons on the first load)
    loading: !settled && !hit,
    // a cached answer is on screen while a fresh one is on its way
    refreshing: !settled && !!hit,
    reload,
  };
}
