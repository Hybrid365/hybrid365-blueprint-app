import { cn } from "@/lib/utils";
import { IPhoneFrame } from "@/components/hyrox-landing/IPhoneFrame";
import { MockBottomNav, MockStatusBar } from "@/components/hyrox-landing/mockup/MockScreenChrome";

type MockProps = {
  size?: "sm" | "md";
  className?: string;
};

function MockLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[7px] font-black uppercase tracking-wider text-[#f4d23c]">
      {children}
    </p>
  );
}

export function HomepageTodaySessionMockup({ size = "md", className }: MockProps) {
  return (
    <IPhoneFrame size={size} density={size === "sm" ? "compact" : "default"} className={className}>
      <div className="flex h-full min-h-0 flex-col bg-black">
        <MockStatusBar />
        <div className="flex-1 overflow-hidden px-3 pb-2 pt-1">
          <MockLabel>Today&apos;s session</MockLabel>
          <h3 className="mt-1 text-sm font-bold text-white">Threshold Run + Strength</h3>
          <p className="text-[8px] text-white/45">Tuesday · 65 min · Week 3</p>
          <div className="mt-3 rounded-xl border border-[#f4d23c]/30 bg-[#f4d23c]/[0.07] p-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white">Aerobic threshold intervals</p>
              <span className="rounded-full bg-[#f4d23c] px-1.5 py-0.5 text-[7px] font-black text-[#050505]">
                Today
              </span>
            </div>
            <p className="mt-1 text-[8px] leading-snug text-white/55">
              4 × 8 min @ threshold · 2 min float recoveries
            </p>
            <p className="mt-2 rounded-lg bg-black/40 px-2 py-1 text-[8px] text-[#f4d23c]">
              Coach note: Hold controlled effort — finish strong, not destroyed.
            </p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {[
              { label: "Run", value: "40 min", sub: "Engine" },
              { label: "Lift", value: "25 min", sub: "Strength" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2">
                <p className="text-[7px] font-bold uppercase text-white/40">{item.label}</p>
                <p className="text-sm font-black text-white">{item.value}</p>
                <p className="text-[8px] text-white/40">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
        <MockBottomNav active="programme" />
      </div>
    </IPhoneFrame>
  );
}

export function HomepageWeeklyPlanMockup({ size = "md", className }: MockProps) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const sessions = ["Strength", "Run", "Hybrid", "Rest", "Threshold", "Long"];
  return (
    <IPhoneFrame size={size} density={size === "sm" ? "compact" : "default"} className={className}>
      <div className="flex h-full min-h-0 flex-col bg-black">
        <MockStatusBar />
        <div className="flex-1 overflow-hidden px-3 pb-2 pt-1">
          <MockLabel>Weekly plan</MockLabel>
          <h3 className="mt-1 text-sm font-bold text-white">Week 3 · Build block</h3>
          <p className="text-[8px] text-white/45">5 sessions · 6.5 hrs planned</p>
          <div className="mt-3 space-y-1.5">
            {days.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2 py-1.5",
                  i === 1 ? "border-[#f4d23c]/35 bg-[#f4d23c]/[0.08]" : "border-white/[0.08] bg-white/[0.03]"
                )}
              >
                <div>
                  <p className="text-[9px] font-bold text-white">{day}</p>
                  <p className="text-[8px] text-white/45">{sessions[i]}</p>
                </div>
                <span className="text-[8px] font-bold text-white/50">{i === 3 ? "—" : "✓"}</span>
              </div>
            ))}
          </div>
        </div>
        <MockBottomNav active="programme" />
      </div>
    </IPhoneFrame>
  );
}

