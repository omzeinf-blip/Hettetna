"use client";

import { loginAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/admin/FormMessage";
import { useAdminForm } from "@/components/admin/useAdminForm";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export function LoginForm({ next }: { next?: string }) {
  const { state, pending, onSubmit } = useAdminForm(loginAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-line bg-white p-6">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormMessage state={state} />
      <Field label="البريد الإلكتروني" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required dir="ltr" />
      </Field>
      <Field label="كلمة المرور" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required dir="ltr" />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "جارٍ الدخول..." : "تسجيل الدخول"}
      </Button>
    </form>
  );
}
