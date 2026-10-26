import type { AuthSession } from "@/lib/supabase/auth";

export const ACCESS_COOKIE = "ht_at";
export const REFRESH_COOKIE = "ht_rt";

type CookieSetter = {
  set(name: string, value: string, options: Record<string, unknown>): unknown;
  delete?(name: string): unknown;
};

const base = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});

export function writeSessionCookies(jar: CookieSetter, session: AuthSession) {
  jar.set(ACCESS_COOKIE, session.access_token, {
    ...base(),
    maxAge: Math.max(60, Math.floor(session.expires_in || 3600)),
  });
  jar.set(REFRESH_COOKIE, session.refresh_token, { ...base(), maxAge: 60 * 60 * 24 * 30 });
}

export function clearSessionCookies(jar: CookieSetter) {
  jar.set(ACCESS_COOKIE, "", { ...base(), maxAge: 0 });
  jar.set(REFRESH_COOKIE, "", { ...base(), maxAge: 0 });
}

/** Only allow redirects to admin pages (prevents open redirects). */
export function safeAdminPath(value: unknown): string {
  if (typeof value !== "string") return "/admin";
  if (value !== "/admin" && !value.startsWith("/admin/")) return "/admin";
  if (value.startsWith("//") || value.includes("\\")) return "/admin";
  return value;
}
