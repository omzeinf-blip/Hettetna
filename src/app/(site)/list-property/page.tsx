import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "اعرض عقارك",
  description: "أرسل تفاصيل عقارك إلى فريق حِتّتنا لمراجعتها قبل أي نشر.",
  path: "/list-property",
});

export default function ListPropertyPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">
      <div>
        <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "اعرض عقارك" }]} />
        <h1 className="text-3xl font-semibold">اعرض عقارك</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          أرسل لنا البيانات الأساسية للعقار. يراجع الفريق البيانات قبل أي نشر، ولا نعلن عن عقار إلا
          بعد التحقق من المعلومات المتاحة.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-muted">
          <li>نوع العملية: بيع أو إيجار.</li>
          <li>المنطقة ونوع الوحدة.</li>
          <li>السعر المطلوب والمساحة إن وُجدا.</li>
        </ul>
      </div>
      <InquiryForm kind="owner" />
    </div>
  );
}
