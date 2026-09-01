import { Rocket } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/SignupForm";
import type { BillingInterval, BusinessTier } from "@/lib/types";

const VALID_TIERS: BusinessTier[] = ["starter", "growth", "scale"];
const VALID_INTERVALS: BillingInterval[] = ["monthly", "annual"];

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; interval?: string; checkout?: string }>;
}) {
  const { tier, interval, checkout } = await searchParams;
  const initialTier = VALID_TIERS.includes(tier as BusinessTier) ? (tier as BusinessTier) : "growth";
  const initialInterval = VALID_INTERVALS.includes(interval as BillingInterval) ? (interval as BillingInterval) : "monthly";

  return (
    <AuthShell
      icon={Rocket}
      title="Create your workspace"
      description="Set up your business and start managing clients, leads, and tasks in one place."
    >
      {checkout === "canceled" && (
        <p className="mb-4 rounded-xl border border-navy-700 bg-navy-900/60 px-4 py-3 text-sm text-navy-300">
          Checkout was canceled — no account was created. Pick a plan and try again whenever you&rsquo;re ready.
        </p>
      )}
      {checkout === "invalid" && (
        <p className="mb-4 rounded-xl border border-brick-500/40 bg-brick-500/10 px-4 py-3 text-sm text-brick-100">
          Something went wrong finishing checkout. No account was created — please try signing up again.
        </p>
      )}
      <SignupForm initialTier={initialTier} initialInterval={initialInterval} />
    </AuthShell>
  );
}
