# Continuous review loop (human-gated)

A prompt you run on a schedule to keep the **review and PoC** work moving. It analyzes, builds the
proof-of-concept, and drafts the report. **You** validate and submit.

It never submits, never runs exploit code, never touches a live system, and never works on an
unconfirmed target.

## The two gates that stay human, always

1. **Scope confirmation.** A target only enters the queue when you have read the program's own page
   and marked the row `scope-confirmed: yes`. The loop never adds its own targets.
2. **Submission.** The loop drafts; you run the test yourself and click submit. This is not
   ceremony — Bugcrowd's Researcher Code of Conduct requires the researcher to have manually
   validated any GenAI-assisted report, and several programs exclude AI-generated submissions
   outright. Automating this is how accounts get banned.

## How to run it

Paste the prompt below after `/loop`, with an interval to pace it:

    /loop 30m <paste the PROMPT block>

Each tick does **one** target, then stops. Stop anytime with the loop control.

## PROMPT

You are running one tick of an authorized bug-bounty **source-review** loop. Read
`bounty-review-kit/AUTHORIZATION.md` and obey it. Hard rules: read-only source review only; no
submissions; no exploit execution; no traffic against any live/production system; no outbound
network calls from any PoC; only work on a target explicitly listed and `scope-confirmed: yes` in
`bounty-review-kit/targets.md`.

Do exactly this, then stop:

1. Open `bounty-review-kit/targets.md`. Pick the top row with `status: pending` AND
   `scope-confirmed: yes`. If none exists, write "queue dry — add scope-confirmed targets" and END
   the loop (do not spin).
2. Confirm its `repoPath` exists locally. If not, mark the row `blocked: needs clone` and END.
3. **Confirm the clone is at the upstream tip.** `git fetch && git rev-list --count HEAD..origin/HEAD`.
   If the bug is already fixed upstream, the finding is worth nothing. Record the exact commit.
4. **Write scopeNotes deliberately — this is the single biggest lever on result quality.** Read the
   program's paid tiers first and steer the run at them. Name the vulnerability classes that pay,
   and explicitly de-prioritise the classes that do not. On a program with only High/Critical web
   tiers, generic XSS and IDOR are worth $0 and should be killed at triage; say so in the notes.
   List the program's declared won't-fix items verbatim so triage can kill them early.
   **Do NOT tell the review that a seam is already safe.** Say what you verified and what you did
   not, and let it check. A "this is already correct, skip it" instruction hid a real finding once.
5. Run: `Workflow({ scriptPath: "bounty-review-kit/bounty-review.mjs", args: { repoPath, targetType, programName, scopeNotes } })`
6. For each survivor, **verify it yourself before believing it**: open every cited file:line and
   confirm the code says what the finding claims. Line numbers drift and wrong ones destroy a
   report's credibility. Kill anything that does not check out.
7. For each survivor that holds up, **build a PoC as a Go/unit test against the repo's own test
   harness** (`plugintest`, `testutil`, whatever the repo already uses). Requirements:
   - It must make **no network calls**. If a code path would dial out, configure it to fail locally
     (an unparseable URL, a dead port) and assert that execution *reached* that point — reaching it
     is the proof that the gates before it passed.
   - Include a **control case** showing the check rejects a bad input, so a passing assertion means
     something.
   - Name the file `*_test.go` — Go only runs tests from files with that suffix.
   - Run it with `-count=1`; Go caches results and will print `(cached)` without executing.
   - Confirm it does not break the repo's existing test suite.
8. Draft the report from `6-report-template.md`. State the severity you actually believe and say
   plainly when you are *not* claiming higher — overclaiming is the most common way a valid finding
   gets downgraded or closed. Frame findings against the program's language: if a framing is on the
   won't-fix list, use a different accurate one. **Write down honestly what the PoC does not prove.**
9. Append a dated section to `bounty-review-kit/findings-log.md`: program, repo, commit, survivors
   with title/location/mechanism, and the killed count (not details). Save the PoC and report as
   `*.local.*` files so `.gitignore` keeps them private.
10. Mark the row `status: done` (or `report ready`), write one line on what the human should do
    next, and END. Do NOT start another target this tick.

If scope is unclear, or a step would require touching a live system, creating an account, or
submitting anything, STOP and flag it for the human.

## Intake gate — check BEFORE cloning anything

Both of these have already cost real time once:

- **Is there a fee or deposit to submit?** Several programs charge per submission, and some slash
  the deposit for a report they judge low-effort. With no accepted findings yet, a pay-to-submit
  target is a bad bet. Third-party survey data has reported "no fee" for a program that charges one
  — read the program's own page.
- **Does the program pay cash at all?** Eight of twelve open-source projects surveyed pay only
  credit or a hall-of-fame listing.
- **Does the program ban AI-assisted reports?** This is per-program, not per-platform. A platform's
  own terms can be silent on AI while an individual program's out-of-scope list excludes
  "submissions generated using ChatGPT or other LLM tools" verbatim. Read that list every time.

## Expectations

Most targets return nothing, and that is the loop working. Across the first four real targets
reviewed with this kit, half produced nothing submittable at all, and the ones that did produced
one or two findings each — not a list. A run that kills everything has protected you from a
rejection, which on a new account costs more than the finding was worth.

## What this loop is NOT

- It does not submit reports — that is you, after running the test yourself.
- It does not run against production or real funds.
- It does not add its own targets — you curate `targets.md`, which is how scope stays authorized.
- It does not create accounts or do live-host testing (Mode B). See `AUTHORIZATION.md`.
