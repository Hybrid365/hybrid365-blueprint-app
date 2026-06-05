/** Community group-programming support copy — not 1-1 coaching. */
export const COMMUNITY_SUPPORT_QUESTIONS =
  "Message in the community with any questions.";

export const COMMUNITY_SUPPORT_SCALE =
  "Post in the community if you're unsure how to scale this.";

export const COMMUNITY_SUPPORT_FORCE =
  "If anything feels off, ask before forcing the session.";

export const COMMUNITY_SUPPORT_OVERVIEW = `${COMMUNITY_SUPPORT_QUESTIONS} ${COMMUNITY_SUPPORT_SCALE}`;

export function coachNoteForSession(kind: "hard" | "hyrox" | "addon" | "equipment" | "general"): string {
  switch (kind) {
    case "hard":
      return `${COMMUNITY_SUPPORT_SCALE} ${COMMUNITY_SUPPORT_FORCE}`;
    case "hyrox":
      return `${COMMUNITY_SUPPORT_QUESTIONS} ${COMMUNITY_SUPPORT_FORCE}`;
    case "addon":
      return COMMUNITY_SUPPORT_SCALE;
    case "equipment":
      return `${COMMUNITY_SUPPORT_SCALE} ${COMMUNITY_SUPPORT_QUESTIONS}`;
    default:
      return COMMUNITY_SUPPORT_QUESTIONS;
  }
}

export function appendCoachNote(text: string, note: string): string {
  if (text.includes(note.slice(0, 20))) return text;
  return `${text} ${note}`;
}
