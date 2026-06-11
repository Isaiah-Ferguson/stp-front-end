# Critique: app/(admin)/dashboard/page.tsx
Date: 2026-06-09T22:18:00Z
Score: 20/40 (up from 19/40)
Detector: 0 findings (was 1 — milestone side-stripe resolved)

## Heuristic Scores

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Visibility of System Status | 2 | No loading states; hardcoded date |
| 2 | Match System / Real World | 3 | "Participants" language throughout; "POS" still unexplained |
| 3 | User Control and Freedom | 2 | Dead action links; basic nav works |
| 4 | Consistency and Standards | 3 | Button label and language now consistent |
| 5 | Error Prevention | 1 | Alert icons ranked; no other guardrails |
| 6 | Recognition Rather Than Recall | 3 | Alert severity: icon + color (two-signal) |
| 7 | Flexibility and Efficiency | 1 | No shortcuts; no bulk actions |
| 8 | Aesthetic and Minimalist Design | 3 | Urgency tinting on stat cards; cleaner topbar |
| 9 | Error Recovery | 1 | No error states |
| 10 | Help and Documentation | 1 | No contextual help |
| **Total** | | **20/40** | |

## Changes Since Previous Run (19/40)

All P1s resolved:
- Alert severity now uses AlertCircle/AlertTriangle/Info icons with `aria-label` on each row (color is no longer the only signal)
- `--fg-tertiary` darkened to `#706e68` (~4.88:1 on `--bg`, WCAG AA)
- `.evt.milestone` side-stripe removed; now `border: 1.5px solid var(--productions-border)` with `border-radius: var(--r-sm)`

Both P2s addressed:
- `.adm-stat.is-warn` and `.adm-stat.is-danger` classes added; applied to Open Tasks and Expiring Docs
- Filter chips now use `ss-chip--static`; false-affordance removed
- "Quick add" → "Add participant"; "Active Students" → "Active Participants"

## Remaining Issues

### P2 — No loading or skeleton states
Every widget shows hardcoded data. When API calls replace placeholder data, latency will produce blank boxes. Design skeleton states before integration.
Files to change: `app/(admin)/dashboard/page.tsx`, `app/styles/admin.css`

### P2 — Attendance chart inaccessible
Bar heights are purely visual CSS. No semantic structure, no ARIA roles, no table equivalent.
Add `<figure>`+`<figcaption>`, visually hidden `<table>` with the same data, session-day context text under each program column.
File: `app/(admin)/dashboard/page.tsx` (attendance chart section)

### P3 — "POS" abbreviation unexplained
First alert row: "POS expires in 6 days" — new staff will not know this term.
Fix: expand inline to the full term (e.g. "Proof of Service").

### P3 — Hardcoded date
`"Thursday, June 5, 2026"` — make dynamic before launch.

### P3 — Action links need object nouns for screen readers
"Renew", "Upload", "Schedule" etc. are verb-only. Add object for standalone meaning ("Renew POS", "Upload intake docs").
