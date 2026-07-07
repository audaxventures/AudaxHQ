"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import type { BillingEntity } from "@/lib/types";
import {
  activateBillingEntity,
  createBillingEntity,
  deactivateBillingEntity,
  updateBillingEntity,
} from "@/app/(app)/settings/actions";

function EntityEditForm({ entity, onDone }: { entity: BillingEntity; onDone: () => void }) {
  const [, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateBillingEntity(entity.id, formData);
          onDone();
        });
      }}
      className="space-y-3"
    >
      <FieldGroup>
        <Label htmlFor={`name-${entity.id}`}>Name</Label>
        <Input id={`name-${entity.id}`} name="name" defaultValue={entity.name} required />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor={`address-${entity.id}`}>Address (optional)</Label>
        <Input id={`address-${entity.id}`} name="address" defaultValue={entity.address ?? ""} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor={`contact-${entity.id}`}>Contact info (optional)</Label>
        <Input id={`contact-${entity.id}`} name="contactInfo" defaultValue={entity.contactInfo ?? ""} />
      </FieldGroup>
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

function EntityRow({ entity }: { entity: BillingEntity }) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="rounded-lg border border-navy-100 p-3">
        <EntityEditForm entity={entity} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-navy-100 px-3 py-2">
      <div className="min-w-0">
        <p className={cn("truncate text-sm font-medium", entity.active ? "text-navy-900" : "text-navy-400")}>
          {entity.name}
        </p>
        {(entity.address || entity.contactInfo) && (
          <p className="truncate text-xs text-navy-400">{[entity.address, entity.contactInfo].filter(Boolean).join(" · ")}</p>
        )}
        {!entity.active && <p className="text-xs text-navy-400">Archived</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="p-1.5 text-navy-300 hover:text-navy-600 cursor-pointer"
          aria-label="Edit business entity"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() =>
            startTransition(() => {
              void (entity.active ? deactivateBillingEntity(entity.id) : activateBillingEntity(entity.id));
            })
          }
          className="rounded-md px-2 py-1 text-xs font-medium text-navy-600 hover:bg-navy-100 cursor-pointer"
        >
          {entity.active ? "Archive" : "Restore"}
        </button>
      </div>
    </div>
  );
}

function AddEntityForm() {
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
        <Plus size={15} /> Add business entity
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await createBillingEntity(formData);
        });
        formRef.current?.reset();
        setExpanded(false);
      }}
      className="rounded-xl border border-dashed border-navy-200 p-3 space-y-2"
    >
      <Input name="name" placeholder="Name" required />
      <Input name="address" placeholder="Address (optional)" />
      <Input name="contactInfo" placeholder="Contact info (optional)" />
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

export function BillingEntitiesPanel({ entities }: { entities: BillingEntity[] }) {
  return (
    <div>
      {entities.length === 0 ? (
        <p className="mb-3 text-sm text-navy-400">No business entities yet.</p>
      ) : (
        <div className="mb-3 space-y-2">
          {entities.map((e) => (
            <EntityRow key={e.id} entity={e} />
          ))}
        </div>
      )}
      <AddEntityForm />
    </div>
  );
}
