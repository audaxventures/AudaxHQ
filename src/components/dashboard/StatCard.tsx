import Link from "next/link";
import { cn } from "@/lib/cn";

/** Each of the 3 dashboard stat cards uses a designed background image (public/*-card.png) that already bakes in its own tinted gradient, decorative art, and icon glyph — so this component only lays out the text on top of it. */
export function StatCard({
  backgroundImage,
  label,
  value,
  caption,
  href,
}: {
  backgroundImage: string;
  label: string;
  value: React.ReactNode;
  caption: React.ReactNode;
  /** When set, the whole card links to the relevant page. */
  href?: string;
}) {
  const content = (
    <>
      <p className="mt-16 text-xs font-semibold uppercase tracking-wide text-navy-600">{label}</p>
      <p className="font-heading text-4xl font-semibold text-navy-900 tabular-nums leading-tight">{value}</p>
      <div className="mt-1.5 text-sm font-medium">{caption}</div>
    </>
  );

  const className = cn(
    "relative block overflow-hidden rounded-2xl bg-cover bg-left-top p-6",
    href && "transition-transform hover:-translate-y-0.5"
  );
  const style = { backgroundImage: `url('${backgroundImage}')` };

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}
