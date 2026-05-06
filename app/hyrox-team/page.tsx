import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Hybrid365 Hyrox Team | Elite Coaching & Athlete Development",
  description:
    "1-1 Hyrox coaching inside a small performance team. Tested, coached, documented, and built for race day. Only 5-6 athletes selected.",
}

// Helper Components
function Section({
  children,
  className = "",
  clean = false,
  id,
}: {
  children: React.ReactNode
  className?: string
  clean?: boolean
  id?: string
}) {
  return (
    <section
      id={id}
      className={`relative my-[18px] px-6 py-10 sm:px-10 sm:py-14 lg:px-[76px] lg:py-[76px] rounded-[24px] sm:rounded-[34px] border border-white/[0.11] overflow-hidden ${
        clean
          ? "bg-gradient-to-b from-white/[0.035] to-white/[0.018]"
          : "bg-[radial-gradient(circle_at_top_left,rgba(244,210,60,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))]"
      } ${className}`}
    >
      {children}
    </section>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5 px-3 py-2 border border-[#f4d23c]/[0.36] text-[#f4d23c] rounded-full text-xs font-black tracking-[0.14em] uppercase bg-[#f4d23c]/[0.075]">
      <span className="w-[7px] h-[7px] rounded-full bg-[#f4d23c] shadow-[0_0_18px_rgba(244,210,60,0.95)]" />
      {children}
    </div>
  )
}

function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`min-h-[52px] inline-flex items-center justify-center px-6 rounded-full font-black tracking-[-0.02em] bg-[#f4d23c] text-[#050505] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 ${className}`}
    >
      {children}
    </Link>
  )
}

function SecondaryButton({
  href,
  children,
  className = "",
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`min-h-[52px] inline-flex items-center justify-center px-6 rounded-full font-black tracking-[-0.02em] text-[#f6f6f6] border border-white/[0.18] bg-white/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 ${className}`}
    >
      {children}
    </Link>
  )
}

function Pill({ children, yellow = false }: { children: React.ReactNode; yellow?: boolean }) {
  return (
    <span
      className={`inline-flex items-center min-h-[34px] px-3 rounded-full text-[13px] font-extrabold ${
        yellow
          ? "bg-[#f4d23c] text-[#050505] border-[#f4d23c]"
          : "bg-white/[0.065] border border-white/[0.12] text-[#e9e9e9]"
      }`}
    >
      {children}
    </span>
  )
}

function SectionHeader({
  title,
  highlight,
  description,
}: {
  title: string
  highlight: string
  description?: string
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 lg:gap-6 mb-7">
      <h2 className="text-[clamp(34px,5.6vw,72px)] leading-[0.9] tracking-[-0.065em] uppercase font-black m-0">
        {title}
        <br />
        <span className="text-[#f4d23c]">{highlight}</span>
      </h2>
      {description && (
        <p className="max-w-[480px] m-0 text-[#a9a9a9] leading-relaxed text-base">{description}</p>
      )}
    </div>
  )
}

