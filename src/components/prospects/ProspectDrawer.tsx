"use client";

import { useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  Trash2,
  Building2,
  User,
  Mail,
  Phone,
  Briefcase,
  Factory,
  UserCheck,
  ArrowRight,
  PhoneCall,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Input, Label, Select, FieldGroup, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FollowUpsList } from "@/components/FollowUpsList";
import { formatDate, formatDateInput } from "@/lib/format";
import { PROSPECT_ACTIVITY_TYPE_LABELS, PROSPECT_STATUS_LABELS, PROSPECT_STATUS_ORDER } from "@/lib/types";
import type { ProspectActivityType, ProspectWithRelations, TeamMember } from "@/lib/types";
import {
  addProspectActivity,
  convertProspectToLead,
  createProspect,
  deleteProspect,
  updateProspect,
  updateProspectActivityDate,
} from "@/app/(app)/prospects/actions";

type AssignOption = { value: string; label: string };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full justify-center">
      {pending ? "Saving…" : label}
      {!pending && <ArrowRight size={16} />}
    </Button>
  );
}

function ActivityEntryRow({
  entry,
  prospectId,
}: {
  entry: ProspectWithRelations["activity"][number];
  prospectId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <li className="group rounded-lg border border-navy-100 bg-cream-100/40 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy-600">
          {PROSPECT_ACTIVITY_TYPE_LABELS[entry.type]}
        </span>
        {editing ? (
          <form
            action={(formData) => {
              startTransition(async () => {
                await updateProspectActivityDate(prospectId, entry.id, formData);
                setEditing(false);
              });
            }}
            className="flex items-center gap-1"
          >
            <input
              name="date"
              type="date"
              defaultValue={formatDateInput(entry.createdAt)}
              required
              className="rounded border border-navy-200 px-1.5 py-0.5 text-xs text-navy-700"
            />
            <button
              type="submit"
              disabled={pending}
              className="text-navy-400 hover:text-sage-600 cursor-pointer disabled:opacity-50"
              aria-label="Save date"
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-navy-400 hover:text-brick-600 cursor-pointer"
              aria-label="Cancel"
            >
              <X size={13} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-navy-400 hover:text-navy-700 cursor-pointer"
          >
            {formatDate(entry.createdAt)}
            <Pencil size={11} className="opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
      </div>
      <p className="mt-1.5 text-sm text-navy-800 whitespace-pre-wrap">{entry.body}</p>
      {entry.loggedByName && <p className="mt-1 text-xs text-navy-400">— {entry.loggedByName}</p>}
    </li>
  );
}

function ActivityLog({ prospectId, activity }: { prospectId: string; activity: ProspectWithRelations["activity"] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  const [type, setType] = useState<ProspectActivityType>("CALL");

  return (
    <div>
      <Label>Call / communication history</Label>
      {activity.length === 0 ? (
        <p className="mb-3 text-sm text-navy-400">Nothing logged yet.</p>
      ) : (
        <ul className="mb-3 max-h-56 space-y-2 overflow-y-auto pr-1">
          {activity.map((entry) => (
            <ActivityEntryRow key={entry.id} entry={entry} prospectId={prospectId} />
          ))}
        </ul>
      )}
      <form
        ref={formRef}
        action={(formData) => {
          startTransition(async () => {
            await addProspectActivity(prospectId, formData);
            formRef.current?.reset();
            setType("CALL");
          });
        }}
        className="space-y-2"
      >
        <div className="flex gap-2">
          <Select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as ProspectActivityType)}
            icon={PhoneCall}
            className="w-36 shrink-0"
          >
            {(Object.keys(PROSPECT_ACTIVITY_TYPE_LABELS) as ProspectActivityType[]).map((t) => (
              <option key={t} value={t}>
                {PROSPECT_ACTIVITY_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Input name="body" placeholder="What happened…" required className="flex-1" />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-navy-100 px-3 py-1.5 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-200 cursor-pointer"
        >
          Log activity
        </button>
      </form>
    </div>
  );
}

export function ProspectDrawer({
  mode,
  prospect,
  teamMembers,
  assignOptions,
  currentAssigneeId,
  today,
  onClose,
}: {
  mode: "create" | "edit";
  prospect?: ProspectWithRelations;
  teamMembers: TeamMember[];
  /** Who a follow-up reminder on this prospect can be assigned to — "Me" plus whoever else is on the team. */
  assignOptions: AssignOption[];
  currentAssigneeId: string | null;
  today: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [converting, startConvertTransition] = useTransition();

  function handleDelete() {
    if (!prospect) return;
    if (!confirm(`Delete "${prospect.name}"? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteProspect(prospect.id);
      onClose();
    });
  }

  function handleConvert() {
    if (!prospect) return;
    if (!confirm(`Convert "${prospect.name}" to a lead? The prospect record stays around for history.`)) return;
    startConvertTransition(async () => {
      await convertProspectToLead(prospect.id);
    });
  }

  return (
    <Drawer
      title={mode === "edit" ? "Prospect" : "Add prospect"}
      description={mode === "edit" ? "Contact details, outreach history, and follow-ups." : "Someone worth reaching out to."}
      onClose={onClose}
    >
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              if (mode === "edit" && prospect) {
                await updateProspect(prospect.id, formData);
              } else {
                await createProspect(formData);
                onClose();
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not save this prospect.");
            }
          });
        }}
        className="space-y-4"
      >
        <FieldGroup>
          <Label htmlFor="prospect-name" required>
            Name
          </Label>
          <Input id="prospect-name" name="name" required defaultValue={prospect?.name} placeholder="e.g. Jane Doe" icon={User} />
        </FieldGroup>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldGroup>
            <Label htmlFor="prospect-email">Email</Label>
            <Input id="prospect-email" name="email" type="email" defaultValue={prospect?.email ?? ""} placeholder="jane@acme.com" icon={Mail} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="prospect-phone">Phone</Label>
            <Input id="prospect-phone" name="phone" defaultValue={prospect?.phone ?? ""} placeholder="(555) 555-5555" icon={Phone} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="prospect-business-name">Business name</Label>
            <Input id="prospect-business-name" name="businessName" defaultValue={prospect?.businessName ?? ""} placeholder="Acme Inc." icon={Building2} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="prospect-title">Title</Label>
            <Input id="prospect-title" name="title" defaultValue={prospect?.title ?? ""} placeholder="e.g. Operations Manager" icon={Briefcase} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="prospect-industry">Industry</Label>
            <Input id="prospect-industry" name="industry" defaultValue={prospect?.industry ?? ""} placeholder="e.g. Healthcare" icon={Factory} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="prospect-status">Status</Label>
            <Select id="prospect-status" name="status" defaultValue={prospect?.status ?? "NEW"}>
              {PROSPECT_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {PROSPECT_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>
        <FieldGroup>
          <Label htmlFor="prospect-owner">Owner</Label>
          <Select id="prospect-owner" name="ownerTeamMemberId" defaultValue={prospect?.ownerTeamMemberId ?? ""} icon={UserCheck}>
            <option value="">Unassigned</option>
            {teamMembers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="prospect-notes">Notes</Label>
          <Textarea id="prospect-notes" name="notes" rows={3} defaultValue={prospect?.notes ?? ""} placeholder="Anything worth remembering…" />
        </FieldGroup>

        {error && <p className="text-sm text-brick-600">{error}</p>}

        <SubmitButton label={mode === "edit" ? "Save changes" : "Add prospect"} />
      </form>

      {mode === "edit" && prospect && (
        <>
          <div className="mt-6 border-t border-navy-100 pt-5">
            <ActivityLog prospectId={prospect.id} activity={prospect.activity} />
          </div>

          <div className="mt-6 border-t border-navy-100 pt-5">
            <Label>Follow-up reminders</Label>
            <FollowUpsList
              owner={{ prospectId: prospect.id }}
              followUps={prospect.followUps}
              today={today}
              assignOptions={assignOptions}
              currentAssigneeId={currentAssigneeId}
            />
          </div>

          {prospect.status !== "CONVERTED" && (
            <div className="mt-6 border-t border-navy-100 pt-5">
              <Button type="button" variant="secondary" onClick={handleConvert} disabled={converting} className="w-full justify-center">
                {converting ? "Converting…" : "Convert to lead"}
              </Button>
            </div>
          )}
          {prospect.convertedLeadId && (
            <p className="mt-2 text-center text-xs text-navy-400">
              Converted {prospect.convertedAt ? formatDate(prospect.convertedAt) : ""}
            </p>
          )}

          <div className="mt-6 border-t border-navy-100 pt-5">
            <Button type="button" variant="danger" onClick={handleDelete} disabled={pending} className="w-full justify-center">
              <Trash2 size={16} /> Delete prospect
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
