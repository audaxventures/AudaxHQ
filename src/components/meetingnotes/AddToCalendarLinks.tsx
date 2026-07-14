"use client";

import { CalendarPlus, Download } from "lucide-react";
import { buildGoogleCalendarUrl, buildIcsContent, type CalendarLinkInput } from "@/lib/calendarLinks";

export function AddToCalendarLinks({ meeting }: { meeting: CalendarLinkInput }) {
  function downloadIcs() {
    const blob = new Blob([buildIcsContent(meeting)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meeting.title.replace(/[^\w\-]+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-3 text-xs font-medium text-navy-500">
      <a
        href={buildGoogleCalendarUrl(meeting)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 hover:text-navy-800 hover:underline"
      >
        <CalendarPlus size={13} /> Google Calendar
      </a>
      <button
        type="button"
        onClick={downloadIcs}
        className="inline-flex cursor-pointer items-center gap-1 hover:text-navy-800 hover:underline"
      >
        <Download size={13} /> Download .ics
      </button>
    </div>
  );
}
