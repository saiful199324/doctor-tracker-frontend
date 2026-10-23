type Params = Record<string, string | number | undefined | null>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Params;
  signal?: AbortSignal;
}

function toQueryString(params?: Params): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

let redirectingToLogin = false;

async function handleUnauthorized() {
  if (typeof window === 'undefined' || redirectingToLogin) return;
  redirectingToLogin = true;
  // Clear the stale cookie first, otherwise the route guard would bounce us back.
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/login?next=${next}`);
}

/** Thin fetch wrapper for the REST API (proxied same-origin via next.config rewrites). */
export async function api<T>(path: string, { method = 'GET', body, params, signal }: RequestOptions = {}): Promise<T> {
  const res = await fetch(`/api${path}${toQueryString(params)}`, {
    method,
    signal,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) void handleUnauthorized();
    throw new ApiError(res.status, json?.message ?? `Request failed (${res.status})`, json?.errors);
  }

  return json as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return 'Something went wrong';
}
