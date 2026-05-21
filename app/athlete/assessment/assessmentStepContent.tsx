import { HyroxCard } from "@/components/hyrox-team/HyroxTeamUi";
import {
  AssessCheckboxGroup,
  AssessInput,
  AssessRadioGroup,
  AssessScaleRow,
  AssessSelect,
  AssessTextarea,
  FieldGrid,
} from "./assessmentFormFields";

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
          <AssessInput field="fullName" label="Full name" placeholder="e.g. Alex Morgan" />
          <AssessInput field="email" label="Email" type="email" placeholder="you@email.com" />
          <AssessInput field="phone" label="Phone number" type="tel" placeholder="+44 …" />
          <AssessInput field="age" label="Age" type="number" placeholder="32" />
          <AssessInput field="location" label="Location" placeholder="City, country" />
          <AssessInput field="instagram" label="Instagram handle" placeholder="@handle" />
          <AssessInput field="occupation" label="Occupation" placeholder="Role / industry" />
          <AssessInput field="workSchedule" label="Typical work schedule" placeholder="e.g. 9–5, shift work" />
          <AssessTextarea field="weeklyCommitments" label="Any fixed weekly commitments?" fullWidth placeholder="Family, sport, travel, etc." />
        </FieldGrid>
      );

    case "race":
      return (
        <FieldGrid>
          <AssessRadioGroup
            field="raceBooked"
            label="Do you have a Hyrox race booked?"
            options={["Yes", "No — targeting a window"]}
          />
          <AssessInput field="raceLocation" label="Race location" placeholder="e.g. London ExCeL" />
          <AssessInput field="raceDate" label="Race date" type="date" />
          <AssessSelect field="raceCategory" label="Category">
            <option value="">Select…</option>
            <option>Open</option>
            <option>Pro</option>
            <option>Doubles</option>
            <option>Relay</option>
            <option>Not sure yet</option>
          </AssessSelect>
          <AssessInput field="targetTime" label="Target time" placeholder="e.g. 1:05:00" />
          <AssessInput field="previousHyroxPb" label="Previous Hyrox PB" placeholder="e.g. 1:12:30 or N/A" />
          <AssessTextarea field="blockSuccess" label="What would make this block a success?" fullWidth placeholder="Be specific — time, station, confidence, body comp…" />
        </FieldGrid>
      );

    case "experience":
      return (
        <FieldGrid>
          <AssessInput field="hyroxRacesCompleted" label="Number of Hyrox races completed" type="number" placeholder="0" />
          <AssessInput field="bestOverallTime" label="Best overall time" placeholder="mm:ss or N/A" />
          <AssessInput field="strongestStation" label="Strongest station" placeholder="e.g. Row, Ski" />
          <AssessInput field="weakestStationSelf" label="Weakest station" placeholder="e.g. Wall balls, lunges" />
          <AssessTextarea field="raceFade" label="Did you fade late in the race?" fullWidth placeholder="Where did the race break down?" />
          <AssessTextarea field="lastRaceLearnings" label="What did you learn from your last race?" fullWidth placeholder="Pacing, fuelling, mental game…" />
        </FieldGrid>
      );

    case "training":
      return (
        <FieldGrid>
          <AssessTextarea field="weeklyTrainingStructure" label="Current weekly training structure" fullWidth placeholder="Mon: … Tue: …" />
          <AssessInput field="trainingDaysPerWeek" label="Training days per week" type="number" placeholder="4" />
          <AssessInput field="weeklyTrainingHours" label="Total weekly training hours" placeholder="e.g. 8–10" />
          <AssessInput field="weeklyRunVolumeKm" label="Current weekly running volume (km)" placeholder="e.g. 25–35" />
          <AssessInput field="strengthSessionsPerWeek" label="Strength sessions per week" type="number" placeholder="2" />
          <AssessInput field="hyroxSessionsPerWeek" label="Hyrox-specific sessions per week" type="number" placeholder="1–2" />
          <AssessTextarea field="currentStruggles" label="What are you currently struggling with?" fullWidth />
        </FieldGrid>
      );

    case "availability":
      return (
        <FieldGrid>
          <AssessCheckboxGroup field="trainingDays" label="Which days can you train?" options={DAYS} columns={4} />
          <AssessCheckboxGroup field="doubleSessionDays" label="Which days can you double session?" options={DAYS} columns={4} />
          <AssessSelect field="preferredRestDay" label="Preferred rest day">
            <option value="">Select…</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </AssessSelect>
          <AssessSelect field="longSessionDay" label="Best day for long / hard session">
            <option value="">Select…</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </AssessSelect>
          <AssessInput field="weekdaySessionTime" label="Time available per weekday session" placeholder="e.g. 60–75 min" />
          <AssessInput field="weekendSessionTime" label="Time available on weekends" placeholder="e.g. 90 min" />
          <AssessTextarea field="upcomingTravel" label="Any upcoming travel / events?" fullWidth placeholder="Dates and impact on training" />
        </FieldGrid>
      );

    case "equipment":
      return (
        <FieldGrid>
          <AssessCheckboxGroup field="equipmentAccess" label="Equipment access" options={EQUIPMENT} columns={3} />
          <AssessTextarea field="equipmentNotes" label="Other equipment notes" fullWidth placeholder="Home gym, commercial gym chain, limitations…" />
        </FieldGrid>
      );

    case "running":
      return (
        <FieldGrid>
          <AssessInput field="fiveKmTime" label="Current 5km time" placeholder="mm:ss" />
          <AssessInput field="tenKmTime" label="Current 10km time (if known)" placeholder="mm:ss or N/A" />
          <AssessInput field="easyRunPace" label="Easy run pace" placeholder="min/km" />
          <AssessInput field="maxHeartRate" label="Max HR (if known)" placeholder="bpm" />
          <AssessInput field="runningWeeklyVolumeKm" label="Average weekly run volume (km)" placeholder="km" />
          <AssessInput field="peakWeeklyRunKm" label="Highest weekly run volume (last 12 months)" placeholder="km" />
          <AssessSelect field="speedVsEndurance" label="Struggle more with speed or endurance?">
            <option value="">Select…</option>
            <option>Speed</option>
            <option>Endurance</option>
            <option>Both equally</option>
          </AssessSelect>
          <AssessTextarea field="runningInjuryHistory" label="Any running injury history?" fullWidth />
        </FieldGrid>
      );

    case "strength":
      return (
        <FieldGrid>
          <AssessSelect field="strengthExperience" label="Strength training experience">
            <option value="">Select…</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </AssessSelect>
          <AssessInput field="squatEstimate" label="Current squat / leg press estimate" placeholder="kg × reps or 1RM est." />
          <AssessInput field="deadliftEstimate" label="Current deadlift / RDL estimate" placeholder="kg × reps or 1RM est." />
          <AssessInput field="lungeLoad" label="Walking lunge load" placeholder="kg per side" />
          <AssessInput field="pullupAbility" label="Pull-ups or lat pulldown ability" placeholder="reps or load" />
          <AssessTextarea field="legsImpactRunning" label="Do leg sessions impact your running?" fullWidth placeholder="Soreness, next-day runs, etc." />
          <AssessTextarea field="movementsCannotDo" label="Any movements you cannot do?" fullWidth />
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
              <AssessScaleRow
                key={station}
                station={station}
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
          <AssessTextarea field="currentInjuries" label="Current injuries / niggles" fullWidth />
          <AssessTextarea field="previousInjuries" label="Previous major injuries / surgeries" fullWidth />
          <AssessInput field="sleepHours" label="Average sleep per night" placeholder="hours" />
          <AssessInput field="sleepQualityScore" label="Sleep quality (1–10)" type="number" min={1} max={10} placeholder="7" />
          <AssessInput field="stressLevelScore" label="Stress level (1–10)" type="number" min={1} max={10} placeholder="5" />
          <AssessTextarea field="recoveryTools" label="Recovery tools used" fullWidth placeholder="Sauna, physio, massage, etc." />
          <AssessTextarea field="movementsToAvoid" label="Any movements to avoid?" fullWidth />
        </FieldGrid>
      );

    case "nutrition":
      return (
        <FieldGrid>
          <AssessInput field="bodyweightKg" label="Current bodyweight (kg)" placeholder="kg" />
          <AssessInput field="heightCm" label="Height (cm)" placeholder="cm" />
          <AssessInput field="bodyCompositionGoal" label="Goal bodyweight / composition" placeholder="e.g. maintain / -2kg" />
          <AssessSelect field="nutritionGoal" label="Main nutrition goal">
            <option value="">Select…</option>
            <option>Performance</option>
            <option>Fat loss</option>
            <option>Muscle gain</option>
            <option>Recomposition</option>
            <option>Maintain</option>
          </AssessSelect>
          <AssessSelect field="macroTracking" label="Tracking calories / macros?">
            <option value="">Select…</option>
            <option>Yes — consistently</option>
            <option>Sometimes</option>
            <option>No</option>
          </AssessSelect>
          <AssessTextarea field="preTrainingFuel" label="Typical pre-training fuelling" fullWidth />
          <AssessTextarea field="digestiveIssues" label="Any digestive issues?" fullWidth />
          <AssessTextarea field="supplements" label="Current supplements" fullWidth />
        </FieldGrid>
      );

    case "coaching":
      return (
        <FieldGrid>
          <AssessTextarea field="coachingNeeds" label="What do you need most from coaching?" fullWidth placeholder="Accountability, structure, race strategy…" />
          <AssessSelect field="feedbackStyle" label="Prefer direct feedback or detailed explanations?">
            <option value="">Select…</option>
            <option>Direct and concise</option>
            <option>Detailed explanations</option>
            <option>Mix of both</option>
          </AssessSelect>
          <AssessSelect field="trainingVolumeTendency" label="Tend to do too much or too little?">
            <option value="">Select…</option>
            <option>Too much</option>
            <option>Too little</option>
            <option>Depends on the week</option>
          </AssessSelect>
          <AssessInput field="consistencyScore" label="How consistent are you currently? (1–10)" type="number" min={1} max={10} />
          <AssessTextarea field="fallOffCauses" label="What usually causes you to fall off?" fullWidth />
        </FieldGrid>
      );

    case "consent":
      return (
        <FieldGrid>
          <AssessRadioGroup
            field="docConsent"
            label="Are you happy for your journey to be documented?"
            options={[
              "Full documentation consent",
              "Training and race content only",
              "Anonymous case study only",
              "No public documentation",
            ]}
          />
          <AssessCheckboxGroup
            field="additionalConsent"
            label="Additional consent"
            options={[
              "Happy for training clips to be used",
              "Happy for benchmark / race results to be shared",
              "Happy to provide occasional weekly clips",
            ]}
            columns={1}
          />
          <AssessTextarea field="privateTopics" label="Any topics / info to keep private?" fullWidth />
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
            Submissions are saved to your athlete record. You can resubmit later — we use your latest submission for
            coach review.
          </p>
        </div>
      );

    default:
      return null;
  }
}
