import Link from "next/link";
import { notFound } from "next/navigation";
import { InquiryEditor } from "@/components/admin/InquiryEditor";
import { Notice } from "@/components/ui/Notice";
import { describeDbError } from "@/lib/admin/db-errors";
import { formatDateTime, isUuid } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/admin/session";
import { formatEGP, formatSqm } from "@/lib/format";
import { areaLabels, inquiryKindLabels, propertyTypeLabels, transactionLabels } from "@/lib/i18n";
import { rest } from "@/lib/supabase/rest";

type Inquiry = {
  id: string;
  kind: keyof typeof inquiryKindLabels;
  name: string;
  phone: string;
  email: string | null;
  transaction_type: string | null;
  preferred_location: string | null;
  property_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  asking_price: number | null;
  area_sqm: number | null;
  notes: string | null;
  property_code: string | null;
  status: string;
  assigned_to: string | null;
  internal_notes: string | null;
  created_at: string;
};

type Staff = { user_id: string; full_name: string | null; role: string };

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  let inquiry: Inquiry | undefined;
  let staff: Staff[] = [];
  try {
    const [row, members] = await Promise.all([
      rest<Inquiry[]>("inquiries", { token: session.token, query: { select: "*", id: `eq.${id}`, limit: "1" } }),
      rest<Staff[]>("staff_profiles", {
        token: session.token,
        query: { select: "user_id,full_name,role", active: "eq.true" },
      }),
    ]);
    inquiry = row.data?.[0];
    staff = members.data ?? [];
  } catch (error) {
    return <Notice tone="error" title="تعذر تحميل الاستفسار">{describeDbError(error)}</Notice>;
  }
  if (!inquiry) notFound();

  const digits = inquiry.phone.replace(/\D/g, "");
  const whatsapp = digits.startsWith("0") ? `20${digits.slice(1)}` : digits;
  const label = (map: Record<string, string>, value: string | null) => (value ? (map[value] ?? value) : null);

  const details: [string, string | null][] = [
    ["نوع الطلب", inquiryKindLabels[inquiry.kind]],
    ["العملية", label(transactionLabels as Record<string, string>, inquiry.transaction_type)],
    ["المنطقة", label(areaLabels, inquiry.preferred_location)],
    ["نوع العقار", label(propertyTypeLabels, inquiry.property_type)],
    ["الميزانية", inquiry.budget_min != null || inquiry.budget_max != null ? `${inquiry.budget_min != null ? formatEGP(inquiry.budget_min) : "—"} إلى ${inquiry.budget_max != null ? formatEGP(inquiry.budget_max) : "—"}` : null],
    ["السعر المطلوب", inquiry.asking_price != null ? formatEGP(inquiry.asking_price) : null],
    ["المساحة", inquiry.area_sqm != null ? formatSqm(inquiry.area_sqm) : null],
    ["كود العقار", inquiry.property_code],
    ["البريد", inquiry.email],
    ["وقت الإرسال", formatDateTime(inquiry.created_at)],
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/inquiries" className="text-sm text-muted hover:text-forest">← كل الاستفسارات</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{inquiry.name}</h1>
        <div className="flex gap-3 text-sm">
          <a href={`tel:${inquiry.phone}`} className="rounded-sm border border-line bg-white px-5 py-2.5" dir="ltr">اتصال: {inquiry.phone}</a>
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="rounded-sm bg-gold px-5 py-2.5 text-forest-dark">واتساب</a>
        </div>
      </div>

      <dl className="grid gap-4 rounded-sm border border-line bg-white p-5 sm:grid-cols-2">
        {details.filter(([, value]) => value).map(([name, value]) => (
          <div key={name}>
            <dt className="text-xs text-muted">{name}</dt>
            <dd className="mt-1 text-sm">{value}</dd>
          </div>
        ))}
        {inquiry.notes ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted">ملاحظات العميل</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm leading-7">{inquiry.notes}</dd>
          </div>
        ) : null}
      </dl>

      <InquiryEditor
        id={inquiry.id}
        status={inquiry.status}
        assignedTo={inquiry.assigned_to ?? ""}
        internalNotes={inquiry.internal_notes ?? ""}
        staff={staff.map((member) => ({
          id: member.user_id,
          name: `${member.full_name ?? "موظف"} (${member.role === "admin" ? "مدير" : "موظف"})`,
        }))}
      />
    </div>
  );
}
