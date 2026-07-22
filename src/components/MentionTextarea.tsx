"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/Field";
import type { MentionOption } from "@/lib/mentions";

interface ActiveMention {
  /** Index of the triggering "@" in the textarea's value. */
  start: number;
  query: string;
}

/** Finds the @mention being typed right at the cursor, if any — bails once the trigger word hits whitespace or gets unreasonably long, so a stray "@" earlier in the note doesn't reopen the dropdown while typing something unrelated later on. */
function findActiveMention(value: string, cursor: number): ActiveMention | null {
  const upToCursor = value.slice(0, cursor);
  const at = upToCursor.lastIndexOf("@");
  if (at === -1) return null;
  const query = upToCursor.slice(at + 1);
  if (/\s/.test(query) || query.length > 40) return null;
  return { start: at, query };
}

/** A Textarea with lightweight @mention autocomplete — typing "@" filters `mentionables` by name, and picking one inserts an `@[Name](id)` token (parsed for both display and notification recipients by src/lib/mentions.ts). */
export function MentionTextarea({
  name,
  placeholder,
  rows = 2,
  required,
  mentionables,
}: {
  name: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  mentionables: MentionOption[];
}) {
  const [value, setValue] = useState("");
  const [active, setActive] = useState<ActiveMention | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = active
    ? mentionables.filter((m) => m.label.toLowerCase().includes(active.query.toLowerCase())).slice(0, 6)
    : [];

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    setValue(next);
    setActive(findActiveMention(next, e.target.selectionStart ?? next.length));
  }

  function selectMention(option: MentionOption) {
    if (!active || !textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart ?? value.length;
    const before = value.slice(0, active.start);
    const after = value.slice(cursor);
    const token = `@[${option.label}](${option.id}) `;
    const next = `${before}${token}${after}`;
    setValue(next);
    setActive(null);
    requestAnimationFrame(() => {
      const pos = before.length + token.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
      />
      {suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-navy-100 bg-white py-1 shadow-[0_12px_28px_-16px_rgba(16,29,51,0.4)]">
          {suggestions.map((option) => (
            <button
              key={option.id}
              type="button"
              onMouseDown={(e) => {
                // Prevents the textarea from blurring (and the dropdown from
                // closing via a change/blur handler) before the click registers.
                e.preventDefault();
                selectMention(option);
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-navy-700 hover:bg-cream-100"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
