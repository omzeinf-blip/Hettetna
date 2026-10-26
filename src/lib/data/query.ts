import { PROPERTY_COLUMNS } from "@/lib/data/columns";
import type { PropertyFilters } from "@/lib/types";

/** Turns free text into safe search tokens (no PostgREST/LIKE metacharacters). */
export function searchTokens(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .toLowerCase()
    .replace(/[*%_\\(),:."'`;&|<>=!#{}\[\]]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((token) => token.slice(0, 40));
}

export function buildPropertyQuery(
  filters: PropertyFilters,
  page: number,
  pageSize: number,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("select", PROPERTY_COLUMNS);
  params.set("published", "eq.true");
  params.set("is_demo", "eq.false");

  if (filters.transactionType) params.set("transaction_type", `eq.${filters.transactionType}`);
  if (filters.propertyType) params.set("property_type", `eq.${filters.propertyType}`);
  if (filters.areaId) params.set("area_id", `eq.${filters.areaId}`);
  if (filters.finishing) params.set("finishing", `eq.${filters.finishing}`);
  if (filters.deliveryStatus) params.set("delivery_status", `eq.${filters.deliveryStatus}`);
  if (filters.minPrice) params.append("price", `gte.${filters.minPrice}`);
  if (filters.maxPrice) params.append("price", `lte.${filters.maxPrice}`);
  if (filters.minBedrooms) params.set("bedrooms", `gte.${filters.minBedrooms}`);
  if (filters.minArea) params.set("area_sqm", `gte.${filters.minArea}`);
  for (const token of searchTokens(filters.q)) params.append("search_text", `ilike.*${token}*`);

  // `id` as a tie-breaker keeps pagination stable.
  if (filters.sort === "price-asc") params.set("order", "price.asc,id.asc");
  else if (filters.sort === "price-desc") params.set("order", "price.desc,id.asc");
  else params.set("order", "published_at.desc.nullslast,id.desc");

  params.set("limit", String(pageSize));
  params.set("offset", String((page - 1) * pageSize));
  return params;
}
