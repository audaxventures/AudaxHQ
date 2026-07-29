"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Building2, User, UserCheck, Mail, Phone, Target, DollarSign, List, Megaphone, ArrowRight, Handshake } from "lucide-react";
import { Input, Label, Select, FieldGroup } from "@/components/ui/Field";
import { SelectWithOther } from "@/components/ui/SelectWithOther";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Button } from "@/components/ui/Button";
import type { Lead, LeadSource, Partner, TeamMember, WorkType } from "@/lib/types";
import { createLead, updateLead } from "@/app/(app)/leads/actions";

function SubmitButton({ label, compact }: { label: string; compact: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={compact ? "sm" : "md"} disabled={pending}>
      {pending ? "Saving…" : label}
      {!pending && !compact && <ArrowRight size={16} />}
    </Button>
  );
}

export function LeadForm({
  lead,
  workTypes,
  leadSources,
  teamMembers,
  partners = [],
  submitLabel = "Save lead",
  cancelHref,
  variant = "full",
}: {
  lead?: Lead;
  workTypes: WorkType[];
  leadSources: LeadSource[];
  teamMembers: TeamMember[];
  /** Active referral partners this lead can be tagged as coming from — omitted (or empty) hides the field entirely. */
  partners?: Partner[];
  submitLabel?: string;
  cancelHref?: string;
  /** "compact" drops the icons/uppercase labels/required-asterisks for the in-place edit panel on the lead detail page; "full" (default) is the fuller treatment used by the standalone New Lead page. */
  variant?: "full" | "compact";
}) {
  const action = lead?.id ? updateLead.bind(null, lead.id) : createLead;
  const selectableWorkTypes = workTypes.filter((w) => w.active || w.id === lead?.workTypeId);
  const workTypeOptions = selectableWorkTypes.map((w) => ({ value: w.id, label: w.name }));
  const fallbackWorkTypeId = selectableWorkTypes.find((w) => w.isFallback)?.id;
  const selectableSources = leadSources.filter((s) => s.active || s.id === lead?.sourceId);
  const sourceOptions = selectableSources.map((s) => ({ value: s.id, label: s.name }));
  const fallbackSourceId = selectableSources.find((s) => s.isFallback)?.id;
  const selectableTeamMembers = teamMembers.filter((t) => t.active || t.id === lead?.leadOwnerTeamMemberId);
  const selectablePartners = partners.filter((p) => p.active || p.id === lead?.referredByPartnerId);
  const compact = variant === "compact";
  const fieldIcon = (icon: LucideIcon) => (compact ? undefined : icon);

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label htmlFor="companyName" required={!compact} compact={compact}>
            Company name
          </Label>
          <Input
            id="companyName"
            name="companyName"
            required
            defaultValue={lead?.companyName}
            placeholder="e.g. Acme Inc."
            icon={fieldIcon(Building2)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactName" required={!compact} compact={compact}>
            Contact name
          </Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={lead?.contactName ?? ""}
            placeholder="e.g. Jane Doe"
            icon={fieldIcon(User)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactEmail" required={!compact} compact={compact}>
            Email
          </Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={lead?.contactEmail ?? ""}
            placeholder="e.g. jane@acme.com"
            icon={fieldIcon(Mail)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactPhone" compact={compact}>
            Phone
          </Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            defaultValue={lead?.contactPhone ?? ""}
            placeholder="e.g. (555) 555-5555"
            icon={fieldIcon(Phone)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="status" required={!compact} compact={compact}>
            Status
          </Label>
          <Select id="status" name="status" defaultValue={lead?.status ?? "NEW"} icon={fieldIcon(Target)}>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="PROPOSAL_SENT">Proposal sent</option>
            <option value="NEGOTIATING">Negotiating</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="estimatedValue" compact={compact}>
            Estimated value ($)
          </Label>
          <Input
            id="estimatedValue"
            name="estimatedValue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={lead?.estimatedValue ?? ""}
            placeholder="e.g. 0.00"
            icon={fieldIcon(DollarSign)}
          />
        </FieldGroup>
        <SelectWithOther
          label="Work type / service interested in"
          name="workTypeId"
          otherName="workTypeOther"
          options={workTypeOptions}
          defaultValue={lead?.workTypeId}
          defaultOtherValue={lead?.workTypeOther}
          otherValue={fallbackWorkTypeId}
          icon={fieldIcon(List)}
          compact={compact}
        />
        <SelectWithOther
          label="Lead source"
          name="sourceId"
          otherName="sourceOther"
          options={sourceOptions}
          defaultValue={lead?.sourceId}
          defaultOtherValue={lead?.sourceOther}
          otherValue={fallbackSourceId}
          icon={fieldIcon(Megaphone)}
          compact={compact}
        />
        <FieldGroup>
          <Label htmlFor="leadOwnerTeamMemberId" compact={compact}>
            Lead owner
          </Label>
          <Select
            id="leadOwnerTeamMemberId"
            name="leadOwnerTeamMemberId"
            defaultValue={lead?.leadOwnerTeamMemberId ?? ""}
            icon={fieldIcon(UserCheck)}
          >
            <option value="">Unassigned</option>
            {selectableTeamMembers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
        {partners.length > 0 && (
          <FieldGroup>
            <Label htmlFor="referredByPartnerId" compact={compact}>
              Referred by
            </Label>
            <Select
              id="referredByPartnerId"
              name="referredByPartnerId"
              defaultValue={lead?.referredByPartnerId ?? ""}
              icon={fieldIcon(Handshake)}
            >
              <option value="">Not a referral</option>
              {selectablePartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.companyName}
                </option>
              ))}
            </Select>
          </FieldGroup>
        )}
        {!compact ? (
          <FieldGroup>
            <Label compact={compact}>Color</Label>
            <ColorPicker name="color" defaultValue={lead?.color} />
          </FieldGroup>
        ) : (
          // The detail page's own instant-save swatch (EntityColorPicker,
          // rendered in the page header) is the color control here — this
          // just round-trips the current value so an unrelated "Save
          // changes" click on this form doesn't wipe it back to null.
          <input type="hidden" name="color" value={lead?.color ?? ""} />
        )}
      </div>
      {compact ? (
        <SubmitButton label={submitLabel} compact />
      ) : (
        <div className="flex items-center justify-between border-t border-navy-100 pt-5">
          {cancelHref ? (
            <Link
              href={cancelHref}
              className="text-sm font-medium text-navy-500 transition-colors hover:text-navy-800"
            >
              Cancel
            </Link>
          ) : (
            <span />
          )}
          <SubmitButton label={submitLabel} compact={false} />
        </div>
      )}
    </form>
  );
}
