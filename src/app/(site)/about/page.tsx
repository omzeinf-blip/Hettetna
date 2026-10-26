import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { brand, companyInfo, hasCompanyInfo } from "@/lib/config";
import { areaLabels } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "عن حِتّتنا",
  description: "تعرّف على حِتّتنا: وساطة عقارية متخصصة في 6 أكتوبر والشيخ زايد، وأسلوب عملنا والتزاماتنا تجاه عملائنا.",
  path: "/about",
});

const commitments = [
  {
    title: "وضوح في البيانات",
    text: "نفرّق بوضوح بين إعادة البيع والإيجار وبيع المطور، ونعرض لكل عقار بياناته كما وردت إلينا.",
  },
  {
    title: "تحقق قبل النشر",
    text: "لا نعلن عن عقار قبل مراجعة بياناته، ونعرض حالة التوفر وتاريخ آخر تحقق منها.",
  },
  {
    title: "خصوصية بيانات العملاء",
    text: "بيانات الاستفسارات لا تظهر لزوار الموقع، ويقتصر الاطلاع عليها على الفريق المصرّح له.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "عن حِتّتنا" }]} />
      <p className="font-latin text-xs tracking-[0.3em] text-gold-dark">{brand.nameLatin}</p>
      <h1 className="mt-2 text-3xl font-semibold">{brand.nameArabic}</h1>
      <p className="mt-2 text-lg text-muted">{brand.tagline}</p>

      <div className="mt-8 space-y-5 text-sm leading-8 text-muted">
        <p>
          حِتّتنا وساطة عقارية تركّز على مدينة 6 أكتوبر والشيخ زايد. نساعد المشترين والمستأجرين
          والملّاك على اتخاذ قرار عقاري واضح، بمعلومات دقيقة وتنسيق منظّم من أول استفسار حتى إتمام
          الاتفاق.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">ما نلتزم به</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {commitments.map((item) => (
            <article key={item.title} className="border-t border-gold pt-5">
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">مناطق الخدمة</h2>
        <ul className="mt-4 flex flex-wrap gap-3 text-sm">
          {Object.entries(areaLabels).map(([id, label]) => (
            <li key={id}>
              <Link
                href={`/properties?area=${id}`}
                className="inline-block rounded-sm border border-line bg-white px-4 py-2 hover:border-forest"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {hasCompanyInfo() ? (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">البيانات الرسمية</h2>
          <dl className="mt-4 grid gap-4 rounded-sm border border-line bg-white p-5 text-sm sm:grid-cols-2">
            {companyInfo.legalName ? (
              <div>
                <dt className="text-xs text-muted">الاسم القانوني</dt>
                <dd className="mt-1">{companyInfo.legalName}</dd>
              </div>
            ) : null}
            {companyInfo.commercialRegister ? (
              <div>
                <dt className="text-xs text-muted">السجل التجاري</dt>
                <dd className="mt-1" dir="ltr">{companyInfo.commercialRegister}</dd>
              </div>
            ) : null}
            {companyInfo.brokerLicense ? (
              <div>
                <dt className="text-xs text-muted">ترخيص الوساطة العقارية</dt>
                <dd className="mt-1" dir="ltr">{companyInfo.brokerLicense}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <div className="mt-12 flex flex-wrap gap-3">
        <Button href="/contact">تواصل معنا</Button>
        <Button href="/properties" variant="secondary">
          تصفّح العقارات
        </Button>
      </div>
    </div>
  );
}
