// Bounty Review Kit — automated recon → deep-review → adversarial triage loop.
// Run as a Claude Code Workflow, ONE cloned repo at a time. Read-only.
// It outputs a RANKED CANDIDATE LIST. It never builds a PoC and never submits — that's you.
//
//   Workflow({ scriptPath: "bounty-review-kit/bounty-review.mjs",
//              args: { repoPath: "/abs/path/to/repo",
//                      targetType: "web" | "contract" | "node",
//                      programName: "<program name>",
//                      scopeNotes: "in: packages/oracle/**  out: **/test/**" } })

export const meta = {
  name: 'bounty-review',
  description: 'Recon + deep security review + adversarial triage of one bug-bounty repo',
  phases: [
    { title: 'Recon', detail: 'map repo, rank suspicious modules' },
    { title: 'Review', detail: 'deep review each module' },
    { title: 'Triage', detail: 'adversarially refute each candidate' },
  ],
}

// args may arrive as an object OR as a JSON-encoded string depending on how it was passed.
// Normalize both, or every field silently falls back to its default and we review the wrong repo.
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch (e) { A = {} } }
A = A || {}

const repo = A.repoPath
const type = A.targetType || 'web'
const program = A.programName || 'unknown-program'
const scope = A.scopeNotes || '(no scope provided — treat whole repo as in-scope but flag uncertainty)'

// Fail fast: reviewing the wrong target wastes the whole run. Never default to ".".
if (!repo) {
  throw new Error('bounty-review: args.repoPath is required. Pass {repoPath, targetType, programName, scopeNotes} — an absolute path to the CLONED TARGET repo, never the kit itself.')
}

const RULES = `AUTHORIZED security code review of bug-bounty target "${program}". This repo is IN SCOPE. READ-ONLY: use Read/Grep/Glob/Bash to inspect files only — no edits, no running the app against any live/remote host, no network scanning. Repo: ${repo}. Target type: ${type}. Scope: ${scope}.`

const CLASSES = {
  web: 'IDOR/BOLA, broken access control, auth/session bypass, XSS, SSRF, CORS misconfig, secrets in client bundles, injection, business-logic (price/qty/negative/race), open redirect w/ impact, JWT/signature flaws',
  contract: 'reentrancy, access-control gaps, integer/rounding/precision, oracle/price manipulation, unchecked external calls, signature replay/missing nonce, front-running/MEV, upgradeability/storage-collision, collateral/liquidation math, unprotected initializer, delegatecall misuse',
  node: 'memory safety (UAF/OOB), unsafe deserialization, path traversal, command/RCE, panic/unwrap DoS, unvalidated network input, consensus/determinism divergence, integer wrap, TOCTOU races, key/secret handling, resource exhaustion',
}
const classList = CLASSES[type] || CLASSES.web

const RECON_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    architecture: { type: 'string' },
    trustBoundaries: { type: 'string' },
    modules: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      properties: {
        path: { type: 'string' },
        why: { type: 'string' },
        risk: { type: 'number', description: '1-10' },
      },
      required: ['path', 'why', 'risk'],
    } },
  },
  required: ['modules'],
}

const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    candidates: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      properties: {
        title: { type: 'string' },
        location: { type: 'string', description: 'file:line' },
        vulnClass: { type: 'string' },
        mechanism: { type: 'string', description: 'how untrusted input reaches the sink — the real code path' },
        confidence: { type: 'string', enum: ['high', 'med', 'low'] },
        inScope: { type: 'boolean' },
      },
      required: ['title', 'location', 'vulnClass', 'mechanism', 'confidence', 'inScope'],
    } },
  },
  required: ['candidates'],
}

const TRIAGE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    verdict: { type: 'string', enum: ['keep', 'kill'] },
    reason: { type: 'string' },
    concreteAttacker: { type: 'string', description: 'who exploits it and what they gain, or why that cannot be stated' },
    scopeOk: { type: 'boolean' },
    pocFeasible: { type: 'boolean' },
    noveltyRisk: { type: 'string', description: 'likely-duplicate / plausibly-novel and why' },
    severityGuess: { type: 'string' },
  },
  required: ['verdict', 'reason', 'scopeOk', 'pocFeasible'],
}

