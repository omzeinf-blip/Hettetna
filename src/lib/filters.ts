import {
  areaIds,
  deliveryStatuses,
  finishings,
  pick,
  propertyTypes,
  sortOptions,
  transactionTypes,
} from "@/lib/enums";
import type { Property, PropertyFilters } from "@/lib/types";

export function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function filtersFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): PropertyFilters {
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  // Every value is whitelisted/validated: URL input never reaches the database unchecked.
  const nonNegative = (value: number | undefined) =>
    value !== undefined && value >= 0 ? value : undefined;

  return {
    q: read("q")?.trim().slice(0, 100) || undefined,
    transactionType: pick(transactionTypes, read("transaction")) ?? "",
    propertyType: pick(propertyTypes, read("type")) ?? "",
    areaId: pick(areaIds, read("area")) ?? "",
    minPrice: nonNegative(parseNumber(read("minPrice"))),
    maxPrice: nonNegative(parseNumber(read("maxPrice"))),
    minBedrooms: nonNegative(parseNumber(read("beds"))),
    minArea: nonNegative(parseNumber(read("minArea"))),
    finishing: pick(finishings, read("finishing")) ?? "",
    deliveryStatus: pick(deliveryStatuses, read("delivery")) ?? "",
    sort: pick(sortOptions, read("sort")) ?? "newest",
  };
}

export function parsePage(params: Record<string, string | string[] | undefined>): number {
  const raw = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.floor(Number(raw));
  return Number.isFinite(page) && page >= 1 && page <= 10000 ? page : 1;
}

export function toSearchParams(filters: PropertyFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.transactionType) params.set("transaction", filters.transactionType);
  if (filters.propertyType) params.set("type", filters.propertyType);
  if (filters.areaId) params.set("area", filters.areaId);
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.minBedrooms) params.set("beds", String(filters.minBedrooms));
  if (filters.minArea) params.set("minArea", String(filters.minArea));
  if (filters.finishing) params.set("finishing", filters.finishing);
  if (filters.deliveryStatus) params.set("delivery", filters.deliveryStatus);
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  return params;
}

export function filterProperties(
  properties: Property[],
  filters: PropertyFilters,
): Property[] {
  const query = filters.q?.toLowerCase();

  const result = properties.filter((property) => {
    if (filters.transactionType && property.transactionType !== filters.transactionType) {
      return false;
    }
    if (filters.propertyType && property.propertyType !== filters.propertyType) {
      return false;
    }
    if (filters.areaId && property.areaId !== filters.areaId) {
      return false;
    }
    if (filters.minPrice && property.price < filters.minPrice) return false;
    if (filters.maxPrice && property.price > filters.maxPrice) return false;
    if (filters.minBedrooms && (property.bedrooms ?? 0) < filters.minBedrooms) {
      return false;
    }
    if (filters.minArea && property.areaSqm < filters.minArea) return false;
    if (filters.finishing && property.finishing !== filters.finishing) return false;
    if (filters.deliveryStatus && property.deliveryStatus !== filters.deliveryStatus) {
      return false;
    }
    if (query) {
      const haystack = [
        property.title,
        property.areaName,
        property.compound,
        property.neighborhood,
        property.propertyCode,
        property.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const sorted = [...result];
  if (filters.sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
  else if (filters.sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
  else sorted.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));

  return sorted;
}

export function similarProperties(properties: Property[], current: Property): Property[] {
  return properties
    .filter((property) => property.id !== current.id)
    .map((property) => {
      let score = 0;
      if (property.areaId === current.areaId) score += 3;
      if (property.propertyType === current.propertyType) score += 2;
      if (property.transactionType === current.transactionType) score += 1;
      return { property, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.property);
}
