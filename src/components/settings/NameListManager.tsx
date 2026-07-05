"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

interface NamedItem {
  id: string;
  name: string;
  active: boolean;
}

/**
 * Generic add/edit/archive/restore list for the simple "just a name"
 * settings sections (Work Types, Lead Sources, To-Do Types) — they all
 * follow the identical pattern, unlike Team Members/Work Categories
 * (which also carry a default rate) or Business Entities (which carry
 * address/contact fields), so those keep their own bespoke panels.
 */
export function NameListManager<T extends NamedItem>({
  items,
  addLabel,
  namePlaceholder,
  onCreate,
  onUpdate,
  onActivate,
  onDeactivate,
}: {
  items: T[];
  addLabel: string;
  namePlaceholder: string;
  onCreate: (formData: FormData) => Promise<void>;
  onUpdate: (id: string, formData: FormData) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
}) {
  return (
    <div>
      {items.length === 0 ? (
        <p className="mb-3 text-sm text-navy-400">Nothing here yet.</p>
      ) : (
        <div className="mb-3 space-y-2">
          {items.map((item) => (
            <Row key={item.id} item={item} onUpdate={onUpdate} onActivate={onActivate} onDeactivate={onDeactivate} />
          ))}
        </div>
      )}
      <AddForm addLabel={addLabel} namePlaceholder={namePlaceholder} onCreate={onCreate} />
    </div>
  );
}

function Row<T extends NamedItem>({
  item,
  onUpdate,
  onActivate,
  onDeactivate,
}: {
  item: T;
  onUpdate: (id: string, formData: FormData) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={(formData) => {
          startTransition(async () => {
            await onUpdate(item.id, formData);
            setEditing(false);
          });
        }}
        className="flex items-center gap-2 rounded-lg border border-navy-100 p-3"
      >
        <Input name="name" defaultValue={item.name} required className="flex-1" />
        <button
          type="submit"
          className="flex items-center gap-1 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-medium text-cream-50 cursor-pointer"
        >
          <Check size={12} /> Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex items-center gap-1 rounded-lg border border-navy-200 px-2.5 py-1 text-xs font-medium text-navy-600 cursor-pointer"
        >
          <X size={12} /> Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-navy-100 px-3 py-2">
      <p className={cn("truncate text-sm font-medium", item.active ? "text-navy-900" : "text-navy-400")}>
        {item.name}
        {!item.active && <span className="ml-2 text-xs font-normal text-navy-400">Archived</span>}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="p-1.5 text-navy-300 hover:text-navy-600 cursor-pointer"
          aria-label="Edit"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() => startTransition(() => void (item.active ? onDeactivate(item.id) : onActivate(item.id)))}
          className="rounded-md px-2 py-1 text-xs font-medium text-navy-600 hover:bg-navy-100 cursor-pointer"
        >
          {item.active ? "Archive" : "Restore"}
        </button>
      </div>
    </div>
  );
}

function AddForm({
  addLabel,
  namePlaceholder,
  onCreate,
}: {
  addLabel: string;
  namePlaceholder: string;
  onCreate: (formData: FormData) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-burnt-600 hover:text-burnt-700 cursor-pointer"
      >
        <Plus size={15} /> {addLabel}
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await onCreate(formData);
        });
        formRef.current?.reset();
        setExpanded(false);
      }}
      className="flex items-center gap-2 rounded-xl border border-dashed border-navy-200 p-3"
    >
      <Input name="name" placeholder={namePlaceholder} required className="flex-1" />
      <button type="submit" className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-cream-50 cursor-pointer">
        Add
      </button>
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 cursor-pointer"
      >
        Cancel
      </button>
    </form>
  );
}
