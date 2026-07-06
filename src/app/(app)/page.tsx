import Link from "next/link";
import { AlertTriangle, CheckSquare, Flame, ListChecks, TrendingUp } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Card } from "@/components/ui/Card";
import { RevenueHero } from "@/components/dashboard/RevenueHero";
import { QuickActionsRow } from "@/components/dashboard/QuickActionsRow";
import { ClientsPanel } from "@/components/dashboard/ClientsPanel";
import { PipelineSummaryCard } from "@/components/dashboard/PipelineSummaryCard";
import { DashboardItem, DashboardStagger } from "@/components/dashboard/DashboardMotion";
import { PanelHeading } from "@/components/ui/PanelHeading";
import { getDashboardData } from "@/lib/data/dashboard";
import { getProfile } from "@/lib/data/profile";
import { currentHourInTimezone } from "@/lib/timezone";
import { formatCurrency, formatDate, isOverdue } from "@/lib/format";
import { cn } from "@/lib/cn";

/** `today` is a YYYY-MM-DD string already resolved in the operator's timezone, so format it as UTC to avoid re-shifting the calendar day. */
function todayLabel(today: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${today}T00:00:00Z`));
}

function greetingWord(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const [data, profile] = await Promise.all([getDashboardData(), getProfile()]);

  const firstName = profile.name.trim().split(/\s+/)[0] || null;
  const hour = currentHourInTimezone(profile.timezone);

  const revenueChangePercent =
    data.monthlyRevenue.lastMonth > 0
      ? Math.round(
          ((data.monthlyRevenue.thisMonth - data.monthlyRevenue.lastMonth) / data.monthlyRevenue.lastMonth) * 100
        )
      : null;
  const overdueFollowUpCount = data.hotFollowUps.filter((f) => f.isOverdue).length;

  const visibleFlags = data.attentionFlags.slice(0, 4);
  const hiddenFlagCount = data.attentionFlags.length - visibleFlags.length;

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-burnt-500 mb-2">
          {todayLabel(data.today)}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-medium text-navy-900 leading-tight text-balance">
          {greetingWord(hour)}
          {firstName ? `, ${firstName}` : ""} <span>👋</span>
        </h1>
        <p className="mt-2 text-navy-500">Here&apos;s what&apos;s happening with your business today.</p>
      </div>

      <DashboardStagger>
        <DashboardItem className="mb-6">
          <QuickActionsRow />
        </DashboardItem>

        <DashboardItem className="mb-6">
          <RevenueHero
            revenue={data.projectedRevenue}
            weeklyRevenue={data.weeklyRevenueCollected}
            activeClientCount={data.activeClients.length}
          />
        </DashboardItem>

        <DashboardItem className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card
            tone="sage"
            variant="solid"
            className="p-5 flex items-center gap-3.5 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/80 text-sage-600 shadow-sm">
              <TrendingUp size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-2xl font-semibold text-navy-900 tabular-nums leading-tight">
                {formatCurrency(data.monthlyRevenue.thisMonth)}
              </p>
              <p className="text-xs font-semibold text-navy-600">Revenue this month</p>
              {revenueChangePercent !== null && (
                <p
                  className={cn(
                    "mt-0.5 text-[11px] font-medium",
                    revenueChangePercent >= 0 ? "text-sage-600" : "text-brick-600"
                  )}
                >
                  {revenueChangePercent >= 0 ? "+" : ""}
                  {revenueChangePercent}% vs last month
                </p>
              )}
            </div>
          </Card>
          <Card
            tone="gold"
            variant="solid"
            className="p-5 flex items-center gap-3.5 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/80 text-gold-600 shadow-sm">
              <CheckSquare size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-2xl font-semibold text-navy-900 tabular-nums leading-tight">
                {data.openTodoCount}
              </p>
              <p className="text-xs font-semibold text-navy-600">
                {data.dueTodayCount > 0 ? `${data.dueTodayCount} due today` : "Nothing due today"}
              </p>
            </div>
          </Card>
          <Card
            tone="burnt"
            variant="solid"
            className="p-5 flex items-center gap-3.5 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/80 text-burnt-600 shadow-sm">
              <Flame size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-2xl font-semibold text-navy-900 tabular-nums leading-tight">
                {data.hotFollowUps.length}
              </p>
              <p className="text-xs font-semibold text-navy-600">
                {overdueFollowUpCount > 0 ? `${overdueFollowUpCount} overdue` : "All caught up"}
              </p>
            </div>
          </Card>
        </DashboardItem>

        {visibleFlags.length > 0 && (
          <DashboardItem className="mb-6">
            <Card tone="burnt" className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-burnt-700">
                  <AlertTriangle size={14} /> Needs attention
                </span>
                {visibleFlags.map((flag, i) => (
                  <Link
                    key={i}
                    href={flag.href}
                    className="inline-flex items-center gap-1 rounded-full border border-burnt-200 bg-white/70 px-3 py-1 text-xs font-medium text-navy-700 transition-colors hover:bg-white"
                  >
                    {flag.message}
                  </Link>
                ))}
                {hiddenFlagCount > 0 && (
                  <span className="text-xs font-medium text-navy-400">+{hiddenFlagCount} more</span>
                )}
              </div>
            </Card>
          </DashboardItem>
        )}

        <DashboardItem className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ClientsPanel recurringClients={data.recurringClients} projectClients={data.projectClients} />

          <Card tone="gold" className="p-5">
            <PanelHeading
              icon={ListChecks}
              tone="gold"
              title="To-do snapshot"
              action={
                <Link href="/todos" className="text-xs font-medium text-burnt-600 hover:underline">
                  View all
                </Link>
              }
            />
            {data.todoSnapshot.length === 0 ? (
              <p className="text-sm text-navy-400 py-2">Nothing due today or overdue.</p>
            ) : (
              <ul className="divide-y divide-navy-100 -mx-1">
                {data.todoSnapshot.slice(0, 3).map((task) => (
                  <li key={task.id} className="flex items-center gap-3 px-1 py-2.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        !task.dueDate
                          ? "bg-navy-200"
                          : isOverdue(task.dueDate, data.today)
                            ? "bg-brick-600"
                            : "bg-gold-600"
                      )}
                    />
                    <p className="text-sm font-medium text-navy-900 truncate flex-1 min-w-0">
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <span
                        className={cn(
                          "text-xs font-medium shrink-0",
                          isOverdue(task.dueDate, data.today) ? "text-brick-600" : "text-navy-500"
                        )}
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </DashboardItem>

        <DashboardItem className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PipelineSummaryCard summary={data.pipelineSummary} />

          <Card tone="burnt" className="p-5">
            <PanelHeading icon={Flame} tone="burnt" title="Follow-ups & hot leads" />
            {data.hotFollowUps.length === 0 ? (
              <p className="text-sm text-navy-400 py-2">No follow-ups due today. You&apos;re caught up.</p>
            ) : (
              <ul className="divide-y divide-navy-100 -mx-1">
                {data.hotFollowUps.slice(0, 3).map((f) => (
                  <li key={f.id}>
                    <Link
                      href={f.ownerKind === "client" ? `/clients/${f.clientId}` : `/leads/${f.leadId}`}
                      className="flex items-center gap-3 px-1 py-2.5 hover:bg-cream-100/60 rounded-lg transition-colors"
                    >
                      <AvatarChip name={f.ownerName} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-navy-900 truncate">{f.label}</p>
                        <p className="text-xs text-navy-500 truncate">{f.ownerName}</p>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium shrink-0",
                          f.isOverdue ? "text-brick-600" : "text-navy-500"
                        )}
                      >
                        {f.isOverdue ? "Overdue" : "Today"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {data.hotFollowUps.length > 3 && (
              <p className="px-1 pt-2 text-xs font-medium text-navy-400">
                +{data.hotFollowUps.length - 3} more
              </p>
            )}
          </Card>
        </DashboardItem>
      </DashboardStagger>
    </div>
  );
}
