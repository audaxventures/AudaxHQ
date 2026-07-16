import { CheckCircle2, Lock } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const { next, reset } = await searchParams;

  return (
    <AuthShell icon={Lock} title="Sign in" description="Enter your email and passcode to access your Verclara workspace.">
      {reset === "1" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-sage-600/40 bg-sage-600/15 px-4 py-3 text-sm text-sage-100">
          <CheckCircle2 size={16} className="shrink-0" />
          Your passcode has been reset. Sign in with your new passcode below.
        </div>
      )}
      <LoginForm next={next ?? "/"} />
    </AuthShell>
  );
}
