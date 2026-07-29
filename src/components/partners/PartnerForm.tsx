"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Building2, User, Mail, Phone, ArrowRight } from "lucide-react";
import { Input, Label, Textarea, FieldGroup } from "@/components/ui/Field";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Button } from "@/components/ui/Button";
import type { Partner } from "@/lib/types";
import { createPartner, updatePartner } from "@/app/(app)/partners/actions";

function SubmitButton({ label, compact }: { label: string; compact: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={compact ? "sm" : "md"} disabled={pending}>
      {pending ? "Saving…" : label}
      {!pending && !compact && <ArrowRight size={16} />}
    </Button>
  );
}

export function PartnerForm({
  partner,
  submitLabel = "Save partner",
  cancelHref,
  variant = "full",
}: {
  partner?: Partner;
  submitLabel?: string;
  cancelHref?: string;
  /** "compact" drops the icons/uppercase labels/required-asterisks for the in-place edit panel on the partner detail page; "full" (default) is the fuller treatment used by the standalone New Partner page. */
  variant?: "full" | "compact";
}) {
  const action = partner?.id ? updatePartner.bind(null, partner.id) : createPartner;
  const compact = variant === "compact";
  const fieldIcon = (icon: typeof Building2) => (compact ? undefined : icon);

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
            defaultValue={partner?.companyName}
            placeholder="e.g. Northwind Consulting"
            icon={fieldIcon(Building2)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactName" compact={compact}>
            Contact name
          </Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={partner?.contactName ?? ""}
            placeholder="e.g. Jane Doe"
            icon={fieldIcon(User)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactEmail" compact={compact}>
            Email
          </Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={partner?.contactEmail ?? ""}
            placeholder="e.g. jane@northwind.com"
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
            defaultValue={partner?.contactPhone ?? ""}
            placeholder="e.g. (555) 555-5555"
            icon={fieldIcon(Phone)}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor="commissionTerms" compact={compact}>
            Commission / fee terms
          </Label>
          <Textarea
            id="commissionTerms"
            name="commissionTerms"
            rows={2}
            defaultValue={partner?.commissionTerms ?? ""}
            placeholder="e.g. 10% of first invoice, or a flat $500 per referral"
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor="notes" compact={compact}>
            Notes
          </Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={partner?.notes ?? ""}
            placeholder="Anything else worth remembering about this partnership…"
          />
        </FieldGroup>
        {!compact ? (
          <FieldGroup>
            <Label compact={compact}>Color</Label>
            <ColorPicker name="color" defaultValue={partner?.color} />
          </FieldGroup>
        ) : (
          // The detail page's own instant-save swatch (EntityColorPicker,
          // rendered in the page header) is the color control here — this
          // just round-trips the current value so an unrelated "Save
          // changes" click on this form doesn't wipe it back to null.
          <input type="hidden" name="color" value={partner?.color ?? ""} />
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
