"use client";

import {
  FieldGrid,
  HyroxField,
  HyroxInput,
  HyroxSelect,
  HyroxTextarea,
} from "@/components/hyrox-team/HyroxFormFields";
import { useAssessmentForm } from "./assessmentFormContext";

function val(values: Record<string, unknown>, key: string): string {
  const v = values[key];
  return typeof v === "string" ? v : v != null ? String(v) : "";
}

export function AssessInput({
  field,
  label,
  fullWidth,
  hint,
  ...props
}: {
  field: string;
  label: string;
  fullWidth?: boolean;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const { values, setField } = useAssessmentForm();
  return (
    <HyroxField label={label} fullWidth={fullWidth}>
      <HyroxInput
        {...props}
        value={val(values, field)}
        onChange={(e) => setField(field, e.target.value)}
      />
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{hint}</p> : null}
    </HyroxField>
  );
}

export function AssessTextarea({
  field,
  label,
  fullWidth,
  ...props
}: {
  field: string;
  label: string;
  fullWidth?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { values, setField } = useAssessmentForm();
  return (
    <HyroxField label={label} fullWidth={fullWidth}>
      <HyroxTextarea
        {...props}
        value={val(values, field)}
        onChange={(e) => setField(field, e.target.value)}
      />
    </HyroxField>
  );
}

export function AssessSelect({
  field,
  label,
  fullWidth,
  children,
  ...props
}: {
  field: string;
  label: string;
  fullWidth?: boolean;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { values, setField } = useAssessmentForm();
  return (
    <HyroxField label={label} fullWidth={fullWidth}>
      <HyroxSelect
        {...props}
        value={val(values, field)}
        onChange={(e) => setField(field, e.target.value)}
      >
        {children}
      </HyroxSelect>
    </HyroxField>
  );
}

export function AssessCheckboxGroup({
  field,
  label,
  options,
  columns = 2,
}: {
  field: string;
  label: string;
  options: string[];
  columns?: 1 | 2 | 3 | 4;
}) {
  const { values, setField } = useAssessmentForm();
  const selected = Array.isArray(values[field]) ? (values[field] as string[]) : [];
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
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </legend>
      <div className={`grid gap-2 ${colCls}`}>
        {options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-300"
          >
            <input
              type="checkbox"
              className="rounded border-zinc-600 text-[#f4d23c]"
              checked={selected.includes(opt)}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, opt]
                  : selected.filter((x) => x !== opt);
                setField(field, next);
              }}
            />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function AssessRadioGroup({
  field,
  label,
  options,
}: {
  field: string;
  label: string;
  options: string[];
}) {
  const { values, setField } = useAssessmentForm();
  const current = val(values, field);
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </legend>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-300"
          >
            <input
              type="radio"
              name={field}
              className="border-zinc-600 text-[#f4d23c]"
              checked={current === opt}
              onChange={() => setField(field, opt)}
            />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function AssessScaleRow({
  station,
  scaleEnds,
}: {
  station: string;
  scaleEnds?: { low: string; high: string };
}) {
  const { values, setField } = useAssessmentForm();
  const ratings = (values.stationRatings as Record<string, number>) ?? {};
  const name = `station-${station}`;

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 sm:col-span-2">
      <p className="m-0 text-sm font-medium text-zinc-300">{station}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <label
            key={n}
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-xs font-bold ${
              ratings[station] === n
                ? "border-[#f4d23c]/60 bg-[#f4d23c]/15 text-[#f4d23c]"
                : "border-zinc-800 text-zinc-500 hover:border-[#f4d23c]/40"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={n}
              className="sr-only"
              checked={ratings[station] === n}
              onChange={() =>
                setField("stationRatings", { ...ratings, [station]: n })
              }
            />
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
    </div>
  );
}

export { FieldGrid };
