"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProspectListRow } from "@/components/prospects/ProspectListRow";
import { ProspectDrawer } from "@/components/prospects/ProspectDrawer";
import type { ProspectWithRelations, TeamMember } from "@/lib/types";

type Prospect = ProspectWithRelations & { nextFollowUpDate: string | null };

type DrawerState = { mode: "create" } | { mode: "edit"; prospectId: string } | null;

export function ProspectsWorkspace({
  prospects,
  teamMembers,
  assignOptions,
  currentAssigneeId,
  today,
}: {
  prospects: Prospect[];
  teamMembers: TeamMember[];
  assignOptions: { value: string; label: string }[];
  currentAssigneeId: string | null;
  today: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [drawerState, setDrawerState] = useState<DrawerState>(null);
  // Always derived from the live `prospects` prop (rather than snapshotted at
  // open-time) so activity/follow-ups logged inside the open drawer show up
  // immediately once the server action's revalidatePath refetches this page.
  const openProspect =
    drawerState?.mode === "edit" ? prospects.find((p) => p.id === drawerState.prospectId) : undefined;

  // Reacts to ?open= on every route change (initial load, a follow-up link
  // to a different prospect while already on this page, etc.), then strips
  // the param so a later refresh doesn't reopen the drawer. Deliberately not
  // a one-time mount effect — searchParams changing is what re-fires this,
  // no remount/key trick needed (which would race the strip-and-reopen).
  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from the URL, an external source
    setDrawerState({ mode: "edit", prospectId: openId });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("open");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setDrawerState({ mode: "create" })}>
          <Plus size={16} /> Add prospect
        </Button>
      </div>

      {prospects.length === 0 ? (
        <EmptyState
          title="No prospects match these filters"
          description="Try a different filter, or add your first prospect to start building your funnel."
          action={
            <Button onClick={() => setDrawerState({ mode: "create" })}>
              <Plus size={16} /> Add prospect
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {prospects.map((prospect) => (
            <ProspectListRow
              key={prospect.id}
              prospect={prospect}
              today={today}
              onOpen={() => setDrawerState({ mode: "edit", prospectId: prospect.id })}
            />
          ))}
        </div>
      )}

      {drawerState && (drawerState.mode === "create" || openProspect) && (
        <ProspectDrawer
          mode={drawerState.mode}
          prospect={openProspect}
          teamMembers={teamMembers}
          assignOptions={assignOptions}
          currentAssigneeId={currentAssigneeId}
          today={today}
          onClose={() => setDrawerState(null)}
        />
      )}
    </div>
  );
}
