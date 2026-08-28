"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export function RevenueChart() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/calls/stats").then(r => r.json()).then(s => {
      const daily = s.dailyStats || []
      setData(daily.map((d: any) => ({
        name: d.date?.slice(5) || "",
        calls: d.calls || 0,
        revenue: d.revenue || 0,
      })))
    })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Call Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.length ? data : [
            { name: "Mon", calls: 12, revenue: 1240 },
            { name: "Tue", calls: 19, revenue: 2890 },
            { name: "Wed", calls: 15, revenue: 2100 },
            { name: "Thu", calls: 22, revenue: 3400 },
            { name: "Fri", calls: 18, revenue: 2650 },
            { name: "Sat", calls: 8, revenue: 980 },
            { name: "Sun", calls: 5, revenue: 650 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="calls" fill="#3b82f6" name="Calls" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue ($)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function RevenueChartSkeleton() {
  return <Card className="h-[400px] animate-pulse bg-slate-100" />
}
