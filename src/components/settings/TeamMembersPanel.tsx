"use client";

import { useRef, useState, useTransition } from "react";
import { Check, KeyRound, MailCheck, Pencil, Plus, RotateCw, Send, ShieldCheck, Trash2, X } from "lucide-react";
import { Input, fieldBase } from "@/components/ui/Field";
import { InfoNote } from "@/components/ui/InfoNote";
import { EntityColorPicker } from "@/components/ui/EntityColorPicker";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { cn } from "@/lib/cn";

const passwordIconClassName = "text-navy-400 hover:text-navy-600";
import { formatCurrency } from "@/lib/format";
import { hasFeature, TEAM_MEMBER_SEAT_CAP, TIER_LABELS } from "@/lib/entitlements";
import type { BusinessTier, TeamMember } from "@/lib/types";
import {
  activateTeamMember,
  createTeamMember,
  deactivateTeamMember,
  deleteTeamMemberPermanently,
  disableTeamMemberLogin,
  enableTeamMemberLogin,
  inviteTeamMember,
  resendTeamMemberInvite,
  resetTeamMemberPasscode,
  setTeamMemberColor,
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

/** Manual fallback for owners without Resend configured — sets an initial passcode themselves instead of the member setting their own via an emailed link. */
function EnableLoginForm({
  member,
  onDone,
  onBack,
}: {
  member: TeamMember;
  onDone: () => void;
  onBack?: () => void;
}) {
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
      <Input name="email" type="email" placeholder="Email" required defaultValue={member.email ?? ""} />
      <PasswordInput
        id={`initial-passcode-${member.id}`}
        name="passcode"
        placeholder="Set an initial password"
        required
        minLength={4}
        className={fieldBase}
        iconClassName={passwordIconClassName}
      />
      {error && <p className="text-xs text-brick-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-cream-50 cursor-pointer"
        >
          {pending ? "Saving…" : "Set password"}
        </button>
        <button
          type="button"
          onClick={onBack ?? onDone}
          className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 cursor-pointer"
        >
          {onBack ? "Back" : "Cancel"}
        </button>
      </div>
    </form>
  );
}

/** Default way to give a team member access — links their email, then emails them a link to set their own passcode. */
function InviteTeamMemberForm({ member, onDone }: { member: TeamMember; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [manual, setManual] = useState(false);

  if (manual) {
    return <EnableLoginForm member={member} onDone={onDone} onBack={() => setManual(false)} />;
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await inviteTeamMember(member.id, formData);
            onDone();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't send the invite.");
          }
        });
      }}
      className="space-y-2"
    >
      <Input name="email" type="email" placeholder="Email" required defaultValue={member.email ?? ""} />
      <p className="text-xs text-navy-400">They&apos;ll get an email to set up their own password.</p>
      {error && <p className="text-xs text-brick-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-cream-50 cursor-pointer disabled:opacity-50"
        >
          <Send size={12} /> {pending ? "Sending…" : "Send invite"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setManual(true)}
          className="text-xs font-medium text-navy-400 hover:text-navy-600 cursor-pointer"
        >
          Set a password myself instead
        </button>
      </div>
    </form>
  );
}

