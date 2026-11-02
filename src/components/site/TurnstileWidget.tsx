"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

// Minimal typing for the bits of the Turnstile client API we use.
interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "flexible" | "compact";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  /** Change this value to get a fresh token (e.g. after a failed submit — tokens are single-use). */
  resetKey?: unknown;
  onTokenChange?: (token: string | null) => void;
}

/**
 * Renders a Cloudflare Turnstile challenge. When placed inside a <form>, it adds
 * a hidden "cf-turnstile-response" input that the server action verifies.
 */
export function TurnstileWidget({ siteKey, resetKey, onTokenChange }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "light",
      size: "flexible",
      callback: (token) => onTokenChangeRef.current?.(token),
      "expired-callback": () => onTokenChangeRef.current?.(null),
      "error-callback": () => onTokenChangeRef.current?.(null),
    });
  }, [siteKey]);

  // Render if the script was already loaded (e.g. navigating back to the page).
  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [renderWidget]);

  // Fetch a new token when asked to.
  const firstResetRef = useRef(true);
  useEffect(() => {
    if (firstResetRef.current) {
      firstResetRef.current = false;
      return;
    }
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenChangeRef.current?.(null);
    }
  }, [resetKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
}
