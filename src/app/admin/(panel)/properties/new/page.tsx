import { PropertyForm } from "@/components/admin/PropertyForm";
import { emptyProperty } from "@/lib/admin/forms";
import { requireStaff } from "@/lib/admin/session";

export const metadata = { title: "إضافة عقار" };

export default async function NewPropertyPage() {
  await requireStaff();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">إضافة عقار</h1>
      <PropertyForm initial={emptyProperty} />
    </div>
  );
}
