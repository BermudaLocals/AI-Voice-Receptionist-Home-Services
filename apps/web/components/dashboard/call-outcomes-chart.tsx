"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#94a3b8", "#ef4444", "#8b5cf6"]

const DEFAULT_DATA = [
  { name: "Booked", value: 45 },
  { name: "Qualified", value: 25 },
  { name: "Missed", value: 15 },
  { name: "Spam", value: 15 },
]

export function CallOutcomesChart() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/calls/stats").then(r => r.json()).then(s => {
      const outcomes = s.outcomeBreakdown || []
      setData(outcomes.length ? outcomes.map((o: any) => ({ name: o.outcome, value: o.count })) : DEFAULT_DATA)
    })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Outcomes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 space-y-2">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                <span className="capitalize text-slate-600">{entry.name.toLowerCase()}</span>
              </div>
              <span className="font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function CallOutcomesChartSkeleton() {
  return <Card className="h-[400px] animate-pulse bg-slate-100" />
}
