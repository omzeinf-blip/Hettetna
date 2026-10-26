import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/Button";
import { faqItems } from "@/lib/faq";
import { faqLd, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "الأسئلة الشائعة",
  description: "إجابات عن أكثر الأسئلة شيوعًا حول الشراء والإيجار وعرض العقار مع حِتّتنا.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd data={faqLd([...faqItems])} />
      <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "الأسئلة الشائعة" }]} />
      <h1 className="text-3xl font-semibold">الأسئلة الشائعة</h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        إجابات مختصرة تساعدك على اتخاذ قرارك بوضوح. لأي استفسار آخر يسعدنا تواصلك.
      </p>
      <div className="mt-8 divide-y divide-line rounded-sm border border-line bg-white">
        {faqItems.map((item) => (
          <details key={item.question} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              <h2 className="text-base font-medium">{item.question}</h2>
              <span aria-hidden="true" className="text-gold-dark transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-8 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button href="/contact">تواصل معنا</Button>
        <Button href="/properties" variant="secondary">
          تصفّح العقارات
        </Button>
      </div>
    </div>
  );
}
