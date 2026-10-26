import { Button } from "@/components/ui/Button";
import { brand } from "@/lib/config";

/** Content only: the surrounding header/footer come from whichever layout renders it. */
export function NotFoundContent() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-latin tracking-[0.3em] text-gold-dark">{brand.nameLatin}</p>
      <h1 className="mt-4 text-3xl font-semibold">الصفحة غير موجودة</h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        الرابط ده مش موجود أو الصفحة اتشالت. تقدر ترجع للرئيسية أو تتصفح العقارات والمشروعات.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button href="/">الرئيسية</Button>
        <Button href="/properties" variant="secondary">
          العقارات
        </Button>
        <Button href="/projects" variant="secondary">
          المشروعات
        </Button>
      </div>
    </div>
  );
}
