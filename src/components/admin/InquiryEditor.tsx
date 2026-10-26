"use client";

import { updateInquiryAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/admin/FormMessage";
import { useAdminForm } from "@/components/admin/useAdminForm";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { inquiryStatusLabels } from "@/lib/i18n";

export function InquiryEditor({
  id,
  status,
  assignedTo,
  internalNotes,
  staff,
}: {
  id: string;
  status: string;
  assignedTo: string;
  internalNotes: string;
  staff: { id: string; name: string }[];
}) {
  const { state, pending, onSubmit } = useAdminForm(updateInquiryAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-line bg-white p-5">
      <input type="hidden" name="id" value={id} />
      <h2 className="text-lg font-medium">المتابعة</h2>
      <FormMessage state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="الحالة" htmlFor="status">
          <Select id="status" name="status" defaultValue={status}>
            {Object.entries(inquiryStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="المسؤول عن المتابعة" htmlFor="assignedTo">
          <Select id="assignedTo" name="assignedTo" defaultValue={assignedTo}>
            <option value="">غير معيّن</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="ملاحظات داخلية (لا تظهر للعميل)" htmlFor="internalNotes">
        <Textarea id="internalNotes" name="internalNotes" defaultValue={internalNotes} rows={5} maxLength={4000} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "جارٍ الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
