"use client";

import { FormEvent, startTransition, useActionState } from "react";
import type { FormState } from "@/lib/admin/types";

/**
 * Wraps a server action for a form. We submit through onSubmit (not the `action` prop) so React 19
 * does not reset the fields after a failed validation: the person keeps what they typed.
 */
export function useAdminForm(action: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  };
  return { state, pending, onSubmit };
}
