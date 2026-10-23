# Hybrid365 product design benchmark

Research and principles only. Do not treat this as a licence to copy another product’s UI, scores, or brand. Live athlete screens are not redesigned here. Concepts live in the staging visual lab.

Studied: WHOOP, Oura, Strava, Garmin Connect, TrainingPeaks, Intervals.icu, Eight Sleep, plus useful principles from F1 timing / race graphics, elite sports broadcast, Nike / adidas performance presentation, and high-end sports-science dashboards.

Hybrid365 should feel like a **high-performance athlete operating system**: training first, numbers with weight, coach present, self-comparison over arbitrary scores.

---

## Products studied

### WHOOP

**Information hierarchy.** Three scores (Sleep, Recovery, Strain) dominate the first screen. Everything else is a consequence of those scores. 2025 Home collapsed swipe-tabs into one scroll: dials, then My Day, My Plan, My Dashboard. Longer-term health moved to a Health tab so today stays today.

**Navigation.** Few primary destinations. The + action is now in the bottom bar. Deep dives live behind each dial.

**Metrics.** One colour-coded percentage (Recovery) plus a 0–21 strain scale. Colour carries too much of the meaning. Scores are proprietary composites.

**Charts.** Trend tiles after the daily scores. Weekly / monthly / six-month is more useful than one reading.

**Motion.** Dial fills and colour shifts. Satisfying, but the ring became the product.

**Training.** Weak as a coaching OS. “My Plan” is goal progress, not a prescribed session with targets.

**Progress.** Streaks and rolling scores. Easy to feel busy without knowing if training quality improved.

**Premium feel.** Dark, sparse, expensive hardware halo. Also the template every wellness app now copies.

**Poor patterns to avoid.** Concentric rings as brand. Composite scores with no inspectable recipe. Wellness occupying the place where today’s session should be. Streaks as the progress story.

### Oura

**Information hierarchy.** 2025 redesign: Today / Vitals / My Health. Today is meant to surface “one big thing” for this moment; Vitals is the library; My Health is long-term. Instrument’s work is explicit about progressive disclosure and a three-level viz framework (glance → short pattern → exploratory).

**Navigation.** Three tabs. Shortcuts at the top of Today. History is not on Home.

**Metrics.** Readiness / Sleep / Activity scores plus semantic colour. Dynamic Home changes by time of day.

**Charts.** Rings at glance, then focused cards, then deep trends. The layering is the lesson, not the ring.

**Motion.** Soft, health-companion. Wrong emotional register for race week.

**Training.** Activity goals, not prescribed HYROX work.

**Progress.** Baseline-against-self is the honest core. Population averages only until a personal baseline exists.

**Premium feel.** Warmth, restraint, refined type. Can drift into spa.

**Poor patterns to avoid.** A wellness companion tone on a coaching product. Hiding the day’s work behind a score. Semantic colour as the only status system.

### Strava

**Information hierarchy.** Feed first (social proof), activity detail second (map + three stats). Analysis is a third layer. Feed stats change by activity type: elevation replaces pace when the route is steep.

**Navigation.** Record / Feed / You / Maps. Today’s training is not the home metaphor unless the athlete records now.

**Metrics.** Distance, time, pace as a 3-up. Labels small, values larger. Achievement banners for PRs.

**Charts.** Split bars, pace curves, map-linked scrubbing. Readable because one channel is primary and scrubbing is linked to a position.

**Motion.** Kudos, PR banners. Social reward, not coaching confirmation.

**Training.** Structured-workout analysis exists, but Strava is a logbook and network, not a coach OS.

**Progress.** Best efforts and fitness estimates. Comparison to others is the default temptation.

**Premium feel.** Map as photography. Orange as a brand, not a data colour. Dark mode is charcoal, not neon.

**Poor patterns to avoid.** Social feed as Home. Segment leaderboards. Celebration chrome. Equal-weight 3-up when one number is the session’s point.

### Garmin Connect

**Information hierarchy.** Calendar of completed activities plus a stack of status cards (Training Status, load, recovery time, sleep). Often five “primary” signals at once.

**Navigation.** Home, Training, Challenges, Health. Workouts and calendar are where serious athletes live.

**Metrics.** Target versus actual after a structured workout. Garmin mobile often draws a target line rather than a range.

