import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";
import { brand, siteUrl } from "@/lib/config";
import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-arabic",
  display: "swap",
});

const latin = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${brand.nameArabic} | ${brand.nameLatin}`,
    template: `%s | ${brand.nameArabic}`,
  },
  description:
    "حِتّتنا وساطة عقارية تساعدك تلاقي البيت أو الفرصة المناسبة في 6 أكتوبر والشيخ زايد والمناطق المجاورة.",
  openGraph: {
    locale: "ar_EG",
    siteName: brand.nameLatin,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#153d32",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} ${latin.variable}`}>
      <body className="min-h-screen bg-ivory text-ink antialiased">{children}</body>
    </html>
  );
}
