import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatEGP, formatSqm } from "@/lib/format";
import {
  availabilityLabels,
  copy,
  propertyTypeLabels,
  transactionLabels,
} from "@/lib/i18n";
import { propertyPath } from "@/lib/slug";
import type { Property } from "@/lib/types";

export function PropertyCard({ property }: { property: Property }) {
  const image = property.images[0];

  return (
    <article className="group overflow-hidden rounded-sm border border-line bg-white">
      <Link href={propertyPath(property.slug)} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-line">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : null}
          <div className="absolute right-3 top-3 flex flex-wrap gap-2">
            <Badge tone="forest">{transactionLabels[property.transactionType]}</Badge>
            {property.isDemo ? <Badge tone="gold">{copy.demoBadge}</Badge> : null}
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            <span>{propertyTypeLabels[property.propertyType]}</span>
            <span>{property.propertyCode}</span>
          </div>
          <h3 className="text-base font-medium text-ink">{property.title}</h3>
          <p className="text-sm text-muted">
            {property.areaName}
            {property.compound ? ` · ${property.compound}` : ""}
          </p>
          <p className="font-latin text-lg font-semibold text-forest">
            {formatEGP(property.price)}
            {property.transactionType === "rent" ? (
              <span className="ms-1 text-sm font-normal text-muted">/ شهريًا</span>
            ) : null}
          </p>
          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <div>
              <dt className="sr-only">المساحة</dt>
              <dd>{formatSqm(property.areaSqm)}</dd>
            </div>
            {property.bedrooms != null ? (
              <div>
                <dt className="sr-only">غرف النوم</dt>
                <dd>{property.bedrooms} غرف</dd>
              </div>
            ) : null}
            {property.bathrooms != null ? (
              <div>
                <dt className="sr-only">الحمامات</dt>
                <dd>{property.bathrooms} حمّام</dd>
              </div>
            ) : null}
          </dl>
          <p className="text-xs text-muted">{availabilityLabels[property.availabilityStatus]}</p>
        </div>
      </Link>
    </article>
  );
}
