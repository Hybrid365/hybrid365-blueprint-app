import Link from "next/link";

export function Section({
  children,
  className = "",
  id,
  clean = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  clean?: boolean;
}) {
  return (
    <section
      id={id}
      className={`relative my-[18px] overflow-hidden rounded-[24px] border border-white/[0.11] px-6 py-10 sm:rounded-[34px] sm:px-10 sm:py-14 lg:px-[76px] lg:py-[76px] ${
        clean
          ? "bg-gradient-to-b from-white/[0.035] to-white/[0.018]"
          : "bg-[radial-gradient(circle_at_top_left,rgba(244,210,60,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))]"
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-[#f4d23c]/[0.36] bg-[#f4d23c]/[0.075] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">
      <span className="h-[7px] w-[7px] rounded-full bg-[#f4d23c] shadow-[0_0_18px_rgba(244,210,60,0.95)]" />
      {children}
    </div>
  );
}

export function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#f4d23c] px-6 font-black tracking-[-0.02em] text-[#050505] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 ${className}`}
    >
      {children}
    </Link>
  );
}

export function SecondaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/[0.18] bg-white/[0.04] px-6 font-black tracking-[-0.02em] text-[#f6f6f6] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 ${className}`}
    >
      {children}
    </Link>
  );
}

export function SectionHeader({
  title,
  highlight,
  description,
  centered = false,
}: {
  title: string;
  highlight: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div
      className={`mb-7 flex flex-col gap-4 ${centered ? "items-center text-center" : "lg:flex-row lg:items-end lg:justify-between lg:gap-6"}`}
    >
      <h2 className="m-0 text-[clamp(34px,5.6vw,72px)] font-black uppercase leading-[0.9] tracking-[-0.065em]">
        {title}
        <br />
        <span className="text-[#f4d23c]">{highlight}</span>
      </h2>
      {description ? (
        <p
          className={`m-0 max-w-[520px] text-base leading-relaxed text-[#a9a9a9] ${centered ? "mx-auto" : ""}`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Card({
  num,
  title,
  description,
}: {
  num?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-[180px] rounded-[20px] border border-white/[0.11] bg-gradient-to-b from-white/[0.065] to-white/[0.025] p-5 sm:rounded-[24px] sm:p-[22px]">
      {num ? (
        <div className="mb-5 text-xs font-black uppercase tracking-[0.12em] text-[#f4d23c]">
          {num}
        </div>
      ) : null}
      <h3 className="m-0 mb-2.5 text-[21px] leading-[1.05] tracking-[-0.04em]">{title}</h3>
      <p className="m-0 text-sm leading-[1.45] text-[#a9a9a9]">{description}</p>
    </div>
  );
}

export function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[20px] border border-white/[0.11] bg-[#101010] p-5 sm:rounded-[26px] sm:p-[26px]">
      <h3 className="m-0 mb-[18px] text-[13px] font-black uppercase tracking-[0.11em] text-[#f4d23c]">
        {title}
      </h3>
      <ul className="m-0 grid list-none gap-3 p-0">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-[1.42] text-[#e9e9e9]">
            <span className="shrink-0 font-black text-[#f4d23c]">→</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const APPLY_URL = "/one-to-one-coaching/apply";
export const INSTAGRAM_URL = "https://www.instagram.com/hybrid.365";
