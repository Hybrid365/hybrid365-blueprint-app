import Link from "next/link";
import { AttributedLink } from "./AttributedLink";

export function StartShell({
  children,
  backHref = "/",
  backLabel = "Back to homepage",
}: {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/[0.08]">
        <div className="mx-auto flex h-[60px] max-w-[1100px] items-center justify-between px-4 sm:h-[68px] sm:px-6">
          <Link
            href="/"
            className="text-sm font-black uppercase tracking-[0.12em] text-white"
          >
            Hybrid<span className="text-[#f4d23c]">365</span>
          </Link>
          <AttributedLink
            href={backHref}
            className="text-xs font-bold uppercase tracking-[0.14em] text-white/50 transition hover:text-white/80"
          >
            {backLabel}
          </AttributedLink>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
