import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "حِتّتنا | HETTETNA",
    short_name: "حِتّتنا",
    description: "وساطة عقارية متخصصة في 6 أكتوبر والشيخ زايد.",
    start_url: "/",
    display: "standalone",
    lang: "ar",
    dir: "rtl",
    background_color: "#f7f4ec",
    theme_color: "#153d32",
    icons: [
      { src: "/images/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/images/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
