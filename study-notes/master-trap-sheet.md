# CCA Foundations — Master Trap Sheet

One page. Every distractor pattern from `domain1.md`–`domain5.md`, consolidated.
**Read this the morning of the exam.** Pass cut: **720/1000**.

> How to use it: when an answer option matches a 🔴 line, eliminate it. When it
> matches a ✅ line, it's probably correct. When two options survive, fall back to
> the three global tie-breakers below.

---

## The three tie-breakers that decide most questions

1. **Stakes → mechanism.** Financial / security / compliance / safety failure →
   **deterministic** (hook, prerequisite gate, `tool_choice`). Bad-but-recoverable
   UX → **probabilistic** (prompt, few-shot). Never answer "stronger prompt" for a
   high-stakes guarantee.
2. **Cheapest layer that fixes the root cause.** Edit text before adding
   infrastructure. Tool description before classifier. `${VAR}` before relocating a
   file. Few-shot before a preprocessing model call. Don't over-engineer.
3. **Right idea, right layer.** Ask which layer the question tests — API agent
   design (`tool_choice`, tools, tool-result shape) vs Claude Code harness (hooks,
   CLAUDE.md, `-p`) vs MCP config (`.mcp.json`, `${VAR}`, resources) vs schema/
   prompt vs history management. Most wrong answers are the right concept at the
   wrong layer.

---

## 🔴 Always-FALSE statements (eliminate on sight)

These are factually wrong and recur as distractors across domains:

- "Claude Code builds per-user preference models over time through interaction."
- "Claude Code caches CLAUDE.md across sessions." (It reads fresh each session.)
- "A larger context window solves attention dilution / lost-in-the-middle."
- "More precise prose fixes interpretation after 3 failed iterations."
- "Self-reported model confidence is reliably calibrated."
- "Sentiment / customer frustration is a reliable proxy for case complexity."
- "tool_use guarantees semantically correct output." (Only syntactic validity.)
- "Batch API supports multi-turn tool calling."
- "Increasing temperature improves consistency / specificity / retention."

## 🔴 Read-the-constraint triggers

- **"Stakeholders have rejected X"** → eliminate every option that does X
  (filtering, categorising, suppressing — categorisation IS filtering).
- **"Without modifying the third-party tool"** → must be a wrapper (PostToolUse
  hook, wrapper tool), never internal modification.
- **"Must happen for everyone / consistently / automatically"** → configuration in
  the right file, not a command someone remembers to run.
- **"Must do X first" (hard requirement)** → `tool_choice: {"type":"tool","name":"X"}`,
  not a prompt instruction.

---

## Domain 1 — Agentic Architecture & Orchestration (27%)

