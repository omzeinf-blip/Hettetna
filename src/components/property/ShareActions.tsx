"use client";

import { useState } from "react";

const linkClass =
  "inline-flex items-center rounded-sm border border-line bg-white px-3 py-1.5 text-xs text-forest hover:border-forest";

/** Share by WhatsApp (works without JavaScript) or copy the link. `url` must be absolute. */
export function ShareActions({ title, url }: { title: string; url: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2500);
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="مشاركة العقار">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`}
        target="_blank"
        rel="noreferrer"
        className={linkClass}
      >
        مشاركة عبر واتساب
      </a>
      <button type="button" onClick={copy} className={linkClass}>
        نسخ الرابط
      </button>
      <span role="status" aria-live="polite" className="text-xs text-muted">
        {state === "copied" ? "تم نسخ الرابط" : state === "failed" ? "تعذّر النسخ، انسخ الرابط من شريط العنوان" : ""}
      </span>
    </div>
  );
}
