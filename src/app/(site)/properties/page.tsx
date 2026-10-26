import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FilterPanel } from "@/components/search/FilterPanel";
import { Pagination } from "@/components/search/Pagination";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { Button } from "@/components/ui/Button";
import { LoadFailedNotice } from "@/components/ui/Notice";
import { searchProperties } from "@/lib/data/access";
import { settle } from "@/lib/data/settle";
import { filtersFromSearchParams, parsePage, toSearchParams } from "@/lib/filters";
import { pageMeta } from "@/lib/seo";
import { copy } from "@/lib/i18n";

export const metadata: Metadata = pageMeta({
  title: "العقارات",
  description: "ابحث في عقارات حِتّتنا حسب المنطقة ونوع العقار والميزانية.",
  path: "/properties",
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = filtersFromSearchParams(params);
  const page = parsePage(params);
  const { data: result, failed } = await settle(searchProperties(filters, page));
  const query = toSearchParams(filters);

  if (result && result.items.length === 0 && result.total > 0 && page > 1) {
    query.set("page", String(result.totalPages));
    redirect(`/properties?${query}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">العقارات</h1>
      <p className="mt-2 text-sm text-muted">
        النتائج تعتمد على المخزون الحالي. الروابط مع الفلاتر قابلة للمشاركة.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <FilterPanel initial={filters} resultCount={result?.total ?? 0} />
        <div>
          {failed || !result ? (
            <LoadFailedNotice />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">{result.total} عقار مطابق</p>
              {result.items.length ? (
                <>
                  <PropertyGrid properties={result.items} />
                  <Pagination page={result.page} totalPages={result.totalPages} params={query} />
                </>
              ) : (
                <div className="rounded-sm border border-line bg-white p-8">
                  <p className="text-base">{copy.emptyProperties}</p>
                  <div className="mt-4">
                    <Button href="/contact">{copy.contactCta}</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
