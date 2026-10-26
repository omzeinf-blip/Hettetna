"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { Button } from "@/components/ui/Button";
import { navItems } from "@/lib/config";
import { copy } from "@/lib/i18n";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-forest/95 text-ivory backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <BrandLockup />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="التنقل الرئيسي">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm ${active ? "text-gold font-medium" : "text-ivory/80 hover:text-ivory"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Button href="/list-property" variant="gold" className="hidden sm:inline-flex">
            {copy.listPropertyCta}
          </Button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-white/25 text-ivory lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">فتح القائمة</span>
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 bg-ivory" />
              <span className="block h-0.5 w-5 bg-ivory" />
              <span className="block h-0.5 w-5 bg-ivory" />
            </span>
          </button>
        </div>
      </div>
      {open ? (
        <div id="mobile-nav" className="border-t border-white/10 bg-forest px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3" aria-label="تنقل الجوال">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-1 text-sm text-ivory"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button href="/list-property" variant="gold" onClick={() => setOpen(false)}>
              {copy.listPropertyCta}
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
