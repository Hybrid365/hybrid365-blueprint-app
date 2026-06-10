import Image from "next/image";

const PROOF_CARDS = [
  {
    stat: "16:00",
    label: "5K time",
    image: "/images/community/running.jpg",
    sub: "Speed without losing strength",
  },
  {
    stat: "Lean",
    label: "Muscle",
    image: "/images/community/lean muscle phisique photo.jpg",
    sub: "Athletic body composition",
  },
  {
    stat: "Heavy",
    label: "Lifting",
    image: "/images/community/run and lift in one photo.jpg",
    sub: "Strength that supports performance",
  },
  {
    stat: "1:08 → 59:14",
    label: "HYROX proof",
    image: "/images/hyrox-team/Hyrox-Result.jpg",
    sub: "Hybrid performance progression",
  },
];

export function HybridCoachingProofSection() {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">
        Built from real performance
      </p>
      <h2 className="mt-4 max-w-3xl text-[clamp(28px,4.5vw,52px)] font-black uppercase leading-[0.95] tracking-[-0.06em]">
        The system I built for myself is now the system I coach with.
      </h2>
      <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#d9d9d9] md:text-lg">
        I don&apos;t coach from theory. Hybrid365 is built around how I transformed my own
        performance: building lean muscle, lifting heavy, running a 16:00 5K and developing a body
        that could perform across strength, running and hybrid sport.
      </p>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#a9a9a9]">
        I wanted a body that didn&apos;t just look fit — I wanted one that could actually perform.
        The result was a training system built around strength, running, conditioning, recovery and
        progression. That system is now what I use to coach 1-1 athletes.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROOF_CARDS.map((card) => (
          <div
            key={card.label}
            className="group relative min-h-[220px] overflow-hidden rounded-[20px] border border-white/10 sm:rounded-[24px]"
          >
            <Image
              src={card.image}
              alt={card.label}
              fill
              className="object-cover brightness-[0.7] transition duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-2xl font-black uppercase leading-none tracking-tight text-white">
                {card.stat}
              </p>
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#f4d23c]">
                {card.label}
              </p>
              <p className="mt-1 text-xs text-white/60">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
