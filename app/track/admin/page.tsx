import { loadAdmin } from "@/app/lib/track-canary/model";

export const dynamic = "force-dynamic";

export default async function TrackAdminPage() {
  const admin = await loadAdmin();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Track oversight</p>
      <h1 className="mt-2 text-3xl font-semibold">{admin.view.name}</h1>
      <p className="mt-2 text-zinc-400">Programming state {admin.readiness}. This view does not change the athlete&apos;s week.</p>
      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold">This week</h2>
        {admin.view.homeDays.map((day) => (
          <p key={day.day} className="text-sm text-zinc-300">{day.day} · {day.title}</p>
        ))}
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Adaptations</h2>
        {(admin.adaptations.length ? admin.adaptations : [{ decision: "None yet", before_revision: null, after_revision: null }]).map((row, index) => (
          <p key={index} className="text-sm text-zinc-300">{String(row.decision)} {row.before_revision ?? ""} {row.after_revision ? `→ ${row.after_revision}` : ""}</p>
        ))}
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Escalations</h2>
        {(admin.escalations.length ? admin.escalations : [{ kind: "None", summary: "No open escalation." }]).map((row, index) => (
          <p key={index} className="text-sm text-zinc-300">{String(row.kind)} · {String(row.summary)}</p>
        ))}
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Trail</h2>
        {admin.view.audit.map((row) => (
          <p key={`${row.label}${row.at}`} className="text-sm text-zinc-400">{row.label}</p>
        ))}
      </section>
    </main>
  );
}
