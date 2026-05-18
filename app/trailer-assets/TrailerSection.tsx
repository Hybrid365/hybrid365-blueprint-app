import type { ReactNode } from "react";

type Props = {
  id: string;
  number: number;
  title: string;
  description?: string;
  children: ReactNode;
  /** Default max width for dashboard crops; use narrow for 9:16 */
  layout?: "wide" | "narrow" | "full";
};

export function TrailerSection({
  id,
  number,
  title,
  description,
  children,
  layout = "wide",
}: Props) {
  const maxW =
    layout === "narrow"
      ? "max-w-[400px]"
      : layout === "full"
        ? "max-w-none"
        : "max-w-6xl";

  return (
    <section
      id={id}
      className="scroll-mt-6 border-b border-zinc-800/80 py-14 lg:py-20"
      data-trailer-section={id}
    >
      <div className="mx-auto px-5 sm:px-8 lg:px-12">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F4D23C]">
              Section {number}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-zinc-500">{description}</p>
            ) : null}
          </div>
          <p className="text-xs text-zinc-600 font-mono">#{id}</p>
        </header>
        <div className={maxW}>{children}</div>
      </div>
    </section>
  );
}
