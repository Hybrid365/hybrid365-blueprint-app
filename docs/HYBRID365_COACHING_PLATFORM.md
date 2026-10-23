# Hybrid365 coaching platform

Product constitution. This does not authorise a live Home change, a production deploy, a merge, or applying a migration.

Related: `docs/HYBRID365_PLATFORM_BLUEPRINT.md` (architecture map), `docs/HYBRID365_AGENT_GUIDE.md` (engineering invariants), `docs/HYBRID365_VISUAL_SYSTEM.md` (presentation), `docs/HYBRID365_INTERACTION_SYSTEM.md` (motion).

---

## Product purpose

Hybrid365 is a high-performance coaching platform for hybrid athletes.

Its job is not merely to deliver workouts.

Its job is to create a continuous coaching loop:

**Athlete profile → Prescription → Training → Execution → Feedback → Interpretation → Adaptation → Progress**

The platform must initially make Kieran significantly better and faster at coaching 1-1 athletes.

The same underlying data, prescription and adaptation architecture must later support lower-cost Hybrid365 Track athletes with a greater level of automated decision-making.

Do not create separate underlying performance systems for 1-1 and Track.

---

## Product modes

### 1-1 / HYROX Team

Coach authority is final.

Hybrid365 may:

- calculate
- identify
- compare
- flag
- recommend
- preview adaptations

Hybrid365 must not silently make important programme changes on behalf of the coach.

The coach approves meaningful programme decisions.

### Hybrid365 Track

Uses the same:

- athlete profile
- session model
- Performance Profile
- prescription engine
- execution data
- feedback model
- analytics
- adaptation logic

Safe, repeatable coaching decisions may be automated.

Escalation or conservative behaviour should occur when confidence is insufficient.

---

## Athlete experience

### Home

Home is the athlete's weekly training command centre.

Primary hierarchy:

**Week → Selected day → Planned training → Coach context → My insights**

The athlete immediately sees Monday–Sunday.

Selecting a date swaps that day's planned sessions without navigating away.

Session previews show only the information necessary to understand the work quickly.

Home is training-first, not analytics-first.

A persistent bottom navigation provides access to the main product areas.

Visual-lab direction: Home D (`components/athlete-command-centre/visual/concepts/HomeConceptD.tsx`). Do not treat that prototype as live Home until a human rollout task says so.

### Session

The session page should answer:

- Why am I doing this?
- What do I need to do?
- What is my personal target?
- How should it feel?
- What should I report afterwards?

Preferred hierarchy:

**Session purpose → Primary prescription → Workout structure → Detailed targets → Coach guidance → Complete session**

Complex HYROX workouts must remain easy to understand under fatigue.

### Session execution

Every programmed session can transition through:

**Planned → Started / in progress where relevant → Completed → Partially completed → Missed**

Completion should collect the minimum information required to understand training response.

Universal candidate fields:

- completion state
- session RPE
- execution quality
- energy
- legs / muscular state
- pain or niggle flag
- optional athlete note

Objective performance data should be imported automatically where possible in the future.

Do not ask athletes to manually enter information that connected devices can reliably provide.

### Modality-specific execution

Different sessions require different performance information.

| Modality | Examples |
| --- | --- |
| Running | duration, distance, actual pace, interval execution, heart rate where available |
| Erg | time, distance, average split, watts where relevant |
| Bike | duration, power, HR, distance where useful |
| Strength | exercise, load, reps, sets, RPE / RIR where prescribed |
| HYROX / mixed | run execution, station execution, workout duration, key station times where useful |

The completion UI should dynamically ask only relevant questions.

---

## Interpretation

Hybrid365 should convert raw completion data into useful coaching signals.

Examples:

- target achieved at expected effort
- target exceeded at lower-than-expected effort
- session completed but significantly harder than expected
- target missed
- partial completion
- repeated heavy legs
- repeated low energy
- increasing RPE at similar performance
- declining execution across similar sessions
- positive benchmark progression
- emerging adherence issue
- pain/niggle reported
- upcoming schedule conflict with athlete response

Do not create opaque composite scores where transparent observations are sufficient.

---

## Coach Command Centre

The admin athlete page is the coach's operating system.

The coach should understand an athlete's current situation within seconds.

Primary sections:

- This week
- Needs attention
- Performance Profile
- Recent progress
- Upcoming programme
- Race context
- Quick actions

The Command Centre should prioritise exceptions and decisions rather than forcing the coach to inspect every session manually.

---

## Programme planner

The planner should evolve from a calendar editor into a coaching workspace.

The coach must retain:

- drag/drop programming
- session library
- custom sessions
- editing
- draft/publish workflow
- Copy Week
- Auto-Carry

Add progressively:

- dynamic athlete prescriptions
- previous comparable performance
- recent athlete response
- adaptation signals
- coach-facing recommendations
- athlete-facing adjustment reason

Programming should remain fast.

Do not make the coach complete excessive forms to create a session.

---

## Programme adaptation

The system should reason about the remaining training week, not only the next workout.

Example: Tuesday hard run — target missed, RPE 10, heavy legs, low energy. Upcoming: Wednesday high impact, Friday threshold, Sunday long run.

The system should consider the weekly intent before recommending change.

Possible actions: **Keep · Reduce · Replace · Move · Remove · Change target**

| Mode | Rule |
| --- | --- |
| 1-1 | Hybrid365 recommends. Coach decides. |
| Track | Hybrid365 may apply changes automatically when rules and confidence allow. |

### Adaptation safety

- Completed training history must never be rewritten.
- Published prescription history must remain traceable.
- Every adaptation must record: what changed, previous value/session, new value/session, reason, decision source, timestamp.
- Athletes should see relevant athlete-facing reasoning.
- Internal coaching logic/notes must never leak.
- Pain/niggle feedback must not generate a medical diagnosis.
- Uncertain situations should produce conservative behaviour or coach escalation.

---

## Progress

Progress exists to answer: **am I actually getting better?**

Use real athlete data.

Potential areas: running volume, training time, adherence, completion, session RPE load, modality distribution, comparable session performance, benchmark progression, strength progression, HYROX race progression, race station/run changes, long-term performance trends.

Hierarchy: **Now → Recent trend → Longer-term change**

Avoid generic dashboards full of equal-weight metrics.

---

## Weekly review

The weekly loop should summarise:

- what was planned
- what actually happened
- how the athlete responded
- what improved
- what needs attention
- what changes next

For 1-1, this should significantly reduce the time required to review each athlete.

For Track, this becomes part of the automated adaptation cycle.

---

## Coach presence

Hybrid365 should always feel coached.

Athlete-facing coach actions may include: coach note, coach adjustment, weekly focus, testing request, benchmark approval, race guidance.

Clearly distinguish **coach decision** from **system-generated information**.

Do not pretend automation is personally written by the coach.

---

## Data principle

Do not collect data because it is interesting.

Collect data because it supports:

1. a coaching decision
2. athlete understanding
3. performance tracking
4. future adaptation

Every new athlete input should justify the friction it creates.

---

## Long-term product principle

The best future Hybrid365 experience should feel like:

A real coach has designed the programme.

The athlete understands exactly what to do.

Execution is captured with minimal friction.

Important changes are recognised quickly.

Training adapts intelligently.

Progress is visible.

The system gets more useful as athlete history accumulates.

That principle should guide every database field, admin workflow, athlete interaction and automation feature.
