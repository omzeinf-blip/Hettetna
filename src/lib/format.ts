export function formatEGP(amount: number): string {
  const formatted = new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} جنيه`;
}

export function formatSqm(area: number): string {
  const formatted = new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 0,
  }).format(area);
  return `${formatted} م²`;
}

export function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export function buildWhatsAppLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
