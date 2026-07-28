"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/cn";

function ToggleButton({
  href,
  active,
  label,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
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
  storageKey,
}: {
  isGrid: boolean;
  listHref: string;
  gridHref: string;
  /** When set, remembers the last picked view (list/grid) in localStorage and restores it the next time this page loads fresh. */
  storageKey?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored === "grid" && !isGrid) router.replace(gridHref);
    else if (stored === "list" && isGrid) router.replace(listHref);
    // Only meant to correct the view right when the page first loads, not on every subsequent toggle/filter change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function remember(view: "list" | "grid") {
    if (storageKey) localStorage.setItem(storageKey, view);
  }

  return (
    <div className="ml-auto flex items-center gap-1 rounded-xl border border-navy-200 bg-white p-1">
      <ToggleButton href={listHref} active={!isGrid} label="List view" onClick={() => remember("list")}>
        <List size={16} />
      </ToggleButton>
      <ToggleButton href={gridHref} active={isGrid} label="Grid view" onClick={() => remember("grid")}>
        <LayoutGrid size={16} />
      </ToggleButton>
    </div>
  );
}
