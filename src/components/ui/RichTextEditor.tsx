"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Bold, Italic, List, Underline } from "lucide-react";
import { cn } from "@/lib/cn";

const fieldBase = "w-full rounded-lg border border-navy-200 bg-cream-50 text-navy-900 transition-colors focus-within:border-burnt-400 focus-within:ring-2 focus-within:ring-burnt-100";

function ToolbarButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // Toolbar clicks must not steal focus from the editable area before the
      // command runs, or execCommand has nothing selected to act on.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md text-navy-500 hover:bg-navy-100 hover:text-navy-800 cursor-pointer"
    >
      <Icon size={14} />
    </button>
  );
}

/**
 * A minimal contentEditable rich-text field: bold/italic/underline/bullet
 * list only, backed by the legacy but still browser-supported
 * document.execCommand API. Serializes into a hidden `<input name>` so it
 * posts like any other field to a server action — the action re-sanitizes
 * the HTML before storage (see lib/richtext.ts) rather than trusting the
 * browser's execCommand output directly.
 */
export function RichTextEditor({
  id,
  name,
  defaultValue,
  placeholder,
  rows = 4,
}: {
  id?: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  function sync() {
    if (hiddenRef.current && editorRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
    }
  }

  function exec(command: string) {
    editorRef.current?.focus();
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false);
    sync();
  }

  return (
    <div className={fieldBase}>
      <div className="flex items-center gap-0.5 border-b border-navy-200 px-1.5 py-1">
        <ToolbarButton icon={Bold} label="Bold" onClick={() => exec("bold")} />
        <ToolbarButton icon={Italic} label="Italic" onClick={() => exec("italic")} />
        <ToolbarButton icon={Underline} label="Underline" onClick={() => exec("underline")} />
        <ToolbarButton icon={List} label="Bullet list" onClick={() => exec("insertUnorderedList")} />
      </div>
      <div
        ref={editorRef}
        id={id}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.5}rem` }}
        className={cn(
          "px-3 py-2 text-base sm:text-sm focus:outline-none",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-navy-400 empty:before:pointer-events-none"
        )}
        dangerouslySetInnerHTML={{ __html: defaultValue ?? "" }}
      />
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue ?? ""} />
    </div>
  );
}

/** Read-only render of sanitized rich text saved by RichTextEditor — safe to use with content that's already passed through lib/richtext.ts's sanitizer. */
export function RichTextView({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn("[&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
