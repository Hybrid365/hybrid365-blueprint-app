# Duplicate week — visual QA

Coach Programme Builder week action. Builds on existing Copy Week engine.

## Behaviour

- Label: **Duplicate week**
- Default: copy same Session Family stage; re-resolve prescription preview against current Programming Anchors; preserve coach_override
- Never auto-publish; never copy athlete feedback / completion
- Target conflict: Cancel · Replace target draft · Merge into empty slots
- Published / athlete-history weeks protected

## Shots

| File | Context |
| --- | --- |
| `01-duplicate-week-modal-1440.png` | Modal: Week 1 → Week 2 summary |
| `02-duplicate-conflict-1440.png` | Conflict choices when target has a draft |
