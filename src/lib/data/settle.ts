import { DataError } from "@/lib/supabase/rest";

/** Resolves a data call without throwing, so one failing section does not take the whole page down. */
export async function settle<T>(promise: Promise<T>): Promise<{ data: T | null; failed: boolean }> {
  try {
    return { data: await promise, failed: false };
  } catch (error) {
    const status = error instanceof DataError ? error.status : "unknown";
    const message = error instanceof Error ? error.message : "error";
    console.error(`[data] request failed: ${message} (status ${status})`);
    return { data: null, failed: true };
  }
}
