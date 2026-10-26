import type { Metadata } from "next";
import { brand, companyInfo, siteUrl } from "@/lib/config";
import { propertyPath } from "@/lib/slug";
import type { ContactSettings, Project, Property, PropertyType } from "@/lib/types";

export const absoluteUrl = (path: string) => `${siteUrl}${path}`;

/** Serialises JSON-LD safely for an inline <script>: user-entered text can never close the tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Canonical URL, Open Graph and Twitter metadata for a page. */
export function pageMeta({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image?: { src: string; alt?: string };
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      locale: "ar_EG",
      siteName: brand.nameLatin,
      images: image ? [{ url: image.src, alt: image.alt || title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image.src] : undefined,
    },
  };
}

const orUndefined = (value: string) => (value ? value : undefined);

export function organizationLd(settings: ContactSettings, company = companyInfo) {
  const sameAs = [settings.instagramUrl, settings.facebookUrl, settings.linkedinUrl].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${siteUrl}/#organization`,
    name: brand.nameArabic,
    alternateName: brand.nameLatin,
    legalName: orUndefined(company.legalName),
    url: siteUrl,
    logo: absoluteUrl("/images/icon-512.png"),
    image: absoluteUrl("/opengraph-image.png"),
    slogan: brand.tagline,
    areaServed: brand.cityFocus.map((name) => ({ "@type": "City", name })),
    telephone: orUndefined(settings.phone),
    email: orUndefined(settings.email),
    address: settings.address
      ? { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "EG" }
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${brand.nameArabic} | ${brand.nameLatin}`,
    url: siteUrl,
    inLanguage: "ar",
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/properties?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export type Crumb = { label: string; href?: string };

export function breadcrumbLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? absoluteUrl(item.href) : undefined,
    })),
  };
}

export function faqLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

const schemaType: Record<PropertyType, string> = {
  apartment: "Apartment",
  duplex: "Apartment",
  villa: "House",
  townhouse: "House",
  twinhouse: "House",
  land: "Place",
  commercial: "Place",
};

/** Listing markup. Never emitted for demo records, and only states facts the record actually contains. */
export function propertyLd(property: Property) {
  if (property.isDemo) return null;
  const residential = schemaType[property.propertyType] !== "Place";
  const availability =
    property.availabilityStatus === "available"
      ? "https://schema.org/InStock"
      : property.availabilityStatus === "unavailable"
        ? "https://schema.org/OutOfStock"
        : undefined;
  const url = absoluteUrl(propertyPath(property.slug));

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    url,
    description: property.description.slice(0, 300),
    datePosted: property.publishedAt,
    image: property.images.length ? property.images.map((image) => image.src) : undefined,
    about: {
      "@type": schemaType[property.propertyType],
      name: property.title,
      address: {
        "@type": "PostalAddress",
        addressLocality: property.areaName,
        addressRegion: property.city,
        addressCountry: "EG",
      },
      floorSize: { "@type": "QuantitativeValue", value: property.areaSqm, unitCode: "MTK" },
      numberOfBedrooms: residential ? property.bedrooms : undefined,
      numberOfBathroomsTotal: residential ? property.bathrooms : undefined,
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "EGP",
      availability,
      url,
      priceSpecification:
        property.transactionType === "rent"
          ? {
              "@type": "UnitPriceSpecification",
              price: property.price,
              priceCurrency: "EGP",
              unitCode: "MON",
            }
          : undefined,
    },
  };
}

export function projectLd(project: Project, path: string) {
  if (project.isDemo) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: project.name,
    url: absoluteUrl(path),
    description: project.description.slice(0, 300),
    image: project.images.length ? project.images.map((image) => image.src) : undefined,
    about: {
      "@type": "Place",
      name: project.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: project.areaName,
        addressRegion: project.city,
        addressCountry: "EG",
      },
    },
  };
}
