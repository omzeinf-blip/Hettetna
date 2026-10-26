import {
  areaIds,
  availabilityStatuses,
  deliveryStatuses,
  finishings,
  furnishings,
  legalStatuses,
  pick,
  propertyTypes,
  staffListingSources,
  transactionTypes,
} from "@/lib/enums";
import { areaLabels } from "@/lib/i18n";
import type { FieldErrors } from "@/lib/validation";

export const IMAGE_BUCKET = "property-images";
export const MAX_IMAGES = 20;
const CITY = "الجيزة";

type Images = { src: string; alt: string }[];

export type PropertyWrite = {
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
  price: number;
  area_sqm: number;
  bedrooms: number | null;
  bathrooms: number | null;
  finishing: string | null;
  furnishing: string | null;
  floor: string | null;
  delivery_status: string | null;
  description: string;
  features: string[];
  images: Images;
  listing_source: string;
  availability_status: string;
  last_availability_check: string | null;
  legal_review_status: string;
  payment_plan_note: string | null;
  published: boolean;
};

export type ProjectWrite = {
  slug: string;
  name: string;
  developer: string | null;
  area_id: string;
  area_name: string;
  city: string;
  description: string;
  delivery_status: string | null;
  payment_plan_note: string | null;
  images: Images;
  is_primary_sales: boolean;
  unit_types: string[];
  published: boolean;
};

export type SettingsWrite = {
  whatsapp_number: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
};

