// src/lib/apiClient.ts

type Json = Record<string, any>;

const BASE_URL =
  (import.meta.env && (import.meta.env as any).VITE_API_BASE_URL) || "/api";

/** Try multiple common keys so seller/user/admin ALL work */
function readAnyToken(): string {
  const keys = [
    "adminToken",
    "sellerToken",
    "userToken",
    "authToken",
    "token",
  ];
  try {
    for (const k of keys) {
      const v = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (v) return v;
    }
  } catch {
    /* ignore */
  }
  return "";
}

function clearAllTokens() {
  const keys = [
    "adminToken",
    "sellerToken",
    "userToken",
    "authToken",
    "token",
  ];
  try {
    for (const k of keys) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

function setPrimaryToken(tok: string | null) {
  try {
    if (tok) localStorage.setItem("adminToken", tok);
    else clearAllTokens();
  } catch {
    /* ignore */
  }
}

/** Best-effort decode to check exp without throwing */
function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload?.exp;
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return false;
  }
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname || "";
  const to = path.includes("/seller")
    ? "/seller-login?reason=expired"
    : path.includes("/admin")
    ? "/admin/login?reason=expired"
    : "/login?reason=expired";
  window.location.replace(to);
}

export const apiClient = {
  baseUrl: String(BASE_URL || "/api"),

  createUrl(endpoint: string) {
    const base = this.baseUrl.replace(/\/$/, "");
    const ep = String(endpoint || "").replace(/^\/+/, "");
    return `${base}/${ep}`.replace(/([^:]\/)\/+/g, "$1");
  },

  async request<T = any>(input: string, init: RequestInit = {}): Promise<T> {
    const url = this.createUrl(input);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const callerHeaders = (init.headers as Record<string, string>) || {};
      let token = readAnyToken();

      // Skip sending obviously expired tokens
      if (token && isJwtExpired(token)) {
        clearAllTokens();
        token = "";
      }

      const isForm =
        init.body &&
        typeof FormData !== "undefined" &&
        init.body instanceof FormData;

      const headers: Record<string, string> = {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...callerHeaders,
      };

      if (token && !("Authorization" in headers)) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });

      let raw: string | null = null;
      try {
        raw = await res.text();
      } catch {
        raw = null;
      } finally {
        clearTimeout(timeout);
      }

      let data: any = null;
      if (raw && raw.length) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
      }

      if (!res.ok) {
        // Treat both 401 and 403 as auth failures
        if (
          res.status === 401 ||
          res.status === 403 ||
          (typeof data === "object" &&
            data &&
            /invalid|expired token/i.test(String(data.message || data.error || "")))
        ) {
          clearAllTokens();
          redirectToLogin();
        }

        const err: any = new Error(
          (data && (data.message || data.error)) || `HTTP ${res.status}`
        );
        err.status = res.status;
        err.data = data;
        throw err;
      }

      return (data as T) ?? ({} as T);
    } catch (err: any) {
      clearTimeout(timeout);
      if (err?.name === "AbortError") {
        const e: any = new Error("Request timed out");
        e.status = 0;
        throw e;
      }
      throw err;
    }
  },

get<T = any>(input: string) {
  return this.request<T>(input, { method: "GET" });
},

post<T = any>(input: string, body?: Json | FormData) {
  const isForm =
    typeof FormData !== "undefined" && body instanceof FormData;
  return this.request<T>(input, {
    method: "POST",
    body: isForm
      ? (body as FormData)
      : body
      ? JSON.stringify(body)
      : undefined,
  });
},

put<T = any>(input: string, body?: Json | FormData) {
  const isForm =
    typeof FormData !== "undefined" && body instanceof FormData;
  return this.request<T>(input, {
    method: "PUT",
    body: isForm
      ? (body as FormData)
      : body
      ? JSON.stringify(body)
      : undefined,
  });
},

delete<T = any>(input: string) {
  return this.request<T>(input, { method: "DELETE" });
},


  // optional helpers
  setToken(token: string) {
    setPrimaryToken(token);
  },
  clearToken() {
    clearAllTokens();
  },
};
