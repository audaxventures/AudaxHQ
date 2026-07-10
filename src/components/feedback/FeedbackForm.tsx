"use client";

import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { submitFeedback } from "@/app/(app)/feedback/actions";

export function FeedbackForm() {
  const [pending, startTransition] = useTransition();
  const [justSent, setJustSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setJustSent(false);
        startTransition(async () => {
          await submitFeedback(formData);
          formRef.current?.reset();
          setJustSent(true);
        });
      }}
      className="space-y-3"
    >
      <Textarea
        name="message"
        required
        rows={4}
        placeholder="What's working, what's not, or what would make this more useful for you?"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending} className="gap-1.5">
          <Send size={14} />
          {pending ? "Sending…" : "Send feedback"}
        </Button>
        {justSent && !pending && <p className="text-sm text-sage-600">Thanks — we got it.</p>}
      </div>
    </form>
  );
}
