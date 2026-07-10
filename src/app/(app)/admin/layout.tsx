import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminSubNav } from "@/components/admin/AdminSubNav";
import { requirePlatformAdmin } from "@/lib/currentUser";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        tone="navy"
        eyebrow="Platform Admin"
        title="Admin"
        description="Every workspace on Audax HQ, in one place."
      />
      <AdminSubNav />
      {children}
    </div>
  );
}
