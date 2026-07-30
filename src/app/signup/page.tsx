import { Rocket } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/SignupForm";
import type { BillingInterval, BusinessTier } from "@/lib/types";

const VALID_TIERS: BusinessTier[] = ["starter", "growth", "scale"];
const VALID_INTERVALS: BillingInterval[] = ["monthly", "annual"];

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; interval?: string }>;
}) {
  const { tier, interval } = await searchParams;
  const initialTier = VALID_TIERS.includes(tier as BusinessTier) ? (tier as BusinessTier) : "growth";
  const initialInterval = VALID_INTERVALS.includes(interval as BillingInterval) ? (interval as BillingInterval) : "monthly";

  return (
    <AuthShell
      icon={Rocket}
      title="Create your workspace"
      description="Set up your business and start managing clients, leads, and tasks in one place."
    >
      <SignupForm initialTier={initialTier} initialInterval={initialInterval} />
    </AuthShell>
  );
}
