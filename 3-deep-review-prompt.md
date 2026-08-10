# 2 · Deep-review prompt (one module at a time)

Run this once **per module** from the recon queue. One module per run keeps the AI focused and the output triageable.

---

You are doing an authorized security code review. Review **only** this module: `<path>`.
Target type: `<web | contract | node>`. In scope: `<paste>`.

Walk the code and check it against the class list for this target type (below). For anything you find, you must be able to point at the exact file+line and explain the mechanism — no vague "could be vulnerable."

**Output, per candidate:**
- `title` — one line
- `file:line`
- `vuln class`
- `mechanism` — how untrusted input reaches the sink; the actual code path
- `confidence` — high / med / low, and *why*
- `in-scope?` — yes/no per the scope above

Rank by confidence. If nothing real is here, say so plainly — a clean "nothing found" is a valid, valuable result. Do not pad.

> PoC design is deliberately **not** part of this stage — it happens by hand at step 5. Keeping this stage to comprehension-and-mechanism is what stops it tripping Anthropic's cyber safeguards; see `AUTHORIZATION.md`.

---

### Class checklists

**web** — IDOR/BOLA (object refs without ownership checks), broken access control, auth/session bypass, stored/reflected XSS, SSRF, CORS misconfig, secrets in client bundles, injection (SQL/NoSQL/command), business-logic (price/qty/negative amounts, race conditions on balance/state), open redirect w/ impact, JWT/signature flaws.

**contract** — reentrancy, missing/incorrect access control (`onlyOwner`, roles), integer overflow/rounding/precision loss, oracle/price manipulation, unchecked external call return, signature replay / missing nonce, front-running/MEV, upgradeability & storage-collision, collateral/liquidation math, unprotected initializer, `delegatecall` misuse.

**node** (Rust/Go/C++) — memory safety (use-after-free, OOB), unsafe deserialization, path traversal, command/RCE, panic/unwrap → DoS, unvalidated network input, consensus/determinism divergence, integer wrap, race conditions/TOCTOU, private-key/secret handling, resource exhaustion.
