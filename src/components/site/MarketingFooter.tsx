import Link from "next/link";
import { appPath } from "@/lib/site";

const PRODUCT_LINKS = [{ href: "/#features", label: "Features" }];
const PRODUCT_APP_LINKS = [
  { href: "/signup", label: "Start for free" },
  { href: "/login", label: "Sign in" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/about#faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-navy-800 bg-navy-900">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-2">
            <Link href="/" className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- small static brand mark */}
              <img src="/hqlogo.png" alt="Audax HQ" className="h-8 w-auto" />
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-navy-300">
              The business operating system for service businesses — clients, pipeline, revenue, and work, in one
              workspace.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-navy-400 uppercase">Product</p>
            <ul className="mt-3 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-navy-200 transition-colors hover:text-cream-50">
                    {link.label}
                  </Link>
                </li>
              ))}
              {PRODUCT_APP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={appPath(link.href)} className="text-sm text-navy-200 transition-colors hover:text-cream-50">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-navy-400 uppercase">Company</p>
            <ul className="mt-3 space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-navy-200 transition-colors hover:text-cream-50">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href="mailto:info@audaxventures.ca" className="text-sm text-navy-200 transition-colors hover:text-cream-50">
                  info@audaxventures.ca
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-navy-800 pt-6 text-xs text-navy-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Audax Ventures Inc. All rights reserved.</p>
          <p>Built by Audax Ventures.</p>
        </div>
      </div>
    </footer>
  );
}
