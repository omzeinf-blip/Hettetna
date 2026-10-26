import { Button } from "@/components/ui/Button";

/** Sticky call-to-action on small screens. Anchors to the inquiry form (#inquiry) and optionally WhatsApp. */
export function MobileActionBar({ whatsappHref }: { whatsappHref?: string }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pt-3 backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-6xl gap-3">
        <Button href="#inquiry" className="flex-1">
          اطلب معاينة أو استفسارًا
        </Button>
        {whatsappHref ? (
          <Button href={whatsappHref} variant="gold" className="flex-1">
            واتساب
          </Button>
        ) : null}
      </div>
    </div>
  );
}
