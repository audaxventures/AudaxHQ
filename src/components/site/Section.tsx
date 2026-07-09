import { cn } from "@/lib/cn";

export function Section({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20", className)} {...props} />;
}
