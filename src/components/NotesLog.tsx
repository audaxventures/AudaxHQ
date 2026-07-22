"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { formatDate } from "@/lib/format";
import { MentionTextarea } from "@/components/MentionTextarea";
import { parseMentionSegments, type MentionOption } from "@/lib/mentions";
import { addClientNote } from "@/app/(app)/clients/actions";
import { addLeadNote } from "@/app/(app)/leads/actions";

interface Note {
  id: string;
  body: string;
  createdAt: string;
  authorName: string | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-end rounded-lg bg-navy-900 px-3.5 py-1.5 text-sm font-medium text-cream-50 hover:bg-navy-800 disabled:opacity-50 cursor-pointer transition-colors"
    >
      {pending ? "Adding…" : "Add note"}
    </button>
  );
}

/** Renders a note body with @[Name](id) mention tokens highlighted as pills — plain text everywhere else. */
function NoteBody({ body }: { body: string }) {
  return (
    <>
      {parseMentionSegments(body).map((segment, i) =>
        segment.type === "mention" ? (
          <span key={i} className="rounded bg-burnt-100 px-1 py-0.5 font-medium text-burnt-700">
            @{segment.value}
          </span>
        ) : (
          <span key={i}>{segment.value}</span>
        )
      )}
    </>
  );
}

export function NotesLog({
  notes,
  kind,
  entityId,
  mentionables,
}: {
  notes: Note[];
  kind: "client" | "lead";
  entityId: string;
  /** Who this note's author can @mention — see mentionOptions in src/lib/mentions.ts. */
  mentionables: MentionOption[];
}) {
  const [, startTransition] = useTransition();
  // Bumping this remounts MentionTextarea after a successful submit, clearing
  // its internal state — a plain form.reset() can't reach into a controlled
  // child's own useState the way it could the old uncontrolled Textarea.
  const [formKey, setFormKey] = useState(0);
  const action = kind === "client" ? addClientNote.bind(null, entityId) : addLeadNote.bind(null, entityId);

  return (
    <div>
      <form
        action={(formData) => {
          startTransition(() => action(formData));
          setFormKey((k) => k + 1);
        }}
        className="flex flex-col gap-2 mb-5"
      >
        <MentionTextarea
          key={formKey}
          name="body"
          placeholder="Log an update — a call, an email, a decision… Type @ to mention someone."
          rows={2}
          required
          mentionables={mentionables}
        />
        <SubmitButton />
      </form>
      {notes.length === 0 ? (
        <p className="text-sm text-navy-400">No notes yet.</p>
      ) : (
        <ol className="space-y-4">
          {notes.map((note) => (
            <li key={note.id} className="border-l-2 border-burnt-200 pl-4">
              <p className="text-xs font-medium text-navy-400 mb-1">
                {note.authorName ?? "Owner"} · {formatDate(note.createdAt)}
              </p>
              <p className="text-sm text-navy-800 whitespace-pre-wrap">
                <NoteBody body={note.body} />
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
