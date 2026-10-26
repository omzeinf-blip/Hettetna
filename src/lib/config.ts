import type { ContactSettings } from "@/lib/types";

function readPublic(name: string): string {
  return (process.env[name] ?? "").trim();
}

/** Demo data is shown ONLY when NEXT_PUBLIC_DEMO_MODE is explicitly "true" (safe default for production). */
export const demoModeEnabled = readPublic("NEXT_PUBLIC_DEMO_MODE").toLowerCase() === "true";

/** Set NEXT_PUBLIC_PRIVACY_REVIEWED=true once the privacy policy text has been legally reviewed and approved. */
export const privacyReviewed = readPublic("NEXT_PUBLIC_PRIVACY_REVIEWED").toLowerCase() === "true";

export const siteUrl =
  readPublic("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "") || "http://localhost:3000";

export const brand = {
  nameLatin: "HETTETNA",
  nameArabic: "حِتّتنا",
  tagline: "عارفين حتّتك",
  cityFocus: ["6 أكتوبر", "الشيخ زايد"],
} as const;

export const contactSettings: ContactSettings = {
  whatsappNumber: readPublic("NEXT_PUBLIC_WHATSAPP_NUMBER").replace(/\D/g, ""),
  phone: readPublic("NEXT_PUBLIC_CONTACT_PHONE"),
  email: readPublic("NEXT_PUBLIC_CONTACT_EMAIL"),
  address: readPublic("NEXT_PUBLIC_CONTACT_ADDRESS"),
  instagramUrl: readPublic("NEXT_PUBLIC_INSTAGRAM_URL"),
  facebookUrl: readPublic("NEXT_PUBLIC_FACEBOOK_URL"),
  linkedinUrl: readPublic("NEXT_PUBLIC_LINKEDIN_URL"),
};

/** Contact settings from environment variables. Used in demo mode and as a fallback only. */
export const envContactSettings = contactSettings;

export function hasWhatsApp(settings: ContactSettings = contactSettings): boolean {
  return settings.whatsappNumber.length >= 10;
}

export function hasAnyPublicContact(settings: ContactSettings = contactSettings): boolean {
  return Boolean(
    settings.phone || settings.email || settings.address || hasWhatsApp(settings),
  );
}

/**
 * Official company details. Shown on the site ONLY when provided via environment variables,
 * so nothing is ever invented. Set them in the hosting environment once they are confirmed.
 */
export const companyInfo = {
  legalName: readPublic("NEXT_PUBLIC_COMPANY_LEGAL_NAME"),
  commercialRegister: readPublic("NEXT_PUBLIC_COMMERCIAL_REGISTER"),
  brokerLicense: readPublic("NEXT_PUBLIC_BROKER_LICENSE"),
};

export function hasCompanyInfo(info = companyInfo): boolean {
  return Boolean(info.legalName || info.commercialRegister || info.brokerLicense);
}

export const navItems = [
  { href: "/", label: "الرئيسية" },
  { href: "/properties", label: "العقارات" },
  { href: "/projects", label: "المشروعات" },
  { href: "/about", label: "عن حِتّتنا" },
  { href: "/contact", label: "تواصل معنا" },
] as const;
