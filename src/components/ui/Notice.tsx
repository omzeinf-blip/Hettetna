import { Button } from "@/components/ui/Button";

export function Notice({
  title,
  children,
  actionHref,
  actionLabel,
  tone = "neutral",
}: {
  title?: string;
  children: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`rounded-sm border bg-white p-8 ${tone === "error" ? "border-red-300" : "border-line"}`}
    >
      {title ? <h2 className="text-lg font-medium">{title}</h2> : null}
      <p className={`${title ? "mt-2 " : ""}text-sm leading-7 text-muted`}>{children}</p>
      {actionHref && actionLabel ? (
        <div className="mt-4">
          <Button href={actionHref}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}

export function LoadFailedNotice() {
  return (
    <Notice tone="error" title="تعذر تحميل البيانات الآن" actionHref="/contact" actionLabel="تواصل معنا">
      حصلت مشكلة مؤقتة في تحميل هذه الصفحة. حاول تحديث الصفحة بعد قليل، وإن استمرت المشكلة ابعتلنا
      وهنساعدك.
    </Notice>
  );
}
