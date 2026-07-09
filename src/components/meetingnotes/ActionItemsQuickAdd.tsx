"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { MeetingActionItemTask } from "@/lib/types";

interface QueuedActionItem {
  text: string;
  dueDate: string | null;
}

/**
 * Replaces the old free-text "action items" rich-text field: queues new
 * action items here (serialized into a hidden JSON field so they post with
 * the rest of the form) and, in edit mode, shows already-created to-dos
 * linked to this meeting as a live checklist. The server action turns each
 * queued item into a real to-do linked back to this note — see
 * lib/actions/meetingnotes.ts.
 */
export function ActionItemsQuickAdd({
  name,
  existingTasks,
  onToggleExisting,
}: {
  name: string;
  /** Already-created to-dos linked to this meeting note — edit mode only. */
  existingTasks?: MeetingActionItemTask[];
  /** Called when an existing linked to-do's checkbox is toggled. */
  onToggleExisting?: (taskId: string, completed: boolean) => void;
}) {
  const [items, setItems] = useState<QueuedActionItem[]>([]);
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");

  function addItem() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, { text: trimmed, dueDate: dueDate || null }]);
    setText("");
    setDueDate("");
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