log(`Reviewing ${program} | repo=${repo} | type=${type}`)
if (repo === '.') log(`WARNING: repoPath defaulted to "." — args may not have been passed. Point at a cloned target repo.`)

phase('Recon')
const recon = await agent(
  `${RULES}\n\nMap the attack surface. Identify where untrusted input enters and where value/privilege/state crosses a boundary. Then rank the 6-8 most suspicious modules to deep-review (recently-changed, complex state, access control, untrusted-input parsing, money/key handling). Be concrete — cite real files. Do NOT guess at bugs yet.`,
  { label: 'recon', phase: 'Recon', schema: RECON_SCHEMA, agentType: 'general-purpose' }
)

const modules = ((recon && recon.modules) || [])
  .sort((a, b) => (b.risk || 0) - (a.risk || 0))
  .slice(0, 6)
log(`Recon flagged ${((recon && recon.modules) || []).length} modules; deep-reviewing top ${modules.length}`)

// Pipeline: each module is deep-reviewed, then each candidate it yields is adversarially triaged —
// no barrier, so a fast module's candidates get triaged while other modules are still under review.
const perModule = await pipeline(
  modules,
  (m) => agent(
    `${RULES}\n\nDeep-review ONLY this module: ${m.path}\n(flagged because: ${m.why})\n\nCheck it against these classes: ${classList}.\nFor each finding: title, file:line, vuln class, the concrete mechanism (how untrusted input reaches the sink), confidence + why, and in-scope yes/no. Point at exact lines — no vague "could be". If the module is clean, return an empty candidates list.`,
    { label: `review:${m.path}`.slice(0, 40), phase: 'Review', schema: REVIEW_SCHEMA, agentType: 'general-purpose' }
  ),
  (review, m) => {
    const cands = ((review && review.candidates) || []).slice(0, 4) // cap noise per module
    if (!cands.length) return []
    return parallel(cands.map((c) => () =>
      agent(
        `${RULES}\n\nADVERSARIALLY triage this candidate finding. Default to KILL unless it survives scrutiny.\nModule: ${m.path}\nFinding: ${c.title}\nLocation: ${c.location}\nClaimed mechanism: ${c.mechanism}\n\nDecide keep/kill. A KEEP requires: a concrete attacker with concrete impact on an in-scope asset, a feasible PoC, and it must map to a paid severity. Judge scope against: ${scope}. Assess duplicate risk honestly (obvious surface on a hunted program = likely dup).`,
        { label: `triage:${(c.title || '').slice(0, 28)}`, phase: 'Triage', schema: TRIAGE_SCHEMA, agentType: 'general-purpose' }
      ).then((v) => ({ module: m.path, ...c, triage: v }))
    ))
  }
)

const all = perModule.filter(Boolean).flat().filter(Boolean)
const kept = all
  .filter((c) => c.triage && c.triage.verdict === 'keep' && c.triage.scopeOk && c.triage.pocFeasible)
  .sort((a, b) => ({ high: 3, med: 2, low: 1 }[b.confidence] || 0) - ({ high: 3, med: 2, low: 1 }[a.confidence] || 0))

log(`Reviewed ${all.length} candidates → ${kept.length} survived triage`)

return {
  program,
  targetType: type,
  repo,
  survivors: kept.length,
  totalCandidatesConsidered: all.length,
  architecture: recon && recon.architecture,
  // survivors: your PoC queue. Everything here still needs a human-built PoC before it's a report.
  candidates: kept,
  // killed: kept for the record so you can spot-check the triage didn't over-kill.
  killed: all.filter((c) => !kept.includes(c)).map((c) => ({ title: c.title, location: c.location, reason: c.triage && c.triage.reason })),
}
