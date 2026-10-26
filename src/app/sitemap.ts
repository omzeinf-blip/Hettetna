import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { listPublicSlugs } from "@/lib/data/access";
import { settle } from "@/lib/data/settle";
import { projectPath, propertyPath } from "@/lib/slug";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await settle(listPublicSlugs());

  const staticRoutes = ["", "/properties", "/projects", "/about", "/contact", "/list-property"].map(
    (path) => ({ url: `${siteUrl}${path || "/"}`, lastModified: new Date() }),
  );

  const entry = (path: (slug: string) => string) => (item: { slug: string; lastModified?: string }) => ({
    url: `${siteUrl}${path(item.slug)}`,
    lastModified: item.lastModified ? new Date(item.lastModified) : undefined,
  });

  return [
    ...staticRoutes,
    ...(data?.properties ?? []).map(entry(propertyPath)),
    ...(data?.projects ?? []).map(entry(projectPath)),
  ];
}
