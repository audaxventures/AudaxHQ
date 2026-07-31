import { BarChart3, Briefcase, Handshake, Target, UserSearch, Factory, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { PanelHeading } from "@/components/ui/PanelHeading";
import { ConversionTable } from "@/components/leads/ConversionTable";
import {
  getConversionByPartner,
  getConversionBySource,
  getConversionByWorkType,
  getProspectConversionByIndustry,
  getProspectConversionByOwner,
  getProspectFunnelSummary,
} from "@/lib/data/leadAnalytics";
import { requireCurrentUser } from "@/lib/currentUser";
import type { Tone } from "@/lib/tone";

function StatTile({ label, value, subtext, tone }: { label: string; value: string; subtext?: string; tone: Tone }) {
  return (
    <Card tone={tone} variant="solid" className="p-4">
      <p className="font-heading text-2xl font-semibold text-navy-900 tabular-nums leading-tight">{value}</p>
      <p className="text-xs font-semibold text-navy-600">{label}</p>
      {subtext && <p className="mt-0.5 text-xs text-navy-400">{subtext}</p>}
    </Card>
  );
}

export default async function LeadAnalyticsPage() {
  const user = await requireCurrentUser();
  const isOwner = user.role === "OWNER";
  const [bySource, byWorkType, byPartner, prospectFunnel, prospectsByIndustry, prospectsByOwner] = await Promise.all([
    getConversionBySource(user.businessId),
    getConversionByWorkType(user.businessId),
    isOwner ? getConversionByPartner(user.businessId) : Promise.resolve([]),
    getProspectFunnelSummary(user.businessId),
    getProspectConversionByIndustry(user.businessId),
    getProspectConversionByOwner(user.businessId),
  ]);

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        tone="burnt"
        eyebrow="Insights"
        title="Insights"
        description="Know what's working, from the first outreach to the client you win"
      />

      <div className="space-y-6">
        <Card className="p-6">
          <PanelHeading icon={UserSearch} tone="navy" title="Prospect → lead conversion" />
          <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
            <StatTile label="In pipeline" value={String(prospectFunnel.inPipeline)} tone="navy" />
            <StatTile label="Converted to lead" value={String(prospectFunnel.converted)} tone="sage" />
            <StatTile
              label="Conversion rate"
              value={prospectFunnel.conversionRate !== null ? `${Math.round(prospectFunnel.conversionRate)}%` : "—"}
              subtext={
                prospectFunnel.conversionRate !== null
                  ? `${prospectFunnel.converted} converted · ${prospectFunnel.notInterested} not interested`
                  : "No resolved prospects yet"
              }
              tone="burnt"
            />
            <StatTile
              label="Avg. days to convert"
              value={prospectFunnel.avgDaysToConvert !== null ? prospectFunnel.avgDaysToConvert.toFixed(0) : "—"}
              tone="slate"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <PanelHeading icon={Factory} tone="slate" title="By industry" />
              <ConversionTable
                groupLabel="Industry"
                stats={prospectsByIndustry}
                rateLabel="Conversion rate"
                totalLabel="Total prospects"
                wonWord="converted"
                lostWord="not interested"
                noResolvedText="No resolved prospects yet"
                emptyTitle="No prospects yet"
                emptyDescription="Breakdowns will appear once you add prospects."
              />
            </div>
            <div>
              <PanelHeading icon={UserCheck} tone="gold" title="By owner" />
              <ConversionTable
                groupLabel="Owner"
                stats={prospectsByOwner}
                rateLabel="Conversion rate"
                totalLabel="Total prospects"
                wonWord="converted"
                lostWord="not interested"
                noResolvedText="No resolved prospects yet"
                emptyTitle="No prospects yet"
                emptyDescription="Breakdowns will appear once you add prospects."
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <PanelHeading icon={Target} tone="burnt" title="Win rate by source" />
          <ConversionTable groupLabel="Source" stats={bySource} />
        </Card>

        <Card className="p-6">
          <PanelHeading icon={Briefcase} tone="slate" title="Win rate by work type" />
          <ConversionTable groupLabel="Work type" stats={byWorkType} />
        </Card>

        {isOwner && byPartner.length > 0 && (
          <Card className="p-6">
            <PanelHeading icon={Handshake} tone="gold" title="Won revenue by partner" />
            <ConversionTable groupLabel="Partner" stats={byPartner} />
          </Card>
        )}
      </div>
    </div>
  );
}
