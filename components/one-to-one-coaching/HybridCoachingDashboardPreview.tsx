function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-zinc-500">{sub}</p> : null}
    </div>
  );
}

export function HybridCoachingDashboardPreview() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-5 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F4D23C]">
            Athlete dashboard preview
          </p>
          <h3 className="mt-1 text-xl font-bold text-white md:text-2xl">Your coaching hub</h3>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase text-emerald-400">
          Week 4 · On track
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#F4D23C]/25 bg-[#F4D23C]/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#F4D23C]">
              Today&apos;s session
            </p>
            <p className="mt-2 text-lg font-bold text-white">Upper Strength + Threshold Support</p>
            <p className="mt-1 text-sm text-zinc-400">RPE 7–8 · 55 min · Key session</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Weekly check-in" value="Due Sun" sub="Sleep · stress · soreness" />
            <StatTile label="Bodyweight" value="78.4 kg" sub="Trend ↓ 0.6 kg" />
            <StatTile label="5K benchmark" value="16:42" sub="Target 16:30" />
            <StatTile label="Squat" value="140 kg × 5" sub="+5 kg block progress" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
            This week
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {[
              "Mon — Upper strength",
              "Tue — Threshold run",
              "Wed — Conditioning",
              "Thu — Lower strength",
              "Sat — Hybrid session",
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-[#F4D23C]">→</span>
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-zinc-500">
            {["Session log", "RPE notes", "Coach notes", "Nutrition"].map((f) => (
              <span key={f} className="rounded-lg border border-dashed border-zinc-800 px-2 py-2 text-center">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
