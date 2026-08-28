"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Phone, CreditCard, Zap } from "lucide-react"

export function BillingDashboard() {
  const [billing, setBilling] = useState<any>(null)

  useEffect(() => {
    fetch("/api/billing").then(r => r.json()).then(setBilling)
  }, [])

  if (!billing) return <div className="h-96 animate-pulse bg-slate-100 rounded-xl" />

  const { business, usage, plans } = billing
  const percentUsed = typeof usage?.limit === "number" ? Math.min(100, (usage.used / usage.limit) * 100) : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Current Plan: {business?.plan}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {plans?.find((p: any) => p.id === business?.plan)?.price ? `$${plans.find((p: any) => p.id === business?.plan).price}/month` : ""}
            </p>
          </div>
          <Badge className={business?.planStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
            {business?.planStatus}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Usage this billing period</span>
              <span className="font-semibold">{usage?.used} / {usage?.limit} calls</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${percentUsed}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Resets on {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString() : "—"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold">{usage?.used || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Calls Handled</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold">${usage?.overageCost?.toFixed(2) || "0.00"}</div>
              <div className="text-xs text-slate-500 mt-1">Overage Fees</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold">$0</div>
              <div className="text-xs text-slate-500 mt-1">Revenue Captured</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {plans?.map((plan: any) => (
              <div key={plan.id} className={`p-4 rounded-xl border-2 transition-colors ${business?.plan === plan.id ? "border-blue-500 bg-blue-50/30" : "border-slate-100 hover:border-slate-200"}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{plan.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{plan.calls} calls/mo</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">${plan.price}<span className="text-sm font-normal text-slate-500">/mo</span></div>
                    {business?.plan === plan.id ? (
                      <span className="text-xs text-blue-600 font-medium">Current Plan</span>
                    ) : (
                      <Button size="sm" onClick={async () => {
                        const res = await fetch("/api/billing/checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ plan: plan.id }),
                        })
                        const data = await res.json()
                        if (data.url) window.location.href = data.url
                      }}>Upgrade</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
