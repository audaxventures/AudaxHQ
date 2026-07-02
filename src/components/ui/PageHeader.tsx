export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-burnt-500 mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-3xl sm:text-4xl font-medium text-navy-900 leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-navy-500 max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
