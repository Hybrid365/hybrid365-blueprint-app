import { cn } from "@/lib/utils"

export function MockStatusBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 pt-2.5 text-[9px] font-semibold text-white/90",
        className
      )}
    >
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <span className="h-2 w-3 rounded-sm bg-white/80" />
        <span className="h-2 w-2.5 rounded-sm bg-white/80" />
        <span className="h-2.5 w-4 rounded-[3px] border border-white/50 bg-white/20" />
      </div>
    </div>
  )
}

type NavItem = {
  label: string
  active?: boolean
  icon: "home" | "programme" | "progress" | "checkin" | "team"
}

const NAV_ICONS: Record<NavItem["icon"], React.ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 3l9 8h-2v10h-5v-6H10v6H5V11H3l9-8z" />
    </svg>
  ),
  programme: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 3v4M16 3v4M4 11h16" />
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 18v-4M9 18V8M14 18v-6M20 18V4" />
    </svg>
  ),
  checkin: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="10" r="2.5" />
      <path d="M4 18c0-2.5 2.2-4 5-4s5 1.5 5 4M13 18c0-1.8 1.3-3 3-3" />
    </svg>
  ),
}

export function MockBottomNav({ active = "home" }: { active?: NavItem["icon"] }) {
  const items: NavItem[] = [
    { label: "Home", icon: "home" },
    { label: "Programme", icon: "programme" },
    { label: "Progress", icon: "progress" },
    { label: "Check-In", icon: "checkin" },
    { label: "Team", icon: "team" },
  ]

  return (
    <div className="border-t border-white/[0.08] bg-[#0a0a0a] px-1 pb-1 pt-1.5">
      <div className="flex justify-around">
        {items.map((item) => {
          const isActive = item.icon === active
          return (
            <div
              key={item.label}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1",
                isActive ? "text-[#f4d23c]" : "text-white/35"
              )}
            >
              {isActive ? (
                <span className="mb-0.5 h-0.5 w-5 rounded-full bg-[#f4d23c]" />
              ) : (
                <span className="mb-0.5 h-0.5 w-5" />
              )}
              {NAV_ICONS[item.icon]}
              <span className="text-[7px] font-semibold">{item.label}</span>
            </div>
          )
        })}
      </div>
      <div className="mx-auto mt-1.5 h-1 w-20 rounded-full bg-white/20" />
    </div>
  )
}
