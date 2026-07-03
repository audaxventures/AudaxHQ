import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded logo, dimensions unknown */}
          <img src="/logo.png" alt="Audax Ventures" className="h-20 w-auto mx-auto mb-3" />
          <h1 className="font-heading text-3xl font-medium text-burnt-400">Audax HQ</h1>
        </div>
        <div className="rounded-2xl border border-navy-800 bg-navy-900/60 p-8 shadow-xl backdrop-blur">
          <LoginForm next={next ?? "/"} />
        </div>
      </div>
    </div>
  );
}
