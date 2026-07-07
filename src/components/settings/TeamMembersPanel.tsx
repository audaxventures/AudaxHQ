"use client";

import { useRef, useState, useTransition } from "react";
import { Check, KeyRound, Pencil, Plus, ShieldCheck, X } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { TeamMember } from "@/lib/types";
import {
  activateTeamMember,
  createTeamMember,
  deactivateTeamMember,
  disableTeamMemberLogin,
  enableTeamMemberLogin,
  resetTeamMemberPasscode,
  updateClientAccess,
  updateTeamMember,
} from "@/app/(app)/tracker/actions";

interface ClientOption {
  id: string;
  companyName: string;
}

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

function EnableLoginForm({ member, onDone }: { member: TeamMember; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await enableTeamMemberLogin(member.id, formData);
            onDone();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't enable login.");
          }
        });
      }}
      className="space-y-2"
    >
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="passcode" type="password" placeholder="Set an initial passcode" required minLength={4} />
      {error && <p className="text-xs text-brick-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-cream-50 cursor-pointer"
        >
          {pending ? "Saving…" : "Enable login"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ResetPasscodeForm({ member, onDone }: { member: TeamMember; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await resetTeamMemberPasscode(member.id, formData);
            onDone();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't reset passcode.");
          }
        });
      }}
      className="flex items-start gap-2"
    >
      <Input name="passcode" type="password" placeholder="New passcode" required minLength={4} className="max-w-[180px]" />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-cream-50 cursor-pointer"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="shrink-0 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 cursor-pointer"
      >
        Cancel
      </button>
      {error && <p className="text-xs text-brick-600">{error}</p>}
    </form>
  );
}

function ClientAccessList({
  member,
  clients,
  accessibleClientIds,
}: {
  member: TeamMember;
  clients: ClientOption[];
  accessibleClientIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(accessibleClientIds));
  const [saved, setSaved] = useState(true);
  const [pending, startTransition] = useTransition();

  function toggle(clientId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
    setSaved(false);
  }

  function save() {
    const formData = new FormData();
    for (const id of selected) formData.append("clientId", id);
    startTransition(async () => {
      await updateClientAccess(member.id, formData);
      setSaved(true);
    });
  }

  if (clients.length === 0) {
    return <p className="text-xs text-navy-400">No clients yet.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-navy-100 p-2">
        {clients.map((c) => (
          <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-navy-50">
            <input
              type="checkbox"
              checked={selected.has(c.id)}
              onChange={() => toggle(c.id)}
              className="h-3.5 w-3.5 rounded-sm border-navy-300 text-burnt-600 focus:ring-burnt-500"
            />
            <span className="truncate text-navy-700">{c.companyName}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saved || pending}
        className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-cream-50 disabled:opacity-40 cursor-pointer"
      >
        {pending ? "Saving…" : saved ? "Saved" : "Save client access"}
      </button>
    </div>
  );
}

function AccessPanel({
  member,
  clients,
  accessibleClientIds,
  onClose,
}: {
  member: TeamMember;
  clients: ClientOption[];
  accessibleClientIds: string[];
  onClose: () => void;
}) {
  const [resettingPasscode, setResettingPasscode] = useState(false);
  const [, startTransition] = useTransition();

  if (!member.hasLogin) {
    return (
      <div className="rounded-lg border border-navy-100 bg-navy-50/50 p-3">
        <EnableLoginForm member={member} onDone={onClose} />
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-navy-100 bg-navy-50/50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-navy-500">
          Login: <span className="font-medium text-navy-700">{member.email}</span>
        </p>
        <button
          type="button"
          onClick={() =>
            startTransition(() => {
              if (confirm(`Remove ${member.name}'s login? They'll no longer be able to sign in.`)) {
                void disableTeamMemberLogin(member.id);
              }
            })
          }
          className="text-xs font-medium text-brick-600 hover:text-brick-700 cursor-pointer"
        >
          Remove login
        </button>
      </div>

      {resettingPasscode ? (
        <ResetPasscodeForm member={member} onDone={() => setResettingPasscode(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setResettingPasscode(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-navy-600 hover:text-navy-900 cursor-pointer"
        >
          <KeyRound size={12} /> Reset passcode
        </button>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium text-navy-600">Client access</p>
        <ClientAccessList member={member} clients={clients} accessibleClientIds={accessibleClientIds} />
      </div>

      <button type="button" onClick={onClose} className="text-xs font-medium text-navy-400 hover:text-navy-600 cursor-pointer">
        Close
      </button>
    </div>
  );
}

function TeamMemberRow({
  member,
  clients,
  accessibleClientIds,
}: {
  member: TeamMember;
  clients: ClientOption[];
  accessibleClientIds: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [managingAccess, setManagingAccess] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-navy-100 p-3">
      {editing ? (
        <TeamMemberEditForm member={member} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className={cn("truncate text-sm font-medium", member.active ? "text-navy-900" : "text-navy-400")}>
              {member.name}
            </p>
            <p className="text-xs text-navy-400">
              {formatCurrency(member.defaultHourlyRate)}/hr
              {!member.active && " · Inactive"}
              {member.hasLogin ? ` · Has login` : " · No login"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setManagingAccess((v) => !v)}
              className={cn(
                "p-1.5 cursor-pointer",
                managingAccess ? "text-burnt-600" : "text-navy-300 hover:text-navy-600"
              )}
              aria-label="Manage login and access"
            >
              <ShieldCheck size={14} />
            </button>
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
      )}

      {managingAccess && !editing && (
        <div className="mt-3">
          <AccessPanel
            member={member}
            clients={clients}
            accessibleClientIds={accessibleClientIds}
            onClose={() => setManagingAccess(false)}
          />
        </div>
      )}
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

export function TeamMembersPanel({
  teamMembers,
  clients,
  clientAccess,
}: {
  teamMembers: TeamMember[];
  clients: ClientOption[];
  clientAccess: Record<string, string[]>;
}) {
  return (
    <div>
      {teamMembers.length === 0 ? (
        <p className="mb-3 text-sm text-navy-400">No team members yet.</p>
      ) : (
        <div className="mb-3 space-y-2">
          {teamMembers.map((m) => (
            <TeamMemberRow key={m.id} member={m} clients={clients} accessibleClientIds={clientAccess[m.id] ?? []} />
          ))}
        </div>
      )}
      <AddTeamMemberForm />
    </div>
  );
}
