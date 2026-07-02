"use client";

import { useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { formatDate } from "@/lib/format";
import { Textarea } from "@/components/ui/Field";
import { addClientNote } from "@/app/(app)/clients/actions";
import { addLeadNote } from "@/app/(app)/leads/actions";

interface Note {
  id: string;
  body: string;
  createdAt: string;
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

export function NotesLog({
  notes,
  kind,
  entityId,
}: {
  notes: Note[];
  kind: "client" | "lead";
  entityId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  const action = kind === "client" ? addClientNote.bind(null, entityId) : addLeadNote.bind(null, entityId);

  return (
    <div>
      <form
        ref={formRef}
        action={(formData) => {
          startTransition(() => action(formData));
          formRef.current?.reset();
        }}
        className="flex flex-col gap-2 mb-5"
      >
        <Textarea
          name="body"
          placeholder="Log an update — a call, an email, a decision…"
          rows={2}
          required
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
                {formatDate(note.createdAt)}
              </p>
              <p className="text-sm text-navy-800 whitespace-pre-wrap">{note.body}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
