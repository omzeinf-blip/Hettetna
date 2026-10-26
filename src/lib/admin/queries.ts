import { rest } from "@/lib/supabase/rest";

export const ADMIN_PAGE_SIZE = 20;
export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function adminCount(token: string, table: string, filter: Record<string, string> = {}) {
  const { count } = await rest(table, {
    token,
    query: { select: "id", limit: "1", ...filter },
    prefer: ["count=exact"],
  });
  return count ?? 0;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  });
}

export function pageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Math.floor(Number(raw));
  return Number.isFinite(page) && page >= 1 && page <= 10000 ? page : 1;
}

export function oneOf<T extends string>(value: string | string[] | undefined, list: readonly T[]): T | "" {
  const raw = Array.isArray(value) ? value[0] : value;
  return (list as readonly string[]).includes(raw ?? "") ? (raw as T) : "";
}
