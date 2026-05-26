# CCA Foundations — Scenario Guide

The exam is **scenario-based**. From a fixed set of **6 scenarios**, **4 are
presented at random** on your exam and you're scored across them. Each scenario
frames a realistic production context; the questions under it test the domains
that scenario naturally touches.

This guide maps each scenario to its **primary domains**, the **patterns most
likely to be tested**, and **where to study** (cheatsheet sections + flashcard
tags). Scenario descriptions and primary-domain assignments are taken from the
official exam guide; the patterns are drawn from the domain cheatsheets.

> Why this matters: recognising "this is the *Multi-Agent Research* scenario"
> primes you for the failure-tracing, context-passing, and provenance questions
> that cluster there — and warns you off the distractors that recur in it.

---

## Scenario 1 — Customer Support Resolution Agent

**Context.** A support agent built on the Agent SDK handling high-ambiguity
requests (returns, billing disputes, account issues), with backend MCP tools
`get_customer`, `lookup_order`, `process_refund`, `escalate_to_human`. Target:
80%+ first-contact resolution while knowing when to escalate.

**Primary domains:** 1 (Agentic Architecture), 2 (Tool Design & MCP), 5 (Context & Reliability).

**Patterns that cluster here**
- **High-stakes enforcement** → PreToolUse hook / prerequisite gate (refund limits,
  identity verification before `process_refund`). Never "stronger prompt." (D1.4–1.5)
- **Escalation logic** → escalate immediately on an *explicit* human request; offer
  resolution first on *frustration*; never escalate on sentiment or raw confidence. (D5.2)
- **Ambiguous customer match** → ask for an additional identifier, never a heuristic. (D5.2)
- **Persistent case-facts block** so refund amounts/order IDs/deadlines survive
  summarisation across a long conversation. (D5.1)
- **Human-handoff payload** → summary + root cause + recommended action (not the
  transcript). (D1.4)
- **Multi-concern requests** ("refund #1234 AND reship #5678") → decompose; few-shot
  the composition. (D1.4, flashcards Card 3)
- **Idempotency keys** so a retried `process_refund` can't double-charge. (D1.7)

**Study:** `domain1.md` §1.4–1.7 · `domain5.md` §5.1–5.3 · `domain2.md` §2.2 ·
flashcard tags `CCA::D1`, `CCA::D5`.

---

## Scenario 2 — Code Generation with Claude Code

**Context.** Using Claude Code to accelerate development (generation, refactoring,
debugging, documentation), integrated via custom slash commands and CLAUDE.md, with
plan mode vs direct execution decisions.

**Primary domains:** 3 (Claude Code Config & Workflows), 5 (Context & Reliability).

**Patterns that cluster here**
- **CLAUDE.md hierarchy & the divergent-developers bug** → conventions stuck in
  user-level `~/.claude/CLAUDE.md`; move to project `.claude/CLAUDE.md`. (D3.1)
- **Skills vs CLAUDE.md vs path-rules** → on-demand workflow vs always-loaded
  standard vs pattern-of-files. (D3.2–3.3)
- **Plan mode vs direct execution** → decisions remaining vs known thing to do;
  the plan-then-execute hybrid. (D3.4)
- **Iterative refinement** → after 3 failed prose iterations, switch to concrete
  input/output examples; interview pattern for unfamiliar domains. (D3.5)
- **Context degradation in long sessions** → scratchpad files, Explore subagent,
  `/compact`. (D5.4)

**Study:** `domain3.md` §3.1–3.5 · `domain5.md` §5.4 · flashcard tag `CCA::D3`.

---

## Scenario 3 — Multi-Agent Research System

**Context.** A coordinator delegating to specialised subagents (web search,
document analysis, synthesis, report generation) to produce comprehensive, cited
reports.

**Primary domains:** 1 (Agentic Architecture), 2 (Tool Design & MCP), 5 (Context & Reliability).

**Patterns that cluster here**
- **Hub-and-spoke topology** → subagents never talk to each other. (D1.2)
- **Failure tracing** → missing topics = decomposition too narrow; duplicate work =
  partitioning; shallow = subagent prompts/budgets; missing citations =
  context-passing. (D1.2)
- **Context passing** → complete findings + structured metadata, goal-oriented
  prompts. (D1.3)
- **Parallel `Task` spawning** vs `fork_session` from a shared baseline. (D1.3)
- **`allowedTools` must include `"Task"`** for delegation. (D1.3)
- **Tool scoping** → synthesis agent has no `web_search`; scoped `verify_fact` for
  the 85% simple checks. (D2.3)
- **Structured error propagation** → subagent local recovery; coordinator preserves
  partial results, annotates coverage gaps; access failure ≠ valid empty. (D5.3, D2.2)
- **Information provenance** → claim + URL + doc + excerpt + date travels with every
  finding; surface conflicts, never average; dates distinguish trends. (D5.6)

**Study:** `domain1.md` §1.2–1.3 · `domain2.md` §2.2–2.3 · `domain5.md` §5.3, §5.6 ·
flashcard tags `CCA::D1`, `CCA::D2`, `CCA::D5`.

