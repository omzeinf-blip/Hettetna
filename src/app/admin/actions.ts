"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE,
  clearSessionCookies,
  safeAdminPath,
  writeSessionCookies,
} from "@/lib/admin/cookies";
import { describeDbError } from "@/lib/admin/db-errors";
import { requireAdmin, requireStaff, resolveStaff } from "@/lib/admin/session";
import type { FormState } from "@/lib/admin/types";
import {
  parseProjectForm,
  parsePropertyForm,
  parseSettingsForm,
} from "@/lib/admin/validate";
import { inquiryStatuses, pick } from "@/lib/enums";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { signInWithPassword, signOut } from "@/lib/supabase/auth";
import { rest } from "@/lib/supabase/rest";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (fd: FormData, key: string) => {
  const value = fd.get(key);
  return typeof value === "string" ? value.trim() : "";
};

// ---------------------------------------------------------------- auth
const LOGIN_ERROR = "بيانات الدخول غير صحيحة أو ليس لديك صلاحية الوصول.";

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email").toLowerCase();
  const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
  if (!email || !password || email.length > 254 || password.length > 200) {
    return { message: LOGIN_ERROR };
  }

  try {
    const throttle = await consumeRateLimit("login", clientIp(await headers()), {
      limit: 10,
      windowSeconds: 600,
    });
    if (!throttle.allowed) return { message: "محاولات دخول كثيرة. حاول بعد عدة دقائق." };
  } catch {
    // Supabase Auth has its own limits; do not lock staff out if the limiter table is unavailable.
  }

  let session;
  try {
    session = await signInWithPassword(email, password);
  } catch {
    return { message: LOGIN_ERROR };
  }

  // A valid Supabase user is NOT enough: they must also be an active staff member.
  const staff = await resolveStaff(session.access_token);
  if (!staff) {
    await signOut(session.access_token).catch(() => undefined);
    return { message: LOGIN_ERROR };
  }

  writeSessionCookies(await cookies(), session);
  redirect(safeAdminPath(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (token) await signOut(token).catch(() => undefined);
  clearSessionCookies(jar);
  redirect("/admin/login");
}

// ---------------------------------------------------------------- properties / projects
type Kind = "properties" | "projects";

function refresh(kind: Kind) {
  revalidateTag(kind, "max");
  revalidatePath(kind === "properties" ? "/properties" : "/projects");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}

async function save(
  kind: Kind,
  id: string,
  values: object,
  token: string,
): Promise<{ id?: string; message?: string }> {
  try {
    if (id) {
      if (!UUID.test(id)) return { message: "معرّف السجل غير صحيح." };
      const { data } = await rest<{ id: string }[]>(kind, {
        method: "PATCH",
        token,
        query: { id: `eq.${id}`, select: "id" },
        body: values,
        prefer: ["return=representation"],
      });
      if (!data?.length) return { message: "لم يتم الحفظ: السجل غير موجود أو لا تملك صلاحية تعديله." };
      return { id };
    }
    const { data } = await rest<{ id: string }[]>(kind, {
      method: "POST",
      token,
      query: { select: "id" },
      body: values,
      prefer: ["return=representation"],
    });
    return { id: data?.[0]?.id };
  } catch (error) {
    return { message: describeDbError(error) };
  }
}

export async function savePropertyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireStaff();
  const { values, errors } = parsePropertyForm(formData);
  if (!values) return { errors, message: "راجع الحقول المحددة بالأحمر." };

  const id = text(formData, "id");
  const result = await save("properties", id, values, session.token);
  if (result.message) return { message: result.message };
  refresh("properties");
  if (!id && result.id) redirect(`/admin/properties/${result.id}?saved=1`);
  return { ok: true, message: "تم الحفظ بنجاح." };
}

export async function saveProjectAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireStaff();
  const { values, errors } = parseProjectForm(formData);
  if (!values) return { errors, message: "راجع الحقول المحددة بالأحمر." };

  const id = text(formData, "id");
  const result = await save("projects", id, values, session.token);
  if (result.message) return { message: result.message };
  refresh("projects");
  if (!id && result.id) redirect(`/admin/projects/${result.id}?saved=1`);
  return { ok: true, message: "تم الحفظ بنجاح." };
}

