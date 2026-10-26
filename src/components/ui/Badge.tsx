type Tone = "forest" | "gold" | "muted" | "ivory";

const tones: Record<Tone, string> = {
  forest: "bg-forest text-ivory",
  gold: "bg-gold/15 text-forest border border-gold/40",
  muted: "bg-white text-muted border border-line",
  ivory: "bg-ivory text-ink border border-line",
};

export function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span className={`inline-flex items-center rounded-sm px-2.5 py-1 text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}
