import { SettingsIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsSubNav } from "@/components/settings/SettingsSubNav";
import { requireCurrentUserIgnoringBilling } from "@/lib/currentUser";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  // Ignoring-billing, not requireCurrentUser: /settings/billing must stay
  // reachable (for both roles) even when the workspace's subscription is
  // lapsed — see the comment on that page — and this layout wraps it too.
  const user = await requireCurrentUserIgnoringBilling();
  return (
    <div>
      <PageHeader
        icon={SettingsIcon}
        tone="slate"
        eyebrow="Settings"
        title="Settings"
        description="Configure your workspace"
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <SettingsSubNav role={user.role} />
        <div>{children}</div>
      </div>
    </div>
  );
}
