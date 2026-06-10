export function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <h2 className="mb-5 text-sm font-black uppercase tracking-[0.12em] text-[#F4D23C]">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function FormField({
  label,
  name,
  type = "text",
  required = false,
  textarea = false,
  placeholder,
  hint,
  className = "",
  options,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  placeholder?: string;
  hint?: string;
  className?: string;
  options?: { value: string; label: string }[];
}) {
  const inputClasses =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#F4D23C]/50 focus:outline-none focus:ring-1 focus:ring-[#F4D23C]/50 transition-colors";

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="block text-xs font-medium uppercase tracking-wider text-white/60">
        {label}
        {required && <span className="ml-1 text-[#F4D23C]">*</span>}
      </label>

      {options ? (
        <select id={name} name={name} required={required} className={inputClasses}>
          <option value="">Select…</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-black text-white">
              {opt.label}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          id={name}
          name={name}
          required={required}
          placeholder={placeholder}
          rows={4}
          className={inputClasses + " resize-none sm:col-span-2"}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
      {hint ? <p className="text-xs leading-relaxed text-white/50">{hint}</p> : null}
    </div>
  );
}

export function FormCheckbox({
  label,
  name,
  required = false,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <input
        type="checkbox"
        name={name}
        value="yes"
        required={required}
        className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-[#F4D23C] focus:ring-[#F4D23C]/50"
      />
      <span className="text-sm leading-relaxed text-white/80">
        {label}
        {required && <span className="ml-1 text-[#F4D23C]">*</span>}
      </span>
    </label>
  );
}
