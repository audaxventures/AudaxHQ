import Link from "next/link";
import { cn } from "@/lib/cn";

export function TagFilterBar({ tags, active }: { tags: string[]; active?: string }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Link
        href="/todos"
        className={cn(
          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors border",
          !active
            ? "bg-navy-900 text-cream-50 border-navy-900"
            : "bg-transparent text-navy-600 border-navy-200 hover:border-navy-400"
        )}
      >
        All tags
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/todos?tag=${encodeURIComponent(tag)}`}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors border",
            active === tag
              ? "bg-burnt-500 text-cream-50 border-burnt-500"
              : "bg-transparent text-navy-600 border-navy-200 hover:border-navy-400"
          )}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
