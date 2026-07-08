import { BarChart3, Briefcase, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { PanelHeading } from "@/components/ui/PanelHeading";
import { ConversionTable } from "@/components/leads/ConversionTable";
import { getConversionBySource, getConversionByWorkType } from "@/lib/data/leadAnalytics";
import { requireCurrentUser } from "@/lib/currentUser";

export default async function LeadAnalyticsPage() {
  const user = await requireCurrentUser();
  const [bySource, byWorkType] = await Promise.all([
    getConversionBySource(user.businessId),
    getConversionByWorkType(user.businessId),
  ]);

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        tone="burnt"
        eyebrow="Leads"
        title="Lead Insights"
        description="Know what's working, and where your clients come from"
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
