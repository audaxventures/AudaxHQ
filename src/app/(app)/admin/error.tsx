"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";

// Scoped to the /admin segment so a crash here (e.g. a Stripe API hiccup in
// the revenue chart's data fetch) shows a recoverable fallback instead of
// taking down the whole app shell — the sidebar and nav around this stay
// intact since the error boundary only replaces this segment's content.
export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <AlertTriangle className="text-burnt-500" size={28} />
      <p className="font-heading text-lg text-navy-900">This page couldn&rsquo;t load</p>
      <p className="max-w-sm text-sm text-navy-500">
        Something went wrong loading the admin dashboard. This is often a temporary hiccup fetching platform data.
      </p>
      <div className="mt-2 flex gap-2">
        <Button onClick={() => unstable_retry()}>Try again</Button>
        <LinkButton href="/" variant="secondary">
          Back to dashboard
        </LinkButton>
      </div>
    </Card>
  );
}
