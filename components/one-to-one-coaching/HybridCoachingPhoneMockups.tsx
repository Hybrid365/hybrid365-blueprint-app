import { cn } from "@/lib/utils";
import { IPhoneFrame } from "@/components/hyrox-landing/IPhoneFrame";
import { MockBottomNav, MockStatusBar } from "@/components/hyrox-landing/mockup/MockScreenChrome";

function ScreenLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
      {children}
    </p>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
      <span className="text-[8px] text-white/45">{label}</span>
      <span className="text-[9px] font-bold text-white">{value}</span>
    </div>
  );
}

export function TodaySessionPhone({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <div>
      <IPhoneFrame size={size} density={size === "sm" ? "compact" : "default"}>
        <div className="flex h-full min-h-0 flex-col bg-black">
          <MockStatusBar />
          <div className="flex-1 overflow-hidden px-2.5 pb-1 pt-0.5">
            <p className="text-[8px] font-black uppercase tracking-wide text-[#f4d23c]">
              Hybrid365 Athlete
            </p>
            <h3 className="text-sm font-bold text-white">Today&apos;s Focus</h3>
            <div className="mt-2 rounded-xl border border-[#f4d23c]/30 bg-[#f4d23c]/10 p-2">
              <p className="text-[10px] font-bold text-white">Lower Strength + Conditioning</p>
              <p className="mt-1 text-[8px] text-white/50">55 min · RPE 7–8 · Key session</p>
            </div>
            <div className="mt-2 space-y-1">
              <MiniRow label="Warm-up" value="10 min" />
              <MiniRow label="Main set" value="5 × 5 squat" />
              <MiniRow label="Conditioning" value="12 min bike" />
            </div>
            <p className="mt-2 text-[7px] leading-snug text-white/40">
              Coach note: Controlled strength — leave reps in the tank on final set.
            </p>
            <button
              type="button"
              className="mt-2 w-full rounded-lg bg-[#f4d23c] py-1.5 text-[8px] font-black text-black"
            >
              Log result
            </button>
          </div>
          <MockBottomNav active="home" />
        </div>
      </IPhoneFrame>
      <ScreenLabel>Today&apos;s session</ScreenLabel>
    </div>
  );
}

