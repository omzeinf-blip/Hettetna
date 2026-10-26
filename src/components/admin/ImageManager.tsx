"use client";

import { ChangeEvent, useState } from "react";
import type { PropertyImage } from "@/lib/types";

const MAX_IMAGES = 20;
const MAX_SIDE = 1800;
const MAX_BYTES = 4 * 1024 * 1024;

/** Resizes in the browser so phone photos upload quickly and stay under the 4 MB limit. */
async function shrink(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error("نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP.");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("تعذر معالجة الصورة في هذا المتصفح.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("تعذر ضغط الصورة.");
  if (blob.size > MAX_BYTES) throw new Error("حجم الصورة كبير جدًا حتى بعد الضغط.");
  return blob;
}

export function ImageManager({
  name,
  kind,
  initial,
  defaultAlt,
  error,
}: {
  name: string;
  kind: "properties" | "projects";
  initial: PropertyImage[];
  defaultAlt: string;
  error?: string;
}) {
  const [images, setImages] = useState<PropertyImage[]>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      setMessage(`الحد الأقصى ${MAX_IMAGES} صورة.`);
      return;
    }
    setBusy(true);
    setMessage("");
    for (const file of files) {
      try {
        const blob = await shrink(file);
        const body = new FormData();
        body.set("file", blob, "image.webp");
        body.set("kind", kind);
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        const result = (await response.json()) as { src?: string; message?: string };
        if (!response.ok || !result.src) throw new Error(result.message || "فشل رفع الصورة.");
        const src = result.src;
        setImages((current) => [...current, { src, alt: defaultAlt }]);
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "فشل رفع الصورة.");
      }
    }
    setBusy(false);
  }

  const move = (index: number, delta: number) =>
    setImages((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(images)} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center rounded-sm border border-line bg-white px-4 py-2 text-sm hover:border-forest">
          {busy ? "جارٍ الرفع..." : "إضافة صور"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={onFiles}
            className="sr-only"
          />
        </label>
        <span className="text-xs text-muted">الصورة الأولى هي صورة الغلاف. JPG أو PNG أو WebP.</span>
      </div>
      {message ? <p role="alert" className="text-sm text-red-700">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

      {images.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {images.map((image, index) => (
            <li key={image.src} className="space-y-2 rounded-sm border border-line bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt={image.alt} className="aspect-[4/3] w-full rounded-sm object-cover" />
              <input
                value={image.alt}
                maxLength={200}
                aria-label="وصف الصورة"
                placeholder="وصف مختصر للصورة"
                onChange={(event) =>
                  setImages((current) =>
                    current.map((item, i) => (i === index ? { ...item, alt: event.target.value } : item)),
                  )
                }
                className="w-full rounded-sm border border-line px-2 py-1.5 text-xs"
              />
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-sm border border-line px-2 py-1 disabled:opacity-40">
                  تقديم
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} className="rounded-sm border border-line px-2 py-1 disabled:opacity-40">
                  تأخير
                </button>
                <button type="button" onClick={() => setImages((c) => c.filter((_, i) => i !== index))} className="ms-auto rounded-sm border border-red-300 px-2 py-1 text-red-700">
                  إزالة
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
