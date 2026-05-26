# CCA Foundations — Glossary & Quick Reference

Alphabetical reference for the terms, flags, paths, and APIs the exam tests. Pair
it with the domain cheatsheets (`domain1.md`–`domain5.md`) and the
[master trap sheet](./master-trap-sheet.md).

> Convention: `code` = an exact literal you should memorise verbatim (path, flag,
> field, enum). Plain text = a concept.

---

## A

**Agentic loop** — The send → inspect `stop_reason` → execute tools → append
`tool_result` → repeat cycle. Terminates only on `stop_reason: "end_turn"`. (D1.1)

**`allowed-tools`** — Skill frontmatter key restricting which tools a skill may
call, e.g. `[Read, Grep]` for read-only analysis. (D3.2)

**`allowedTools`** — Agent SDK config listing tools an agent may use. Must include
`"Task"` or a coordinator physically cannot delegate to subagents. (D1.3)

**Attention dilution / "lost in the middle"** — Transformer attention is biased
toward the beginning and end of long inputs; middle content is retrieved less
reliably. Structural, **not** fixed by a larger context window. (D4.6, D5.1, D5.4)

**`"any"`** — `tool_choice` value forcing the model to call *some* tool of its
choice. Use when structured output is required but the document/tool varies. (D2.3, D4.3)

**`"auto"`** — Default `tool_choice`; the model may or may not call a tool. (D2.3, D4.3)

## B

**Batch API (Message Batches)** — Asynchronous processing: **50% cost saving**,
**≤24-hour** window, **no latency SLA**, **no multi-turn tool calling**, uses
`custom_id` to correlate request/response. For latency-tolerant single-shot jobs
only. (D4.5)

**Blocking workflow** — Something or someone is waiting (CI pre-merge, IDE
suggestions, customer chat). Always synchronous, never batch. (D4.5)

**Business error** — Request violates a rule (refund over limit, account locked).
**Not retryable**; surface the description and switch workflow. (D2.2)

## C

**Case-facts block** — A structured, verbatim-injected block of transactional
facts (IDs, amounts, dates, deadlines) that summarisation never touches. The
canonical anti-summarisation fix. (D5.1)

**Circuit breaker** — Reliability pattern: after N failures in a window, stop
calling a dependency for a cooldown period. (D1.7)

**CLAUDE.md hierarchy** — Three levels: user `~/.claude/CLAUDE.md` (personal, not
shared) → project `.claude/CLAUDE.md` or root `CLAUDE.md` (shared via git) →
directory `<subdir>/CLAUDE.md` (scopes downward only). (D3.1)

**`/compact`** — Claude Code command that reduces context usage when verbose
output fills the window. A recovery valve; trades fidelity. (D5.4)

**Confidence calibration** — Mapping raw model confidence to real accuracy using a
**labelled validation set**, per field. Raw "0.9" is meaningless without it. (D4.6, D5.5)

**`context: fork`** — Skill frontmatter that runs the skill in an isolated subagent
context; only a summary returns to the main conversation. For verbose/noisy
output. (D3.2)

**Coordinator** — The hub in hub-and-spoke orchestration. Owns decomposition, scope
partitioning, context-passing, aggregation, refinement, routing. (D1.2)

**`custom_id`** — Batch API field correlating each request with its response;
resubmit only failed `custom_id`s, not the whole batch. (D4.5)

## D

**`detected_pattern`** — A field added to each structured finding (e.g.
`"unvalidated_sql_concatenation"`) to enable systematic analysis of which
patterns get dismissed — turns a black-box bot into a measurable system. (D4.4)

**Direct execution** — Workflow mode for well-understood, narrow-scope changes
(single-file fix, mechanical edit). Contrast: plan mode. (D3.4)

**Dynamic decomposition** — Decomposition pattern using **typed** subagents
(search/doc/synth) when request structure varies. Contrast: orchestrator–worker
(uniform clones). (D1.6)

## E

**Evaluator–optimiser** — Decomposition pattern that iterates until checkable
quality criteria pass. Fails when criteria aren't objectively checkable. (D1.6)

**Explore subagent** — Isolates verbose discovery output (grep/file listings),
returning summaries to keep the main context clean. (D3.4)

**Escalation triggers (valid)** — (1) explicit human request, (2) policy gap, (3)
no meaningful progress. **Invalid:** sentiment/frustration, raw self-reported
confidence. (D5.2)

## F

**Fabrication factory** — A strict schema with all-required fields; *required*
guarantees a value is present, even if invented. Fix with nullable/`"unclear"`/
`"other"`. (D4.3)

**Few-shot examples** — 2–4 targeted examples (with reasoning) — the most effective
technique for judgement **consistency**, format consistency, and hallucination
reduction. Not 10, not 1. (D4.2)

**`fork_session`** — Spawns independent branches from a shared expensive baseline.
Use for "explore N alternatives from the same analysis." (D1.3)

## G

**Glob** — Built-in tool that searches file **paths** (what files exist), e.g.
`**/*.test.tsx`. Contrast: Grep (contents). (D2.5)

**Grep** — Built-in tool that searches file **contents** (what the code says), e.g.
`formatDate(`. Contrast: Glob (paths). (D2.5)

## H

**Hook (PreToolUse / PostToolUse)** — Agent SDK enforcement. **PreToolUse** fires
before a tool runs (gates, authorisation, prior-state capture). **PostToolUse**
fires after (normalise, redact, truncate, enrich). The deterministic answer for
high-stakes scenarios. *Claude Code harness feature — not an Anthropic API agent-
design lever.* (D1.5)

**Hub-and-spoke** — The only valid multi-agent topology. All communication routes
through the coordinator; subagents never talk to each other. (D1.2)

