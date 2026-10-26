import type { PropertyRow, ProjectRow } from "@/lib/data/mappers";
import { parseImages } from "@/lib/data/mappers";
import type { PropertyImage } from "@/lib/types";

export type PropertyFormValues = {
  id?: string;
  propertyCode: string;
  title: string;
  slug: string;
  transactionType: string;
  propertyType: string;
  areaId: string;
  compound: string;
  neighborhood: string;
  price: string;
  areaSqm: string;
  bedrooms: string;
  bathrooms: string;
  finishing: string;
  furnishing: string;
  floor: string;
  deliveryStatus: string;
  description: string;
  features: string;
  images: PropertyImage[];
  listingSource: string;
  availabilityStatus: string;
  lastAvailabilityCheck: string;
  legalReviewStatus: string;
  paymentPlanNote: string;
  published: boolean;
};

export const emptyProperty: PropertyFormValues = {
  propertyCode: "",
  title: "",
  slug: "",
  transactionType: "sale",
  propertyType: "apartment",
  areaId: "6th-october",
  compound: "",
  neighborhood: "",
  price: "",
  areaSqm: "",
  bedrooms: "",
  bathrooms: "",
  finishing: "",
  furnishing: "",
  floor: "",
  deliveryStatus: "",
  description: "",
  features: "",
  images: [],
  listingSource: "owner",
  availabilityStatus: "pending-verification",
  lastAvailabilityCheck: "",
  legalReviewStatus: "not-reviewed",
  paymentPlanNote: "",
  published: false,
};

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export function propertyRowToForm(row: PropertyRow): PropertyFormValues {
  return {
    id: row.id,
    propertyCode: row.property_code,
    title: row.title,
    slug: row.slug,
    transactionType: row.transaction_type,
    propertyType: row.property_type,
    areaId: row.area_id,
    compound: s(row.compound),
    neighborhood: s(row.neighborhood),
    price: s(row.price),
    areaSqm: s(row.area_sqm),
    bedrooms: s(row.bedrooms),
    bathrooms: s(row.bathrooms),
    finishing: s(row.finishing),
    furnishing: s(row.furnishing),
    floor: s(row.floor),
    deliveryStatus: s(row.delivery_status),
    description: row.description,
    features: (row.features ?? []).join("\n"),
    images: parseImages(row.images),
    listingSource: row.listing_source === "demo" ? "owner" : row.listing_source,
    availabilityStatus: row.availability_status,
    lastAvailabilityCheck: s(row.last_availability_check),
    legalReviewStatus: row.legal_review_status,
    paymentPlanNote: s(row.payment_plan_note),
    published: Boolean(row.published),
  };
}

export type ProjectFormValues = {
  id?: string;
  name: string;
  slug: string;
  developer: string;
  areaId: string;
  description: string;
  deliveryStatus: string;
  paymentPlanNote: string;
  images: PropertyImage[];
  isPrimarySales: boolean;
  unitTypes: string[];
  published: boolean;
};

export const emptyProject: ProjectFormValues = {
  name: "",
  slug: "",
  developer: "",
  areaId: "6th-october",
  description: "",
  deliveryStatus: "",
  paymentPlanNote: "",
  images: [],
  isPrimarySales: true,
  unitTypes: [],
  published: false,
};

export function projectRowToForm(row: ProjectRow): ProjectFormValues {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    developer: s(row.developer),
    areaId: row.area_id,
    description: row.description,
    deliveryStatus: s(row.delivery_status),
    paymentPlanNote: s(row.payment_plan_note),
    images: parseImages(row.images),
    isPrimarySales: Boolean(row.is_primary_sales),
    unitTypes: row.unit_types ?? [],
    published: Boolean(row.published),
  };
}
