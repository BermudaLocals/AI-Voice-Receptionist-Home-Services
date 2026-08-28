"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Phone, Calendar, CreditCard, Settings, Mic, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
  { href: "/", label: "Overview", icon: BarChart3 },
  { href: "/calls", label: "Call Logs", icon: Phone },
  { href: "/bookings", label: "Bookings", icon: Calendar },
  { href: "/billing", label: "Billing & Plan", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-slate-900 text-white rounded-lg"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r bg-slate-900 text-white transition-transform lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <Mic size={18} />
          </div>
          <span className="text-lg font-bold">ReceptionAI</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-4">
          <button className="flex w-full items-center gap-3 text-sm text-slate-400 hover:text-white">
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
