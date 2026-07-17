import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// Mirrors proxy.ts's MARKETING_HOSTS — the marketing site should be fully
// crawlable (including by AI/LLM crawlers); the gated app itself has nothing
// worth indexing (just a login screen and private workspace data), so it
// stays closed to crawlers on every other host.
const MARKETING_HOSTS = (process.env.MARKETING_HOSTS ?? "www.verclara.io,verclara.io")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

export default async function robots(): Promise<MetadataRoute.Robots> {
  const hdrs = await headers();
  const host = hdrs.get("host")?.split(":")[0] ?? "";

  if (!MARKETING_HOSTS.includes(host)) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: [
      { userAgent: "*", allow: "/" },
      // Named explicitly so it's unambiguous that AI/LLM crawlers and
      // assistants (ChatGPT, Claude, Perplexity, etc.) are welcome here.
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "Claude-User",
          "Claude-SearchBot",
          "anthropic-ai",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "CCBot",
          "Bytespider",
        ],
        allow: "/",
      },
    ],
    sitemap: "https://www.verclara.io/sitemap.xml",
  };
}
