import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { MobileActionBar } from "@/components/property/MobileActionBar";
import { ShareActions } from "@/components/property/ShareActions";
import { JsonLd } from "@/components/seo/JsonLd";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { Badge } from "@/components/ui/Badge";
import { hasWhatsApp } from "@/lib/config";
import { getContactSettings, getProjectBySlug, getPropertiesForProject } from "@/lib/data/access";
import { settle } from "@/lib/data/settle";
import { buildWhatsAppLink } from "@/lib/format";
import { absoluteUrl, pageMeta, projectLd } from "@/lib/seo";
import { decodeSlug, projectPath } from "@/lib/slug";
import { copy, deliveryLabels, propertyTypeLabels } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

/** Resolves the route param to a project. Only a real "no such project" returns null; data errors throw. */
async function loadProject(params: Props["params"]) {
  const slug = decodeSlug((await params).slug);
  return slug ? getProjectBySlug(slug) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const project = await loadProject(params);
    if (!project) return { title: "مشروع غير موجود" };
    return pageMeta({
      title: project.name,
      description: project.description.slice(0, 150),
      path: projectPath(project.slug),
      image: project.images[0],
    });
  } catch {
    return { title: "المشروعات" };
  }
}

export default async function ProjectDetailsPage({ params }: Props) {
  const project = await loadProject(params);
  if (!project) notFound();

  const related = (await settle(getPropertiesForProject(project))).data ?? [];
  const contact = await getContactSettings();
  const whatsappHref = hasWhatsApp(contact)
    ? buildWhatsAppLink(contact.whatsappNumber, `مرحبًا، أريد الاستفسار عن مشروع ${project.name}.`)
    : undefined;
  const path = projectPath(project.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-28 lg:pb-10">
      <JsonLd data={projectLd(project, path)} />
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "المشروعات", href: "/projects" },
          { label: project.name },
        ]}
      />
      <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-line">
            {project.images[0] ? (
              <Image
                src={project.images[0].src}
                alt={project.images[0].alt || project.name}
                fill
                className="object-cover"
                sizes="70vw"
                priority
              />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="forest">بيع مطور</Badge>
            {project.isDemo ? <Badge tone="gold">{copy.demoBadge}</Badge> : null}
          </div>
          <div>
            <h1 className="text-3xl font-semibold">{project.name}</h1>
            <p className="mt-2 text-muted">
              {project.areaName} · {project.city}
            </p>
            {project.developer ? <p className="mt-1 text-sm">المطور: {project.developer}</p> : null}
          </div>
          <ShareActions title={project.name} url={absoluteUrl(path)} />
          {project.deliveryStatus ? (
            <p className="text-sm">{deliveryLabels[project.deliveryStatus]}</p>
          ) : null}
          <p className="leading-8 text-muted">{project.description}</p>
          {project.paymentPlanNote ? (
            <p className="rounded-sm bg-white p-4 text-sm text-muted">{project.paymentPlanNote}</p>
          ) : null}
          <p className="text-sm text-muted">
            أنواع الوحدات: {project.unitTypes.map((type) => propertyTypeLabels[type]).join("، ")}
          </p>
        </div>
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div id="inquiry" className="scroll-mt-28">
            <InquiryForm kind="buyer" subject={`مشروع ${project.name}`} />
          </div>
        </aside>
      </div>
      {related.length ? (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold">وحدات مرتبطة بالمنطقة</h2>
          <PropertyGrid properties={related} />
        </section>
      ) : null}
      <MobileActionBar whatsappHref={whatsappHref} />
    </div>
  );
}
