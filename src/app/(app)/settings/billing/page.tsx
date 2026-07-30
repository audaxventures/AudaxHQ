import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { BillingPanel } from "@/components/settings/BillingPanel";
import { requireCurrentUser } from "@/lib/currentUser";

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  // Unlike every other /settings/* page this one isn't owner-only — a lapsed
  // subscription redirects the whole workspace here (see (app)/layout.tsx),
  // and proxy.ts's OWNER_ONLY_PATH_PREFIXES carries a matching exception so
  // team members can actually land on it instead of bouncing to /.
  const user = await requireCurrentUser();
  const { checkout } = await searchParams;
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Billing"
        description="Your plan, trial status, and payment method — managed through Stripe's secure billing portal."
      />
      {user.role === "OWNER" ? (
        <BillingPanel business={user.business} checkoutParam={checkout} />
      ) : (
        <p className="text-sm text-navy-500">
          Billing is managed by your workspace owner. Contact them to start a subscription, update payment details, or
          change plans.
        </p>
      )}
    </Card>
  );
}
