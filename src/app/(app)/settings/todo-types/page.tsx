import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { NameListManager } from "@/components/settings/NameListManager";
import { listTodoTypes } from "@/lib/data/todoTypes";
import {
  activateTodoType,
  createTodoType,
  deactivateTodoType,
  updateTodoType,
} from "@/app/(app)/settings/actions";
import { requireOwner } from "@/lib/currentUser";

export default async function TodoTypesSettingsPage() {
  const user = await requireOwner();
  const todoTypes = await listTodoTypes(user.businessId, { includeInactive: true });
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="To-Do Types"
        description={
          <>
            Categories for general to-dos (General, Personal, Other, and anything you add). Client and Lead to-dos
            are a separate, fixed type tied directly to a client or lead record — they don&rsquo;t show up here
            since they can&rsquo;t be renamed or archived.
          </>
        }
      />
      <NameListManager
        items={todoTypes}
        addLabel="Add to-do type"
        namePlaceholder="e.g. Admin"
        onCreate={createTodoType}
        onUpdate={updateTodoType}
        onActivate={activateTodoType}
        onDeactivate={deactivateTodoType}
      />
    </Card>
  );
}
