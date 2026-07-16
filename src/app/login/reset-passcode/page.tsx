import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasscodeForm } from "@/components/ResetPasscodeForm";

export default async function ResetPasscodePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell icon={KeyRound} title="Set a new passcode" description="Choose a new passcode for your Verclara workspace.">
      {token ? (
        <ResetPasscodeForm token={token} />
      ) : (
        <div className="space-y-4 text-center">
          <p className="text-sm text-brick-100">This reset link is missing its token. Request a new one from the sign-in page.</p>
          <Link href="/login/forgot" className="text-sm font-medium text-burnt-400 hover:text-burnt-300">
            Request a reset link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
