"use client";

import { useRef, useState, useTransition } from "react";
import { removeBusinessLogo, uploadBusinessLogo } from "@/app/(app)/settings/actions";
import { ALLOWED_LOGO_EXTENSIONS } from "@/lib/businessLogo";

export function BusinessLogoForm({ logoUrl }: { logoUrl: string | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-navy-100 bg-cream-50">
        {/* eslint-disable-next-line @next/next/no-img-element -- preview of an uploaded or default logo, dimensions unknown */}
        <img src={logoUrl ?? "/logo.png"} alt="Business logo" className="h-full w-full object-contain p-1.5" />
      </div>
      <div className="min-w-0 flex-1">
        <form
          ref={formRef}
          action={(formData) => {
            setError(null);
            const file = formData.get("file");
            if (!(file instanceof File) || file.size === 0) return;
            startTransition(async () => {
              try {
                await uploadBusinessLogo(formData);
                formRef.current?.reset();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Upload failed.");
              }
            });
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <label className="cursor-pointer rounded-lg bg-navy-100 px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-200">
            {pending ? "Uploading…" : "Upload logo"}
            <input
              type="file"
              name="file"
              accept={ALLOWED_LOGO_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
              disabled={pending}
              className="hidden"
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            />
          </label>
          {logoUrl && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await removeBusinessLogo();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Couldn't remove the logo.");
                  }
                });
              }}
              className="rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-600 hover:bg-navy-100 cursor-pointer disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </form>
        <p className="mt-1.5 text-xs text-navy-400">
          Shown top-right on every screen. PNG, JPG, SVG, or WebP · 5MB max.
          {!logoUrl && " Currently using the default logo."}
        </p>
        {error && <p className="mt-1 text-xs text-brick-600">{error}</p>}
      </div>
    </div>
  );
}
