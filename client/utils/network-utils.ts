// Network utility functions for handling fetch errors and connectivity issues

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public code: string,
    public isRetryable: boolean = false,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

export async function safeFetch(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const {
    timeout = 10000,
    retries = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  // Compose timeout signal with any external signal
  const controller = new AbortController();
  const externalSignal = (fetchOptions as any).signal as
    | AbortSignal
    | undefined;
  const onExternalAbort = () =>
    controller.abort(externalSignal?.reason || "external-abort");
  if (externalSignal) {
    if (externalSignal.aborted)
      controller.abort(externalSignal.reason || "external-abort");
    else externalSignal.addEventListener("abort", onExternalAbort);
  }
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
        Accept: "application/json",
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);
    if (externalSignal)
      externalSignal.removeEventListener("abort", onExternalAbort);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (externalSignal)
      externalSignal.removeEventListener("abort", onExternalAbort);

    // Handle different types of errors
    if (error.name === "AbortError") {
      const reason =
        (error as any)?.cause ||
        (controller as any)?.signal?.reason ||
        "timeout";
      throw new NetworkError(
        `Request aborted (${String(reason)}) after ${timeout}ms`,
        "TIMEOUT",
        true,
      );
    }

    if (
      error.message?.includes("Failed to fetch") ||
      error.name === "TypeError"
    ) {
      throw new NetworkError(
        "Network connectivity issue",
        "CONNECTIVITY",
        true,
      );
    }

    // For other errors, check if retry is possible
    if (retries > 0) {
      console.log(
        `🔄 Retrying fetch in ${retryDelay}ms (${retries} retries left)`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return safeFetch(url, { ...options, retries: retries - 1 });
    }

    throw new NetworkError(
      error.message || "Unknown network error",
      "UNKNOWN",
      false,
    );
  }
}

export async function fetchWithFallback<T>(
  url: string,
  fallbackData: T,
  options: FetchOptions = {},
): Promise<{ data: T; isFromCache: boolean }> {
  try {
    const response = await safeFetch(url, { retries: 1, ...options });

    if (response.ok) {
      const data = await response.json();
      return { data, isFromCache: false };
    } else {
      console.warn(`❌ API returned ${response.status} for ${url}`);
      return { data: fallbackData, isFromCache: true };
    }
  } catch (error) {
    if (error instanceof NetworkError) {
      console.warn(`🌐 ${error.message} for ${url}, using fallback`);
    } else {
      console.error(`❌ Unexpected error fetching ${url}:`, error);
    }
    return { data: fallbackData, isFromCache: true };
  }
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function addNetworkStatusListeners(
  onOnline: () => void,
  onOffline: () => void,
): () => void {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
