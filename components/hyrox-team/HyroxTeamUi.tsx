import Link from "next/link";
import type { ReactNode } from "react";

export function HyroxPageShell({
  children,
  maxWidth = "max-w-[1100px]",
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="min-h-screen bg-[#050505] font-sans text-[#f6f6f6]">
      <main className={`mx-auto px-2.5 pb-16 pt-4 sm:px-[18px] sm:pb-24 sm:pt-6 ${maxWidth}`}>
        {children}
      </main>
    </div>
  );
}

export function HyroxSection({
  children,
  className = "",
  clean = false,
}: {
  children: ReactNode;
  className?: string;
  clean?: boolean;
}) {
  return (
    <section
      className={`relative my-4 overflow-hidden rounded-[24px] border border-white/[0.11] px-6 py-10 sm:my-5 sm:rounded-[34px] sm:px-10 sm:py-14 lg:px-[76px] lg:py-[76px] ${
        clean
          ? "bg-gradient-to-b from-white/[0.035] to-white/[0.018]"
          : "bg-[radial-gradient(circle_at_top_left,rgba(244,210,60,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))]"
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function HyroxEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-[#f4d23c]/[0.36] bg-[#f4d23c]/[0.075] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">
      <span className="h-[7px] w-[7px] rounded-full bg-[#f4d23c] shadow-[0_0_18px_rgba(244,210,60,0.95)]" />
      {children}
    </div>
  );
}

export function HyroxPrimaryButton({
  href,
  onClick,
  children,
  className = "",
  type = "button",
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
}) {
  const cls = `inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#f4d23c] px-6 font-black tracking-[-0.02em] text-[#050505] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function HyroxSecondaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
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

export function HyroxCard({
  children,
  className = "",
  highlight = false,
}: {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] border p-5 sm:p-6 ${
        highlight
          ? "border-[#f4d23c]/[0.35] bg-[#f4d23c]/[0.06]"
          : "border-white/[0.11] bg-white/[0.045]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function HyroxH1({ children, accent }: { children: ReactNode; accent?: ReactNode }) {
  return (
    <h1 className="mb-5 mt-6 text-[clamp(36px,7vw,72px)] font-black uppercase leading-[0.9] tracking-[-0.085em]">
      {children}
      {accent ? (
        <>
          <br />
          <span className="text-[#f4d23c]">{accent}</span>
        </>
      ) : null}
    </h1>
  );
}

export function HyroxLead({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 max-w-[720px] text-[clamp(16px,2vw,20px)] leading-[1.5] text-[#dddddd]">{children}</p>
  );
}
