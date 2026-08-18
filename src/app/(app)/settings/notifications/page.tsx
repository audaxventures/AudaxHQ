import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { NotificationPreferencesForm } from "@/components/settings/NotificationPreferencesForm";
import { requireCurrentUser } from "@/lib/currentUser";

export default async function NotificationSettingsPage() {
  const user = await requireCurrentUser();
  const email = user.role === "OWNER" ? user.business.ownerEmail : user.teamMember.email;
  const prefs =
    user.role === "OWNER"
      ? {
          notifyTaskAssigned: user.business.ownerNotifyTaskAssigned,
          notifyFollowUpAssigned: user.business.ownerNotifyFollowUpAssigned,
          notifyMention: user.business.ownerNotifyMention,
          notifyDailyBrief: user.business.ownerNotifyDailyBrief,
        }
      : {
          notifyTaskAssigned: user.teamMember.notifyTaskAssigned,
          notifyFollowUpAssigned: user.teamMember.notifyFollowUpAssigned,
          notifyMention: user.teamMember.notifyMention,
          notifyDailyBrief: user.teamMember.notifyDailyBrief,
        };

  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Notifications"
        description="Choose which events email you — everything's on by default so nothing important slips by."
      />
      <NotificationPreferencesForm email={email} prefs={prefs} />
    </Card>
  );
}
