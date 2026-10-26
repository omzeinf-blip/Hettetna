import { createHmac } from "node:crypto";
import { canWriteInquiries, rest } from "@/lib/supabase/rest";

type Limit = { limit: number; windowSeconds: number };

function digest(value: string): string {
  const secret = process.env.RATE_LIMIT_SECRET || process.env.SUPABASE_URL || "hettetna";
  return createHmac("sha256", secret).update(value).digest("hex").slice(0, 40);
}

/** Best-effort client IP behind Vercel / proxies. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Database-backed rate limit (survives restarts and works across serverless instances).
 * Only a keyed hash of the IP is stored, never the IP itself.
 * Returns `allowed:false` when the limit is exceeded.
 */
export async function consumeRateLimit(
  scope: string,
  rawKey: string,
  { limit, windowSeconds }: Limit,
): Promise<{ allowed: boolean }> {
  if (!canWriteInquiries()) return { allowed: true };
  const key = digest(rawKey);
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { count } = await rest("rate_limit_hits", {
    service: true,
    query: { select: "id", scope: `eq.${scope}`, key: `eq.${key}`, created_at: `gte.${since}`, limit: "1" },
    prefer: ["count=exact"],
  });
  if ((count ?? 0) >= limit) return { allowed: false };

  await rest("rate_limit_hits", {
    method: "POST",
    service: true,
    body: { scope, key },
    prefer: ["return=minimal"],
  });

  if (Math.random() < 0.02) {
    const old = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    void rest("rate_limit_hits", {
      method: "DELETE",
      service: true,
      query: { created_at: `lt.${old}` },
      prefer: ["return=minimal"],
    }).catch(() => undefined);
  }
  return { allowed: true };
}