**Charts.** Sport-coloured calendars, training-load bars, pace/power overlays. Readable in isolation; exhausting as a home stack.

**Motion.** Little. Utilitarian.

**Training.** Strong: structured steps, device execution, post-file analysis. Weak: the coach relationship is a file sync.

**Progress.** Load and status over weeks. Easy to confuse “the watch is happy” with “the programme is working.”

**Premium feel.** Hardware-accurate, visually dated. Density without editorial hierarchy.

**Poor patterns to avoid.** A dashboard of equal status widgets. Invented readiness percentages. Calendar colour as the only explanation.

### TrainingPeaks

**Information hierarchy.** Calendar is the product. Compliance colour (planned vs completed) is the scan. Quick View is duration, TSS, IF. Analysis is a separate workstation.

**Navigation.** Calendar → workout → analyze. Deep. Athletes who just want “what do I do today?” pay a tax.

**Metrics.** Target versus actual overlay is the distinctive idea. Compliance colour is a blunt instrument (a long coffee ride can still go green).

**Charts.** Planned skyline under actual power/pace. When it works, one glance answers “did I do the work?”

**Motion.** None that matters.

**Training.** Best-in-class for prescribed endurance work, worst-in-class for athlete-facing clarity. Coaches love it; athletes tolerate it.

**Progress.** PMC / CTL / ATL. Powerful and opaque.

**Premium feel.** Spreadsheet energy. Not an OS an athlete is proud to open.

**Poor patterns to avoid.** Calendar-as-home for 1-1 HYROX. TSS as a personality. Green/red compliance as morality. Walls of zone charts before the session purpose.

### Intervals.icu

**Information hierarchy.** Power-user customisation. Planned and actual can sit on one tile. Charts are user-composed.

**Navigation.** Web-first, dense, keyboard. Mobile is secondary.

**Metrics.** Planned-versus-actual skyline. Ranges vs a single target line. Activity comparison as a current investment.

**Charts.** Extremely capable. Default density is laboratory software.

**Motion.** None.

**Training.** Excellent for self-coached file analysis. The coach is a spreadsheet collaborator.

**Progress.** Load, fitness, custom plots. Meaningful if you already know what to ask.

**Premium feel.** Utilitarian excellence. Zero brand warmth.

**Poor patterns to avoid.** Customisation as the design system. Showing every channel. Making Hybrid365 a poorer Intervals.

### Eight Sleep

**Information hierarchy.** 2025 cut primary nav from four pages to two: Home (control) and Report (insight). Temperature — the action — sits on Home. The report leads with Sleep Fitness, then the inputs that produced it.

**Navigation.** Action and insight are separate destinations. That split is useful.

**Metrics.** In-range / out-of-range dots against a personal or age band. Users complained when glanceability and real values were lost in the restyle.

**Charts.** Hypnogram, stages, consistency. Fine for sleep; wrong grammar for race splits.

**Motion.** Autopilot banners. Control first.

**Training.** None.

**Progress.** Daily / weekly / monthly / yearly on the same metric.

**Premium feel.** Hardware, black, sparse type, one control. Also a warning: “streamlined” can delete the number people actually needed.

**Poor patterns to avoid.** Collapsing nav until the report is the only place numbers live. Controls that are easy to trigger while scrolling. Scores that hide their inputs.

### Formula 1 timing / broadcast / Nike / adidas / sports science

**F1 / broadcast.** Legible in about a second. One story per overlay (gap, tyre, battle), not every telemetry channel. High-contrast condensed type. Motion is state: in, hold, update, out — interruptible. Failures: crowding, colour-only meaning, two numbers colliding so the scan path lies. Design for long names and empty fields.

**Nike / adidas.** One product story. Photography and type, not a widget grid. Performance is an attitude, not a dashboard. Hybrid365 cannot lean on campaign photography inside the athlete OS, but it can steal the courage to let one number be huge and the rest recede.

**Sports-science dashboards.** Complete, inspectable, hostile. Equal-weight metric tiles, rainbow series, no editorial voice. Hybrid365 should use their honesty (show the recipe) and refuse their layout.

---

## Strongest patterns (extracted)

