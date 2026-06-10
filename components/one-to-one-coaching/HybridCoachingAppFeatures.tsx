import { HybridCoachingPhoneFan } from "./HybridCoachingPhoneMockups";

const FEATURES = [
  "Today's session",
  "Full weekly programme",
  "Session logging",
  "RPE + notes",
  "Strength progression",
  "Running benchmarks",
  "Conditioning scores",
  "Bodyweight trends",
  "Weekly check-ins",
  "Coach notes",
  "Nutrition library",
  "Resources",
];

export function HybridCoachingAppFeatures() {
  return (
    <div>
      <HybridCoachingPhoneFan />
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <div
            key={feature}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm font-semibold text-white"
          >
            <span className="mr-1.5 text-[#f4d23c]">→</span>
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
}
