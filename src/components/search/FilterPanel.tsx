"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { toSearchParams } from "@/lib/filters";
import {
  areaLabels,
  finishingLabels,
  propertyTypeLabels,
  transactionLabels,
} from "@/lib/i18n";
import type { PropertyFilters } from "@/lib/types";

export function FilterPanel({
  initial,
  resultCount,
}: {
  initial: PropertyFilters;
  resultCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>(initial);

  function apply(next: PropertyFilters) {
    const params = toSearchParams(next);
    router.push(params.size ? `/properties?${params}` : "/properties");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    apply(filters);
    setOpen(false);
  }

  function clear() {
    const empty: PropertyFilters = { sort: "newest" };
    setFilters(empty);
    apply(empty);
    setOpen(false);
  }

  // Mobile drawer: close with Escape and keep the page behind it from scrolling.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const form = (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="كلمة البحث" htmlFor="filter-q">
        <Input
          id="filter-q"
          value={filters.q ?? ""}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          placeholder="منطقة، كمبوند، أو كود العقار"
        />
      </Field>
      <Field label="نوع العملية" htmlFor="transaction">
        <Select
          id="transaction"
          value={filters.transactionType ?? ""}
          onChange={(e) => setFilters({ ...filters, transactionType: e.target.value as PropertyFilters["transactionType"] })}
        >
          <option value="">الكل</option>
          {Object.entries(transactionLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="نوع العقار" htmlFor="type">
        <Select
          id="type"
          value={filters.propertyType ?? ""}
          onChange={(e) => setFilters({ ...filters, propertyType: e.target.value as PropertyFilters["propertyType"] })}
        >
          <option value="">الكل</option>
          {Object.entries(propertyTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="المنطقة" htmlFor="area">
        <Select
          id="area"
          value={filters.areaId ?? ""}
          onChange={(e) => setFilters({ ...filters, areaId: e.target.value as PropertyFilters["areaId"] })}
        >
          <option value="">كل المناطق</option>
          {Object.entries(areaLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="الحد الأدنى للسعر" htmlFor="minPrice">
          <Input
            id="minPrice"
            type="number"
            min={0}
            value={filters.minPrice ?? ""}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
        </Field>
        <Field label="الحد الأقصى" htmlFor="maxPrice">
          <Input
            id="maxPrice"
            type="number"
            min={0}
            value={filters.maxPrice ?? ""}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
        </Field>
      </div>
      <Field label="عدد الغرف من" htmlFor="beds">
        <Select
          id="beds"
          value={filters.minBedrooms ?? ""}
          onChange={(e) => setFilters({ ...filters, minBedrooms: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">غير محدد</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </Select>
      </Field>
      <Field label="المساحة من (م²)" htmlFor="minArea">
        <Input
          id="minArea"
          type="number"
          min={0}
          value={filters.minArea ?? ""}
          onChange={(e) => setFilters({ ...filters, minArea: e.target.value ? Number(e.target.value) : undefined })}
        />
      </Field>
      <Field label="التشطيب" htmlFor="finishing">
        <Select
          id="finishing"
          value={filters.finishing ?? ""}
          onChange={(e) => setFilters({ ...filters, finishing: e.target.value as PropertyFilters["finishing"] })}
        >
          <option value="">الكل</option>
          {Object.entries(finishingLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="حالة التسليم" htmlFor="delivery">
        <Select
          id="delivery"
          value={filters.deliveryStatus ?? ""}
          onChange={(e) => setFilters({ ...filters, deliveryStatus: e.target.value as PropertyFilters["deliveryStatus"] })}
        >
          <option value="">الكل</option>
          <option value="ready">جاهز للسكن</option>
          <option value="under-construction">تحت الإنشاء</option>
        </Select>
      </Field>
      <Field label="الترتيب" htmlFor="sort">
        <Select
          id="sort"
          value={filters.sort ?? "newest"}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value as PropertyFilters["sort"] })}
        >
          <option value="newest">الأحدث</option>
          <option value="price-asc">السعر: من الأقل للأعلى</option>
          <option value="price-desc">السعر: من الأعلى للأقل</option>
        </Select>
      </Field>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          تطبيق الفلاتر
        </Button>
        <Button type="button" variant="secondary" onClick={clear}>
          مسح
        </Button>
      </div>
      <p className="text-xs text-muted">{resultCount} نتيجة حسب البيانات الحالية</p>
    </form>
  );

  return (
    <>
      <div className="mb-4 lg:hidden">
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          الفلاتر والترتيب
        </Button>
      </div>
      <aside className="hidden lg:block">{form}</aside>
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-forest-dark/40 lg:hidden"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="البحث والفلاتر"
            className="absolute inset-y-0 left-0 right-auto w-full max-w-md overflow-y-auto bg-ivory p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium">البحث والفلاتر</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-sm px-2 py-1 text-sm" autoFocus>
                إغلاق
              </button>
            </div>
            {form}
          </div>
        </div>
      ) : null}
    </>
  );
}