| 🔴 Reject | ✅ Lean toward |
|---|---|
| Terminate on text like "Done." / iteration cap as primary stop | `stop_reason`: `"tool_use"` → continue, `"end_turn"` → done |
| Stronger system prompt / few-shot / specialised subagent for a high-stakes gate | PreToolUse hook / prerequisite gate |
| Forward the full transcript to the human reviewer | Self-contained handoff: summary + root cause + recommended action |
| Subagent A passes results directly to subagent B | All communication routes through the coordinator (hub-and-spoke) |
| Retry on every error with the same delay | Classify transient / permanent / logical; backoff + jitter for transient |
| Catch errors and return an empty string silently | Surface errors to the model when it can act on them |
| Refactor a working single-agent loop to multi-agent | Keep single-agent unless it genuinely can't do the job |
| (won't delegate) blame the model | Add `"Task"` to the coordinator's `allowedTools` |
| (missing topics) blame the subagent | Coordinator decomposition too narrow |
| (duplicate work) | Coordinator scope partitioning sloppy |
| (missing citations) | Context-passing destroyed structured metadata |
| Double-charge on retry | Idempotency key generated on first attempt |
| Prompt the model not to hang | Bounded per-tool timeout + fallback |

## Domain 2 — Tool Design & MCP Integration (18%)

| 🔴 Reject | ✅ Lean toward |
|---|---|
| Train a routing classifier (for misrouting) | Expand tool descriptions (purpose, contract, examples, boundaries) |
| Merge two tools / rename a generic tool | Split "or"/"depending on" tools into purpose-specific ones |
| Add more routing rules to the system prompt | Audit the prompt for keyword conflicts that override descriptions |
| Return `[]` for both "not found" and "DB unreachable" | `isError: false` + empty for valid-no-data; `isError: true` for access failure |
| Increase retry count for an empty-result-as-error case | Distinguish access failure from valid empty result |
| Stronger prompt to force a mandatory first tool | `tool_choice: {"type":"tool","name":"X"}` first turn, `"auto"` after |
| Give the synthesis agent full `web_search` | Scoped `verify_fact` tool with explicit fallback to coordinator |
| Generic `fetch_url` / `run_sql` / `send_email` | Constrained `load_document` / `query_orders` / `send_customer_notification` |
| Move `.mcp.json` to `~/.claude.json` / gitignore it (credential leak) | `${VAR}` expansion in committed `.mcp.json`; rotate the token |
| Build a custom MCP server because "we have specific workflows" | Evaluate community server first; fork or post-process |
| Read every file upfront | Grep for entry points, Read selectively |
| Glob first when the task is content-seeded | Grep content first, derive names, Glob related paths |
| Use a `PreToolUse` hook on an **API-design** question | Hooks are a Claude Code harness feature — wrong layer here |

## Domain 3 — Claude Code Configuration & Workflows (20%)

| 🔴 Reject | ✅ Lean toward |
|---|---|
| `/memory reload` / restart (divergent-dev bug) | Conventions sat in user-level `~/.claude/CLAUDE.md`; move to `.claude/CLAUDE.md` and commit |
| One CLAUDE.md per directory containing tests | Path-specific rule with `paths: ["**/*.test.*"]` |
| A `/migrate` slash command everyone must invoke | Ambient config (path rules / CLAUDE.md); standards aren't opt-in |
| Edit the team `/review` skill for personal use | Personal skill in `~/.claude/skills/` with a new name |
| Compress CLAUDE.md by deleting examples | Split into `.claude/rules/` with `paths:` frontmatter |
| Direct execution for an unfamiliar 80-file refactor | Plan mode (decisions remain) |
| Plan mode for a one-line null-check fix | Direct execution (known thing to do) |
| Rewrite prose after 3 failed iterations | Switch modality: concrete input/output examples |
| Increase the CI timeout / redirect /dev/null | Add `-p` (print mode) |
| Reuse the code-gen session for review | Fresh, independent review session |
| Remove the noisy review bot | Incremental review context: prior findings + "only new issues" |

## Domain 4 — Prompt Engineering & Structured Output (20%)

| 🔴 Reject | ✅ Lean toward |
|---|---|
| "Be conservative" / "only high-confidence" | Categorical criteria: flag X, report Y, skip Z |
| Lower the confidence threshold on a noisy category | Disable it temporarily, fix its prompt, re-enable |
| Five-level severity rubric in prose | Severity levels anchored with concrete code examples |
| Add more instructions for inconsistent output | 2–4 few-shot examples with reasoning |
| Add 10 diverse examples | 2–4 targeted on the ambiguous cases |
| tool_use with all fields required | Nullable / `"unclear"` / `"other"` fields (anti-fabrication) |
| "Do not fabricate" while field stays required | Make the field nullable |
| tool_use to ensure line items sum | Extract `calculated_total` + `stated_total`, flag mismatch |
| `tool_choice: "auto"` when output is required | `"any"` (some tool) or named tool (specific) |
| Named tool for documents of unknown type | `"any"` so the model picks the fitting tool |
| Validation-retry to recover fields absent from source | Nullable field (retry can't conjure absent data) |
| Increase retry limit 3 → 10 | More retries = more fabrications, not accuracy |
| "Switch everything to Batch" / batch the CI bot | Mixed strategy: batch latency-tolerant, keep blocking synchronous |
| Batch a multi-turn agent | Synchronous always (batch has no multi-turn tools) |
| Larger context window for attention dilution | Per-file pass + cross-file integration pass |
| Threshold 0.9 "to ensure quality" | Calibrate on a labelled validation set |
| Model reviews its own output | Independent fresh instance |

## Domain 5 — Context Management & Reliability (15%)

| 🔴 Reject | ✅ Lean toward |
|---|---|
| Progressive summarisation across the conversation | Persistent case-facts block injected verbatim |
| Drop oldest turns to fit the limit | Stateless API needs full history; cache the stable prefix |
| Pass full tool responses for fidelity | Trim to needed fields before they hit context |
| Return verbose subagent reasoning to the orchestrator | Upstream subagents return structured key facts + citations |
| Put the summary at the end | Key findings at the beginning + section headers |
| Resolve first, escalate later (explicit human request) | Escalate immediately on explicit human request |
| Escalate because the customer is frustrated | Offer resolution; escalate only if they reiterate |
| Pick most-recent/active account on ambiguous match | Ask for an additional identifier |
| Return `{"results": [], "status": "ok"}` on failure | Structured error: type + attempt + partial results + alternatives |
| Kill the whole pipeline on one subagent failure | Preserve successes; annotate the coverage gap |
| Always retry empty results | Distinguish access failure (retry) from valid empty (the answer) |
| Re-run exploration from scratch / bigger window | Scratchpad files, subagent delegation, summary injection, manifest |
| "97% aggregate accuracy, automate" | Validate by document type AND field segment first |
| Sample only low-confidence extractions | Stratified sampling incl. high-confidence band |
| Document-level confidence for routing | Per-field confidence, calibrated |
| Average / silently pick conflicting sources | Annotate both values with full attribution; let the consumer decide |
| Render everything as uniform bullets | Match format to content: tables / prose / lists |
| Cite sources in a separate appendix | Inline structured claim-source bundles (survive synthesis) |

---

## 30-second decision trees

**Inconsistent model output?**
vague (false-pos AND false-neg) → explicit criteria · edge-case judgement → few-shot
with reasoning · format mismatch → few-shot of the format · composition fails →
few-shot of the composition · prose failed 3× → switch to examples.

**Prompt-level or architectural?**
deterministic/compliance → architectural (hook / prerequisite / `tool_choice` /
interface constraint) · self-review bias → independent instance · isolate verbose
output → `context: fork` / Explore subagent · probabilistic quality → prompt-level.

**Which config mechanism?**
every interaction → project CLAUDE.md · pattern of files across the repo → path
rules · one subdirectory → directory CLAUDE.md · on-demand workflow → skill ·
personal → same but `~/.claude/` · for CI → `.claude/CLAUDE.md`.

**Extraction failure?**
malformed JSON → tool_use schema · field absent from source → nullable · ambiguous
category → `"unclear"`/`"other"` · format wrong → validation-retry · doesn't sum →
calculated vs stated · inconsistent source → `conflict_detected`.
