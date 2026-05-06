import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hybrid365 Community | Become Fast, Fit & Strong",
  description:
    "Join the Hybrid365 Coaching Community. Personalised 12-week programmes, education, accountability and community. Run a sub-20 5km while still lifting heavy.",
}

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-[#F4D23C]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg
      className="h-16 w-16 md:h-20 md:w-20 text-[#F4D23C]"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg
      className="h-8 w-8 text-[#F4D23C]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section with Full Background Image */}
      <section className="relative min-h-screen flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Main%20Hero%20photo%20of%20me-zCqukxYjgs6FjIJtn59BbS95kTQQwg.jpg"
            alt="Hybrid365 Training"
            fill
            className="object-cover object-top"
            priority
          />
          {/* Dark cinematic overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
        </div>

        <div className="relative z-10 px-5 md:px-8 py-20 md:py-24 lg:py-28 w-full">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Copy */}
              <div>
                <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-4">
                  Hybrid365 Coaching Community
                </p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight leading-[1.1] text-balance">
                  Become{" "}
                  <span className="text-[#F4D23C]">Fast</span>,{" "}
                  <span className="text-[#F4D23C]">Fit</span> &{" "}
                  <span className="text-[#F4D23C]">Strong</span>
                </h1>
                <p className="mt-6 text-lg md:text-xl text-white/80 leading-relaxed max-w-xl">
                  A personalised 12-week hybrid programme with education, community, 
                  accountability and a training roadmap built around your goals. 
                  Learn how to run fast without giving up strength and muscle.
                </p>
                
                {/* Trust Points */}
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
                  <span className="flex items-center gap-2">
                    <CheckIcon />
                    Personalised Programme
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckIcon />
                    60+ Education Videos
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckIcon />
                    5km PB Guarantee
                  </span>
                </div>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <a
                    href="#pricing"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold uppercase tracking-wide bg-[#F4D23C] text-black rounded-full hover:bg-[#e5c535] transition-colors"
                  >
                    Join The Community
                  </a>
                  <a
                    href="#what-you-get"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold uppercase tracking-wide border-2 border-white/20 text-white rounded-full hover:border-white/40 transition-colors"
                  >
                    See What&apos;s Included
                  </a>
                </div>
              </div>

              {/* Right: VSL Video Embed */}
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                <iframe
                  src="https://www.youtube.com/embed/xXZQiItwU04?rel=0&modestbranding=1"
                  title="Hybrid365 Community Introduction"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Hybrid365 Works */}
      <section className="px-5 md:px-8 py-20 md:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-4">
                Why Hybrid365 Works
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white">
                Not Just Workouts.<br />
                <span className="text-[#F4D23C]">A Complete System.</span>
              </h2>
              <p className="mt-6 text-lg text-white/60 leading-relaxed">
                Most people train hard but without structure. Hybrid365 gives you a personalised 
                programme, education to understand the process, and a community of like-minded 
                people to keep you accountable.
              </p>
              <p className="mt-4 text-lg text-white/60 leading-relaxed">
                I personally run a <span className="text-white font-semibold">16:00 5km</span> while 
                still lifting heavy and staying strong. This isn&apos;t theory - it&apos;s a proven 
                system for real hybrid performance.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Personalised programme, not generic plans",
                  "Learn how to train, not just what to do",
                  "Community accountability and competition",
                  "Run faster without losing strength",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckIcon />
                    <span className="text-white/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative max-w-sm mx-auto lg:max-w-none">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lean%20muscle%20phisique%20photo-hM8smeKOTT1IGFd3cZvv8mh4O6zXxv.jpg"
                  alt="Lean muscle physique - hybrid training results"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Overview */}
      <section id="what-you-get" className="px-5 md:px-8 py-20 md:py-28 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-4">
              Full Access Membership
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white text-balance">
              What You Get<span className="text-[#F4D23C]">.</span>
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              Everything you need to become fast, fit and strong - all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Personalised 12-Week Programme", desc: "A training roadmap built around your goals, schedule and focus" },
              { title: "Hybrid Performance Mastery", desc: "60+ education videos covering training, nutrition & recovery" },
              { title: "Goal-Specific Training Tracks", desc: "Follow your path: Lean Muscle, Hybrid or Hyrox Performance" },
              { title: "Complete Running Programmes", desc: "5K, 10K, half marathon and marathon structured plans" },
              { title: "Strength Training Library", desc: "Progressive programmes for functional strength" },
              { title: "Nutrition & Recipe Book", desc: "Fuelling education and 50+ performance recipes" },
              { title: "Community & Leaderboards", desc: "Compete, track progress and stay accountable" },
              { title: "Monthly Challenges & Prizes", desc: "Push yourself with monthly competitions" },
              { title: "Weekly Check-Ins", desc: "Structured accountability and progress tracking" },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 md:p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-[#F4D23C]/10 flex items-center justify-center">
                    <CheckIcon />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-white/50">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12-Week Personalised Programme - with Background Image */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/running-kQauOENBwXFjdmCg7gGc5c577MJgeQ.jpg"
            alt="Running training"
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/95 to-black/80" />
        </div>

        <div className="relative z-10 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-4">
                Built For You
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white">
                Your Personalised<br />
                <span className="text-[#F4D23C]">12-Week Programme</span>
              </h2>
              <p className="mt-6 text-lg text-white/60 leading-relaxed">
                When you join, you&apos;re not just getting access to a content library. 
                You&apos;ll receive a <span className="text-white font-semibold">personalised 12-week programme</span> built 
                around your specific goal, training level, schedule and focus area.
              </p>
              <p className="mt-4 text-lg text-white/60 leading-relaxed">
                This is structured coaching without the expensive 1-1 price tag.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Tailored to your current fitness level",
                  "Built around your weekly schedule",
                  "Focused on your specific goal",
                  "Clear progression week by week",
                  "Combines running, strength and hybrid sessions",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckIcon />
                    <span className="text-white/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative max-w-md mx-auto lg:max-w-none">
              {/* Code-based visual instead of low-quality graphic */}
              <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="text-center mb-6">
                  <span className="inline-block px-3 py-1 text-xs font-bold uppercase bg-[#F4D23C] text-black rounded-full mb-3">
                    Your Programme
                  </span>
                  <h3 className="text-xl font-bold uppercase text-white">12-Week Blueprint</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { week: "Weeks 1-4", phase: "Foundation", focus: "Build base fitness & movement quality" },
                    { week: "Weeks 5-8", phase: "Development", focus: "Progressive overload & intensity" },
                    { week: "Weeks 9-12", phase: "Performance", focus: "Peak performance & race prep" },
                  ].map((item) => (
                    <div key={item.week} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-[#F4D23C]">{item.week}</span>
                        <span className="text-xs text-white/50 uppercase">{item.phase}</span>
                      </div>
                      <p className="text-sm text-white/60">{item.focus}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-center text-sm text-white/50">
                    Personalised to your goals, schedule & fitness level
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Goal-Specific Tracks - with Background */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lean%20muscle%20phisique%20photo-hM8smeKOTT1IGFd3cZvv8mh4O6zXxv.jpg"
            alt="Strength training"
            fill
            className="object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-zinc-950" />
        </div>

        <div className="relative z-10 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-4">
              Choose Your Path
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white text-balance">
              Goal-Specific Tracks<span className="text-[#F4D23C]">.</span>
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              Your programme is built around your goal. Choose the track that fits where you want to go.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Build Lean Muscle */}
            <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[#F4D23C]/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#F4D23C]/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#F4D23C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold uppercase text-white mb-3">Build Lean Muscle</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Focused on building muscle and strength while maintaining cardiovascular fitness. 
                Perfect if your main goal is physique and functional strength.
              </p>
              <ul className="mt-6 space-y-2">
                {["Strength-focused programming", "Muscle building protocols", "Strategic cardio balance"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hybrid Performance */}
            <div className="p-6 md:p-8 rounded-2xl border-2 border-[#F4D23C]/50 bg-[#F4D23C]/5 relative">
              <div className="absolute -top-3 left-6">
                <span className="px-3 py-1 text-xs font-bold uppercase bg-[#F4D23C] text-black rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#F4D23C]/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#F4D23C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold uppercase text-white mb-3">Hybrid Performance</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                The complete hybrid athlete track. Build strength, improve running performance 
                and look your best - all at the same time.
              </p>
              <ul className="mt-6 space-y-2">
                {["Balanced running + strength", "Fast 5K while staying strong", "Complete hybrid programming"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hyrox Performance */}
            <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[#F4D23C]/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#F4D23C]/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#F4D23C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
              </div>
              <h3 className="text-xl font-bold uppercase text-white mb-3">Hyrox Performance</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Race-specific programming for Hyrox athletes. Improve your running splits, 
                dominate the workout stations and set a new PB.
              </p>
              <ul className="mt-6 space-y-2">
                {["Hyrox race preparation", "Station-specific training", "Running + functional fitness"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Education / Hybrid Performance Mastery */}
      <section className="px-5 md:px-8 py-20 md:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 relative max-w-md mx-auto lg:max-w-none">
              {/* Athlete Dashboard UI */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/80 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4D23C] to-[#e5c535] flex items-center justify-center text-black font-bold text-sm">
                      JD
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">James Davidson</p>
                      <p className="text-xs text-white/50">Hybrid Performance Track</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-[#F4D23C]/10 text-[#F4D23C] rounded-full">Week 8</span>
                </div>
                
                {/* Stats Grid */}
                <div className="p-5 grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                    <p className="text-xl font-bold text-[#F4D23C]">18:42</p>
                    <p className="text-xs text-white/50 mt-1">5km PB</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                    <p className="text-xl font-bold text-white">120kg</p>
                    <p className="text-xs text-white/50 mt-1">Deadlift</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                    <p className="text-xl font-bold text-white">87%</p>
                    <p className="text-xs text-white/50 mt-1">Adherence</p>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="px-5 pb-4">
                  <p className="text-xs text-white/50 uppercase tracking-wide mb-3">This Week&apos;s Progress</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/70">Running Volume</span>
                        <span className="text-xs text-[#F4D23C]">24/28km</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-[#F4D23C] to-[#e5c535]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/70">Strength Sessions</span>
                        <span className="text-xs text-[#F4D23C]">3/4</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-[#F4D23C] to-[#e5c535]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/70">Education Modules</span>
                        <span className="text-xs text-[#F4D23C]">42/60</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-[#F4D23C] to-[#e5c535]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="px-5 pb-5">
                  <p className="text-xs text-white/50 uppercase tracking-wide mb-3">Recent Activity</p>
                  <div className="space-y-2">
                    {[
                      { activity: "Completed: Tempo Run 6km", time: "Today" },
                      { activity: "PR: Back Squat 100kg", time: "Yesterday" },
                      { activity: "Watched: Nutrition Module 3", time: "2 days ago" },
                    ].map((item) => (
                      <div key={item.activity} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-xs text-white/70">{item.activity}</span>
                        <span className="text-xs text-white/40">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-4">
                Learn How To Train
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white">
                Hybrid Performance<br />
                <span className="text-[#F4D23C]">Mastery Course</span>
              </h2>
              <p className="mt-6 text-lg text-white/60 leading-relaxed">
                This isn&apos;t just workouts - it&apos;s education. The Hybrid Performance Mastery 
                course teaches you <span className="text-white font-semibold">how to train</span>, not 
                just what to do. Understand the process so you can train smart for life.
              </p>
              <p className="mt-4 text-lg text-white/60 leading-relaxed">
                60+ video lessons covering everything from programming principles to nutrition, 
                recovery science to race day strategy.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {[
                  "Training Programming",
                  "Nutrition & Fuelling",
                  "Recovery Science",
                  "Race Day Strategy",
                  "Hybrid Periodisation",
                  "Mindset & Performance",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckIcon />
                    <span className="text-sm text-white/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Running + Strength Proof - Full Width with Background */}
      <section className="relative py-24 md:py-32">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/run%20and%20lift%20in%20one%20photo-Y0EZCqg9w440nlb1PZUd44fD5QwShO.jpg"
            alt="Run and lift - hybrid training"
            fill
            className="object-cover"
          />
          {/* Dark cinematic overlay */}
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />
        </div>

        <div className="relative z-10 px-5 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-4">
              Proof It Works
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white">
              Run Fast.<br />
              <span className="text-[#F4D23C]">Stay Strong.</span>
            </h2>
            <p className="mt-6 text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
              You don&apos;t have to choose between running performance and strength. 
              I run a <span className="text-white font-semibold">16:00 5km</span> while still 
              lifting heavy and maintaining muscle. The Hybrid365 system is built on this principle.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <div className="px-6 py-4 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm">
                <span className="text-3xl font-bold text-[#F4D23C]">16:00</span>
                <p className="text-xs text-white/60 uppercase mt-1">5km Time</p>
              </div>
              <div className="px-6 py-4 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm">
                <span className="text-3xl font-bold text-[#F4D23C]">Heavy</span>
                <p className="text-xs text-white/60 uppercase mt-1">Lifting</p>
              </div>
              <div className="px-6 py-4 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm">
                <span className="text-3xl font-bold text-[#F4D23C]">Lean</span>
                <p className="text-xs text-white/60 uppercase mt-1">Physique</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hyrox Training - Full Width with Background */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hyrox%201-RrQHeIBGbPULQkn43iJkPCK9mMN5SY.jpg"
            alt="Hyrox race - burpee broad jumps"
            fill
            className="object-cover"
          />
          {/* Dark cinematic overlay */}
          <div className="absolute inset-0 bg-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/90" />
        </div>

        <div className="relative z-10 px-5 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-4">
              Hyrox Training
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white">
              Race Day<br />
              <span className="text-[#F4D23C]">Ready.</span>
            </h2>
            <p className="mt-6 text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
              Dedicated Hyrox programming to get you race-ready. Improve your running splits, 
              dominate the workout stations, and set a new personal best when it counts.
            </p>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { title: "Race Prep", desc: "Periodised programming" },
                { title: "Stations", desc: "Station-specific training" },
                { title: "Running", desc: "Pacing & efficiency" },
                { title: "Simulation", desc: "Full race simulations" },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm">
                  <span className="font-bold text-white">{item.title}</span>
                  <p className="text-xs text-white/60 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community / Leaderboards / Prizes */}
      <section className="px-5 md:px-8 py-20 md:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 relative max-w-md mx-auto lg:max-w-none">
              {/* Leaderboard UI */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/80 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Community Leaderboard</h3>
                    <p className="text-xs text-white/50">May Challenge: Most Workouts Completed</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-[#F4D23C]/10 text-[#F4D23C] rounded-full">Live</span>
                </div>
                
                {/* Leaderboard List */}
                <div className="p-4">
                  {[
                    { rank: 1, name: "Marcus T.", points: 2450, workouts: 28, badge: "gold" },
                    { rank: 2, name: "Sarah K.", points: 2280, workouts: 26, badge: "silver" },
                    { rank: 3, name: "James D.", points: 2150, workouts: 25, badge: "bronze" },
                    { rank: 4, name: "Emily R.", points: 1980, workouts: 23, badge: null },
                    { rank: 5, name: "Tom W.", points: 1850, workouts: 21, badge: null },
                  ].map((member) => (
                    <div 
                      key={member.rank} 
                      className={`flex items-center gap-4 p-3 rounded-xl mb-2 last:mb-0 ${
                        member.rank === 1 ? 'bg-[#F4D23C]/10 border border-[#F4D23C]/20' : 'bg-white/[0.02]'
                      }`}
                    >
                      {/* Rank */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        member.badge === 'gold' ? 'bg-[#F4D23C] text-black' :
                        member.badge === 'silver' ? 'bg-gray-300 text-black' :
                        member.badge === 'bronze' ? 'bg-amber-600 text-white' :
                        'bg-white/10 text-white/50'
                      }`}>
                        {member.rank}
                      </div>
                      
                      {/* Name & Workouts */}
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{member.name}</p>
                        <p className="text-xs text-white/50">{member.workouts} workouts</p>
                      </div>
                      
                      {/* Points */}
                      <div className="text-right">
                        <p className="font-bold text-[#F4D23C]">{member.points.toLocaleString()}</p>
                        <p className="text-xs text-white/50">points</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-white/10 bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F4D23C] to-[#e5c535] flex items-center justify-center text-black font-bold text-xs">
                        You
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Your position: <span className="text-white font-semibold">#12</span></p>
                        <p className="text-xs text-white/50">1,240 points - 14 workouts</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#F4D23C]">+180 this week</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-4">
                Accountability & Competition
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white">
                Community.<br />
                <span className="text-[#F4D23C]">Leaderboards. Prizes.</span>
              </h2>
              <p className="mt-6 text-lg text-white/60 leading-relaxed">
                This is a community of like-minded people who want to improve, compete and 
                refuse average. Monthly challenges, community leaderboards and prizes keep 
                you motivated and accountable.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Monthly fitness challenges with prizes",
                  "Community leaderboards to track progress",
                  "Compete alongside like-minded athletes",
                  "Weekly check-ins for accountability",
                  "Private community access",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckIcon />
                    <span className="text-white/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Nutrition Section */}
      <section className="px-5 md:px-8 py-20 md:py-28 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-4">
                Nutrition & Fuelling
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white">
                Fuel Your<br />
                <span className="text-[#F4D23C]">Performance</span>
              </h2>
              <p className="mt-6 text-lg text-white/60 leading-relaxed">
                Complete nutrition education and a recipe book with 50+ high-protein, 
                performance-focused recipes. Learn how to fuel around training sessions 
                for energy, recovery and results.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-3">
                {[
                  { title: "Fuelling Education", desc: "Learn how to fuel around training sessions" },
                  { title: "Recipe Book", desc: "50+ easy, high-protein performance recipes" },
                  { title: "Meal Plans", desc: "Flexible plans for every lifestyle" },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"
                  >
                    <span className="font-semibold text-white">{item.title}</span>
                    <p className="text-sm text-white/50">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative max-w-xs mx-auto lg:max-w-none">
              <div className="aspect-square rounded-2xl overflow-hidden border border-white/10">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Meal%20Prep%201-TZRCoFY4rRYnsLAYRMEQ0wtBhFDJiG.avif"
                  alt="Nutrition and Meal Prep"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5km PB Guarantee */}
      <section className="px-5 md:px-8 py-20 md:py-28 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 md:p-12 rounded-3xl border-2 border-[#F4D23C]/30 bg-gradient-to-b from-[#F4D23C]/5 to-transparent">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="shrink-0">
                <div className="w-20 h-20 rounded-full bg-[#F4D23C]/10 border-2 border-[#F4D23C]/30 flex items-center justify-center">
                  <ShieldIcon />
                </div>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-2">
                  Money-Back Guarantee
                </p>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white">
                  5km PB Guarantee
                </h2>
                <p className="mt-4 text-lg text-white/60 leading-relaxed max-w-2xl">
                  Follow the plan for 12 weeks and if you don&apos;t hit a 5km personal best, 
                  we&apos;ll refund you. No questions asked. That&apos;s how confident we are 
                  in this system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-5 md:px-8 py-20 md:py-28 bg-zinc-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#F4D23C] text-sm font-semibold uppercase tracking-widest mb-4">
              Join The Community
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white">
              Simple Pricing<span className="text-[#F4D23C]">.</span>
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Everything included. No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="rounded-3xl border border-[#F4D23C]/20 bg-gradient-to-b from-[#F4D23C]/5 to-transparent p-8 md:p-12">
            <div className="text-center">
              <div className="inline-block px-4 py-1 rounded-full bg-[#F4D23C] text-black text-sm font-bold uppercase mb-6">
                Full Access
              </div>

              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl md:text-7xl font-bold text-white">£29</span>
                <span className="text-xl text-white/50">/month</span>
              </div>

              <p className="mt-2 text-white/50">
                Billed monthly. Cancel anytime.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 text-left max-w-md mx-auto">
                {[
                  "Personalised 12-Week Programme",
                  "Performance Mastery Course",
                  "Goal-Specific Training Tracks",
                  "All Running Programmes",
                  "Strength Programmes",
                  "Nutrition & Recipes",
                  "Community & Leaderboards",
                  "5km PB Guarantee",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckIcon />
                    <span className="text-sm text-white/70">{item}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://whop.com/checkout/plan_JdjBrs5xpfpoN"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 w-full sm:w-auto inline-flex items-center justify-center px-12 py-5 text-lg font-bold uppercase tracking-wide bg-[#F4D23C] text-black rounded-full hover:bg-[#e5c535] transition-colors"
              >
                Join Hybrid365 Community
              </a>

              <p className="mt-6 text-sm text-white/40">
                By joining, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 border-t border-white/5">
        <div className="px-5 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white text-balance">
              Ready To Become{" "}
              <span className="text-[#F4D23C]">Fast, Fit & Strong</span>?
            </h2>
            <p className="mt-6 text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
              Join the community of athletes who refuse average. Get your personalised 
              programme, learn the system and start your transformation today.
            </p>
            <a
              href="https://whop.com/checkout/plan_JdjBrs5xpfpoN"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center justify-center px-12 py-5 text-lg font-bold uppercase tracking-wide bg-[#F4D23C] text-black rounded-full hover:bg-[#e5c535] transition-colors"
            >
              Start Your Journey Today
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 md:px-8 py-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Hybrid365. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}