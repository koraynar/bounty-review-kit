# 5 · Report (write once, submit manually)

One finding per report. Clear enough that a triager reproduces it in under 5 minutes. You submit this yourself — never a bot.

---

**Title:** <vuln class> in <component> leading to <impact>

**Severity:** <Critical/High/Medium/Low> — <one line justifying it against the program's rubric>

**Asset in scope:** <exact in-scope asset from the program page>

**Summary:**
<2–3 sentences: what the bug is, who can exploit it, what they gain.>

**Steps to reproduce:**
1. …
2. …
3. …
(exact, copy-pasteable; include accounts/roles/config)

**Proof of concept:**
<code / requests / tx + the artifact showing impact — screenshot, log, hash>

**Impact:**
<concrete consequence: funds at risk, data exposed, service down. Quantify if you can.>

**Affected code:**
<file:line + link to the exact source>

**Suggested fix:** *(optional, but raises your signal)*
<the one-line change or control that closes it>

---

### Before you hit submit
- [ ] Re-read the program's scope + excluded list one more time.
- [ ] Confirm AI-assisted reports are permitted (disclose your method if the program asks).
- [ ] Dedup: searched disclosed reports for this exact issue.
- [ ] PoC runs clean from these steps only.
- [ ] No prod damage done; testing stayed on fork/testnet.
