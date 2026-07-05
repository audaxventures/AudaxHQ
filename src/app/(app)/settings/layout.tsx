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
        description="Configuration that used to be scattered across the app (or hardcoded), all in one place."
      />
      <SettingsSubNav />
      {children}
    </div>
  );
}
