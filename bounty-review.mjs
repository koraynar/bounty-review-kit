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
    { title: 'Dedup', detail: 'cluster candidates by root cause' },
    { title: 'Triage', detail: 'adversarially refute each root cause once' },
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

const DEDUP_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    clusters: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      properties: {
        rootCause: { type: 'string', description: 'the single code defect one patch would fix' },
        memberIds: { type: 'array', items: { type: 'string' } },
        primaryId: { type: 'string', description: 'member with the strongest, best-evidenced write-up' },
        mergedTitle: { type: 'string' },
        mergedMechanism: { type: 'string', description: 'the defect at its strongest, folding in evidence from every member' },
      },
      required: ['rootCause', 'memberIds', 'primaryId', 'mergedTitle', 'mergedMechanism'],
    } },
  },
  required: ['clusters'],
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

// BARRIER (deliberate): every module must finish before dedup runs, because clustering by root
// cause is the one step here that genuinely needs the whole candidate set at once. Without it,
// independent triage agents judge duplicates of the same defect in isolation and disagree —
// observed on a legacy oracle-connector repo, where one defect was reported at two adjacent
// lines of the same file and came back both "keep" and "kill".
phase('Review')
const reviews = await parallel(modules.map((m) => () =>
  agent(
    `${RULES}\n\nDeep-review ONLY this module: ${m.path}\n(flagged because: ${m.why})\n\nCheck it against these classes: ${classList}.\nFor each finding: title, file:line, vuln class, the concrete mechanism (how untrusted input reaches the sink), confidence + why, and in-scope yes/no. Point at exact lines — no vague "could be". If the module is clean, return an empty candidates list.`,
    { label: `review:${m.path}`.slice(0, 40), phase: 'Review', schema: REVIEW_SCHEMA, agentType: 'general-purpose' }
  ).then((r) => ({ module: m.path, candidates: ((r && r.candidates) || []).slice(0, 4) })) // cap noise per module
))

const all = []
for (const r of reviews.filter(Boolean)) {
  for (const c of r.candidates) all.push({ id: `c${all.length}`, module: r.module, ...c })
}
log(`Deep review yielded ${all.length} raw candidates across ${reviews.filter(Boolean).length} modules`)

phase('Dedup')
let clusters = []
if (all.length > 1) {
  const roster = all.map((c) =>
    `${c.id} | ${c.module} | ${c.location} | ${c.vulnClass} | ${c.title}\n      mechanism: ${c.mechanism}`
  ).join('\n')
  const dd = await agent(
    `${RULES}\n\nThese candidate findings came from independent per-module reviews of the SAME repo. Different modules routinely surface the same underlying defect from different entry points, and one file is often reported twice at adjacent lines.\n\nGroup them by ROOT CAUSE — the single code defect that one patch would fix — NOT by file, line, or vuln-class label. Two entries at different locations belong in one cluster if fixing one fixes both. Two entries in the same file belong in SEPARATE clusters if they are genuinely independent defects. Read the code to decide; do not cluster on title similarity alone.\n\nFor each cluster set primaryId to the member with the strongest, best-evidenced write-up, and write mergedTitle + mergedMechanism stating the defect at its strongest — fold in the best evidence from every member, so nothing is lost by discarding the weaker write-ups.\n\nEvery id must appear in exactly one cluster. A finding with no duplicate is a cluster of one.\n\n${roster}`,
    { label: 'dedup', phase: 'Dedup', schema: DEDUP_SCHEMA, agentType: 'general-purpose' }
  )
  clusters = (dd && dd.clusters) || []
}

