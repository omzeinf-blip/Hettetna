import Link from "next/link";

function pagesToShow(page: number, total: number): (number | "gap")[] {
  const set = new Set<number>([1, total, page - 1, page, page + 1]);
  const sorted = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((n, index) => {
    if (index > 0 && n - sorted[index - 1] > 1) result.push("gap");
    result.push(n);
  });
  return result;
}

export function Pagination({
  page,
  totalPages,
  params,
  basePath = "/properties",
}: {
  page: number;
  totalPages: number;
  params: URLSearchParams;
  basePath?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const next = new URLSearchParams(params);
    if (target > 1) next.set("page", String(target));
    else next.delete("page");
    const query = next.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const base = "inline-flex min-w-10 items-center justify-center rounded-sm border px-3 py-2 text-sm";

  return (
    <nav aria-label="صفحات النتائج" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={`${base} border-line bg-white`}>
          السابق
        </Link>
      ) : null}
      {pagesToShow(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-muted" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            aria-current={item === page ? "page" : undefined}
            className={`${base} ${item === page ? "border-forest bg-forest text-ivory" : "border-line bg-white"}`}
          >
            {item}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className={`${base} border-line bg-white`}>
          التالي
        </Link>
      ) : null}
    </nav>
  );
}
