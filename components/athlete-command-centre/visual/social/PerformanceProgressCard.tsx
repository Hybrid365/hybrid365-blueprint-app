import { SocialPrototypeFrame } from "./SocialPrototypeFrame";
import { visualDerived, visualMeta, visualPerformanceNumber } from "../tokens";

export type PerformanceProgressPrototypeProps = {
  athleteName: string;
  label: string;
  value: string;
  derived?: string | null;
  status?: string | null;
};

/** Staging-only 9:16. Caller must pass clearly labelled demo props. */
export function PerformanceProgressCard(props: PerformanceProgressPrototypeProps) {
  return (
    <SocialPrototypeFrame title="Performance progress">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">
        Hybrid365
      </p>
      <p className={`mt-6 ${visualMeta}`}>{props.athleteName}</p>
      <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
        {props.label}
      </p>
      <p className={`mt-3 ${visualPerformanceNumber}`}>{props.value}</p>
      {props.derived ? <p className={`mt-2 ${visualDerived}`}>{props.derived}</p> : null}
      <div className="mt-auto border-t border-zinc-800 pt-6">
        <p className={visualMeta}>{props.status ?? "Current"}</p>
      </div>
    </SocialPrototypeFrame>
  );
}
