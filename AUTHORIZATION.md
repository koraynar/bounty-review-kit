# Authorization & Method Statement

This kit is used only for **authorized** security research. Read this before every engagement; the "Method disclosure" block at the bottom is safe to attach to a report if a program asks how a finding was produced.

## Scope of authorization
- Testing is performed **only** against assets covered by a **published bug-bounty / VDP program** that explicitly invites security testing (e.g. Immunefi, Cantina, HackerOne, Bugcrowd, or a company's own security.txt policy).
- The exact **in-scope assets and rules** are confirmed on the program's own page *before* any work (see `1-target-intake.md`). Out-of-scope assets are never touched.
- If a target is **not** covered by an active program, or scope is unclear, work stops and nothing is submitted.

## How testing is conducted (the safe boundary)

Work runs in one of two modes. **The mode is decided per target at intake and written down**, because the boundaries differ. Never mix them: do not probe live hosts while in Mode A, and do not treat Mode B's permission as covering assets the program did not list.

Both modes share these limits:
- **No exploitation beyond what is required to demonstrate impact**, and no accessing, modifying, or exfiltrating real user data.
- **AI assistance is disclosed** where a program requests it; a human reviews, reproduces, and authors every submission.
- If real user data is reached accidentally, stop immediately, do not save it, and disclose that fact in the report.

### Mode A — static source review (the default; this is what the kit automates)
- **Source-code review of code the program has published or open-sourced**, read locally. No scanning, fuzzing, or automated traffic against production systems.
- **Proof-of-concept work happens on a local fork or the program's testnet**, never against production or real user funds.

### Mode B — authorized live-host testing (manual only; the kit does not do this)
Used only where a published program **explicitly lists live hosts in scope and invites testing against them**.
- **Only the hostnames the program lists**, plus wildcards exactly as written. An unlisted host is out of scope even if it obviously belongs to the same company.
- **Respect the program's out-of-scope list as a hard limit** — it defines what is not merely unpaid but unwelcome.
- **No denial-of-service, brute-force, credential-stuffing, or rate-limit/velocity testing.** No heavy automated scanning unless the program permits it in writing.
- **Authenticated testing only against accounts I created myself.** Never another user's account, never obtained credentials, and never a request for credentials where the program says none are provided.
- **Minimum activity necessary** to demonstrate the issue — evidence, not persistence. No backdoors, no stored payloads left behind, no lateral movement.
- Passive reconnaissance (DNS enumeration, certificate transparency, reading served assets) is preferred over active probing wherever it will answer the question.

## Disclosure
- Findings are reported **privately, through the program's channel**, following its coordinated-disclosure rules.
- Nothing is published, shared, or disclosed publicly before the program authorizes it.

## Review and submission

*Updated 2026-08-13. This section previously stated that a human performed every step including
submission. That is no longer accurate, and an inaccurate policy is worse than an inconvenient one.*

- **The review pipeline produces candidate observations only.** It never runs exploit code against live
  systems, and no finding reaches a program straight from an automated run.
- **Scope is confirmed against the program's own published brief before any work starts** — not from a
  summary, and not from memory.
- **Every finding is reproduced by an executable proof-of-concept** that runs locally against the
  target's own test harness, with a control case demonstrating the assertions are meaningful.
- **Findings pass an adversarial review stage** whose job is to refute them. Candidates that survive
  only because nobody argued against them are not submitted.
- **The researcher directs the operation and remains accountable for everything submitted under their
  account.** They may delegate specific roles — including final review and the act of submission — to a
  named agent, and where they do so they authorize it explicitly rather than by default.

**Note on platform rules.** Some programs require the researcher personally to have validated any
AI-assisted report before it is submitted. Where a program states such a requirement, it governs — the
delegation above does not override it, and the researcher must satisfy that requirement themselves.
Check each program's terms; they differ.

## Working with Anthropic's cyber safeguards

Opus and Sonnet block **high-risk dual-use** activity (vulnerability exploitation, offensive tooling) at the request level, by default, for everyone — authorization context in a prompt or `CLAUDE.md` does not unblock it. Where this kit's stages fall:

| Stage | Tier | Runs under AI |
|---|---|---|
| `1-target-intake`, `2-recon` | Benign | Yes |
| `3-deep-review` | Benign *as written* — comprehension + mechanism only | Yes |
| `4-triage` | Benign — rubric scoring | Yes |
| `5-poc`, `6-report` | **High-risk dual-use** | **By hand** unless CVP-approved |

Keep stage 3 free of PoC design and exploitability ranking. That boundary is why stages 1–4 run unattended; it is a functional requirement, not a stylistic one.

The table above describes **Mode A** only. Mode B (authorized live-host testing) is manual throughout and does not run the kit, so it never reaches the classifier and needs no CVP approval.

**Cyber Verification Program (CVP)** — free, ~2 business days, unblocks the dual-use tier: <http://portal.anthropic.com/programs/cvp>. Before applying, note it **requires data retention to be enabled** — check that against each program's confidentiality terms, since this kit reviews third-party code. Approval binds to one organization ID and does not transfer.

False positives / rejection appeals: <https://claude.com/form/cyber-block-false-positive-report-cvp-rejection-appeal>

---

### Method disclosure (attachable to a report)

**Mode A — static source review:**
> This finding was identified through **authorized static source-code review** of the program's in-scope, publicly available code, conducted locally. AI tooling was used to assist code navigation and hypothesis generation; all conclusions were **manually verified by the researcher**, and the proof of concept was reproduced in an isolated local environment. No testing was performed against production systems or real user data. Reported privately under the program's coordinated-disclosure policy.

**Mode B — authorized live-host testing:**
> This finding was identified through **authorized testing of hosts explicitly listed in scope** by the program, conducted manually by the researcher. Testing was limited to the listed hostnames and to accounts I created myself; no other user's data or account was accessed, and activity was kept to the minimum needed to demonstrate the issue. No denial-of-service, brute-force, or rate-limit testing was performed, and nothing was left behind on the tested systems. Reported privately under the program's coordinated-disclosure policy.
