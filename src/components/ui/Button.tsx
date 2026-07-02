import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-navy-900 text-cream-50 hover:bg-navy-800 active:bg-navy-950 shadow-sm",
  secondary:
    "bg-transparent text-navy-800 border border-navy-200 hover:border-navy-400 hover:bg-navy-100/50",
  ghost: "bg-transparent text-navy-600 hover:bg-navy-100/60 hover:text-navy-900",
  danger: "bg-transparent text-brick-600 border border-brick-100 hover:bg-brick-100",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
};

const base =
  "inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(base, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <Link
      href={href}
      className={cn(base, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
