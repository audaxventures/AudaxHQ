"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Building2, Calendar, User, List, Clock, DollarSign, FileText } from "lucide-react";
import { Input, Label, Select, FieldGroup, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";
import type { TeamMember, WorkCategory } from "@/lib/types";
import { FIXED_COST_CATEGORY_LABELS, FIXED_COST_CATEGORY_ORDER } from "@/lib/types";
import { createFixedCost, createTimeEntry } from "@/app/(app)/tracker/actions";

interface OwnerOption {
  id: string;
  companyName: string;
}

export function LogTimeEntryButton({
  clients,
  leads,
  teamMembers,
  workCategories,
}: {
  clients: OwnerOption[];
  leads: OwnerOption[];
  teamMembers: TeamMember[];
  workCategories: WorkCategory[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} /> Log time
      </Button>
      {open && (
        <LogTimeDrawer
          clients={clients}
          leads={leads}
          teamMembers={teamMembers}
          workCategories={workCategories}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function LogTimeDrawer({
  clients,
  leads,
  teamMembers,
  workCategories,
  onClose,
}: {
  clients: OwnerOption[];
  leads: OwnerOption[];
  teamMembers: TeamMember[];
  workCategories: WorkCategory[];
  onClose: () => void;
}) {
  const [entryType, setEntryType] = useState<"TIME" | "FIXED_COST">("TIME");
  const [teamMemberId, setTeamMemberId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rate, setRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleTeamMemberChange(id: string) {
    setTeamMemberId(id);
    const tm = teamMembers.find((t) => t.id === id);
    if (tm) setRate(tm.defaultHourlyRate);
  }

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    const category = workCategories.find((c) => c.id === id);
    if (category) setRate(category.defaultHourlyRate);
  }

  function resetForm() {
    formRef.current?.reset();
    setTeamMemberId("");
    setCategoryId("");
    setRate("");
  }

  return (
    <Drawer title="Log time entry" description="Add a new time or cost entry." onClose={onClose}>
      <form
        ref={formRef}
        action={(formData) => {
          setError(null);
          const keepOpen = formData.get("intent") === "continue";
          startTransition(async () => {
            try {
              if (entryType === "TIME") {
                await createTimeEntry(formData);
              } else {
                await createFixedCost(formData);
              }
              resetForm();
              if (!keepOpen) onClose();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not save this entry.");
            }
          });
        }}
        className="space-y-4"
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
          <Label htmlFor="entry-owner" required>
            Client / Lead
          </Label>
          <Select id="entry-owner" name="owner" required defaultValue="" icon={Building2}>
            <option value="" disabled>
              Select a client or lead
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

        {entryType === "TIME" ? (
          <>
            <FieldGroup>
              <Label htmlFor="entry-work-category" required>
                Category
              </Label>
              <Select
                id="entry-work-category"
                name="categoryId"
                required
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                icon={List}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {workCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="entry-team-member" required>
                Team member
              </Label>
              <Select
                id="entry-team-member"
                name="teamMemberId"
                required
                value={teamMemberId}
                onChange={(e) => handleTeamMemberChange(e.target.value)}
                icon={User}
              >
                <option value="" disabled>
                  Select team member
                </option>
                {teamMembers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="entry-date" required>
                Date
              </Label>
              <Input id="entry-date" name="date" type="date" required icon={Calendar} />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup>
                <Label htmlFor="entry-hours" required>
                  Hours
                </Label>
                <Input
                  id="entry-hours"
                  name="hours"
                  type="number"
                  step="0.25"
                  min="0.25"
                  required
                  placeholder="0.00"
                  icon={Clock}
                />
                <p className="text-xs text-navy-400">Use decimal (e.g. 1.5 for 1.5 hours)</p>
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="entry-rate" required>
                  Rate ($/hr)
                </Label>
                <Input
                  id="entry-rate"
                  name="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="0.00"
                  icon={DollarSign}
                />
              </FieldGroup>
            </div>
            <label className="flex items-center gap-2 text-sm text-navy-700">
              <input type="checkbox" name="billable" defaultChecked className="rounded border-navy-300" />
              Billable
            </label>
            <FieldGroup>
              <Label htmlFor="entry-description">Description (optional)</Label>
              <Textarea
                id="entry-description"
                name="description"
                rows={3}
                placeholder="Add context, decisions, or any relevant details…"
              />
            </FieldGroup>
          </>
        ) : (
          <>
            <FieldGroup>
              <Label htmlFor="entry-fixed-description" required>
                Description
              </Label>
              <Input
                id="entry-fixed-description"
                name="description"
                required
                placeholder="e.g. Stock photo license"
                icon={FileText}
              />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="entry-date-fixed" required>
                Date
              </Label>
              <Input id="entry-date-fixed" name="date" type="date" required icon={Calendar} />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="entry-amount" required>
                Amount ($)
              </Label>
              <Input
                id="entry-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                icon={DollarSign}
              />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="entry-category">Category (optional)</Label>
              <Select id="entry-category" name="category" defaultValue="" icon={List}>
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

        {error && <p className="text-sm text-brick-600">{error}</p>}

        <div className="space-y-2 pt-2">
          <Button type="submit" name="intent" value="close" disabled={pending} className="w-full justify-center">
            {pending ? "Saving…" : "Save entry"}
          </Button>
          <Button
            type="submit"
            name="intent"
            value="continue"
            variant="secondary"
            disabled={pending}
            className="w-full justify-center"
          >
            {pending ? "Saving…" : "Save & add another"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
