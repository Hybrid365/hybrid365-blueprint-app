import { PrototypeFrame } from "./PrototypeFrame";

export type PerformanceProgressSocialProps = {
  testLabel: string;
  value: string;
  derived: string;
  status: string;
};

export function PerformanceProgressSocial({
  testLabel,
  value,
  derived,
  status,
}: PerformanceProgressSocialProps) {
  return (
    <PrototypeFrame title="Performance Progress · 9:16 prototype">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-yellow-400/90">Performance</p>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{testLabel}</p>
      <p className="mt-3 text-6xl font-bold tracking-tight">{value}</p>
      <p className="mt-3 text-lg text-zinc-300">{derived}</p>
      <div className="mt-auto">
        <div className="h-px bg-zinc-800" />
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">{status}</p>
      </div>
    </PrototypeFrame>
  );
}
