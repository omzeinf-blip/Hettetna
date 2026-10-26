import Link from "next/link";
import { Pagination } from "@/components/search/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Notice } from "@/components/ui/Notice";
import { describeDbError } from "@/lib/admin/db-errors";
import { ADMIN_PAGE_SIZE, formatDateTime, oneOf, pageParam } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/admin/session";
import { inquiryStatuses } from "@/lib/enums";
import { inquiryKindLabels, inquiryStatusLabels } from "@/lib/i18n";
import { rest } from "@/lib/supabase/rest";

type Row = {
  id: string;
  kind: keyof typeof inquiryKindLabels;
  name: string;
  phone: string;
  status: keyof typeof inquiryStatusLabels;
  property_code: string | null;
  created_at: string;
};

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireStaff();
  const params = await searchParams;
  const page = pageParam(params.page);
  const status = oneOf(params.status, inquiryStatuses);
  const kind = oneOf(params.kind, ["buyer", "owner", "contact"] as const);

  const query = new URLSearchParams({
    select: "id,kind,name,phone,status,property_code,created_at",
    order: "created_at.desc,id.desc",
    limit: String(ADMIN_PAGE_SIZE),
    offset: String((page - 1) * ADMIN_PAGE_SIZE),
  });
  if (status) query.set("status", `eq.${status}`);
  if (kind) query.set("kind", `eq.${kind}`);

  let rows: Row[] = [];
  let total = 0;
  let problem = "";
  try {
    const result = await rest<Row[]>("inquiries", { token: session.token, query, prefer: ["count=exact"] });
    rows = result.data ?? [];
    total = result.count ?? rows.length;
  } catch (error) {
    problem = describeDbError(error);
  }

  const carry = new URLSearchParams();
  if (status) carry.set("status", status);
  if (kind) carry.set("kind", kind);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">الاستفسارات</h1>
      <form className="flex flex-wrap gap-3" method="get">
        <select name="status" defaultValue={status} className="rounded-sm border border-line bg-white px-3 py-2.5 text-sm">
          <option value="">كل الحالات</option>
          {Object.entries(inquiryStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select name="kind" defaultValue={kind} className="rounded-sm border border-line bg-white px-3 py-2.5 text-sm">
          <option value="">كل الأنواع</option>
          {Object.entries(inquiryKindLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button type="submit" className="rounded-sm border border-line bg-white px-5 py-2.5 text-sm">تصفية</button>
      </form>

      {problem ? (
        <Notice tone="error" title="تعذر تحميل الاستفسارات">{problem}</Notice>
      ) : rows.length === 0 ? (
        <Notice title="لا توجد استفسارات">ستظهر هنا الطلبات التي يرسلها الزوار من نماذج الموقع.</Notice>
      ) : (
        <>
          <p className="text-sm text-muted">{total} استفسار</p>
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id}>
                <Link href={`/admin/inquiries/${row.id}`} className="block rounded-sm border border-line bg-white p-4 hover:border-forest">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-medium">{row.name}</h2>
                      <p className="mt-1 text-sm text-muted" dir="ltr">{row.phone}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={row.status === "new" ? "gold" : "muted"}>{inquiryStatusLabels[row.status]}</Badge>
                      <Badge>{inquiryKindLabels[row.kind]}</Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {formatDateTime(row.created_at)}{row.property_code ? ` · عقار ${row.property_code}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))} params={carry} basePath="/admin/inquiries" />
        </>
      )}
    </div>
  );
}