export function ProgrammePhone({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <div>
      <IPhoneFrame size={size} density={size === "sm" ? "compact" : "default"}>
        <div className="flex h-full min-h-0 flex-col bg-black">
          <MockStatusBar />
          <div className="flex-1 overflow-hidden px-2.5 pb-1 pt-0.5">
            <p className="text-[8px] font-black uppercase text-[#f4d23c]">Week 4 · Build phase</p>
            <h3 className="text-sm font-bold text-white">Your programme</h3>
            <div className="mt-2 space-y-1">
              {[
                { day: "Mon", title: "Upper strength", tag: "Strength" },
                { day: "Tue", title: "Threshold run", tag: "Run" },
                { day: "Wed", title: "Conditioning", tag: "Engine" },
                { day: "Thu", title: "Lower strength", tag: "Strength" },
                { day: "Sat", title: "Hybrid session", tag: "Hybrid" },
              ].map((s) => (
                <div
                  key={s.day}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5"
                >
                  <span className="text-[8px] font-black text-[#f4d23c]">{s.day}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[9px] font-bold text-white">{s.title}</p>
                    <p className="text-[7px] text-white/40">{s.tag}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <MockBottomNav active="programme" />
        </div>
      </IPhoneFrame>
      <ScreenLabel>Programme</ScreenLabel>
    </div>
  );
}

export function ProgressPhone({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <div>
      <IPhoneFrame size={size} density={size === "sm" ? "compact" : "default"}>
        <div className="flex h-full min-h-0 flex-col bg-black">
          <MockStatusBar />
          <div className="flex-1 overflow-hidden px-2.5 pb-1 pt-0.5">
            <p className="text-[8px] font-black uppercase text-[#f4d23c]">Progress</p>
            <h3 className="text-sm font-bold text-white">Your trends</h3>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5">
                <p className="text-[7px] text-white/40">Bodyweight</p>
                <p className="text-[10px] font-black text-white">78.4 kg</p>
                <p className="text-[7px] text-emerald-400">↓ 0.6 kg</p>
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5">
                <p className="text-[7px] text-white/40">5K</p>
                <p className="text-[10px] font-black text-white">16:42</p>
                <p className="text-[7px] text-[#f4d23c]">Target 16:30</p>
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5">
                <p className="text-[7px] text-white/40">Squat</p>
                <p className="text-[10px] font-black text-white">140×5</p>
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5">
                <p className="text-[7px] text-white/40">Completion</p>
                <p className="text-[10px] font-black text-white">92%</p>
              </div>
            </div>
            <div className="mt-2 h-8 rounded-lg border border-dashed border-white/10 bg-white/[0.02]" />
            <p className="mt-1 text-[7px] text-white/35">Threshold volume · strength · benchmarks</p>
          </div>
          <MockBottomNav active="progress" />
        </div>
      </IPhoneFrame>
      <ScreenLabel>Progress</ScreenLabel>
    </div>
  );
}

export function CheckInPhone({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <div>
      <IPhoneFrame size={size} density={size === "sm" ? "compact" : "default"}>
        <div className="flex h-full min-h-0 flex-col bg-black">
          <MockStatusBar />
          <div className="flex-1 overflow-hidden px-2.5 pb-1 pt-0.5">
            <p className="text-[8px] font-black uppercase text-[#f4d23c]">Weekly check-in</p>
            <h3 className="text-sm font-bold text-white">Week 4 review</h3>
            <div className="mt-2 space-y-1">
              {["Sleep", "Energy", "Stress", "Soreness", "Bodyweight"].map((f) => (
                <MiniRow key={f} label={f} value="Logged" />
              ))}
            </div>
            <div className="mt-2 rounded-lg border border-[#f4d23c]/25 bg-[#f4d23c]/5 p-2">
              <p className="text-[7px] font-black uppercase text-[#f4d23c]">Coach review</p>
              <p className="mt-0.5 text-[8px] leading-snug text-white/55">
                Threshold felt controlled — keep volume, add 5 min easy run Friday.
              </p>
            </div>
          </div>
          <MockBottomNav active="checkin" />
        </div>
      </IPhoneFrame>
      <ScreenLabel>Check-in</ScreenLabel>
    </div>
  );
}

export function NutritionPhone({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <div>
      <IPhoneFrame size={size} density={size === "sm" ? "compact" : "default"}>
        <div className="flex h-full min-h-0 flex-col bg-black">
          <MockStatusBar />
          <div className="flex-1 overflow-hidden px-2.5 pb-1 pt-0.5">
            <p className="text-[8px] font-black uppercase text-[#f4d23c]">Nutrition library</p>
            <h3 className="text-sm font-bold text-white">Resources</h3>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {["30+ recipes", "Cookbooks", "Meal prep", "High protein"].map((t) => (
                <div
                  key={t}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 text-center"
                >
                  <p className="text-[8px] font-bold text-white">{t}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 space-y-1">
              {["Chicken rice bowl", "Overnight oats", "Steak + veg"].map((m) => (
                <div
                  key={m}
                  className="rounded-lg border border-white/[0.08] px-2 py-1 text-[8px] text-white/70"
                >
                  {m}
                </div>
              ))}
            </div>
          </div>
          <MockBottomNav active="home" />
        </div>
      </IPhoneFrame>
      <ScreenLabel>Nutrition</ScreenLabel>
    </div>
  );
}

/** Compact gallery: session, programme, progress, check-in (+ nutrition on lg) */
export function HybridCoachingPhoneGalleryCompact({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <div className="flex min-w-max items-end justify-center gap-4 px-2 md:gap-6 lg:min-w-0 lg:grid lg:grid-cols-4 lg:gap-4">
        <TodaySessionPhone size="sm" />
        <ProgrammePhone size="sm" />
        <ProgressPhone size="sm" />
        <CheckInPhone size="sm" />
      </div>
      <p className="mt-4 text-center text-[10px] font-semibold uppercase tracking-wide text-white/30 lg:hidden">
        Swipe to see app previews
      </p>
    </div>
  );
}

/** @deprecated Hero no longer uses phone — use HeroVisualCollage */
export function HeroPhonePreview() {
  return (
    <div className="absolute -bottom-4 -right-2 z-20 sm:-right-4">
      <TodaySessionPhone size="sm" />
    </div>
  );
}

/** Main app section: horizontal scroll / grid of phones */
export function HybridCoachingPhoneGallery({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <div className="flex min-w-max items-end justify-center gap-4 px-2 md:gap-6 lg:min-w-0 lg:grid lg:grid-cols-5 lg:gap-4">
        <TodaySessionPhone size="sm" />
        <ProgrammePhone size="sm" />
        <ProgressPhone size="sm" />
        <CheckInPhone size="sm" />
        <NutritionPhone size="sm" />
      </div>
    </div>
  );
}

/** Compact 3-phone fan for app features section */
export function HybridCoachingPhoneFan() {
  return (
    <div className="relative mx-auto flex max-w-[680px] items-center justify-center py-4">
      <div className="relative hidden items-center justify-center sm:flex">
        <div className="-mr-8 shrink-0 -rotate-6 opacity-90">
          <ProgrammePhone size="sm" />
        </div>
        <div className="relative z-10 shrink-0">
          <TodaySessionPhone size="md" />
        </div>
        <div className="-ml-8 shrink-0 rotate-6 opacity-90">
          <ProgressPhone size="sm" />
        </div>
      </div>
      <div className="sm:hidden">
        <HybridCoachingPhoneGallery />
      </div>
    </div>
  );
}
