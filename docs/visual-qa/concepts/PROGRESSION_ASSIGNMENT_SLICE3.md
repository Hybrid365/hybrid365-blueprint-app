# Progression assignment — Slice 3 visual QA notes

**Status:** Domain + coach UX wired behind `HYROX_SESSION_FAMILIES_*` (default OFF).  
**Screenshots:** Capture on staging with the flag allow-listed for Demo Competitive.

## Enable on staging

```bash
HYROX_SESSION_FAMILIES_ATHLETE_IDS=<demo-competitive-uuid>
# or
HYROX_SESSION_FAMILIES_ENABLED=1
```

## Shot list (1440px)

1. Programme Builder toolbar — **Add progression** visible  
2. Assignment modal — family selected (Threshold — 5 Minute Repeats)  
3. Starting stage list (S1–S4, Consolidation, Deload)  
4. 4-week preview panel with editable stage dropdowns  
5. Resolved target `@THRESHOLD +5s/km` → athlete pace  
6. Coach override field filled (SYSTEM vs COACH)  
7. Week grid card with `Progression · S2` badge  
8. Structural edit unlink confirm dialog  

## Not captured in this agent pass

Staging browser login + env flag were not available in the agent environment. Run the shot list after enabling the flag for Demo Competitive.
