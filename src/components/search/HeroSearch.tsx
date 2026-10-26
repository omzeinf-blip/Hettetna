"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { areaLabels, budgetRanges, copy, propertyTypeLabels } from "@/lib/i18n";

export function HeroSearch() {
  const router = useRouter();
  const [transaction, setTransaction] = useState("sale");
  const [type, setType] = useState("");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (transaction) params.set("transaction", transaction);
    if (type) params.set("type", type);
    if (area) params.set("area", area);
    if (budget) {
      const [min, max] = budget.split("-");
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
    }
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-sm border border-line bg-white p-4 shadow-sm md:grid-cols-5"
    >
      <Select value={transaction} onChange={(e) => setTransaction(e.target.value)} aria-label="نوع العملية">
        <option value="sale">بيع</option>
        <option value="rent">إيجار</option>
      </Select>
      <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="نوع العقار">
        <option value="">نوع العقار</option>
        {Object.entries(propertyTypeLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Select value={area} onChange={(e) => setArea(e.target.value)} aria-label="المنطقة">
        <option value="">المنطقة</option>
        {Object.entries(areaLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Select value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="الميزانية">
        {budgetRanges.map((range) => (
          <option key={range.value || "all"} value={range.value}>
            {range.label}
          </option>
        ))}
      </Select>
      <Button type="submit">{copy.searchCta}</Button>
    </form>
  );
}