## I

**Idempotency key** — A UUID/hash of `{operation + customer + amount}` generated on
the **first** attempt and reused on retries so server-side dedup prevents
double-charging. (D1.7)

**`isError`** — MCP tool-result flag. `isError: true` = the tool couldn't look
(access failure). `isError: false` + empty = the tool looked and found nothing
(valid empty result). Conflating them is the canonical Domain 2 trap. (D2.2, D5.3)

**Interview pattern** — Have Claude ask clarifying questions before implementing;
for unfamiliar domains where you'd miss edge cases. (D3.5)

## J

**`--json-schema`** — Claude Code CLI flag constraining JSON output to a shape for
reliable downstream parsing; pair with `--output-format json`. (D3.6)

## M

**Manifest** — A known-location file each agent writes structured state to at
checkpoints; the **source of truth** for crash/exhaustion recovery, not the
conversation history. (D5.4)

**MCP (Model Context Protocol)** — Standard for connecting agents to external
systems. **Tools** = actions; **Resources** = readable content (catalogues,
schemas). (D2.4)

**`.mcp.json`** — Project-level MCP config (repo root, committed/shared). User-level
is `~/.claude.json` (personal). Keep secrets out via `${VAR}` expansion. (D2.4)

**`/memory`** — Claude Code command listing currently loaded memory files. A
**diagnostic** tool, not a fix — it can't conjure a file that isn't on the machine. (D3.1)

**Multi-instance review** — Use a fresh, independent Claude session for review; a
session reviewing its own output has motivated reasoning. (D3.6, D4.6)

## N

**Nullable / optional field** — Schema technique letting the model return null when
the source genuinely lacks the information — the anti-fabrication fix for source
gaps (retry can't recover absent data). (D4.3, D4.4)

## O

**Orchestrator–worker** — Decomposition with uniform worker clones differentiated
only by prompt-supplied scope. Contrast: dynamic decomposition (typed roles). (D1.6)

**`--output-format json`** — Claude Code CLI flag producing JSON instead of prose
for automation. (D3.6)

## P

**`-p` (print mode)** — Runs Claude Code non-interactively. Without it, CI jobs
hang waiting for input. The fix for "the pipeline hangs after the banner." (D3.6)

**Path-specific rules** — Files in `.claude/rules/` with `paths:` glob frontmatter;
load only when editing matching files. For standards spread across the codebase by
pattern. (D3.3)

**Permission error** — 401/403/missing scope. Not retryable by this agent; escalate
or request elevated credentials. (D2.2)

**Plan mode** — Workflow mode for large/architectural/multi-approach changes where
decisions remain. Hybrid "plan then direct-execute" is valid. (D3.4)

**Provenance (claim-source mapping)** — Five fields per finding: claim, source URL,
document name, relevant excerpt, publication date. Preserved (not flattened) across
agents. (D5.6)

## R

**Resources (MCP)** — Readable content (catalogues, schemas, summaries) the agent
reads once instead of making exploratory tool calls. (D2.4)

**Retry classification** — Transient → backoff + retry (same input). Validation →
retry after fixing input. Business/permission → don't retry. Blanket retry is the
anti-pattern. (D1.7, D2.2)

## S

**Scaled score** — Exam scores 100–1000; **pass at 720**. Scored across 4 of 6
scenarios. (all domains)

**Scratchpad file** — Write key findings to a file during long exploration; survives
compaction and crashes. (D5.4)

**Skill** — On-demand workflow in `.claude/skills/<name>/SKILL.md` (project) or
`~/.claude/skills/` (personal). Loaded only when invoked. Contrast: CLAUDE.md
(always loaded). (D3.2)

**`stop_reason`** — The **only** authoritative loop-termination signal. `"tool_use"`
→ continue; `"end_turn"` → done. Never parse text or rely on an iteration cap. (D1.1)

**Stratified sampling** — Sample across document types, fields, and confidence bands
— including **high-confidence** extractions post-deployment — to catch novel error
patterns. (D5.5)

**Structured error** — Error envelope with failure type + what was attempted +
partial results + suggested alternatives, so the model can recover. (D5.3)

## T

**Task tool** — The only mechanism to spawn subagents; requires `"Task"` in
`allowedTools`. (D1.3)

**`tool_choice`** — Controls tool calling: `"auto"`, `"any"`, or
`{"type": "tool", "name": "X"}` (force a specific tool — the fix for "must do X
first," not a prompt instruction). (D2.3, D4.3)

**Tool description (5 components)** — Purpose, input contract, example queries,
edge cases/limits, explicit boundaries vs similar tools. Descriptions ARE the
routing layer — expand them first to fix misrouting. (D2.1)

**Tool overload** — Reliability degrades past ~7–10 tools; **4–5 per agent** is the
sweet spot. Scope tools to roles. (D2.3)

**`tool_result`** — A `role: "user"` block with `tool_use_id`, `content`, and
optional `is_error`. One per `tool_use_id`, all in a single user turn. (D1.1)

**Transient error** — 429/503/network blip. Retry with exponential backoff +
**jitter**, capped. (D1.7, D2.2)

## V

**Validation error** — Wrong format / missing field / malformed ID. Retryable
**after correcting the input**. (D2.2)

**Validation-retry loop** — Send back original document + failed output + specific
error message so the model self-corrects. Fixes **output errors**, not source gaps. (D4.4)

**`${VAR}` expansion** — Credential handling in `.mcp.json`: reference
`"${JIRA_API_TOKEN}"`, never the literal secret. Keeps shared config + personal
secrets. Rotate any leaked token. (D2.4)
