import { Suspense } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { CallOutcomesChart } from "@/components/dashboard/call-outcomes-chart";
import { RecentCallsTable } from "@/components/dashboard/recent-calls-table";
import { UpcomingBookings } from "@/components/dashboard/upcoming-bookings";
import { requireBusiness } from "@/lib/auth";

export default async function DashboardPage() {
  const business = await requireBusiness();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {business.name}. Here&apos;s how your AI receptionist performed today.
        </p>
      </div>

      <Suspense fallback={<StatsCards.Skeleton />}>
        <StatsCards />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<RevenueChart.Skeleton />}>
            <RevenueChart />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<CallOutcomesChart.Skeleton />}>
            <CallOutcomesChart />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<RecentCallsTable.Skeleton />}>
            <RecentCallsTable />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<UpcomingBookings.Skeleton />}>
            <UpcomingBookings />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
