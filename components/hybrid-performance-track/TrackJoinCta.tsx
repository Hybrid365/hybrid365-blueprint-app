import { cn } from "@/lib/utils";
import { AttributedLink } from "@/components/start/AttributedLink";

/** External Community membership checkout (Whop). */
export function TrackJoinCta({
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
    <AttributedLink
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center rounded-md bg-[#f4d23c] px-7 text-center text-[13px] font-black uppercase tracking-[0.1em] text-[#050505] transition hover:bg-[#e8c935] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d23c] sm:min-h-[52px] sm:px-8",
        size === "large" && "min-h-[52px] px-8 sm:min-h-[56px] sm:text-sm",
        className
      )}
    >
      {children}
    </AttributedLink>
  );
}
