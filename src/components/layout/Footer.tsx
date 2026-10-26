import Link from "next/link";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { brand, companyInfo, hasAnyPublicContact, hasCompanyInfo, hasWhatsApp, navItems, privacyReviewed } from "@/lib/config";
import { getContactSettings } from "@/lib/data/access";
import { buildWhatsAppLink } from "@/lib/format";
import { areaLabels } from "@/lib/i18n";

export async function Footer() {
  const contactSettings = await getContactSettings();
  const socialLinks = [
    { href: contactSettings.instagramUrl, label: "إنستجرام" },
    { href: contactSettings.facebookUrl, label: "فيسبوك" },
    { href: contactSettings.linkedinUrl, label: "لينكدإن" },
  ].filter((item) => item.href);
  const phoneDigits = contactSettings.phone.replace(/[^\d+]/g, "");

  return (
    <footer className="mt-16 border-t border-line bg-forest-dark text-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <BrandLockup variant="footer" />
          <p className="text-sm leading-7 text-ivory/80">{brand.tagline}</p>
          <p className="text-sm leading-7 text-ivory/70">
            وساطة عقارية متخصصة في 6 أكتوبر والشيخ زايد.
          </p>
        </div>
        <nav aria-label="روابط الموقع">
          <h2 className="mb-3 text-sm font-medium">تصفح</h2>
          <ul className="space-y-2 text-sm text-ivory/80">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-ivory">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/list-property" className="hover:text-ivory">
                اعرض عقارك
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-ivory">
                الأسئلة الشائعة
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="مناطق الخدمة">
          <h2 className="mb-3 text-sm font-medium">مناطق الخدمة</h2>
          <ul className="space-y-2 text-sm text-ivory/80">
            {Object.entries(areaLabels).map(([id, label]) => (
              <li key={id}>
                <Link href={`/properties?area=${id}`} className="hover:text-ivory">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-3 text-sm text-ivory/80">
          <h2 className="text-sm font-medium text-ivory">التواصل</h2>
          {hasAnyPublicContact(contactSettings) ? (
            <ul className="space-y-2">
              {contactSettings.phone ? (
                <li>
                  <a href={`tel:${phoneDigits}`} className="hover:text-ivory" dir="ltr">
                    {contactSettings.phone}
                  </a>
                </li>
              ) : null}
              {hasWhatsApp(contactSettings) ? (
                <li>
                  <a
                    href={buildWhatsAppLink(contactSettings.whatsappNumber, "مرحبًا، أريد الاستفسار عن عقارات حِتّتنا.")}
                    className="hover:text-ivory"
                    target="_blank"
                    rel="noreferrer"
                  >
                    واتساب
                  </a>
                </li>
              ) : null}
              {contactSettings.email ? (
                <li>
                  <a href={`mailto:${contactSettings.email}`} className="hover:text-ivory" dir="ltr">
                    {contactSettings.email}
                  </a>
                </li>
              ) : null}
              {contactSettings.address ? <li>{contactSettings.address}</li> : null}
            </ul>
          ) : (
            <p>
              للتواصل معنا يرجى استخدام{" "}
              <Link href="/contact" className="underline">
                نموذج التواصل
              </Link>
              .
            </p>
          )}
          {socialLinks.length > 0 ? (
            <ul className="flex flex-wrap gap-3 pt-2">
              {socialLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="underline" rel="noreferrer" target="_blank">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-ivory/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {companyInfo.legalName || `${brand.nameLatin} | ${brand.nameArabic}`}
            {hasCompanyInfo() && companyInfo.commercialRegister ? ` · سجل تجاري ${companyInfo.commercialRegister}` : ""}
            {hasCompanyInfo() && companyInfo.brokerLicense ? ` · ترخيص وساطة ${companyInfo.brokerLicense}` : ""}
          </p>
          <div className="flex gap-4">
            <Link href="/faq" className="hover:text-ivory">
              الأسئلة الشائعة
            </Link>
            <Link href="/privacy" className="hover:text-ivory">
              {privacyReviewed ? "سياسة الخصوصية" : "سياسة الخصوصية (مسودة)"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
