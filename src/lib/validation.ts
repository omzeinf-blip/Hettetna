import type { AreaId, Inquiry, InquiryKind, PropertyType, TransactionType } from "@/lib/types";

/** Prepends the page the visitor was on (e.g. a project name) so staff know what the inquiry is about. */
function withSubject(subject: string, notes: string): string {
  const clean = subject.replace(/\s+/g, " ").trim().slice(0, 120);
  if (!clean) return notes;
  return notes ? `بخصوص: ${clean}\n${notes}` : `بخصوص: ${clean}`;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const egyptianPhone = /^(01[0125][0-9]{8}|(\+?20)?1[0125][0-9]{8})$/;

const propertyTypes: PropertyType[] = [
  "apartment",
  "villa",
  "townhouse",
  "twinhouse",
  "duplex",
  "land",
  "commercial",
];

const areas: AreaId[] = ["6th-october", "sheikh-zayed", "october-gardens", "new-zayed"];
const transactions: TransactionType[] = ["sale", "rent", "primary"];

export type FieldErrors = Record<string, string>;

function required(value: unknown, message: string): string | undefined {
  if (typeof value === "string" && value.trim()) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return undefined;
  if (typeof value === "boolean") return undefined;
  return message;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | undefined {
  if (value === "" || value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function validateInquiry(kind: InquiryKind, body: Record<string, unknown>): {
  data?: Inquiry;
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};
  const name = asString(body.name);
  const phone = asString(body.phone).replace(/\s/g, "");
  const notes = asString(body.notes);
  const consent = body.consent === true || body.consent === "true" || body.consent === "on";

  if (required(name, "الاسم مطلوب.")) errors.name = "الاسم مطلوب.";
  else if (name.length < 3) errors.name = "اكتب الاسم الثلاثي أو اسمًا أوضح.";
  else if (name.length > 120) errors.name = "الاسم طويل جدًا.";

  const email = asString(body.email);
  if (email && (email.length > 254 || !emailPattern.test(email))) {
    errors.email = "أدخل بريدًا إلكترونيًا صحيحًا أو اتركه فارغًا.";
  }
  if (notes.length > 1800) errors.notes = "الملاحظات طويلة جدًا (الحد 1800 حرف).";
  if (asString(body.propertyCode).length > 40) errors.propertyCode = "كود العقار غير صحيح.";

  const budgetMin = asNumber(body.budgetMin);
  const budgetMax = asNumber(body.budgetMax);
  const askingPrice = asNumber(body.askingPrice);
  const areaSqm = asNumber(body.areaSqm);
  if (budgetMin !== undefined && budgetMin < 0) errors.budgetMin = "القيمة غير صحيحة.";
  if (budgetMax !== undefined && budgetMax < 0) errors.budgetMax = "القيمة غير صحيحة.";
  if (budgetMin !== undefined && budgetMax !== undefined && budgetMin > budgetMax) {
    errors.budgetMax = "الحد الأقصى لازم يكون أكبر من الحد الأدنى.";
  }
  if (askingPrice !== undefined && askingPrice < 0) errors.askingPrice = "القيمة غير صحيحة.";
  if (areaSqm !== undefined && areaSqm <= 0) errors.areaSqm = "المساحة لازم تكون أكبر من صفر.";

  if (!phone) errors.phone = "رقم الموبايل مطلوب.";
  else if (!egyptianPhone.test(phone)) errors.phone = "أدخل رقم موبايل مصري صحيح.";

  if (!consent) errors.consent = "الموافقة على التواصل مطلوبة.";

  const propertyType = asString(body.propertyType) as PropertyType | "";
  if (propertyType && !propertyTypes.includes(propertyType as PropertyType)) {
    errors.propertyType = "نوع العقار غير صحيح.";
  }

  const preferredLocation = asString(body.preferredLocation) as AreaId | "";
  if (preferredLocation && !areas.includes(preferredLocation as AreaId)) {
    errors.preferredLocation = "المنطقة غير صحيحة.";
  }

  if (kind === "buyer") {
    const transactionType = asString(body.transactionType);
    if (transactionType !== "sale" && transactionType !== "rent") {
      errors.transactionType = "حدد إذا كنت تشتري أو تستأجر.";
    }
  }

  if (kind === "owner") {
    const transactionType = asString(body.transactionType) as TransactionType;
    if (!transactions.includes(transactionType)) {
      errors.transactionType = "حدد نوع العملية.";
    }
    if (!propertyType) errors.propertyType = "حدد نوع العقار.";
    if (!preferredLocation) errors.preferredLocation = "حدد المنطقة.";
  }

  if (Object.keys(errors).length > 0) return { errors };

  const data: Inquiry = {
    kind,
    name,
    phone,
    email: email || undefined,
    notes: withSubject(asString(body.subject), notes) || undefined,
    consent,
    transactionType:
      kind === "contact"
        ? undefined
        : (asString(body.transactionType) as Inquiry["transactionType"]),
    preferredLocation: preferredLocation || undefined,
    propertyType: propertyType || undefined,
    budgetMin,
    budgetMax,
    askingPrice,
    areaSqm,
    propertyCode: asString(body.propertyCode) || undefined,
  };

  return { data, errors };
}
