import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test, { after } from "node:test";
import { startMock, type Recorded, type Reply } from "./mock-supabase.mts";

const SLUG = "سشيشسيشسي"; // the Arabic slug that failed in production
const ENCODED = encodeURIComponent(SLUG); // what Next.js passes to the page as params.slug

const projectRow = {
  id: "cd4d1b5a-59dd-4be0-a8bc-5f738bfbbef1", slug: SLUG, name: "مشروع اختبار", developer: null, area_id: "6th-october",
  area_name: "6 أكتوبر", city: "الجيزة", description: "وصف طويل بما يكفي", delivery_status: null, payment_plan_note: null,
  images: [], is_demo: false, is_primary_sales: true, unit_types: ["villa"], published_at: "2026-10-25T23:04:58Z",
};

let fail = false;
function handler(r: Recorded): Reply | undefined {
  if (fail) return { status: 500, body: { message: "boom" } };
  const wantsPublic = r.query.get("published") === "eq.true" && r.query.get("is_demo") === "eq.false";
  if (r.path === "/rest/v1/projects") {
    if (r.query.get("select") === "slug,published_at") return { body: [{ slug: SLUG, published_at: "2026-10-25T23:04:58Z" }] };
    // Emulates the database: exact slug equality, public rows only.
    return { body: wantsPublic && r.query.get("slug") === `eq.${SLUG}` ? [projectRow] : [] };
  }
  if (r.path === "/rest/v1/properties") return { body: r.query.get("select") === "slug,published_at" ? [{ slug: "شقة-أكتوبر", published_at: null }] : [] };
  return undefined;
}

const mock = await startMock(handler);
process.env.SUPABASE_URL = mock.url;
process.env.SUPABASE_ANON_KEY = "anon";
process.env.NEXT_PUBLIC_DEMO_MODE = "false";
process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
after(() => mock.close());

const { decodeSlug, projectPath, propertyPath } = await import("@/lib/slug");
const { getProjectBySlug } = await import("@/lib/data/access");
const { DataError } = await import("@/lib/supabase/rest");
const sitemap = (await import("@/app/sitemap")).default;

test("decodeSlug turns the percent-encoded route param back into the stored slug", () => {
  assert.equal(decodeSlug(ENCODED), SLUG);
  assert.equal(decodeSlug("apartment-6th-october-ht-1001"), "apartment-6th-october-ht-1001");
  assert.equal(decodeSlug(SLUG), SLUG, "already-decoded input is left unchanged");
  assert.equal(decodeSlug("%E0%A4%A"), null, "malformed encoding is a 404, not a crash");
  assert.equal(decodeSlug(""), null);
  assert.equal(decodeSlug("a".repeat(601)), null);
});

test("links round-trip: the path a card builds decodes to the slug the page looks up", () => {
  for (const slug of [SLUG, "villa-sheikh-zayed-1", "a+b", "تقسيم-الأحياء-الجديدة"]) {
    const param = projectPath(slug).split("/").pop()!;
    assert.equal(decodeSlug(param), slug);
    assert.equal(decodeSlug(propertyPath(slug).split("/").pop()!), slug);
  }
});

test("REGRESSION: a published project with an Arabic slug is found once the param is decoded", async () => {
  const project = await getProjectBySlug(decodeSlug(ENCODED)!);
  assert.equal(project?.name, "مشروع اختبار");
  const sent = mock.requests[mock.requests.length - 1];
  assert.equal(sent.query.get("slug"), `eq.${SLUG}`);
  assert.equal(sent.query.get("published"), "eq.true");
  assert.equal(sent.query.get("is_demo"), "eq.false");
});

test("REGRESSION: the old behaviour (querying with the raw encoded param) finds nothing", async () => {
  assert.equal(await getProjectBySlug(ENCODED), null);
  const sent = mock.requests[mock.requests.length - 1];
  assert.equal(sent.query.get("slug"), `eq.${ENCODED}`, "this is exactly the double-encoded query seen in the Supabase logs");
});

test("a project that does not exist or is not public is null (404), but a data failure THROWS (never a fake 404)", async () => {
  assert.equal(await getProjectBySlug("no-such-project"), null);
  fail = true;
  await assert.rejects(() => getProjectBySlug(SLUG), (error: unknown) => error instanceof DataError);
  fail = false;
});

test("sitemap URLs are percent-encoded and decode back to the slug", async () => {
  const urls = (await sitemap()).map((entry) => entry.url);
  assert.ok(urls.includes(`https://example.test/projects/${ENCODED}`));
  assert.ok(urls.includes(`https://example.test/properties/${encodeURIComponent("شقة-أكتوبر")}`));
  assert.ok(urls.every((url) => !/[^\x20-\x7e]/.test(url)), "no raw non-ASCII characters in sitemap URLs");
});

// ---- structural guards against the "repeated headline / repeated header" regression
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const chrome = /components\/layout\/(Header|Footer|DemoBanner)/;

test("only the site layout (and the root 404) render the header/footer/banner", () => {
  const offenders = walk("src/app/(site)")
    .filter((file) => /\.(tsx|ts)$/.test(file) && !file.endsWith("layout.tsx"))
    .filter((file) => chrome.test(readFileSync(file, "utf8")));
  assert.deepEqual(offenders, [], "a page rendering its own header/footer would duplicate the layout's");
  assert.match(readFileSync("src/app/(site)/layout.tsx", "utf8"), chrome);
  assert.match(readFileSync("src/app/not-found.tsx", "utf8"), chrome, "root 404 is used where the site layout is absent");
  assert.doesNotMatch(readFileSync("src/app/(site)/not-found.tsx", "utf8"), chrome, "(site) 404 renders inside the site layout");
});

test("each public page has exactly one <h1>", () => {
  for (const file of walk("src/app/(site)").filter((f) => f.endsWith("page.tsx"))) {
    const count = (readFileSync(file, "utf8").match(/<h1[\s>]/g) ?? []).length;
    assert.equal(count, 1, `${file} has ${count} <h1>`);
  }
});

test("both detail pages decode the route param before querying (wiring guard)", () => {
  for (const file of ["src/app/(site)/projects/[slug]/page.tsx", "src/app/(site)/properties/[slug]/page.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /decodeSlug\(\(await params\)\.slug\)/, `${file} must decode params.slug`);
    assert.doesNotMatch(source, /const \{ slug \} = await params/, `${file} must not use the raw param directly`);
  }
});
