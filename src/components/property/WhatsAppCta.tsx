import { Button } from "@/components/ui/Button";
import { hasWhatsApp } from "@/lib/config";
import { getContactSettings } from "@/lib/data/access";
import { buildWhatsAppLink } from "@/lib/format";
import { copy } from "@/lib/i18n";
import type { Property } from "@/lib/types";

export async function WhatsAppCta({ property }: { property?: Property }) {
  const contactSettings = await getContactSettings();
  if (!hasWhatsApp(contactSettings)) {
    return (
      <div className="space-y-3 rounded-sm border border-line bg-ivory p-4">
        <p className="text-sm text-muted">{copy.whatsappUnavailable}</p>
        <Button href="/contact" variant="secondary">
          {copy.contactCta}
        </Button>
      </div>
    );
  }

  const message = property
    ? `مرحبًا، أريد الاستفسار عن العقار رقم ${property.propertyCode}.`
    : "مرحبًا، أريد الاستفسار عن عقارات حِتّتنا.";

  return (
    <Button href={buildWhatsAppLink(contactSettings.whatsappNumber, message)} variant="gold">
      {copy.whatsappCta}
    </Button>
  );
}
