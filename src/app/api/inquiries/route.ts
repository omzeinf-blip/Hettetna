import { NextResponse } from "next/server";
import { demoModeEnabled } from "@/lib/config";
import { sameOrigin } from "@/lib/http";
import { submitInquiry } from "@/lib/data/access";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { DataError } from "@/lib/supabase/rest";
import type { InquiryKind } from "@/lib/types";
import { validateInquiry } from "@/lib/validation";

export const runtime = "nodejs";

const MAX_BODY_CHARS = 20_000;
const kinds: InquiryKind[] = ["buyer", "owner", "contact"];

function fail(status: number, message: string, errors?: Record<string, string>) {
  return NextResponse.json({ ok: false, message, errors }, { status });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, "طلب غير مسموح به.");

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return fail(413, "حجم الطلب كبير جدًا.");

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("shape");
    body = parsed as Record<string, unknown>;
  } catch {
    return fail(400, "صيغة الطلب غير صحيحة.");
  }

  const kind = kinds.find((value) => value === body.kind);
  if (!kind) return fail(400, "نوع الطلب غير صحيح.");

  // Honeypot: real visitors never fill this hidden field. Pretend success, store nothing.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true, persisted: true });
  }

  const { data, errors } = validateInquiry(kind, body);
  if (!data) return fail(422, "راجع البيانات المدخلة.", errors);

  if (demoModeEnabled) return NextResponse.json({ ok: true, persisted: false });

  try {
    const limit = await consumeRateLimit("inquiry", clientIp(request.headers), {
      limit: 5,
      windowSeconds: 600,
    });
    if (!limit.allowed) {
      return fail(429, "أرسلت عدة طلبات في وقت قصير. حاول مرة تانية بعد دقائق.");
    }
    const result = await submitInquiry(data);
    return NextResponse.json({ ok: true, persisted: result.persisted });
  } catch (error) {
    const status = error instanceof DataError ? error.status : "unknown";
    console.error(`[inquiries] could not store inquiry (status ${status})`);
    return fail(503, "تعذر حفظ طلبك الآن. لم يضع شيء من بياناتك — حاول مرة أخرى بعد قليل أو تواصل معنا مباشرة.");
  }
}
