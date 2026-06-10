const JOURNEY_STEPS = [
  {
    num: "01",
    title: "Apply",
    description:
      "You apply so I can understand your goals, training history and whether the system is the right fit.",
  },
  {
    num: "02",
    title: "Athlete assessment",
    description:
      "Full assessment covering goals, training availability, equipment, current level, injuries, nutrition and lifestyle.",
  },
  {
    num: "03",
    title: "Benchmark testing",
    description:
      "Establish key markers: 5K time, strength lifts, conditioning tests, bodyweight and progress photos where appropriate.",
  },
  {
    num: "04",
    title: "Programme build",
    description:
      "Your week is built around your goal, available days, recovery, ability and the balance between strength, running and conditioning.",
  },
  {
    num: "05",
    title: "Athlete app access",
    description:
      "Programme, sessions, targets, check-ins and resources delivered through your athlete dashboard.",
  },
  {
    num: "06",
    title: "Weekly check-ins",
    description:
      "Submit sleep, energy, stress, soreness, bodyweight, performance, wins, struggles and anything needing adjustment.",
  },
  {
    num: "07",
    title: "Coaching adjustments",
    description:
      "Programme reviewed and adjusted based on your feedback, progress and training response.",
  },
  {
    num: "08",
    title: "Accountability + team standards",
    description:
      "Stay accountable through the system, coach feedback and invites to Hybrid365 team training meet-ups.",
  },
  {
    num: "09",
    title: "Progress tracking",
    description:
      "Track strength, running, conditioning, body composition and consistency across the block.",
  },
];

export function HybridCoachingJourney() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {JOURNEY_STEPS.map((step) => (
        <div
          key={step.num}
          className="grid grid-cols-[48px_1fr] gap-3 rounded-[18px] border border-white/[0.11] bg-white/[0.045] p-4 sm:rounded-[22px] sm:p-[18px]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4d23c] text-sm font-black text-[#050505]">
            {step.num}
          </div>
          <div>
            <h3 className="m-0 mb-1.5 text-lg tracking-[-0.035em]">{step.title}</h3>
            <p className="m-0 text-sm leading-[1.4] text-[#a9a9a9]">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
