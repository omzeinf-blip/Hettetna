import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL = "https://proj.supabase.co";
const { buildPropertyQuery, searchTokens } = await import("@/lib/data/query");
const { filtersFromSearchParams, parsePage } = await import("@/lib/filters");
const { mapProperty, mapProject, parseImages } = await import("@/lib/data/mappers");
const { validateInquiry } = await import("@/lib/validation");
const { sniffImage } = await import("@/lib/admin/sniff");
const { jwtExpiry, isExpiringSoon } = await import("@/lib/admin/jwt");
const { parsePropertyForm, parseProjectForm, parseSettingsForm, slugify } = await import("@/lib/admin/validate");
const { safeAdminPath } = await import("@/lib/admin/cookies");

test("search tokens strip PostgREST/LIKE metacharacters and cap length", () => {
  assert.deepEqual(searchTokens("  شقة*  (6 أكتوبر),or=x% _ "), ["شقة", "6", "أكتوبر", "or", "x"]);
  assert.equal(searchTokens("a b c d e f g").length, 5);
  assert.deepEqual(searchTokens(undefined), []);
});

test("filters from URL are whitelisted", () => {
  const f = filtersFromSearchParams({
    area: "evil),delete", type: "villa", transaction: "x", sort: "drop table", minPrice: "-5", beds: "abc", q: "z".repeat(300),
  });
  assert.equal(f.areaId, "");
  assert.equal(f.propertyType, "villa");
  assert.equal(f.transactionType, "");
  assert.equal(f.sort, "newest");
  assert.equal(f.minPrice, undefined);
  assert.equal(f.minBedrooms, undefined);
  assert.equal(f.q?.length, 100);
});

test("page parameter is clamped", () => {
  assert.equal(parsePage({ page: "3" }), 3);
  assert.equal(parsePage({ page: "0" }), 1);
  assert.equal(parsePage({ page: "-4" }), 1);
  assert.equal(parsePage({ page: "x" }), 1);
  assert.equal(parsePage({ page: "99999999" }), 1);
});

test("property query: public-only, filters, stable order, pagination", () => {
  const q = buildPropertyQuery(
    { areaId: "sheikh-zayed", propertyType: "villa", minPrice: 1000, maxPrice: 5000, minBedrooms: 3, q: "حديقة", sort: "price-asc" },
    3, 12,
  );
  assert.equal(q.get("published"), "eq.true");
  assert.equal(q.get("is_demo"), "eq.false");
  assert.equal(q.get("area_id"), "eq.sheikh-zayed");
  assert.equal(q.get("property_type"), "eq.villa");
  assert.deepEqual(q.getAll("price"), ["gte.1000", "lte.5000"]);
  assert.equal(q.get("bedrooms"), "gte.3");
  assert.deepEqual(q.getAll("search_text"), ["ilike.*حديقة*"]);
  assert.equal(q.get("order"), "price.asc,id.asc");
  assert.equal(q.get("limit"), "12");
  assert.equal(q.get("offset"), "24");
  assert.ok(!q.get("select")!.includes("created_by"), "never selects staff audit columns");
  assert.ok(!q.get("select")!.includes("search_text"));
});

test("mappers tolerate nulls, numeric strings and bad data", () => {
  const p = mapProperty({
    id: "1", slug: "s", property_code: "HT-1", title: "t", transaction_type: "weird", property_type: "villa",
    city: "الجيزة", area_id: "sheikh-zayed", area_name: "الشيخ زايد", compound: null, neighborhood: null,
    price: "3500000.50", currency: "EGP", area_sqm: "180", bedrooms: null, bathrooms: 2, finishing: null,
    furnishing: null, floor: null, delivery_status: null, description: "d", features: null,
    images: [{ src: "https://x/y.jpg", alt: "a" }, { src: "javascript:alert(1)", alt: "b" }, null, 5],
    listing_source: "owner", availability_status: "available", last_availability_check: "2026-10-01",
    legal_review_status: "reviewed", payment_plan_note: null, is_demo: false, published_at: null, created_at: "2026-10-02T00:00:00Z",
  });
  assert.equal(p.price, 3500000.5);
  assert.equal(p.areaSqm, 180);
  assert.equal(p.transactionType, "sale");
  assert.equal(p.bedrooms, undefined);
  assert.equal(p.bathrooms, 2);
  assert.deepEqual(p.features, []);
  assert.equal(p.images.length, 1, "only http(s) images survive");
  assert.equal(p.publishedAt, "2026-10-02T00:00:00Z");
  const project = mapProject({ id: "2", slug: "p", name: "n", developer: null, area_id: "x", area_name: "a", city: "c", description: "d", delivery_status: null, payment_plan_note: null, images: null, is_demo: false, is_primary_sales: true, unit_types: ["villa", "boat"], published_at: null });
  assert.deepEqual(project.unitTypes, ["villa"]);
  assert.deepEqual(parseImages("nope"), []);
});

const base = { name: "أحمد محمد علي", phone: "01012345678", consent: true };

test("inquiry validation", () => {
  assert.ok(validateInquiry("contact", base).data);
  assert.ok(validateInquiry("contact", { ...base, phone: "123" }).errors.phone);
  assert.ok(validateInquiry("contact", { ...base, consent: false }).errors.consent);
  assert.ok(validateInquiry("contact", { ...base, email: "not-an-email" }).errors.email);
  assert.equal(validateInquiry("contact", { ...base, email: "a@b.co" }).data?.email, "a@b.co");
  assert.ok(validateInquiry("buyer", { ...base, transactionType: "primary" }).errors.transactionType);
  assert.ok(validateInquiry("buyer", { ...base, transactionType: "sale", budgetMin: "5", budgetMax: "1" }).errors.budgetMax);
  assert.ok(validateInquiry("buyer", { ...base, transactionType: "sale", budgetMin: "-1" }).errors.budgetMin);
  assert.ok(validateInquiry("owner", { ...base, transactionType: "sale", propertyType: "villa", preferredLocation: "sheikh-zayed", areaSqm: "0" }).errors.areaSqm);
  assert.ok(validateInquiry("contact", { ...base, notes: "x".repeat(2001) }).errors.notes);
  assert.ok(validateInquiry("contact", { ...base, name: "x".repeat(121) }).errors.name);
});

