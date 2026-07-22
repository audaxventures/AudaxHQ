import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

// text-base (16px) below the sm breakpoint, not text-sm (14px) — iOS Safari
// auto-zooms the viewport on focus for any input rendering smaller than 16px,
// and (unlike the initial zoom-in) doesn't zoom back out on blur.
const fieldBase =
  "w-full rounded-lg border border-navy-200 bg-cream-50 px-3 py-2 text-base sm:text-sm text-navy-900 placeholder:text-navy-400 transition-colors focus:outline-none focus:border-burnt-400 focus:ring-2 focus:ring-burnt-100";

export function Input({
  icon: Icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon }) {
  if (!Icon) {
    return <input {...props} className={cn(fieldBase, className)} />;
  }
  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
      <input {...props} className={cn(fieldBase, "pl-9", className)} />
    </div>
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea(props, ref) {
    return <textarea ref={ref} {...props} className={cn(fieldBase, "resize-y", props.className)} />;
  }
);

export function Select({
  icon: Icon,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { icon?: LucideIcon }) {
  const select = (
    <select
      {...props}
      className={cn(
        fieldBase,
        "cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%2355637a%22><path fill-rule=%22evenodd%22 d=%22M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z%22 clip-rule=%22evenodd%22/></svg>')] bg-no-repeat bg-[right_0.65rem_center] bg-[length:1rem] pr-9",
        Icon && "pl-9",
        className
      )}
    />
  );
  if (!Icon) return select;
  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-navy-400" />
      {select}
    </div>
  );
}

export function Label({
  children,
  required,
  compact,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean; compact?: boolean }) {
  return (
    <label
      {...props}
      className={cn(
        compact
          ? "block text-sm font-medium text-navy-600 mb-1.5"
          : "block text-xs font-medium uppercase tracking-wide text-navy-500 mb-1.5",
        className
      )}
    >
      {children}
      {required && <span className="ml-0.5 text-brick-600">*</span>}
    </label>
  );
}

export function FieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}>{children}</div>;
}
