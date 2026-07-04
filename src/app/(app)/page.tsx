import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CalendarClock,
  Flame,
  ListChecks,
  Receipt,
  Repeat,
  Users,
} from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { RevenueHero } from "@/components/dashboard/RevenueHero";
import { DashboardItem, DashboardStagger } from "@/components/dashboard/DashboardMotion";
import { PanelHeading } from "@/components/dashboard/PanelHeading";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatCurrency, formatDate, isOverdue } from "@/lib/format";
import { cn } from "@/lib/cn";

function todayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-burnt-500 mb-2">
          {todayLabel()}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-medium text-navy-900 leading-tight">
          Audax Dashboard
        </h1>
        <p className="mt-2 text-navy-500">What needs your attention today.</p>
      </div>

      <DashboardStagger>
        <DashboardItem className="mb-6">
          <RevenueHero
            revenue={data.projectedRevenue}
            weeklyRevenue={data.weeklyRevenueCollected}
            activeClientCount={data.activeClients.length}
          />
        </DashboardItem>

        <DashboardItem className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card
            tone="slate"
            className="p-4 flex items-center gap-3 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-slate-100 text-slate-600">
              <Users size={17} />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-xl text-navy-900 tabular-nums leading-tight">
                {data.activeClients.length}
              </p>
              <p className="text-[11.5px] font-medium text-navy-400">Active clients</p>
            </div>
          </Card>
          <Card
            tone="gold"
            className="p-4 flex items-center gap-3 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gold-100 text-gold-600">
              <CalendarClock size={17} />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-xl text-navy-900 tabular-nums leading-tight">
                {data.todoSnapshot.length}
              </p>
              <p className="text-[11.5px] font-medium text-navy-400">
                {data.overdueTodoCount > 0 ? `${data.overdueTodoCount} overdue` : "To-dos due today"}
              </p>
            </div>
          </Card>
          <Link href="/invoices" className="block">
            <Card
              tone="burnt"
              className="p-4 h-full flex items-center gap-3 transition-transform hover:-translate-y-0.5 hover:border-burnt-200"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-burnt-100 text-burnt-600">
                <Receipt size={17} />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-xl text-navy-900 tabular-nums leading-tight">
                  {formatCurrency(data.invoiceAging.totalOutstanding)}
                </p>
                <p className="text-[11.5px] font-medium text-navy-400">
                  {data.invoiceAging.overdueCount > 0
                    ? `${data.invoiceAging.overdueCount} over 30 days`
                    : "Outstanding invoices"}
                </p>
              </div>
            </Card>
          </Link>
        </DashboardItem>

        {data.attentionFlags.length > 0 && (
          <DashboardItem className="mb-8">
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-4 pb-3">
                <AlertTriangle size={16} className="text-burnt-600" />
                <h3 className="font-heading text-base font-medium text-navy-900">Needs attention</h3>
              </div>
              <ul className="divide-y divide-navy-100">
                {data.attentionFlags.map((flag, i) => {
                  const critical = flag.type === "invoice";
                  return (
                    <li key={i}>
                      <Link
                        href={flag.href}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-cream-100/60 transition-colors group"
                      >
                        <span
                          className={cn(
                            "h-8 w-[3px] shrink-0 rounded-full",
                            critical ? "bg-brick-600" : "bg-gold-600"
                          )}
                        />
                        <span className="flex-1 min-w-0 text-sm text-navy-700 group-hover:text-navy-900 truncate">
                          {flag.message}
                        </span>
                        <span
                          className={cn(
                            "text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0",
                            critical ? "bg-brick-100 text-brick-600" : "bg-gold-100 text-gold-600"
                          )}
                        >
                          {critical ? "Unbilled" : "No follow-up"}
                        </span>
                        <ArrowRight size={14} className="text-navy-300 group-hover:text-navy-600 shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </DashboardItem>
        )}

        <DashboardItem className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card tone="burnt" className="p-5">
            <PanelHeading icon={Flame} tone="burnt" title="Follow-ups & hot leads" />
            {data.hotFollowUps.length === 0 ? (
              <p className="text-sm text-navy-400 py-2">No follow-ups due today. You&apos;re caught up.</p>
            ) : (
              <ul className="divide-y divide-navy-100 -mx-1">
                {data.hotFollowUps.map((f) => (
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
          </Card>

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
                {data.todoSnapshot.slice(0, 8).map((task) => (
                  <li key={task.id} className="flex items-center gap-3 px-1 py-2.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        !task.dueDate
                          ? "bg-navy-200"
                          : isOverdue(task.dueDate)
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
                          isOverdue(task.dueDate) ? "text-brick-600" : "text-navy-500"
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
          <Card tone="slate" className="p-5">
            <PanelHeading
              icon={Briefcase}
              tone="slate"
              title="Project clients"
              action={
                <Link
                  href="/clients?type=PROJECT"
                  className="text-xs font-medium text-burnt-600 hover:underline"
                >
                  View all
                </Link>
              }
            />
            {data.projectClients.length === 0 ? (
              <EmptyState title="No active project clients" />
            ) : (
              <ul className="divide-y divide-navy-100 -mx-1">
                {data.projectClients.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/clients/${c.id}`}
                      className="flex items-center gap-3 px-1 py-2.5 hover:bg-cream-100/60 rounded-lg transition-colors"
                    >
                      <AvatarChip name={c.companyName} />
                      <p className="text-sm font-medium text-navy-900 truncate flex-1 min-w-0">
                        {c.companyName}
                      </p>
                      <span className="text-xs font-medium text-navy-500 shrink-0">
                        {formatCurrency(c.rate)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card tone="sage" className="p-5">
            <PanelHeading
              icon={Repeat}
              tone="sage"
              title="Recurring clients"
              action={
                <Link
                  href="/clients?type=RECURRING"
                  className="text-xs font-medium text-burnt-600 hover:underline"
                >
                  View all
                </Link>
              }
            />
            {data.recurringClients.length === 0 ? (
              <EmptyState title="No active recurring clients" />
            ) : (
              <ul className="divide-y divide-navy-100 -mx-1">
                {data.recurringClients.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/clients/${c.id}`}
                      className="flex items-center gap-3 px-1 py-2.5 hover:bg-cream-100/60 rounded-lg transition-colors"
                    >
                      <AvatarChip name={c.companyName} />
                      <p className="text-sm font-medium text-navy-900 truncate flex-1 min-w-0">
                        {c.companyName}
                      </p>
                      <span className="text-xs font-medium text-navy-500 shrink-0">
                        {formatCurrency(c.rate)}/mo
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </DashboardItem>
      </DashboardStagger>
    </div>
  );
}
