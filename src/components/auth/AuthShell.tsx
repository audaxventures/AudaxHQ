import type { LucideIcon } from "lucide-react";
import { Users, Target, DollarSign, CheckSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { Footer } from "@/components/ui/Footer";

const FEATURES = [
  {
    icon: Users,
    toneClasses: "bg-burnt-100 text-burnt-600",
    title: "Client & Project Management",
    description: "Keep every client relationship and project organized and on track.",
  },
  {
    icon: Target,
    toneClasses: "bg-blue-100 text-blue-600",
    title: "Lead Management",
    description: "Track your pipeline from first contact to signed client.",
  },
  {
    icon: DollarSign,
    toneClasses: "bg-sage-100 text-sage-600",
    title: "Revenue Tracker",
    description: "Track revenue, invoices, and cash flow in real time.",
  },
  {
    icon: CheckSquare,
    toneClasses: "bg-slate-100 text-slate-600",
    title: "Tasks & Productivity",
    description: "Stay focused with to-dos, calendars, and meeting notes.",
  },
] as const;

/** Shared two-column shell (marketing panel + dark sign-in card) for every /login* page. */
export function AuthShell({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-cream-50 px-8 py-16 sm:px-16 md:w-[58%] md:flex-none">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded photo, dimensions unknown */}
          <img
            src="/login.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background:
                "linear-gradient(180deg, rgba(253,251,246,0.1) 0%, rgba(253,251,246,0.55) 55%, rgba(253,251,246,0.8) 100%)",
            }}
          />
          <div className="relative z-10 mx-auto max-w-md text-center lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">
            {/* The source file has uneven transparent margins (much wider on the right than the
                left), so centering the <img> itself still looks off-center above the title. This
                wrapper clips to the logo's actual content box, measured from the source PNG. */}
            <div className="mx-auto mb-10 overflow-hidden" style={{ width: 180, height: 56 }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded logo, dimensions unknown */}
              <img
                src="/logo.png"
                alt="Audax Ventures"
                style={{ width: 211, maxWidth: "none", position: "relative", left: -9.7, top: -7 }}
              />
            </div>
            <h1 className="text-balance font-heading text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
              Welcome to
              <br />
              <span className="font-bold text-burnt-500">Audax HQ</span>
            </h1>
            <p className="mt-4 text-lg font-medium text-navy-600">Your business command center.</p>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-navy-500">
              Manage clients, projects, tasks, and more in one centralized platform. Sign in to access your workspace
              and continue where you left off.
            </p>
            <div className="mt-9 space-y-5 text-left">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3.5">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", feature.toneClasses)}>
                    <feature.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{feature.title}</p>
                    <p className="text-sm text-navy-500">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-navy-950 px-6 py-16 md:w-[42%] md:flex-none">
          <div className="relative w-full max-w-md rounded-2xl border border-navy-700/60 bg-navy-800/60 p-8 shadow-xl backdrop-blur">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-burnt-500 text-burnt-500">
                <Icon size={22} />
              </div>
              <h2 className="font-heading text-2xl font-medium text-cream-50">{title}</h2>
              <p className="mt-2 text-sm text-navy-300">{description}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
