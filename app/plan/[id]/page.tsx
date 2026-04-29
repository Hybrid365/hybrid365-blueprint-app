import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
};

type PlanPageProps = {
  params: Promise<{ id: string }>;
};

async function getPlanById(planId: string) {
  const token = process.env.AIRTABLE_TOKEN!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const tableName = process.env.AIRTABLE_TABLE_NAME!;

  const filterFormula = encodeURIComponent(`{Plan ID}='${planId}'`);
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    tableName
  )}?filterByFormula=${filterFormula}&maxRecords=1`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Airtable fetch error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const record: AirtableRecord | undefined = data.records?.[0];

  if (!record) return null;

  const rawPlanJson = record.fields["Generated Plan JSON"];
  if (!rawPlanJson) return null;

  let planJson: any = null;

  try {
    planJson = JSON.parse(rawPlanJson);
  } catch {
    return null;
  }

  return {
    record,
    planJson,
  };
}

function sectionTitle(title: string, subtitle?: string) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
      {subtitle ? <p className="mt-2 text-zinc-400">{subtitle}</p> : null}
    </div>
  );
}

function card(children: React.ReactNode, className = "") {
  return (
    <div
      className={`rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 md:p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${className}`}
    >
      {children}
    </div>
  );
}

function renderList(items?: string[]) {
  if (!items || items.length === 0) return null;

  return (
    <ul className="space-y-2 text-zinc-300">
      {items.map((item, i) => (
        <li key={i} className="leading-7">
          <span className="text-yellow-400">-</span> {item}
        </li>
      ))}
    </ul>
  );
}

export default async function PlanPage({ params }: PlanPageProps) {
  const { id } = await params;
  const result = await getPlanById(id);

  if (!result) {
    notFound();
  }

  const { planJson } = result;

  const profile = planJson?.profile || {};
  const firstName = profile.first_name || planJson?.first_name || "";
  const intro: string[] = Array.isArray(planJson?.intro) ? planJson.intro : [];
  const schedule: any[] = Array.isArray(planJson?.schedule) ? planJson.schedule : [];
  const cta = planJson?.cta || {};

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black px-6 py-10 md:px-10 md:py-14">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.12),transparent_30%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_20%)]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-sm text-yellow-300">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              Hybrid365 Coaching Preview
            </div>

            <div className="mt-6">
              <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Hybrid<span className="text-yellow-400">365</span>
              </div>

              <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-tight md:text-6xl">
                {firstName ? `${firstName}, here’s your ` : "Your "}
                First Week Inside{" "}
                <span className="text-yellow-400">Hybrid365</span>
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
                This is your structured week built using Hybrid365 principles —
                designed to feel specific to your current level, training
                availability, and setup.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-300">
              <div className="rounded-full border border-zinc-800 bg-zinc-950/70 px-4 py-2">
                Goal: <span className="text-white font-medium">{profile.goal || "—"}</span>
              </div>
              <div className="rounded-full border border-zinc-800 bg-zinc-950/70 px-4 py-2">
                Training Days:{" "}
                <span className="text-white font-medium">{profile.training_days || "—"}</span>
              </div>
              <div className="rounded-full border border-zinc-800 bg-zinc-950/70 px-4 py-2">
                Level: <span className="text-white font-medium">{profile.level || "—"}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6">
          {/* PROFILE */}
          {card(
            <div>
              {sectionTitle(
                "Your Hybrid Profile",
                "The key inputs used to build this first week."
              )}

              <div className="grid gap-4 md:grid-cols-2 text-sm md:text-base">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="text-zinc-500 text-xs uppercase tracking-wide">Name</div>
                  <div className="mt-1 text-white font-semibold">{firstName || "—"}</div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="text-zinc-500 text-xs uppercase tracking-wide">Goal</div>
                  <div className="mt-1 text-white font-semibold">{profile.goal || "—"}</div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="text-zinc-500 text-xs uppercase tracking-wide">Training Days</div>
                  <div className="mt-1 text-white font-semibold">{profile.training_days || "—"}</div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="text-zinc-500 text-xs uppercase tracking-wide">Priority</div>
                  <div className="mt-1 text-white font-semibold">{profile.priority || "—"}</div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="text-zinc-500 text-xs uppercase tracking-wide">Training Level</div>
                  <div className="mt-1 text-white font-semibold">{profile.level || "—"}</div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="text-zinc-500 text-xs uppercase tracking-wide">Weekly Hours</div>
                  <div className="mt-1 text-white font-semibold">{profile.weekly_hours || "—"}</div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 md:col-span-2">
                  <div className="text-zinc-500 text-xs uppercase tracking-wide">Equipment</div>
                  <div className="mt-1 text-white font-semibold">{profile.equipment || "—"}</div>
                </div>
              </div>
            </div>
          )}

          {/* INTRO */}
          {intro.length > 0 &&
            card(
              <div>
                {sectionTitle(
                  "Why This Week Looks Like This",
                  "These sessions have been selected to match where you’re currently at."
                )}

                <div className="space-y-3 text-zinc-300">
                  {intro.map((item, index) => (
                    <p key={index} className="leading-7">
                      <span className="text-yellow-400">•</span> {item}
                    </p>
                  ))}
                </div>
              </div>
            )}

          {/* INBOX REMINDER */}
          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-5 md:p-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm uppercase tracking-[0.2em] text-yellow-300">
                  Extra Coaching Support
                </p>
                <h2 className="mt-2 text-2xl md:text-3xl font-bold text-white">
                  Keep An Eye On Your Inbox This Week
                </h2>
                <p className="mt-3 leading-7 text-zinc-300">
                  Over the next few days, keep an eye out for extra Hybrid365 coaching emails.
                  You’ll get tips on how to execute these sessions properly, avoid common mistakes,
                  and get more from the week you’ve been given.
                </p>
              </div>

              <div className="rounded-2xl border border-yellow-400/20 bg-black/30 px-4 py-3 text-sm text-zinc-200">
                Check spam / junk if needed
              </div>
            </div>
          </div>

          {/* TRAINING WEEK */}
          <section>
            {sectionTitle(
              "Your Training Week",
              "A structured week designed to give you clarity, intent, and momentum."
            )}

            <div className="space-y-5">
              {schedule.map((day, index) => {
                const session = day.session || {};

                return (
                  <div
                    key={`${day.day}-${index}`}
                    className="rounded-3xl border border-zinc-800 bg-zinc-950/85 p-5 md:p-7"
                  >
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-yellow-400">
                          {day.day}
                        </p>
                        <h3 className="mt-2 text-2xl md:text-3xl font-bold text-white">
                          {day.title}
                        </h3>
                        {day.intent && (
                          <p className="mt-3 max-w-3xl text-zinc-300 leading-7">
                            {day.intent}
                          </p>
                        )}
                      </div>

                      {typeof day.time_cap_minutes === "number" && (
                        <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
                          Time cap:{" "}
                          <span className="font-semibold text-white">
                            {day.time_cap_minutes} min
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {Array.isArray(session.warm_up) && session.warm_up.length > 0 && (
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                          <h4 className="mb-3 font-semibold text-white">Warm-up</h4>
                          {renderList(session.warm_up)}
                        </div>
                      )}

                      {Array.isArray(session.main) && session.main.length > 0 && (
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 md:col-span-2">
                          <h4 className="mb-3 font-semibold text-white">Main Work</h4>
                          {renderList(session.main)}
                        </div>
                      )}

                      {Array.isArray(session.cool_down) && session.cool_down.length > 0 && (
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                          <h4 className="mb-3 font-semibold text-white">Cool-down</h4>
                          {renderList(session.cool_down)}
                        </div>
                      )}

                      {Array.isArray(session.finish) && session.finish.length > 0 && (
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                          <h4 className="mb-3 font-semibold text-white">Finish</h4>
                          {renderList(session.finish)}
                        </div>
                      )}

                      {Array.isArray(session.notes) && session.notes.length > 0 && (
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 md:col-span-2">
                          <h4 className="mb-3 font-semibold text-white">Coaching Notes</h4>
                          {renderList(session.notes)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-[2rem] border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 md:p-10 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-yellow-300">
              Next Step
            </p>

            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-white">
              {cta.headline || "Want the next 6–8 weeks built for your goal?"}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-zinc-300 leading-7">
              {cta.body ||
                "Inside Hybrid365, we build the progression, structure, and accountability around you."}
            </p>

            {cta.button_url && (
              <a
                href={cta.button_url}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-block rounded-2xl bg-yellow-400 px-7 py-3 text-sm md:text-base font-semibold text-black transition hover:opacity-90"
              >
                Explore Hybrid365
              </a>
            )}

            <p className="mt-5 text-sm text-zinc-500">
              Structured programming. Deeper personalisation. Ongoing accountability.
            </p>
          </section>

          {/* FOOTER */}
          <footer className="pt-4 text-center text-sm text-zinc-500">
            Built using <span className="text-white">Hybrid</span>
            <span className="text-yellow-400">365</span> principles.
          </footer>
        </div>
      </div>
    </main>
  );
}