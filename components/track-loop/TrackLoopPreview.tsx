"use client";

import { useMemo, useState } from "react";

export type LoopPreviewModel = {
  id: string;
  label: string;
  readiness: string;
  programming: string;
  ski: string | null;
  row: string | null;
  threshold: string | null;
  week: string[];
  beforeWeek: string[];
  explanation: string;
  offer: boolean;
  status: string | null;
  applied: boolean;
  declined: boolean;
  nextDecision: string;
  nextExplanation: string;
  changes: Array<{ label: string; from: string; to: string }>;
  escalations: string[];
  notifications: string[];
  weeks: number;
  race: string | null;
  feedback: Array<{ sessionId: string; completion: string; rpe: number | null }>;
};

const SCREENS = ["home", "readiness", "choice", "week", "feedback", "checkin", "progress", "review"] as const;
type Screen = (typeof SCREENS)[number];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayTitle(rows: string[], day: string): string {
  return rows.find((row) => row.startsWith(`${day} `))?.slice(day.length + 1) ?? "Rest";
}

export default function TrackLoopPreview({ models }: { models: LoopPreviewModel[] }) {
  const [storyId, setStoryId] = useState(models[0]?.id ?? "accept");
  const [screen, setScreen] = useState<Screen>("home");
  const [choice, setChoice] = useState<"pending" | "accepted" | "kept">("pending");
  const story = useMemo(() => models.find((model) => model.id === storyId) ?? models[0], [models, storyId]);
  if (!story) return null;

  const showingOriginal = story.id === "accept" ? choice !== "accepted" : !story.applied;
  const rows = showingOriginal ? story.beforeWeek : story.week;
  const today = dayTitle(rows, "Tue");

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-16 pt-4">
      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Track</p>
          <p className="text-xs text-zinc-400">{story.race ?? "No event"}</p>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
          {DAYS.map((day, index) => (
            <div key={day} className={day === "Tue" ? "rounded-md bg-[#f4d23c] px-1 py-1 font-semibold text-black" : "rounded-md bg-zinc-900 px-1 py-1 text-zinc-400"}>
              {day.slice(0, 1)}
              <div className="text-[10px] font-medium">{16 + index}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {models.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => {
              setStoryId(model.id);
              setScreen("home");
              setChoice("pending");
            }}
            className={model.id === story.id ? "shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black" : "shrink-0 rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-300"}
          >
            {model.label}
          </button>
        ))}
      </div>

      {screen === "home" && (
        <section className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">Tuesday</h1>
          <button type="button" onClick={() => setScreen("readiness")} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Morning</p>
            <p className="mt-1 text-lg">{story.id === "pain" ? "You reported pain. A coach needs to see it." : story.readiness === "MISSING" ? "Check in when you can" : "Recovery is lower than your normal"}</p>
          </button>
          <button type="button" onClick={() => setScreen(story.offer ? "choice" : "week")} className="w-full rounded-2xl bg-zinc-900 p-4 text-left">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Today</p>
            <p className="mt-1 text-xl font-medium">{today}</p>
          </button>
          {story.offer && choice === "pending" && (
            <button type="button" onClick={() => setScreen("choice")} className="w-full rounded-2xl border border-[#f4d23c] p-4 text-left">
              <p className="text-xs uppercase tracking-wide text-[#f4d23c]">Recommended change</p>
              <p className="mt-1 text-sm leading-6 text-zinc-200">{story.explanation}</p>
            </button>
          )}
          <p className="text-sm text-zinc-500">{story.weeks} week proposal is ready to review. It is not published.</p>
        </section>
      )}

      {screen === "readiness" && (
        <section className="space-y-3">
          <h1 className="text-2xl font-semibold">This morning</h1>
          {["Sleep", "Energy", "Recovery", "Soreness", "Training readiness"].map((label) => (
            <div key={label} className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
              <span>{label}</span>
              <span className="text-zinc-400">{story.readiness === "MISSING" ? "—" : label === "Soreness" ? "6" : "4"}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
            <span>Pain</span>
            <span>{story.id === "pain" ? "Yes" : "No"}</span>
          </div>
          <button type="button" onClick={() => setScreen(story.offer ? "choice" : "week")} className="w-full rounded-xl bg-[#f4d23c] py-3 font-semibold text-black">
            Save
          </button>
        </section>
      )}

      {screen === "choice" && (
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Today</h1>
          <p className="text-sm leading-6 text-zinc-300">{story.explanation}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-zinc-900 p-3">
              <p className="text-xs uppercase text-zinc-500">Today</p>
              <p className="mt-2 font-medium">{dayTitle(story.beforeWeek, "Tue")}</p>
            </div>
            <div className="rounded-2xl bg-zinc-900 p-3">
              <p className="text-xs uppercase text-[#f4d23c]">Recommended</p>
              <p className="mt-2 font-medium">{story.status === "proposed" ? "40 min easy bike" : "Keep the plan"}</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-zinc-400">
            {story.status === "proposed"
              ? "Threshold moves to Wednesday. Thursday stays easy so the harder sessions remain apart."
              : "The rest of the week stays as written."}
          </p>
          {story.offer && choice === "pending" && (
            <div className="space-y-2">
              <button type="button" onClick={() => { setChoice("accepted"); setScreen("week"); }} className="w-full rounded-xl bg-[#f4d23c] py-3 font-semibold text-black">
                Accept changes
              </button>
              <button type="button" onClick={() => { setChoice("kept"); setScreen("week"); }} className="w-full rounded-xl border border-zinc-700 py-3 font-semibold">
                Keep original plan
              </button>
            </div>
          )}
          {!story.offer && (
            <button type="button" onClick={() => setScreen("week")} className="w-full rounded-xl bg-white py-3 font-semibold text-black">
              See the week
            </button>
          )}
        </section>
      )}

      {screen === "week" && (
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold">{story.applied || choice === "accepted" ? "Updated week" : "This week"}</h1>
          {DAYS.map((day) => (
            <div key={day} className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
              <span className="w-12 text-zinc-500">{day}</span>
              <span className="flex-1 text-right">{dayTitle(story.id === "accept" && choice === "accepted" ? story.week : rows, day)}</span>
            </div>
          ))}
          <button type="button" onClick={() => setScreen("feedback")} className="mt-3 w-full rounded-xl bg-white py-3 font-semibold text-black">
            Log a session
          </button>
        </section>
      )}

      {screen === "feedback" && (
        <section className="space-y-3">
          <h1 className="text-2xl font-semibold">Session</h1>
          <div className="grid grid-cols-2 gap-2">
            {["Completed", "Partial", "Modified", "Skipped"].map((label) => (
              <div key={label} className={label === "Completed" ? "rounded-xl bg-[#f4d23c] px-3 py-3 text-center font-semibold text-black" : "rounded-xl bg-zinc-900 px-3 py-3 text-center"}>
                {label}
              </div>
            ))}
          </div>
          <p className="text-sm text-zinc-400">RPE 7 · As expected · Pain no</p>
          {story.feedback.map((row) => (
            <p key={row.sessionId} className="text-sm text-zinc-300">
              {row.sessionId.replace("key-", "")} · {row.completion}{row.rpe != null ? ` · RPE ${row.rpe}` : ""}
            </p>
          ))}
          <button type="button" onClick={() => setScreen("checkin")} className="w-full rounded-xl bg-white py-3 font-semibold text-black">
            Weekly check-in
          </button>
        </section>
      )}

      {screen === "checkin" && (
        <section className="space-y-3">
          <h1 className="text-2xl font-semibold">This week</h1>
          {[
            ["Overall recovery", "8"],
            ["Motivation", "8"],
            ["Life stress", "3"],
            ["How manageable was training?", "8"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
              <span>{label}</span>
              <span className="text-zinc-400">{value}</span>
            </div>
          ))}
          {[
            ["Persistent soreness?", "No"],
            ["Availability changed?", "No"],
            ["Travel or work issue?", "No"],
            ["Event change?", "No"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
              <span>{label}</span>
              <span>{value}</span>
            </div>
          ))}
          <button type="button" onClick={() => setScreen("progress")} className="w-full rounded-xl bg-[#f4d23c] py-3 font-semibold text-black">
            Save check-in
          </button>
        </section>
      )}

      {screen === "progress" && (
        <section className="space-y-3">
          <h1 className="text-2xl font-semibold">Progress</h1>
          <div className="rounded-2xl bg-zinc-900 p-4">
            <p className="text-xs uppercase text-zinc-500">Running</p>
            <p className="mt-2">Threshold {story.threshold ?? "Not set yet"}</p>
            <p className="text-sm text-zinc-400">Based on 5K 18:12 · 5 Nov</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 p-4">
            <p className="text-xs uppercase text-zinc-500">Erg</p>
            <p className="mt-2">Ski {story.ski ?? "Missing"}</p>
            <p>Row {story.row ?? "Missing"}</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 p-4">
            <p className="text-xs uppercase text-zinc-500">Stations</p>
            <p className="mt-2">Sled hold · Wall balls hold</p>
          </div>
          <button type="button" onClick={() => setScreen("review")} className="w-full rounded-xl bg-white py-3 font-semibold text-black">
            Next week
          </button>
        </section>
      )}

      {screen === "review" && (
        <section className="space-y-3">
          <h1 className="text-2xl font-semibold">Your next week is ready</h1>
          <p className="text-sm uppercase tracking-wide text-[#f4d23c]">{story.nextDecision}</p>
          {story.changes.map((change) => (
            <div key={change.label} className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
              <span>{change.label}</span>
              <span className="text-zinc-300">{change.from} → {change.to}</span>
            </div>
          ))}
          <p className="text-sm leading-6 text-zinc-300">{story.nextExplanation}</p>
          {story.escalations.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 p-4">
              <p className="text-xs uppercase text-zinc-500">Coach queue</p>
              <p className="mt-2">{story.escalations.join(", ").replaceAll("_", " ")}</p>
            </div>
          )}
          <p className="text-xs text-zinc-500">Programme status {story.programming}. Publishing stays off.</p>
        </section>
      )}
    </main>
  );
}
