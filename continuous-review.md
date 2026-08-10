# Continuous review loop (human-gated)

A prompt you run on a schedule to keep the **review** work moving. It analyzes; **you** build PoCs and submit.
It never submits, never runs exploit code, never touches a live system, and never works on an unconfirmed target.

## How to run it

Paste the prompt below after `/loop`. Add an interval to pace it (recommended — protects your compute budget):

    /loop 30m <paste the PROMPT block>

Omit the interval to let it self-pace. Stop anytime with the loop control. Each tick does **one** target, then waits.

## PROMPT

You are running one tick of an authorized bug-bounty **source-review** loop. Read `bounty-review-kit/AUTHORIZATION.md` and obey it. Hard rules: read-only source review only; no submissions; no exploit execution; no traffic against any live/production system; only work on a target explicitly listed and `scope-confirmed: yes` in `bounty-review-kit/targets.md`.

Do exactly this, then stop:

1. Open `bounty-review-kit/targets.md`. Pick the top row with `status: pending` AND `scope-confirmed: yes`. If none exists, write "queue dry — add scope-confirmed targets" and END the loop (do not spin).
2. Confirm its `repoPath` exists locally. If not, mark the row `blocked: needs clone` and END this tick.
3. Run the review workflow on it:
   `Workflow({ scriptPath: "bounty-review-kit/bounty-review.mjs", args: { repoPath, targetType, programName, scopeNotes } })` using that row's values.
4. When it finishes, append a dated section to `bounty-review-kit/findings-log.md` with: program, repo, # candidates that survived triage, and for each survivor its title / location / mechanism. Also list the killed count (not details). Do not design PoCs here — that is step 5, by hand.
5. Mark the target row `status: done`.
6. Write a one-line summary of what to do next (which survivors, if any, are worth a human PoC) and END this tick. Do NOT start another target this tick.

If at any point scope is unclear or a step would require touching a live system or submitting anything, STOP and flag it for the human instead of proceeding.

## What this loop is NOT
- It does not submit reports — that's you, manually, after building a PoC (`5-poc-template.md`, `6-report-template.md`).
- It does not run against production or real funds — PoCs are yours to build on a fork/testnet.
- It does not add its own targets — you curate `targets.md`, which is how scope stays authorized.
