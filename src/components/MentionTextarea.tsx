"use client";

import { useRef, useState } from "react";
import type { MentionOption } from "@/lib/mentions";

const EDITOR_CLASS =
  "w-full min-h-[4.5rem] rounded-lg border border-navy-200 bg-cream-50 px-3 py-2 text-base sm:text-sm text-navy-900 whitespace-pre-wrap break-words transition-colors focus:outline-none focus:border-burnt-400 focus:ring-2 focus:ring-burnt-100 empty:before:content-[attr(data-placeholder)] empty:before:text-navy-400 empty:before:pointer-events-none";

const CHIP_CLASS = "rounded bg-burnt-100 px-1 py-0.5 text-sm font-medium text-burnt-700";

/** Reads the plain-text-with-tokens representation the server expects out of the editable div's DOM — mention chips become `@[Name](id)`, block-level line breaks become "\n". */
function serialize(root: HTMLElement): string {
  let out = "";
  function walk(node: ChildNode, isLineStart: boolean) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    if (el.dataset.mentionId) {
      out += `@[${el.dataset.mentionName}](${el.dataset.mentionId})`;
      return;
    }
    if (el.tagName === "BR") {
      out += "\n";
      return;
    }
    if (el.tagName === "DIV" && isLineStart) out += "\n";
    Array.from(el.childNodes).forEach((child) => walk(child, false));
  }
  Array.from(root.childNodes).forEach((child, i) => walk(child, i > 0));
  return out;
}

function makeRange(node: Node, start: number, end: number): Range {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  return range;
}

/** Finds the @mention being typed right at the cursor, if any, and a Range covering just the "@query" text so a selected suggestion can replace it directly. Bails once the trigger word hits whitespace or gets unreasonably long, so a stray "@" earlier in the note doesn't reopen the dropdown later on. */
function findActiveMention(): { range: Range; query: string } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!range.collapsed || range.startContainer.nodeType !== Node.TEXT_NODE) return null;
  const text = range.startContainer.textContent ?? "";
  const upToCursor = text.slice(0, range.startOffset);
  const at = upToCursor.lastIndexOf("@");
  if (at === -1) return null;
  const query = upToCursor.slice(at + 1);
  if (/\s/.test(query) || query.length > 40) return null;
  return { range: makeRange(range.startContainer, at, range.startOffset), query };
}

/**
 * A note-composer with lightweight @mention autocomplete. Uses a
 * contentEditable div (not a plain textarea) so a selected mention renders
 * as an inline, non-editable "@Name" chip — the underlying `@[Name](id)`
 * token (parsed for both display and notification recipients by
 * src/lib/mentions.ts) only ever exists in a hidden `name`-carrying input,
 * never visible to the person typing.
 */
export function MentionTextarea({
  name,
  placeholder,
  mentionables,
}: {
  name: string;
  placeholder?: string;
  mentionables: MentionOption[];
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const activeRangeRef = useRef<Range | null>(null);
  const [query, setQuery] = useState<string | null>(null);

  const suggestions =
    query !== null ? mentionables.filter((m) => m.label.toLowerCase().includes(query.toLowerCase())).slice(0, 6) : [];

  function syncHiddenInput() {
    if (editorRef.current && hiddenInputRef.current) {
      hiddenInputRef.current.value = serialize(editorRef.current);
    }
  }

  function handleInput() {
    syncHiddenInput();
    const active = findActiveMention();
    activeRangeRef.current = active?.range ?? null;
    setQuery(active?.query ?? null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (query !== null && suggestions.length > 0 && (e.key === "Enter" || e.key === "Tab")) {
      e.preventDefault();
      selectMention(suggestions[0]);
    } else if (e.key === "Escape") {
      setQuery(null);
      activeRangeRef.current = null;
    }
  }

  function selectMention(option: MentionOption) {
    const range = activeRangeRef.current;
    if (!range) return;
    range.deleteContents();

    const chip = document.createElement("span");
    chip.contentEditable = "false";
    chip.dataset.mentionId = option.id;
    chip.dataset.mentionName = option.label;
    chip.className = CHIP_CLASS;
    chip.textContent = `@${option.label}`;
    range.insertNode(chip);

    const space = document.createTextNode(" ");
    chip.after(space);
    const newRange = document.createRange();
    newRange.setStartAfter(space);
    newRange.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(newRange);

    activeRangeRef.current = null;
    setQuery(null);
    syncHiddenInput();
    editorRef.current?.focus();
  }

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={EDITOR_CLASS}
      />
      <input ref={hiddenInputRef} type="hidden" name={name} />
      {query !== null && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-navy-100 bg-white py-1 shadow-[0_12px_28px_-16px_rgba(16,29,51,0.4)]">
          {suggestions.map((option) => (
            <button
              key={option.id}
              type="button"
              onMouseDown={(e) => {
                // Prevents the editor from losing its selection (and the
                // dropdown from closing) before the click registers.
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
