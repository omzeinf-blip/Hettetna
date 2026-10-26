import Link from "next/link";
import { Pagination } from "@/components/search/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Notice } from "@/components/ui/Notice";
import { describeDbError } from "@/lib/admin/db-errors";
import { ADMIN_PAGE_SIZE, formatDateTime, pageParam } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/admin/session";
import { rest } from "@/lib/supabase/rest";

type Row = { id: string; name: string; area_name: string; developer: string | null; published: boolean; is_demo: boolean; updated_at: string };

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireStaff();
  const params = await searchParams;
  const page = pageParam(params.page);

  let rows: Row[] = [];
  let total = 0;
  let problem = "";
  try {
    const result = await rest<Row[]>("projects", {
      token: session.token,
      query: {
        select: "id,name,area_name,developer,published,is_demo,updated_at",
        order: "updated_at.desc,id.desc",
        limit: String(ADMIN_PAGE_SIZE),
        offset: String((page - 1) * ADMIN_PAGE_SIZE),
      },
      prefer: ["count=exact"],
    });
    rows = result.data ?? [];
    total = result.count ?? rows.length;
  } catch (error) {
    problem = describeDbError(error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">المشروعات</h1>
        <Link href="/admin/projects/new" className="rounded-sm bg-forest px-5 py-2.5 text-sm text-ivory">
          إضافة مشروع
        </Link>
      </div>
      {params.deleted ? <Notice>تم حذف المشروع.</Notice> : null}
      {params.error ? <Notice tone="error">تعذر تنفيذ العملية.</Notice> : null}
      {problem ? (
        <Notice tone="error" title="تعذر تحميل المشروعات">{problem}</Notice>
      ) : rows.length === 0 ? (
        <Notice title="لا توجد مشروعات">لم تُضف مشروعات بعد.</Notice>
      ) : (
        <>
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id}>
                <Link href={`/admin/projects/${row.id}`} className="block rounded-sm border border-line bg-white p-4 hover:border-forest">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-medium">{row.name}</h2>
                      <p className="mt-1 text-sm text-muted">{row.area_name}{row.developer ? ` · ${row.developer}` : ""}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge tone={row.published ? "forest" : "muted"}>{row.published ? "منشور" : "مسودة"}</Badge>
                      {row.is_demo ? <Badge tone="gold">تجريبي</Badge> : null}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted">آخر تحديث: {formatDateTime(row.updated_at)}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))} params={new URLSearchParams()} basePath="/admin/projects" />
        </>
      )}
    </div>
  );
}
