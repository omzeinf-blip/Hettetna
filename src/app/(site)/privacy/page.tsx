import type { Metadata } from "next";
import { demoModeEnabled, privacyReviewed } from "@/lib/config";
import { copy } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "كيف تتعامل حِتّتنا مع بيانات الاستفسارات وطلبات التواصل.",
  alternates: { canonical: "/privacy" },
  robots: privacyReviewed ? undefined : { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {privacyReviewed ? null : <p className="text-xs text-gold-dark">{copy.privacyDraft}</p>}
      <h1 className="mt-2 text-3xl font-semibold">سياسة الخصوصية</h1>
      <div className="mt-8 space-y-5 text-sm leading-8 text-muted">
        <p>
          تجمع حِتّتنا الحد الأدنى من البيانات اللازمة للرد على طلبات الشراء أو الإيجار أو عرض عقار:
          الاسم، رقم الموبايل، وتفاصيل الطلب الاختيارية.
        </p>
        <p>
          لا تُستخدم البيانات لأغراض تسويقية غير مرتبطة بالطلب إلا بموافقة لاحقة. تُحفظ بيانات الاستفسار
          طوال فترة المتابعة، ثم تُؤرشف أو تُحذف وفق سياسة الاحتفاظ المعتمدة لدى حِتّتنا.
        </p>
        {demoModeEnabled ? (
          <p>الموقع يعمل حاليًا في الوضع التجريبي، ولا يتم حفظ النماذج المرسلة في هذه المرحلة.</p>
        ) : (
          <p>
            تُحفظ الطلبات في قاعدة بيانات مؤمَّنة، ولا يمكن لزوار الموقع الاطلاع عليها. يقتصر الوصول إليها
            على فريق حِتّتنا المصرّح له عبر لوحة إدارة محمية بتسجيل الدخول.
          </p>
        )}
        {privacyReviewed ? null : (
          <p>هذه الصفحة ليست استشارة قانونية وتحتاج مراجعة قبل اعتمادها للنسخة العلنية.</p>
        )}
      </div>
    </div>
  );
}
