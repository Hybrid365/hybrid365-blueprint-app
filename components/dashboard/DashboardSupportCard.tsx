import { HelpCircle } from "lucide-react";

type Props = {
  className?: string;
};

export function DashboardSupportCard({ className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800/90 bg-zinc-950/40 px-4 py-3.5 sm:px-5 sm:py-4 ${className}`}
    >
      <div className="flex gap-3">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-300">Need help?</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
            If your access, programme, check-in or challenge score doesn&apos;t look right, message Kieran in
            Whop/Telegram with the email you used to join.
          </p>
        </div>
      </div>
    </div>
  );
}
