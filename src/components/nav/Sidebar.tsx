import { LogOut } from "lucide-react";
import { NAV_LINKS } from "@/components/nav/nav-links";
import { NavLink } from "@/components/nav/NavLink";

export function Sidebar() {
  return (
    <aside
      className="relative hidden overflow-hidden bg-gradient-to-b from-navy-900 to-navy-950 px-4 py-6 shadow-[0_1px_2px_rgba(16,29,51,0.04),0_20px_40px_-24px_rgba(16,29,51,0.45)] md:my-3 md:ml-3 md:flex md:w-60 md:shrink-0 md:flex-col md:rounded-[20px]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(120% 60% at 50% 0%, rgba(214,122,60,0.16), transparent 60%)",
        }}
      />
      <div className="relative mb-6 border-b border-navy-800/60 px-2 pt-4 pb-5">
        <p className="font-heading text-3xl font-semibold text-burnt-400 leading-tight">Audax HQ</p>
        <p className="mt-1.5 text-xs italic text-cream-100/70">Your business command centre.</p>
      </div>
      <nav className="relative flex flex-col gap-1">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} {...link} />
        ))}
      </nav>
      <form action="/api/logout" method="post" className="relative mt-1">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-navy-400 transition-colors hover:bg-navy-800/60 hover:text-cream-100 cursor-pointer"
        >
          <LogOut size={18} strokeWidth={1.75} />
          Sign out
        </button>
      </form>
    </aside>
  );
}
