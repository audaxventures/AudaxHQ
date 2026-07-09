import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Section } from "@/components/site/Section";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = {
  title: "Contact — Audax HQ",
  description: "Get in touch with the Audax HQ team.",
};

export default function ContactPage() {
  return (
    <>
      <div className="bg-navy-900">
        <Section className="py-20 text-center lg:py-24">
          <span className="inline-flex items-center rounded-full border border-navy-700 bg-navy-800 px-3.5 py-1.5 text-xs font-medium text-navy-200">
            Contact
          </span>
          <h1 className="mx-auto mt-5 max-w-xl font-heading text-4xl font-semibold leading-[1.1] text-cream-50 sm:text-5xl">
            Let’s talk.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-navy-300">
            Questions about Audax HQ, want to see it in action, or need help with your workspace — send us a
            message and we’ll get back to you directly.
          </p>
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section className="max-w-2xl!">
          <div className="rounded-2xl border border-navy-100 bg-white p-7 sm:p-9">
            <ContactForm />
          </div>
          <p className="mt-8 text-center text-sm text-navy-500">
            <Mail size={15} className="mr-1.5 mb-0.5 inline-block" />
            You can also reach us directly at{" "}
            <a href="mailto:info@audaxventures.ca" className="font-medium text-burnt-600 hover:underline">
              info@audaxventures.ca
            </a>
          </p>
        </Section>
      </div>
    </>
  );
}
