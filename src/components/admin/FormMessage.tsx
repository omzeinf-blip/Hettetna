import type { FormState } from "@/lib/admin/types";

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-sm border px-4 py-3 text-sm ${
        state.ok ? "border-forest/30 bg-forest/5 text-forest" : "border-red-300 bg-red-50 text-red-800"
      }`}
    >
      {state.message}
    </p>
  );
}