---

## Scenario 4 — Developer Productivity with Claude

**Context.** Agent SDK tools that help engineers explore unfamiliar codebases,
understand legacy systems, generate boilerplate, and automate repetitive tasks —
using the built-in tools (Read, Write, Bash, Grep, Glob) and MCP servers.

**Primary domains:** 2 (Tool Design & MCP), 3 (Claude Code Config & Workflows), 1 (Agentic Architecture).

**Patterns that cluster here**
- **Grep vs Glob** → contents vs paths; the Grep→Glob discovery sequence. (D2.5)
- **Incremental codebase understanding** → Grep entry points, Read selectively; never
  read everything upfront. (D2.5)
- **Edit-failure escalation** → expand the anchor, then Read+Write. (D2.5)
- **MCP server integration** → `.mcp.json` vs `~/.claude.json`; `${VAR}` credentials;
  resources for catalogue data; community-server-first. (D2.4)
- **MCP tool losing to a built-in** → enhance the MCP tool's description. (D2.4)
- **Codebase-exploration context management** → scratchpad/subagent/summary-injection;
  manifest for crash recovery. (D5.4)
- **Session resumption & forking** → `--resume <session-name>` to continue a named
  session; `fork_session` for divergent branches from a shared baseline. (exam guide TS 1.7)

**Study:** `domain2.md` §2.4–2.5 · `domain3.md` §3.4 · `domain5.md` §5.4 ·
flashcard tags `CCA::D2`, `CCA::D3`.

---

## Scenario 5 — Claude Code for Continuous Integration

**Context.** Claude Code integrated into a CI/CD pipeline running automated code
reviews, generating test cases, and giving PR feedback — designed to be actionable
and to minimise false positives.

**Primary domains:** 3 (Claude Code Config & Workflows), 4 (Prompt Engineering & Structured Output).

**Patterns that cluster here**
- **`-p` (print mode)** → the fix for a hanging CI job. (D3.6)
- **`--output-format json` + `--json-schema`** → machine-parseable findings for
  inline PR comments. (D3.6)
- **Review session isolation** → a fresh instance reviews; the code-gen session has
  motivated reasoning. (D3.6, D4.6)
- **Incremental review context** → pass prior findings, report only new/unaddressed
  issues, to beat comment fatigue. (D3.6)
- **CLAUDE.md for CI** → test-value criteria + fixtures to avoid boilerplate tests. (D3.6)
- **Categorical criteria, not confidence adjectives**; disable a noisy category to
  restore trust; severity anchored with code examples. (D4.1)
- **`detected_pattern` field** → measure and improve the bot over time. (D4.4)

**Study:** `domain3.md` §3.6 · `domain4.md` §4.1, §4.4, §4.6 · flashcard tags
`CCA::D3`, `CCA::D4`.

---

## Scenario 6 — Structured Data Extraction

**Context.** Extracting information from unstructured documents, validating output
against JSON schemas, maintaining high accuracy, handling edge cases gracefully, and
integrating with downstream systems.

**Primary domains:** 4 (Prompt Engineering & Structured Output), 5 (Context & Reliability).

**Patterns that cluster here**
- **What tool_use guarantees** → syntactic validity only; not semantics, placement,
  or fabrication. (D4.3)
- **The fabrication factory** → all-required schemas invent values; use nullable /
  `"unclear"` / `"other"`. (D4.3)
- **`tool_choice`** → `"any"` for unknown document type; named tool to force a step. (D4.3)
- **Validation-retry boundary** → fixes output errors, not source gaps; payload =
  original + failed output + error message. (D4.4)
- **Self-correction** → `calculated_total` vs `stated_total`; `conflict_detected`. (D4.4)
- **Batch vs synchronous** → 50% / ≤24h / no SLA / no multi-turn; mixed strategy;
  resubmit failures by `custom_id`. (D4.5)
- **Confidence calibration** → per-field, on a labelled validation set; the 97%
  aggregate trap; stratified sampling of high-confidence cases. (D4.6, D5.5)
- **Multi-pass review** → per-file pass + cross-file integration pass. (D4.6)

**Study:** `domain4.md` §4.3–4.6 · `domain5.md` §5.5 · flashcard tag `CCA::D4`.

---

## Quick scenario → domain matrix

| Scenario | D1 | D2 | D3 | D4 | D5 |
|---|:--:|:--:|:--:|:--:|:--:|
| 1 · Customer Support Resolution Agent | ● | ● |  |  | ● |
| 2 · Code Generation with Claude Code |  |  | ● |  | ● |
| 3 · Multi-Agent Research System | ● | ● |  |  | ● |
| 4 · Developer Productivity with Claude | ● | ● | ● |  |  |
| 5 · Claude Code for Continuous Integration |  |  | ● | ● |  |
| 6 · Structured Data Extraction |  |  |  | ● | ● |

● = stated primary domain for that scenario. Every domain appears in multiple
scenarios — which is why Domain 5 (only 15% weight) is worth more than its number:
it surfaces in four of the six scenarios.
