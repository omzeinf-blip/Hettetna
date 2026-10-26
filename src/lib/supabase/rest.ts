/**
 * Minimal typed client for Supabase PostgREST. Server-side only.
 * - Reads use the anon (publishable) key; RLS decides what is visible.
 * - Admin calls pass the staff member's access token so RLS applies to THEM.
 * - `service: true` uses the service-role key and bypasses RLS. It is used ONLY for
 *   inserting inquiries and the rate-limit table, after server-side validation.
 */
export class DataError extends Error {
  readonly status: number;
  readonly detail?: string;
  constructor(message: string, status = 500, detail?: string) {
    super(message);
    this.name = "DataError";
    this.status = status;
    this.detail = detail;
  }
}

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function supabaseUrl(): string {
  const url = env("SUPABASE_URL").replace(/\/$/, "");
  if (!url) throw new DataError("supabase_not_configured", 503);
  return url;
}

export function anonKey(): string {
  const key = env("SUPABASE_ANON_KEY");
  if (!key) throw new DataError("supabase_not_configured", 503);
  return key;
}

export function serviceKey(): string {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) throw new DataError("supabase_service_key_missing", 503);
  return key;
}

export function isSupabaseReady(): boolean {
  return Boolean(env("SUPABASE_URL") && env("SUPABASE_ANON_KEY"));
}

export function canWriteInquiries(): boolean {
  return Boolean(env("SUPABASE_URL") && env("SUPABASE_SERVICE_ROLE_KEY"));
}

/** New-style publishable/secret keys are not JWTs and must not be sent as a Bearer token. */
export function authHeaders(key: string, token?: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: key };
  const bearer = token ?? (key.startsWith("eyJ") ? key : undefined);
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  return headers;
}

export type RestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: URLSearchParams | Record<string, string>;
  body?: unknown;
  /** Staff access token. Omit for anonymous (public) access. */
  token?: string;
  /** Use the service-role key (server-only operations). */
  service?: boolean;
  prefer?: string[];
  /** Cache public GET responses (seconds) and tag them for on-demand revalidation. */
  cache?: { revalidate: number; tags?: string[] };
};

export type RestResult<T> = { data: T; count: number | null };

export async function rest<T = unknown>(
  resource: string,
  opts: RestOptions = {},
): Promise<RestResult<T>> {
  if (typeof window !== "undefined") throw new Error("rest() is server-only");
  const base = supabaseUrl();
  const key = opts.service ? serviceKey() : anonKey();
  const method = opts.method ?? "GET";

  const query =
    opts.query instanceof URLSearchParams
      ? opts.query.toString()
      : new URLSearchParams(opts.query ?? {}).toString();
  const url = `${base}/rest/v1/${resource}${query ? `?${query}` : ""}`;

  const headers: Record<string, string> = {
    ...authHeaders(key, opts.service ? undefined : opts.token),
    Accept: "application/json",
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.prefer?.length) headers.Prefer = opts.prefer.join(",");

  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  };
  if (method === "GET" && opts.cache && !opts.token && !opts.service) {
    init.next = { revalidate: opts.cache.revalidate, tags: opts.cache.tags };
  } else {
    init.cache = "no-store";
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new DataError("network_error", 503, String(error));
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new DataError(`supabase_${response.status}`, response.status, detail.slice(0, 500));
  }

  const range = response.headers.get("content-range");
  const countMatch = range?.match(/\/(\d+)$/);
  const count = countMatch ? Number(countMatch[1]) : null;

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new DataError("invalid_json", 502, text.slice(0, 200));
    }
  }
  return { data: data as T, count };
}
