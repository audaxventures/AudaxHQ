"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Folder, FolderPlus, MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { createNoteFolder, deleteNoteFolder, renameNoteFolder, setNoteFolderColor } from "@/lib/actions/meetingnotes";
import { orderFolders } from "@/components/meetingnotes/NoteFields";
import { FOLDER_COLORS, HUES, VIEW_HUES, folderHue, hueFor, type HueClasses } from "@/components/meetingnotes/noteColors";
import { ENTITY_COLOR_LABELS, type EntityColor } from "@/lib/types";
import { VIEW_META, notesHref, type NotesCounts, type NotesView } from "@/components/meetingnotes/notesNav";
import type { NoteFolder } from "@/lib/types";

function NavItem({
  href,
  active,
  icon: Icon,
  hue,
  label,
  count,
  indent,
  children,
}: {
  href: string;
  active: boolean;
  icon: LucideIcon;
  hue: HueClasses;
  label: string;
  count?: number;
  indent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative flex items-center rounded-lg transition-colors",
        active ? cn(hue.soft, "font-medium text-navy-900") : "text-navy-600 hover:bg-cream-100"
      )}
    >
      {active && <span className={cn("absolute inset-y-1.5 left-0 w-[3px] rounded-full", hue.solid)} />}
      <Link href={href} className={cn("flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pl-3 pr-2 text-sm", indent && "pl-8")}>
        <Icon size={16} className={cn("shrink-0", hue.text)} />
        <span className="truncate">{label}</span>
        {count !== undefined && (
          <span
            className={cn(
              "ml-auto rounded-full px-1.5 text-[11px] leading-5 tabular-nums",
              active ? "bg-white/80 text-navy-700" : "text-navy-400"
            )}
          >
            {count}
          </span>
        )}
      </Link>
      {children}
    </div>
  );
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center justify-between pl-3 pr-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-400">{children}</p>
      {action}
    </div>
  );
}

