/**
 * HYROX Team roster for homepage — REPLACE placeholders with real athletes.
 * Designed to scale: add objects to this array for a living team wall.
 */

export type TeamMember = {
  id: string;
  name: string;
  location: string;
  photoSrc: string;
  photoAlt: string;
  hyroxDivision: string;
  currentPb: string;
  goal: string;
  fiveKpb?: string;
  coachingDuration: string;
  placeholder?: boolean;
  placeholderNote?: string;
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "team-placeholder-1",
    name: "[Athlete name]",
    location: "[City, UK]",
    photoSrc: "/images/hyrox-team/b-and-ww.jpg",
    photoAlt: "Hybrid365 team athlete — replace with photo",
    hyroxDivision: "[Pro / Open]",
    currentPb: "[HYROX PB]",
    goal: "[Target race + time]",
    fiveKpb: "[5K PB]",
    coachingDuration: "[X months]",
    placeholder: true,
    placeholderNote: "Replace with real team member #1",
  },
  {
    id: "team-placeholder-2",
    name: "[Athlete name]",
    location: "[City, UK]",
    photoSrc: "/images/hyrox-team/Sequence 01.00_37_26_11.Still015.jpg",
    photoAlt: "Hybrid365 team athlete — replace with photo",
    hyroxDivision: "[Pro / Open]",
    currentPb: "[HYROX PB]",
    goal: "[Target race + time]",
    fiveKpb: "[5K PB]",
    coachingDuration: "[X months]",
    placeholder: true,
    placeholderNote: "Replace with real team member #2",
  },
  {
    id: "team-placeholder-3",
    name: "[Athlete name]",
    location: "[City, UK]",
    photoSrc: "/images/hyrox-team/Sequence 01.00_45_14_14.Still017.jpg",
    photoAlt: "Hybrid365 team athlete — replace with photo",
    hyroxDivision: "[Pro / Open]",
    currentPb: "[HYROX PB]",
    goal: "[Target race + time]",
    coachingDuration: "[X months]",
    placeholder: true,
    placeholderNote: "Replace with real team member #3",
  },
  {
    id: "team-placeholder-4",
    name: "[Athlete name]",
    location: "[City, UK]",
    photoSrc: "/images/community/lean muscle phisique photo.jpg",
    photoAlt: "Hybrid365 team athlete — replace with photo",
    hyroxDivision: "[Pro / Open]",
    currentPb: "[HYROX PB]",
    goal: "[Target race + time]",
    fiveKpb: "[5K PB]",
    coachingDuration: "[X months]",
    placeholder: true,
    placeholderNote: "Replace with real team member #4",
  },
];
