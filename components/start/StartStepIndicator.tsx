export function StartStepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mb-3 flex items-center justify-center gap-2 sm:mb-3.5" aria-hidden>
      {([1, 2, 3] as const).map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          {index > 0 ? <span className="h-px w-6 bg-white/12 sm:w-9" /> : null}
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black sm:h-7 sm:w-7 sm:text-[11px] ${
              step === current
                ? "bg-[#f4d23c] text-[#111]"
                : "border border-white/18 text-white/38"
            }`}
          >
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}