/** Shown once an invite's been sent but the team member hasn't set their passcode yet. */
function PendingInvitePanel({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [pending, startTransition] = useTransition();

  if (manual) {
    return <EnableLoginForm member={member} onDone={onClose} onBack={() => setManual(false)} />;
  }

  return (
    <div className="space-y-3 rounded-lg border border-navy-100 bg-navy-50/50 p-3">
      <div className="flex items-start gap-1.5">
        <MailCheck size={14} className="mt-0.5 shrink-0 text-burnt-600" />
        <p className="text-xs text-navy-600">
          Invited <span className="font-medium text-navy-800">{member.email}</span> — waiting for them to set a
          password.
        </p>
      </div>
      {resent && <p className="text-xs text-sage-600">Invite resent.</p>}
      {error && <p className="text-xs text-brick-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setResent(false);
            setError(null);
            startTransition(async () => {
              try {
                await resendTeamMemberInvite(member.id);
                setResent(true);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Couldn't resend the invite.");
              }
            });
          }}
          className="flex items-center gap-1 text-xs font-medium text-navy-600 hover:text-navy-900 cursor-pointer disabled:opacity-50"
        >
          <RotateCw size={12} /> {pending ? "Resending…" : "Resend invite"}
        </button>
        <button
          type="button"
          onClick={() => setManual(true)}
          className="text-xs font-medium text-navy-500 hover:text-navy-700 cursor-pointer"
        >
          Set a password myself instead
        </button>
        <button
          type="button"
          onClick={() =>
            startTransition(() => {
              void disableTeamMemberLogin(member.id);
            })
          }
          className="text-xs font-medium text-brick-600 hover:text-brick-700 cursor-pointer"
        >
          Cancel invite
        </button>
      </div>
      <button type="button" onClick={onClose} className="text-xs font-medium text-navy-400 hover:text-navy-600 cursor-pointer">
        Close
      </button>
    </div>
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
            setError(e instanceof Error ? e.message : "Couldn't reset password.");
          }
        });
      }}
      className="flex items-start gap-2"
    >
      <PasswordInput
        id={`reset-passcode-${member.id}`}
        name="passcode"
        placeholder="New password"
        required
        minLength={4}
        className={cn(fieldBase, "max-w-[180px]")}
        iconClassName={passwordIconClassName}
      />
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
  tier,
}: {
  member: TeamMember;
  clients: ClientOption[];
  accessibleClientIds: string[];
  tier: BusinessTier;
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

  if (!hasFeature(tier, "perClientAccessControl")) {
    return (
      <p className="text-xs text-navy-400">
        Per-client access control requires the Growth plan or higher — {member.name} can see every client on your{" "}
        {TIER_LABELS[tier]} plan. Upgrade in Settings &rarr; Billing to restrict access.
      </p>
    );
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
  tier,
  onClose,
}: {
  member: TeamMember;
  clients: ClientOption[];
  accessibleClientIds: string[];
  tier: BusinessTier;
  onClose: () => void;
}) {
  const [resettingPasscode, setResettingPasscode] = useState(false);
  const [, startTransition] = useTransition();

  if (!member.hasLogin) {
    if (member.email) {
      return <PendingInvitePanel member={member} onClose={onClose} />;
    }
    return (
      <div className="rounded-lg border border-navy-100 bg-navy-50/50 p-3">
        <InviteTeamMemberForm member={member} onDone={onClose} />
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
          <KeyRound size={12} /> Reset password
        </button>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium text-navy-600">Client access</p>
        <ClientAccessList member={member} clients={clients} accessibleClientIds={accessibleClientIds} tier={tier} />
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
  tier,
}: {
  member: TeamMember;
  clients: ClientOption[];
  accessibleClientIds: string[];
  tier: BusinessTier;
}) {
  const [editing, setEditing] = useState(false);
  const [managingAccess, setManagingAccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Permanently delete ${member.name}? This can't be undone.`)) return;
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteTeamMemberPermanently(member.id);
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "Couldn't delete this team member.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-navy-100 p-3">
      {editing ? (
        <TeamMemberEditForm member={member} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <EntityColorPicker color={member.color} onSelect={(color) => setTeamMemberColor(member.id, color)} />
              <p className={cn("truncate text-sm font-medium", member.active ? "text-navy-900" : "text-navy-400")}>
                {member.name}
              </p>
            </div>
            <p className="text-xs text-navy-400">
              {formatCurrency(member.defaultHourlyRate)}/hr
              {!member.active && " · Inactive"}
              {member.hasLogin ? ` · Has login` : member.email ? " · Invite sent" : " · No login"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:shrink-0">
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
            {!member.active && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 text-navy-300 hover:text-brick-600 cursor-pointer"
                aria-label="Permanently delete team member"
                title="Permanently delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {deleteError && <p className="mt-2 text-xs text-brick-600">{deleteError}</p>}

      {managingAccess && !editing && (
        <div className="mt-3">
          <AccessPanel
            member={member}
            clients={clients}
            accessibleClientIds={accessibleClientIds}
            tier={tier}
            onClose={() => setManagingAccess(false)}
          />
        </div>
      )}
    </div>
  );
}

function AddTeamMemberForm({ tier, seatCount }: { tier: BusinessTier; seatCount: number }) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const seatCap = TEAM_MEMBER_SEAT_CAP[tier];
  const atCap = seatCap !== null && seatCount >= seatCap;

  if (!expanded) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          disabled={atCap}
          className="flex items-center gap-1.5 text-sm font-medium text-burnt-600 hover:text-burnt-700 disabled:cursor-not-allowed disabled:text-navy-300 disabled:hover:text-navy-300 cursor-pointer"
        >
          <Plus size={15} /> Add team member
        </button>
        {atCap && (
          <p className="mt-1 text-xs text-navy-400">
            Your {TIER_LABELS[tier]} plan includes up to {seatCap} team members — upgrade in Settings &rarr; Billing to
            add more.
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await createTeamMember(formData);
            formRef.current?.reset();
            setExpanded(false);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't add this team member.");
          }
        });
      }}
      className="rounded-xl border border-dashed border-navy-200 p-3 space-y-2"
    >
      <Input name="name" placeholder="Name" required />
      <Input name="defaultHourlyRate" type="number" step="0.01" min="0" placeholder="Default rate ($/hr)" required />
      {error && <p className="text-xs text-brick-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-cream-50 disabled:opacity-50 cursor-pointer"
        >
          {pending ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setExpanded(false);
          }}
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
  tier,
}: {
  teamMembers: TeamMember[];
  clients: ClientOption[];
  clientAccess: Record<string, string[]>;
  tier: BusinessTier;
}) {
  return (
    <div>
      {teamMembers.length === 0 ? (
        <p className="mb-3 text-sm text-navy-400">No team members yet.</p>
      ) : (
        <div className="mb-3 space-y-2">
          {teamMembers.map((m) => (
            <TeamMemberRow
              key={m.id}
              member={m}
              clients={clients}
              accessibleClientIds={clientAccess[m.id] ?? []}
              tier={tier}
            />
          ))}
        </div>
      )}
      <AddTeamMemberForm tier={tier} seatCount={teamMembers.filter((m) => m.active).length} />

      <div className="mt-4">
        <InfoNote>
          <p className="font-medium text-navy-900">
            Click the <ShieldCheck size={13} className="inline -mt-0.5 text-navy-600" /> shield icon next to a team
            member to manage their login and access.
          </p>
          <p className="text-navy-500">
            That&apos;s where you invite them by email to set up their own password, reset one, and choose which
            clients they can see.
          </p>
          <p className="mt-2 text-navy-500">
            Your own hourly rate and tag color are set from Settings &rarr; Profile instead — you&apos;re not listed
            here as a team member.
          </p>
        </InfoNote>
      </div>
    </div>
  );
}
