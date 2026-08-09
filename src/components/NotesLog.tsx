"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Check, Pencil, X } from "lucide-react";
import { formatDate } from "@/lib/format";
import { MentionTextarea } from "@/components/MentionTextarea";
import { parseMentionSegments, type MentionOption } from "@/lib/mentions";
import { addClientNote, updateClientNote } from "@/app/(app)/clients/actions";
import { addLeadNote, updateLeadNote } from "@/app/(app)/leads/actions";
import { addPartnerNote, updatePartnerNote } from "@/app/(app)/partners/actions";

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

function NoteItem({
  note,
  mentionables,
  updateAction,
}: {
  note: Note;
  mentionables: MentionOption[];
  updateAction: (noteId: string, formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="border-l-2 border-burnt-200 pl-4">
        <p className="text-xs font-medium text-navy-400 mb-1">
          {note.authorName ?? "Owner"} · {formatDate(note.createdAt)}
        </p>
        <form
          action={(formData) => {
            if (!String(formData.get("body") ?? "").trim()) return;
            startTransition(async () => {
              await updateAction(note.id, formData);
              setEditing(false);
            });
          }}
          className="flex flex-col gap-2"
        >
          <MentionTextarea name="body" mentionables={mentionables} defaultValue={note.body} />
          <div className="flex items-center gap-2 self-end">
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-cream-50 disabled:opacity-50 cursor-pointer"
            >
              <Check size={12} /> {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 cursor-pointer"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group border-l-2 border-burnt-200 pl-4">
      <div className="mb-1 flex items-center gap-1.5">
        <p className="text-xs font-medium text-navy-400">
          {note.authorName ?? "Owner"} · {formatDate(note.createdAt)}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-navy-300 opacity-0 transition-opacity hover:text-navy-600 group-hover:opacity-100 cursor-pointer"
          aria-label="Edit note"
        >
          <Pencil size={11} />
        </button>
      </div>
      <p className="text-sm text-navy-800 whitespace-pre-wrap">
        <NoteBody body={note.body} />
      </p>
    </li>
  );
}

export function NotesLog({
  notes,
  kind,
  entityId,
  mentionables,
}: {
  notes: Note[];
  kind: "client" | "lead" | "partner";
  entityId: string;
  /** Who this note's author can @mention — see mentionOptions in src/lib/mentions.ts. */
  mentionables: MentionOption[];
}) {
  const [, startTransition] = useTransition();
  // Bumping this remounts MentionTextarea after a successful submit, clearing
  // its internal state — a plain form.reset() can't reach into a controlled
  // child's own useState the way it could the old uncontrolled Textarea.
  const [formKey, setFormKey] = useState(0);
  const addAction =
    kind === "client" ? addClientNote.bind(null, entityId) : kind === "lead" ? addLeadNote.bind(null, entityId) : addPartnerNote.bind(null, entityId);
  const updateAction =
    kind === "client"
      ? updateClientNote.bind(null, entityId)
      : kind === "lead"
        ? updateLeadNote.bind(null, entityId)
        : updatePartnerNote.bind(null, entityId);

  return (
    <div>
      <form
        action={(formData) => {
          // MentionTextarea's editor is a contentEditable div, not a native
          // form field with `required` — replicate the "don't submit an
          // empty note" behavior the old Textarea got for free.
          if (!String(formData.get("body") ?? "").trim()) return;
          startTransition(() => addAction(formData));
          setFormKey((k) => k + 1);
        }}
        className="flex flex-col gap-2 mb-5"
      >
        <MentionTextarea
          key={formKey}
          name="body"
          placeholder="Log an update — a call, an email, a decision… Type @ to mention someone."
          mentionables={mentionables}
        />
        <SubmitButton />
      </form>
      {notes.length === 0 ? (
        <p className="text-sm text-navy-400">No notes yet.</p>
      ) : (
        <ol className="space-y-4">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} mentionables={mentionables} updateAction={updateAction} />
          ))}
        </ol>
      )}
    </div>
  );
}
