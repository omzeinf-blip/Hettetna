import { demoModeEnabled } from "@/lib/config";
import { copy } from "@/lib/i18n";

export function DemoBanner() {
  if (!demoModeEnabled) return null;

  return (
    <div className="bg-forest-dark text-ivory">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center text-xs leading-6 md:text-sm">
        {copy.demoBanner}
      </p>
    </div>
  );
}
