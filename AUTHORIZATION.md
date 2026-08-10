# Authorization & Method Statement

This kit is used only for **authorized** security research. Read this before every engagement; the "Method disclosure" block at the bottom is safe to attach to a report if a program asks how a finding was produced.

## Scope of authorization
- Testing is performed **only** against assets covered by a **published bug-bounty / VDP program** that explicitly invites security testing (e.g. Immunefi, Cantina, HackerOne, Bugcrowd, or a company's own security.txt policy).
- The exact **in-scope assets and rules** are confirmed on the program's own page *before* any work (see `1-target-intake.md`). Out-of-scope assets are never touched.
- If a target is **not** covered by an active program, or scope is unclear, work stops and nothing is submitted.

## How testing is conducted (the safe boundary)
- **Source-code review of code the program has published or open-sourced**, read locally. No unsolicited scanning, fuzzing, or automated traffic against production systems.
- **Proof-of-concept work happens on a local fork or the program's testnet**, never against production or real user funds.
- **No exploitation beyond what is required to demonstrate impact**, and no accessing, modifying, or exfiltrating real user data.
- **AI assistance is disclosed** where a program requests it; a human reviews, reproduces, and authors every submission.

## Disclosure
- Findings are reported **privately, through the program's channel**, following its coordinated-disclosure rules.
- Nothing is published, shared, or disclosed publicly before the program authorizes it.

## Human-in-the-loop (non-negotiable)
- The automated tooling produces **candidate observations only**. It never submits reports and never runs exploit code against live systems.
- A human confirms scope, builds the PoC, verifies impact, and decides what (if anything) to submit.

## Working with Anthropic's cyber safeguards

Opus and Sonnet block **high-risk dual-use** activity (vulnerability exploitation, offensive tooling) at the request level, by default, for everyone — authorization context in a prompt or `CLAUDE.md` does not unblock it. Where this kit's stages fall:

| Stage | Tier | Runs under AI |
|---|---|---|
| `1-target-intake`, `2-recon` | Benign | Yes |
| `3-deep-review` | Benign *as written* — comprehension + mechanism only | Yes |
| `4-triage` | Benign — rubric scoring | Yes |
| `5-poc`, `6-report` | **High-risk dual-use** | **By hand** unless CVP-approved |

Keep stage 3 free of PoC design and exploitability ranking. That boundary is why stages 1–4 run unattended; it is a functional requirement, not a stylistic one.

**Cyber Verification Program (CVP)** — free, ~2 business days, unblocks the dual-use tier: <http://portal.anthropic.com/programs/cvp>. Before applying, note it **requires data retention to be enabled** — check that against each program's confidentiality terms, since this kit reviews third-party code. Approval binds to one organization ID and does not transfer.

False positives / rejection appeals: <https://claude.com/form/cyber-block-false-positive-report-cvp-rejection-appeal>

---

### Method disclosure (attachable to a report)
> This finding was identified through **authorized static source-code review** of the program's in-scope, publicly available code, conducted locally. AI tooling was used to assist code navigation and hypothesis generation; all conclusions were **manually verified by the researcher**, and the proof of concept was reproduced in an isolated local environment. No testing was performed against production systems or real user data. Reported privately under the program's coordinated-disclosure policy.
