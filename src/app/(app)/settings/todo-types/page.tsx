import { Card } from "@/components/ui/Card";
import { NameListManager } from "@/components/settings/NameListManager";
import { listTodoTypes } from "@/lib/data/todoTypes";
import {
  activateTodoType,
  createTodoType,
  deactivateTodoType,
  updateTodoType,
} from "@/app/(app)/settings/actions";

export default async function TodoTypesSettingsPage() {
  const todoTypes = await listTodoTypes({ includeInactive: true });
  return (
    <Card className="p-6">
      <h3 className="mb-1 font-heading text-lg font-medium text-navy-900">To-Do Types</h3>
      <p className="mb-4 text-sm text-navy-500">
        Categories for general to-dos (General, Personal, Audax Ventures, H2MB, Other, and anything you add). Client
        and Lead to-dos are a separate, fixed type tied directly to a client or lead record — they don&rsquo;t show
        up here since they can&rsquo;t be renamed or archived.
      </p>
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
