"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Clock } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import type { Notification, RightNowItem } from "@/lib/types";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationBell({
  initialUnread,
  initialUnreadCount,
  rightNow,
}: {
  initialUnread: Notification[];
  initialUnreadCount: number;
  rightNow: RightNowItem[];
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleNotificationClick(id: string) {
    setUnread((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    startTransition(() => {
      void markNotificationRead(id);
    });
  }

  function handleMarkAllRead() {
    setUnread([]);
    setUnreadCount(0);
    startTransition(() => {
      void markAllNotificationsRead();
    });
  }

  const hasNothing = unread.length === 0 && rightNow.length === 0;

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex items-center justify-center rounded-full p-2 text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-800"
      >
        <Bell size={20} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-burnt-500 px-1 text-[10px] font-semibold text-cream-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-navy-100 bg-white shadow-[0_20px_40px_-24px_rgba(16,29,51,0.45)]">
          <div className="max-h-[28rem] overflow-y-auto p-2">
            {hasNothing && (
              <p className="px-3 py-6 text-center text-sm text-navy-400">You&rsquo;re all caught up.</p>
            )}

            {unread.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between px-2 pb-1 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Assigned to you</p>
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-burnt-600 hover:text-burnt-700"
                  >
                    Mark all read
                  </button>
                </div>
                {unread.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "/"}
                    onClick={() => handleNotificationClick(n.id)}
                    className="block rounded-xl px-3 py-2.5 text-sm text-navy-700 hover:bg-cream-100"
                  >
                    <p className="leading-snug">{n.message}</p>
                    <p className="mt-0.5 text-xs text-navy-400">{timeAgo(n.createdAt)}</p>
                  </Link>
                ))}
              </div>
            )}

            {rightNow.length > 0 && (
              <div>
                <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-navy-400">
                  Needs attention
                </p>
                {rightNow.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm text-navy-700 hover:bg-cream-100"
                  >
                    <Clock size={14} className={`mt-0.5 shrink-0 ${item.isOverdue ? "text-brick-500" : "text-navy-400"}`} />
                    <span className="leading-snug">
                      {item.label}
                      <span className={`ml-1.5 text-xs ${item.isOverdue ? "text-brick-500" : "text-navy-400"}`}>
                        {item.isOverdue ? "overdue" : "due today"}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
