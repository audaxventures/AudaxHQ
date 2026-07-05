export function SettingsPanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 border-b border-navy-100 pb-5">
      <div>
        <h3 className="font-heading text-xl font-medium text-navy-900">{title}</h3>
        <p className="mt-1.5 max-w-xl text-sm text-navy-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
