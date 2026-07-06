"use client";

import { useRef, useTransition } from "react";
import { ExternalLink, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Field";
import type { ClientLink } from "@/lib/types";
import { addClientLink, deleteClientLink } from "@/app/(app)/clients/actions";

export function ClientLinks({ clientId, links }: { clientId: string; links: ClientLink[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  return (
    <div>
      {links.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {links.map((link) => (
            <li key={link.id} className="group flex items-center gap-2 text-sm">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-burnt-600 hover:text-burnt-700 hover:underline underline-offset-2 truncate"
              >
                <ExternalLink size={13} className="shrink-0" />
                {link.label}
              </a>
              <button
                type="button"
                onClick={() =>
                  startTransition(() => {
                    void deleteClientLink(clientId, link.id);
                  })
                }
                className="opacity-0 group-hover:opacity-100 text-navy-300 hover:text-brick-600 transition-opacity cursor-pointer"
                aria-label="Remove link"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        ref={formRef}
        action={(formData) => {
          startTransition(() => {
            void addClientLink(clientId, formData);
          });
          formRef.current?.reset();
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <Input name="label" placeholder="Label" required className="sm:w-24" />
        <div className="flex items-center gap-2">
          <Input name="url" placeholder="https://…" required type="url" className="flex-1" />
          <button
            type="submit"
            className="flex shrink-0 items-center justify-center rounded-lg bg-navy-100 p-2 text-navy-600 hover:bg-navy-200 transition-colors cursor-pointer"
            aria-label="Add link"
          >
            <Plus size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
