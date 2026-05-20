import type { ReactNode } from "react";

const inputCls =
  "mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[#f4d23c]/40 focus:outline-none focus:ring-1 focus:ring-[#f4d23c]/30";
const labelCls = "text-xs font-semibold uppercase tracking-wide text-zinc-500";

export function FieldGrid({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 }) {
  return (
    <div className={`grid gap-4 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>{children}</div>
  );
}

export function HyroxField({
  label,
  children,
  className = "",
  fullWidth = false,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <label className={`block text-sm ${fullWidth ? "sm:col-span-2" : ""} ${className}`}>
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export function HyroxInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function HyroxTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={props.rows ?? 3}
      className={`${inputCls} resize-y min-h-[88px] ${props.className ?? ""}`}
    />
  );
}

export function HyroxSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputCls} ${props.className ?? ""}`}>
      {props.children}
    </select>
  );
}

export function HyroxCheckboxGroup({
  label,
  options,
  columns = 2,
}: {
  label: string;
  options: string[];
  columns?: 1 | 2 | 3 | 4;
}) {
  const colCls =
    columns === 1
      ? "grid-cols-1"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : columns === 3
          ? "grid-cols-2 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2";
  return (
    <fieldset className="sm:col-span-2">
      <legend className={`${labelCls} mb-3`}>{label}</legend>
      <div className={`grid gap-2 ${colCls}`}>
        {options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-300"
          >
            <input type="checkbox" className="rounded border-zinc-600 text-[#f4d23c]" />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function HyroxRadioGroup({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className={`${labelCls} mb-3`}>{label}</legend>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-300"
          >
            <input type="radio" name={name} className="border-zinc-600 text-[#f4d23c]" />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function HyroxScaleRow({
  label,
  name,
  scaleEnds,
}: {
  label: string;
  name: string;
  /** Optional labels under the 1–10 scale (e.g. weak vs strong). */
  scaleEnds?: { low: string; high: string };
}) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 sm:col-span-2">
      <p className="m-0 text-sm font-medium text-zinc-300">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <label
            key={n}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-800 text-xs font-bold text-zinc-500 hover:border-[#f4d23c]/40"
          >
            <input type="radio" name={name} value={n} className="sr-only" />
            {n}
          </label>
        ))}
      </div>
      {scaleEnds ? (
        <div className="mt-2 flex justify-between gap-4 text-[10px] leading-snug text-zinc-600">
          <span>{scaleEnds.low}</span>
          <span className="text-right">{scaleEnds.high}</span>
        </div>
      ) : null}
      <HyroxField label="Notes (optional)" className="mt-3">
        <HyroxInput placeholder="Short note" />
      </HyroxField>
    </div>
  );
}
