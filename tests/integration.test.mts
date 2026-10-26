import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { fakeJwt, startMock, type Recorded, type Reply } from "./mock-supabase.mts";

const ANON = "anon-key-test";
const SERVICE = "service-key-test";
let state = { rateHits: 0, insertStatus: 201, listStatus: 200, rows: [] as unknown[], total: 0 };

const staffTokens: Record<string, { id: string; role: string; active: boolean } | null> = {
  "token-admin": { id: "11111111-1111-4111-8111-111111111111", role: "admin", active: true },
  "token-inactive": { id: "22222222-2222-4222-8222-222222222222", role: "agent", active: false },
  "token-nostaff": null,
};

function handler(r: Recorded): Reply | undefined {
  const bearer = String(r.headers.authorization ?? "").replace("Bearer ", "");
  if (r.path === "/auth/v1/user") {
    if (bearer === "token-nostaff") return { body: { id: "33333333-3333-4333-8333-333333333333", email: "x@y.z" } };
    const staff = staffTokens[bearer];
    return staff ? { body: { id: staff.id, email: "staff@example.com" } } : { status: 401, body: { msg: "bad jwt" } };
  }
  if (r.path === "/auth/v1/token") {
    const grant = r.query.get("grant_type");
    const body = JSON.parse(r.body || "{}");
    if (grant === "refresh_token" && body.refresh_token === "good-refresh") {
      return { body: { access_token: fakeJwt(3600), refresh_token: "rotated-refresh", expires_in: 3600, user: { id: "u" } } };
    }
    return { status: 400, body: { error: "invalid_grant" } };
  }
  if (r.path === "/rest/v1/staff_profiles") {
    const staff = staffTokens[bearer];
    return { body: staff ? [{ user_id: staff.id, role: staff.role, full_name: "Admin", active: staff.active }] : [] };
  }
  if (r.path === "/rest/v1/rate_limit_hits") {
    if (r.method === "GET") return { headers: { "content-range": `*/${state.rateHits}` }, body: [] };
    return { status: r.method === "POST" ? 201 : 204 };
  }
  if (r.path === "/rest/v1/inquiries" && r.method === "POST") return { status: state.insertStatus, body: state.insertStatus >= 400 ? { code: "XX000" } : undefined };
  if (r.path === "/rest/v1/properties") {
    if (state.listStatus >= 400) return { status: state.listStatus, body: { message: "boom" } };
    return { headers: { "content-range": state.total ? `0-${state.rows.length - 1}/${state.total}` : "*/0" }, body: state.rows };
  }
  return undefined;
}

const mock = await startMock(handler);
process.env.SUPABASE_URL = mock.url;
process.env.SUPABASE_ANON_KEY = ANON;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE;
process.env.NEXT_PUBLIC_DEMO_MODE = "false";
after(() => mock.close());
before(() => { mock.requests.length = 0; });

const { rest, DataError, authHeaders } = await import("@/lib/supabase/rest");
const access = await import("@/lib/data/access");
const { settle } = await import("@/lib/data/settle");
const { POST } = await import("@/app/api/inquiries/route");
const { resolveStaff } = await import("@/lib/admin/session");
const { middleware } = await import("@/middleware");
const { NextRequest } = await import("next/server");

const propertyRow = {
  id: "p1", slug: "villa-1", property_code: "HT-1", title: "فيلا", transaction_type: "sale", property_type: "villa",
  city: "الجيزة", area_id: "sheikh-zayed", area_name: "الشيخ زايد", compound: null, neighborhood: null, price: 9000000,
  currency: "EGP", area_sqm: 300, bedrooms: 4, bathrooms: 3, finishing: "finished", furnishing: null, floor: null,
  delivery_status: "ready", description: "وصف", features: ["حديقة"], images: [], listing_source: "owner",
  availability_status: "pending-verification", last_availability_check: null, legal_review_status: "not-reviewed",
  payment_plan_note: null, is_demo: false, published_at: "2026-10-01T00:00:00Z",
};

const last = () => mock.requests[mock.requests.length - 1];

test("REST client: key and token selection (service key is never used for public reads)", async () => {
  await rest("properties", { query: { select: "id" } });
  assert.equal(last().headers.apikey, ANON);
  assert.equal(last().headers.authorization, undefined, "publishable-style key is not sent as a Bearer token");

  await rest("properties", { token: "token-admin", query: { select: "id" } });
  assert.equal(last().headers.apikey, ANON);
  assert.equal(last().headers.authorization, "Bearer token-admin");

  await rest("rate_limit_hits", { service: true, query: { select: "id" } });
  assert.equal(last().headers.apikey, SERVICE);

  assert.equal(authHeaders("eyJabc").Authorization, "Bearer eyJabc", "legacy JWT keys keep the Bearer header");
  assert.equal(authHeaders("sb_publishable_x").Authorization, undefined);
});

test("REST client: errors surface as DataError without hanging", async () => {
  state.listStatus = 500;
  await assert.rejects(() => rest("properties", {}), (e: unknown) => e instanceof DataError && e.status === 500);
  state.listStatus = 200;
  const saved = process.env.SUPABASE_URL;
  process.env.SUPABASE_URL = "http://127.0.0.1:1";
  await assert.rejects(() => rest("properties", {}), (e: unknown) => e instanceof DataError && e.status === 503);
  process.env.SUPABASE_URL = saved;
});