// Repair pass. Dedup is the only stage that can silently lose a finding, so treat its output as
// untrusted: drop unknown ids, keep only the first claim on a double-claimed id, and carry any
// unassigned candidate through as its own cluster. Findings may be merged — never dropped.
const byId = new Map(all.map((c) => [c.id, c]))
const claimed = new Set()
const groups = []
for (const cl of clusters) {
  const ids = (cl.memberIds || []).filter((id) => byId.has(id) && !claimed.has(id))
  if (!ids.length) continue
  ids.forEach((id) => claimed.add(id))
  const primary = byId.get(ids.includes(cl.primaryId) ? cl.primaryId : ids[0])
  groups.push({
    rootCause: cl.rootCause || primary.title,
    title: cl.mergedTitle || primary.title,
    mechanism: cl.mergedMechanism || primary.mechanism,
    primary,
    members: ids.map((id) => byId.get(id)),
  })
}
const orphans = all.filter((c) => !claimed.has(c.id))
for (const c of orphans) {
  groups.push({ rootCause: c.title, title: c.title, mechanism: c.mechanism, primary: c, members: [c] })
}
if (orphans.length) log(`dedup left ${orphans.length} candidate(s) unassigned — carried through as singletons, not dropped`)
log(`${all.length} candidates → ${groups.length} distinct root causes (${all.length - groups.length} duplicate write-ups merged)`)

phase('Triage')
const triaged = await parallel(groups.map((g) => () =>
  agent(
    `${RULES}\n\nADVERSARIALLY triage this finding. Default to KILL unless it survives scrutiny.\nRoot cause: ${g.rootCause}\nFinding: ${g.title}\nPrimary location: ${g.primary.location} (module ${g.primary.module})\nMechanism: ${g.mechanism}\n${g.members.length > 1 ? `\nIndependent reviewers surfaced this same defect at ${g.members.length} locations: ${g.members.map((m) => m.location).join(', ')}. Treat that as corroboration that the defect is REAL — not as evidence that it is more severe, and not as a reason to lower your bar.\n` : ''}\nDecide keep/kill. A KEEP requires: a concrete attacker with concrete impact on an in-scope asset, a feasible PoC, and it must map to a paid severity. Judge scope against: ${scope}. Assess duplicate risk honestly (obvious surface on a hunted program = likely dup). If the write-up's stated root cause is wrong even though the bug is real, say so in reason — a triager can reject on that alone.`,
    { label: `triage:${(g.title || '').slice(0, 28)}`, phase: 'Triage', schema: TRIAGE_SCHEMA, agentType: 'general-purpose' }
  ).then((v) => ({ ...g, triage: v }))
))

const results = triaged.filter(Boolean)
const RANK = { high: 3, med: 2, low: 1 }
const kept = results
  .filter((g) => g.triage && g.triage.verdict === 'keep' && g.triage.scopeOk && g.triage.pocFeasible)
  .sort((a, b) => (RANK[b.primary.confidence] || 0) - (RANK[a.primary.confidence] || 0))

log(`Triaged ${results.length} root causes → ${kept.length} survived`)

return {
  program,
  targetType: type,
  repo,
  survivors: kept.length,
  totalCandidatesConsidered: all.length,
  distinctRootCauses: groups.length,
  duplicatesMerged: all.length - groups.length,
  architecture: recon && recon.architecture,
  // survivors: your PoC queue. Everything here still needs a human-built PoC before it's a report.
  candidates: kept.map((g) => ({
    title: g.title,
    rootCause: g.rootCause,
    location: g.primary.location,
    module: g.primary.module,
    vulnClass: g.primary.vulnClass,
    mechanism: g.mechanism,
    confidence: g.primary.confidence,
    occurrences: g.members.length,
    alsoSurfacedAt: g.members.filter((m) => m.id !== g.primary.id).map((m) => `${m.location} (${m.module})`),
    triage: g.triage,
  })),
  // killed: kept for the record so you can spot-check the triage didn't over-kill.
  killed: results.filter((g) => !kept.includes(g)).map((g) => ({
    title: g.title,
    location: g.primary.location,
    occurrences: g.members.length,
    reason: g.triage && g.triage.reason,
  })),
}