1. **Today is a different job from history.** WHOOP Health tab, Oura Today vs My Health, Eight Sleep Home vs Report.
2. **One dominant signal per component.** Dials, 3-up stats, F1 overlays — whatever is first is the only thing that is first.
3. **Progressive disclosure beats a dense first screen.** Glance → pattern → explore.
4. **Target versus actual is the endurance-training sentence.** TrainingPeaks overlay, Garmin workout analysis, Intervals skyline.
5. **Self-baseline beats population score.** Oura’s mature insight; E race intelligence already forbids percentiles.
6. **Action sits next to the thing it changes.** Eight Sleep temperature on Home; WHOOP + in the tab bar; session CTA beside the session.
7. **Calendar colour is a scan, not an explanation.** Useful for coaches; insufficient for athletes.
8. **Charts need a primary channel and a unit.** Scrubbing should change one readout, not five.
9. **Useful motion is state change.** Completion, expand, tab, interruptible overlay. Decorative rings are not state.
10. **Restraint reads as expensive.** Hairline, type scale, empty space. Glow and gamification read as consumer fitness.

---

## Poor patterns Hybrid365 should avoid

- Recovery rings, strain globes, confetti, streaks, badges-as-progress
- Composite scores the athlete cannot inspect
- Population percentiles (already forbidden by race intelligence)
- Social feed as the athlete home
- Equal-weight 2×2 or 4-up tiles where one thing is today’s work
- Card-inside-card-inside-card
- Neon, glass, large gradients
- TrainingPeaks calendar as the athlete mental model
- Intervals-level chart customisation
- WHOOP / Oura wellness occupying the session’s seat
- Counting measured times up from zero
- Mock data presented as a result
- Internal coach notes leaking into athlete copy
- “Race readiness 72%” as if it were a measured test

---

## Principles

Each principle is an interpretation, not a feature request.

### 1. One dominant performance signal per component

1. **Observation.** WHOOP’s Recovery, Strava’s pace, F1’s gap, Eight Sleep’s temperature — each component has a king.
2. **Why it works.** The eye needs a place to land. Secondary facts become readable once the primary is known.
3. **Relevance.** HYROX sessions have a purpose (hold 3:55/km, move a sled, complete a simulation). Home currently offers four equal tiles plus Explore.
4. **How Hybrid365 should interpret it.** Session: purpose + primary target. Home: today’s session. Performance: the active mark (5K 17:55). Race: overall time. Progress: this week’s completion or run volume — pick one lead.
5. **What NOT to copy.** WHOOP’s ring. Strava’s orange. A single proprietary score.

### 2. Contextual secondary metrics, not equal-weight grids

1. **Observation.** Strava hides elevation unless the route earns it. Oura’s Today is not a metric dump. Garmin Home fails by showing every status card at once.
2. **Why it works.** Relevance is a form of respect. Showing everything is how dashboards become noise.
3. **Relevance.** A threshold run wants pace, RPE, duration. A strength session wants load. A race wants splits. The same 4-up on every screen is generic SaaS.
4. **How Hybrid365 should interpret it.** Bind supporting metrics to session type. On Home, weekly completion and current 5K support today; they do not sit in the same visual rank.
5. **What NOT to copy.** Customisable WHOOP Dashboard tiles as the product identity.

### 3. Comparison against self beats arbitrary scoring

1. **Observation.** Oura becomes useful when it uses *your* baseline. TrainingPeaks overlay is you vs the plan. Race intelligence V1 already compares this race to the previous stored race.
2. **Why it works.** Athletes already have a coach. They do not need a second oracle. They need: vs last time, vs the prescription, vs recent baseline.
3. **Relevance.** Performance Profile already has current / previous / pending. Analytics has current week, previous week, rolling 4, benchmark points. Race analysis has vsPrevious. Use them.
4. **How Hybrid365 should interpret it.** Always prefer `previous`, `target`, `rolling4`. Never invent a 0–100 readiness.
5. **What NOT to copy.** WHOOP Recovery %, Oura Readiness, Eight Sleep Fitness Score, TrainingPeaks CTL as a personality.

### 4. Action sits next to insight

