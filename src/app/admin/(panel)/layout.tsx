import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { requireStaff } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();

  const items = [
    { href: "/admin", label: "الرئيسية" },
    { href: "/admin/properties", label: "العقارات" },
    { href: "/admin/projects", label: "المشروعات" },
    { href: "/admin/inquiries", label: "الاستفسارات" },
    ...(session.role === "admin" ? [{ href: "/admin/settings", label: "الإعدادات" }] : []),
  ];

  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-white/10 bg-forest text-ivory">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2">
          <BrandLockup variant="header" />
          <div className="order-3 w-full md:order-none md:w-auto md:flex-1">
            <AdminNav items={items} />
          </div>
          <div className="ms-auto flex items-center gap-3 text-sm">
            <span className="hidden text-ivory/80 sm:inline">
              {session.fullName ?? session.email} · {session.role === "admin" ? "مدير" : "موظف"}
            </span>
            <Link href="/" className="text-ivory/80 hover:text-ivory" target="_blank">
              عرض الموقع
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="rounded-sm border border-white/25 px-3 py-1.5 hover:bg-white/10">
                خروج
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
