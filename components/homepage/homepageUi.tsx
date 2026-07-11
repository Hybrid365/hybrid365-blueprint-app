import Link from "next/link";
import { cn } from "@/lib/utils";

export function HomepageSection({
  children,
  className,
  id,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  variant?: "default" | "dark" | "accent";
}) {
  const bg =
    variant === "dark"
      ? "bg-[#050505]"
      : variant === "accent"
        ? "bg-[radial-gradient(ellipse_at_top,rgba(244,210,60,0.08),transparent_55%),#080808]"
        : "bg-[#080808]";

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-[72px] border-b border-white/[0.06] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24",
        bg,
        className
      )}
    >
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </section>
  );
}

export function HomepageEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]">
      {children}
    </p>
  );
}

export function HomepageHeading({
  children,
  as: Tag = "h2",
  className,
}: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag
      className={cn(
        "font-black uppercase leading-[0.92] tracking-[-0.04em] text-white",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function PrimaryCta({
  href,
  children,
  className,
  size = "default",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: "default" | "large";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#f4d23c] px-6 text-center text-sm font-black uppercase tracking-wide text-[#050505] transition hover:bg-[#e8c935] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d23c]",
        size === "large" && "min-h-[56px] px-8 text-base",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function SecondaryCta({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-6 text-sm font-bold uppercase tracking-wide text-white transition hover:border-white/35 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40",
        className
      )}
    >
      {children}
    </a>
  );
}

export function PlaceholderBadge() {
  return (
    <span className="inline-block rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200/90">
      Placeholder
    </span>
  );
}
