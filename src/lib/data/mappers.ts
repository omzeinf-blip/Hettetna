import { areaIds, availabilityStatuses, deliveryStatuses, finishings, furnishings, legalStatuses, pick, propertyTypes, transactionTypes } from "@/lib/enums";
import type {
  ContactSettings,
  Project,
  Property,
  PropertyImage,
} from "@/lib/types";

export type PropertyRow = {
  id: string;
  slug: string;
  property_code: string;
  title: string;
  transaction_type: string;
  property_type: string;
  city: string;
  area_id: string;
  area_name: string;
  compound: string | null;
  neighborhood: string | null;
  price: number | string;
  currency: string;
  area_sqm: number | string;
  bedrooms: number | null;
  bathrooms: number | null;
  finishing: string | null;
  furnishing: string | null;
  floor: string | null;
  delivery_status: string | null;
  description: string;
  features: string[] | null;
  images: unknown;
  listing_source: string;
  availability_status: string;
  last_availability_check: string | null;
  legal_review_status: string;
  payment_plan_note: string | null;
  is_demo: boolean;
  published_at: string | null;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  developer: string | null;
  area_id: string;
  area_name: string;
  city: string;
  description: string;
  delivery_status: string | null;
  payment_plan_note: string | null;
  images: unknown;
  is_demo: boolean;
  is_primary_sales: boolean;
  unit_types: string[] | null;
  published_at: string | null;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ContactRow = {
  whatsapp_number: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
};

export function parseImages(value: unknown): PropertyImage[] {
  if (!Array.isArray(value)) return [];
  const images: PropertyImage[] = [];
  for (const item of value) {
    if (item && typeof item === "object") {
      const { src, alt } = item as { src?: unknown; alt?: unknown };
      if (typeof src === "string" && /^https?:\/\//.test(src)) {
        images.push({ src, alt: typeof alt === "string" ? alt : "" });
      }
    }
  }
  return images;
}

const opt = (value: string | null | undefined) => (value ? value : undefined);

export function mapProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    slug: row.slug,
    propertyCode: row.property_code,
    title: row.title,
    transactionType: pick(transactionTypes, row.transaction_type) ?? "sale",
    propertyType: pick(propertyTypes, row.property_type) ?? "apartment",
    city: row.city,
    areaId: pick(areaIds, row.area_id) ?? "6th-october",
    areaName: row.area_name,
    compound: opt(row.compound),
    neighborhood: opt(row.neighborhood),
    price: Number(row.price),
    currency: "EGP",
    areaSqm: Number(row.area_sqm),
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    finishing: pick(finishings, row.finishing),
    furnishing: pick(furnishings, row.furnishing),
    floor: opt(row.floor),
    deliveryStatus: pick(deliveryStatuses, row.delivery_status),
    description: row.description,
    features: Array.isArray(row.features) ? row.features : [],
    images: parseImages(row.images),
    listingSource: pick(["owner", "authorized-representative", "developer-channel", "demo"] as const, row.listing_source) ?? "owner",
    availabilityStatus: pick(availabilityStatuses, row.availability_status) ?? "unknown",
    lastAvailabilityCheck: opt(row.last_availability_check),
    legalReviewStatus: pick(legalStatuses, row.legal_review_status) ?? "not-reviewed",
    publishedAt: row.published_at ?? row.created_at ?? new Date(0).toISOString(),
    isDemo: Boolean(row.is_demo),
    paymentPlanNote: opt(row.payment_plan_note),
  };
}

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    developer: opt(row.developer),
    areaId: pick(areaIds, row.area_id) ?? "6th-october",
    areaName: row.area_name,
    city: row.city,
    description: row.description,
    deliveryStatus: pick(deliveryStatuses, row.delivery_status),
    paymentPlanNote: opt(row.payment_plan_note),
    images: parseImages(row.images),
    isDemo: Boolean(row.is_demo),
    isPrimarySales: Boolean(row.is_primary_sales),
    unitTypes: (row.unit_types ?? []).filter((t): t is Property["propertyType"] =>
      (propertyTypes as string[]).includes(t),
    ),
    publishedAt: row.published_at ?? row.created_at ?? new Date(0).toISOString(),
  };
}

export function mapContact(row: ContactRow): ContactSettings {
  return {
    whatsappNumber: (row.whatsapp_number ?? "").replace(/\D/g, ""),
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    instagramUrl: row.instagram_url ?? "",
    facebookUrl: row.facebook_url ?? "",
    linkedinUrl: row.linkedin_url ?? "",
  };
}
