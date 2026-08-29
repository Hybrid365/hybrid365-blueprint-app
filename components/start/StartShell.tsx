import Link from "next/link";
import { START_GOAL_COPY, START_LOGIN_HREF } from "@/app/lib/start/startCopy";
import { AttributedLink } from "./AttributedLink";

export function StartShell({
  children,
  backHref,
  backLabel,
  showLogin = false,
}: {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  showLogin?: boolean;
}) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#050505] text-white">
      <header className="relative z-20 border-b border-white/[0.06]">
        <div className="mx-auto flex h-[48px] max-w-[1200px] items-center justify-between px-4 sm:h-[52px] sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-[12px] font-black uppercase tracking-[0.16em] text-white sm:text-[13px]"
          >
            Hybrid<span className="text-[#f4d23c]">365</span>
          </Link>
          {showLogin ? (
            <p className="text-[10px] font-medium tracking-wide text-white/38 sm:text-[11px]">
              {START_GOAL_COPY.loginPrompt}{" "}
              <AttributedLink
                href={START_LOGIN_HREF}
                className="font-bold uppercase tracking-[0.12em] text-white/62 transition hover:text-white"
              >
                {START_GOAL_COPY.loginCta}
              </AttributedLink>
            </p>
          ) : backHref && backLabel ? (
            <AttributedLink
              href={backHref}
              className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 transition hover:text-white/75 sm:text-[11px]"
            >
              {backLabel}
            </AttributedLink>
          ) : null}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
