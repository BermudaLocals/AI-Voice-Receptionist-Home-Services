"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"

const statusColors: Record<string, string> = {
  BOOKED: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  QUALIFIED: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  MISSED: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  SPAM: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  PENDING: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  VOICEMAIL: "bg-purple-100 text-purple-700 hover:bg-purple-100",
}

export function RecentCallsTable() {
  const [calls, setCalls] = useState<any[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/calls?limit=5").then(r => r.json()).then(d => setCalls(d.calls || []))
  }, [])

  const filtered = calls.filter(c =>
    c.fromNumber?.includes(search) ||
    c.serviceMentioned?.toLowerCase().includes(search.toLowerCase()) ||
    c.summary?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Calls</CardTitle>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8 w-48" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="flex items-center gap-1 px-3 py-2 border rounded-md text-sm hover:bg-slate-50">
            <Filter size={14} /> Filter
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="pb-3 pr-4">Caller</th>
                <th className="pb-3 pr-4">Service</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Revenue</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((call) => (
                <tr key={call.id} className="group">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-sm">{call.fromNumber}</div>
                    <div className="text-xs text-slate-500">{call.addressMentioned || "—"}</div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-slate-700">{call.serviceMentioned || "—"}</td>
                  <td className="py-3 pr-4">
                    <Badge className={statusColors[call.outcome] || statusColors.PENDING}>
                      {call.outcome?.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-sm font-medium">
                    {call.revenue ? `$${Number(call.revenue).toFixed(0)}` : "—"}
                  </td>
                  <td className="py-3 text-right">
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function RecentCallsTableSkeleton() {
  return <Card className="h-[400px] animate-pulse bg-slate-100" />
}
