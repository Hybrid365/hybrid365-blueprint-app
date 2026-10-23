import { PrototypeFrame } from "./PrototypeFrame";

export type SessionCompleteSocialProps = {
  sessionName: string;
  dayLabel: string;
  duration: string;
  rpe: string;
};

export function SessionCompleteSocial({ sessionName, dayLabel, duration, rpe }: SessionCompleteSocialProps) {
  return (
    <PrototypeFrame title="Session Complete · 9:16 prototype">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-yellow-400/90">Session complete</p>
      <h3 className="mt-6 text-3xl font-bold leading-tight tracking-tight">{sessionName}</h3>
      <p className="mt-2 text-sm text-zinc-400">{dayLabel}</p>
      <div className="mt-auto space-y-6">
        <div className="h-px bg-zinc-800" />
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Duration</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{duration}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">RPE</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{rpe}</p>
          </div>
        </div>
      </div>
    </PrototypeFrame>
  );
}
