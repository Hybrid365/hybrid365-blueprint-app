type Props = {
  className?: string;
};

export function MissedSessionGuidanceNote({ className = "" }: Props) {
  return (
    <p className={`text-xs leading-relaxed text-zinc-500 sm:text-sm ${className}`}>
      <span className="font-semibold text-zinc-400">Missed a session?</span> Do not cram everything in. Keep the
      structure, prioritise key sessions and ask in Telegram if you&apos;re unsure.
    </p>
  );
}
