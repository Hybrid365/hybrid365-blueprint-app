import { PrototypeFrame } from "./PrototypeFrame";

export type WeekInReviewSocialProps = {
  weekLabel: string;
  completed: number;
  planned: number;
  focus: string;
};

export function WeekInReviewSocial({ weekLabel, completed, planned, focus }: WeekInReviewSocialProps) {
  return (
    <PrototypeFrame title="Week in Review · 9:16 prototype">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-yellow-400/90">Week in review</p>
      <h3 className="mt-6 text-3xl font-bold leading-tight tracking-tight">{weekLabel}</h3>
      <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Sessions logged</p>
      <p className="mt-2 text-5xl font-bold tracking-tight">
        {completed}
        <span className="text-2xl font-semibold text-zinc-400">/{planned}</span>
      </p>
      <div className="mt-auto">
        <div className="h-px bg-zinc-800" />
        <p className="mt-6 text-sm leading-relaxed text-zinc-300">{focus}</p>
      </div>
    </PrototypeFrame>
  );
}
