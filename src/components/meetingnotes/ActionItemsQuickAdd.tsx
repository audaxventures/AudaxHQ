"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { MeetingActionItemTask, TaskOwner } from "@/lib/types";

interface QueuedActionItem {
  text: string;
  dueDate: string | null;
  ownedBy: TaskOwner;
}

/**
 * Replaces the old free-text "action items" rich-text field: queues new
 * action items here (serialized into a hidden JSON field so they post with
 * the rest of the form) and, in edit mode, shows already-created to-dos
 * linked to this meeting as a live checklist. The server action turns each
 * queued item into a real to-do linked back to this note — see
 * lib/actions/meetingnotes.ts. Each item can be marked "Us" (goes on the
 * team's own to-do board) or "Them" (the client/lead's own commitment —
 * stays here as a checklist, never shows up on the team's board).
 */
export function ActionItemsQuickAdd({
  name,
  theirLabel = "Client",
  existingTasks,
  onToggleExisting,
}: {
  name: string;
  /** What to call the other party in the toggle/badge — "Client" or "Lead". */
  theirLabel?: string;
  /** Already-created to-dos linked to this meeting note — edit mode only. */
  existingTasks?: MeetingActionItemTask[];
  /** Called when an existing linked to-do's checkbox is toggled. */
  onToggleExisting?: (taskId: string, completed: boolean) => void;
}) {
  const [items, setItems] = useState<QueuedActionItem[]>([]);
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [ownedBy, setOwnedBy] = useState<TaskOwner>("TEAM");

  function addItem() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, { text: trimmed, dueDate: dueDate || null, ownedBy }]);
    setText("");
    setDueDate("");
    setOwnedBy("TEAM");
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      {!!existingTasks?.length && (
        <ul className="mb-3 space-y-1.5">
          {existingTasks.map((task) => {
            const completed = task.status === "COMPLETED";
            return (
              <li key={task.id} className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onToggleExisting?.(task.id, !completed)}
                  aria-label={completed ? "Mark incomplete" : "Mark complete"}
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors cursor-pointer",
                    completed ? "border-sage-600 bg-sage-600 text-white" : "border-navy-300 hover:border-navy-500"
                  )}
                >
                  {completed && <Check size={12} strokeWidth={3} />}
                </button>
                <span className={cn("flex-1 text-sm", completed ? "text-navy-400 line-through" : "text-navy-800")}>
                  {task.title}
                </span>
                {task.ownedBy === "EXTERNAL" && <Badge tone="violet">{theirLabel}</Badge>}
                {task.dueDate && <span className="text-xs text-navy-400">{formatDate(task.dueDate)}</span>}
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2.5 rounded-lg bg-cream-100 px-2.5 py-1.5">
              <span className="flex-1 text-sm text-navy-800">{item.text}</span>
              {item.ownedBy === "EXTERNAL" && <Badge tone="violet">{theirLabel}</Badge>}
              {item.dueDate && <span className="text-xs text-navy-400">{formatDate(item.dueDate)}</span>}
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Remove"
                className="text-navy-300 hover:text-brick-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder="Add an action item…"
          className="min-w-[10rem] flex-1"
        />
        <div className="flex shrink-0 rounded-lg border border-navy-200 p-0.5">
          <button
            type="button"
            aria-label="This action item is for our team"
            aria-pressed={ownedBy === "TEAM"}
            onClick={() => setOwnedBy("TEAM")}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              ownedBy === "TEAM" ? "bg-navy-900 text-cream-50" : "text-navy-500 hover:bg-navy-100"
            )}
          >
            Us
          </button>
          <button
            type="button"
            aria-label={`This action item is for the ${theirLabel.toLowerCase()}`}
            aria-pressed={ownedBy === "EXTERNAL"}
            onClick={() => setOwnedBy("EXTERNAL")}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              ownedBy === "EXTERNAL" ? "bg-navy-900 text-cream-50" : "text-navy-500 hover:bg-navy-100"
            )}
          >
            {theirLabel}
          </button>
        </div>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-40"
          aria-label="Due date (optional)"
        />
        <button
          type="button"
          onClick={addItem}
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-navy-100 p-2.5 text-navy-600 transition-colors hover:bg-navy-200"
          aria-label="Add action item"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
