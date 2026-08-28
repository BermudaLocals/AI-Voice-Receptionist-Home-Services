"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, Pause, Search, Filter, Phone, X, Volume2 } from "lucide-react"

const statusColors: Record<string, string> = {
  BOOKED: "bg-emerald-100 text-emerald-700",
  QUALIFIED: "bg-blue-100 text-blue-700",
  MISSED: "bg-amber-100 text-amber-700",
  SPAM: "bg-slate-100 text-slate-600",
  PENDING: "bg-slate-100 text-slate-600",
  VOICEMAIL: "bg-purple-100 text-purple-700",
  TRANSFERRED: "bg-indigo-100 text-indigo-700",
  CALLBACK_REQUESTED: "bg-orange-100 text-orange-700",
}

export function CallsList() {
  const [calls, setCalls] = useState<any[]>([])
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [playing, setPlaying] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch(`/api/calls?page=${page}&limit=20`).then(r => r.json()).then(d => setCalls(d.calls || []))
  }, [page])

  const filtered = calls.filter(c => {
    const matchesFilter = filter === "all" || c.outcome === filter
    const matchesSearch = !search ||
      c.fromNumber?.includes(search) ||
      c.serviceMentioned?.toLowerCase().includes(search.toLowerCase()) ||
      c.summary?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search calls..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["all", "booked", "missed", "qualified"].map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Caller</th>
                  <th className="px-5 py-3">Service & Address</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Revenue</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-medium text-sm">{call.fromNumber}</div>
                      <div className="text-xs text-slate-500">{new Date(call.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-slate-700">{call.serviceMentioned || "—"}</div>
                      <div className="text-xs text-slate-500">{call.addressMentioned || "—"}</div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={statusColors[call.outcome] || statusColors.PENDING}>
                        {call.outcome?.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, "0")}` : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium">
                      {call.revenue ? `$${Number(call.revenue).toFixed(0)}` : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => setSelectedCall(call)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play size={14} className="mr-1" /> Listen
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedCall && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Call Recording</h3>
                <p className="text-sm text-slate-500">{selectedCall.fromNumber}</p>
              </div>
              <button onClick={() => { setSelectedCall(null); setPlaying(false) }} className="p-1 hover:bg-slate-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Button onClick={() => setPlaying(!playing)} className="h-12 w-12 rounded-full p-0">
                  {playing ? <Pause size={20} /> : <Play size={20} />}
                </Button>
                <div className="flex-1">
                  <div className="h-2 bg-slate-200 rounded-full" />
                </div>
                <Volume2 size={20} className="text-slate-400" />
              </div>
              <div className="bg-slate-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedCall.transcript || "Transcript not available yet."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
