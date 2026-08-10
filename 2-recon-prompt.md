# 1 · Recon prompt (map the repo, rank the targets)

Paste into Claude Code with the repo open. Goal: **not** to find bugs yet — just to map the attack surface and produce a ranked queue of modules to deep-review.

---

You are doing an authorized security code review of a bug-bounty target. This repo is IN SCOPE. Do **read-only** analysis — no edits, no running the app against any live host.

**Repo:** <path>
**Target type:** <web | contract | node>
**In scope:** <paste scope>

Do this:

1. **Map the architecture.** List the top-level components and how data flows between them. Where does untrusted input enter? Where does value / privilege / state cross a boundary (user→server, off-chain→on-chain, network→node)?

2. **Identify trust boundaries and entry points** — HTTP routes, RPC/message handlers, contract external/public functions, deserializers, auth checks, CLI args, file/path handling.

3. **Rank the 6–8 most suspicious modules/files to review deeply.** For each: path, one line on *why* it's suspicious, and a risk score 1–10. Prioritize: recently-changed code, complex state, access-control logic, anything parsing untrusted input, anything handling money/keys.

Output a table: `path | why suspicious | risk (1-10)`. Then stop — I'll deep-review them one at a time.

Do **not** speculate about bugs you haven't located in the code. Be concrete: cite files and functions.
