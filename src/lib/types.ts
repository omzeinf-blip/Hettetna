export type TransactionType = "sale" | "rent" | "primary";
export type PropertyType =
  | "apartment"
  | "villa"
  | "townhouse"
  | "twinhouse"
  | "duplex"
  | "land"
  | "commercial";
export type AreaId =
  | "6th-october"
  | "sheikh-zayed"
  | "october-gardens"
  | "new-zayed";
export type FinishingStatus =
  | "finished"
  | "semi-finished"
  | "core-and-shell";
export type FurnishingStatus = "unfurnished" | "semi-furnished" | "furnished";
export type DeliveryStatus = "ready" | "under-construction";
export type AvailabilityStatus =
  | "unknown"
  | "available"
  | "unavailable"
  | "pending-verification";
export type LegalReviewStatus = "not-reviewed" | "in-review" | "reviewed";
export type ListingSource =
  | "owner"
  | "authorized-representative"
  | "developer-channel"
  | "demo";
export type InquiryKind = "buyer" | "owner" | "contact";
export type InquiryStatus = "new" | "in-review" | "assigned" | "closed";
export type SortOption = "newest" | "price-asc" | "price-desc";

export type Property = {
  id: string;
  slug: string;
  propertyCode: string;
  title: string;
  transactionType: TransactionType;
  propertyType: PropertyType;
  city: string;
  areaId: AreaId;
  areaName: string;
  compound?: string;
  neighborhood?: string;
  price: number;
  currency: "EGP";
  areaSqm: number;
  bedrooms?: number;
  bathrooms?: number;
  finishing?: FinishingStatus;
  furnishing?: FurnishingStatus;
  floor?: string;
  deliveryStatus?: DeliveryStatus;
  description: string;
  features: string[];
  images: PropertyImage[];
  listingSource: ListingSource;
  availabilityStatus: AvailabilityStatus;
  lastAvailabilityCheck?: string;
  legalReviewStatus: LegalReviewStatus;
  publishedAt: string;
  isDemo: boolean;
  paymentPlanNote?: string;
};

export type PropertyImage = {
  src: string;
  alt: string;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  developer?: string;
  areaId: AreaId;
  areaName: string;
  city: string;
  description: string;
  deliveryStatus?: DeliveryStatus;
  paymentPlanNote?: string;
  images: PropertyImage[];
  isDemo: boolean;
  isPrimarySales: boolean;
  unitTypes: PropertyType[];
  publishedAt: string;
};

export type ContactSettings = {
  whatsappNumber: string;
  phone: string;
  email: string;
  address: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
};

export type Inquiry = {
  id?: string;
  kind: InquiryKind;
  name: string;
  phone: string;
  email?: string;
  transactionType?: TransactionType | "buy-or-rent";
  preferredLocation?: AreaId | "";
  propertyType?: PropertyType | "";
  budgetMin?: number;
  budgetMax?: number;
  askingPrice?: number;
  areaSqm?: number;
  notes?: string;
  propertyCode?: string;
  consent: boolean;
  status?: InquiryStatus;
  createdAt?: string;
};

export type PropertyFilters = {
  q?: string;
  transactionType?: TransactionType | "";
  propertyType?: PropertyType | "";
  areaId?: AreaId | "";
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minArea?: number;
  finishing?: FinishingStatus | "";
  deliveryStatus?: DeliveryStatus | "";
  sort?: SortOption;
};
