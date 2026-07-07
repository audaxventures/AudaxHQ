import { SettingsIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsSubNav } from "@/components/settings/SettingsSubNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
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
        <SettingsSubNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
