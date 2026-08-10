# Target queue (you curate this)

Copy this to `targets.md` — which is gitignored, because a live queue names the
programs you're reviewing and coordinated disclosure means that stays private.

The continuous-review loop only ever touches targets **you** have added here and marked `scope-confirmed: yes`.
A row with `scope-confirmed: no` is skipped — that's the guardrail that keeps the loop inside authorized scope.

| status | program | platform | repoPath (local clone) | targetType | scope-confirmed | scopeNotes |
|--------|---------|----------|------------------------|------------|-----------------|------------|
| pending | `<program name>` | `<Immunefi \| Cantina \| HackerOne>` | `<abs path to local clone>` | `<web \| contract \| node>` | no ← confirm on the program page first | `in: <paths>; out: <paths>` |

Statuses: `pending` → `done`. Add new rows above as you clone + confirm new in-scope targets.
Loop rule: process the top `pending` row whose `scope-confirmed = yes`. If none, the loop reports "queue dry" and stops.
