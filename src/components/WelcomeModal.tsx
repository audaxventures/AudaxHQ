"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Settings2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { dismissOnboarding } from "@/app/(app)/settings/actions";

const ACCENT_DASHES = [
  "-top-2 -right-4 h-1.5 w-6 rotate-12 bg-burnt-400",
  "-bottom-1 -left-4 h-1.5 w-4 -rotate-45 bg-blue-500",
  "top-1/2 -right-6 h-1.5 w-3 rotate-45 bg-sage-500",
];

export function WelcomeModal({ ownerName, businessName }: { ownerName: string; businessName: string }) {
  const [open, setOpen] = useState(true);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={() => dismiss()} aria-hidden />
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:flex-row">
        <button
          type="button"
          onClick={() => dismiss()}
          className="absolute right-4 top-4 z-10 text-navy-400 transition-colors hover:text-navy-700 cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Decorative panel — hidden on small screens to keep the essentials front and center. */}
        <div className="hidden shrink-0 flex-col justify-between bg-gradient-to-br from-cream-100 via-cream-50 to-blue-100/40 p-8 md:flex md:w-[300px] lg:w-[340px]">
          <div>
            <div className="relative mb-5 h-11 w-11">
              {ACCENT_DASHES.map((cls) => (
                <span key={cls} className={cn("absolute rounded-full", cls)} />
              ))}
              {/* eslint-disable-next-line @next/next/no-img-element -- small static brand mark, no need for next/image here */}
              <img src="/favicon.png" alt="" className="relative h-11 w-11" />
            </div>
            <h2 className="font-heading text-3xl font-semibold leading-tight text-navy-900">
              Welcome to
              <br />
              Verclara
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-navy-500">
              Your business operating system is all set up and ready to go.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- static illustrative screenshot, not a real image asset needing optimization */}
          <img
            src="/demodashboardweb.png"
            alt=""
            className="mt-8 w-full -rotate-1 rounded-xl shadow-lg ring-1 ring-navy-900/5"
          />
        </div>

        {/* Content panel */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-8">
          <p className="pr-6 text-base text-navy-600">
            Hi <span className="font-medium text-navy-900">{firstName}</span> — {businessName} is all set up and
            ready to go.
          </p>

          <div className="flex items-start gap-3.5 rounded-2xl bg-slate-100/70 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-600">
              <Settings2 size={16} />
            </span>
            <div className="text-sm leading-snug">
              <p className="font-heading text-base font-medium text-navy-900">1. Make it yours</p>
              <p className="mt-1 text-navy-600">
                Head to <span className="font-medium text-navy-800">Settings</span> to upload your logo and
                customize your work types, lead sources, and to-do types — so every tag and checklist matches how
                your business actually runs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl bg-burnt-100/60 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-burnt-600">
              <Sparkles size={16} />
            </span>
            <div className="text-sm leading-snug">
              <p className="font-heading text-base font-medium text-navy-900">2. Add your first client or lead</p>
              <p className="mt-1 text-navy-600">
                Once that&apos;s done, add your first client or lead and you&apos;re off — we sent a{" "}
                <span className="font-medium text-burnt-600">getting-started email</span> to your inbox too, with a
                few more pointers.
              </p>
            </div>
          </div>

          <div className="mt-1 flex flex-wrap gap-2">
            <Button onClick={() => dismiss("/settings")}>
              Go to Settings <ArrowRight size={16} />
            </Button>
            <Button variant="secondary" onClick={() => dismiss()}>
              Explore on my own
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
