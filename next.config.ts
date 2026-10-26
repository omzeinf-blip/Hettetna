import type { NextConfig } from "next";

/** Allow next/image to load listing photos from this project's public Supabase Storage bucket. */
function supabaseImagePatterns() {
  try {
    const { hostname } = new URL(process.env.SUPABASE_URL ?? "");
    return [
      { protocol: "https" as const, hostname, pathname: "/storage/v1/object/public/**" },
    ];
  } catch {
    return [];
  }
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Stock photography used by the site design (hero and area tiles).
      { protocol: "https", hostname: "images.unsplash.com" },
      ...supabaseImagePatterns(),
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
