import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton, PublishToggle } from "@/components/admin/PublishToggle";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { Notice } from "@/components/ui/Notice";
import { propertyRowToForm } from "@/lib/admin/forms";
import { describeDbError } from "@/lib/admin/db-errors";
import { formatDateTime, isUuid } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/admin/session";
import type { PropertyRow } from "@/lib/data/mappers";
import { propertyPath } from "@/lib/slug";
import { rest } from "@/lib/supabase/rest";

export default async function EditPropertyPage({
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

  let row: (PropertyRow & { availability_updated_at?: string | null }) | undefined;
  try {
    const { data } = await rest<(PropertyRow & { availability_updated_at?: string | null })[]>("properties", {
      token: session.token,
      query: { select: "*", id: `eq.${id}`, limit: "1" },
    });
    row = data?.[0];
  } catch (error) {
    return <Notice tone="error" title="تعذر تحميل العقار">{describeDbError(error)}</Notice>;
  }
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{row.property_code}</p>
          <h1 className="text-2xl font-semibold">{row.title}</h1>
          <p className="mt-1 text-xs text-muted">
            آخر تحديث: {formatDateTime(row.updated_at)} · آخر تغيير للتوفر: {formatDateTime(row.availability_updated_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          {row.published ? (
            <Link href={propertyPath(row.slug)} target="_blank" className="rounded-sm border border-line bg-white px-5 py-2.5 text-sm">
              عرض في الموقع
            </Link>
          ) : null}
          <PublishToggle kind="properties" id={row.id} published={Boolean(row.published)} />
          {session.role === "admin" ? <DeleteButton kind="properties" id={row.id} /> : null}
        </div>
      </div>
      {saved ? <Notice>تمت إضافة العقار بنجاح.</Notice> : null}
      {row.is_demo ? <Notice tone="error">هذا سجل تجريبي ولا يظهر للزوار.</Notice> : null}
      <PropertyForm initial={propertyRowToForm(row)} />
    </div>
  );
}
