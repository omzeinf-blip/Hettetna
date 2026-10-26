import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE } from "@/lib/admin/cookies";
import type { StaffSession } from "@/lib/admin/types";
import { getUser } from "@/lib/supabase/auth";
import { rest } from "@/lib/supabase/rest";

type StaffRow = { user_id: string; role: "admin" | "agent"; full_name: string | null; active: boolean };

/** Resolves the staff session for an access token. Authorization = valid token AND active staff row. */
export async function resolveStaff(token: string): Promise<StaffSession | null> {
  try {
    const user = await getUser(token);
    const { data } = await rest<StaffRow[]>("staff_profiles", {
      token,
      query: { select: "user_id,role,full_name,active", user_id: `eq.${user.id}` },
    });
    const row = data?.[0];
    if (!row || !row.active) return null;
    return {
      token,
      userId: user.id,
      email: user.email,
      role: row.role,
      fullName: row.full_name ?? undefined,
    };
  } catch {
    return null;
  }
}

export const getStaffSession = cache(async (): Promise<StaffSession | null> => {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  return resolveStaff(token);
});

export async function requireStaff(): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireAdmin(): Promise<StaffSession> {
  const session = await requireStaff();
  if (session.role !== "admin") redirect("/admin?denied=1");
  return session;
}