const str = (fd: FormData, key: string) => {
  const value = fd.get(key);
  return typeof value === "string" ? value.trim() : "";
};
const orNull = (value: string) => (value ? value : null);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export function imagePrefix(): string {
  const base = (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${IMAGE_BUCKET}/`;
}

/** Images must come from our own storage bucket. */
export function parseImages(raw: string, errors: FieldErrors): Images {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("shape");
    if (parsed.length > MAX_IMAGES) {
      errors.images = `الحد الأقصى ${MAX_IMAGES} صورة.`;
      return [];
    }
    const prefix = imagePrefix();
    const images: Images = [];
    for (const item of parsed) {
      const src = typeof item?.src === "string" ? item.src : "";
      const alt = typeof item?.alt === "string" ? item.alt.trim().slice(0, 200) : "";
      if (!prefix.startsWith("http") || !src.startsWith(prefix)) throw new Error("origin");
      images.push({ src, alt });
    }
    return images;
  } catch {
    errors.images = "بيانات الصور غير صحيحة. أعد رفع الصور.";
    return [];
  }
}

function optionalInt(fd: FormData, key: string, label: string, errors: FieldErrors): number | null {
  const raw = str(fd, key);
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 50) {
    errors[key] = `${label} غير صحيح.`;
    return null;
  }
  return n;
}

function optionalEnum<T extends string>(
  fd: FormData,
  key: string,
  list: readonly T[],
  errors: FieldErrors,
): T | null {
  const raw = str(fd, key);
  if (!raw) return null;
  const value = pick(list, raw);
  if (!value) errors[key] = "قيمة غير صحيحة.";
  return value ?? null;
}

const today = () => new Date().toISOString().slice(0, 10);

export function parsePropertyForm(fd: FormData): { values?: PropertyWrite; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const propertyCode = str(fd, "propertyCode");
  if (!propertyCode || propertyCode.length > 40) errors.propertyCode = "كود العقار مطلوب (حتى 40 حرفًا).";

  const title = str(fd, "title");
  if (title.length < 3 || title.length > 200) errors.title = "العنوان مطلوب (3 إلى 200 حرف).";

  const transactionType = pick(transactionTypes, str(fd, "transactionType"));
  if (!transactionType) errors.transactionType = "اختر نوع العملية.";
  const propertyType = pick(propertyTypes, str(fd, "propertyType"));
  if (!propertyType) errors.propertyType = "اختر نوع العقار.";
  const areaId = pick(areaIds, str(fd, "areaId"));
  if (!areaId) errors.areaId = "اختر المنطقة.";

  const price = Number(str(fd, "price"));
  if (!Number.isFinite(price) || price <= 0) errors.price = "السعر لازم يكون أكبر من صفر.";
  const areaSqm = Number(str(fd, "areaSqm"));
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) errors.areaSqm = "المساحة لازم تكون أكبر من صفر.";

  const description = str(fd, "description");
  if (description.length > 5000) errors.description = "الوصف طويل جدًا (الحد 5000 حرف).";

  const listingSource = pick(staffListingSources, str(fd, "listingSource"));
  if (!listingSource) errors.listingSource = "اختر مصدر العرض.";
  const availability = pick(availabilityStatuses, str(fd, "availabilityStatus")) ?? "pending-verification";
  const legal = pick(legalStatuses, str(fd, "legalReviewStatus")) ?? "not-reviewed";

  let checkDate = str(fd, "lastAvailabilityCheck");
  if (checkDate && (!/^\d{4}-\d{2}-\d{2}$/.test(checkDate) || checkDate > today())) {
    errors.lastAvailabilityCheck = "تاريخ المراجعة غير صحيح أو في المستقبل.";
  }
  // "Available" is only valid with a recorded verification date; record today's date if left blank.
  if (availability === "available" && !checkDate) checkDate = today();

  const features = str(fd, "features")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (features.length > 30 || features.some((f) => f.length > 100)) {
    errors.features = "حتى 30 ميزة، وكل ميزة حتى 100 حرف.";
  }

  const images = parseImages(str(fd, "images"), errors);
  const published = fd.get("published") === "on";
  if (published) {
    if (description.length < 20) errors.description = "الوصف مطلوب للنشر (20 حرفًا على الأقل).";
    if (images.length === 0 && !errors.images) errors.images = "أضف صورة واحدة على الأقل قبل النشر.";
  }

  const bedrooms = optionalInt(fd, "bedrooms", "عدد الغرف", errors);
  const bathrooms = optionalInt(fd, "bathrooms", "عدد الحمامات", errors);
  const finishing = optionalEnum(fd, "finishing", finishings, errors);
  const furnishing = optionalEnum(fd, "furnishing", furnishings, errors);
  const deliveryStatus = optionalEnum(fd, "deliveryStatus", deliveryStatuses, errors);

  let slug = slugify(str(fd, "slug"));
  if (!slug && propertyType && areaId) slug = slugify(`${propertyType}-${areaId}-${propertyCode}`);
  if (!slug) errors.slug = "الرابط (slug) مطلوب.";

  if (Object.keys(errors).length || !transactionType || !propertyType || !areaId || !listingSource) {
    return { errors };
  }

  return {
    errors,
    values: {
      slug,
      property_code: propertyCode,
      title,
      transaction_type: transactionType,
      property_type: propertyType,
      city: CITY,
      area_id: areaId,
      area_name: areaLabels[areaId],
      compound: orNull(str(fd, "compound")),
      neighborhood: orNull(str(fd, "neighborhood")),
      price,
      area_sqm: areaSqm,
      bedrooms,
      bathrooms,
      finishing,
      furnishing,
      floor: orNull(str(fd, "floor")),
      delivery_status: deliveryStatus,
      description,
      features,
      images,
      listing_source: listingSource,
      availability_status: availability,
      last_availability_check: checkDate || null,
      legal_review_status: legal,
      payment_plan_note: orNull(str(fd, "paymentPlanNote")),
      published,
    },
  };
}

export function parseProjectForm(fd: FormData): { values?: ProjectWrite; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const name = str(fd, "name");
  if (name.length < 2 || name.length > 200) errors.name = "اسم المشروع مطلوب (2 إلى 200 حرف).";
  const areaId = pick(areaIds, str(fd, "areaId"));
  if (!areaId) errors.areaId = "اختر المنطقة.";
  const description = str(fd, "description");
  if (description.length > 5000) errors.description = "الوصف طويل جدًا (الحد 5000 حرف).";
  const deliveryStatus = optionalEnum(fd, "deliveryStatus", deliveryStatuses, errors);

  const unitTypes = fd.getAll("unitTypes").filter((v): v is string => typeof v === "string");
  if (unitTypes.some((t) => !pick(propertyTypes, t))) errors.unitTypes = "نوع وحدة غير صحيح.";

  const images = parseImages(str(fd, "images"), errors);
  const published = fd.get("published") === "on";
  if (published) {
    if (description.length < 20) errors.description = "الوصف مطلوب للنشر (20 حرفًا على الأقل).";
    if (images.length === 0 && !errors.images) errors.images = "أضف صورة واحدة على الأقل قبل النشر.";
  }

  let slug = slugify(str(fd, "slug"));
  if (!slug) slug = slugify(name);
  if (!slug) errors.slug = "الرابط (slug) مطلوب. استخدم حروفًا أو أرقامًا.";

  if (Object.keys(errors).length || !areaId) return { errors };

  return {
    errors,
    values: {
      slug,
      name,
      developer: orNull(str(fd, "developer")),
      area_id: areaId,
      area_name: areaLabels[areaId],
      city: CITY,
      description,
      delivery_status: deliveryStatus,
      payment_plan_note: orNull(str(fd, "paymentPlanNote")),
      images,
      is_primary_sales: fd.get("isPrimarySales") === "on",
      unit_types: unitTypes,
      published,
    },
  };
}

export function parseSettingsForm(fd: FormData): { values?: SettingsWrite; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const whatsapp = str(fd, "whatsappNumber").replace(/[\s+()-]/g, "");
  if (whatsapp && !/^[0-9]{10,15}$/.test(whatsapp)) {
    errors.whatsappNumber = "رقم واتساب بالأرقام فقط مع كود الدولة (مثال: 2010XXXXXXXX).";
  }
  const email = str(fd, "email");
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) {
    errors.email = "بريد إلكتروني غير صحيح.";
  }
  const phone = str(fd, "phone");
  if (phone.length > 30) errors.phone = "رقم الهاتف طويل جدًا.";
  const address = str(fd, "address");
  if (address.length > 300) errors.address = "العنوان طويل جدًا.";

  const url = (key: string) => {
    const value = str(fd, key);
    if (value && (!/^https:\/\/[^\s]+$/.test(value) || value.length > 300)) {
      errors[key] = "الرابط لازم يبدأ بـ https://";
    }
    return orNull(value);
  };
  const instagramUrl = url("instagramUrl");
  const facebookUrl = url("facebookUrl");
  const linkedinUrl = url("linkedinUrl");

  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    values: {
      whatsapp_number: orNull(whatsapp),
      phone: orNull(phone),
      email: orNull(email),
      address: orNull(address),
      instagram_url: instagramUrl,
      facebook_url: facebookUrl,
      linkedin_url: linkedinUrl,
    },
  };
}
