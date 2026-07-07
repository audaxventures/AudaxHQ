const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "ul", "ol", "li", "br", "div", "p"]);

/**
 * Strips everything except a small allow-list of formatting tags — and all
 * attributes on them — from HTML produced by RichTextEditor's execCommand
 * toolbar. Meeting note fields are rendered later with dangerouslySetInnerHTML,
 * so this runs server-side before storage rather than trusting the browser's
 * output as-is. Not a full HTML parser — sufficient for the narrow, attribute-free
 * markup our own toolbar generates (styleWithCSS is forced off client-side).
 */
export function sanitizeRichText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?([a-zA-Z0-9]+)[^>]*>/g, (match, tagName: string) => {
      const tag = tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      return match.startsWith("</") ? `</${tag}>` : `<${tag}>`;
    })
    .trim();
}

/** True if sanitized rich text has no visible content (only empty tags/whitespace). */
export function isRichTextEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}
