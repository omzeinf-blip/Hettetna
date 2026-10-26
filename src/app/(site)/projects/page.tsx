import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LoadFailedNotice } from "@/components/ui/Notice";
import { getProjects } from "@/lib/data/access";
import { settle } from "@/lib/data/settle";
import { pageMeta } from "@/lib/seo";
import { projectPath } from "@/lib/slug";
import { copy, deliveryLabels, propertyTypeLabels } from "@/lib/i18n";

export const metadata: Metadata = pageMeta({
  title: "المشروعات",
  description: "مشروعات المطورين المعروضة عبر حِتّتنا، مع تمييز واضح عن إعادة البيع.",
  path: "/projects",
});

export const revalidate = 60;

export default async function ProjectsPage() {
  const { data, failed } = await settle(getProjects());
  const projects = data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">المشروعات</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
        هذه الصفحة للبيع الأساسي من خلال المشروعات. إعادة البيع والإيجار تظهر في صفحة العقارات.
      </p>
      {failed ? (
        <div className="mt-8">
          <LoadFailedNotice />
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-8 rounded-sm border border-line bg-white p-8">
          <p>{copy.emptyProjects}</p>
          <div className="mt-4">
            <Button href="/contact">{copy.contactCta}</Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={projectPath(project.slug)}
              className="overflow-hidden rounded-sm border border-line bg-white"
            >
              <div className="relative aspect-[16/10] bg-line">
                {project.images[0] ? (
                  <Image
                    src={project.images[0].src}
                    alt={project.images[0].alt || project.name}
                    fill
                    className="object-cover"
                    sizes="33vw"
                  />
                ) : null}
              </div>
              <div className="space-y-2 p-4">
                <p className="text-xs text-gold-dark">بيع مطور</p>
                {project.isDemo ? (
                  <p className="text-xs text-muted">{copy.demoBadge}</p>
                ) : null}
                <h2 className="text-lg font-medium">{project.name}</h2>
                <p className="text-sm text-muted">{project.areaName}</p>
                {project.deliveryStatus ? (
                  <p className="text-xs text-muted">{deliveryLabels[project.deliveryStatus]}</p>
                ) : null}
                <p className="text-xs text-muted">
                  {project.unitTypes.map((type) => propertyTypeLabels[type]).join(" · ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
