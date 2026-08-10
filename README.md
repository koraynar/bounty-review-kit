# Bounty Review Kit

A repeatable, **human-gated** loop for finding vulnerabilities in one bug-bounty target at a time.

**Core principle:** AI reads at scale, *you* judge, build the PoC, and submit. Never auto-submit.

## The loop (per target)

| Step | File | You or AI? |
|------|------|-----------|
| 0. Intake — is this target worth your time? | `1-target-intake.md` | You |
| 1. Clone the repo locally | — | You |
| 2. Recon — map it, rank the suspicious modules | `2-recon-prompt.md` | AI |
| 3. Deep review — go module by module | `3-deep-review-prompt.md` | AI |
| 4. Triage — kill the noise | `4-triage-rubric.md` | You |
| 5. PoC — build a working repro | `5-poc-template.md` | You |
| 6. Report — write it and submit manually | `6-report-template.md` | You |

## Two ways to run it

- **Manual:** paste the prompts into Claude Code, one module at a time. Slower, full control.
- **Automated:** run `bounty-review.mjs` as a Claude Code Workflow. It does steps 2–4 (recon → deep review → adversarial triage) and hands you a ranked candidate list. You still do 5–6 by hand.

  ```
  Workflow({ scriptPath: "bounty-review-kit/bounty-review.mjs",
             args: { repoPath: "/abs/path/to/cloned/repo",
                     targetType: "web" | "contract" | "node",
                     programName: "<program name>",
                     scopeNotes: "in-scope: packages/oracle/**; out: test/**" } })
  ```

## The 5 golden rules (read before every run)

1. **Review SOURCE CODE locally.** No live scanning / fuzzing / automated traffic against production — that's banned on most programs and gets you flagged.
2. **One PoC beats ten hunches.** A finding without a reproducible PoC is worth **$0** everywhere.
3. **You submit — manually — one clean report per real bug.** Auto-submission is the fast route to a ban.
4. **Confirm scope + program rules BEFORE spending compute.** Some programs (e.g. Kraken) ban AI-generated reports outright. Check `1-target-intake.md` first.
5. **Rank targets by acceptance rate, not headline max reward.** A $2k bug you get paid beats a $2M ceiling you'll never touch.
