# 4 · PoC build (the non-negotiable step)

No PoC, no payout. Build it in a **local fork / testnet** — never against production.

## PoC checklist
- [ ] Runs from a clean environment with the steps below only.
- [ ] Demonstrates the **impact**, not just the flaw (e.g. actually reads another user's data, actually drains the test balance, actually crashes the node).
- [ ] Deterministic — works every time, not a flaky race you got once.
- [ ] Minimal — strip everything not needed to prove it.
- [ ] Screenshot / log / tx-hash capturing the moment of impact.

## Fill this in
- **Setup:** exact commands to reach the vulnerable state (versions, config, seed data).
- **Trigger:** the request / tx / input that fires the bug (copy-pasteable).
- **Observed result:** what proves impact (the leaked value, the changed balance, the panic trace).
- **Expected result:** what should have happened.
- **Artifacts:** screenshots / logs / hashes.

If you can't get a clean, repeatable PoC after a real attempt: the finding isn't ready. Park it or drop it — don't submit a "maybe."
