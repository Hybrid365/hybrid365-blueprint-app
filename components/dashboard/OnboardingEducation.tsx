import {
  CalendarCheck,
  ClipboardList,
  Flame,
  Gauge,
  LineChart,
  MessageCircle,
  Sparkles,
  Target,
  User,
} from "lucide-react";

const HOW_IT_WORKS = [
  { icon: User, text: "Assessment builds your athlete profile" },
  { icon: Gauge, text: "Baseline testing sets your starting point" },
  { icon: CalendarCheck, text: "Your 12-week programme gives you structure" },
  { icon: ClipboardList, text: "Session logs track execution" },
  { icon: Flame, text: "Habits build consistency" },
  { icon: LineChart, text: "Check-ins guide progress" },
  { icon: Target, text: "The Hybrid Challenge keeps you accountable" },
  { icon: MessageCircle, text: "Whop + Telegram give you community and coaching resources" },
] as const;

export function OnboardingWhopEmailNote() {
  return (
    <p className="mt-3 text-xs leading-relaxed text-zinc-500">
      Access is linked to your Whop email. Keep using the same email when logging into Hybrid365.
    </p>
  );
}

export function OnboardingStructureBlock() {
  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-black p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(250,204,21,0.06),transparent)]" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-yellow-400/90" aria-hidden />
          <h3 className="text-base font-bold tracking-tight text-white sm:text-lg">Structure beats motivation</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Hybrid365 is built to give you a clear weekly structure — so you know what to train, why you&apos;re doing it,
          and how it contributes to becoming stronger, fitter and faster.
        </p>
      </div>
    </div>
  );
}

export function OnboardingHowItWorksCard() {
  return (
    <div className="mt-6 rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Your system</p>
      <h3 className="mt-1.5 text-base font-bold text-white sm:text-lg">How Hybrid365 works</h3>
      <ul className="mt-4 space-y-3">
        {HOW_IT_WORKS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-3 text-sm leading-snug text-zinc-400">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/80 text-yellow-400/90">
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="min-w-0 pt-0.5">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
