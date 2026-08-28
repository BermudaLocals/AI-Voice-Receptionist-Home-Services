import { BillingDashboard } from "@/components/dashboard/billing-dashboard";
import { requireBusiness } from "@/lib/auth";

export default async function BillingPage() {
  await requireBusiness();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Plan</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and usage
        </p>
      </div>
      <BillingDashboard />
    </div>
  );
}
