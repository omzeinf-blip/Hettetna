import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton, PublishToggle } from "@/components/admin/PublishToggle";
import { ProjectForm } from "@/components/admin/PropertyForm";
import { Notice } from "@/components/ui/Notice";
import { describeDbError } from "@/lib/admin/db-errors";
import { projectRowToForm } from "@/lib/admin/forms";
import { isUuid } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/admin/session";
import type { ProjectRow } from "@/lib/data/mappers";
import { projectPath } from "@/lib/slug";
import { rest } from "@/lib/supabase/rest";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await requireStaff();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!isUuid(id)) notFound();

  let row: ProjectRow | undefined;
  try {
    const { data } = await rest<ProjectRow[]>("projects", {
      token: session.token,
      query: { select: "*", id: `eq.${id}`, limit: "1" },
    });
    row = data?.[0];
  } catch (error) {
    return <Notice tone="error" title="تعذر تحميل المشروع">{describeDbError(error)}</Notice>;
  }
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{row.name}</h1>
        <div className="flex flex-wrap items-start gap-3">
          {row.published ? (
            <Link href={projectPath(row.slug)} target="_blank" className="rounded-sm border border-line bg-white px-5 py-2.5 text-sm">
              عرض في الموقع
            </Link>
          ) : null}
          <PublishToggle kind="projects" id={row.id} published={Boolean(row.published)} />
          {session.role === "admin" ? <DeleteButton kind="projects" id={row.id} /> : null}
        </div>
      </div>
      {saved ? <Notice>تمت إضافة المشروع بنجاح.</Notice> : null}
      <ProjectForm initial={projectRowToForm(row)} />
    </div>
  );
}
