import { SidebarNavList } from "@/components/nav/SidebarNavList";
import type { SessionRole } from "@/lib/types";

export function Sidebar({ role }: { role: SessionRole }) {
  return (
    <aside
      className="sticky top-3 relative hidden h-[calc(100dvh-1.5rem)] overflow-y-auto bg-navy-900 bg-cover bg-center px-4 py-6 shadow-[0_1px_2px_rgba(16,29,51,0.04),0_20px_40px_-24px_rgba(16,29,51,0.45)] md:ml-3 md:flex md:w-60 md:shrink-0 md:flex-col md:rounded-[20px]"
      style={{ backgroundImage: "url('/sidebar.png')" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,20,36,0.45) 0%, rgba(10,20,36,0.55) 45%, rgba(10,20,36,0.82) 100%)",
        }}
      />
      <div className="relative mb-6 border-b border-navy-800/60 px-2 pt-4 pb-5">
        <p className="font-heading text-3xl font-semibold text-cream-100 leading-tight">Audax HQ</p>
        <p className="mt-1.5 text-xs italic text-burnt-400">Your business command centre</p>
      </div>
      <SidebarNavList role={role} />
    </aside>
  );
}
