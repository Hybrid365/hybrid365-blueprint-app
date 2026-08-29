import Image from "next/image";
import type { AthleteCaseStudy } from "@/app/lib/proof";
import { getHighlightedMetrics } from "@/app/lib/proof";
import { ProofEvidenceStrip } from "@/components/proof/ProofEvidenceStrip";

const PIPELINE = [
  { key: "profile", label: "Athlete profile" },
  { key: "identified", label: "What the coach identified" },
  { key: "trained", label: "What we trained" },
  { key: "improved", label: "What has improved" },
] as const;

function pipelineCopy(study: AthleteCaseStudy, key: (typeof PIPELINE)[number]["key"]) {
  if (key === "profile") return study.startingProfile.summary;
  if (key === "identified") return study.identified;
  if (key === "trained") return study.trained.join(" · ");
  return study.improved.join(" · ");
}

function EvidenceFrame({
  src,
  alt,
  label,
  width,
  height,
  objectPosition,
  kind,
}: AthleteCaseStudy["assets"][number]) {
  const isStrip = kind === "test-strip";
  const isWeek = kind === "testing-week";
  const isScrollEvidence = isStrip || isWeek;

  return (
    <figure className="overflow-hidden rounded-[1.15rem] border border-white/[0.08] bg-[#0a0a0a]">
      <div
        className={
          isWeek
            ? "max-h-[340px] overflow-y-auto overscroll-contain sm:max-h-[420px]"
            : isStrip
              ? "max-h-[230px] overflow-y-auto overscroll-contain sm:max-h-[250px]"
              : "relative h-[230px] sm:h-[250px]"
        }
      >
        {isScrollEvidence ? (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-auto w-full"
            sizes={isWeek ? "(max-width: 768px) 92vw, 720px" : "(max-width: 1024px) 72vw, 270px"}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            className={`object-cover ${objectPosition ?? "object-top"}`}
            sizes="(max-width: 1024px) 72vw, 280px"
          />
        )}
      </div>
      {label ? (
        <figcaption className="border-t border-white/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
          {label}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function AthleteCaseStudyCard({ study }: { study: AthleteCaseStudy }) {
  const metrics = getHighlightedMetrics(study);
  const testAssets = study.assets.filter((asset) => asset.kind === "test-strip");
  const weekAssets = study.assets.filter((asset) => asset.kind === "testing-week");
  const trainingAssets = study.assets.filter((asset) => asset.kind === "training");
  const useStrip = testAssets.length > 1;

  return (
    <article id={study.id} className="scroll-mt-[84px]">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]">
        {study.athlete.firstName}
      </p>
      <h3 className="mt-2 max-w-xl text-[clamp(1.45rem,5.2vw,2.15rem)] font-black uppercase leading-[0.95] tracking-[-0.04em] text-white">
        {study.headline}
      </h3>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
        {study.contrastLine}
      </p>

      <ol className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {PIPELINE.map((step, i) => (
          <li
            key={step.key}
            className="rounded-[1rem] border border-white/[0.07] bg-white/[0.03] px-3.5 py-3.5"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]/80">
              {String(i + 1).padStart(2, "0")} · {step.label}
            </p>
            <p className="mt-2 text-[12px] leading-snug text-white/70">{pipelineCopy(study, step.key)}</p>
          </li>
        ))}
      </ol>

      {metrics.length > 0 ? (
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="rounded-[1rem] border border-white/[0.07] bg-black/40 px-3.5 py-3"
            >
              <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                {metric.label}
                {metric.context === "starting" ? " · start" : null}
                {metric.context === "on_file" ? " · on file" : null}
              </dt>
              <dd className="mt-1 text-[1.55rem] font-black leading-none tracking-tight text-white tabular-nums">
                {metric.value}
              </dd>
              {metric.detail ? (
                <p className="mt-1.5 text-[11px] text-white/45">{metric.detail}</p>
              ) : null}
            </div>
          ))}
        </dl>
      ) : null}

      {useStrip ? (
        <div className="mt-6">
          <ProofEvidenceStrip ariaLabel={`${study.athlete.firstName} testing evidence`}>
            {testAssets.map((asset) => (
              <EvidenceFrame key={asset.src} {...asset} />
            ))}
          </ProofEvidenceStrip>
        </div>
      ) : null}

      {!useStrip && weekAssets.length > 0 ? (
        <div className="mt-6 max-w-3xl">
          {weekAssets.map((asset) => (
            <EvidenceFrame key={asset.src} {...asset} />
          ))}
        </div>
      ) : null}

      {!useStrip && weekAssets.length === 0 && trainingAssets.length > 0 ? (
        <div className="mt-6 max-w-[240px] sm:max-w-[260px]">
          {trainingAssets.map((asset) => (
            <EvidenceFrame key={asset.src} {...asset} />
          ))}
        </div>
      ) : null}

      <blockquote className="mt-6 max-w-3xl rounded-[1.15rem] border border-white/[0.08] bg-white/[0.03] px-5 py-5 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f4d23c]">
          Coach&apos;s note
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/65">&ldquo;{study.coachNote}&rdquo;</p>
      </blockquote>

      {study.identityCallout ? (
        <p className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-white/50">
          {study.identityCallout}
        </p>
      ) : null}
    </article>
  );
}
