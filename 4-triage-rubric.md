# 3 · Triage (the human gate — this is where most candidates die)

AI over-flags. Your job is to kill fast and keep only what can become a **paid** report. Run every candidate through this.

## Kill it if ANY are true
- ❌ You can't articulate a concrete attacker + concrete impact ("someone could maybe…" = dead).
- ❌ It requires access/privilege the attacker wouldn't have (already-admin, local machine, MITM you can't get).
- ❌ It's out of scope (re-check the intake scope, exactly).
- ❌ It's an excluded class for this program (missing headers, self-XSS, rate-limiting, best-practice nits, DoS if excluded, version disclosure).
- ❌ You can't imagine a PoC that *demonstrates* the impact.
- ❌ It's almost certainly already reported (obvious surface on a heavily-hunted program).

## Keep it if ALL are true
- ✅ Concrete attacker → concrete impact on an in-scope asset.
- ✅ You believe you can build a reproducible PoC.
- ✅ The impact maps to a paid severity tier.
- ✅ Plausibly novel (fresh code, non-obvious path, or under-reviewed module).

## Before you invest in a PoC
- **Dedup sanity check:** search the program's disclosed reports / changelog / recent commits for the same issue.
- **Scope re-confirm:** paste the exact in-scope line next to the finding.
- **Severity estimate:** which tier, roughly what payout — is it worth the PoC hours?

Survivors → `5-poc-template.md`. Everything else → delete without regret.
