import type { AthleteCaseStudy, ProofSurface } from "./types";

/**
 * Coaching case studies — verified data only.
 *
 * Ricci hardware / Strava screenshots, ordered:
 * 5K → 2K SkiErg → 2K RowErg → Mini HYROX Sim.
 * Rae / Bobby: Hybrid365 session-log testing-week screenshots (athlete-labelled).
 * Do not map another person's photo as Ricci.
 */

export const ATHLETE_CASE_STUDIES: AthleteCaseStudy[] = [
  {
    id: "rae-wall",
    athlete: {
      id: "rae-wall",
      name: "Rae Wall",
      firstName: "Rae",
    },
    headline: "Build the engine without losing the strength.",
    contrastLine: "Strength in. Engine next.",
    startingProfile: {
      summary: "Very good raw power and strength. The goal was not to take that away.",
      markers: [
        {
          id: "rae-prev-5k",
          label: "Previous 5K",
          value: "24:30",
          detail: "Before coaching",
          context: "starting",
          source: "repo_verified",
        },
      ],
    },
    identified:
      "Keep developing strength while building aerobic fitness, HYROX-specific work, movement technique, threshold running and a higher speed ceiling.",
    trained: [
      "Strength",
      "Aerobic foundation",
      "Threshold efficiency",
      "Speed ceiling",
      "Movement technique",
    ],
    improved: [
      "Ability to sustain high output for longer sessions",
    ],
    coachNote:
      "Rae came in with great raw power and strength. The goal wasn't to take that away — it was to build the engine around it. We've developed her aerobic foundation, threshold efficiency, speed ceiling and movement technique while continuing to build strength. The biggest progression has been her ability to sustain high output for longer.",
    cardNote:
      "Great raw power and strength. We built the aerobic base around it, sharpened her technique and threshold efficiency, and improved her ability to sustain high output.",
    portrait: {
      src: "/images/homepage/team/rae-wall-training.png",
      alt: "Rae Wall — Hybrid365 athlete",
      objectPosition: "object-top",
    },
    cardMetrics: [
      { id: "rae-5k", label: "5K", value: "23:02", previous: "24:30" },
      { id: "rae-ski", label: "2K Ski", value: "8:25" },
      { id: "rae-hybrid", label: "HYROX Sim", value: "49:05" },
    ],
    verifiedResults: [
      {
        id: "rae-prev-5k",
        label: "Previous 5K",
        value: "24:30",
        detail: "Before coaching",
        context: "starting",
        source: "repo_verified",
        highlight: true,
      },
      {
        id: "rae-5k",
        label: "5K",
        value: "23:02",
        detail: "Testing week",
        context: "testing",
        source: "supplied_asset",
        highlight: true,
      },
      {
        id: "rae-ski",
        label: "2K Ski",
        value: "8:25",
        context: "testing",
        source: "supplied_asset",
        highlight: true,
      },
      {
        id: "rae-hybrid",
        label: "HYROX sim",
        value: "49:05",
        detail: "Compromised benchmark",
        context: "testing",
        source: "supplied_asset",
        highlight: true,
      },
      {
        id: "rae-row",
        label: "2K Row",
        value: "8:25",
        detail: "First 1K 4:07",
        context: "testing",
        source: "supplied_asset",
      },
      {
        id: "rae-pullups",
        label: "Pull-ups",
        value: "9",
        detail: "Unbroken",
        context: "testing",
        source: "supplied_asset",
      },
    ],
    assets: [
      {
        src: "/images/proof/rae/testing-week.png",
        alt: "Rae Wall testing week — session logs including 23:02 5K, 8:25 ski and row, 49:05 HYROX benchmark",
        kind: "testing-week",
        label: "Testing week",
        width: 1024,
        height: 832,
      },
    ],
    surfaces: ["hybrid-performance", "homepage", "hyrox-team", "hybrid-performance-track"],
  },
  {
    id: "ricci-lee-jarvis",
    athlete: {
      id: "ricci-lee-jarvis",
      name: "Ricci-Lee Jarvis",
      firstName: "Ricci",
    },
    headline: "Turn power into capacity.",
    contrastLine: "Power in. Capacity next.",
    startingProfile: {
      summary:
        "Serious power and the ability to produce high output for shorter periods.",
      markers: [],
    },
    identified:
      "Extend that fitness — stronger aerobic foundation, longer threshold efforts, sharper movement — without giving up speed or strength.",
    trained: [
      "Aerobic foundation",
      "Longer threshold work",
      "Speed ceiling",
      "In-person technique",
      "Strength",
    ],
    improved: [
      "Ability to sustain high output for much longer",
    ],
    coachNote:
      "Ricci already had serious power and could produce high output over shorter durations. Our goal was to extend it. We've built a stronger aerobic foundation, progressed longer threshold work and sharpened movement efficiency through in-person coaching — while maintaining his speed and strength. His testing now shows an athlete capable of sustaining that performance for much longer.",
    cardNote:
      "Already powerful over shorter efforts. We extended his aerobic base and threshold capacity while maintaining speed and strength.",
    portrait: {
      src: "/images/homepage/team/ricci-lee-jarvis-announcement.png",
      alt: "Ricci-Lee Jarvis — Hybrid365 athlete",
      objectPosition: "object-[98%_10%]",
      /** ASSET REPLACEMENT REQUIRED — announcement crop only; no clean verified portrait yet. */
      temporaryAnnouncement: true,
    },
    cardMetrics: [
      { id: "ricci-5k", label: "5K", value: "19:32" },
      { id: "ricci-ski", label: "2K Ski", value: "8:01.5" },
      { id: "ricci-row", label: "2K Row", value: "7:37.0" },
      { id: "ricci-hybrid", label: "Hybrid Test", value: "45:13.9" },
    ],
    verifiedResults: [
      {
        id: "ricci-5k",
        label: "5K",
        value: "19:32",
        detail: "3:54/km avg",
        context: "testing",
        source: "supplied_asset",
        highlight: true,
      },
      {
        id: "ricci-ski",
        label: "2K Ski",
        value: "8:01.5",
        detail: "1:51/500m",
        context: "testing",
        source: "supplied_asset",
        highlight: true,
      },
      {
        id: "ricci-row",
        label: "2K Row",
        value: "7:37.0",
        detail: "1:46/500m",
        context: "testing",
        source: "supplied_asset",
        highlight: true,
      },
      {
        id: "ricci-hybrid",
        label: "Hybrid test",
        value: "45:13.9",
        detail: "100% · 4.8 km run 20:17",
        context: "testing",
        source: "supplied_asset",
        highlight: true,
      },
      {
        id: "ricci-5k-mile",
        label: "1 mile",
        value: "6:16",
        detail: "3:54/km",
        context: "testing",
        source: "supplied_asset",
      },
      {
        id: "ricci-5k-2mile",
        label: "2 mile",
        value: "12:35",
        detail: "3:55/km",
        context: "testing",
        source: "supplied_asset",
      },
      {
        id: "ricci-ski-spm",
        label: "Ski stroke rate",
        value: "79 s/m",
        context: "testing",
        source: "supplied_asset",
      },
      {
        id: "ricci-row-spm",
        label: "Row stroke rate",
        value: "33 s/m",
        context: "testing",
        source: "supplied_asset",
      },
      {
        id: "ricci-hybrid-hr",
        label: "Avg HR",
        value: "167",
        detail: "Mini HYROX sim · 26/07/2026",
        context: "testing",
        source: "supplied_asset",
      },
      {
        id: "ricci-hybrid-transitions",
        label: "Transitions",
        value: "2:49",
        context: "testing",
        source: "supplied_asset",
      },
      {
        id: "ricci-hybrid-kcal",
        label: "Calories",
        value: "631",
        context: "testing",
        source: "supplied_asset",
      },
    ],
    assets: [
      {
        src: "/images/proof/ricci/5k.jpg",
        alt: "Ricci 5K test — 19:32 at 3:54 per kilometre",
        kind: "test-strip",
        label: "5K",
        width: 1320,
        height: 2135,
      },
      {
        src: "/images/proof/ricci/ski-2k.jpg",
        alt: "Ricci 2K SkiErg — 8:01.5 at 1:51 per 500 metres",
        kind: "test-strip",
        label: "2K Ski",
        width: 1320,
        height: 1334,
      },
      {
        src: "/images/proof/ricci/row-2k.jpg",
        alt: "Ricci 2K RowErg — 7:37.0 at 1:46 per 500 metres",
        kind: "test-strip",
        label: "2K Row",
        width: 1320,
        height: 1678,
      },
      {
        src: "/images/proof/ricci/hybrid-fitness-test.jpg",
        alt: "Ricci Mini HYROX sim results — 45:13.9, 100% complete",
        kind: "test-strip",
        label: "Hybrid test",
        width: 1248,
        height: 2373,
      },
    ],
    stages: [
      { stage: "1", work: "Run 1", detail: "600m", time: "2:20.1" },
      { stage: "2", work: "SkiErg", detail: "1,000m", time: "4:13.0" },
      { stage: "3", work: "Run 2", detail: "600m", time: "2:23.2" },
      { stage: "4", work: "Sled Push", detail: "50m @ 140kg", time: "2:56.2" },
      { stage: "5", work: "Run 3", detail: "600m", time: "2:31.3" },
      { stage: "6", work: "Sled Pull", detail: "50m @ 100kg", time: "3:06.0" },
      { stage: "7", work: "Run 4", detail: "600m", time: "2:27.5" },
      { stage: "8", work: "Burpee Broad Jumps", detail: "40m", time: "2:20.9" },
      { stage: "9", work: "Run 5", detail: "600m", time: "2:37.1" },
      { stage: "10", work: "RowErg", detail: "1,000m", time: "4:17.5" },
      { stage: "11", work: "Run 6", detail: "600m", time: "2:55.8" },
      { stage: "12", work: "Farmer's Carry", detail: "100m, 2×24kg", time: "1:07.7" },
      { stage: "13", work: "Run 7", detail: "600m", time: "2:33.4" },
      { stage: "14", work: "Sandbag Lunges", detail: "50m @ 20kg", time: "1:53.4" },
      { stage: "15", work: "Run 8", detail: "600m", time: "2:28.0" },
      { stage: "16", work: "Wall Balls", detail: "50 reps @ 6kg", time: "1:37.9" },
    ],
    surfaces: ["hybrid-performance", "homepage", "hyrox-team", "hybrid-performance-track"],
  },
  {
    id: "bobby-harrison",
    athlete: {
      id: "bobby-harrison",
      name: "Bobby Harrison",
      firstName: "Bobby",
    },
    headline: "Build the strength around the engine.",
    contrastLine: "Engine in. Strength next.",
    startingProfile: {
      summary: "Already solid running ability and good aerobic fitness.",
      markers: [
        {
          id: "bobby-hyrox",
          label: "HYROX",
          value: "1:04:14",
          detail: "On file",
          context: "on_file",
          source: "repo_verified",
        },
      ],
    },
    identified:
      "HYROX-specific strength, station and erg efficiency, capacity, load tolerance and strength foundations.",
    trained: [
      "Capacity",
      "Load tolerance",
      "Strength foundations",
      "Erg performance",
    ],
    improved: [
      "Major improvement in erg testing",
      "Progressing into greater volumes of HYROX-specific station work around running",
    ],
    coachNote:
      "Bobby already had a strong aerobic base and good running ability. The opportunity was HYROX-specific strength and efficiency. Early blocks developed capacity, load tolerance and strength foundations alongside major improvements on the ergs. We're now progressing into greater volumes of specific station work around his running.",
    cardNote:
      "Already aerobically strong. We developed specific strength, erg efficiency and load tolerance to improve his HYROX performance.",
    identityCallout: "Gym owner. Dad. Busy schedule. Refuses average.",
    portrait: {
      src: "/images/homepage/team/bobby-harrison-farmers-carry.png",
      alt: "Bobby Harrison — Hybrid365 athlete",
      objectPosition: "object-[center_36%]",
    },
    cardMetrics: [
      { id: "bobby-5k", label: "5K", value: "18:42" },
      { id: "bobby-ski", label: "2K Ski", value: "8:14" },
      { id: "bobby-row", label: "2K Row", value: "7:41" },
      { id: "bobby-hyrox", label: "HYROX", value: "1:04:14", note: "Race result" },
    ],
    verifiedResults: [
      {
        id: "bobby-5k",
        label: "5K",
        value: "18:42",
        detail: "Testing week",
        context: "testing",
        source: "supplied_asset",
        highlight: true,
      },
      {
        id: "bobby-ski",
        label: "2K Ski",
        value: "8:14",
        context: "testing",
        source: "supplied_asset",
        highlight: true,
      },
      {
        id: "bobby-row",
        label: "2K Row",
        value: "7:41",
        context: "testing",
        source: "supplied_asset",
        highlight: true,
      },
      {
        id: "bobby-hyrox",
        label: "HYROX",
        value: "1:04:14",
        detail: "On file",
        context: "on_file",
        source: "repo_verified",
        highlight: true,
      },
    ],
    assets: [
      {
        src: "/images/proof/bobby/testing-week.png",
        alt: "Bobby Harrison testing week — session logs including 18:42 5K, 8:14 ski and 7:41 row",
        kind: "testing-week",
        label: "Testing week",
        width: 1024,
        height: 807,
      },
    ],
    surfaces: ["hybrid-performance", "homepage", "hyrox-team", "hybrid-performance-track"],
  },
];

export function getCaseStudiesForSurface(surface: ProofSurface): AthleteCaseStudy[] {
  return ATHLETE_CASE_STUDIES.filter((study) => study.surfaces.includes(surface));
}

export function getCaseStudyById(id: string): AthleteCaseStudy | undefined {
  return ATHLETE_CASE_STUDIES.find((study) => study.id === id);
}

export function getHighlightedMetrics(study: AthleteCaseStudy) {
  const highlighted = study.verifiedResults.filter((metric) => metric.highlight);
  return highlighted.length > 0 ? highlighted : study.verifiedResults.slice(0, 4);
}
