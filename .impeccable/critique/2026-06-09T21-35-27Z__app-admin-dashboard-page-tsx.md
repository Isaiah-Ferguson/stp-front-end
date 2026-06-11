---
target: dashboard
total_score: 19
p0_count: 0
p1_count: 3
timestamp: 2026-06-09T21-35-27Z
slug: app-admin-dashboard-page-tsx
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Active nav highlighted; no loading states; hardcoded date |
| 2 | Match System / Real World | 3 | Clear domain language; "POS" abbreviation unexplained |
| 3 | User Control and Freedom | 2 | Nav works; "View all"/action links dead; filter chips non-functional |
| 4 | Consistency and Standards | 3 | Design system consistent; "Quick add" violates verb+object rule |
| 5 | Error Prevention | 1 | No forms; alerts unranked by urgency |
| 6 | Recognition Rather Than Recall | 2 | Icons labeled; alert dots are color-only severity |
| 7 | Flexibility and Efficiency | 1 | No shortcuts; no bulk actions |
| 8 | Aesthetic and Minimalist Design | 3 | Clean; attendance chart bare and hard to decode |
| 9 | Error Recovery | 1 | No error states designed |
| 10 | Help and Documentation | 1 | No tooltips, no contextual help |
| **Total** | | **19/40** | **Acceptable — significant improvements needed** |

### Anti-Patterns Verdict
Not AI-generated at a glance. Genuine design system identity. One detector finding: side-stripe milestone border in admin.css:243 (border-left: 3px solid var(--productions) on .evt.milestone).

### Priority Issues
[P1] Alert dots color-only severity — no icon/ARIA alternative. Fix: replace dots with AlertCircle/AlertTriangle/Info icons from lucide-react.
[P1] fg-tertiary (#98968b) ~2.81:1 contrast on paper bg. Fails WCAG AA. Fix: darken to ~#7c7a70.
[P1] Side-stripe border on .evt.milestone — absolute design system ban. Fix: full border + fill distinction.
[P2] Dashboard opens with anxiety — 5 equal-weight alerts + warning/danger stats equal in weight to positive stats. Fix: tinted backgrounds on urgent stat cards; prioritize alerts.
[P2] Filter chips false affordance — cursor:pointer but non-functional. Fix: wire state or remove.

### Persona Red Flags
Alex: no keyboard shortcuts, no bulk alert-resolve, vague "Quick add" label.
Sam: color-only alert severity, attendance chart inaccessible, fg-tertiary contrast failure.
Maria (coordinator): filter chips don't scope data to her program; pipeline and alerts show all-program noise.

### Minor Observations
POS abbreviation unexplained; attendance chart lacks y-axis; hardcoded date; home page shows dev scaffold; View all links dead.
