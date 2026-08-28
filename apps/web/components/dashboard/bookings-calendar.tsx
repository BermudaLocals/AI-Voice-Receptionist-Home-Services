"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus } from "lucide-react"

export function BookingsCalendar() {
  const [bookings, setBookings] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetch("/api/bookings").then(r => r.json()).then(d => setBookings(d.bookings || []))
  }, [])

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const monthBookings = bookings.filter(b => {
    const d = new Date(b.scheduledDate)
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()
  })

  const getBookingsForDay = (day: number) => monthBookings.filter(b => new Date(b.scheduledDate).getDate() === day)

  return (
    <>
      <div className="flex justify-between items-center">
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} className="mr-2" /> New Booking
        </Button>
        <Button variant="outline" onClick={() => window.open("/api/calendar/connect", "_self")}>
          <Calendar size={16} className="mr-2" /> Sync Google Calendar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{currentDate.toLocaleString("default", { month: "long", year: "numeric" })}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const dayBookings = getBookingsForDay(day)
                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth()
                return (
                  <div key={day} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative cursor-pointer hover:bg-slate-50 transition-colors ${isToday ? "bg-blue-500 text-white hover:bg-blue-600" : "text-slate-700"}`}>
                    <span className="font-medium">{day}</span>
                    {dayBookings.length > 0 && !isToday && (
                      <span className="absolute bottom-1 flex gap-0.5">
                        {dayBookings.slice(0, 3).map((_, idx) => (
                          <span key={idx} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        ))}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {bookings.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-8">No bookings yet</div>
              )}
              {bookings.map((b) => (
                <div key={b.id} className="p-3 rounded-lg border hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">{b.customerName || "Unknown"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{b.serviceName}</div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
                    <Clock size={12} />
                    {new Date(b.scheduledDate).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">New Booking</h3>
            <div className="space-y-4">
              <div>
                <Label>Customer Name</Label>
                <Input placeholder="John Smith" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input placeholder="+15551234567" />
              </div>
              <div>
                <Label>Service</Label>
                <Input placeholder="AC Repair" />
              </div>
              <div>
                <Label>Date & Time</Label>
                <Input type="datetime-local" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={() => setShowAddModal(false)}>Create Booking</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
