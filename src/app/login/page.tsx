import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <div className="flex flex-1 flex-col items-center justify-center bg-cream-50 px-8 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded logo, dimensions unknown */}
        <img src="/logo.png" alt="Audax Ventures" className="mb-8 h-24 w-auto sm:h-28" />
        <h1 className="max-w-md text-balance font-heading text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
          Welcome to <span className="font-bold text-burnt-500">Audax HQ</span>
        </h1>
        <p className="mt-4 text-lg font-medium text-navy-600">Your business command center</p>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-navy-500">
          Manage clients, projects, tasks, and more in one centralized platform. Sign in to
          access your workspace and continue where you left off.
        </p>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-navy-900 to-navy-950 px-8 py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(120% 60% at 50% 0%, rgba(214,122,60,0.16), transparent 60%)",
          }}
        />
        <div className="relative w-full max-w-sm">
          <div className="mb-8 text-center">
            <h2 className="font-heading text-3xl font-medium text-cream-50">Sign In</h2>
            <p className="mt-2 text-sm text-navy-300">
              Enter your passcode below to access your Audax HQ workspace.
            </p>
          </div>
          <div className="rounded-2xl border border-navy-700/60 bg-navy-800/60 p-8 shadow-xl backdrop-blur">
            <LoginForm next={next ?? "/"} />
          </div>
        </div>
      </div>
    </div>
  );
}
