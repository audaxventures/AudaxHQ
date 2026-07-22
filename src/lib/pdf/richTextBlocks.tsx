import { Text, View, StyleSheet } from "@react-pdf/renderer";

// Mirrors the exact tag allow-list sanitizeRichText enforces (src/lib/richtext.ts)
// — b/strong/i/em/u/ul/ol/li/br/div/p, no attributes — so this only ever needs
// to handle that fixed set, not arbitrary HTML.

type Run = { text: string; bold: boolean; italic: boolean; underline: boolean };
type Block = { type: "paragraph"; runs: Run[] } | { type: "listitem"; ordered: boolean; index: number; runs: Run[] };

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const TOKEN_RE = /<\/?(b|strong|i|em|u|ul|ol|li|br|div|p)\s*>|([^<]+)/gi;

function tokenizeRichText(html: string): Block[] {
  const blocks: Block[] = [];
  let runs: Run[] = [];
  let bold = 0;
  let italic = 0;
  let underline = 0;
  const listStack: { ordered: boolean; counter: number }[] = [];

  function flushParagraph() {
    if (runs.length > 0) {
      blocks.push({ type: "paragraph", runs });
      runs = [];
    }
  }

  function flushListItem() {
    const list = listStack[listStack.length - 1];
    const ordered = list?.ordered ?? false;
    let index = 0;
    if (list) {
      list.counter += 1;
      index = list.counter;
    }
    blocks.push({ type: "listitem", ordered, index, runs });
    runs = [];
  }

  let match: RegExpExecArray | null;
  while ((match = TOKEN_RE.exec(html))) {
    const tag = match[1]?.toLowerCase();
    if (tag) {
      const closing = match[0].startsWith("</");
      switch (tag) {
        case "b":
        case "strong":
          bold += closing ? -1 : 1;
          break;
        case "i":
        case "em":
          italic += closing ? -1 : 1;
          break;
        case "u":
          underline += closing ? -1 : 1;
          break;
        case "br":
          flushParagraph();
          break;
        case "div":
        case "p":
          if (closing) flushParagraph();
          break;
        case "ul":
          if (closing) listStack.pop();
          else listStack.push({ ordered: false, counter: 0 });
          break;
        case "ol":
          if (closing) listStack.pop();
          else listStack.push({ ordered: true, counter: 0 });
          break;
        case "li":
          if (closing) flushListItem();
          break;
      }
    } else {
      const text = decodeEntities(match[2] ?? "").replace(/\s+/g, " ");
      if (text.length > 0) {
        runs.push({ text, bold: bold > 0, italic: italic > 0, underline: underline > 0 });
      }
    }
  }
  flushParagraph();
  return blocks;
}

const styles = StyleSheet.create({
  paragraph: { marginBottom: 6, fontSize: 10, lineHeight: 1.5, color: "#33496e" },
  listRow: { flexDirection: "row", marginBottom: 4, paddingLeft: 4 },
  bullet: { width: 16, fontSize: 10, lineHeight: 1.5, color: "#33496e" },
  listText: { flex: 1, fontSize: 10, lineHeight: 1.5, color: "#33496e" },
});

function runFontFamily(run: Run): string {
  if (run.bold && run.italic) return "Helvetica-BoldOblique";
  if (run.bold) return "Helvetica-Bold";
  if (run.italic) return "Helvetica-Oblique";
  return "Helvetica";
}

function RunText({ run }: { run: Run }) {
  return (
    <Text style={{ fontFamily: runFontFamily(run), textDecoration: run.underline ? "underline" : "none" }}>
      {run.text}
    </Text>
  );
}

/** Renders sanitized rich-text HTML (agenda/notes fields) as react-pdf primitives. Null/empty input renders nothing. */
export function RichTextBlocks({ html }: { html: string | null | undefined }) {
  if (!html) return null;
  const blocks = tokenizeRichText(html);
  if (blocks.length === 0) return null;

  return (
    <View>
      {blocks.map((block, i) =>
        block.type === "paragraph" ? (
          <Text key={i} style={styles.paragraph}>
            {block.runs.map((run, j) => (
              <RunText key={j} run={run} />
            ))}
          </Text>
        ) : (
          <View key={i} style={styles.listRow}>
            <Text style={styles.bullet}>{block.ordered ? `${block.index}.` : "•"}</Text>
            <Text style={styles.listText}>
              {block.runs.map((run, j) => (
                <RunText key={j} run={run} />
              ))}
            </Text>
          </View>
        )
      )}
    </View>
  );
}