1. **Observation.** Eight Sleep put temperature on Home because that is the verb. WHOOP moved + into the tab bar. TrainingPeaks buries Analyze.
2. **Why it works.** If the product notices something, the next tap should be obvious.
3. **Relevance.** Pending benchmark → coach review (coach) or “waiting” (athlete). Check-in due → complete it. Today’s session → open / log. Week changed → read the coach note, then train.
4. **How Hybrid365 should interpret it.** CTA in the same module as the sentence that caused it. Do not send people to Explore to find the thing the page already mentioned.
5. **What NOT to copy.** A floating AI coach button. A centre + that opens a junk drawer.

### 5. Coach intervention has a distinct visual language

1. **Observation.** Consumer fitness products either hide the coach (Garmin files) or fake one (WHOOP AI). Eight Sleep Autopilot banners at least *look* like a change landed.
2. **Why it works.** 1-1 Hybrid365 is not a downloaded PDF. If the week changed, the athlete should feel an author.
3. **Relevance.** Coach notes, week rationale, pending review, published snapshots. Internal notes never appear. Athlete-facing notes should be unmissable and unlike a metric tile.
4. **How Hybrid365 should interpret it.** A signed, left-ruled coach mark. Pending review uses the existing status word. Do not style coach copy as a yellow marketing card.
5. **What NOT to copy.** Chat bubbles, avatar-heavy “your AI coach”, or TrainingPeaks comment threads as the primary UI.

### 6. Progressive disclosure reduces cognitive load

1. **Observation.** Oura’s three viz levels. Strava feed → detail → analysis. F1 one overlay at a time.
2. **Why it works.** HYROX sessions are structurally complex (intervals, stations, ergs, strength). Showing the novel as a paragraph is how athletes skip.
3. **Relevance.** Session drawer currently stacks objective, targets, warm-up, main set, notes, full prescription, log form.
4. **How Hybrid365 should interpret it.** Purpose → primary target → structure picture → spec rows → coach → log. Full prescription is the last disclosure, not the first.
5. **What NOT to copy.** Accordion-everything. Hiding the primary target behind a tap.

### 7. Training targets need stronger hierarchy than metadata

1. **Observation.** TrainingPeaks Virtual had to add “Focussed Mode” because target and actual were scattered. Strava’s 3-up still makes the value larger than the label.
2. **Why it works.** The athlete is trying to hit a number under fatigue. Metadata (week role, block id, tags) cannot visually compete.
3. **Relevance.** `SessionTarget` already exists. It is often one of several equal chips, then duplicated as a paragraph.
4. **How Hybrid365 should interpret it.** Primary target at ~32–48px. Duration, RPE, tags recede. Structure is a picture of work/rest, not a bullet novel.
5. **What NOT to copy.** Zone rainbow bars as decoration. Giant start-workout gradients.

### 8. Progress should accumulate, not reset every Monday

1. **Observation.** Oura My Health, WHOOP six-month tiles, Eight Sleep year view, Strava best efforts. The feeling is a trajectory, not a weekly report card.
2. **Why it works.** Twelve-week blocks are the product. If the UI only ever shows this week, the block is invisible.
3. **Relevance.** Analytics already has current, previous, rolling 4, benchmark series. Live Progress currently presents them as sibling cards.
4. **How Hybrid365 should interpret it.** Narrative: Now → Recent trend → Longer-term. Benchmarks as a trajectory of named tests, not a table.
5. **What NOT to copy.** Streak flames. Gamified weekly badges. Charts of zeros.

### 9. Technical but human

1. **Observation.** Intervals and WKO are trusted and cold. Nike is human and vague. Broadcast graphics are technical and editorial.
2. **Why it works.** Hybrid365 athletes are serious. They will not trust a wellness tone. They also will not love a lab notebook.
3. **Relevance.** Show units, sources, dates, missing-as-missing. Write observations as sentences (“Wall Balls 18s faster than previous race”).
4. **How Hybrid365 should interpret it.** Telemetry grammar (tabular numbers, hairline, named splits) plus coach sentences. No mascots, no lab rainbow.
5. **What NOT to copy.** Sports-science dashboard grids. Nike campaign photography inside data screens.

### 10. Restraint is the premium signal

1. **Observation.** The products that feel expensive use space, type, and one accent. The products that feel cheap use glow, extra cards, and celebration.
2. **Why it works.** Attention is the scarce resource. Decoration spends it.
3. **Relevance.** Batch 1 D already banned neon, confetti, and counting up. Keep that. Push further: fewer nested cards, fewer equal tiles.
4. **How Hybrid365 should interpret it.** Hairline separators over extra boxes. Gold for eyebrows and the one target that matters. Motion under 200ms unless a later spec says otherwise, and always `prefers-reduced-motion`.
5. **What NOT to copy.** Glassmorphism, animated rings, stacked rounded containers.

