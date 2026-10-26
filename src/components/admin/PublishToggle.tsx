"use client";

import { deleteRecordAction, setPublishedAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/admin/FormMessage";
import { useAdminForm } from "@/components/admin/useAdminForm";
import { Button } from "@/components/ui/Button";

export function PublishToggle({
  kind,
  id,
  published,
}: {
  kind: "properties" | "projects";
  id: string;
  published: boolean;
}) {
  const { state, pending, onSubmit } = useAdminForm(setPublishedAction);
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="publish" value={published ? "0" : "1"} />
      <Button type="submit" variant={published ? "secondary" : "gold"} disabled={pending}>
        {published ? "إلغاء النشر" : "نشر الآن"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}

export function DeleteButton({ kind, id }: { kind: "properties" | "projects"; id: string }) {
  return (
    <form
      action={deleteRecordAction}
      onSubmit={(event) => {
        if (!window.confirm("هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع.")) event.preventDefault();
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="rounded-sm border border-red-300 px-5 py-2.5 text-sm text-red-700 hover:bg-red-50">
        حذف نهائي
      </button>
    </form>
  );
}