/** Folder list (with create/rename/delete) and tag chips — shared by the desktop sidebar and the mobile drawer. */
function NotesLibrary({
  folders,
  counts,
  current,
}: {
  folders: NoteFolder[];
  counts: NotesCounts;
  current: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState<{ parentId: string | null } | null>(null);
  const [newName, setNewName] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const selectedTags = (current.tag ?? "").split(",").filter(Boolean);

  function submitNewFolder() {
    const name = newName.trim();
    const parentId = adding?.parentId ?? null;
    setAdding(null);
    setNewName("");
    if (!name) return;
    startTransition(async () => {
      const id = await createNoteFolder(name, parentId);
      if (id) router.push(notesHref(current, { folder: id, view: undefined }));
    });
  }

  function rename(folder: NoteFolder) {
    setMenuFor(null);
    const name = prompt("Rename folder", folder.name);
    if (!name || name.trim() === folder.name) return;
    startTransition(() => renameNoteFolder(folder.id, name));
  }

  function recolor(folder: NoteFolder, color: EntityColor | null) {
    setMenuFor(null);
    startTransition(() => setNoteFolderColor(folder.id, color));
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
        router.push(notesHref(current, { folder: undefined }));
      }
    });
  }

  function toggleTag(name: string) {
    const next = selectedTags.includes(name) ? selectedTags.filter((t) => t !== name) : [...selectedTags, name];
    return notesHref(current, { tag: next.join(",") || undefined });
  }

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
    <div className={cn("space-y-6", pending && "opacity-70")}>
      <div>
        <SectionLabel
          action={
            <button
              type="button"
              onClick={() => setAdding({ parentId: null })}
              className="cursor-pointer rounded-md p-1 text-navy-400 transition-colors hover:bg-cream-100 hover:text-burnt-600"
              aria-label="New folder"
              title="New folder"
            >
              <FolderPlus size={15} />
            </button>
          }
        >
          Folders
        </SectionLabel>
        <div className="space-y-0.5">
          {orderFolders(folders).map(({ folder, depth }) => (
            <div key={folder.id}>
              <NavItem
                href={notesHref(current, { folder: folder.id, view: undefined })}
                active={current.folder === folder.id}
                icon={Folder}
                hue={folderHue(folder)}
                label={folder.name}
                count={counts.folders[folder.id] ?? 0}
                indent={depth === 1}
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuFor(menuFor === folder.id ? null : folder.id)}
                    className="mr-1 cursor-pointer rounded p-1 text-navy-400 opacity-70 hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-70 lg:focus:opacity-100"
                    aria-label={`Options for ${folder.name}`}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {menuFor === folder.id && (
                    <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-navy-100 bg-white py-1 text-sm text-navy-700 shadow-lg">
                      <div className="border-b border-navy-100 px-3 pb-2.5 pt-1.5">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-400">Colour</p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => recolor(folder, null)}
                            title="Automatic"
                            aria-label="Automatic colour"
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-dashed border-navy-300 bg-cream-50 text-navy-500"
                          >
                            {!folder.color && <Check size={12} />}
                          </button>
                          {FOLDER_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => recolor(folder, c)}
                              title={ENTITY_COLOR_LABELS[c]}
                              aria-label={ENTITY_COLOR_LABELS[c]}
                              className={cn(
                                "flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-white transition-transform hover:scale-110",
                                HUES[c].solid
                              )}
                            >
                              {folder.color === c && <Check size={12} strokeWidth={3} />}
                            </button>
                          ))}
                        </div>
                      </div>
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
              className="w-full cursor-pointer rounded-lg border border-dashed border-burnt-200 bg-burnt-100/30 px-3 py-2.5 text-left text-xs text-burnt-600 transition-colors hover:border-burnt-300 hover:bg-burnt-100/60"
            >
              + Create a folder, e.g. &ldquo;Boards&rdquo;
            </button>
          )}
        </div>
      </div>

      {counts.tags.length > 0 && (
        <div>
          <SectionLabel>Tags</SectionLabel>
          <div className="flex flex-wrap gap-1.5 px-2">
            {counts.tags.map((t) => {
              const active = selectedTags.includes(t.name);
              const hue = hueFor(t.name);
              return (
                <Link
                  key={t.name}
                  href={toggleTag(t.name)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all",
                    hue.chip,
                    active ? "ring-2 ring-current ring-offset-1 ring-offset-white font-medium" : "opacity-80 hover:opacity-100"
                  )}
                >
                  #{t.name}
                  <span className="opacity-60">{t.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function visibleViews(showPartners: boolean): NotesView[] {
  return ["all", "private", "unfiled", "clients", "leads", ...(showPartners ? (["partners"] as const) : [])];
}

/** Desktop sidebar: views, folders, tags. */
export function NotesSidebar({
  folders,
  counts,
  current,
  activeView,
  showPartners,
}: {
  folders: NoteFolder[];
  counts: NotesCounts;
  current: Record<string, string | undefined>;
  /** Null while a folder is selected. */
  activeView: NotesView | null;
  showPartners: boolean;
}) {
  return (
    <nav aria-label="Notes" className="space-y-6">
      <div>
        <SectionLabel>Notes</SectionLabel>
        <div className="space-y-0.5">
          {visibleViews(showPartners).map((v) => (
            <NavItem
              key={v}
              href={notesHref(current, { view: v === "all" ? undefined : v, folder: undefined })}
              active={activeView === v}
              icon={VIEW_META[v].icon}
              hue={HUES[VIEW_HUES[v]]}
              label={VIEW_META[v].label}
              count={counts.views[v]}
            />
          ))}
        </div>
      </div>
      <NotesLibrary folders={folders} counts={counts} current={current} />
    </nav>
  );
}

/** Mobile: views as a swipeable pill row, folders + tags folded into a panel. */
export function NotesMobileNav({
  folders,
  counts,
  current,
  activeView,
  showPartners,
  activeFolderName,
  activeFolderColorClass,
}: {
  folders: NoteFolder[];
  counts: NotesCounts;
  current: Record<string, string | undefined>;
  activeView: NotesView | null;
  showPartners: boolean;
  activeFolderName: string | null;
  /** Text colour class for the open folder's icon. */
  activeFolderColorClass?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {visibleViews(showPartners).map((v) => {
          const hue = HUES[VIEW_HUES[v]];
          const Icon = VIEW_META[v].icon;
          const active = activeView === v;
          return (
            <Link
              key={v}
              href={notesHref(current, { view: v === "all" ? undefined : v, folder: undefined })}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                active ? cn(hue.chip, "border-transparent font-medium") : "border-navy-200 bg-white text-navy-600"
              )}
            >
              <Icon size={14} className={hue.text} />
              {VIEW_META[v].label}
              <span className="text-xs opacity-60">{counts.views[v]}</span>
            </Link>
          );
        })}
      </div>
      <div className="rounded-xl border border-navy-100 bg-white">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-navy-700"
          aria-expanded={open}
        >
          <Folder size={15} className={activeFolderColorClass ?? "text-navy-400"} />
          <span className="font-medium">{activeFolderName ?? "Folders & tags"}</span>
          <ChevronDown size={15} className={cn("ml-auto text-navy-400 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="border-t border-navy-100 px-2 py-3">
            <NotesLibrary folders={folders} counts={counts} current={current} />
          </div>
        )}
      </div>
    </div>
  );
}