test("image sniffing trusts bytes, not names or declared types", () => {
  assert.equal(sniffImage(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0]))?.ext, "jpg");
  assert.equal(sniffImage(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]))?.ext, "png");
  const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
  assert.equal(sniffImage(webp)?.mime, "image/webp");
  assert.equal(sniffImage(new TextEncoder().encode("<svg onload=alert(1)>")), null);
  assert.equal(sniffImage(new TextEncoder().encode("GIF89a")), null);
  assert.equal(sniffImage(new Uint8Array()), null);
});

test("jwt expiry helpers", () => {
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const tok = (exp: number) => `${enc({})}.${enc({ exp })}.s`;
  const now = Date.now();
  assert.equal(jwtExpiry(tok(123)), 123);
  assert.equal(isExpiringSoon(tok(Math.floor(now / 1000) + 3600), 60, now), false);
  assert.equal(isExpiringSoon(tok(Math.floor(now / 1000) + 10), 60, now), true);
  assert.equal(isExpiringSoon("garbage", 60, now), true);
});

test("admin redirect targets are restricted to /admin", () => {
  assert.equal(safeAdminPath("/admin/properties"), "/admin/properties");
  assert.equal(safeAdminPath("https://evil.com"), "/admin");
  assert.equal(safeAdminPath("//evil.com"), "/admin");
  assert.equal(safeAdminPath("/administrator-fake"), "/admin");
  assert.equal(safeAdminPath("/admin/../etc"), "/admin/../etc", "same-origin path; the router normalises it");
  assert.equal(safeAdminPath(undefined), "/admin");
});

function form(entries: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) for (const item of Array.isArray(v) ? v : [v]) fd.append(k, item);
  return fd;
}
const goodImage = JSON.stringify([{ src: "https://proj.supabase.co/storage/v1/object/public/property-images/properties/a.webp", alt: "x" }]);
const property = {
  propertyCode: "HT-1001", title: "شقة للبيع", transactionType: "sale", propertyType: "apartment", areaId: "6th-october",
  price: "3500000", areaSqm: "150", listingSource: "owner", description: "وصف طويل بما يكفي للنشر على الموقع", images: goodImage,
};

test("admin property form: happy path, derived fields, no demo source", () => {
  const { values, errors } = parsePropertyForm(form(property));
  assert.deepEqual(errors, {});
  assert.equal(values?.slug, "apartment-6th-october-ht-1001");
  assert.equal(values?.area_name, "6 أكتوبر");
  assert.equal(values?.city, "الجيزة");
  assert.equal(values?.published, false);
  assert.equal(values?.availability_status, "pending-verification");
  assert.ok(parsePropertyForm(form({ ...property, listingSource: "demo" })).errors.listingSource);
});

test("admin property form: availability must carry a check date; publish needs image + description", () => {
  const v = parsePropertyForm(form({ ...property, availabilityStatus: "available" })).values;
  assert.match(v!.last_availability_check!, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(parsePropertyForm(form({ ...property, lastAvailabilityCheck: "2999-01-01" })).errors.lastAvailabilityCheck);
  assert.ok(parsePropertyForm(form({ ...property, published: "on", images: "[]" })).errors.images);
  assert.ok(parsePropertyForm(form({ ...property, published: "on", description: "قصير" })).errors.description);
  assert.equal(parsePropertyForm(form({ ...property, published: "on" })).values?.published, true);
});

test("admin property form: rejects bad numbers, enums and foreign image hosts", () => {
  const e = parsePropertyForm(form({ ...property, price: "0", areaSqm: "-3", bedrooms: "1.5", finishing: "luxury", propertyType: "castle" })).errors;
  assert.ok(e.price && e.areaSqm && e.bedrooms && e.finishing && e.propertyType);
  const foreign = JSON.stringify([{ src: "https://evil.example/x.jpg", alt: "" }]);
  assert.ok(parsePropertyForm(form({ ...property, images: foreign })).errors.images);
  assert.ok(parsePropertyForm(form({ ...property, images: "{not json" })).errors.images);
});

test("admin project and settings forms", () => {
  const p = parseProjectForm(form({ name: "مشروع الأمل", areaId: "new-zayed", unitTypes: ["villa", "duplex"], isPrimarySales: "on" }));
  assert.equal(p.values?.slug, "مشروع-الأمل");
  assert.deepEqual(p.values?.unit_types, ["villa", "duplex"]);
  assert.ok(parseProjectForm(form({ name: "x", areaId: "new-zayed", unitTypes: ["castle"] })).errors.unitTypes);

  const s = parseSettingsForm(form({ whatsappNumber: "+20 10 1234 5678", phone: "", email: "info@example.com", instagramUrl: "https://instagram.com/x" }));
  assert.equal(s.values?.whatsapp_number, "201012345678");
  assert.equal(s.values?.phone, null);
  assert.ok(parseSettingsForm(form({ facebookUrl: "javascript:alert(1)" })).errors.facebookUrl);
  assert.ok(parseSettingsForm(form({ instagramUrl: "http://insecure.example" })).errors.instagramUrl);
  assert.ok(parseSettingsForm(form({ whatsappNumber: "abc" })).errors.whatsappNumber);
  assert.equal(slugify("  Hello World!! "), "hello-world");
});
