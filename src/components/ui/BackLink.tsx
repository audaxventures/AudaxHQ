import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 transition-colors hover:text-navy-800"
    >
      <ArrowLeft size={15} />
      {label}
    </Link>
  );
}
