"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { WorkCategory } from "@/lib/types";
import {
  activateWorkCategory,
  createWorkCategory,
  deactivateWorkCategory,
  updateWorkCategory,
} from "@/app/(app)/tracker/actions";

function WorkCategoryEditForm({ category, onDone }: { category: WorkCategory; onDone: () => void }) {
  const [, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateWorkCategory(category.id, formData);
          onDone();
        });
      }}
      className="space-y-2"
    >
      <Input name="name" defaultValue={category.name} required />
      <Input
        name="defaultHourlyRate"
        type="number"
        step="0.01"
        min="0"
        defaultValue={category.defaultHourlyRate}
        required
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex items-center gap-1 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-medium text-cream-50 cursor-pointer"
        >
          <Check size={12} /> Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex items-center gap-1 rounded-lg border border-navy-200 px-2.5 py-1 text-xs font-medium text-navy-600 cursor-pointer"
        >
          <X size={12} /> Cancel
        </button>
      </div>
    </form>
  );
}

function WorkCategoryRow({ category }: { category: WorkCategory }) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="rounded-lg border border-navy-100 p-3">
        <WorkCategoryEditForm category={category} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-navy-100 px-3 py-2">
      <div className="min-w-0">
        <p className={cn("truncate text-sm font-medium", category.active ? "text-navy-900" : "text-navy-400")}>
          {category.name}
        </p>
        <p className="text-xs text-navy-400">
          {formatCurrency(category.defaultHourlyRate)}/hr
          {!category.active && " · Inactive"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="p-1.5 text-navy-300 hover:text-navy-600 cursor-pointer"
          aria-label="Edit category"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() =>
            startTransition(() => {
              void (category.active ? deactivateWorkCategory(category.id) : activateWorkCategory(category.id));
            })
          }
          className="rounded-md px-2 py-1 text-xs font-medium text-navy-600 hover:bg-navy-100 cursor-pointer"
        >
          {category.active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

function AddWorkCategoryForm() {
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
        <Plus size={15} /> Add category
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await createWorkCategory(formData);
        });
        formRef.current?.reset();
        setExpanded(false);
      }}
      className="rounded-xl border border-dashed border-navy-200 p-3 space-y-2"
    >
      <Input name="name" placeholder="Admin Hours, Professional Development…" required />
      <Input name="defaultHourlyRate" type="number" step="0.01" min="0" placeholder="Default rate ($/hr)" required />
      <div className="flex gap-2">
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
      </div>
    </form>
  );
}

export function WorkCategoriesPanel({ categories }: { categories: WorkCategory[] }) {
  return (
    <div>
      {categories.length === 0 ? (
        <p className="mb-3 text-sm text-navy-400">No categories yet.</p>
      ) : (
        <div className="mb-3 space-y-2">
          {categories.map((c) => (
            <WorkCategoryRow key={c.id} category={c} />
          ))}
        </div>
      )}
      <AddWorkCategoryForm />
    </div>
  );
}
