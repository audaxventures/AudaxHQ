"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Folder, FolderPlus, Handshake, Inbox, Lock, MoreHorizontal, NotebookPen, Tag, Target } from "lucide-react";
import { cn } from "@/lib/cn";
import { createNoteFolder, deleteNoteFolder, renameNoteFolder } from "@/lib/actions/meetingnotes";
import { orderFolders } from "@/components/meetingnotes/NoteFields";
import type { NoteFolder } from "@/lib/types";

export type NotesView = "all" | "private" | "unfiled" | "clients" | "leads" | "partners";

interface Counts {
  views: Record<NotesView, number>;
  folders: Record<string, number>;
  tags: { name: string; count: number }[];
}

/** Builds a Notes-page URL: view/folder replace each other, tags and the search/owner filters carry over. */
function buildHref(current: Record<string, string | undefined>, changes: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...changes })) {
    if (v && k !== "note") params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/meeting-notes?${qs}` : "/meeting-notes";
}

function NavItem({
  href,
  active,
  icon: Icon,
  label,
  count,
  indent,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  count?: number;
  indent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("group flex items-center rounded-lg", active ? "bg-navy-900 text-cream-50" : "text-navy-700 hover:bg-navy-100/70")}>
      <Link href={href} className={cn("flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5 text-sm", indent && "pl-7")}>
        <Icon size={15} className={cn("shrink-0", active ? "text-cream-50" : "text-navy-400")} />
        <span className="truncate">{label}</span>
        {count !== undefined && (
          <span className={cn("ml-auto pl-2 text-xs tabular-nums", active ? "text-cream-100" : "text-navy-400")}>{count}</span>
        )}
      </Link>
      {children}
    </div>
  );
}

export function NotesSidebar({
  folders,
  counts,
  current,
  showPartners,
}: {
  folders: NoteFolder[];
  counts: Counts;
  /** The page's current query params. */
  current: Record<string, string | undefined>;
  showPartners: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState<{ parentId: string | null } | null>(null);
  const [newName, setNewName] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const activeView = (current.folder ? null : (current.view ?? "all")) as NotesView | null;
  const selectedTags = (current.tag ?? "").split(",").filter(Boolean);

  function submitNewFolder() {
    const name = newName.trim();
    const parentId = adding?.parentId ?? null;
    setAdding(null);
    setNewName("");
    if (!name) return;
    startTransition(async () => {
      const id = await createNoteFolder(name, parentId);
      if (id) router.push(buildHref(current, { folder: id, view: undefined }));
    });
  }

  function rename(folder: NoteFolder) {
    setMenuFor(null);
    const name = prompt("Rename folder", folder.name);
    if (!name || name.trim() === folder.name) return;
    startTransition(() => renameNoteFolder(folder.id, name));
  }

  function remove(folder: NoteFolder) {
    setMenuFor(null);
    const hasChildren = folders.some((f) => f.parentId === folder.id);
    const message = hasChildren
      ? `Delete "${folder.name}" and its subfolders? The notes inside won't be deleted — they'll just be taken out of the folder.`
      : `Delete "${folder.name}"? The notes inside won't be deleted — they'll just be taken out of the folder.`;
    if (!confirm(message)) return;
    startTransition(async () => {
      await deleteNoteFolder(folder.id);
      if (current.folder === folder.id || folders.some((f) => f.id === current.folder && f.parentId === folder.id)) {
        router.push(buildHref(current, { folder: undefined }));
      }
    });
  }

  function toggleTag(name: string) {
    const next = selectedTags.includes(name) ? selectedTags.filter((t) => t !== name) : [...selectedTags, name];
    return buildHref(current, { tag: next.join(",") || undefined });
  }

  const views: { key: NotesView; label: string; icon: typeof Inbox }[] = [
    { key: "all", label: "All notes", icon: NotebookPen },
    { key: "private", label: "Private", icon: Lock },
    { key: "unfiled", label: "Unfiled", icon: Inbox },
    { key: "clients", label: "Clients", icon: Building2 },
    { key: "leads", label: "Leads", icon: Target },
    ...(showPartners ? [{ key: "partners" as const, label: "Partners", icon: Handshake }] : []),
  ];

  const newFolderInput = (indent: boolean) => (
    <input
      autoFocus
      value={newName}
      onChange={(e) => setNewName(e.target.value)}
      onBlur={submitNewFolder}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitNewFolder();
        }
        if (e.key === "Escape") {
          setAdding(null);
          setNewName("");
        }
      }}
      maxLength={80}
      placeholder={indent ? "Subfolder name…" : "Folder name…"}
      className={cn(
        "mt-1 w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-900 outline-none focus:border-navy-400",
        indent && "ml-5 w-[calc(100%-1.25rem)]"
      )}
    />
  );

  return (
    <nav aria-label="Notes" className={cn("space-y-6", pending && "opacity-70")}>
      <div className="space-y-0.5">
        {views.map((v) => (
          <NavItem
            key={v.key}
            href={buildHref(current, { view: v.key === "all" ? undefined : v.key, folder: undefined })}
            active={activeView === v.key}
            icon={v.icon}
            label={v.label}
            count={counts.views[v.key]}
          />
        ))}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between px-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Folders</p>
          <button
            type="button"
            onClick={() => setAdding({ parentId: null })}
            className="cursor-pointer rounded p-1 text-navy-400 hover:bg-navy-100 hover:text-navy-700"
            aria-label="New folder"
            title="New folder"
          >
            <FolderPlus size={15} />
          </button>
        </div>
        <div className="space-y-0.5">
          {orderFolders(folders).map(({ folder, depth }) => (
            <div key={folder.id}>
              <NavItem
                href={buildHref(current, { folder: folder.id, view: undefined })}
                active={current.folder === folder.id}
                icon={Folder}
                label={folder.name}
                count={counts.folders[folder.id] ?? 0}
                indent={depth === 1}
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuFor(menuFor === folder.id ? null : folder.id)}
                    className="mr-1 cursor-pointer rounded p-1 opacity-60 hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-60 lg:focus:opacity-100"
                    aria-label={`Options for ${folder.name}`}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {menuFor === folder.id && (
                    <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-navy-100 bg-white py-1 text-sm text-navy-700 shadow-lg">
                      {depth === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuFor(null);
                            setAdding({ parentId: folder.id });
                          }}
                          className="block w-full cursor-pointer px-3 py-1.5 text-left hover:bg-cream-100"
                        >
                          Add subfolder
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => rename(folder)}
                        className="block w-full cursor-pointer px-3 py-1.5 text-left hover:bg-cream-100"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(folder)}
                        className="block w-full cursor-pointer px-3 py-1.5 text-left text-brick-600 hover:bg-brick-100/50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </NavItem>
              {adding?.parentId === folder.id && newFolderInput(true)}
            </div>
          ))}
          {adding && adding.parentId === null && newFolderInput(false)}
          {folders.length === 0 && !adding && (
            <button
              type="button"
              onClick={() => setAdding({ parentId: null })}
              className="w-full cursor-pointer rounded-lg border border-dashed border-navy-200 px-2.5 py-2 text-left text-xs text-navy-400 hover:border-navy-400 hover:text-navy-600"
            >
              + Create a folder, e.g. &ldquo;Boards&rdquo;
            </button>
          )}
        </div>
      </div>

      {counts.tags.length > 0 && (
        <div>
          <p className="mb-2 px-2.5 text-xs font-semibold uppercase tracking-wide text-navy-400">Tags</p>
          <div className="flex flex-wrap gap-1.5 px-1">
            {counts.tags.map((t) => {
              const active = selectedTags.includes(t.name);
              return (
                <Link
                  key={t.name}
                  href={toggleTag(t.name)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                    active
                      ? "border-navy-900 bg-navy-900 text-cream-50"
                      : "border-navy-200 text-navy-600 hover:border-navy-400"
                  )}
                >
                  <Tag size={11} />
                  {t.name}
                  <span className={active ? "text-cream-100" : "text-navy-400"}>{t.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
