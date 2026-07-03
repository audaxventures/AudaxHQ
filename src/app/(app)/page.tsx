import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-navy-400 mb-2">
            <Users size={16} />
            <p className="text-xs font-medium uppercase tracking-wide">Active clients</p>
          </div>
          <p className="font-heading text-3xl text-navy-900">{data.activeClients.length}</p>
          <p className="mt-1 text-sm text-navy-500">
            {data.projectClients.length} project · {data.recurringClients.length} recurring
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-navy-400 mb-2">
            <TrendingUp size={16} />
            <p className="text-xs font-medium uppercase tracking-wide">Projected revenue</p>
          </div>
          <p className="font-heading text-3xl text-navy-900">{formatCurrency(data.projectedRevenue)}</p>
          <p className="mt-1 text-sm text-navy-500">Recurring fees + unpaid project work</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-navy-400 mb-2">
            <CalendarClock size={16} />
            <p className="text-xs font-medium uppercase tracking-wide">To-dos due</p>
          </div>
          <p className="font-heading text-3xl text-navy-900">{data.todoSnapshot.length}</p>
          <p className="mt-1 text-sm text-navy-500">
            {data.overdueTodoCount > 0 ? `${data.overdueTodoCount} overdue` : "None overdue"}
          </p>
        </Card>
      </div>

      {data.attentionFlags.length > 0 && (
        <Card className="p-5 mb-8 border-burnt-200 bg-burnt-100/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-burnt-600" />
            <h3 className="font-heading text-base font-medium text-navy-900">Needs attention</h3>
          </div>
          <ul className="space-y-2">
            {data.attentionFlags.map((flag, i) => (
              <li key={i}>
                <Link
                  href={flag.href}
                  className="flex items-center justify-between gap-2 text-sm text-navy-700 hover:text-navy-900 group"
                >
                  <span>{flag.message}</span>
                  <ArrowRight size={14} className="text-navy-300 group-hover:text-navy-600 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-base font-medium text-navy-900">
              Follow-ups &amp; hot leads
            </h3>
          </div>
          {data.hotFollowUps.length === 0 ? (
            <p className="text-sm text-navy-400 py-2">No follow-ups due today. You&apos;re caught up.</p>
          ) : (
            <ul className="divide-y divide-navy-100 -mx-1">
              {data.hotFollowUps.map((f) => (
                <li key={f.id}>
                  <Link
                    href={f.ownerKind === "client" ? `/clients/${f.clientId}` : `/leads/${f.leadId}`}
                    className="flex items-center justify-between gap-3 px-1 py-2.5 hover:bg-cream-100/60 rounded-lg transition-colors"
                  >
                    <div className="min-w-0">
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

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-base font-medium text-navy-900">To-do snapshot</h3>
            <Link href="/todos" className="text-xs font-medium text-burnt-600 hover:underline">
              View all
            </Link>
          </div>
          {data.todoSnapshot.length === 0 ? (
            <p className="text-sm text-navy-400 py-2">Nothing due today or overdue.</p>
          ) : (
            <ul className="divide-y divide-navy-100 -mx-1">
              {data.todoSnapshot.slice(0, 8).map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 px-1 py-2.5">
                  <p className="text-sm font-medium text-navy-900 truncate">{task.title}</p>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-base font-medium text-navy-900">Project clients</h3>
            <Link href="/clients?type=PROJECT" className="text-xs font-medium text-burnt-600 hover:underline">
              View all
            </Link>
          </div>
          {data.projectClients.length === 0 ? (
            <EmptyState title="No active project clients" />
          ) : (
            <ul className="divide-y divide-navy-100 -mx-1">
              {data.projectClients.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/clients/${c.id}`}
                    className="flex items-center justify-between gap-3 px-1 py-2.5 hover:bg-cream-100/60 rounded-lg transition-colors"
                  >
                    <p className="text-sm font-medium text-navy-900 truncate">{c.companyName}</p>
                    <span className="text-xs font-medium text-navy-500 shrink-0">
                      {formatCurrency(c.rate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-base font-medium text-navy-900">Recurring clients</h3>
            <Link href="/clients?type=RECURRING" className="text-xs font-medium text-burnt-600 hover:underline">
              View all
            </Link>
          </div>
          {data.recurringClients.length === 0 ? (
            <EmptyState title="No active recurring clients" />
          ) : (
            <ul className="divide-y divide-navy-100 -mx-1">
              {data.recurringClients.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/clients/${c.id}`}
                    className="flex items-center justify-between gap-3 px-1 py-2.5 hover:bg-cream-100/60 rounded-lg transition-colors"
                  >
                    <p className="text-sm font-medium text-navy-900 truncate">{c.companyName}</p>
                    <span className="text-xs font-medium text-navy-500 shrink-0">
                      {formatCurrency(c.rate)}/mo
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
