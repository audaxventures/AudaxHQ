import { Info } from "lucide-react";

export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-100/70 px-4 py-3.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-600">
        <Info size={15} />
      </span>
      <div className="text-sm leading-snug">{children}</div>
    </div>
  );
}
