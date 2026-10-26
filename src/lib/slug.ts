/**
 * Next.js hands dynamic route params to pages still percent-encoded: an Arabic slug such as
 * "مشروع-الأمل" arrives as "%D9%85%D8%B4...". Querying the database with that raw text finds nothing,
 * so every detail page must decode the param exactly once before using it.
 * Returns null for malformed or oversized input (treated as "not found").
 */
export function decodeSlug(raw: string): string | null {
  if (!raw || raw.length > 600) return null;
  try {
    const value = decodeURIComponent(raw);
    return value.length > 0 && value.length <= 200 ? value : null;
  } catch {
    return null;
  }
}

/** Public paths. The slug is encoded exactly once, here, so links never depend on browser behaviour. */
export const propertyPath = (slug: string) => `/properties/${encodeURIComponent(slug)}`;
export const projectPath = (slug: string) => `/projects/${encodeURIComponent(slug)}`;
