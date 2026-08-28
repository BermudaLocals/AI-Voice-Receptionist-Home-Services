"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function SettingsForm({ business }: { business: any }) {
  const [form, setForm] = useState({
    name: business.name || "",
    phone: business.phone || "",
    email: business.email || "",
    address: business.address || "",
    timezone: business.timezone || "America/New_York",
    greetingScript: business.greetingScript || "",
    voiceStyle: business.voiceStyle || "friendly-professional",
    holdMessage: business.holdMessage || "",
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Settings saved successfully")
      } else {
        toast.error("Failed to save settings")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
    setSaving(false)
  }

  const sections = [
    {
      title: "Business Profile",
      description: "Your business name, hours, and contact info",
      fields: [
        { label: "Business Name", key: "name", type: "input" },
        { label: "Phone Number", key: "phone", type: "input", placeholder: "+15551234567" },
        { label: "Email", key: "email", type: "input" },
        { label: "Address", key: "address", type: "input" },
      ],
    },
    {
      title: "AI Voice & Tone",
      description: "Customize how your AI sounds and speaks",
      fields: [
        { label: "Voice Style", key: "voiceStyle", type: "select", options: [
          { value: "friendly-professional", label: "Friendly Professional" },
          { value: "casual", label: "Casual & Relaxed" },
          { value: "formal", label: "Formal & Polite" },
          { value: "energetic", label: "Energetic & Enthusiastic" },
        ]},
        { label: "Greeting Script", key: "greetingScript", type: "textarea" },
        { label: "Hold Message", key: "holdMessage", type: "textarea" },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {section.fields.map((field: any) => (
                <div key={field.key}>
                  <Label className="mb-1.5 block">{field.label}</Label>
                  {field.type === "input" && (
                    <Input
                      value={form[field.key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                    />
                  )}
                  {field.type === "textarea" && (
                    <Textarea
                      value={form[field.key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      rows={3}
                    />
                  )}
                  {field.type === "select" && (
                    <Select value={form[field.key as keyof typeof form]} onValueChange={v => setForm({ ...form, [field.key]: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt: any) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
