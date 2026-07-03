import { CheckCircle2 } from "lucide-react";

export function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-sage-600/30 bg-sage-100 px-4 py-3 text-sm font-medium text-sage-600 mb-6">
      <CheckCircle2 size={18} className="shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
