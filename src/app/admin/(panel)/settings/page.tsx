import { SettingsForm } from "@/components/admin/SettingsForm";
import { Notice } from "@/components/ui/Notice";
import { describeDbError } from "@/lib/admin/db-errors";
import { requireAdmin } from "@/lib/admin/session";
import { CONTACT_COLUMNS } from "@/lib/data/columns";
import { mapContact, type ContactRow } from "@/lib/data/mappers";
import { rest } from "@/lib/supabase/rest";

export const metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const session = await requireAdmin();
  try {
    const { data } = await rest<ContactRow[]>("contact_settings", {
      token: session.token,
      query: { select: CONTACT_COLUMNS, id: "eq.1", limit: "1" },
    });
    const row = data?.[0];
    if (!row) {
      return <Notice tone="error" title="صف الإعدادات غير موجود">شغّل الـ Migration لإنشاء صف الإعدادات.</Notice>;
    }
    return (
      <div className="max-w-xl space-y-6">
        <h1 className="text-2xl font-semibold">بيانات التواصل</h1>
        <p className="text-sm leading-7 text-muted">هذه البيانات تظهر في تذييل الموقع وصفحة التواصل وزر واتساب.</p>
        <SettingsForm initial={mapContact(row)} />
      </div>
    );
  } catch (error) {
    return <Notice tone="error" title="تعذر تحميل الإعدادات">{describeDbError(error)}</Notice>;
  }
}
