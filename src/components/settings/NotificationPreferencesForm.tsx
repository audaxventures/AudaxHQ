"use client";

import { useState, useTransition } from "react";
import { CheckSquare, Flag, AtSign, Sunrise } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateNotificationPreferences, sendTestDailyBrief } from "@/app/(app)/settings/actions";

interface Prefs {
  notifyTaskAssigned: boolean;
  notifyFollowUpAssigned: boolean;
  notifyMention: boolean;
  notifyDailyBrief: boolean;
}

const EVENTS: { key: keyof Prefs; icon: typeof CheckSquare; label: string; description: string }[] = [
  {
    key: "notifyTaskAssigned",
    icon: CheckSquare,
    label: "Assigned a task",
    description: "Email me when someone assigns a to-do to me.",
  },
  {
    key: "notifyFollowUpAssigned",
    icon: Flag,
    label: "Assigned a follow-up",
    description: "Email me when someone assigns a client or lead follow-up to me.",
  },
  {
    key: "notifyMention",
    icon: AtSign,
    label: "Mentioned in a note",
    description: "Email me when someone @mentions me in a note.",
  },
  {
    key: "notifyDailyBrief",
    icon: Sunrise,
    label: "Daily Brief",
    description: "A morning email with what's overdue, due today, and coming up next.",
  },
];

export function NotificationPreferencesForm({ email, prefs }: { email: string | null; prefs: Prefs }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState(prefs);

  return (
    <div className="max-w-lg">
      {!email && (
        <p className="mb-4 rounded-lg border border-gold-100 bg-gold-100/40 px-3.5 py-2.5 text-xs text-gold-600">
          You don&apos;t have an email on file yet, so these won&apos;t send until one&apos;s added in Profile.
        </p>
      )}
      <form
        action={(formData) => {
          setSaved(false);
          startTransition(async () => {
            await updateNotificationPreferences(formData);
            setSaved(true);
          });
        }}
        className="space-y-1"
      >
        {EVENTS.map(({ key, icon: Icon, label, description }) => (
          <label
            key={key}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy-100 p-4 transition-colors hover:bg-cream-100/60"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-600">
              <Icon size={16} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-navy-900">{label}</span>
              <span className="block text-xs text-navy-500">{description}</span>
            </span>
            <input
              type="checkbox"
              name={key}
              checked={values[key]}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.checked }))}
              className="mt-1 h-4 w-4 shrink-0 rounded-sm border-navy-300 text-burnt-600 focus:ring-burnt-500"
            />
          </label>
        ))}
        <div className="flex items-center gap-3 pt-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {saved && !pending && <p className="text-sm text-sage-600">Saved.</p>}
        </div>
      </form>
      <TestBriefButton disabled={!email} />
    </div>
  );
}

function TestBriefButton({ disabled }: { disabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  return (
    <div className="mt-6 border-t border-navy-100 pt-5">
      <p className="text-xs text-navy-500">See what the Daily Brief looks like before trusting it every morning.</p>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => {
          setSent(false);
          startTransition(async () => {
            await sendTestDailyBrief();
            setSent(true);
          });
        }}
        className="mt-2 rounded-lg border border-navy-200 px-3.5 py-1.5 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-100 disabled:opacity-40 cursor-pointer"
      >
        {pending ? "Sending…" : "Send me a test Daily Brief"}
      </button>
      {sent && !pending && <p className="mt-2 text-sm text-sage-600">Sent — check your inbox.</p>}
    </div>
  );
}
