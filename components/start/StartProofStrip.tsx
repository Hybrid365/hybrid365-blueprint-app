import Image from "next/image";
import { START_PROOF_STRIP } from "@/app/lib/start/startCopy";
import { cn } from "@/lib/utils";

export function StartProofStrip() {
  return (
    <div className="mt-4 border-y border-white/[0.08] py-3 sm:mt-5 sm:py-3.5">
      <p className="text-center text-[8px] font-bold uppercase tracking-[0.18em] text-white/32 sm:text-[9px]">
        Trusted by athletes. Proven in performance.
      </p>
      <ul className="mt-2.5 grid grid-cols-4 gap-x-1 sm:mt-3 sm:flex sm:justify-center sm:gap-7">
        {START_PROOF_STRIP.map((item) => (
          <li
            key={item.id}
            className="flex min-w-0 flex-col items-center sm:w-[88px]"
          >
            <span className="relative h-8 w-8 overflow-hidden rounded-full border border-white/14 sm:h-11 sm:w-11">
              <Image
                src={item.photoSrc}
                alt={item.photoAlt}
                fill
                sizes="44px"
                className={cn(item.photoClassName)}
              />
            </span>
            <span className="mt-1.5 text-[8px] font-bold uppercase tracking-[0.05em] text-white/78 sm:text-[10px]">
              {item.name}
            </span>
            <span className="max-w-full text-center text-[7px] font-semibold leading-tight tabular-nums text-[#f4d23c]/85 sm:text-[9px]">
              {item.metric}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
