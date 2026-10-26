import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { MobileActionBar } from "@/components/property/MobileActionBar";
import { ShareActions } from "@/components/property/ShareActions";
import { WhatsAppCta } from "@/components/property/WhatsAppCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { hasWhatsApp } from "@/lib/config";
import { getContactSettings, getPropertyBySlug, getSimilarProperties } from "@/lib/data/access";
import { settle } from "@/lib/data/settle";
import { decodeSlug, propertyPath } from "@/lib/slug";
import { absoluteUrl, pageMeta, propertyLd } from "@/lib/seo";
import { buildWhatsAppLink, formatDate, formatEGP, formatSqm } from "@/lib/format";
import {
  availabilityLabels,
  copy,
  deliveryLabels,
  finishingLabels,
  furnishingLabels,
  legalLabels,
  listingSourceLabels,
  propertyTypeLabels,
  transactionLabels,
} from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

/** Resolves the route param to a property. Only a real "no such property" returns null; data errors throw. */
async function loadProperty(params: Props["params"]) {
  const slug = decodeSlug((await params).slug);
  return slug ? getPropertyBySlug(slug) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const property = await loadProperty(params);
    if (!property) return { title: "عقار غير موجود" };
    return pageMeta({
      title: property.title,
      description: property.description.slice(0, 150),
      path: propertyPath(property.slug),
      image: property.images[0],
    });
  } catch {
    return { title: "العقارات" };
  }
}

export default async function PropertyDetailsPage({ params }: Props) {
  const property = await loadProperty(params);
  if (!property) notFound();

  const similar = (await settle(getSimilarProperties(property))).data ?? [];
  const contact = await getContactSettings();
  const whatsappHref = hasWhatsApp(contact)
    ? buildWhatsAppLink(
        contact.whatsappNumber,
        `مرحبًا، أريد الاستفسار عن العقار رقم ${property.propertyCode}.`,
      )
    : undefined;
  const crumbs = [
    { label: "الرئيسية", href: "/" },
    { label: "العقارات", href: "/properties" },
    { label: property.areaName, href: `/properties?area=${property.areaId}` },
    { label: property.title },
  ];
  const pricePerSqm =
    property.transactionType !== "rent" && property.areaSqm > 0
      ? Math.round(property.price / property.areaSqm)
      : undefined;

  const facts = [
    { label: "المساحة", value: formatSqm(property.areaSqm) },
    { label: "غرف النوم", value: property.bedrooms != null ? String(property.bedrooms) : undefined },
    { label: "الحمامات", value: property.bathrooms != null ? String(property.bathrooms) : undefined },
    { label: "التشطيب", value: property.finishing ? finishingLabels[property.finishing] : undefined },
    { label: "الفرش", value: property.furnishing ? furnishingLabels[property.furnishing] : undefined },
    { label: "الدور", value: property.floor },
    {
      label: "التسليم",
      value: property.deliveryStatus ? deliveryLabels[property.deliveryStatus] : undefined,
    },
  ].filter((item) => item.value);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-28 lg:pb-10">
      <JsonLd data={propertyLd(property)} />
      <Breadcrumbs items={crumbs} />
      <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <PropertyGallery images={property.images} title={property.title} />
          <div className="flex flex-wrap gap-2">
            <Badge tone="forest">{transactionLabels[property.transactionType]}</Badge>
            <Badge>{propertyTypeLabels[property.propertyType]}</Badge>
            {property.isDemo ? <Badge tone="gold">{copy.demoBadge}</Badge> : null}
          </div>
          <div>
            <p className="text-sm text-muted">{property.propertyCode}</p>
            <h1 className="mt-1 text-3xl font-semibold">{property.title}</h1>
            <p className="mt-2 text-muted">
              {property.areaName}
              {property.compound ? ` · ${property.compound}` : ""}
              {property.neighborhood ? ` · ${property.neighborhood}` : ""}
            </p>
          </div>
          <div>
            <p className="font-latin text-3xl font-semibold text-forest">
              {formatEGP(property.price)}
              {property.transactionType === "rent" ? (
                <span className="ms-2 text-base font-normal text-muted">/ شهريًا</span>
              ) : null}
            </p>
            {pricePerSqm ? (
              <p className="mt-1 text-sm text-muted">سعر المتر التقريبي: {formatEGP(pricePerSqm)}</p>
            ) : null}
          </div>
          <ShareActions title={property.title} url={absoluteUrl(propertyPath(property.slug))} />
          <dl className="grid grid-cols-2 gap-4 rounded-sm border border-line bg-white p-4 md:grid-cols-3">
            {facts.map((item) => (
              <div key={item.label}>
                <dt className="text-xs text-muted">{item.label}</dt>
                <dd className="mt-1 text-sm">{item.value}</dd>
              </div>
            ))}
          </dl>
          <section>
            <h2 className="text-xl font-medium">الوصف</h2>
            <p className="mt-3 leading-8 text-muted">{property.description}</p>
          </section>
          {property.features.length ? (
            <section>
              <h2 className="text-xl font-medium">المميزات</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {property.features.map((feature) => (
                  <li key={feature} className="border-r border-gold pr-3 text-sm">
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {property.paymentPlanNote ? (
            <section className="rounded-sm bg-white p-4 text-sm text-muted">
              <h2 className="font-medium text-ink">خطة السداد</h2>
              <p className="mt-2">{property.paymentPlanNote}</p>
            </section>
          ) : null}
          <section className="space-y-2 text-sm text-muted">
            <p>مصدر العرض: {listingSourceLabels[property.listingSource]}</p>
            <p>توفر الوحدة: {availabilityLabels[property.availabilityStatus]}</p>
            {property.lastAvailabilityCheck ? (
              <p>آخر تحقق من التوفر: {formatDate(property.lastAvailabilityCheck)}</p>
            ) : null}
            <p>{legalLabels[property.legalReviewStatus]}</p>
          </section>
          <p className="rounded-sm border border-line bg-white p-4 text-xs leading-6 text-muted">
            تُعرض بيانات العقار كما وردت من المالك أو الجهة المفوّضة، وتظل المعلومات إرشادية إلى حين
            المعاينة والتحقق من المستندات. ننصح بالاستعانة بمحامٍ مختص قبل أي التزام.
          </p>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
          <div id="inquiry" className="scroll-mt-28">
            <InquiryForm kind="buyer" propertyCode={property.propertyCode} />
          </div>
          <WhatsAppCta property={property} />
        </aside>
      </div>
      {similar.length ? (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold">عقارات قريبة من اهتمامك</h2>
          <PropertyGrid properties={similar} />
        </section>
      ) : null}
      <MobileActionBar whatsappHref={whatsappHref} />
    </div>
  );
}
