import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Section } from "@/components/site/Section";
import { ContactForm } from "@/components/site/ContactForm";

const TITLE = "Contact — Verclara";
const DESCRIPTION = "Get in touch with the Verclara team.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function ContactPage() {
  return (
    <div className="bg-cream-50">
      <Section className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full border border-burnt-300 bg-burnt-100 px-3.5 py-1.5 text-xs font-medium text-burnt-700">
              Contact
            </span>
            <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.1] text-navy-900 sm:text-5xl">
              Let’s talk.
            </h1>
            <p className="mt-3 font-heading text-lg text-navy-700">We’d love to hear from you.</p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-navy-600">
              Questions about Verclara, want to see it in action, or need help with your workspace — send us a
              message and we’ll get back to you directly.
            </p>
            <a
              href="mailto:info@audaxventures.ca"
              className="mt-8 inline-flex items-center gap-3 text-sm font-medium text-navy-700 transition-colors hover:text-burnt-600"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-100 bg-white text-navy-500">
                <Mail size={16} />
              </span>
              info@audaxventures.ca
            </a>
          </div>
          <div className="rounded-2xl border border-navy-100 bg-white p-7 sm:p-9">
            <ContactForm />
          </div>
        </div>
      </Section>
    </div>
  );
}
