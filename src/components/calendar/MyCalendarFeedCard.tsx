"use client";

import { useRef, useState, useTransition } from "react";
import { CalendarPlus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Field";
import type { CalendarFeed } from "@/lib/types";
import { addMyCalendarFeed, removeMyCalendarFeed, syncMyCalendarFeedNow } from "@/lib/actions/calendarFeeds";

/** Self-service — each person connects (and can only manage) their own calendar. Collapsed by default so it doesn't crowd the grid once set up. */
export function MyCalendarFeedCard({ feeds }: { feeds: CalendarFeed[] }) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(feeds.length === 0);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-900 cursor-pointer"
      >
        <CalendarPlus size={14} />
        {feeds.length === 0
          ? "Connect your calendar"
          : `Your calendar: ${feeds[0].label}${feeds.length > 1 ? ` +${feeds.length - 1} more` : ""}`}
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-navy-100 bg-cream-100/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-navy-900">Your connected calendar</p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs font-medium text-navy-400 hover:text-navy-600 cursor-pointer"
        >
          Close
        </button>
      </div>
      <p className="mb-3 text-xs text-navy-500">
        Paste your Google/Outlook/Apple calendar&apos;s &ldquo;secret address in iCal format&rdquo; so your busy time
        shows up here — read-only, nothing is written back to it. Only you can see and manage this.
      </p>

      {feeds.map((feed) => (
        <div key={feed.id} className="mb-2 flex items-start justify-between gap-2 rounded-lg border border-navy-100 bg-white p-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-navy-800">{feed.label}</p>
            <p className="text-xs text-navy-400">
              {feed.lastSyncError ? (
                <span className="text-brick-600">Couldn&apos;t sync: {feed.lastSyncError}</span>
              ) : feed.lastSyncedAt ? (
                `Synced ${new Date(feed.lastSyncedAt).toLocaleString()}`
              ) : (
                "Not synced yet"
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => startTransition(() => void syncMyCalendarFeedNow(feed.id))}
              className="p-1.5 text-navy-300 hover:text-navy-600 cursor-pointer"
              aria-label="Sync now"
              title="Sync now"
            >
              <RefreshCw size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Remove "${feed.label}"? Its events will disappear from the calendar.`)) {
                  startTransition(() => void removeMyCalendarFeed(feed.id));
                }
              }}
              className="p-1.5 text-navy-300 hover:text-brick-600 cursor-pointer"
              aria-label="Remove calendar"
              title="Remove"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}

      {adding ? (
        <form
          ref={formRef}
          action={(formData) => {
            startTransition(async () => {
              await addMyCalendarFeed(formData);
            });
            formRef.current?.reset();
            setAdding(false);
          }}
          className="space-y-2"
        >
          <Input name="label" placeholder="Label (e.g. Google Calendar)" />
          <Input name="feedUrl" type="url" placeholder="Secret address in iCal format" required />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-cream-50 cursor-pointer"
            >
              Connect
            </button>
            {feeds.length > 0 && (
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-navy-600 hover:text-navy-900 cursor-pointer"
        >
          <Plus size={12} /> Connect another calendar
        </button>
      )}
    </div>
  );
}
