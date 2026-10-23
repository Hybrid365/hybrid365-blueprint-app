import { CONCEPT_PROTOTYPE_BANNER } from "./fixture";
import { visualBody, visualEyebrow, visualMeta, visualTouch } from "../tokens";

export function PrototypeBanner() {
  return (
    <p className="rounded-full border border-amber-400/50 bg-amber-400 px-3 py-1 text-center font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black">
      {CONCEPT_PROTOTYPE_BANNER}
    </p>
  );
}

export function ConceptShell({
  kicker,
  title,
  children,
  wide = false,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <article
      data-concept-frame=""
      className={`mx-auto w-full ${wide ? "max-w-5xl" : "max-w-[430px]"} rounded-[28px] border border-zinc-800 bg-black text-white shadow-[0_24px_80px_rgba(0,0,0,0.4)]`}
    >
      <div className="border-b border-zinc-800 px-5 py-4">
        <PrototypeBanner />
        <p className={`mt-4 ${visualEyebrow}`}>{kicker}</p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">{title}</h2>
        <p className={`mt-1 ${visualMeta}`}>Visual-lab concept. Demo values only.</p>
      </div>
      <div className="px-5 py-6 sm:px-6">{children}</div>
    </article>
  );
}

export function CoachMark({ children, label = "Coach" }: { children: React.ReactNode; label?: string }) {
  return (
    <aside className="border-l-2 border-yellow-400/80 pl-4">
      <p className={visualEyebrow}>{label}</p>
      <div className={`mt-2 ${visualBody}`}>{children}</div>
    </aside>
  );
}

export function ConceptButton({
  children,
  primary = false,
  onClick,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${visualTouch} inline-flex items-center justify-center rounded-xl px-4 text-sm font-semibold ${
        primary
          ? "bg-yellow-400 text-zinc-950 hover:bg-yellow-300"
          : "border border-zinc-700 text-zinc-200 hover:border-zinc-500"
      }`}
    >
      {children}
    </button>
  );
}
