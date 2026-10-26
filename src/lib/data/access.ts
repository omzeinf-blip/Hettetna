import { demoModeEnabled, envContactSettings } from "@/lib/config";
import { PROJECT_COLUMNS, PROPERTY_COLUMNS, CONTACT_COLUMNS } from "@/lib/data/columns";
import {
  mapContact,
  mapProject,
  mapProperty,
  type ContactRow,
  type ProjectRow,
  type PropertyRow,
} from "@/lib/data/mappers";
import { demoProjects } from "@/lib/data/projects";
import { demoProperties } from "@/lib/data/properties";
import { buildPropertyQuery } from "@/lib/data/query";
import { filterProperties, similarProperties } from "@/lib/filters";
import {
  DataError,
  canWriteInquiries,
  isSupabaseReady,
  rest,
} from "@/lib/supabase/rest";
import type { ContactSettings, Inquiry, Project, Property, PropertyFilters } from "@/lib/types";

export const PAGE_SIZE = 12;

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const propertyCache = { revalidate: 60, tags: ["properties"] };
const projectCache = { revalidate: 60, tags: ["projects"] };

function ensureLive() {
  if (!isSupabaseReady()) throw new DataError("supabase_not_configured", 503);
}

function paged<T>(items: T[], total: number, page: number, pageSize: number): Paged<T> {
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function searchProperties(
  filters: PropertyFilters,
  page = 1,
  pageSize = PAGE_SIZE,
): Promise<Paged<Property>> {
  if (demoModeEnabled) {
    const all = filterProperties(demoProperties, filters);
    return paged(all.slice((page - 1) * pageSize, page * pageSize), all.length, page, pageSize);
  }
  ensureLive();
  const { data, count } = await rest<PropertyRow[]>("properties", {
    query: buildPropertyQuery(filters, page, pageSize),
    prefer: ["count=exact"],
    cache: propertyCache,
  });
  const items = (data ?? []).map(mapProperty);
  return paged(items, count ?? items.length, page, pageSize);
}

export async function getFeaturedProperties(limit = 6): Promise<Property[]> {
  return (await searchProperties({ sort: "newest" }, 1, limit)).items;
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  if (demoModeEnabled) return demoProperties.find((p) => p.slug === slug) ?? null;
  ensureLive();
  const { data } = await rest<PropertyRow[]>("properties", {
    query: {
      select: PROPERTY_COLUMNS,
      slug: `eq.${slug}`,
      published: "eq.true",
      is_demo: "eq.false",
      limit: "1",
    },
    cache: propertyCache,
  });
  return data?.[0] ? mapProperty(data[0]) : null;
}

export async function getSimilarProperties(current: Property): Promise<Property[]> {
  if (demoModeEnabled) return similarProperties(demoProperties, current);
  ensureLive();
  const { data } = await rest<PropertyRow[]>("properties", {
    query: {
      select: PROPERTY_COLUMNS,
      published: "eq.true",
      is_demo: "eq.false",
      id: `neq.${current.id}`,
      or: `(area_id.eq.${current.areaId},property_type.eq.${current.propertyType})`,
      order: "published_at.desc.nullslast,id.desc",
      limit: "12",
    },
    cache: propertyCache,
  });
  return similarProperties((data ?? []).map(mapProperty), current);
}

export async function getProjects(): Promise<Project[]> {
  if (demoModeEnabled) return demoProjects;
  ensureLive();
  const { data } = await rest<ProjectRow[]>("projects", {
    query: {
      select: PROJECT_COLUMNS,
      published: "eq.true",
      is_demo: "eq.false",
      order: "published_at.desc.nullslast,id.desc",
      limit: "100",
    },
    cache: projectCache,
  });
  return (data ?? []).map(mapProject);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (demoModeEnabled) return demoProjects.find((p) => p.slug === slug) ?? null;
  ensureLive();
  const { data } = await rest<ProjectRow[]>("projects", {
    query: {
      select: PROJECT_COLUMNS,
      slug: `eq.${slug}`,
      published: "eq.true",
      is_demo: "eq.false",
      limit: "1",
    },
    cache: projectCache,
  });
  return data?.[0] ? mapProject(data[0]) : null;
}

/** Developer-sale units in the same area as a project. */
export async function getPropertiesForProject(project: Project): Promise<Property[]> {
  const result = await searchProperties(
    { transactionType: "primary", areaId: project.areaId, sort: "newest" },
    1,
    6,
  );
  return result.items;
}

export type SitemapEntry = { slug: string; lastModified?: string };

export async function listPublicSlugs(): Promise<{
  properties: SitemapEntry[];
  projects: SitemapEntry[];
}> {
  if (demoModeEnabled) {
    return {
      properties: demoProperties.map((p) => ({ slug: p.slug, lastModified: p.publishedAt })),
      projects: demoProjects.map((p) => ({ slug: p.slug, lastModified: p.publishedAt })),
    };
  }
  ensureLive();
  const base = { published: "eq.true", is_demo: "eq.false", select: "slug,published_at", limit: "1000" };
  const [properties, projects] = await Promise.all([
    rest<{ slug: string; published_at: string | null }[]>("properties", {
      query: base,
      cache: propertyCache,
    }),
    rest<{ slug: string; published_at: string | null }[]>("projects", {
      query: base,
      cache: projectCache,
    }),
  ]);
  const toEntry = (row: { slug: string; published_at: string | null }) => ({
    slug: row.slug,
    lastModified: row.published_at ?? undefined,
  });
  return {
    properties: (properties.data ?? []).map(toEntry),
    projects: (projects.data ?? []).map(toEntry),
  };
}

/** Public contact details. Database row wins in production; environment variables are the fallback. */
export async function getContactSettings(): Promise<ContactSettings> {
  if (demoModeEnabled || !isSupabaseReady()) return envContactSettings;
  try {
    const { data } = await rest<ContactRow[]>("contact_settings", {
      query: { select: CONTACT_COLUMNS, id: "eq.1", limit: "1" },
      cache: { revalidate: 120, tags: ["contact"] },
    });
    return data?.[0] ? mapContact(data[0]) : envContactSettings;
  } catch {
    return envContactSettings;
  }
}

export async function submitInquiry(inquiry: Inquiry): Promise<{ persisted: boolean }> {
  if (demoModeEnabled) return { persisted: false };
  if (!canWriteInquiries()) throw new DataError("supabase_service_key_missing", 503);
  await rest("inquiries", {
    method: "POST",
    service: true,
    prefer: ["return=minimal"],
    body: {
      kind: inquiry.kind,
      name: inquiry.name,
      phone: inquiry.phone,
      email: inquiry.email ?? null,
      transaction_type: inquiry.transactionType ?? null,
      preferred_location: inquiry.preferredLocation || null,
      property_type: inquiry.propertyType || null,
      budget_min: inquiry.budgetMin ?? null,
      budget_max: inquiry.budgetMax ?? null,
      asking_price: inquiry.askingPrice ?? null,
      area_sqm: inquiry.areaSqm ?? null,
      notes: inquiry.notes ?? null,
      property_code: inquiry.propertyCode ?? null,
      consent: true,
    },
  });
  return { persisted: true };
}
