import Link from "next/link";
import { List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/cn";

function ToggleButton({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        active ? "bg-navy-900 text-cream-50" : "text-navy-400 hover:bg-navy-100"
      )}
    >
      {children}
    </Link>
  );
}

export function ViewToggle({
  isGrid,
  listHref,
  gridHref,
}: {
  isGrid: boolean;
  listHref: string;
  gridHref: string;
}) {
  return (
    <div className="ml-auto flex items-center gap-1 rounded-xl border border-navy-200 bg-white p-1">
      <ToggleButton href={listHref} active={!isGrid} label="List view">
        <List size={16} />
      </ToggleButton>
      <ToggleButton href={gridHref} active={isGrid} label="Grid view">
        <LayoutGrid size={16} />
      </ToggleButton>
    </div>
  );
}
