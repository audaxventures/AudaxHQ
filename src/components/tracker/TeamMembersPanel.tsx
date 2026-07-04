"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { TeamMember } from "@/lib/types";
import {
  activateTeamMember,
  createTeamMember,
  deactivateTeamMember,
  updateTeamMember,
} from "@/app/(app)/tracker/actions";

function TeamMemberEditForm({ member, onDone }: { member: TeamMember; onDone: () => void }) {
  const [, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateTeamMember(member.id, formData);
          onDone();
        });
      }}
      className="space-y-2"
    >
      <Input name="name" defaultValue={member.name} required />
      <Input name="defaultHourlyRate" type="number" step="0.01" min="0" defaultValue={member.defaultHourlyRate} required />
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

function TeamMemberRow({ member }: { member: TeamMember }) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="rounded-lg border border-navy-100 p-3">
        <TeamMemberEditForm member={member} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-navy-100 px-3 py-2">
      <div className="min-w-0">
        <p className={cn("truncate text-sm font-medium", member.active ? "text-navy-900" : "text-navy-400")}>
          {member.name}
        </p>
        <p className="text-xs text-navy-400">
          {formatCurrency(member.defaultHourlyRate)}/hr
          {!member.active && " · Inactive"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="p-1.5 text-navy-300 hover:text-navy-600 cursor-pointer"
          aria-label="Edit team member"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() =>
            startTransition(() => {
              void (member.active ? deactivateTeamMember(member.id) : activateTeamMember(member.id));
            })
          }
          className="rounded-md px-2 py-1 text-xs font-medium text-navy-600 hover:bg-navy-100 cursor-pointer"
        >
          {member.active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

function AddTeamMemberForm() {
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
        <Plus size={15} /> Add team member
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await createTeamMember(formData);
        });
        formRef.current?.reset();
        setExpanded(false);
      }}
      className="rounded-xl border border-dashed border-navy-200 p-3 space-y-2"
    >
      <Input name="name" placeholder="Name" required />
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

export function TeamMembersPanel({ teamMembers }: { teamMembers: TeamMember[] }) {
  return (
    <div>
      {teamMembers.length === 0 ? (
        <p className="mb-3 text-sm text-navy-400">No team members yet.</p>
      ) : (
        <div className="mb-3 space-y-2">
          {teamMembers.map((m) => (
            <TeamMemberRow key={m.id} member={m} />
          ))}
        </div>
      )}
      <AddTeamMemberForm />
    </div>
  );
}
