"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { demoModeEnabled } from "@/lib/config";
import { areaLabels, copy, propertyTypeLabels } from "@/lib/i18n";
import type { FieldErrors } from "@/lib/validation";
import type { InquiryKind } from "@/lib/types";

type Props = {
  kind: InquiryKind;
  propertyCode?: string;
  /** What the visitor is asking about (e.g. a project name). Added to the inquiry notes. */
  subject?: string;
};

export function InquiryForm({ kind, propertyCode, subject }: Props) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [persisted, setPersisted] = useState(false);
  const [serverMessage, setServerMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React clears event.currentTarget after the handler returns, so keep a reference.
    const formElement = event.currentTarget;
    setStatus("loading");
    setErrors({});
    setServerMessage("");

    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    payload.consent = form.get("consent") ? "true" : "false";
    payload.kind = kind;
    if (propertyCode) payload.propertyCode = propertyCode;
    if (subject) payload.subject = subject;

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.errors ?? {});
        setServerMessage(typeof data.message === "string" ? data.message : "");
        setStatus("error");
        return;
      }
      setPersisted(Boolean(data.persisted));
      setStatus("success");
      formElement.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-4 rounded-sm border border-line bg-white p-5">
      {demoModeEnabled ? <p className="text-sm text-muted">{copy.formDemoNotice}</p> : null}

      <Field label="الاسم" htmlFor={`${kind}-name`} error={errors.name}>
        <Input id={`${kind}-name`} name="name" autoComplete="name" required />
      </Field>
      <Field label="رقم الموبايل" htmlFor={`${kind}-phone`} error={errors.phone}>
        <Input id={`${kind}-phone`} name="phone" inputMode="tel" autoComplete="tel" required />
      </Field>
      <Field label="البريد الإلكتروني (اختياري)" htmlFor={`${kind}-email`} error={errors.email}>
        <Input id={`${kind}-email`} name="email" type="email" autoComplete="email" dir="ltr" />
      </Field>
      <div aria-hidden="true" className="sr-only">
        <label>
          لا تملأ هذا الحقل
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {kind === "buyer" ? (
        <Field label="الشراء أم الإيجار؟" htmlFor="transactionType" error={errors.transactionType}>
          <Select id="transactionType" name="transactionType" defaultValue="sale">
            <option value="sale">شراء</option>
            <option value="rent">إيجار</option>
          </Select>
        </Field>
      ) : null}

      {kind === "owner" ? (
        <Field label="نوع العملية" htmlFor="owner-transaction" error={errors.transactionType}>
          <Select id="owner-transaction" name="transactionType" defaultValue="sale">
            <option value="sale">بيع</option>
            <option value="rent">إيجار</option>
          </Select>
        </Field>
      ) : null}

      {kind !== "contact" ? (
        <>
          <Field label="المنطقة" htmlFor={`${kind}-area`} error={errors.preferredLocation}>
            <Select id={`${kind}-area`} name="preferredLocation" defaultValue="">
              <option value="">اختر المنطقة</option>
              {Object.entries(areaLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="نوع العقار" htmlFor={`${kind}-type`} error={errors.propertyType}>
            <Select id={`${kind}-type`} name="propertyType" defaultValue="">
              <option value="">اختر النوع</option>
              {Object.entries(propertyTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </>
      ) : null}

      {kind === "buyer" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="الميزانية من" htmlFor="budgetMin">
            <Input id="budgetMin" name="budgetMin" type="number" min={0} />
          </Field>
          <Field label="إلى" htmlFor="budgetMax">
            <Input id="budgetMax" name="budgetMax" type="number" min={0} />
          </Field>
        </div>
      ) : null}

      {kind === "owner" ? (
        <>
          <Field label="السعر المطلوب (جنيه)" htmlFor="askingPrice">
            <Input id="askingPrice" name="askingPrice" type="number" min={0} />
          </Field>
          <Field label="المساحة (م²)" htmlFor="areaSqm">
            <Input id="areaSqm" name="areaSqm" type="number" min={0} />
          </Field>
          <p className="text-xs leading-6 text-muted">
            بعد وصول طلبك هيتواصل معاك فريقنا، وتقدر تبعت صور العقار وقتها.
          </p>
        </>
      ) : null}

      <Field label={kind === "contact" ? "رسالتك" : "ملاحظات إضافية"} htmlFor={`${kind}-notes`}>
        <Textarea id={`${kind}-notes`} name="notes" maxLength={1800} />
      </Field>

      <label className="flex items-start gap-2 text-sm text-ink">
        <input type="checkbox" name="consent" className="mt-1" required />
        <span>أوافق على تواصل فريق حِتّتنا معي بخصوص هذا الطلب.</span>
      </label>
      {errors.consent ? <p className="text-xs text-red-700">{errors.consent}</p> : null}

      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "جارٍ الإرسال..." : "إرسال"}
      </Button>

      {status === "success" ? (
        <p className="text-sm text-forest">
          {persisted ? copy.formSuccessPersisted : copy.formSuccessPreview}
        </p>
      ) : null}
      {status === "error" && !Object.keys(errors).length ? (
        <p role="alert" className="text-sm text-red-700">
          {serverMessage || copy.formError}
        </p>
      ) : null}
    </form>
  );
}
