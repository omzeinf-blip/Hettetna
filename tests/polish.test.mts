import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
process.env.SUPABASE_URL = "https://proj.supabase.co";
const seo = await import("@/lib/seo");
const { faqItems } = await import("@/lib/faq");
const { validateInquiry } = await import("@/lib/validation");
const manifest = (await import("@/app/manifest")).default;

const empty = { whatsappNumber: "", phone: "", email: "", address: "", instagramUrl: "", facebookUrl: "", linkedinUrl: "" };
const noCompany = { legalName: "", commercialRegister: "", brokerLicense: "" };
const property = {
  id: "1", slug: "شقة-1", propertyCode: "HT-1", title: "شقة للبيع", transactionType: "sale", propertyType: "apartment",
  city: "الجيزة", areaId: "6th-october", areaName: "6 أكتوبر", price: 3500000, currency: "EGP", areaSqm: 150,
  bedrooms: 3, bathrooms: 2, description: "و".repeat(500), features: [], images: [{ src: "https://x.test/a.webp", alt: "" }],
  listingSource: "owner", availabilityStatus: "available", legalReviewStatus: "not-reviewed",
  publishedAt: "2026-10-25T00:00:00Z", isDemo: false,
} as const;

test("JSON-LD serialisation can never break out of its <script> tag", () => {
  const evil = { name: "</script><script>alert(1)</script>", note: "a & b <b>" };
  const out = seo.jsonLdString(evil);
  assert.ok(!/[<>&]/.test(out));
  assert.deepEqual(JSON.parse(out), evil, "still valid JSON that decodes to the original text");
});

test("organization markup states only what was provided (nothing invented)", () => {
  const bare = JSON.parse(JSON.stringify(seo.organizationLd(empty, noCompany)));
  for (const key of ["telephone", "email", "address", "sameAs", "legalName"]) assert.ok(!(key in bare), `${key} must be absent`);
  assert.equal(bare.name, "حِتّتنا");
  const full = JSON.parse(JSON.stringify(seo.organizationLd(
    { ...empty, phone: "0100", email: "a@b.co", address: "عنوان", instagramUrl: "https://i.test/x" },
    { legalName: "شركة", commercialRegister: "1", brokerLicense: "2" },
  )));
  assert.equal(full.telephone, "0100");
  assert.equal(full.legalName, "شركة");
  assert.deepEqual(full.sameAs, ["https://i.test/x"]);
  assert.equal(full.address.addressCountry, "EG");
});

test("listing markup: facts only, never for demo data", () => {
  const ld = JSON.parse(JSON.stringify(seo.propertyLd(property as never)));
  assert.equal(ld["@type"], "RealEstateListing");
  assert.equal(ld.offers.availability, "https://schema.org/InStock");
  assert.equal(ld.offers.price, 3500000);
  assert.equal(ld.description.length, 300);
  assert.equal(ld.about["@type"], "Apartment");
  assert.equal(ld.about.numberOfBedrooms, 3);
  assert.ok(ld.url.startsWith("https://example.test/properties/"));
  assert.equal(seo.propertyLd({ ...property, isDemo: true } as never), null);

  const unknown = JSON.parse(JSON.stringify(seo.propertyLd({ ...property, availabilityStatus: "pending-verification" } as never)));
  assert.ok(!("availability" in unknown.offers), "unverified availability is never claimed");
  const rent = JSON.parse(JSON.stringify(seo.propertyLd({ ...property, transactionType: "rent" } as never)));
  assert.equal(rent.offers.priceSpecification.unitCode, "MON");
  const land = JSON.parse(JSON.stringify(seo.propertyLd({ ...property, propertyType: "land", bedrooms: undefined } as never)));
  assert.equal(land.about["@type"], "Place");
  assert.ok(!("numberOfBedrooms" in land.about));
});

test("breadcrumb, FAQ and page metadata", () => {
  const b = JSON.parse(JSON.stringify(seo.breadcrumbLd([{ label: "الرئيسية", href: "/" }, { label: "العقارات", href: "/properties" }, { label: "شقة" }])));
  assert.deepEqual(b.itemListElement.map((i: { position: number }) => i.position), [1, 2, 3]);
  assert.equal(b.itemListElement[1].item, "https://example.test/properties");
  assert.ok(!("item" in b.itemListElement[2]), "current page has no link");
  assert.equal(seo.faqLd([...faqItems]).mainEntity.length, faqItems.length);
  assert.ok(faqItems.every((i) => i.question.length > 5 && i.answer.length > 20));

  const meta = seo.pageMeta({ title: "ت", description: "د", path: "/about", image: { src: "https://x.test/i.webp" } });
  assert.equal(meta.alternates?.canonical, "/about");
  assert.equal((meta.twitter as { card: string }).card, "summary_large_image");
  assert.equal((meta.openGraph as { images: { url: string }[] }).images[0].url, "https://x.test/i.webp");
});

