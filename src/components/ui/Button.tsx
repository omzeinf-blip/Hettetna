import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold";

const variants: Record<Variant, string> = {
  primary:
    "bg-forest text-ivory hover:bg-forest-dark disabled:bg-muted",
  secondary:
    "bg-white text-forest border border-line hover:border-forest",
  ghost: "bg-transparent text-forest hover:bg-white",
  gold: "bg-gold text-forest-dark hover:bg-[#a88a4e]",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: Variant;
  children: ReactNode;
};

export function Button({
  href,
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`;

  if (href) {
    if (href.startsWith("http")) {
      return (
        <a href={href} className={classes} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} onClick={props.onClick as never}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
