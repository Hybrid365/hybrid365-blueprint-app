import { SocialPrototypeFrame } from "./SocialPrototypeFrame";
import { visualDerived, visualMeta, visualPerformanceNumber } from "../tokens";

export type SessionCompletePrototypeProps = {
  athleteName: string;
  sessionName: string;
  rpe?: string | null;
  duration?: string | null;
  note?: string | null;
};

/** Staging-only 9:16. Caller must pass clearly labelled demo props. */
export function SessionCompleteCard(props: SessionCompletePrototypeProps) {
  return (
    <SocialPrototypeFrame title="Session complete">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">
        Hybrid365
      </p>
      <p className={`mt-6 ${visualMeta}`}>{props.athleteName}</p>
      <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">{props.sessionName}</h3>
      <p className={`mt-8 ${visualPerformanceNumber}`}>Complete</p>
      <div className="mt-auto space-y-3 border-t border-zinc-800 pt-6">
        {props.duration ? (
          <p className={visualDerived}>{props.duration}</p>
        ) : null}
        {props.rpe ? <p className={visualMeta}>RPE {props.rpe}</p> : null}
        {props.note ? <p className={visualMeta}>{props.note}</p> : null}
      </div>
    </SocialPrototypeFrame>
  );
}