const pngSize = (file: string) => {
  const b = readFileSync(file);
  assert.equal(b.subarray(1, 4).toString(), "PNG", `${file} is a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

test("brand assets exist with correct dimensions; manifest points at real files", () => {
  assert.deepEqual(pngSize("src/app/opengraph-image.png"), [1200, 630]);
  assert.deepEqual(pngSize("src/app/twitter-image.png"), [1200, 630]);
  assert.deepEqual(pngSize("src/app/icon.png"), [512, 512]);
  assert.deepEqual(pngSize("src/app/apple-icon.png"), [180, 180]);
  assert.deepEqual([...readFileSync("src/app/favicon.ico").subarray(0, 4)], [0, 0, 1, 0], "valid ICO header");
  const m = manifest();
  assert.equal(m.theme_color, "#153d32");
  assert.equal(m.dir, "rtl");
  for (const icon of m.icons ?? []) assert.ok(existsSync(join("public", icon.src)), `${icon.src} exists`);
});

// ---- accessibility guards
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const token = (name: string) => readFileSync("src/app/globals.css", "utf8").match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))![1];

test("text colours meet WCAG AA (4.5:1) on the light surfaces", () => {
  for (const [fg, bg] of [["muted", "ivory"], ["muted", "white"], ["gold-dark", "ivory"], ["gold-dark", "white"], ["ink", "ivory"], ["forest", "ivory"]]) {
    assert.ok(ratio(token(fg), token(bg)) >= 4.5, `${fg} on ${bg} = ${ratio(token(fg), token(bg)).toFixed(2)}`);
  }
});

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const publicSources = [...walk("src/app/(site)"), ...walk("src/components"), "src/lib/i18n.ts", "src/lib/faq.ts"]
  .filter((f) => /\.(tsx|ts)$/.test(f) && !f.includes("components/admin"));

test("light-background text never uses the low-contrast brand gold", () => {
  const allowed = new Map([["src/app/(site)/page.tsx", 1], ["src/components/layout/Header.tsx", 1]]); // hero label + header link sit on dark green
  for (const file of publicSources) {
    const count = (readFileSync(file, "utf8").match(/text-gold(?![-\w])/g) ?? []).length;
    assert.equal(count, allowed.get(file) ?? 0, `${file} uses text-gold ${count}x`);
  }
});

test("skip link, main landmark, dialog and gallery semantics are present", () => {
  const layout = readFileSync("src/app/(site)/layout.tsx", "utf8");
  assert.match(layout, /href="#main"/);
  assert.match(layout, /<main id="main"/);
  assert.match(readFileSync("src/components/search/FilterPanel.tsx", "utf8"), /role="dialog"[\s\S]*aria-modal="true"/);
  assert.match(readFileSync("src/components/search/FilterPanel.tsx", "utf8"), /key === "Escape"/);
  const gallery = readFileSync("src/components/property/PropertyGallery.tsx", "utf8");
  assert.match(gallery, /الصورة التالية/);
  assert.match(gallery, /ArrowLeft/);
});

test("public copy contains no invented credentials or superlatives", () => {
  const banned = /\d+\s*\+?\s*(عامًا|عام|سنة|سنوات)\s*(من\s*)?(الخبرة|في السوق)|\d+\s*\+?\s*(عميل|صفقة|وحدة مباعة)|الأفضل في|الأولى في|رقم\s*1|معتمد من|حائز على/;
  for (const file of publicSources) assert.doesNotMatch(readFileSync(file, "utf8"), banned, file);
});

test("owner-facing wording (dev notes / setup hints) is not shown to visitors", () => {
  const leaked = /غير مُعدّ|في الإعدادات|اختراع|بعد اعتمادها|ستظهر هنا بعد|مسودة للمراجعة/;
  for (const file of publicSources.filter((f) => !f.includes("privacy"))) {
    assert.doesNotMatch(readFileSync(file, "utf8"), leaked, file);
  }
});

test("inquiry subject is merged into the notes safely and within the database limit", () => {
  const base = { name: "أحمد محمد علي", phone: "01012345678", consent: true, transactionType: "sale" };
  assert.equal(validateInquiry("buyer", { ...base, subject: "مشروع  الأمل\n", notes: "أريد التفاصيل" }).data?.notes, "بخصوص: مشروع الأمل\nأريد التفاصيل");
  assert.equal(validateInquiry("buyer", { ...base, subject: "مشروع الأمل" }).data?.notes, "بخصوص: مشروع الأمل");
  assert.equal(validateInquiry("buyer", { ...base, notes: "فقط" }).data?.notes, "فقط");
  const longest = validateInquiry("buyer", { ...base, subject: "م".repeat(500), notes: "ن".repeat(1800) }).data?.notes ?? "";
  assert.ok(longest.length <= 2000, `merged notes ${longest.length} chars must fit the DB limit`);
  assert.ok(validateInquiry("buyer", { ...base, notes: "ن".repeat(1801) }).errors.notes);
});

test(".env.example documents the company-detail variables", () => {
  const env = readFileSync(".env.example", "utf8");
  for (const name of ["NEXT_PUBLIC_COMPANY_LEGAL_NAME", "NEXT_PUBLIC_COMMERCIAL_REGISTER", "NEXT_PUBLIC_BROKER_LICENSE"]) assert.match(env, new RegExp(name));
});