---

## Current Batch 1 athlete UI audit

Qualitative scores: **strong / mixed / weak**. Verdicts are KEEP / REFINE / RETHINK. Live components were not rewritten for this research.

### Home

| Lens | Score | Note |
| --- | --- | --- |
| Hierarchy | weak | Four equal priority tiles, then next session, then Explore as a second nav |
| Clarity | mixed | Next session is clear once found; race-readiness % competes |
| Athlete usefulness | mixed | Today’s work is present; too much chrome around it |
| Visual quality | mixed | D primitives helped; still a card stack |
| Interaction quality | mixed | View session / log exist; sticky actions duplicate |
| Data density | mixed | Tiles of similar weight; mock charts only in mock preview |
| Coach presence | mixed | Coach note exists, visually just another card |
| Sense of progress | weak | Snapshot % and Explore meta |
| Mobile usability | mixed | Nav clearance nit fixed; still a long scroll of similar blocks |

- **KEEP** next-session module, honest “Awaiting data”, Performance label, live week tracking when present, D type/colour.
- **REFINE** coach note into a distinct mark; put the primary target on the session hero; kill duplicate Explore when the thing is already on the page.
- **RETHINK** the 4-up priority tiles and race-readiness percentage as a Home hero. They make Hybrid365 look like Garmin Connect, not a coached OS.

### Programme

| Lens | Score | Note |
| --- | --- | --- |
| Hierarchy | mixed | Week chips + session cards; purpose lives inside the card |
| Clarity | strong | Live / upcoming / past is honest |
| Athlete usefulness | strong | This is the working list |
| Visual quality | mixed | Cards are consistent, slightly template |
| Interaction quality | strong | Open / log / drawer |
| Data density | mixed | RPE/duration present; structure is text |
| Coach presence | mixed | Week rationale exists |
| Sense of progress | mixed | Completion bar |
| Mobile usability | mixed | Cards are tappable; density OK |

- **KEEP** week chips, locked/upcoming copy, WeekSessionCard actions, published-snapshot honesty.
- **REFINE** session cards so the primary target outranks metadata; show key vs optional without a sticker farm.
- **RETHINK** nothing structural. Programme should stay a week list, not become a TrainingPeaks calendar.

### Session (drawer / detail)

| Lens | Score | Note |
| --- | --- | --- |
| Hierarchy | weak | Tags, chips, then several paragraph blocks of equal weight |
| Clarity | mixed | The work is there; it is slow to parse |
| Athlete usefulness | strong | Content is right |
| Visual quality | mixed | Quiet cards, but too many |
| Interaction quality | mixed | Drawer is correct; log form is a wall |
| Data density | mixed | Full prescription as preformatted text |
| Coach presence | mixed | Coach note is one more Block |
| Sense of progress | n/a | |
| Mobile usability | mixed | Drawer width is good; scroll is long |

- **KEEP** drawer pattern, SessionTarget primitive, live logging, film prompt distinction, preview read-only.
- **REFINE** order to purpose → primary target → structure → spec → coach → log.
- **RETHINK** main set as a novel. Intervals, stations, and erg splits need a picture (timeline, spec rows), not another `<p>`.

### Completion

| Lens | Score | Note |
| --- | --- | --- |
| Hierarchy | mixed | “Session logged” then a 2-up of whatever was saved |
| Clarity | mixed | Saved is clear; vs-target is not |
| Athlete usefulness | mixed | Coach can see it; athlete does not feel the hit |
| Visual quality | strong | Restrained, no confetti |
| Interaction quality | mixed | Confirm exists; no beat of target vs actual |
| Data density | mixed | RPE/execution/legs/energy can exist and still look like a form dump |
| Coach presence | mixed | “Your coach can see this” is the right sentence |
| Sense of progress | weak | No link into the week’s accumulation |
| Mobile usability | strong | |

- **KEEP** restrained confirmation, no confetti, no count-up, reduced-motion skip.
- **REFINE** TARGET / ACTUAL / RPE as the confirmation hierarchy (concept prototype).
- **RETHINK** treating completion as a toast. It is a beat in the OS.