export async function setPublishedAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireStaff();
  const kind = text(formData, "kind") as Kind;
  const id = text(formData, "id");
  const publish = text(formData, "publish") === "1";
  if ((kind !== "properties" && kind !== "projects") || !UUID.test(id)) {
    return { message: "طلب غير صحيح." };
  }

  try {
    if (publish) {
      const { data } = await rest<{ images: unknown[]; description: string }[]>(kind, {
        token: session.token,
        query: { id: `eq.${id}`, select: "images,description" },
      });
      const row = data?.[0];
      if (!row) return { message: "السجل غير موجود." };
      if (!Array.isArray(row.images) || row.images.length === 0) {
        return { message: "أضف صورة واحدة على الأقل قبل النشر." };
      }
      if ((row.description ?? "").length < 20) return { message: "أضف وصفًا (20 حرفًا على الأقل) قبل النشر." };
    }
    const { data } = await rest<{ id: string }[]>(kind, {
      method: "PATCH",
      token: session.token,
      query: { id: `eq.${id}`, select: "id" },
      body: { published: publish },
      prefer: ["return=representation"],
    });
    if (!data?.length) return { message: "لم يتم التحديث: لا تملك صلاحية أو السجل غير موجود." };
  } catch (error) {
    return { message: describeDbError(error) };
  }
  refresh(kind);
  revalidatePath(`/admin/${kind}/${id}`);
  return { ok: true, message: publish ? "تم النشر." : "تم إلغاء النشر." };
}

export async function deleteRecordAction(formData: FormData): Promise<void> {
  const session = await requireAdmin(); // deletion is admin-only (also enforced by RLS)
  const kind = text(formData, "kind") as Kind;
  const id = text(formData, "id");
  if ((kind !== "properties" && kind !== "projects") || !UUID.test(id)) redirect(`/admin?error=1`);

  try {
    await rest(kind, {
      method: "DELETE",
      token: session.token,
      query: { id: `eq.${id}` },
      prefer: ["return=minimal"],
    });
  } catch {
    redirect(`/admin/${kind}?error=delete`);
  }
  refresh(kind);
  redirect(`/admin/${kind}?deleted=1`);
}

// ---------------------------------------------------------------- inquiries
export async function updateInquiryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireStaff();
  const id = text(formData, "id");
  const status = pick(inquiryStatuses, text(formData, "status"));
  const assignedTo = text(formData, "assignedTo");
  const notes = text(formData, "internalNotes");

  if (!UUID.test(id) || !status) return { message: "بيانات غير صحيحة." };
  if (assignedTo && !UUID.test(assignedTo)) return { message: "المسؤول المحدد غير صحيح." };
  if (notes.length > 4000) return { message: "الملاحظات طويلة جدًا (الحد 4000 حرف)." };

  try {
    const { data } = await rest<{ id: string }[]>("inquiries", {
      method: "PATCH",
      token: session.token,
      query: { id: `eq.${id}`, select: "id" },
      body: { status, assigned_to: assignedTo || null, internal_notes: notes || null },
      prefer: ["return=representation"],
    });
    if (!data?.length) return { message: "لم يتم الحفظ: الاستفسار غير موجود أو لا تملك صلاحية." };
  } catch (error) {
    return { message: describeDbError(error) };
  }
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  return { ok: true, message: "تم تحديث الاستفسار." };
}

// ---------------------------------------------------------------- settings
export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const { values, errors } = parseSettingsForm(formData);
  if (!values) return { errors, message: "راجع الحقول المحددة بالأحمر." };

  try {
    const { data } = await rest<{ id: number }[]>("contact_settings", {
      method: "PATCH",
      token: session.token,
      query: { id: "eq.1", select: "id" },
      body: values,
      prefer: ["return=representation"],
    });
    if (!data?.length) return { message: "لم يتم الحفظ: صف الإعدادات غير موجود أو لا تملك صلاحية." };
  } catch (error) {
    return { message: describeDbError(error) };
  }
  revalidateTag("contact", "max");
  revalidatePath("/", "layout");
  return { ok: true, message: "تم حفظ بيانات التواصل." };
}
