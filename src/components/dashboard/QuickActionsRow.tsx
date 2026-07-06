import Link from "next/link";
import { cn } from "@/lib/cn";
import { QUICK_ACTIONS } from "@/lib/quickActions";

/** Desktop-only row mirroring the mobile QuickActionsFab sheet — hidden below md since the FAB covers that. */
export function QuickActionsRow() {
  return (
    <div className="hidden gap-3 md:grid md:grid-cols-5">
      {QUICK_ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex items-center gap-2.5 rounded-2xl border border-navy-100 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(16,29,51,0.04)] transition-all hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md"
        >
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", action.iconClasses)}>
            <action.icon size={15} />
          </span>
          <span className="min-w-0 truncate text-sm font-medium text-navy-800">
            {action.shortLabel ?? action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
