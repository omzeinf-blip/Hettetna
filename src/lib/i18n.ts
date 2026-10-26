import type {
  AreaId,
  AvailabilityStatus,
  DeliveryStatus,
  FinishingStatus,
  FurnishingStatus,
  LegalReviewStatus,
  ListingSource,
  PropertyType,
  TransactionType,
} from "@/lib/types";

export const copy = {
  demoBanner:
    "الموقع يعمل حاليًا ببيانات تجريبية للعرض. العقارات والمشروعات الظاهرة ليست عروضًا حقيقية، وأي نموذج يُرسل في هذه المرحلة لا يُحفظ.",
  demoBadge: "بيانات تجريبية — ليست عرضًا حقيقيًا",
  searchCta: "ابحث عن عقارك",
  listPropertyCta: "اعرض عقارك",
  contactCta: "تواصل معنا",
  whatsappCta: "استفسار عبر واتساب",
  whatsappUnavailable:
    "للتواصل السريع يمكنك استخدام نموذج الاستفسار وسنعاود الاتصال بك.",
  emptyProperties:
    "لا توجد عقارات مطابقة لبحثك حاليًا. جرّب تعديل الفلاتر، أو أرسل لنا طلبك وسنساعدك في الوصول إلى الأنسب.",
  emptyProjects:
    "لا توجد مشروعات معروضة حاليًا. يمكنك تصفّح العقارات أو التواصل معنا إن كنت تبحث عن وحدة في مشروع معيّن.",
  formDemoNotice:
    "هذه معاينة للنموذج. الإرسال لا يُحفظ ولا يُرسل لفريق المبيعات طالما وضع التجربة مفعّل.",
  formSuccessPersisted: "وصلتنا بياناتك بنجاح، وسيراجعها فريق حِتّتنا ويتواصل معك.",
  formSuccessPreview: "تم التحقق من البيانات. في الوضع التجريبي لا يُحفظ الطلب.",
  formError: "تعذّر إرسال الطلب. يرجى المحاولة مرة أخرى بعد قليل.",
  privacyDraft:
    "هذه مسودة سياسة خصوصية للمراجعة القانونية قبل النشر الرسمي.",
} as const;

export const transactionLabels: Record<TransactionType, string> = {
  sale: "بيع",
  rent: "إيجار",
  primary: "بيع مطور",
};

export const propertyTypeLabels: Record<PropertyType, string> = {
  apartment: "شقة",
  villa: "فيلا",
  townhouse: "تاون هاوس",
  twinhouse: "توين هاوس",
  duplex: "دوبلكس",
  land: "أرض",
  commercial: "تجاري",
};

export const areaLabels: Record<AreaId, string> = {
  "6th-october": "6 أكتوبر",
  "sheikh-zayed": "الشيخ زايد",
  "october-gardens": "حدائق أكتوبر",
  "new-zayed": "زايد الجديدة",
};

export const finishingLabels: Record<FinishingStatus, string> = {
  finished: "تشطيب كامل",
  "semi-finished": "نصف تشطيب",
  "core-and-shell": "على المحارة",
};

export const furnishingLabels: Record<FurnishingStatus, string> = {
  unfurnished: "غير مفروش",
  "semi-furnished": "نصف مفروش",
  furnished: "مفروش",
};

export const deliveryLabels: Record<DeliveryStatus, string> = {
  ready: "جاهز للسكن",
  "under-construction": "تحت الإنشاء",
};

export const availabilityLabels: Record<AvailabilityStatus, string> = {
  unknown: "حالة التوفر غير مؤكدة",
  available: "متاح حسب آخر مراجعة",
  unavailable: "غير متاح",
  "pending-verification": "قيد التحقق من التوفر",
};

export const legalLabels: Record<LegalReviewStatus, string> = {
  "not-reviewed": "لم تُراجع المستندات القانونية بعد",
  "in-review": "مراجعة قانونية جارية",
  reviewed: "تمت مراجعة المستندات (لا يعني ضمانًا قانونيًا)",
};

export const listingSourceLabels: Record<ListingSource, string> = {
  owner: "من المالك",
  "authorized-representative": "عبر ممثل مفوض",
  "developer-channel": "من خلال قناة المطور",
  demo: "سجل تجريبي",
};

export const inquiryKindLabels = {
  buyer: "طلب شراء أو إيجار",
  owner: "عرض عقار للبيع/الإيجار",
  contact: "رسالة تواصل",
} as const;

export const inquiryStatusLabels = {
  new: "جديد",
  "in-review": "قيد المراجعة",
  assigned: "تم التعيين",
  closed: "مغلق",
} as const;

export const budgetRanges = [
  { value: "", label: "الميزانية" },
  { value: "0-2000000", label: "حتى 2 مليون جنيه" },
  { value: "2000000-5000000", label: "2 – 5 مليون" },
  { value: "5000000-10000000", label: "5 – 10 مليون" },
  { value: "10000000-20000000", label: "10 – 20 مليون" },
  { value: "20000000-", label: "أكثر من 20 مليون" },
] as const;
