import { ProjectForm } from "@/components/admin/PropertyForm";
import { emptyProject } from "@/lib/admin/forms";
import { requireStaff } from "@/lib/admin/session";

export const metadata = { title: "إضافة مشروع" };

export default async function NewProjectPage() {
  await requireStaff();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">إضافة مشروع</h1>
      <ProjectForm initial={emptyProject} />
    </div>
  );
}
