"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Star } from "lucide-react"

export function UpcomingBookings() {
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/bookings?status=CONFIRMED").then(r => r.json()).then(d => setBookings(d.bookings?.slice(0, 3) || []))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookings.length === 0 && (
            <div className="text-sm text-slate-500 text-center py-4">No upcoming appointments</div>
          )}
          {bookings.map((b) => (
            <div key={b.id} className="rounded-lg border p-3 hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer">
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm">{b.customerName || "Unknown"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{b.status}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{b.serviceName}</div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
                <Clock size={12} />
                {new Date(b.scheduledDate).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="text-amber-400" />
            <span className="font-semibold text-sm">Review Requests</span>
          </div>
          <p className="text-xs text-slate-300 mb-2">Automatically request reviews after job completion.</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded">$99/mo add-on</span>
            <button className="text-xs bg-blue-500 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-600 transition-colors">Enable</button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function UpcomingBookingsSkeleton() {
  return <Card className="h-[300px] animate-pulse bg-slate-100" />
}
