"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Phone, Building, MapPin, Mic } from "lucide-react"

export function OnboardingForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    greetingScript: "Hello! You've reached {{businessName}}. I'm your AI assistant. How can I help you today?",
    services: [{ name: "", description: "" }],
  })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Business profile created!")
        router.push("/")
      }
    } catch (e) {
      toast.error("Something went wrong")
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">{step}</div>
          <div className="h-1 flex-1 bg-slate-100 rounded-full">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>
        <CardTitle>
          {step === 1 && "Business Information"}
          {step === 2 && "AI Configuration"}
          {step === 3 && "Services Offered"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Business Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Mike's HVAC Services" />
            </div>
            <div>
              <Label>Business Phone</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+15551234567" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="mike@hvac.com" />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, Springfield" />
            </div>
            <Button className="w-full" onClick={() => setStep(2)} disabled={!form.name || !form.phone}>Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Greeting Script</Label>
              <Textarea value={form.greetingScript} onChange={e => setForm({ ...form, greetingScript: e.target.value })} rows={3} />
              <p className="text-xs text-slate-500 mt-1">Use {'{{businessName}}'} to auto-insert your business name</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {form.services.map((service, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-3">
                <Input
                  placeholder="Service name (e.g., AC Repair)"
                  value={service.name}
                  onChange={e => {
                    const newServices = [...form.services]
                    newServices[idx].name = e.target.value
                    setForm({ ...form, services: newServices })
                  }}
                />
                <Input
                  placeholder="Brief description"
                  value={service.description}
                  onChange={e => {
                    const newServices = [...form.services]
                    newServices[idx].description = e.target.value
                    setForm({ ...form, services: newServices })
                  }}
                />
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => setForm({ ...form, services: [...form.services, { name: "", description: "" }] })}>
              + Add Another Service
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? "Setting up..." : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
