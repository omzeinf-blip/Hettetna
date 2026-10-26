import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { WhatsAppCta } from "@/components/property/WhatsAppCta";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { hasAnyPublicContact } from "@/lib/config";
import { getContactSettings } from "@/lib/data/access";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "تواصل معنا",
  description: "أرسل استفسارك إلى فريق حِتّتنا وسنعاود التواصل معك.",
  path: "/contact",
});

export const revalidate = 120;

export default async function ContactPage() {
  const contactSettings = await getContactSettings();
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">
      <div>
        <Breadcrumbs items={[{ label: "الرئيسية", href: "/" }, { label: "تواصل معنا" }]} />
        <h1 className="text-3xl font-semibold">تواصل معنا</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          اكتب بياناتك وطبيعة طلبك، وسيعاود فريق حِتّتنا التواصل معك.
        </p>
        {hasAnyPublicContact(contactSettings) ? (
          <ul className="mt-6 space-y-2 text-sm">
            {contactSettings.phone ? <li>هاتف: {contactSettings.phone}</li> : null}
            {contactSettings.email ? <li>البريد: {contactSettings.email}</li> : null}
            {contactSettings.address ? <li>{contactSettings.address}</li> : null}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-muted">
            للتواصل معنا يرجى استخدام النموذج، وسنعاود الاتصال بك.
          </p>
        )}
        <div className="mt-6">
          <WhatsAppCta />
        </div>
      </div>
      <InquiryForm kind="contact" />
    </div>
  );
}
