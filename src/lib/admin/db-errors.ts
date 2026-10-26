import { DataError } from "@/lib/supabase/rest";

/** Arabic, user-safe explanation of a database/API failure. Never leaks internal details. */
export function describeDbError(error: unknown): string {
  if (error instanceof DataError) {
    const detail = error.detail ?? "";
    if (error.status === 401 || error.status === 403) return "ليست لديك صلاحية لتنفيذ هذا الإجراء.";
    if (detail.includes("23505")) return "الكود أو الرابط (slug) مستخدم بالفعل في سجل آخر. غيّره وحاول مجددًا.";
    if (detail.includes("23514")) return "إحدى القيم لا تحقق قواعد قاعدة البيانات. راجع الحقول (مثلًا: التوفر المؤكد يحتاج تاريخ مراجعة).";
    if (detail.includes("PGRST205") || detail.includes("42P01")) return "جداول قاعدة البيانات غير موجودة بعد. شغّل الـ Migration أولًا.";
    if (error.status === 503) return "تعذر الاتصال بقاعدة البيانات. تحقق من إعدادات Supabase.";
  }
  return "حصل خطأ غير متوقع أثناء تنفيذ العملية.";
}