test("data layer: maps rows, paginates, handles an EMPTY database", async () => {
  state = { ...state, rows: [propertyRow], total: 25, listStatus: 200 };
  const page = await access.searchProperties({ areaId: "sheikh-zayed" }, 2, 12);
  assert.equal(page.items[0].title, "فيلا");
  assert.equal(page.total, 25);
  assert.equal(page.totalPages, 3);
  assert.equal(last().query.get("offset"), "12");
  assert.equal(last().query.get("published"), "eq.true");

  state = { ...state, rows: [], total: 0 };
  const empty = await access.searchProperties({}, 1);
  assert.deepEqual([empty.items.length, empty.total, empty.totalPages], [0, 0, 1]);
  assert.equal(await access.getPropertyBySlug("nope"), null);
});

test("data layer: a database failure is reported, never replaced by demo data", async () => {
  state.listStatus = 503;
  const result = await settle(access.searchProperties({}, 1));
  assert.equal(result.failed, true);
  assert.equal(result.data, null);
  state.listStatus = 200;
});

function inquiryRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/inquiries", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost:3000", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
const inquiry = { kind: "buyer", name: "أحمد محمد علي", phone: "01012345678", transactionType: "sale", consent: "true", email: "a@b.co", propertyCode: "HT-1" };
const inquiryInserts = () => mock.requests.filter((r) => r.path === "/rest/v1/inquiries");

test("inquiry endpoint: stores a valid inquiry using the service key, server-side only", async () => {
  state.rateHits = 0; state.insertStatus = 201;
  const before = inquiryInserts().length;
  const res = await POST(inquiryRequest(inquiry));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, persisted: true });
  const insert = inquiryInserts()[before];
  assert.equal(insert.headers.apikey, SERVICE);
  const row = JSON.parse(insert.body);
  assert.equal(row.property_code, "HT-1");
  assert.equal(row.consent, true);
  assert.equal(row.email, "a@b.co");
  assert.ok(!("status" in row) && !("assigned_to" in row), "visitors cannot set workflow fields");
});

test("inquiry endpoint: validation, honeypot, size, origin, rate limit, and failures never lose data silently", async () => {
  const count = () => inquiryInserts().length;
  const n = count();

  let res = await POST(inquiryRequest({ ...inquiry, phone: "1" }));
  assert.equal(res.status, 422);
  assert.ok((await res.json()).errors.phone);

  res = await POST(inquiryRequest({ ...inquiry, website: "http://spam.example" }));
  assert.equal(res.status, 200, "honeypot looks like success to bots");
  res = await POST(inquiryRequest("x".repeat(30000)));
  assert.equal(res.status, 413);
  res = await POST(inquiryRequest("{broken"));
  assert.equal(res.status, 400);
  res = await POST(inquiryRequest({ ...inquiry, kind: "admin" }));
  assert.equal(res.status, 400);
  res = await POST(inquiryRequest(inquiry, { origin: "https://evil.example" }));
  assert.equal(res.status, 403);
  assert.equal(count(), n, "none of the above reached the database");

  state.rateHits = 5;
  res = await POST(inquiryRequest(inquiry));
  assert.equal(res.status, 429);
  assert.equal(count(), n);

  state.rateHits = 0; state.insertStatus = 500;
  res = await POST(inquiryRequest(inquiry));
  assert.equal(res.status, 503);
  assert.match((await res.json()).message, /تعذر حفظ طلبك/);
  state.insertStatus = 201;
});

test("session: only an ACTIVE staff row authorizes, and the user's own token is used (RLS applies)", async () => {
  const admin = await resolveStaff("token-admin");
  assert.equal(admin?.role, "admin");
  const staffCall = mock.requests.filter((r) => r.path === "/rest/v1/staff_profiles").pop()!;
  assert.equal(staffCall.headers.authorization, "Bearer token-admin");

  assert.equal(await resolveStaff("token-nostaff"), null, "valid Supabase user without a staff row is rejected");
  assert.equal(await resolveStaff("token-inactive"), null, "deactivated staff are rejected");
  assert.equal(await resolveStaff("garbage"), null);
});

const asRequest = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, { headers: cookie ? { cookie } : {} });

test("middleware: gates /admin, allows login, refreshes expiring tokens, drops dead sessions", async () => {
  let res = await middleware(asRequest("/admin/properties"));
  assert.equal(res.status, 307);
  assert.match(res.headers.get("location")!, /\/admin\/login\?next=%2Fadmin%2Fproperties/);

  res = await middleware(asRequest("/admin/login"));
  assert.equal(res.status, 200);

  res = await middleware(asRequest("/admin", `ht_at=${fakeJwt(3600)}; ht_rt=good-refresh`));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");

  res = await middleware(asRequest("/admin", `ht_at=${fakeJwt(5)}; ht_rt=good-refresh`));
  assert.equal(res.status, 200);
  const cookies = res.headers.getSetCookie().join("\n");
  assert.match(cookies, /ht_rt=rotated-refresh/);
  assert.match(cookies, /HttpOnly/i);
  assert.match(cookies, /SameSite=lax/i);

  res = await middleware(asRequest("/admin/inquiries", `ht_at=${fakeJwt(-10)}; ht_rt=revoked`));
  assert.equal(res.status, 307);
  assert.match(res.headers.getSetCookie().join("\n"), /ht_at=;|ht_at=; /);
});
