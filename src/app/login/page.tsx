import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-burnt-400 mb-2">
            Audax Ventures
          </p>
          <h1 className="font-heading text-3xl font-medium text-cream-50">Audax HQ</h1>
        </div>
        <div className="rounded-2xl border border-navy-800 bg-navy-900/60 p-8 shadow-xl backdrop-blur">
          <LoginForm next={next ?? "/"} />
        </div>
      </div>
    </div>
  );
}
