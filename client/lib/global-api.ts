// client/lib/global-api.ts (REPLACE THIS FILE WITH THIS VERSION)

// Import the existing API URL creation logic
import { createApiUrl } from "./api";
import { safeReadResponse } from "./response-utils";

/* ──────────────────────────────────────────────────────────────
   Utilities
   ────────────────────────────────────────────────────────────── */

// Read active city (backend often needs it)
function ensureActiveCity(): string {
  try {
    const saved = typeof window !== "undefined" ? localStorage.getItem("active_city") : null;
    return (saved && saved.trim()) || "Rohtak";
  } catch {
    return "Rohtak";
  }
}

// Build a URL string by merging query params; optionally attach ?city=
function mergeQuery(urlStr: string, params?: Record<string, any>, withCity = true): string {
  // Handle absolute or relative URLs robustly
  let url: URL;
  try {
    url = new URL(urlStr, typeof window !== "undefined" ? window.location.origin : "https://dummy.local");
  } catch {
    // last resort: return original string
    return urlStr;
  }

  const q = url.searchParams;

  // auto city
  if (withCity && !q.has("city")) {
    const city = ensureActiveCity();
    if (city) q.set("city", city);
  }

  // merge provided params
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        // allow multiple
        v.forEach((item) => q.append(k, String(item)));
      } else {
        q.set(k, String(v));
      }
    }
  }

  url.search = q.toString();
  // Return relative path for same-origin (keeps Nginx proxy rules happy)
  const isSameOrigin =
    typeof window !== "undefined" && url.origin === window.location.origin;
  return isSameOrigin ? url.pathname + (url.search ? `?${url.searchParams.toString()}` : "") : url.toString();
}

/* ──────────────────────────────────────────────────────────────
   Wrap native fetch for safer timeouts/network errors (unchanged behavior)
   ────────────────────────────────────────────────────────────── */

if (typeof window !== "undefined" && typeof window.fetch === "function") {
  const _nativeFetch = window.fetch.bind(window);
  (window as any).fetch = (...args: any[]) => {
    try {
      const p = _nativeFetch(...args);
      return p.catch((err: any) => {
        const message = err?.message || String(err);
        if (
          err?.name === "AbortError" ||
          String(message).toLowerCase().includes("aborted") ||
          String(message).toLowerCase().includes("timeout")
        ) {
          console.debug("Fetch aborted/timeout (normalized):", message);
          return Promise.resolve({
            ok: false,
            status: 408,
            async json() { return { error: "timeout" }; },
            async text() { return ""; },
            clone() { return this; },
          } as any);
        }
        console.error("Wrapped fetch network error:", message || err);
        return {
          ok: false,
          status: 0,
          async json() { return { error: "Network error" }; },
          async text() { return ""; },
          clone() { return this; },
        } as any;
      });
    } catch (err) {
      if (
        (err as any)?.name === "AbortError" ||
        String((err as any)?.message || "").toLowerCase().includes("aborted") ||
        String((err as any)?.message || "").toLowerCase().includes("timeout")
      ) {
        return Promise.reject(err);
      }
      console.error("Wrapped fetch unexpected error:", err);
      return Promise.resolve({
        ok: false,
        status: 0,
        async json() { return { error: "Network error" }; },
        async text() { return ""; },
        clone() { return this; },
      } as any);
    }
  };
}

/* ──────────────────────────────────────────────────────────────
   Main API helper
   ────────────────────────────────────────────────────────────── */

type Transport = "fetch" | "xhr";

interface ApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;                // object|string
  params?: Record<string, any>; // NEW: query params
  timeout?: number;          // ms
  retry?: number;            // transient retry count (502/503/504)
  withCity?: boolean;        // attach ?city= (default: true)
  credentials?: RequestCredentials; // "include" by default
  cache?: RequestCache;      // default "no-store"
  keepalive?: boolean;
  transport?: Transport;     // force 'xhr'
}

