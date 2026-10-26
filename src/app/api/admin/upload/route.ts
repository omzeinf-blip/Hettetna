import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/admin/cookies";
import { MAX_UPLOAD_BYTES, sniffImage } from "@/lib/admin/sniff";
import { resolveStaff } from "@/lib/admin/session";
import { IMAGE_BUCKET } from "@/lib/admin/validate";
import { sameOrigin } from "@/lib/http";
import { anonKey, authHeaders, supabaseUrl } from "@/lib/supabase/rest";

export const runtime = "nodejs";

function fail(status: number, message: string) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, "طلب غير مسموح به.");

  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  const session = token ? await resolveStaff(token) : null;
  if (!session || !token) return fail(401, "انتهت الجلسة. سجّل الدخول مرة أخرى.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "طلب غير صحيح.");
  }

  const file = form.get("file");
  const kind = form.get("kind");
  if (!(file instanceof File)) return fail(400, "لم يتم إرسال ملف.");
  if (kind !== "properties" && kind !== "projects") return fail(400, "نوع الرفع غير صحيح.");
  if (file.size === 0) return fail(400, "الملف فارغ.");
  if (file.size > MAX_UPLOAD_BYTES) return fail(413, "حجم الصورة يتجاوز 4 ميجابايت.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = sniffImage(bytes);
  if (!image) return fail(415, "الملف ليس صورة JPG أو PNG أو WebP صالحة.");

  const path = `${kind}/${crypto.randomUUID()}.${image.ext}`;
  try {
    const response = await fetch(`${supabaseUrl()}/storage/v1/object/${IMAGE_BUCKET}/${path}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        ...authHeaders(anonKey(), token),
        "Content-Type": image.mime,
        "x-upsert": "false",
        "cache-control": "max-age=31536000",
      },
      body: bytes,
    });
    if (!response.ok) {
      console.error(`[upload] storage rejected the upload (status ${response.status})`);
      return fail(response.status === 403 || response.status === 401 ? 403 : 502, "تعذر رفع الصورة إلى التخزين.");
    }
  } catch {
    return fail(503, "تعذر الاتصال بخدمة التخزين.");
  }

  return NextResponse.json({
    ok: true,
    src: `${supabaseUrl()}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`,
  });
}
