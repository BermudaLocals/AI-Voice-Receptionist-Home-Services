import { BookingsCalendar } from "@/components/dashboard/bookings-calendar";
import { requireBusiness } from "@/lib/auth";

export default async function BookingsPage() {
  await requireBusiness();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings Calendar</h1>
        <p className="text-muted-foreground mt-1">
          Appointments scheduled and synced with your calendar
        </p>
      </div>
      <BookingsCalendar />
    </div>
  );
}
