"use client"
import { Bell } from "lucide-react"

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
      <div className="flex h-16 items-center justify-end px-4 lg:px-8 gap-4">
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
          MJ
        </div>
      </div>
    </header>
  )
}
