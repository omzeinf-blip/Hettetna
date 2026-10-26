"use client";

import { saveSettingsAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/admin/FormMessage";
import { useAdminForm } from "@/components/admin/useAdminForm";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import type { ContactSettings } from "@/lib/types";

export function SettingsForm({ initial }: { initial: ContactSettings }) {
  const { state, pending, onSubmit } = useAdminForm(saveSettingsAction);
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-line bg-white p-5" noValidate>
      <FormMessage state={state} />
      <p className="text-xs leading-6 text-muted">
        اترك الحقل فارغًا لإخفائه من الموقع. أضف فقط بيانات مؤكدة ورسمية.
      </p>
      <Field label="رقم واتساب (أرقام فقط مع كود الدولة)" htmlFor="whatsappNumber" error={e.whatsappNumber}>
        <Input id="whatsappNumber" name="whatsappNumber" defaultValue={initial.whatsappNumber} inputMode="numeric" dir="ltr" placeholder="2010XXXXXXXX" />
      </Field>
      <Field label="الهاتف" htmlFor="phone" error={e.phone}>
        <Input id="phone" name="phone" defaultValue={initial.phone} dir="ltr" />
      </Field>
      <Field label="البريد الإلكتروني" htmlFor="email" error={e.email}>
        <Input id="email" name="email" type="email" defaultValue={initial.email} dir="ltr" />
      </Field>
      <Field label="العنوان" htmlFor="address" error={e.address}>
        <Input id="address" name="address" defaultValue={initial.address} />
      </Field>
      <Field label="رابط إنستجرام" htmlFor="instagramUrl" error={e.instagramUrl}>
        <Input id="instagramUrl" name="instagramUrl" defaultValue={initial.instagramUrl} dir="ltr" placeholder="https://" />
      </Field>
      <Field label="رابط فيسبوك" htmlFor="facebookUrl" error={e.facebookUrl}>
        <Input id="facebookUrl" name="facebookUrl" defaultValue={initial.facebookUrl} dir="ltr" placeholder="https://" />
      </Field>
      <Field label="رابط لينكدإن" htmlFor="linkedinUrl" error={e.linkedinUrl}>
        <Input id="linkedinUrl" name="linkedinUrl" defaultValue={initial.linkedinUrl} dir="ltr" placeholder="https://" />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "جارٍ الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
