import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

function PagerButton({
  href,
  disabled,
  label,
  children,
}: {
  href?: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const classes = cn(
    "flex h-9 w-9 items-center justify-center rounded-lg border border-navy-200 transition-colors",
    disabled ? "text-navy-200" : "text-navy-600 hover:border-navy-400 hover:bg-navy-100/50"
  );
  if (disabled || !href) {
    return (
      <span aria-hidden className={classes}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={classes}>
      {children}
    </Link>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  itemLabel,
  buildHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  itemLabel: string;
  buildHref: (page: number) => string;
}) {
  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-navy-400">
        Showing {start} to {end} of {total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <PagerButton href={buildHref(page - 1)} disabled={!hasPrev} label="Previous page">
          <ChevronLeft size={16} />
        </PagerButton>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-sm font-medium text-cream-50">
          {page}
        </span>
        <PagerButton href={buildHref(page + 1)} disabled={!hasNext} label="Next page">
          <ChevronRight size={16} />
        </PagerButton>
      </div>
    </div>
  );
}
