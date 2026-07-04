"use client";

import { useRef, useState, useTransition } from "react";
import { Input, Label, Select, FieldGroup, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import type { TeamMember } from "@/lib/types";
import { FIXED_COST_CATEGORY_LABELS, FIXED_COST_CATEGORY_ORDER } from "@/lib/types";
import { createFixedCost, createTimeEntry } from "@/app/(app)/tracker/actions";

interface OwnerOption {
  id: string;
  companyName: string;
}

export function AddEntryForm({
  clients,
  leads,
  teamMembers,
}: {
  clients: OwnerOption[];
  leads: OwnerOption[];
  teamMembers: TeamMember[];
}) {
  const [entryType, setEntryType] = useState<"TIME" | "FIXED_COST">("TIME");
  const [teamMemberId, setTeamMemberId] = useState("");
  const [rate, setRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleTeamMemberChange(id: string) {
    setTeamMemberId(id);
    const tm = teamMembers.find((t) => t.id === id);
    if (tm) setRate(tm.defaultHourlyRate);
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            if (entryType === "TIME") {
              await createTimeEntry(formData);
            } else {
              await createFixedCost(formData);
            }
            formRef.current?.reset();
            setTeamMemberId("");
            setRate("");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save this entry.");
          }
        });
      }}
      className="space-y-3"
    >
      <div className="flex rounded-lg border border-navy-200 p-1">
        <button
          type="button"
          onClick={() => setEntryType("TIME")}
          className={cn(
            "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors cursor-pointer",
            entryType === "TIME" ? "bg-navy-900 text-cream-50" : "text-navy-600 hover:bg-navy-100"
          )}
        >
          Time entry
        </button>
        <button
          type="button"
          onClick={() => setEntryType("FIXED_COST")}
          className={cn(
            "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors cursor-pointer",
            entryType === "FIXED_COST" ? "bg-navy-900 text-cream-50" : "text-navy-600 hover:bg-navy-100"
          )}
        >
          Fixed cost
        </button>
      </div>

      <FieldGroup>
        <Label htmlFor="entry-owner">Client / Lead</Label>
        <Select id="entry-owner" name="owner" required defaultValue="">
          <option value="" disabled>
            Choose one…
          </option>
          {clients.length > 0 && (
            <optgroup label="Clients">
              {clients.map((c) => (
                <option key={c.id} value={`client:${c.id}`}>
                  {c.companyName}
                </option>
              ))}
            </optgroup>
          )}
          {leads.length > 0 && (
            <optgroup label="Leads">
              {leads.map((l) => (
                <option key={l.id} value={`lead:${l.id}`}>
                  {l.companyName}
                </option>
              ))}
            </optgroup>
          )}
        </Select>
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="entry-date">Date</Label>
        <Input id="entry-date" name="date" type="date" required />
      </FieldGroup>

      {entryType === "TIME" ? (
        <>
          <FieldGroup>
            <Label htmlFor="entry-team-member">Team member</Label>
            <Select
              id="entry-team-member"
              name="teamMemberId"
              required
              value={teamMemberId}
              onChange={(e) => handleTeamMemberChange(e.target.value)}
            >
              <option value="" disabled>
                Choose…
              </option>
              {teamMembers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup>
              <Label htmlFor="entry-hours">Hours</Label>
              <Input id="entry-hours" name="hours" type="number" step="0.25" min="0.25" required />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="entry-rate">Rate ($/hr)</Label>
              <Input
                id="entry-rate"
                name="rate"
                type="number"
                step="0.01"
                min="0"
                required
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </FieldGroup>
          </div>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" name="billable" defaultChecked className="rounded border-navy-300" />
            Billable
          </label>
          <FieldGroup>
            <Label htmlFor="entry-description">Description (optional)</Label>
            <Textarea id="entry-description" name="description" rows={2} placeholder="What was the work…" />
          </FieldGroup>
        </>
      ) : (
        <>
          <FieldGroup>
            <Label htmlFor="entry-fixed-description">Description</Label>
            <Input id="entry-fixed-description" name="description" required placeholder="Stock photo license…" />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="entry-amount">Amount ($)</Label>
            <Input id="entry-amount" name="amount" type="number" step="0.01" min="0" required />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="entry-category">Category (optional)</Label>
            <Select id="entry-category" name="category" defaultValue="">
              <option value="">—</option>
              {FIXED_COST_CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {FIXED_COST_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </>
      )}

      {error && <p className="text-xs text-brick-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-navy-900 px-3.5 py-2 text-sm font-medium text-cream-50 hover:bg-navy-800 cursor-pointer disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add entry"}
      </button>
    </form>
  );
}
