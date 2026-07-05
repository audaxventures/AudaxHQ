import { Download } from "lucide-react";
import { Card } from "@/components/ui/Card";

const EXPORTS: { entity: string; label: string; description: string }[] = [
  { entity: "clients", label: "Clients", description: "Every client record" },
  { entity: "leads", label: "Leads", description: "Every lead record" },
  { entity: "invoices", label: "Invoices", description: "Every invoice across every client" },
  { entity: "tasks", label: "Tasks", description: "Every to-do, client task, and lead task" },
  { entity: "time-entries", label: "Time Entries", description: "Every logged Hour & Cost Tracker time entry" },
  { entity: "fixed-costs", label: "Fixed Costs", description: "Every logged Hour & Cost Tracker fixed cost" },
];

export default function DataExportSettingsPage() {
  return (
    <Card className="p-6">
      <h3 className="mb-1 font-heading text-lg font-medium text-navy-900">Data Export</h3>
      <p className="mb-4 text-sm text-navy-500">
        Download your core data as CSV — for backup or peace of mind, independent of the database.
      </p>
      <div className="space-y-2">
        {EXPORTS.map((e) => (
          <div key={e.entity} className="flex items-center justify-between gap-3 rounded-lg border border-navy-100 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy-900">{e.label}</p>
              <p className="text-xs text-navy-400">{e.description}</p>
            </div>
            <a
              href={`/api/export?entity=${e.entity}`}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-600 hover:bg-navy-100"
            >
              <Download size={14} /> Download CSV
            </a>
          </div>
        ))}
      </div>
    </Card>
  );
}
