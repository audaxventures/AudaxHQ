import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { RichTextBlocks } from "@/lib/pdf/richTextBlocks";
import { loadLogoBuffer } from "@/lib/pdf/logo";
import { formatDate, formatTime } from "@/lib/format";
import { timezoneAbbreviation } from "@/lib/timezone";
import { isRichTextEmpty } from "@/lib/richtext";
import type { MeetingNote } from "@/lib/types";

function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours} hr${hours > 1 ? "s" : ""}`;
}

const styles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 48, fontFamily: "Helvetica" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  logo: { width: 130, height: 44, objectFit: "contain", objectPosition: "right center" },
  businessName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#101d33" },
  meetingWith: { fontSize: 9, color: "#7c8aa3", marginTop: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e9ecf2", marginBottom: 20 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#101d33", marginBottom: 14 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  metaItem: { marginRight: 24, marginBottom: 8 },
  metaLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#7c8aa3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontSize: 10, color: "#16283f" },
  section: { marginTop: 18 },
  sectionHeading: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#101d33", marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#f0c299", paddingBottom: 4 },
  actionItemRow: { flexDirection: "row", marginBottom: 5 },
  actionItemCheckbox: { width: 22, fontSize: 10, color: "#be5a1e", fontFamily: "Helvetica-Bold" },
  actionItemText: { flex: 1, fontSize: 10, lineHeight: 1.4, color: "#33496e" },
  actionItemMeta: { fontSize: 9, color: "#7c8aa3" },
  footer: { position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 8, color: "#aeb8cb", textAlign: "center" },
});

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function MeetingNotePdfDocument({
  note,
  businessName,
  logoBuffer,
}: {
  note: MeetingNote;
  businessName: string;
  logoBuffer: Buffer | null;
}) {
  const rawTime = note.startTime ? formatTime(note.startTime) : null;
  const time = rawTime && note.timezone ? `${rawTime} ${timezoneAbbreviation(note.timezone, note.meetingDate)}` : rawTime;
  const hasAgenda = !isRichTextEmpty(note.agenda);
  const hasNotes = !isRichTextEmpty(note.notes);
  const actionItems = note.actionItemTasks ?? [];
  // Matches ActionItemsQuickAdd's theirLabel convention (src/components/meetingnotes/ActionItemsQuickAdd.tsx).
  const theirLabel = note.clientId ? "Client" : "Lead";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>{businessName}</Text>
            {note.ownerName && <Text style={styles.meetingWith}>A meeting with {note.ownerName}</Text>}
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not an HTML <img>; no alt prop exists on this component */}
          {logoBuffer && <Image src={logoBuffer} style={styles.logo} />}
        </View>
        <View style={styles.divider} />

        <Text style={styles.title}>{note.title || "Meeting Notes"}</Text>

        <View style={styles.metaRow}>
          <MetaItem label="Date" value={formatDate(note.meetingDate)} />
          {time && <MetaItem label="Time" value={time} />}
          {note.durationMinutes && <MetaItem label="Duration" value={durationLabel(note.durationMinutes)} />}
        </View>
        {(note.location || note.attendees) && (
          <View style={styles.metaRow}>
            {note.location && <MetaItem label="Location" value={note.location} />}
            {note.attendees && <MetaItem label="Attendees" value={note.attendees} />}
          </View>
        )}

        {hasAgenda && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Agenda</Text>
            <RichTextBlocks html={note.agenda} />
          </View>
        )}

        {hasNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Notes</Text>
            <RichTextBlocks html={note.notes} />
          </View>
        )}

        {actionItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Action Items</Text>
            {actionItems.map((task) => (
              <View key={task.id} style={styles.actionItemRow}>
                <Text style={styles.actionItemCheckbox}>{task.status === "COMPLETED" ? "[x]" : "[ ]"}</Text>
                <Text style={styles.actionItemText}>
                  {task.title}
                  {task.dueDate ? `  (due ${formatDate(task.dueDate)})` : ""}
                  {"  "}
                  <Text style={styles.actionItemMeta}>
                    — Assigned to {task.ownedBy === "EXTERNAL" ? theirLabel : task.assigneeName}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer} fixed>
          {businessName} · Generated {formatDate(new Date().toISOString())} via Verclara
        </Text>
      </Page>
    </Document>
  );
}

/** Renders a single meeting note to a branded PDF buffer — shared by the download route and the email-send action so both produce identical output. */
export async function renderMeetingNotePdf(note: MeetingNote, business: { name: string; logoUrl: string | null }): Promise<Buffer> {
  const logoBuffer = await loadLogoBuffer(business.logoUrl);
  return renderToBuffer(<MeetingNotePdfDocument note={note} businessName={business.name} logoBuffer={logoBuffer} />);
}

