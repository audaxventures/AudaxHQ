"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitContactForm, type ContactFormState } from "@/lib/actions/contact";

const initialState: ContactFormState = { success: false, error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full cursor-pointer rounded-xl bg-burnt-500 px-4 py-3.5 text-sm font-semibold text-cream-50 transition-colors hover:bg-burnt-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, initialState);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-sage-100 bg-sage-100/40 p-8 text-center">
        <p className="font-heading text-lg font-medium text-navy-900">Message sent.</p>
        <p className="mt-2 text-sm text-navy-600">
          Thanks for reaching out — we’ll get back to you at the email you provided.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-navy-700">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          required
          autoComplete="name"
          className="w-full rounded-lg border border-navy-200 bg-cream-50 px-3.5 py-2.5 text-base text-navy-900 placeholder:text-navy-400 focus:border-burnt-400 focus:outline-none focus:ring-2 focus:ring-burnt-100 sm:text-sm"
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-navy-700">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-navy-200 bg-cream-50 px-3.5 py-2.5 text-base text-navy-900 placeholder:text-navy-400 focus:border-burnt-400 focus:outline-none focus:ring-2 focus:ring-burnt-100 sm:text-sm"
          placeholder="jane@example.com"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-navy-700">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className="w-full resize-none rounded-lg border border-navy-200 bg-cream-50 px-3.5 py-2.5 text-base text-navy-900 placeholder:text-navy-400 focus:border-burnt-400 focus:outline-none focus:ring-2 focus:ring-burnt-100 sm:text-sm"
          placeholder="Tell us a bit about your business and what you're looking for…"
        />
      </div>
      {state.error && (
        <p className="text-sm text-brick-600" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
