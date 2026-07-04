import { BarChart3, Briefcase, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { PanelHeading } from "@/components/ui/PanelHeading";
import { ConversionTable } from "@/components/leads/ConversionTable";
import { getConversionBySource, getConversionByWorkType } from "@/lib/data/leadAnalytics";

export default async function LeadAnalyticsPage() {
  const [bySource, byWorkType] = await Promise.all([
    getConversionBySource(),
    getConversionByWorkType(),
  ]);

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        tone="burnt"
        eyebrow="Leads"
        title="Lead Analytics"
        description="Win rate by source and by work type, so effort goes toward what's actually converting."
      />

      <div className="space-y-6">
        <Card className="p-6">
          <PanelHeading icon={Target} tone="burnt" title="Win rate by source" />
          <ConversionTable groupLabel="Source" stats={bySource} />
        </Card>

        <Card className="p-6">
          <PanelHeading icon={Briefcase} tone="slate" title="Win rate by work type" />
          <ConversionTable groupLabel="Work type" stats={byWorkType} />
        </Card>
      </div>
    </div>
  );
}
