import { SettingsForm } from "@/components/dashboard/settings-form";
import { requireBusiness } from "@/lib/auth";

export default async function SettingsPage() {
  const business = await requireBusiness();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure how your AI receptionist handles calls
        </p>
      </div>
      <SettingsForm business={business} />
    </div>
  );
}
