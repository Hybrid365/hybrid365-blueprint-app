/**
 * HYROX station exposure tracking — structured metadata only.
 * Never implies absence when historical sessions lack structured tags.
 */

import type { HyroxExposureRow } from "@/app/lib/hyrox-team/modules/performanceHub/types";

const MOVEMENTS: Array<{ id: string; label: string; pattern: RegExp }> = [
  { id: "sled_push", label: "Sled push", pattern: /sled.?push/i },
  { id: "sled_pull", label: "Sled pull", pattern: /sled.?pull/i },
  { id: "wall_balls", label: "Wall balls", pattern: /wall.?ball/i },
  { id: "lunges", label: "Lunges", pattern: /lunge|sandbag.?lunge/i },
  { id: "farmers", label: "Farmers carry", pattern: /farmer/i },
  { id: "bbj", label: "Burpee broad jumps", pattern: /burpee|bbj|broad.?jump/i },
  { id: "ski", label: "SkiErg", pattern: /ski.?erg|\bski\b/i },
  { id: "row", label: "RowErg", pattern: /row.?erg|\brow\b/i },
];

export type ExposureScanSession = {
  ymd: string;
  name: string;
  category?: string | null;
  prescriptionText?: string | null;
  logNotes?: string | null;
  stationSplits?: string | null;
  activityType?: string | null;
};

/**
 * Scan sessions for movement mentions in name/prescription/log text.
 * Counts are "sessions containing" structured text evidence — not complete history.
 */
export function buildHyroxExposureRows(sessions: ExposureScanSession[]): HyroxExposureRow[] {
  const structured = sessions.filter((s) => {
    const blob = [s.name, s.category, s.prescriptionText, s.logNotes, s.stationSplits]
      .filter(Boolean)
      .join(" ");
    return blob.trim().length > 0;
  });

  if (structured.length === 0) {
    return MOVEMENTS.map((m) => ({
      movement: m.label,
      sessionsContaining: null,
      structuredVolume: null,
      lastExposureYmd: null,
      emptyReason: "No structured exposure data available",
    }));
  }

  return MOVEMENTS.map((m) => {
    const hits = structured.filter((s) => {
      const blob = [s.name, s.category, s.prescriptionText, s.logNotes, s.stationSplits]
        .filter(Boolean)
        .join(" ");
      return m.pattern.test(blob);
    });
    if (hits.length === 0) {
      return {
        movement: m.label,
        sessionsContaining: null,
        structuredVolume: null,
        lastExposureYmd: null,
        emptyReason: "No structured exposure data available",
      };
    }
    const last = [...hits].sort((a, b) => b.ymd.localeCompare(a.ymd))[0];
    return {
      movement: m.label,
      sessionsContaining: hits.length,
      structuredVolume: null,
      lastExposureYmd: last?.ymd ?? null,
    };
  });
}
