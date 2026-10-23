import { SocialPrototypeFrame } from "./SocialPrototypeFrame";
import { visualDerived, visualMeta, visualPerformanceNumber } from "../tokens";

export type WeekInReviewPrototypeProps = {
  athleteName: string;
  weekLabel: string;
  completed: number;
  planned: number;
  focus?: string | null;
};

/** Staging-only 9:16. Caller must pass clearly labelled demo props. */
export function WeekInReviewCard(props: WeekInReviewPrototypeProps) {
  const pct = props.planned > 0 ? Math.round((props.completed / props.planned) * 100) : null;

  return (
    <SocialPrototypeFrame title="Week in review">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">
        Hybrid365
      </p>
      <p className={`mt-6 ${visualMeta}`}>{props.athleteName}</p>
      <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">{props.weekLabel}</h3>
      {pct != null ? (
        <p className={`mt-10 ${visualPerformanceNumber}`}>{pct}%</p>
      ) : (
        <p className={`mt-10 text-sm text-zinc-400`}>No sessions planned</p>
      )}
      <p className={`mt-2 ${visualDerived}`}>
        {props.completed} of {props.planned} sessions logged
      </p>
      <div className="mt-auto border-t border-zinc-800 pt-6">
        {props.focus ? <p className={visualMeta}>{props.focus}</p> : null}
      </div>
    </SocialPrototypeFrame>
  );
}
