import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { safeAdminPath } from "@/lib/admin/cookies";
import { getStaffSession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = safeAdminPath(next);
  if (await getStaffSession()) redirect(safeNext);

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center text-ivory">
          <BrandLockup variant="footer" />
        </div>
        <LoginForm next={safeNext === "/admin" ? undefined : safeNext} />
        <p className="text-center text-xs text-ivory/70">
          هذه الصفحة مخصصة لفريق حِتّتنا فقط.
        </p>
      </div>
    </div>
  );
}
