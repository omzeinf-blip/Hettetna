"use client";

import Image from "next/image";
import { KeyboardEvent, useState } from "react";
import type { PropertyImage } from "@/lib/types";

const arrow =
  "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-forest-dark/70 text-xl text-ivory hover:bg-forest-dark";

export function PropertyGallery({ images, title }: { images: PropertyImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const count = images.length;
  const current = images[active] ?? images[0];

  if (!current) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-sm bg-line text-sm text-muted">
        الصور غير متاحة حاليًا
      </div>
    );
  }

  const go = (delta: number) => setActive((index) => (index + delta + count) % count);
  // In a right-to-left page the visual left arrow moves forward.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") go(1);
    if (event.key === "ArrowRight") go(-1);
  };
  const number = new Intl.NumberFormat("ar-EG");

  return (
    <div
      className="space-y-3"
      role="group"
      aria-roledescription="معرض صور"
      aria-label={`صور ${title}`}
      onKeyDown={onKeyDown}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-line">
        <Image
          src={current.src}
          alt={current.alt || title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 70vw"
          className="object-cover"
        />
        {count > 1 ? (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="الصورة السابقة" className={`${arrow} right-3`}>
              ›
            </button>
            <button type="button" onClick={() => go(1)} aria-label="الصورة التالية" className={`${arrow} left-3`}>
              ‹
            </button>
            <span
              aria-live="polite"
              className="absolute bottom-3 left-3 rounded-sm bg-forest-dark/75 px-2 py-1 text-xs text-ivory"
            >
              {number.format(active + 1)} / {number.format(count)}
            </span>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setActive(index)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-sm border ${
                index === active ? "border-forest ring-1 ring-forest" : "border-line"
              }`}
              aria-label={`عرض الصورة ${number.format(index + 1)}`}
              aria-current={index === active ? "true" : undefined}
            >
              <Image src={image.src} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
