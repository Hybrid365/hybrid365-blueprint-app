# Duplicate week — visual QA

Coach Programme Builder week action. Builds on existing Copy Week engine + draft revision model.

## Behaviour

- Label: **Duplicate week**
- Default: copy same Session Family stage; re-resolve prescription preview against current Programming Anchors; preserve coach_override
- Never auto-publish; never copy athlete feedback / completion
- Unpublished target conflict: Cancel · Replace target draft · Merge into empty slots
- **Published target:** create editable draft revision (live published week stays until republish)
  - Replace draft with duplicated source
  - Create draft from current published target
  - Merge duplicated source into empty slots
- Normal Edit of published future weeks also forks/opens unpublished draft revision

## Shots

| File | Context |
| --- | --- |
| `01-duplicate-week-modal-1440.png` | Modal: Week 1 → Week 2 summary |
| `02-duplicate-conflict-1440.png` | Conflict choices when unpublished target has a draft |
| `03-published-draft-revision-1440.png` | Published target → draft revision choices |
| `04-edit-draft-revision-banner-1440.png` | Programme Builder banner while editing draft revision |