export function HomepageProgressMockup({ size = "md", className }: MockProps) {
  return (
    <IPhoneFrame size={size} density={size === "sm" ? "compact" : "default"} className={className}>
      <div className="flex h-full min-h-0 flex-col bg-black">
        <MockStatusBar />
        <div className="flex-1 overflow-hidden px-3 pb-2 pt-1">
          <MockLabel>Progress</MockLabel>
          <h3 className="mt-1 text-sm font-bold text-white">Your dashboard</h3>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {[
              { label: "Completion", value: "92%", sub: "This block" },
              { label: "5K trend", value: "16:42", sub: "-18s" },
              { label: "Strength", value: "+12kg", sub: "Trap bar" },
              { label: "Consistency", value: "11 wks", sub: "Streak" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2">
                <p className="text-[7px] font-bold uppercase text-white/40">{item.label}</p>
                <p className="text-sm font-black text-white">{item.value}</p>
                <p className="text-[8px] text-[#f4d23c]">{item.sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full w-[72%] rounded-full bg-[#f4d23c]" />
          </div>
          <p className="mt-1 text-[8px] text-white/45">Block progress · Week 3 of 4</p>
        </div>
        <MockBottomNav active="progress" />
      </div>
    </IPhoneFrame>
  );
}

export function HomepageCheckInMockup({ size = "md", className }: MockProps) {
  return (
    <IPhoneFrame size={size} density={size === "sm" ? "compact" : "default"} className={className}>
      <div className="flex h-full min-h-0 flex-col bg-black">
        <MockStatusBar />
        <div className="flex-1 overflow-hidden px-3 pb-2 pt-1">
          <MockLabel>Weekly check-in</MockLabel>
          <h3 className="mt-1 text-sm font-bold text-white">Coach review</h3>
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
            <p className="text-[9px] font-bold text-white">How did Week 3 feel?</p>
            <div className="mt-2 flex gap-1">
              {["Fatigue", "Sessions", "Sleep", "Notes"].map((f) => (
                <span key={f} className="rounded-full border border-white/15 px-1.5 py-0.5 text-[7px] text-white/55">
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-2 rounded-xl border border-[#f4d23c]/25 bg-[#f4d23c]/[0.06] p-2.5">
            <p className="text-[8px] font-black uppercase text-[#f4d23c]">Coach feedback</p>
            <p className="mt-1 text-[8px] leading-snug text-white/70">
              Strong week. Threshold pace is improving — hold the same structure in Week 4.
            </p>
          </div>
        </div>
        <MockBottomNav active="checkin" />
      </div>
    </IPhoneFrame>
  );
}

export function HomepageBenchmarkMockup({ size = "md", className }: MockProps) {
  return (
    <IPhoneFrame size={size} density={size === "sm" ? "compact" : "default"} className={className}>
      <div className="flex h-full min-h-0 flex-col bg-black">
        <MockStatusBar />
        <div className="flex-1 overflow-hidden px-3 pb-2 pt-1">
          <MockLabel>Benchmarks</MockLabel>
          <h3 className="mt-1 text-sm font-bold text-white">Performance markers</h3>
          <div className="mt-3 space-y-1.5">
            {[
              { label: "HYROX Pro Solo", value: "59:14", delta: "-9:23" },
              { label: "5K", value: "16:00", delta: "-42s" },
              { label: "Trap bar", value: "180kg", delta: "+15kg" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-2">
                <div>
                  <p className="text-[8px] text-white/45">{item.label}</p>
                  <p className="text-sm font-black text-white">{item.value}</p>
                </div>
                <span className="text-[9px] font-bold text-[#f4d23c]">{item.delta}</span>
              </div>
            ))}
          </div>
        </div>
        <MockBottomNav active="progress" />
      </div>
    </IPhoneFrame>
  );
}

const MOCKUP_BY_ID = {
  today: HomepageTodaySessionMockup,
  weekly: HomepageWeeklyPlanMockup,
  progress: HomepageProgressMockup,
  checkin: HomepageCheckInMockup,
  benchmark: HomepageBenchmarkMockup,
} as const;

export function HomepageProductMockup({
  screenId,
  size = "sm",
  className,
}: {
  screenId: keyof typeof MOCKUP_BY_ID;
  size?: "sm" | "md";
  className?: string;
}) {
  const Component = MOCKUP_BY_ID[screenId];
  return <Component size={size} className={className} />;
}