function Card({
  num,
  title,
  description,
}: {
  num?: string
  title: string
  description: string
}) {
  return (
    <div className="border border-white/[0.11] bg-gradient-to-b from-white/[0.065] to-white/[0.025] rounded-[20px] sm:rounded-[24px] p-5 sm:p-[22px] min-h-[210px]">
      {num && (
        <div className="text-[#f4d23c] text-xs font-black tracking-[0.12em] uppercase mb-7">
          {num}
        </div>
      )}
      <h3 className="m-0 mb-2.5 text-[21px] leading-[1.05] tracking-[-0.04em]">{title}</h3>
      <p className="m-0 text-[#a9a9a9] leading-[1.45] text-sm">{description}</p>
    </div>
  )
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-white/[0.11] bg-[#101010] rounded-[20px] sm:rounded-[26px] p-5 sm:p-[26px]">
      <h3 className="m-0 mb-[18px] text-[#f4d23c] uppercase tracking-[0.11em] text-[13px] font-black">
        {title}
      </h3>
      <ul className="list-none p-0 m-0 grid gap-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-[#e9e9e9] leading-[1.42] text-sm">
            <span className="text-[#f4d23c] font-black flex-shrink-0">→</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PhotoCard({ title, subtitle, image }: { title: string; subtitle: string; image?: string }) {
  return (
    <div className="relative min-h-[280px] sm:min-h-[320px] rounded-[20px] sm:rounded-[28px] border border-white/[0.12] overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">
      {image && (
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover grayscale-[25%] contrast-[1.1] brightness-[0.75]"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      <div className="absolute left-5 right-5 bottom-[18px] z-10">
        <strong className="block text-white text-[22px] leading-none tracking-[-0.045em] uppercase">
          {title}
        </strong>
        <small className="block mt-[7px] text-[#f4d23c] text-[11px] uppercase font-black tracking-[0.1em]">
          {subtitle}
        </small>
      </div>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border border-white/[0.11] rounded-[18px] sm:rounded-[22px] bg-white/[0.035] p-5 sm:p-[22px]">
      <h3 className="m-0 mb-2 text-lg tracking-[-0.035em]">{question}</h3>
      <p className="m-0 text-[#a9a9a9] leading-[1.45] text-sm">{answer}</p>
    </div>
  )
}

function TimelineStep({
  num,
  title,
  description,
}: {
  num: string
  title: string
  description: string
}) {
  return (
    <div className="grid grid-cols-[48px_1fr] gap-3.5 p-4 sm:p-[18px] bg-white/[0.045] border border-white/[0.11] rounded-[18px] sm:rounded-[22px]">
      <div className="w-12 h-12 grid place-items-center bg-[#f4d23c] text-[#050505] rounded-2xl font-black">
        {num}
      </div>
      <div>
        <h3 className="m-0 mb-1.5 tracking-[-0.035em] text-lg">{title}</h3>
        <p className="m-0 text-[#a9a9a9] leading-[1.4] text-sm">{description}</p>
      </div>
    </div>
  )
}

function MetricBar({
  label,
  status,
  progress,
}: {
  label: string
  status: string
  progress: number
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 items-center py-3.5 border-t border-white/[0.08] first:border-t-0">
      <span className="text-[#eaeaea] text-sm font-extrabold">{label}</span>
      <strong className="text-[#f4d23c] text-[15px]">{status}</strong>
      <div className="col-span-2 h-[7px] rounded-full bg-white/[0.09] overflow-hidden">
        <div className="h-full rounded-full bg-[#f4d23c]" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function AthleteCard({
  name,
  tag,
  profile,
}: {
  name: string
  tag: string
  profile: { label: string; value: string }[]
}) {
  return (
    <div className="relative border border-white/[0.12] rounded-[20px] sm:rounded-[28px] p-5 sm:p-[26px] bg-gradient-to-b from-white/[0.075] to-white/[0.025] overflow-hidden">
      <div className="absolute right-[-20px] top-8 rotate-90 text-white/[0.05] text-[28px] font-black tracking-[-0.06em] hidden sm:block">
        ATHLETE PROFILE
      </div>
      <div className="flex justify-between gap-4 items-start mb-5 sm:mb-[22px]">
        <h3 className="m-0 text-[26px] sm:text-[30px] leading-[0.95] tracking-[-0.055em] uppercase">
          {name}
        </h3>
        <span className="bg-[#f4d23c] text-[#050505] py-2 px-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.08em] whitespace-nowrap">
          {tag}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {profile.map((item, i) => (
          <div
            key={i}
            className="bg-black/[0.28] border border-white/[0.09] rounded-[14px] sm:rounded-[18px] p-3 sm:p-3.5"
          >
            <small className="block text-[#a9a9a9] text-[10px] uppercase font-black tracking-[0.1em] mb-[7px]">
              {item.label}
            </small>
            <strong className="text-white text-sm sm:text-base leading-[1.15]">{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

// Section Components
function HeroSection() {
  return (
    <Section className="min-h-0 lg:min-h-[720px] grid grid-cols-1 lg:grid-cols-[1.02fr_0.98fr] gap-8 lg:gap-[34px] items-center">
      <div>
        <Eyebrow>Team 001 / Applications opening soon</Eyebrow>
        <h1 className="my-6 text-[clamp(48px,8.6vw,108px)] leading-[0.86] tracking-[-0.085em] uppercase font-black">
          Hybrid365
          <br />
          <span className="text-[#f4d23c]">Hyrox Team</span>
        </h1>
        <p className="max-w-[680px] text-[#dddddd] text-[clamp(17px,2vw,23px)] leading-[1.42] m-0">
          1-1 Hyrox coaching inside a small performance team — tested, coached, documented, and
          built for race day.
        </p>
        <div className="mt-[22px] flex flex-wrap gap-[9px]">
          <Pill yellow>5-6 athletes max</Pill>
          <Pill>1-1 personalised coaching</Pill>
          <Pill>Athlete screening</Pill>
          <Pill>Team training days</Pill>
          <Pill>Documented journey</Pill>
        </div>
        <div className="flex flex-wrap gap-3.5 mt-[30px]">
          <PrimaryButton href="/hyrox-team/apply" className="w-full sm:w-auto">
            Apply / Register Interest
          </PrimaryButton>
          <SecondaryButton href="#included" className="w-full sm:w-auto">
            See What&apos;s Included
          </SecondaryButton>
        </div>
      </div>
      <div className="rounded-[24px] sm:rounded-[32px] border border-white/[0.14] overflow-hidden bg-[#0b0b0b] shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sequence%2001.00_37_26_11.Still015-SvB40zqquvzbypgCHSLtqKIXipujBq.jpg"
            alt="Hyrox athletes at the start line"
            fill
            className="object-cover grayscale-[20%] contrast-[1.1] brightness-[0.7]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="w-[76px] h-[76px] rounded-full bg-[#f4d23c] text-[#050505] grid place-items-center text-[30px] font-black shadow-[0_0_40px_rgba(244,210,60,0.4)] cursor-pointer transition-transform hover:scale-105">
              ▶
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <p className="text-white/80 text-sm font-medium">Watch the trailer</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.08]">
          <div className="bg-[#0d0d0d] p-[18px]">
            <strong className="block text-[#f4d23c] text-[28px] leading-none mb-1.5 tracking-[-0.05em]">
              5-6
            </strong>
            <small className="text-[#a9a9a9] uppercase text-[11px] font-black tracking-[0.09em]">
              Selected athletes
            </small>
          </div>
          <div className="bg-[#0d0d0d] p-[18px]">
            <strong className="block text-[#f4d23c] text-[28px] leading-none mb-1.5 tracking-[-0.05em]">
              1-1
            </strong>
            <small className="text-[#a9a9a9] uppercase text-[11px] font-black tracking-[0.09em]">
              Programming
            </small>
          </div>
          <div className="bg-[#0d0d0d] p-[18px]">
            <strong className="block text-[#f4d23c] text-[28px] leading-none mb-1.5 tracking-[-0.05em]">
              Race
            </strong>
            <small className="text-[#a9a9a9] uppercase text-[11px] font-black tracking-[0.09em]">
              Documented build
            </small>
          </div>
        </div>
      </div>
    </Section>
  )
}

function NotJustCoachingSection() {
  const cards = [
    {
      num: "01 / Coaching",
      title: "Individual plan",
      description:
        "Training built around your race date, current level, schedule, weaknesses, equipment and performance targets.",
    },
    {
      num: "02 / Standards",
      title: "Selective team",
      description:
        "This is not open to everyone. The right people need to be coachable, consistent and willing to represent Hybrid365 properly.",
    },
    {
      num: "03 / Team",
      title: "Accountability",
      description:
        "Private team environment, shared benchmarks, group energy and semi-regular in-person training sessions.",
    },
    {
      num: "04 / Story",
      title: "Documented build",
      description:
        "Progress, setbacks, PBs, sessions, race prep and race day captured as part of the Hybrid365 brand story.",
    },
  ]

  return (
    <Section clean>
      <SectionHeader
        title="Not just"
        highlight="coaching."
        description="This is a coached athlete project. Every member gets first-class 1-1 programming, weekly check-ins and individual progression, but the bigger vision is to build a real Hybrid365 team that represents the brand publicly."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((card, i) => (
          <Card key={i} num={card.num} title={card.title} description={card.description} />
        ))}
      </div>
    </Section>
  )
}

function TeamWillBeSeenSection() {
  const photos = [
    { 
      title: "Training days", 
      subtitle: "Team sessions / coaching / behind the scenes",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b-and-ww-XbNYJAZRqP7o6XwmPSxvdpnOJx7ORN.jpg"
    },
    { 
      title: "Athlete stories", 
      subtitle: "Individual progress tracked",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dump5-pcjPDS527ZEOeoZdO2YG5qRYPAQIeY.jpg"
    },
    { 
      title: "Race day", 
      subtitle: "Cinematic content / final result",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sequence%2001.00_45_14_14.Still017-FniXGiRevy5ReZYe97cymfrrpYnMyf.jpg"
    },
  ]

  return (
    <Section clean>
      <SectionHeader
        title="The team will"
        highlight="be seen."
        description="The content side is not an add-on. It is part of the project. The goal is to create a documentary-style race build around real people becoming better Hyrox athletes."
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {photos.map((photo, i) => (
          <PhotoCard key={i} title={photo.title} subtitle={photo.subtitle} image={photo.image} />
        ))}
      </div>
    </Section>
  )
}

function WhatsIncludedSection() {
  const lists = [
    {
      title: "1-1 Coaching",
      items: [
        "Fully personalised Hyrox-specific programming",
        "Weekly check-ins and feedback",
        "Run, strength and station development",
        "Compromised running built into the plan",
        "Race pacing, taper and fuelling strategy",
        "Post-race review and next steps",
      ],
    },
    {
      title: "Team Environment",
      items: [
        "5-6 athletes maximum",
        "Private team chat and accountability",
        "Semi-regular team training meet-ups",
        "Shared benchmark sessions",
        "High standards and serious intent",
        "Group race-build atmosphere",
      ],
    },
    {
      title: "Brand / Content",
      items: [
        "Athlete progress documented on socials",
        "Individual and team storylines tracked",
        "Training clips, check-ins, PBs and setbacks",
        "Race-day video and content package",
        "Nutrition support powered by Bulk",
        "Opportunity to represent Hybrid365 publicly",
      ],
    },
  ]

  return (
    <Section id="included">
      <SectionHeader
        title="What's"
        highlight="included."
        description="The core product is first-class coaching. The reason it feels different is the team environment, performance tracking and public documentation of the journey."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {lists.map((list, i) => (
          <ListCard key={i} title={list.title} items={list.items} />
        ))}
      </div>
    </Section>
  )
}

function AthleteStandardSection() {
  const standards = [
    {
      num: "Standard 01",
      title: "Show up properly",
      description:
        "Train with intent, communicate honestly, complete check-ins and take the build seriously.",
    },
    {
      num: "Standard 02",
      title: "Be coachable",
      description:
        "Follow the process, give feedback, ask questions and be willing to adjust when needed.",
    },
    {
      num: "Standard 03",
      title: "Support the team",
      description:
        "Bring energy to the group, celebrate progress and contribute to the team environment.",
    },
    {
      num: "Standard 04",
      title: "Represent the brand",
      description:
        "Be comfortable being part of the public journey and representing Hybrid365 with high standards.",
    },
  ]

  return (
    <Section clean>
      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-3.5">
        <div className="bg-[#f4d23c] text-[#050505] rounded-[20px] sm:rounded-[28px] p-6 sm:p-[30px]">
          <h3 className="text-[clamp(34px,4.8vw,62px)] leading-[0.9] tracking-[-0.07em] uppercase m-0 mb-[18px]">
            The Hybrid365 athlete standard.
          </h3>
          <p className="m-0 text-black/[0.72] font-extrabold leading-[1.4]">
            This team will represent more than a coaching programme. It will represent the Hybrid365
            identity: fast, fit, strong, coachable, consistent and built to perform.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {standards.map((standard, i) => (
            <Card
              key={i}
              num={standard.num}
              title={standard.title}
              description={standard.description}
            />
          ))}
        </div>
      </div>
    </Section>
  )
}

function AthleteScreeningSection() {
  const metrics = [
    { label: "5km running", status: "Current / Target", progress: 72 },
    { label: "Sled strength", status: "Needs work", progress: 48 },
    { label: "Wall balls", status: "Improving", progress: 61 },
    { label: "Compromised running", status: "Key focus", progress: 54 },
    { label: "Race strategy", status: "To build", progress: 40 },
  ]

  const tracks = [
    {
      num: "Track 01",
      title: "Running",
      description:
        "5km time, interval paces, Hyrox run splits, drop-off, aerobic base and compromised running ability.",
    },
    {
      num: "Track 02",
      title: "Stations",
      description: "Ski, sled push, sled pull, burpees, row, farmers carry, lunges and wall balls.",
    },
    {
      num: "Track 03",
      title: "Strength",
      description:
        "Lower-body capacity, posterior chain, trunk strength, durability and movement quality.",
    },
    {
      num: "Track 04",
      title: "Race execution",
      description:
        "Pacing, transitions, fuelling, late-race drop-off, station efficiency and race-day confidence.",
    },
  ]

  return (
    <Section clean>
      <SectionHeader
        title="Athlete"
        highlight="screening."
        description="Every athlete starts with a screening process so we can understand their current level, identify weaknesses and track genuine progress across the build."
      />
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4">
        <div className="bg-[#0f0f0f] border border-white/[0.11] rounded-[20px] sm:rounded-[28px] p-5 sm:p-[26px]">
          <h3 className="m-0 mb-4 text-[26px] tracking-[-0.055em] uppercase">
            Example performance profile
          </h3>
          {metrics.map((metric, i) => (
            <MetricBar key={i} label={metric.label} status={metric.status} progress={metric.progress} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {tracks.map((track, i) => (
            <Card key={i} num={track.num} title={track.title} description={track.description} />
          ))}
        </div>
      </div>
    </Section>
  )
}

function AthleteStorylinesSection() {
  const athletes = [
    {
      name: "Athlete 001",
      tag: "Example",
      profile: [
        { label: "Current", value: "First Hyrox" },
        { label: "Goal", value: "Finish strong" },
        { label: "Limiter", value: "Running confidence" },
        { label: "Focus", value: "Structure + pacing" },
      ],
    },
    {
      name: "Athlete 002",
      tag: "Example",
      profile: [
        { label: "Current", value: "1:20 Hyrox" },
        { label: "Goal", value: "Sub-75" },
        { label: "Limiter", value: "Wall balls + run drop-off" },
        { label: "Focus", value: "Station endurance" },
      ],
    },
    {
      name: "Athlete 003",
      tag: "Example",
      profile: [
        { label: "Current", value: "Sub-70 attempt" },
        { label: "Goal", value: "Compete higher" },
        { label: "Limiter", value: "Sled + late race" },
        { label: "Focus", value: "Specific race prep" },
      ],
    },
  ]

  return (
    <Section>
      <SectionHeader
        title="Every athlete gets"
        highlight="a storyline."
        description="People will not just follow the team. They will follow the individual journeys inside it — where each athlete starts, what they are chasing, what needs to change and what happens on race day."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {athletes.map((athlete, i) => (
          <AthleteCard key={i} name={athlete.name} tag={athlete.tag} profile={athlete.profile} />
        ))}
      </div>
    </Section>
  )
}

function BuiltLikeDocumentarySection() {
  const stages = [
    {
      num: "Week 00",
      title: "Meet the athlete",
      description: "Who they are, where they are starting from, their current PB and their target.",
    },
    {
      num: "Weeks 01-08",
      title: "The build",
      description:
        "Training clips, check-in insights, team sessions, benchmark tests and coaching adjustments.",
    },
    {
      num: "Race week",
      title: "The taper",
      description:
        "Fuelling, pacing, final prep, nerves, strategy and behind-the-scenes race-week content.",
    },
    {
      num: "Race day",
      title: "The result",
      description:
        "Full race-day content, post-race breakdown and the story of what changed across the build.",
    },
  ]

  return (
    <Section clean>
      <SectionHeader
        title="Built like a"
        highlight="documentary."
        description="The goal is for people to follow the journey of the team, not just see the end result. Each athlete becomes part of the wider Hybrid365 story."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stages.map((stage, i) => (
          <Card key={i} num={stage.num} title={stage.title} description={stage.description} />
        ))}
      </div>
    </Section>
  )
}

function BuiltFromExperienceSection() {
  return (
    <Section clean>
      <SectionHeader
        title="Built from"
        highlight="experience."
        description="This team is built from the same obsession that has driven my own progression: learning, testing, applying and refining what actually works for Hybrid and Hyrox performance."
      />
      <div className="grid grid-cols-1 lg:grid-cols-[0.75fr_1.25fr] gap-3.5">
        <div className="relative min-h-[320px] sm:min-h-[420px] rounded-[20px] sm:rounded-[28px] border border-white/[0.12] overflow-hidden">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hyrox-Result-R5XsPC5ykZ8N8EakOwwdA56ysU9qyD.jpg"
            alt="Kieran Higgs celebrating sub-60 Hyrox finish"
            fill
            className="object-cover object-top grayscale-[20%] contrast-[1.1] brightness-[0.8]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />
          <div className="absolute left-[22px] right-[22px] bottom-[22px] z-10">
            <strong className="block text-white text-xl sm:text-2xl leading-none tracking-[-0.05em] uppercase">
              Kieran Higgs
            </strong>
            <small className="block mt-2 text-[#f4d23c] text-[11px] uppercase font-black tracking-[0.1em]">
              59:14 / Hyrox Cardiff
            </small>
          </div>
        </div>
        <div className="border border-white/[0.11] rounded-[20px] sm:rounded-[28px] p-6 sm:p-8 bg-gradient-to-br from-white/[0.075] to-white/[0.025]">
          <Eyebrow>Kieran Higgs / Hybrid365 Founder</Eyebrow>
          <h3 className="mt-5 mb-3.5 text-[clamp(28px,4vw,52px)] leading-[0.95] tracking-[-0.06em] uppercase">
            1:08 → 59:14
          </h3>
          <p className="m-0 text-[#d9d9d9] text-[17px] leading-[1.5]">
            In my first Hyrox season, I went from 1:08 to 59:14, running sub-60 in my 6th race. But
            the bigger point is not just the result — it is the process behind it.
          </p>
          <p className="mt-4 text-[#d9d9d9] text-[17px] leading-[1.5]">
            I have dedicated my life to understanding endurance, hybrid training and Hyrox
            performance. On my own journey towards becoming an Elite 15 athlete, I am constantly
            learning, testing and refining the best ways to become the highest-performing athlete
            possible.
          </p>
          <p className="mt-4 text-[#d9d9d9] text-[17px] leading-[1.5]">
            That education does not stay with me. It gets passed directly into the programming,
            coaching decisions, race strategy and standards behind every athlete in this team.
          </p>
        </div>
      </div>
    </Section>
  )
}

function FlowOfJoiningSection() {
  const steps = [
    {
      num: "01",
      title: "Apply / register interest",
      description:
        "Tell us about your current level, Hyrox goals, race plans and why you want to be part of the team.",
    },
    {
      num: "02",
      title: "Selection",
      description:
        "We review applications and select the athletes who fit the standards, vision and team environment.",
    },
    {
      num: "03",
      title: "Athlete screening",
      description:
        "We assess current performance, training history, weaknesses, targets and key metrics to build the plan.",
    },
    {
      num: "04",
      title: "Personalised build",
      description:
        "You receive 1-1 programming, weekly check-ins, coaching feedback and progression specific to your race goal.",
    },
    {
      num: "05",
      title: "Team training + documentation",
      description:
        "Regular team content, benchmark updates, progress tracking and in-person training meet-ups where possible.",
    },
    {
      num: "06",
      title: "Race day",
      description: "You arrive with structure, strategy, accountability and a documented build behind you.",
    },
  ]

  return (
    <Section clean>
      <SectionHeader
        title="The flow of"
        highlight="joining."
        description="This should feel like joining a team, not buying a PDF. The process is designed to protect the standard of the group and make sure each athlete is the right fit."
      />
      <div className="grid gap-3">
        {steps.map((step, i) => (
          <TimelineStep key={i} num={step.num} title={step.title} description={step.description} />
        ))}
      </div>
    </Section>
  )
}

function WhySelectiveSection() {
  const forYou = [
    "You are serious about improving at Hyrox",
    "You want proper structure and coaching",
    "You are coachable and communicate well",
    "You want to be part of a team environment",
    "You are open to being part of the public team journey",
    "You want to represent Hybrid365 with high standards",
  ]

  const notForYou = [
    "You just want a cheap generic plan",
    "You do not want accountability",
    "You will not complete check-ins",
    "You are not willing to train with intent",
    "You do not want to be part of the content side",
    "You are not interested in representing the brand properly",
  ]

  return (
    <Section>
      <SectionHeader
        title="Why it's"
        highlight="selective."
        description="Because this is not just coaching. The team will represent Hybrid365 publicly, so the right people matter."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="rounded-[20px] sm:rounded-[26px] p-5 sm:p-[26px] border border-[#f4d23c]/25 bg-[#f4d23c]/[0.095]">
          <h3 className="m-0 mb-[18px] text-[26px] tracking-[-0.055em] uppercase">
            This is for you if...
          </h3>
          <ul className="list-none p-0 m-0 grid gap-3">
            {forYou.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-[#e9e9e9] leading-[1.42] text-sm">
                <span className="text-[#f4d23c] font-black flex-shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[20px] sm:rounded-[26px] p-5 sm:p-[26px] border border-white/[0.11] bg-white/[0.035]">
          <h3 className="m-0 mb-[18px] text-[26px] tracking-[-0.055em] uppercase">
            This is not for you if...
          </h3>
          <ul className="list-none p-0 m-0 grid gap-3">
            {notForYou.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-[#e9e9e9] leading-[1.42] text-sm">
                <span className="text-[#f4d23c] font-black flex-shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}

function FaqSection() {
  const faqs = [
    {
      question: "How many athletes will be accepted?",
      answer: "Only 5-6 athletes will be selected for the first Hybrid365 Hyrox Team.",
    },
    {
      question: "Is the programming fully personalised?",
      answer:
        "Yes. Every athlete receives individual programming based on their current level, race date, goals, schedule, equipment, weaknesses and training response.",
    },
    {
      question: "Do I need previous Hyrox experience?",
      answer:
        "No, not necessarily. The bigger requirement is that you are serious, coachable, consistent and willing to train properly.",
    },
    {
      question: "Do I need to be local?",
      answer:
        "No, but being able to attend some team training sessions is a bonus. The core coaching can still be delivered remotely.",
    },
    {
      question: "Will I be filmed?",
      answer:
        "The team is built around documented progress, so applicants should be comfortable being featured in training clips, progress updates, team content and race-day documentation. Exact details can be discussed during selection.",
    },
    {
      question: "Is this group coaching or 1-1 coaching?",
      answer:
        "It is 1-1 coaching inside a small team environment. You get your own individual plan, but with the added accountability and energy of the team.",
    },
    {
      question: "What race will the team build towards?",
      answer:
        "The first team will be built around an agreed race window or target event depending on the athletes selected.",
    },
    {
      question: "How much does it cost?",
      answer:
        "Investment details will be shared with suitable applicants after the initial application. This keeps the first stage focused on fit, standards and goals.",
    },
  ]

  return (
    <Section clean>
      <SectionHeader
        title="Questions"
        highlight="answered."
        description="The first team will be deliberately small, so the application process helps make sure it is the right fit for both sides."
      />
      <div className="grid gap-3">
        {faqs.map((faq, i) => (
          <FaqItem key={i} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </Section>
  )
}

function FinalCtaSection() {
  return (
    <section className="relative text-center px-6 py-12 sm:px-10 sm:py-16 lg:px-[86px] lg:py-[86px] border border-[#f4d23c]/[0.35] bg-[radial-gradient(circle_at_center,rgba(244,210,60,0.16),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] rounded-[24px] sm:rounded-[34px] my-[18px] overflow-hidden">
      {/* Subtle background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sequence%2001.00_45_14_14.Still017-FniXGiRevy5ReZYe97cymfrrpYnMyf.jpg"
          alt=""
          fill
          className="object-cover opacity-[0.08] grayscale"
        />
      </div>
      <div className="relative z-10">
        <Eyebrow>Team 001 / Limited spaces</Eyebrow>
        <h2 className="mt-6 text-[clamp(40px,6.5vw,92px)] leading-[0.9] tracking-[-0.065em] uppercase font-black">
          Apply for the first
          <br />
          <span className="text-[#f4d23c]">Hybrid365 Hyrox Team.</span>
        </h2>
        <p className="max-w-[760px] mx-auto mt-[18px] mb-[30px] text-[#dedede] text-lg leading-[1.5]">
          Only 5-6 athletes will be accepted. If you want first-class coaching, a serious team
          environment, and the chance to be part of a documented Hybrid365 race build, register your
          interest below.
        </p>
        <div className="flex flex-wrap justify-center gap-3.5">
          <PrimaryButton href="/hyrox-team/apply" className="w-full sm:w-auto">
            Apply / Register Interest
          </PrimaryButton>
          <SecondaryButton
            href="mailto:contact@hybrid365.com?subject=Hybrid365 Hyrox Team"
            className="w-full sm:w-auto"
          >
            Ask a question
          </SecondaryButton>
        </div>
      </div>
    </section>
  )
}

// Main Page
export default function HyroxTeamPage() {
  return (
    <div className="font-sans bg-[#050505] text-[#f6f6f6] min-h-screen">
      <main className="max-w-[1220px] mx-auto px-2.5 sm:px-[18px] pb-12 sm:pb-20">
        <HeroSection />
        <NotJustCoachingSection />
        <TeamWillBeSeenSection />
        <WhatsIncludedSection />
        <AthleteStandardSection />
        <AthleteScreeningSection />
        <AthleteStorylinesSection />
        <BuiltLikeDocumentarySection />
        <BuiltFromExperienceSection />
        <FlowOfJoiningSection />
        <WhySelectiveSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
    </div>
  )
}