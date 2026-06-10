const ITEMS = [
  "1-1 personalised programming",
  "Access to the Hybrid365 athlete app",
  "Weekly check-ins",
  "Programme adjustments based on feedback",
  "Strength, running and conditioning progression",
  "Benchmark testing",
  "Bodyweight and progress tracking",
  "Full nutrition library access",
  "30+ recipes and cookbooks",
  "Form/technique feedback where needed",
  "Coach support and accountability",
  "Invites to Hybrid365 team training meet-ups",
];

function TickIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function WhatsIncludedTickList() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-950/80 via-black to-zinc-950/60 p-6 sm:p-10">
      <div className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <div key={item} className="flex gap-3 text-sm font-semibold text-[#e9e9e9]">
            <TickIcon />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <p className="mt-8 border-t border-white/10 pt-6 text-sm text-[#a9a9a9]">
        This isn&apos;t a PDF plan. It&apos;s access to the full Hybrid365 coaching system —
        programming, app, check-ins, benchmarks and ongoing support.
      </p>
    </div>
  );
}
