"use client";

import { cn } from "@/lib/utils";
import {
  TRAINING_TRACK_OPTIONS,
  type CommunityTrainingTrack,
} from "@/app/lib/communityHyroxAssessment";

type Props = {
  value: CommunityTrainingTrack;
  onChange: (track: CommunityTrainingTrack) => void;
};

export function TrainingTrackSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm text-muted-foreground">Training track</label>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Choose the track that best matches your main goal.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {TRAINING_TRACK_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                selected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                  : "border-border bg-secondary/40 hover:border-primary/30 hover:bg-secondary/60"
              )}
            >
              <p className="font-semibold text-foreground">{opt.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
