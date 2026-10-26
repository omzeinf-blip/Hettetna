import Link from "next/link";
import { Pagination } from "@/components/search/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Notice } from "@/components/ui/Notice";
import { describeDbError } from "@/lib/admin/db-errors";
import { ADMIN_PAGE_SIZE, formatDateTime, oneOf, pageParam } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/admin/session";
import { searchTokens } from "@/lib/data/query";
import { formatEGP } from "@/lib/format";
import { availabilityLabels, transactionLabels } from "@/lib/i18n";
import { rest } from "@/lib/supabase/rest";

type Row = {
  id: string;
  property_code: string;
  title: string;
  area_name: string;
  price: number;
  transaction_type: keyof typeof transactionLabels;
  published: boolean;
  is_demo: boolean;
  availability_status: keyof typeof availabilityLabels;
  updated_at: string;
};

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireStaff();
  const params = await searchParams;
  const page = pageParam(params.page);
  const status = oneOf(params.status, ["published", "draft"] as const);
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";

  const query = new URLSearchParams({
    select: "id,property_code,title,area_name,price,transaction_type,published,is_demo,availability_status,updated_at",
    order: "updated_at.desc,id.desc",
    limit: String(ADMIN_PAGE_SIZE),
    offset: String((page - 1) * ADMIN_PAGE_SIZE),
  });
  if (status) query.set("published", status === "published" ? "eq.true" : "eq.false");
  for (const token of searchTokens(q)) query.append("search_text", `ilike.*${token}*`);

  let rows: Row[] = [];
  let total = 0;
  let problem = "";
  try {
    const result = await rest<Row[]>("properties", { token: session.token, query, prefer: ["count=exact"] });
    rows = result.data ?? [];
    total = result.count ?? rows.length;
  } catch (error) {
    problem = describeDbError(error);
  }

  const carry = new URLSearchParams();
  if (status) carry.set("status", status);
  if (q) carry.set("q", q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">العقارات</h1>
        <Link href="/admin/properties/new" className="rounded-sm bg-forest px-5 py-2.5 text-sm text-ivory">
          إضافة عقار
        </Link>
      </div>

      {params.deleted ? <Notice>تم حذف العقار.</Notice> : null}
      {params.error ? <Notice tone="error">تعذر تنفيذ العملية.</Notice> : null}

      <form className="flex flex-wrap gap-3" method="get">
        <input name="q" defaultValue={q} placeholder="ابحث بالعنوان أو الكود أو المنطقة" className="min-w-0 flex-1 rounded-sm border border-line bg-white px-3 py-2.5 text-sm" />
        <select name="status" defaultValue={status} className="rounded-sm border border-line bg-white px-3 py-2.5 text-sm">
          <option value="">كل الحالات</option>
          <option value="published">منشور</option>
          <option value="draft">مسودة</option>
        </select>
        <button type="submit" className="rounded-sm border border-line bg-white px-5 py-2.5 text-sm">بحث</button>
      </form>

      {problem ? (
        <Notice tone="error" title="تعذر تحميل العقارات">{problem}</Notice>
      ) : rows.length === 0 ? (
        <Notice title="لا توجد عقارات">لم تُضف عقارات بعد، أو لا توجد نتائج مطابقة للبحث.</Notice>
      ) : (
        <>
          <p className="text-sm text-muted">{total} عقار</p>
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id}>
                <Link href={`/admin/properties/${row.id}`} className="block rounded-sm border border-line bg-white p-4 hover:border-forest">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted">{row.property_code}</p>
                      <h2 className="font-medium">{row.title}</h2>
                      <p className="mt-1 text-sm text-muted">
                        {row.area_name} · {transactionLabels[row.transaction_type]} · {formatEGP(row.price)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={row.published ? "forest" : "muted"}>{row.published ? "منشور" : "مسودة"}</Badge>
                      <Badge>{availabilityLabels[row.availability_status]}</Badge>
                      {row.is_demo ? <Badge tone="gold">تجريبي</Badge> : null}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted">آخر تحديث: {formatDateTime(row.updated_at)}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))} params={carry} basePath="/admin/properties" />
        </>
      )}
    </div>
  );
}
