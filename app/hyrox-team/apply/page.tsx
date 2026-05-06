import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Apply | Hybrid365 Hyrox Team",
  description:
    "Apply for the first Hybrid365 Hyrox Team. A small, selective athlete project built around 1-1 Hyrox coaching, team accountability, documented progress and race-day performance.",
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white/80">
      {children}
    </span>
  )
}

function ExpectationCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-[#F4D23C]">
        {number} / {title}
      </div>
      <p className="text-sm leading-relaxed text-white/70">{description}</p>
    </div>
  )
}

function FormField({
  label,
  name,
  type = "text",
  required = true,
  textarea = false,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  textarea?: boolean
  placeholder?: string
}) {
  const inputClasses =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#F4D23C]/50 focus:outline-none focus:ring-1 focus:ring-[#F4D23C]/50 transition-colors"

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-xs font-medium uppercase tracking-wider text-white/60"
      >
        {label}
        {required && <span className="ml-1 text-[#F4D23C]">*</span>}
      </label>

      {textarea ? (
        <textarea
          id={name}
          name={name}
          required={required}
          placeholder={placeholder}
          rows={4}
          className={inputClasses + " resize-none"}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
    </div>
  )
}

export default function HyroxTeamApplyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="px-5 pb-16 pt-20 md:px-8 md:pb-24 md:pt-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-[#F4D23C]">
            Team 001 / Application
          </div>

          <h1 className="mb-6 text-4xl font-bold uppercase leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
            Apply for the
            <br />
            Hybrid365 Hyrox Team.
          </h1>

          <p className="mb-10 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            A small, selective athlete project built around 1-1 Hyrox coaching, team accountability,
            documented progress and race-day performance.
          </p>

          <div className="flex flex-wrap gap-3">
            <Pill>5–6 athletes max</Pill>
            <Pill>Applications reviewed manually</Pill>
            <Pill>1-1 coaching inside a team</Pill>
            <Pill>Documented race build</Pill>
            <Pill>Refuse Average</Pill>
          </div>
        </div>
      </section>

      {/* Expectation Section */}
      <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-2xl font-bold uppercase tracking-tight md:text-3xl">
            What We&apos;re Looking For.
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <ExpectationCard
              number="01"
              title="Intent"
              description="Serious about Hyrox. You're not here to dabble — you want to race, improve, and commit to the process."
            />
            <ExpectationCard
              number="02"
              title="Standards"
              description="Ready to be coached. You're open to feedback, willing to follow structure, and hold yourself accountable."
            />
            <ExpectationCard
              number="03"
              title="Story"
              description="Open to the journey. You're comfortable with your progress being documented and shared."
            />
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          <form action="https://formspree.io/f/xlgznozk" method="POST" className="space-y-8">
            {/* Hidden inputs */}
            <input
              type="hidden"
              name="_subject"
              value="New Hybrid365 Hyrox Team Application"
            />
            <input
              type="hidden"
              name="source"
              value="Hybrid365 Hyrox Team Application Page"
            />
            <input
              type="hidden"
              name="_next"
              value="https://plan.hybrid-365.com/hyrox-team/thank-you"
            />

            {/* Personal Details */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <h3 className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-[#F4D23C]">
                Personal Details
              </h3>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Full Name" name="full_name" placeholder="Your full name" />
                <FormField
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                />
                <FormField
                  label="Instagram Handle"
                  name="instagram"
                  placeholder="@yourhandle"
                  required={false}
                />
                <FormField label="Location" name="location" placeholder="City, Country" />
              </div>
            </div>

            {/* Current Fitness */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <h3 className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-[#F4D23C]">
                Current Fitness
              </h3>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  label="Current Hyrox Experience"
                  name="hyrox_experience"
                  placeholder="e.g. 2 races, Pro division"
                />
                <FormField
                  label="Current Hyrox PB / Result"
                  name="hyrox_pb"
                  placeholder="e.g. 1:12:34"
                />
                <FormField
                  label="Current 5km Time"
                  name="five_km_time"
                  placeholder="e.g. 22:30"
                />
                <FormField
                  label="Upcoming Race / Target Event"
                  name="upcoming_race"
                  placeholder="e.g. Hyrox London, March 2025"
                />
              </div>
            </div>

            {/* Training */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <h3 className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-[#F4D23C]">
                Training
              </h3>

              <div className="space-y-5">
                <FormField
                  label="Current Weekly Training"
                  name="weekly_training"
                  textarea
                  placeholder="Describe your typical training week — frequency, type of sessions, duration..."
                />
                <FormField
                  label="Main Goal"
                  name="main_goal"
                  textarea
                  placeholder="What's your primary goal for Hyrox? Time target, division, personal challenge..."
                />
                <FormField
                  label="Biggest Weakness / Limiter"
                  name="weakness"
                  textarea
                  placeholder="What holds you back the most? Running, specific stations, pacing, recovery..."
                />
                <FormField
                  label="Training History, Injuries, Equipment Notes"
                  name="training_history"
                  textarea
                  required={false}
                  placeholder="Anything we should know about your background, injury history, or gym setup..."
                />
              </div>
            </div>

            {/* Team Fit */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <h3 className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-[#F4D23C]">
                Team Fit
              </h3>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="documented"
                    className="block text-xs font-medium uppercase tracking-wider text-white/60"
                  >
                    Are you happy for your progress to be documented?
                    <span className="ml-1 text-[#F4D23C]">*</span>
                  </label>

                  <select
                    id="documented"
                    name="documented"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F4D23C]/50 focus:outline-none focus:ring-1 focus:ring-[#F4D23C]/50 transition-colors"
                  >
                    <option value="" className="bg-black">
                      Select an option
                    </option>
                    <option value="yes" className="bg-black">
                      Yes
                    </option>
                    <option value="no" className="bg-black">
                      No
                    </option>
                    <option value="maybe" className="bg-black">
                      Open to discussing
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="team_training"
                    className="block text-xs font-medium uppercase tracking-wider text-white/60"
                  >
                    Can you attend occasional team training sessions?
                    <span className="ml-1 text-[#F4D23C]">*</span>
                  </label>

                  <select
                    id="team_training"
                    name="team_training"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#F4D23C]/50 focus:outline-none focus:ring-1 focus:ring-[#F4D23C]/50 transition-colors"
                  >
                    <option value="" className="bg-black">
                      Select an option
                    </option>
                    <option value="yes" className="bg-black">
                      Yes
                    </option>
                    <option value="no" className="bg-black">
                      No
                    </option>
                    <option value="depending_on_location" className="bg-black">
                      Depending on location
                    </option>
                  </select>
                </div>

                <FormField
                  label="Why do you want to join the first Hybrid365 Hyrox Team?"
                  name="why_join"
                  textarea
                  placeholder="What draws you to this project? What would being part of this team mean for you?"
                />
              </div>
            </div>

            {/* Consent */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  id="consent"
                  name="consent"
                  required
                  className="mt-1 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 checked:border-[#F4D23C] checked:bg-[#F4D23C] focus:outline-none focus:ring-2 focus:ring-[#F4D23C]/50"
                />

                <label
                  htmlFor="consent"
                  className="cursor-pointer text-sm leading-relaxed text-white/70"
                >
                  I understand this is an application for a selective athlete project. I consent to
                  my information being reviewed by the Hybrid365 team and understand that submitting
                  this form does not guarantee a place on the team.
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#F4D23C] px-8 py-4 text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-[#F4D23C]/90 focus:outline-none focus:ring-2 focus:ring-[#F4D23C] focus:ring-offset-2 focus:ring-offset-black md:w-auto"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Final Statement */}
      <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xl font-bold uppercase tracking-wide text-white/50 md:text-2xl">
            This is for athletes ready to work.
          </p>
        </div>
      </section>
    </main>
  )
}