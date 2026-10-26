import type {
  AreaId,
  AvailabilityStatus,
  DeliveryStatus,
  FinishingStatus,
  FurnishingStatus,
  InquiryStatus,
  LegalReviewStatus,
  PropertyType,
  SortOption,
  TransactionType,
} from "@/lib/types";

export const transactionTypes: TransactionType[] = ["sale", "rent", "primary"];
export const propertyTypes: PropertyType[] = [
  "apartment",
  "villa",
  "townhouse",
  "twinhouse",
  "duplex",
  "land",
  "commercial",
];
export const areaIds: AreaId[] = ["6th-october", "sheikh-zayed", "october-gardens", "new-zayed"];
export const finishings: FinishingStatus[] = ["finished", "semi-finished", "core-and-shell"];
export const furnishings: FurnishingStatus[] = ["unfurnished", "semi-furnished", "furnished"];
export const deliveryStatuses: DeliveryStatus[] = ["ready", "under-construction"];
export const availabilityStatuses: AvailabilityStatus[] = [
  "unknown",
  "available",
  "unavailable",
  "pending-verification",
];
export const legalStatuses: LegalReviewStatus[] = ["not-reviewed", "in-review", "reviewed"];
/** Listing sources staff may choose. "demo" is reserved for the local demo records. */
export const staffListingSources = ["owner", "authorized-representative", "developer-channel"] as const;
export const inquiryStatuses: InquiryStatus[] = ["new", "in-review", "assigned", "closed"];
export const sortOptions: SortOption[] = ["newest", "price-asc", "price-desc"];

export function pick<T extends string>(list: readonly T[], value: unknown): T | undefined {
  return typeof value === "string" && (list as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}