### Performance

| Lens | Score | Note |
| --- | --- | --- |
| Hierarchy | mixed | BenchmarkCard is correct; page still lists like a roster |
| Clarity | strong | Current / pending / historical words |
| Athlete usefulness | strong | Programming anchors are the point |
| Visual quality | mixed | Primitive is good; family grouping is table-adjacent |
| Interaction quality | mixed | Submit form is heavy |
| Data density | mixed | |
| Coach presence | mixed | Pending review is the coach beat |
| Sense of progress | mixed | History exists, not staged as improvement |
| Mobile usability | mixed | |

- **KEEP** status words, empty honesty, current vs pending vs historical, D BenchmarkCard.
- **REFINE** one hero mark per family (5K huge, previous and delta under it).
- **RETHINK** database-table energy for the active set.

### Progress

| Lens | Score | Note |
| --- | --- | --- |
| Hierarchy | mixed | Honest B payload rendered as sibling summaries |
| Clarity | strong | Missing stays missing; week in progress labelled |
| Athlete usefulness | mixed | The fields are right; the story is a grid |
| Visual quality | mixed | Primitives, hairline “charts” |
| Interaction quality | weak | Little to do except read |
| Data density | mixed | Equal cards for unlike timescales |
| Coach presence | weak | Analytics contract excludes coach notes (correct) — UI should still send you to the programme/coach mark |
| Sense of progress | mixed | Rolling 4 and benchmarks are there, not sequenced |
| Mobile usability | mixed | |

- **KEEP** B contract, empty sentences, D TrainingSummary / ProgressChartCard, no mock series.
- **REFINE** Now → Recent → Longer-term. Trajectory over hairline bars when a series exists.
- **RETHINK** a grid of six equal week stats as the emotional design.

### Races

| Lens | Score | Note |
| --- | --- | --- |
| Hierarchy | mixed | Overall time is not yet a broadcast headline |
| Clarity | strong | Completeness labels; no invented Roxzone |
| Athlete usefulness | mixed | Splits as definition lists |
| Visual quality | weak | Results table |
| Interaction quality | mixed | History + add |
| Data density | mixed | All splits equal |
| Coach presence | n/a on athlete | Observations are from stored numbers |
| Sense of progress | mixed | vsPrevious is in the contract, under-shown |
| Mobile usability | mixed | 2×4 grids of splits |

- **KEEP** E observations as sentences, completeness honesty, no percentiles, 022 unapplied.
- **REFINE** overall time as the hero; run fade as a strip; stations vs previous as a comparison, not a `<dl>`.
- **RETHINK** treating a HYROX race like a form you already filled in.

### Navigation

| Lens | Score | Note |
| --- | --- | --- |
| Hierarchy | mixed | Home / Programme / Progress / Check-In primary; Performance and Races in More |
| Clarity | strong after nit | Performance is the canonical label |
| Athlete usefulness | mixed | Four primary tabs is a lot; Check-In as primary competes with today |
| Visual quality | mixed | |
| Interaction quality | mixed | More menu hides Performance |
| Mobile usability | mixed | Clearance nit fixed |

- **KEEP** few destinations, Performance vs Performance testing distinction, Races gated by flag.
- **REFINE** Home as “today + next action”; Programme as the plan; Progress as accumulation; Performance in a place athletes can find without hunting.
- **RETHINK** Explore-on-Home as navigation. Check-In as a fourth primary when it is not due.

---

## Recommended direction

**Coached command centre** — Concept A’s hierarchy, Concept C’s coach language, Concept B’s telemetry only when it supports the session.

Why: Hybrid365 is 1-1 coaching for HYROX, not recovery hardware and not a file analyser. The athlete opens the app to know what to do now, why the coach wrote it, and whether they are actually getting fitter. That is A + C, with B’s density available on Progress and Race, not as Home’s personality.

What should stay in Batch 1 live UI: D primitives, honest empties, status words, Performance naming, B/E contracts, restrained completion, session drawer, programme week chips.

What should change later (after human visual review, not in this task): Home 4-up and readiness %, session structure as a picture, completion as target vs actual, Progress as a story, Performance as a hero mark, Races as split analysis.

STOP. Do not apply this to live athlete surfaces until that review.
