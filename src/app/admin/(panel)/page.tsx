import Link from "next/link";
import { Notice } from "@/components/ui/Notice";
import { describeDbError } from "@/lib/admin/db-errors";
import { adminCount } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/admin/session";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const session = await requireStaff();
  const { denied } = await searchParams;

  let counts: { properties: number; published: number; projects: number; newInquiries: number } | null = null;
  let problem = "";
  try {
    const [properties, published, projects, newInquiries] = await Promise.all([
      adminCount(session.token, "properties"),
      adminCount(session.token, "properties", { published: "eq.true" }),
      adminCount(session.token, "projects"),
      adminCount(session.token, "inquiries", { status: "eq.new" }),
    ]);
    counts = { properties, published, projects, newInquiries };
  } catch (error) {
    problem = describeDbError(error);
  }

  const cards = counts
    ? [
        { label: "استفسارات جديدة", value: counts.newInquiries, href: "/admin/inquiries?status=new" },
        { label: "عقارات منشورة", value: counts.published, href: "/admin/properties?status=published" },
        { label: "مسودات عقارات", value: counts.properties - counts.published, href: "/admin/properties?status=draft" },
        { label: "المشروعات", value: counts.projects, href: "/admin/projects" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">لوحة الإدارة</h1>
      {denied ? (
        <Notice tone="error">هذه الصفحة متاحة للمدير فقط.</Notice>
      ) : null}
      {problem ? <Notice tone="error" title="تعذر تحميل الإحصائيات">{problem}</Notice> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-sm border border-line bg-white p-5 hover:border-forest">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="font-latin mt-2 text-3xl font-semibold text-forest">{card.value}</p>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/properties/new" className="rounded-sm bg-forest px-5 py-2.5 text-ivory">
          إضافة عقار
        </Link>
        <Link href="/admin/projects/new" className="rounded-sm border border-line bg-white px-5 py-2.5">
          إضافة مشروع
        </Link>
      </div>
    </div>
  );
}