// Make API helper available globally
async function api(p: string, o: ApiOptions = {}) {
  const t = localStorage.getItem("token");

  // Build base URL (from your existing logic)
  const baseUrl = createApiUrl(p);

  // Merge query params + ?city
  const finalUrl = mergeQuery(baseUrl, o.params, o.withCity !== false);

  // Prepare body & headers
  let bodyContent: any;
  if (o.body !== undefined && o.body !== null) {
    bodyContent = typeof o.body === "string" ? o.body : JSON.stringify(o.body);
  }

  const method = (o.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    "x-client": "web",              // helpful for backend logs / filters
    Accept: "application/json",
    ...(o.headers || {}),
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
  if (bodyContent && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timeoutMs = typeof o.timeout === "number" ? o.timeout : 10000;
  const timeoutId = setTimeout(() => {
    try { controller.abort(); } catch {}
    console.warn(`⏰ API request timeout after ${timeoutMs}ms:`, finalUrl);
  }, timeoutMs);

  const credentials = o.credentials || "include";
  const cache = o.cache || "no-store";
  const retryLeft = typeof o.retry === "number" ? o.retry : 1; // default 1 retry

  const doFetch = async (): Promise<Response> => {
    return fetch(finalUrl, {
      method,
      headers,
      body: bodyContent,
      signal: controller.signal,
      keepalive: !!o.keepalive,
      credentials,
      cache,
      referrerPolicy: "no-referrer",
    });
  };

  const xhrFallback = () =>
    new Promise<{ ok: boolean; status: number; data: any }>((resolve) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open(method, finalUrl, true);
        Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        xhr.timeout = timeoutMs;
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            let parsed: any = {};
            try { parsed = xhr.responseText ? JSON.parse(xhr.responseText) : {}; }
            catch { parsed = { raw: xhr.responseText }; }
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              data: parsed,
            });
          }
        };
        xhr.ontimeout = () => resolve({ ok: false, status: 408, data: { error: "Request timeout" } });
        xhr.onerror  = () => resolve({ ok: false, status: 0,   data: { error: "Network error" } });
        xhr.send(bodyContent || null);
      } catch (e: any) {
        resolve({ ok: false, status: 0, data: { error: e?.message || "Network error" } });
      }
    });

  const fetchFlow = async (): Promise<{ ok: boolean; status: number; data: any }> => {
    let attempts = retryLeft + 1;
    let lastStatus = 0;

    while (attempts-- > 0) {
      const res = await doFetch().catch((e) => {
        // Convert thrown to a Response-like timeout; outer safeReadResponse will normalize
        lastStatus = 0;
        return null as any;
      });

      if (!res) {
        // network exception; retry or break
        if (attempts > 0) { await new Promise((r) => setTimeout(r, 250)); continue; }
        return { ok: false, status: 0, data: { error: "Network error" } };
      }

      const { ok, status, data } = await safeReadResponse(res);

      // transient retry on 502/503/504
      if (!ok && [502, 503, 504].includes(status) && attempts > 0) {
        lastStatus = status;
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }
      return { ok, status, data };
    }

    return { ok: false, status: lastStatus || 0, data: { error: "Network error" } };
  };

  // Force XHR?
  if (o.transport === "xhr") {
    const res = await xhrFallback();
    clearTimeout(timeoutId);
    return { ok: res.ok, status: res.status, success: res.ok, data: res.data, json: res.data } as any;
  }

  try {
    const res = await fetchFlow();
    clearTimeout(timeoutId);

    console.log("✅ Global API response", { url: finalUrl, status: res.status, ok: res.ok });
    return { ok: res.ok, status: res.status, success: res.ok, data: res.data, json: res.data } as any;
  } catch (error: any) {
    // Fallback to XHR
    console.warn("⚠️ fetch failed, attempting XHR fallback:", finalUrl, error?.message || error);
    const res = await xhrFallback();
    clearTimeout(timeoutId);
    return { ok: res.ok, status: res.status, success: res.ok, data: res.data, json: res.data } as any;
  }
}

// Make it globally available
(window as any).api = api;

export { api };
