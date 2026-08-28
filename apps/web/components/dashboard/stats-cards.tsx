"use client"
import { useEffect, useState } from "react"
import { Phone, Calendar, DollarSign, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StatsCards() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch("/api/calls/stats").then(r => r.json()).then(setStats)
  }, [])

  if (!stats) return <StatsCardsSkeleton />

  const cards = [
    { title: "Calls This Month", value: stats.callsThisMonth || 0, change: `${stats.callsChange || 0}%`, icon: Phone, trend: "up" as const },
    { title: "Bookings Made", value: stats.bookingsThisMonth || 0, change: `${stats.bookingsChange || 0}%`, icon: Calendar, trend: "up" as const },
    { title: "Revenue Attributed", value: `$${(stats.revenueThisMonth || 0).toLocaleString()}`, change: `${stats.revenueChange || 0}%`, icon: DollarSign, trend: "up" as const },
    { title: "Answer Rate", value: "94%", change: "+5%", icon: TrendingUp, trend: "up" as const },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className={card.trend === "up" ? "text-emerald-600" : "text-red-600"}>
                {card.change}
              </span> from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="h-32 animate-pulse bg-slate-100" />
      ))}
    </div>
  )
}
