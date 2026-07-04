import { Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

// Phase 1: a mailto: shortcut, pre-filled with the contact's address and a
// subject line. Kept as its own section (rather than a header button) so
// Phase 2 — composing and sending from within the app, with sent messages
// logged to the activity log — can slot in here without reshaping the page.
export function EmailSection({
  contactEmail,
  contactName,
  companyName,
}: {
  contactEmail: string | null;
  contactName: string | null;
  companyName: string;
}) {
  return (
    <Card className="p-6">
      <h3 className="font-heading text-lg font-medium text-navy-900 mb-1">Email</h3>
      {contactEmail ? (
        <>
          <p className="text-sm text-navy-500 mb-4 truncate">
            {contactName ? `${contactName} · ` : ""}
            {contactEmail}
          </p>
          <LinkButton
            href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Audax Ventures — ${companyName}`)}`}
            variant="primary"
            size="sm"
          >
            <Mail size={15} /> Send email
          </LinkButton>
        </>
      ) : (
        <p className="text-sm text-navy-400">
          Add a contact email above to send messages from here.
        </p>
      )}
    </Card>
  );
}
