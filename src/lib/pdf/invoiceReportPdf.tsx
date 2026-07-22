import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { loadLogoBuffer } from "@/lib/pdf/logo";
import { formatDate, formatCurrency } from "@/lib/format";
import type { RevenueReportRow } from "@/lib/data/revenue";

const styles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 48, fontFamily: "Helvetica" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  logo: { width: 130, height: 44, objectFit: "contain", objectPosition: "right center" },
  businessName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#101d33" },
  subtitle: { fontSize: 9, color: "#7c8aa3", marginTop: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e9ecf2", marginBottom: 20 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#101d33", marginBottom: 4 },
  rangeLabel: { fontSize: 10, color: "#55637a", marginBottom: 18 },
  summaryRow: { flexDirection: "row", marginBottom: 20, gap: 10 },
  summaryBox: { flex: 1, borderWidth: 1, borderColor: "#e9ecf2", borderRadius: 6, padding: 10 },
  summaryLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#7c8aa3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  summaryValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#101d33" },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#101d33",
    paddingBottom: 5,
    marginBottom: 4,
  },
  tableHeadCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#101d33", textTransform: "uppercase", letterSpacing: 0.3 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f0f2f6", paddingVertical: 6 },
  cellDate: { width: 62, fontSize: 9, color: "#33496e" },
  cellClient: { flex: 1.3, fontSize: 9, color: "#101d33", fontFamily: "Helvetica-Bold", paddingRight: 6 },
  cellLabel: { flex: 1.5, fontSize: 9, color: "#33496e", paddingRight: 6 },
  cellType: { flex: 1, fontSize: 9, color: "#55637a", paddingRight: 6 },
  cellStatus: { width: 55, fontSize: 9, color: "#55637a" },
  cellPaidDate: { width: 62, fontSize: 9, color: "#55637a" },
  cellAmount: { width: 65, fontSize: 9, color: "#101d33", textAlign: "right" },
  footer: { position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 8, color: "#aeb8cb", textAlign: "center" },
});

function InvoiceReportPdfDocument({
  businessName,
  logoBuffer,
  clientName,
  rangeLabel,
  rows,
  totalPaid,
  totalUnpaid,
}: {
  businessName: string;
  logoBuffer: Buffer | null;
  clientName: string | null;
  rangeLabel: string;
  rows: RevenueReportRow[];
  totalPaid: number;
  totalUnpaid: number;
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>{businessName}</Text>
            <Text style={styles.subtitle}>Revenue report{clientName ? ` — ${clientName}` : " — all clients"}</Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not an HTML <img>; no alt prop exists on this component */}
          {logoBuffer && <Image src={logoBuffer} style={styles.logo} />}
        </View>
        <View style={styles.divider} />

        <Text style={styles.title}>Invoices</Text>
        <Text style={styles.rangeLabel}>{rangeLabel}</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalPaid)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Unpaid</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalUnpaid)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalPaid + totalUnpaid)}</Text>
          </View>
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.tableHeadCell, styles.cellDate]}>Date</Text>
          {!clientName && <Text style={[styles.tableHeadCell, styles.cellClient]}>Client</Text>}
          <Text style={[styles.tableHeadCell, styles.cellLabel]}>Invoice</Text>
          <Text style={[styles.tableHeadCell, styles.cellType]}>Type of work</Text>
          <Text style={[styles.tableHeadCell, styles.cellStatus]}>Status</Text>
          <Text style={[styles.tableHeadCell, styles.cellPaidDate]}>Paid</Text>
          <Text style={[styles.tableHeadCell, styles.cellAmount]}>Amount</Text>
        </View>
        {rows.map((inv) => (
          <View key={inv.id} style={styles.tableRow} wrap={false}>
            <Text style={styles.cellDate}>{inv.invoicedDate ? formatDate(inv.invoicedDate) : "—"}</Text>
            {!clientName && <Text style={styles.cellClient}>{inv.clientName}</Text>}
            <Text style={styles.cellLabel}>{inv.label}</Text>
            <Text style={styles.cellType}>{inv.workTypeName ?? "—"}</Text>
            <Text style={styles.cellStatus}>{inv.status === "PAID" ? "Paid" : "Unpaid"}</Text>
            <Text style={styles.cellPaidDate}>{inv.paidDate ? formatDate(inv.paidDate) : "—"}</Text>
            <Text style={styles.cellAmount}>{formatCurrency(inv.amount)}</Text>
          </View>
        ))}

        <Text style={styles.footer} fixed>
          {businessName} · Generated {formatDate(new Date().toISOString())} via Verclara
        </Text>
      </Page>
    </Document>
  );
}

/** Renders a client-facing or business-wide invoice/revenue report to a branded PDF buffer — for matching against bank statements or importing into bookkeeping software. */
export async function renderInvoiceReportPdf(params: {
  business: { name: string; logoUrl: string | null };
  clientName: string | null;
  rangeLabel: string;
  rows: RevenueReportRow[];
}): Promise<Buffer> {
  const logoBuffer = await loadLogoBuffer(params.business.logoUrl);
  const totalPaid = params.rows.filter((r) => r.status === "PAID").reduce((sum, r) => sum + Number(r.amount), 0);
  const totalUnpaid = params.rows.filter((r) => r.status === "INVOICED").reduce((sum, r) => sum + Number(r.amount), 0);
  return renderToBuffer(
    <InvoiceReportPdfDocument
      businessName={params.business.name}
      logoBuffer={logoBuffer}
      clientName={params.clientName}
      rangeLabel={params.rangeLabel}
      rows={params.rows}
      totalPaid={totalPaid}
      totalUnpaid={totalUnpaid}
    />
  );
}
