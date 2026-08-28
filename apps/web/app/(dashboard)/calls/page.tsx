import { CallsList } from "@/components/dashboard/calls-list";
import { requireBusiness } from "@/lib/auth";

export default async function CallsPage() {
  await requireBusiness();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Call Logs</h1>
        <p className="text-muted-foreground mt-1">
          Review, listen, and analyze every call handled by your AI
        </p>
      </div>
      <CallsList />
    </div>
  );
}
