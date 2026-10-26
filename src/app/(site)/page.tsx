import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { HeroSearch } from "@/components/search/HeroSearch";
import { Notice } from "@/components/ui/Notice";
import { getFeaturedProperties, getProjects } from "@/lib/data/access";
import { JsonLd } from "@/components/seo/JsonLd";
import { getContactSettings } from "@/lib/data/access";
import { organizationLd, websiteLd } from "@/lib/seo";
import { settle } from "@/lib/data/settle";
import { projectPath } from "@/lib/slug";
import { stockImages } from "@/lib/data/images";
import { areaLabels, copy, deliveryLabels, propertyTypeLabels } from "@/lib/i18n";
import { brand, demoModeEnabled } from "@/lib/config";

const highlights = [
  {
    title: "اختيارات تناسب احتياجك",
    text: "نبدأ من طريقة استخدامك للعقار وميزانيتك، ثم نرشّح لك ما يناسبك فعلًا.",
  },
  {
    title: "معلومات واضحة قبل المعاينة",
    text: "نعرض بيانات كل عقار مع حالة التوفر وتاريخ آخر تحقق منها، وما لم يتم التحقق منه نذكره صراحةً.",
  },
  {
    title: "تنسيق كامل حتى إتمام الاتفاق",
    text: "من أول استفسار إلى المعاينة وخطوات الاتفاق، ننسّق معك كل مرحلة بوضوح.",
  },
];

const steps = [
  "حدّد احتياجك وميزانيتك",
  "نرشّح لك العقارات المناسبة",
  "ننسّق لك موعد المعاينة",
  "نتابع معك خطوات الاتفاق",
];

export const revalidate = 60;

export const metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [featured, projectList, contact] = await Promise.all([
    settle(getFeaturedProperties()),
    settle(getProjects()),
    getContactSettings(),
  ]);
  const properties = featured.data ?? [];
  const projects = projectList.data ?? [];

  return (
    <div>
      <JsonLd data={organizationLd(contact)} />
      <JsonLd data={websiteLd()} />
      <section className="relative overflow-hidden bg-forest-dark text-ivory">
        <div className="absolute inset-0">
          <Image
            src={stockImages.villaNight.src}
            alt={stockImages.villaNight.alt}
            fill
            priority
            className="object-cover opacity-35"
            sizes="100vw"
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <p className="font-latin text-xs tracking-[0.3em] text-gold">{brand.nameLatin}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            بيتك الجاي يبدأ من حِتّتنا
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-ivory/85">
            سواء كنت تبحث عن منزل تسكنه أو فرصة استثمارية، نساعدك على اختيار الأنسب لاحتياجاتك
            وميزانيتك في 6 أكتوبر والشيخ زايد.
          </p>
          <div className="mt-8 max-w-5xl">
            <HeroSearch />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="border-t border-gold pt-5">
              <h2 className="text-lg font-medium">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">عقارات مختارة</h2>
            <p className="mt-2 text-sm text-muted">
              {demoModeEnabled
                ? "نماذج للعرض توضّح شكل البطاقات والفلاتر."
                : "أحدث العقارات المعروضة."}
            </p>
          </div>
          <Button href="/properties" variant="secondary">
            كل العقارات
          </Button>
        </div>
        {featured.failed ? (
          <Notice tone="error" title="تعذر تحميل العقارات الآن" actionHref="/properties" actionLabel="كل العقارات">
            حصلت مشكلة مؤقتة. حاول تحديث الصفحة بعد قليل.
          </Notice>
        ) : properties.length ? (
          <PropertyGrid properties={properties} />
        ) : (
          <Notice title="عقارات جديدة قريبًا" actionHref="/contact" actionLabel={copy.contactCta}>
            نجهّز حاليًا قائمة العقارات المعروضة. أرسل لنا ما تبحث عنه وسنرشّح لك الأنسب.
          </Notice>
        )}
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-semibold">استكشف المناطق</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(areaLabels).map(([id, label], index) => {
              const areaImage = [
                stockImages.compound,
                stockImages.villaPool,
                stockImages.townhouse,
                stockImages.street,
              ][index] ?? stockImages.compound;
              return (
              <Link
                key={id}
                href={`/properties?area=${id}`}
                className="group overflow-hidden rounded-sm border border-line"
              >
                <div className="relative aspect-[5/4]">
                  <Image
                    src={areaImage.src}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="25vw"
                  />
                  <div className="absolute inset-0 bg-forest-dark/45" />
                  <p className="absolute bottom-4 right-4 text-lg text-ivory">{label}</p>
                </div>
              </Link>
            );
            })}
          </div>
        </div>
      </section>

      {projects.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold">مشروعات مطورين</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            البيع الأساسي يختلف عن إعادة البيع.
            {demoModeEnabled ? " المشروعات التالية تجريبية ولا تعني شراكة مع مطور." : ""}
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={projectPath(project.slug)}
                className="overflow-hidden rounded-sm border border-line bg-white"
              >
                <div className="relative aspect-[16/10] bg-line">
                  {project.images[0] ? (
                    <Image
                      src={project.images[0].src}
                      alt={project.images[0].alt || project.name}
                      fill
                      className="object-cover"
                      sizes="33vw"
                    />
                  ) : null}
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-xs text-gold-dark">
                    {project.isDemo ? "بيع مطور · بيانات تجريبية" : "بيع مطور"}
                  </p>
                  <h3 className="text-lg font-medium">{project.name}</h3>
                  <p className="text-sm text-muted">{project.areaName}</p>
                  {project.deliveryStatus ? (
                    <p className="text-xs text-muted">{deliveryLabels[project.deliveryStatus]}</p>
                  ) : null}
                  <p className="text-xs text-muted">
                    {project.unitTypes.map((type) => propertyTypeLabels[type]).join(" · ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-semibold">كيف نعمل</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step} className="border-r border-line pr-4">
                <span className="font-latin text-sm text-gold-dark">0{index + 1}</span>
                <p className="mt-2 text-base font-medium">{step}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-muted">
            لديك أسئلة قبل أن تبدأ؟{" "}
            <Link href="/faq" className="text-forest underline underline-offset-4">
              اطّلع على الأسئلة الشائعة
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-sm bg-forest px-6 py-12 text-ivory md:px-12">
          <h2 className="text-3xl font-semibold">هل لديك عقار للبيع أو الإيجار؟</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ivory/80">
            أرسل لنا التفاصيل، وسيراجع فريق حِتّتنا بيانات العقار ويتواصل معك.
          </p>
          <div className="mt-6">
            <Button href="/list-property" variant="gold">
              {copy.listPropertyCta}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
