import {
  FieldGrid,
  HyroxCheckboxGroup,
  HyroxField,
  HyroxInput,
  HyroxRadioGroup,
  HyroxScaleRow,
  HyroxSelect,
  HyroxTextarea,
} from "@/components/hyrox-team/HyroxFormFields";
import { HyroxCard } from "@/components/hyrox-team/HyroxTeamUi";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EQUIPMENT = [
  "Treadmill",
  "Track / measured route",
  "SkiErg",
  "RowErg",
  "Bike / Assault bike",
  "Sled push",
  "Sled pull",
  "Wall balls",
  "Sandbag",
  "Farmers handles / kettlebells",
  "Dumbbells",
  "Barbells",
  "Squat rack",
  "Pull-up bar",
];

const STATIONS = [
  "SkiErg",
  "Sled push",
  "Sled pull",
  "Burpee broad jumps",
  "Row",
  "Farmer's carry",
  "Sandbag lunges",
  "Wall balls",
];

export function AssessmentStepContent({ stepId }: { stepId: string }) {
  switch (stepId) {
    case "details":
      return (
        <FieldGrid>
          <HyroxField label="Full name">
            <HyroxInput placeholder="e.g. Alex Morgan" defaultValue="" />
          </HyroxField>
          <HyroxField label="Email">
            <HyroxInput type="email" placeholder="you@email.com" />
          </HyroxField>
          <HyroxField label="Phone number">
            <HyroxInput type="tel" placeholder="+44 …" />
          </HyroxField>
          <HyroxField label="Age">
            <HyroxInput type="number" placeholder="32" />
          </HyroxField>
          <HyroxField label="Location">
            <HyroxInput placeholder="City, country" />
          </HyroxField>
          <HyroxField label="Instagram handle">
            <HyroxInput placeholder="@handle" />
          </HyroxField>
          <HyroxField label="Occupation">
            <HyroxInput placeholder="Role / industry" />
          </HyroxField>
          <HyroxField label="Typical work schedule">
            <HyroxInput placeholder="e.g. 9–5, shift work" />
          </HyroxField>
          <HyroxField label="Any fixed weekly commitments?" fullWidth>
            <HyroxTextarea placeholder="Family, sport, travel, etc." />
          </HyroxField>
        </FieldGrid>
      );

    case "race":
      return (
        <FieldGrid>
          <HyroxRadioGroup
            label="Do you have a Hyrox race booked?"
            name="race-booked"
            options={["Yes", "No — targeting a window"]}
          />
          <HyroxField label="Race location">
            <HyroxInput placeholder="e.g. London ExCeL" />
          </HyroxField>
          <HyroxField label="Race date">
            <HyroxInput type="date" />
          </HyroxField>
          <HyroxField label="Category">
            <HyroxSelect defaultValue="">
              <option value="">Select…</option>
              <option>Open</option>
              <option>Pro</option>
              <option>Doubles</option>
              <option>Relay</option>
              <option>Not sure yet</option>
            </HyroxSelect>
          </HyroxField>
          <HyroxField label="Target time">
            <HyroxInput placeholder="e.g. 1:05:00" />
          </HyroxField>
          <HyroxField label="Previous Hyrox PB">
            <HyroxInput placeholder="e.g. 1:12:30 or N/A" />
          </HyroxField>
          <HyroxField label="What would make this block a success?" fullWidth>
            <HyroxTextarea placeholder="Be specific — time, station, confidence, body comp…" />
          </HyroxField>
        </FieldGrid>
      );

    case "experience":
      return (
        <FieldGrid>
          <HyroxField label="Number of Hyrox races completed">
            <HyroxInput type="number" placeholder="0" />
          </HyroxField>
          <HyroxField label="Best overall time">
            <HyroxInput placeholder="mm:ss or N/A" />
          </HyroxField>
          <HyroxField label="Strongest station">
            <HyroxInput placeholder="e.g. Row, Ski" />
          </HyroxField>
          <HyroxField label="Weakest station">
            <HyroxInput placeholder="e.g. Wall balls, lunges" />
          </HyroxField>
          <HyroxField label="Did you fade late in the race?" fullWidth>
            <HyroxTextarea placeholder="Where did the race break down?" />
          </HyroxField>
          <HyroxField label="What did you learn from your last race?" fullWidth>
            <HyroxTextarea placeholder="Pacing, fuelling, mental game…" />
          </HyroxField>
        </FieldGrid>
      );

    case "training":
      return (
        <FieldGrid>
          <HyroxField label="Current weekly training structure" fullWidth>
            <HyroxTextarea placeholder="Mon: … Tue: …" />
          </HyroxField>
          <HyroxField label="Training days per week">
            <HyroxInput type="number" placeholder="4" />
          </HyroxField>
          <HyroxField label="Total weekly training hours">
            <HyroxInput placeholder="e.g. 8–10" />
          </HyroxField>
          <HyroxField label="Current weekly running volume (km)">
            <HyroxInput placeholder="e.g. 25–35" />
          </HyroxField>
          <HyroxField label="Strength sessions per week">
            <HyroxInput type="number" placeholder="2" />
          </HyroxField>
          <HyroxField label="Hyrox-specific sessions per week">
            <HyroxInput type="number" placeholder="1–2" />
          </HyroxField>
          <HyroxField label="What are you currently struggling with?" fullWidth>
            <HyroxTextarea />
          </HyroxField>
        </FieldGrid>
      );

    case "availability":
      return (
        <FieldGrid>
          <HyroxCheckboxGroup label="Which days can you train?" options={DAYS} columns={4} />
          <HyroxCheckboxGroup label="Which days can you double session?" options={DAYS} columns={4} />
          <HyroxField label="Preferred rest day">
            <HyroxSelect defaultValue="">
              <option value="">Select…</option>
              {DAYS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </HyroxSelect>
          </HyroxField>
          <HyroxField label="Best day for long / hard session">
            <HyroxSelect defaultValue="">
              <option value="">Select…</option>
              {DAYS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </HyroxSelect>
          </HyroxField>
          <HyroxField label="Time available per weekday session">
            <HyroxInput placeholder="e.g. 60–75 min" />
          </HyroxField>
          <HyroxField label="Time available on weekends">
            <HyroxInput placeholder="e.g. 90 min" />
          </HyroxField>
          <HyroxField label="Any upcoming travel / events?" fullWidth>
            <HyroxTextarea placeholder="Dates and impact on training" />
          </HyroxField>
        </FieldGrid>
      );

    case "equipment":
      return (
        <FieldGrid>
          <HyroxCheckboxGroup label="Equipment access" options={EQUIPMENT} columns={3} />
          <HyroxField label="Other equipment notes" fullWidth>
            <HyroxTextarea placeholder="Home gym, commercial gym chain, limitations…" />
          </HyroxField>
        </FieldGrid>
      );

    case "running":
      return (
        <FieldGrid>
          <HyroxField label="Current 5km time">
            <HyroxInput placeholder="mm:ss" />
          </HyroxField>
          <HyroxField label="Current 10km time (if known)">
            <HyroxInput placeholder="mm:ss or N/A" />
          </HyroxField>
          <HyroxField label="Easy run pace">
            <HyroxInput placeholder="min/km" />
          </HyroxField>
          <HyroxField label="Max HR (if known)">
            <HyroxInput placeholder="bpm" />
          </HyroxField>
          <HyroxField label="Average weekly run volume (km)">
            <HyroxInput placeholder="km" />
          </HyroxField>
          <HyroxField label="Highest weekly run volume (last 12 months)">
            <HyroxInput placeholder="km" />
          </HyroxField>
          <HyroxField label="Struggle more with speed or endurance?">
            <HyroxSelect defaultValue="">
              <option value="">Select…</option>
              <option>Speed</option>
              <option>Endurance</option>
              <option>Both equally</option>
            </HyroxSelect>
          </HyroxField>
          <HyroxField label="Any running injury history?" fullWidth>
            <HyroxTextarea />
          </HyroxField>
        </FieldGrid>
      );

    case "strength":
      return (
        <FieldGrid>
          <HyroxField label="Strength training experience">
            <HyroxSelect defaultValue="">
              <option value="">Select…</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </HyroxSelect>
          </HyroxField>
          <HyroxField label="Current squat / leg press estimate">
            <HyroxInput placeholder="kg × reps or 1RM est." />
          </HyroxField>
          <HyroxField label="Current deadlift / RDL estimate">
            <HyroxInput placeholder="kg × reps or 1RM est." />
          </HyroxField>
          <HyroxField label="Walking lunge load">
            <HyroxInput placeholder="kg per side" />
          </HyroxField>
          <HyroxField label="Pull-ups or lat pulldown ability">
            <HyroxInput placeholder="reps or load" />
          </HyroxField>
          <HyroxField label="Do leg sessions impact your running?" fullWidth>
            <HyroxTextarea placeholder="Soreness, next-day runs, etc." />
          </HyroxField>
          <HyroxField label="Any movements you cannot do?" fullWidth>
            <HyroxTextarea />
          </HyroxField>
        </FieldGrid>
      );

    case "stations":
      return (
        <div className="space-y-6 sm:col-span-2">
          <HyroxCard className="p-4 sm:p-5">
            <p className="m-0 text-xs font-black uppercase tracking-wide text-[#f4d23c]">Hyrox station profile</p>
            <p className="m-0 mt-3 text-sm leading-relaxed text-zinc-300">
              Rate your confidence/current ability for each station:{" "}
              <span className="font-semibold text-white">1 = major weakness / low confidence</span>
              {" · "}
              <span className="font-semibold text-white">10 = major strength / high confidence</span>
            </p>
            <p className="m-0 mt-3 text-sm text-zinc-500">
              Be honest — this helps us decide which stations need extra work in your programme.
            </p>
          </HyroxCard>
          <FieldGrid>
            {STATIONS.map((station) => (
              <HyroxScaleRow
                key={station}
                label={station}
                name={`station-${station}`}
                scaleEnds={{
                  low: "1 · Weak / low confidence",
                  high: "10 · Strong / high confidence",
                }}
              />
            ))}
          </FieldGrid>
        </div>
      );

    case "injury":
      return (
        <FieldGrid>
          <HyroxField label="Current injuries / niggles" fullWidth>
            <HyroxTextarea />
          </HyroxField>
          <HyroxField label="Previous major injuries / surgeries" fullWidth>
            <HyroxTextarea />
          </HyroxField>
          <HyroxField label="Average sleep per night">
            <HyroxInput placeholder="hours" />
          </HyroxField>
          <HyroxField label="Sleep quality (1–10)">
            <HyroxInput type="number" min={1} max={10} placeholder="7" />
          </HyroxField>
          <HyroxField label="Stress level (1–10)">
            <HyroxInput type="number" min={1} max={10} placeholder="5" />
          </HyroxField>
          <HyroxField label="Recovery tools used" fullWidth>
            <HyroxTextarea placeholder="Sauna, physio, massage, etc." />
          </HyroxField>
          <HyroxField label="Any movements to avoid?" fullWidth>
            <HyroxTextarea />
          </HyroxField>
        </FieldGrid>
      );

    case "nutrition":
      return (
        <FieldGrid>
          <HyroxField label="Current bodyweight (kg)">
            <HyroxInput placeholder="kg" />
          </HyroxField>
          <HyroxField label="Height (cm)">
            <HyroxInput placeholder="cm" />
          </HyroxField>
          <HyroxField label="Goal bodyweight / composition">
            <HyroxInput placeholder="e.g. maintain / -2kg" />
          </HyroxField>
          <HyroxField label="Main nutrition goal">
            <HyroxSelect defaultValue="">
              <option value="">Select…</option>
              <option>Performance</option>
              <option>Fat loss</option>
              <option>Muscle gain</option>
              <option>Recomposition</option>
              <option>Maintain</option>
            </HyroxSelect>
          </HyroxField>
          <HyroxField label="Tracking calories / macros?">
            <HyroxSelect defaultValue="">
              <option value="">Select…</option>
              <option>Yes — consistently</option>
              <option>Sometimes</option>
              <option>No</option>
            </HyroxSelect>
          </HyroxField>
          <HyroxField label="Typical pre-training fuelling" fullWidth>
            <HyroxTextarea />
          </HyroxField>
          <HyroxField label="Any digestive issues?" fullWidth>
            <HyroxTextarea />
          </HyroxField>
          <HyroxField label="Current supplements" fullWidth>
            <HyroxTextarea />
          </HyroxField>
        </FieldGrid>
      );

    case "coaching":
      return (
        <FieldGrid>
          <HyroxField label="What do you need most from coaching?" fullWidth>
            <HyroxTextarea placeholder="Accountability, structure, race strategy…" />
          </HyroxField>
          <HyroxField label="Prefer direct feedback or detailed explanations?">
            <HyroxSelect defaultValue="">
              <option value="">Select…</option>
              <option>Direct and concise</option>
              <option>Detailed explanations</option>
              <option>Mix of both</option>
            </HyroxSelect>
          </HyroxField>
          <HyroxField label="Tend to do too much or too little?">
            <HyroxSelect defaultValue="">
              <option value="">Select…</option>
              <option>Too much</option>
              <option>Too little</option>
              <option>Depends on the week</option>
            </HyroxSelect>
          </HyroxField>
          <HyroxField label="How consistent are you currently? (1–10)">
            <HyroxInput type="number" min={1} max={10} />
          </HyroxField>
          <HyroxField label="What usually causes you to fall off?" fullWidth>
            <HyroxTextarea />
          </HyroxField>
        </FieldGrid>
      );

    case "consent":
      return (
        <FieldGrid>
          <HyroxRadioGroup
            label="Are you happy for your journey to be documented?"
            name="doc-consent"
            options={[
              "Full documentation consent",
              "Training and race content only",
              "Anonymous case study only",
              "No public documentation",
            ]}
          />
          <HyroxCheckboxGroup
            label="Additional consent"
            options={[
              "Happy for training clips to be used",
              "Happy for benchmark / race results to be shared",
              "Happy to provide occasional weekly clips",
            ]}
            columns={1}
          />
          <HyroxField label="Any topics / info to keep private?" fullWidth>
            <HyroxTextarea />
          </HyroxField>
        </FieldGrid>
      );

    case "submit":
      return (
        <div className="space-y-4">
          <HyroxCard>
            <p className="m-0 text-xs font-black uppercase tracking-wide text-[#f4d23c]">Review</p>
            <h3 className="m-0 mt-2 text-lg font-bold text-white">Ready to submit</h3>
            <p className="m-0 mt-2 text-sm leading-relaxed text-zinc-400">
              Your answers will be reviewed before your programme is built. You can still edit sections using the step
              navigation above until you submit.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-500">
              <li>· Athlete details & race goal</li>
              <li>· Training history & availability</li>
              <li>· Equipment, run, strength & station profiles</li>
              <li>· Injury, nutrition & coaching preferences</li>
              <li>· Documentation consent</li>
            </ul>
          </HyroxCard>
          <p className="text-xs text-zinc-600">
            Mock preview — submit will connect to backend in a later pass.
          </p>
        </div>
      );

    default:
      return null;
  }
}
