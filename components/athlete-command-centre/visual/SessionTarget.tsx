export function SessionTargetRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>;
}

export function SessionTarget({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | null | undefined;
  hint?: string | null;
}) {
  const shown = value?.trim() || null;
  if (!shown && !hint?.trim()) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{label}</p>
      {shown ? (
        <p className="mt-1 text-base font-semibold tracking-tight text-white">{shown}</p>
      ) : (
        <p className="mt-1 text-sm text-zinc-400">{hint}</p>
      )}
      {shown && hint?.trim() ? <p className="mt-0.5 text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
}
