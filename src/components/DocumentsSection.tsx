"use client";

import { useRef, useState, useTransition } from "react";
import { Download, File as FileIcon, FileSpreadsheet, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Field";
import type { Document } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { ALLOWED_DOCUMENT_EXTENSIONS, MAX_DOCUMENT_SIZE_BYTES, getFileExtension } from "@/lib/documents";
import { deleteDocument, getDocumentDownloadUrl, uploadDocument } from "@/lib/actions/documents";

type Owner = { clientId: string } | { leadId: string };

const EXTENSION_ICONS: Record<string, typeof FileIcon> = {
  png: ImageIcon,
  jpg: ImageIcon,
  jpeg: ImageIcon,
  gif: ImageIcon,
  webp: ImageIcon,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentRow({ owner, doc }: { owner: Owner; doc: Document }) {
  const [, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Icon = EXTENSION_ICONS[doc.fileType] ?? FileIcon;

  async function handleDownload() {
    setError(null);
    setDownloading(true);
    try {
      const url = await getDocumentDownloadUrl(doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not download this file.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-navy-100 px-3.5 py-2.5">
      <Icon size={16} className="shrink-0 text-navy-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-navy-900">{doc.label || doc.fileName}</p>
        <p className="mt-0.5 truncate text-xs text-navy-400">
          {doc.label && <>{doc.fileName} · </>}
          {formatDate(doc.createdAt)} · {formatFileSize(doc.fileSize)}
        </p>
        {error && <p className="mt-0.5 text-xs text-brick-600">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="p-1.5 text-navy-300 hover:text-navy-600 transition-colors cursor-pointer disabled:opacity-40"
          aria-label="Download document"
        >
          <Download size={14} />
        </button>
        <button
          type="button"
          onClick={() => startTransition(() => void deleteDocument(owner, doc.id))}
          className="p-1.5 text-navy-300 hover:text-brick-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
          aria-label="Delete document"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function UploadForm({ owner }: { owner: Owner }) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-burnt-600 hover:text-burnt-700 cursor-pointer"
      >
        <Plus size={15} /> Upload document
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        const file = formData.get("file");
        if (!(file instanceof File) || file.size === 0) {
          setError("Choose a file first.");
          return;
        }
        if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
          setError("File is too large (25MB max).");
          return;
        }
        if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(getFileExtension(file.name))) {
          setError("That file type isn't supported.");
          return;
        }
        startTransition(async () => {
          try {
            await uploadDocument(owner, formData);
            formRef.current?.reset();
            setExpanded(false);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Upload failed.");
          }
        });
      }}
      className="rounded-xl border border-dashed border-navy-200 p-4 space-y-3"
    >
      <input
        type="file"
        name="file"
        required
        accept={ALLOWED_DOCUMENT_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
        className="block w-full text-sm text-navy-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-navy-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-navy-700 hover:file:bg-navy-200"
      />
      <Input name="label" placeholder="Label (optional)" />
      {error && <p className="text-xs text-brick-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-navy-900 px-3.5 py-1.5 text-sm font-medium text-cream-50 hover:bg-navy-800 cursor-pointer disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            setError(null);
          }}
          className="rounded-lg border border-navy-200 px-3.5 py-1.5 text-sm font-medium text-navy-600 hover:bg-navy-100 cursor-pointer"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-navy-400">PDFs, images, and common docs · 25MB max</p>
    </form>
  );
}

export function DocumentsSection({ owner, documents }: { owner: Owner; documents: Document[] }) {
  return (
    <div>
      <div className="space-y-2 mb-4">
        {documents.length === 0 ? (
          <p className="text-sm text-navy-400">No documents yet.</p>
        ) : (
          documents.map((doc) => <DocumentRow key={doc.id} owner={owner} doc={doc} />)
        )}
      </div>
      <UploadForm owner={owner} />
    </div>
  );
}
