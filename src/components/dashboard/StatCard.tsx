/** Each of the 3 dashboard stat cards uses a designed background image (public/*-card.png) that already bakes in its own tinted gradient, decorative art, and icon glyph — so this component only lays out the text on top of it. */
export function StatCard({
  backgroundImage,
  label,
  value,
  caption,
}: {
  backgroundImage: string;
  label: string;
  value: React.ReactNode;
  caption: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-cover bg-left-top p-6"
      style={{ backgroundImage: `url('${backgroundImage}')` }}
    >
      <p className="mt-16 text-xs font-semibold uppercase tracking-wide text-navy-600">{label}</p>
      <p className="font-heading text-4xl font-semibold text-navy-900 tabular-nums leading-tight">{value}</p>
      <div className="mt-1.5 text-sm font-medium">{caption}</div>
    </div>
  );
}
