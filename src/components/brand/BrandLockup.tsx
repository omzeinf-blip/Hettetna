import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/config";

const sizes = {
  header: "h-14 md:h-16",
  footer: "h-24 md:h-28",
} as const;

export function BrandLockup({ variant = "header" }: { variant?: keyof typeof sizes }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center text-inherit"
      aria-label={`${brand.nameArabic} | ${brand.nameLatin} - ${brand.tagline}`}
    >
      <Image
        src="/images/HETTETNA_logo_transparent.png"
        alt={`${brand.nameArabic} ${brand.nameLatin}`}
        width={856}
        height={571}
        priority={variant === "header"}
        sizes="(min-width: 768px) 160px, 120px"
        className={`${sizes[variant]} w-auto`}
      />
    </Link>
  );
}
