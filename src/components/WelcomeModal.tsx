"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Palette, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { dismissOnboarding } from "@/app/(app)/settings/actions";

export function WelcomeModal({ ownerName, businessName }: { ownerName: string; businessName: string }) {
  const [open, setOpen] = useState(true);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Navigating via router.push only *after* the dismiss action resolves
  // (rather than a <Link>'s own navigation firing at the same time) avoids a
  // race with dismissOnboarding's revalidatePath — doing both at once could
  // leave the URL back on "/" instead of the destination.
  function dismiss(navigateTo?: string) {
    setOpen(false);
    startTransition(async () => {
      await dismissOnboarding();
      if (navigateTo) router.push(navigateTo);
    });
  }

  if (!open) return null;

  const firstName = ownerName.trim().split(/\s+/)[0] || ownerName;

  return (
    <Modal onClose={() => dismiss()} title="Welcome to Audax HQ">
      <div className="space-y-4">
        <p className="text-sm text-navy-600">
          Hi {firstName} — {businessName} is all set up and ready to go.
        </p>

        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-100/70 px-4 py-3.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-600">
            <Palette size={15} />
          </span>
          <div className="text-sm leading-snug">
            <p className="font-medium text-navy-900">Quick tip: make it yours first</p>
            <p className="mt-0.5 text-navy-600">
              Head to <span className="font-medium">Settings</span> to upload your logo and customize your
              work types, lead sources, and to-do types — so every tag and picklist matches how your business
              actually runs.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-navy-100 bg-cream-100/40 px-4 py-3.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-burnt-600">
            <Sparkles size={15} />
          </span>
          <div className="text-sm leading-snug text-navy-600">
            Once that&apos;s done, add your first client or lead and you&apos;re off — we sent a getting-started
            email to your inbox too, with a few more pointers.
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={() => dismiss("/settings")}>Go to Settings</Button>
          <Button variant="secondary" onClick={() => dismiss()}>
            Explore on my own
          </Button>
        </div>
      </div>
    </Modal>
  );
}
