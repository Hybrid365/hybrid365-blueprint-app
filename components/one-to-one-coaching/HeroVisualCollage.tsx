import Image from "next/image";

function OverlayStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/15 bg-black/75 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md ${className ?? ""}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#f4d23c]">{label}</p>
      <p className="mt-0.5 text-sm font-bold leading-snug text-white">{value}</p>
    </div>
  );
}

export function HeroVisualCollage() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
      <div className="relative min-h-[440px] sm:min-h-[520px]">
        {/* Main hero photo */}
        <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <Image
            src="/images/community/lean muscle phisique photo.jpg"
            alt="Kieran Higgs — lean athletic physique"
            fill
            className="object-cover object-center brightness-[0.82] contrast-[1.08]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/20 to-[#f4d23c]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
        </div>

        {/* Secondary — running */}
        <div className="absolute -left-2 top-8 z-10 h-[140px] w-[110px] overflow-hidden rounded-2xl border-2 border-[#f4d23c]/40 shadow-xl sm:-left-4 sm:h-[168px] sm:w-[130px]">
          <Image
            src="/images/community/running.jpg"
            alt="Running performance"
            fill
            className="object-cover brightness-[0.75]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        {/* Secondary — strength */}
        <div className="absolute -right-2 bottom-24 z-10 h-[130px] w-[100px] overflow-hidden rounded-2xl border border-white/20 shadow-xl sm:-right-4 sm:h-[150px] sm:w-[120px]">
          <Image
            src="/images/community/run and lift in one photo.jpg"
            alt="Strength and hybrid training"
            fill
            className="object-cover brightness-[0.72]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        {/* Overlay stats */}
        <OverlayStat
          label="5K benchmark"
          value="16:00"
          className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6"
        />
        <OverlayStat
          label="Hybrid proof"
          value="Lean muscle + performance"
          className="absolute bottom-28 right-2 z-20 max-w-[180px] sm:bottom-32 sm:right-4 sm:max-w-[200px]"
        />
        <OverlayStat
          label="Training system"
          value="Strength + running combined"
          className="absolute bottom-4 left-4 right-4 z-20 sm:left-6 sm:right-auto sm:max-w-[240px]"
        />

        {/* Subtle app chip — not dominant */}
        <div className="absolute bottom-4 right-4 z-20 hidden rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-white/60 backdrop-blur-sm sm:block">
          Athlete app included
        </div>
      </div>
    </div>
  );
}
