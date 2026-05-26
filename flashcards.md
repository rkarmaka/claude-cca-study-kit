# CCA Foundations — Repeat-Mistake Flashcards

> Drill these until you can recite the **rule** and the **trap** without looking. Each card targets a question pattern you got wrong on both practice attempts (or one critical new miss).

---

## Card 1 — CLAUDE.md hierarchy: the false-option trap 🔴

**FRONT**
> Some team members get a CLAUDE.md guideline applied; new joiners don't. All on the same repo with the latest pull. Why?

**BACK**
- **Answer**: The original devs put the guideline in their **user-level** `~/.claude/CLAUDE.md`. New teammates don't have it. **Fix**: move it to **project-level** `.claude/CLAUDE.md`.
- **Hierarchy**: user (`~/.claude/CLAUDE.md`) → project (`.claude/CLAUDE.md` or root `CLAUDE.md`) → directory (`<subdir>/CLAUDE.md`).
- **🚨 Trap to recognize as FALSE**: any option that says *"Claude Code builds per-user preference models over time"* or *"Claude caches CLAUDE.md across sessions."* Both are flatly wrong. Claude Code reads CLAUDE.md fresh each session. No implicit learning, no cross-session cache.

---

## Card 2 — Investigation-time bottleneck (stakeholders rejected filtering) 🔴

**FRONT**
> Code review averages 15 findings/PR. 40% false positives. Devs must click each finding to read Claude's reasoning. **Stakeholders have rejected any approach that filters findings before developer review.** What addresses the investigation-time bottleneck?

**BACK**
- **Answer**: **Require Claude to include its reasoning and confidence inline with each finding.** Now devs can evaluate without clicking.
- **Why**: The constraint *eliminates every filtering option*. The only allowed move is to surface more info per finding.
- **🚨 Trap**: Any option that filters, suppresses, categorizes by priority, or post-processes. Categorization ("blocking" vs "suggestion") IS filtering by importance. Pattern-based suppression IS filtering.
- **Meta-lesson**: **Read the constraints twice.** If the prompt says "stakeholders have rejected X," eliminate every option that does X.

---

## Card 3 — Multi-concern requests: few-shot, not preprocessing 🟡

**FRONT**
> Agent handles single-concern requests at 94% accuracy. Multi-concern requests (e.g., "refund order #1234 AND update shipping for #5678") drop to 58%. Fix?

**BACK**
- **Answer**: **Add few-shot examples** demonstrating correct reasoning and tool sequencing for multi-concern requests.
- **Why**: The agent already handles each concern well (94%). It just needs *patterns* for how to decompose+sequence multiple. Low-cost, root-cause fix.
- **🚨 Trap**: Building a preprocessing layer with a separate model call to decompose. Over-engineered; adds latency and cost to address something prompt-level can fix.
- **Mental rule**: When component skill is high but composition skill is low → teach the composition with worked examples.

---

## Card 4 — Targeted few-shot vs declarative rules 🟡

**FRONT**
> Agent sometimes picks `get_customer` for ambiguous requests like "I need help with my recent purchase" when `lookup_order` is appropriate. You decide to add few-shot examples. Which approach works best?

**BACK**
- **Answer**: **4-6 examples targeting the ambiguous scenarios, each showing reasoning for why one tool was chosen over plausible alternatives.**
- **Why**: For nuanced **edge-case decisions**, worked examples that show *comparative reasoning* teach the model the decision process. Declarative rules can't capture the gradient between "this case → tool A" and "almost-the-same case → tool B."
- **🚨 Trap**: Adding explicit "use when X" / "do not use when Y" guidelines in tool descriptions. Static declarative rules are weaker than worked examples for nuanced judgment.
- **Mental rule**: **Edge-case judgment → few-shot with reasoning. Consistent classification → explicit criteria. Format consistency → few-shot of the format.**

---

## Card 5 — Scoped cross-role tools (the 80/20 rule for tool distribution) 🟡

**FRONT**
> Synthesis agent needs to verify claims while combining findings. 85% are simple fact-checks (dates, names, stats); 15% require deeper investigation. Currently it round-trips through coordinator → web search agent for every verification. Latency +40%. Fix?

**BACK**
- **Answer**: **Give the synthesis agent a scoped `verify_fact` tool for the 85% simple lookups.** Route the 15% complex cases through coordinator → web search agent as today.
- **Why**: Least privilege + the 80/20 rule. The common case stays in-process; the rare case keeps the safer coordination path.
- **🚨 Trap**: Having synthesis "batch all verification needs and return them to coordinator at end of pass." Creates blocking dependencies — later synthesis steps depend on facts that needed verification earlier.
- **🚨 Trap #2**: Giving synthesis full access to web search tools (over-provisioning, violates separation of concerns).

---

## Card 6 — Parallel tool execution: batch-per-turn, not composite tools 🟡

**FRONT**
> Agent averages 4+ API round-trips per resolution. Logs show Claude executes `get_customer` and `lookup_order` in *separate sequential turns* even when both are clearly needed upfront. Fix?

**BACK**
- **Answer**: **Prompt Claude to batch tool requests per turn** and return all tool results together before the next API call. Use Claude's native ability to emit multiple `tool_use` blocks in one response.
- **Why**: Claude can already make parallel tool calls — the agent loop just needs prompting to do so. Minimal architectural change.
- **🚨 Trap**: Creating composite tools like `get_customer_with_orders`. Adds maintenance burden — you'll need a composite for every common combination.
- **🚨 Trap #2**: Speculative execution that auto-calls likely-needed tools. Wastes API calls on unneeded ones; introduces irrelevant results.

---

## Card 7 — Explicit criteria vs few-shot for vague instructions 🔴

**FRONT**
> Current prompt: "check that comments are accurate and up-to-date." Findings frequently flag acceptable patterns (TODO markers, simple descriptions) AND miss comments that describe behavior the code no longer implements. Fix?

**BACK**
- **Answer**: **Specify explicit criteria** — "flag comments only when their *claimed behavior contradicts actual code behavior*."
- **Why**: The instruction is vague, producing *both false positives AND false negatives*. The fix is a **precise definition of what counts as a problem.** Few-shot doesn't generalize to novel contradiction patterns; pattern-based filtering only addresses false positives, not false negatives.
- **🚨 Trap**: Adding few-shot examples of misleading comments. Pattern-matches existing examples but fails on novel contradictions.
- **🚨 Trap #2**: Filtering out TODO/FIXME patterns. Solves false positives only; misses the false-negative problem entirely.
- **Mental rule**: **Both false-positive AND false-negative problems → explicit criteria. False-positive only → few-shot or filtering.**

---

## Card 8 — Skills vs path-specific rules for exemplar context 🟡

**FRONT**
> Including 2-3 full exemplar endpoint implementations as context improves consistency when generating NEW API endpoints. But this context is only useful for *creating new endpoints* — not for bug fixes, code reviews, or other API directory work. Most efficient configuration?

**BACK**
- **Answer**: **Create a skill** that references the exemplar endpoints with pattern-following instructions, invoked on-demand via slash command (e.g., `/new-endpoint`).
- **Why**: Skills load **only when explicitly invoked**. Context is consumed only when actually needed.
- **🚨 Trap**: Path-specific rules in `.claude/rules/api/` with glob patterns. These trigger for *every* operation on API files — bug fixes, code reviews, refactors — wasting context on tasks where exemplars are irrelevant.
- **Mental rule**: **Glob-pattern rules = "always apply when editing matching files." Skills = "apply on-demand for specific workflows." Pick skills when context is task-specific, not file-specific.**

---

## Card 9 — Format consistency: few-shot beats refined prose 🟡

**FRONT**
> Your reviews identify valid issues but feedback isn't actionable. You add "always include specific fix suggestions" but output is still sometimes detailed, sometimes vague. You've refined the prose instructions 3 times. Now what?

**BACK**
- **Answer**: **Add 3-4 few-shot examples** showing the exact format you want: issue identified, code location, specific fix suggestion.
- **Why**: When prose has failed 3+ times, **switch modality**. Concrete examples constrain output shape directly. Rewording prose tends to produce *different* misinterpretations, not fewer.
- **🚨 Trap**: Refining the prose instructions even more explicitly (more requirements per field). Same failing approach.
- **Mental rule**: **3+ prose iterations failed → switch to examples.** Don't keep polishing the same modality.

---

## 🔁 Bonus card — Decision tree for "which prompt-level technique?"

**FRONT**
> The model is producing inconsistent output. What technique do I reach for?

**BACK**

```
Is the issue VAGUE INSTRUCTION → false positives AND false negatives?
   → EXPLICIT CRITERIA (precise definition)
     [Card 7: comment review]

Is the issue AMBIGUOUS EDGE-CASE DECISION (which tool? which path?)?
   → 4-6 FEW-SHOT EXAMPLES WITH REASONING
     [Card 4: tool selection edge cases]

Is the issue FORMAT INCONSISTENCY (prose → output mismatch)?
   → 3-4 FEW-SHOT EXAMPLES OF THE EXACT FORMAT
     [Card 9: actionable feedback format]

Is the issue COMPOSITION FAILURE (each sub-task works, combo fails)?
   → FEW-SHOT FOR THE COMPOSITION PATTERN
     [Card 3: multi-concern requests]

Is the issue OUTPUT QUALITY VARIES BY CASE TYPE
   (general technique but inconsistent depth across cases)?
   → SELF-CRITIQUE (evaluator-optimizer pattern)

Is the issue PROSE → TRANSFORMATION MISMATCH (3 iterations diverged)?
   → 2-3 CONCRETE INPUT/OUTPUT EXAMPLES
     NOT: JSON schema (validates shape, not semantics)
     NOT: more precise prose
```

---

## 🔁 Bonus card — Decision tree for "prompt-level vs architectural?"

**FRONT**
> When do I pick prompt-level (criteria, few-shot, prose) vs architectural (hooks, prerequisites, separate instance, interface constraint)?

**BACK**

```
Need DETERMINISTIC guarantee or COMPLIANCE?
   → ARCHITECTURAL
     - Tool ordering must be enforced → programmatic prerequisite
     - Threshold must be enforced (e.g., refunds > $500) → tool-call interception hook
     - Data format must be normalized → PostToolUse hook
     - Tool must not be misused → constrain at interface (rename/replace/split)

Need to ELIMINATE CONFIRMATION BIAS in self-review?
   → INDEPENDENT 2ND CLAUDE INSTANCE
     (more context to the same instance doesn't fix self-review)

Need to ISOLATE VERBOSE OUTPUT from main session?
   → context: fork (skill frontmatter)
     OR Explore subagent
     (compressing the output destroys the analysis)

Need PROBABILISTIC quality improvement?
   → PROMPT-LEVEL (see other card)
```

---

## 🎯 Quick self-test (do this daily)

For each card 1-9, can you answer in under 10 seconds:
- What's the **scenario trigger**?
- What's the **correct answer**?
- What's the **trap option you instinctively want to pick**?

If you stumble on any, re-read that card.

---

## 📌 Two read-the-constraints reminders for exam day

1. **"Stakeholders have rejected X"** → eliminate every option doing X (variant: pre-filtering forbidden)
2. **"Without modifying third-party tools"** → must be a wrapping solution (PostToolUse hook, wrapper tool), not internal modification

---

## ❌ Always-wrong distractor options to recognize

These are FALSE statements that appear as distractors. If you see one, eliminate immediately:

- "Claude Code builds per-user preference models over time through repeated interactions"
- "Claude Code caches CLAUDE.md contents across sessions"
- "Larger context windows solve attention dilution"
- "More precise prose fixes interpretation issues after 3 failed iterations"
- "Sentiment analysis is a reliable proxy for case complexity"
- "Self-reported confidence scores from the model are reliably calibrated"
- "Customer frustration alone is sufficient cause to escalate"

---

# Domain coverage cards

> Broad-coverage cards derived from the five domain cheatsheets (`study-notes/domain1.md`–`domain5.md`). One fact per card. Heading prefix `D1`–`D5` sets the Anki domain tag in `anki/build_anki.py`.

## D1 · Agentic loop termination

**FRONT**
> What is the only authoritative signal that an agentic loop should stop?

**BACK**
- `stop_reason`. Continue while it is `"tool_use"`; terminate on `"end_turn"`.
- **🚨 Anti-patterns:** parsing text for "done" phrases; using an iteration cap as the *primary* stop; checking `content[0].type == "text"` (tool-use responses can start with a text block).

---

## D1 · tool_result message shape

**FRONT**
> After `stop_reason: "tool_use"` with three tool_use blocks, how do you continue the loop?

**BACK**
- One `tool_result` per `tool_use_id`, **all in a single `user` turn**. Order need not match.
- Shape: `{"type":"tool_result","tool_use_id":"<id>","content":"...","is_error":false}`.
- **🚨 Wrong:** separate requests per tool; one combined result; putting tool_results in an `assistant` message.

---

## D1 · Multi-agent topology

**FRONT**
> What is the only valid multi-agent topology, and what may subagents NOT do?

**BACK**
- **Hub-and-spoke.** Coordinator at the centre; all communication routes through it.
- Subagents **never** talk to each other directly.

---

## D1 · Subagent isolation principle

**FRONT**
> What state does a subagent inherit from the coordinator?

**BACK**
- **None.** No coordinator history, no shared memory across invocations.
- Every byte a subagent needs must be in its prompt. *The prompt is the universe.*

---

## D1 · Failure tracing table

**FRONT**
> Map each multi-agent symptom to its root cause: missing topics / duplicate work / shallow on everything / missing citations.

**BACK**
- Missing topics → decomposition **too narrow**.
- Duplicated work → scope **partitioning** sloppy.
- Shallow on every topic → subagent **prompts or tool budgets**.
- Missing source attribution → **context-passing** destroyed metadata.
- *Rule: don't blame the agent that faithfully executed a bad brief.*

---

## D1 · Spawning subagents

**FRONT**
> What mechanism spawns subagents, and what config is mandatory for delegation?

**BACK**
- The **Task tool** is the only mechanism.
- `allowedTools` **must include `"Task"`** or the coordinator physically cannot delegate.
- *"Won't delegate" bug → check `allowedTools` for `"Task"`.*

---

## D1 · Context-passing rules

**FRONT**
> Three rules for passing context to a subagent.

**BACK**
- Pass **complete findings**, not pointers.
- Pass **structured metadata** (claim + source_url + snippet), not collapsed prose.
- Write **goal-oriented** prompts, not procedural step-by-step.

---

## D1 · Parallel vs sequential spawning

**FRONT**
> How do you spawn subagents in parallel, and when is it safe?

**BACK**
- Emit multiple `Task` tool_uses in a **single** coordinator response → runs concurrently.
- Sequential (separate turns) = multiplied latency.
- Safe **only when subagents are independent**.

---

## D1 · fork_session

**FRONT**
> When do you use `fork_session` instead of parallel Task spawning?

**BACK**
- For independent branches that **share an expensive computed baseline** ("explore N alternatives from the same analysis").
- Many isolated subagents with no shared baseline → parallel `Task` instead.

---

## D1 · Enforcement spectrum

**FRONT**
> Order these by determinism: hooks, prompt rules, routing, few-shot.

**BACK**
- Probabilistic → deterministic: **prompt rules → few-shot → routing → hooks / prerequisite gates**.
- Only hooks/gates reach ~100% enforcement.

---

## D1 · High-stakes decision rule

**FRONT**
> When is programmatic enforcement (hooks) required vs a prompt?

**BACK**
- Single failure → financial loss / security breach / regulatory violation / safety harm → **hooks/gates**.
- Single failure → bad-but-recoverable UX → **prompts**.
- Canonical hook scenarios: refunds, trade limits, compliance, approvals, age/permission gates, audit logging.

---

## D1 · High-stakes distractor pattern

**FRONT**
> For a high-stakes scenario, which four answer shapes are the distractors?

**BACK**
- ✅ Hook / prerequisite gate.
- 🚨 Stronger system prompt · few-shot examples · specialised subagent with a stronger prompt · bigger model / higher temperature.
- *No prompt wording makes a probabilistic mechanism deterministic.*

---

## D1 · PreToolUse vs PostToolUse

**FRONT**
> When does each Agent SDK hook fire, and what is each used for?

**BACK**
- **PreToolUse** — before the tool runs: gates, authorisation, prerequisite checks, financial limits, capturing **prior-state** hash for audit.
- **PostToolUse** — after the tool, before the model sees the result: normalise, redact PII, truncate, enrich, log.
- Triggers: "prior state / before X" → Pre; "normalise / redact / heterogeneous formats" → Post.

---

## D1 · Hooks vs subagents

**FRONT**
> Hook or subagent: a rule that must be enforced vs a capability needing different reasoning?

**BACK**
- **Rule that must be enforced** → hook.
- **Capability needing different reasoning / prompt / tools** → subagent.
- Hooks gate/block/transform; they **don't rank tools** (use prompts + tool descriptions for "prefer tool A").

---

## D1 · Decomposition patterns

**FRONT**
> Name the four task-decomposition patterns and their tell.

**BACK**
- **Fixed Sequential Pipeline** — stable structure, each step consumes the prior.
- **Dynamic Decomposition** — typed subagents (search/doc/synth), scope varies.
- **Orchestrator–Worker** — uniform worker clones, differ only by prompt-supplied scope.
- **Evaluator–Optimiser** — iterate until checkable criteria pass.
- Discriminator: typed roles → dynamic; uniform clones → orchestrator–worker.

---

## D1 · Evaluator–optimiser failure mode

**FRONT**
> When does the evaluator–optimiser pattern break?

**BACK**
- When the evaluator **cannot reliably tell good from bad** (subjective criteria) → the loop spins.

---

## D1 · Over-engineering trap

**FRONT**
> When does the exam prefer a single agent over multi-agent?

**BACK**
- When a single-agent loop works — **don't refactor to multi-agent**.
- Multi-agent adds latency, cost, and failure surface; warranted only when single-agent genuinely can't do the job.

---

## D1 · Error categories

**FRONT**
> The three agent error categories and the correct response to each.

**BACK**
- **Transient** (429, 503, blip) → retry with exponential backoff + **jitter**, capped.
- **Permanent** (400/401/403/404, malformed) → don't retry; feed back or escalate.
- **Logical** (empty/irrelevant results) → feed back to the model with context; it changes strategy.
- 🚨 Blanket retry on every type is the anti-pattern.

---

## D1 · Idempotency & the paired fix

**FRONT**
> How do you prevent a transient retry from double-charging? What is the "paired fix"?

**BACK**
- Generate a UUID/hash of `{operation + customer + amount}` on the **first** attempt; reuse on every retry; server-side dedup.
- **Paired fix:** when retries are broken AND duplication occurs, you need *both* error classification *and* idempotency keys — either alone is insufficient.

---

## D1 · Human handoff payload

**FRONT**
> What must a self-contained human-handoff payload include? (no transcript expected)

**BACK**
- Customer ID · 2–3 sentence summary · **root-cause analysis** · action taken · **recommended action (incl. refund amount)** · compliance/urgency flags.
- 🚨 The two most-tested omissions: root cause and recommended action.
- 🚨 Forwarding the full transcript is wrong.

---

## D1 · Observability minimum bar

**FRONT**
> Minimum observability for an agent system.

**BACK**
- Trace ID per run, span IDs per loop iteration and tool call.
- Structured logs of `stop_reason`, tool calls, hook decisions, token usage.
- Per-subagent cost & latency (multi-agent costs compound).
- Replay via stored history.

---

## D1 · Reliability patterns

**FRONT**
> Four reliability patterns for agent harnesses.

**BACK**
- **Circuit breaker** — N failures in a window → cooldown.
- **Fallback agent/tool** — degraded answer beats none.
- **Cost/token budgets** — enforced at the harness, not by prompt.
- **Per-tool timeouts** — no tool blocks the loop forever (hang → timeout + fallback, not a prompt instruction).

---

## D2 · Tool descriptions are the routing layer

**FRONT**
> What is the first fix for a tool-misrouting problem, and why?

**BACK**
- **Expand the tool descriptions.** They ARE the routing mechanism — the model has nothing else when choosing between similar tools.
- Fix ranking: expand descriptions (✅) > few-shot > merge tools > train a classifier (🚨 worst).

---

## D2 · Five components of a tool description

**FRONT**
> What does a production-grade tool description contain?

**BACK**
1. Primary purpose (one sentence).
2. Input contract (formats, types, constraints).
3. Example queries it handles well.
4. Edge cases and limitations.
5. **Explicit boundaries vs similar tools** ("Use this for X; for Y use `other_tool`") — the part most teams skip.

---

## D2 · When to split a tool

**FRONT**
> What's the code smell that a tool must be split, and does renaming fix it?

**BACK**
- "**or**" between behaviours or "**depending on**" between conditions in the description → unsplittable at runtime, can't route reliably.
- **Split** into purpose-specific tools with tight contracts. **Renaming does NOT fix it.**

---

## D2 · Misrouting persists after fixing descriptions

**FRONT**
> Descriptions are good but misrouting continues. What now?

**BACK**
- Audit the **system prompt** for keyword-sensitive instructions ("always look up the customer first") that override descriptions.
- **Remove the conflicting association** — don't add more routing rules to the prompt (that competes with descriptions).

---

## D2 · Four MCP error categories

**FRONT**
> The four structured-error categories, retryability, and agent response.

**BACK**
- **Transient** (timeout, 503, rate limit) → retryable, **same input**; backoff then escalate.
- **Validation** (bad format, missing field) → retryable **after fixing input**.
- **Business** (over limit, locked, ineligible) → **not retryable**; surface description, switch workflow.
- **Permission** (401, 403, scope) → not retryable by this agent; escalate.

---

## D2 · isError vs valid empty result

**FRONT**
> Distinguish an access failure from a valid empty result in a tool's contract.

**BACK**
- **Access failure** (couldn't reach the source) → `isError: true` (transient/permission) → consider retry.
- **Valid empty result** (queried fine, found nothing) → `isError: false`, empty array/null → tell the user "no results".
- 🚨 Returning `[]` for both "no such customer" AND "DB unreachable" is the canonical trap.

---

## D2 · Subagent error propagation

**FRONT**
> How should a subagent handle errors, and what should the coordinator do?

**BACK**
- Subagent does **local recovery first** (retry, fall back); only propagate what it can't resolve, including what was attempted + partial results + recommended action.
- Coordinator **evaluates partial results** from successful subagents instead of aborting the whole task.

---

## D2 · Tool count sweet spot

**FRONT**
> How many tools per agent, and how should tools be distributed?

**BACK**
- **4–5 per agent** is the production sweet spot; reliability degrades sharply past 7–10 (softmax thins margins).
- **Scope tools to roles**: synthesis agent has no `web_search`; search agent has no document-analysis tools.

---

## D2 · tool_choice values

**FRONT**
> The three `tool_choice` values and when to use each.

**BACK**
- `"auto"` (default) — model may or may not call a tool.
- `"any"` — must call **some** tool, model picks.
- `{"type":"tool","name":"X"}` — must call **this specific** tool.

---

## D2 · Forcing a mandatory first step

**FRONT**
> A system-prompt instruction "always extract intent first" is skipped ~15% of the time. Fix?

**BACK**
- `tool_choice: {"type":"tool","name":"extract_intent"}` on the first turn; `"auto"` after. 15% → 0%.
- *Prompts request; `tool_choice` requires.*
- 🚨 Wrong: stronger prompt; `"any"` (could pick another tool); validate after the fact.

---

## D2 · Scoped cross-role tool

**FRONT**
> Synthesis agent round-trips to the search agent for many one-line fact checks (85% simple, 15% complex). Fix?

**BACK**
- Give synthesis a **scoped, constrained** `verify_fact(claim, max_sources=3)` tool; description **states complex cases route back to the coordinator**.
- *High-frequency simple op across roles → constrained version for the common case, escalate the rare case.*
- 🚨 Wrong: full `web_search` on synthesis; merge agents; cache; train a smaller model.

---

## D2 · Constrained tool replacements

**FRONT**
> Give the constrained alternative for `fetch_url`, `run_sql`, `send_email`.

**BACK**
- `fetch_url` → `load_document(document_url)` (allowed domains, content-types, strip scripts).
- `run_sql` → `query_orders(filters)` (single-table, parameterised).
- `send_email` → `send_customer_notification(template_id, ...)` (templated, restricted recipients).
- Same capability, narrower surface, smaller blast radius.

---

## D2 · MCP config scoping

**FRONT**
> Where do project vs personal MCP servers live, and is each version-controlled?

**BACK**
- **Project:** `.mcp.json` at repo root — committed/shared.
- **User:** `~/.claude.json` — personal, not shared.
- Tool discovery happens at connection time; too many servers re-creates tool overload.

---

## D2 · MCP credentials

**FRONT**
> A token is hard-coded in a committed `.mcp.json`. Correct fix?

**BACK**
- Use `${VAR}` expansion: `"JIRA_API_TOKEN": "${JIRA_API_TOKEN}"`; secrets live in each dev's env. **Rotate the leaked token** (git history is forever).
- 🚨 Wrong: relocate to `~/.claude.json` or gitignore it — both break team sharing. Parameterise, don't relocate.

---

## D2 · MCP tools vs resources

**FRONT**
> Tools vs resources in MCP — and the fix for "agent makes many exploratory calls at conversation start."

**BACK**
- **Tools = actions**; **Resources = readable content** (catalogues, schemas, summaries).
- Fix: expose **resources** (e.g. `db://schemas/orders`); the agent reads the catalogue once, then queries precisely.

---

## D2 · Build vs use an MCP server

**FRONT**
> When build a custom MCP server vs use a community one?

**BACK**
- **Use community** for standard systems (Jira, GitHub, Slack, Postgres) with a maintained server.
- **Build custom** only for internal systems, or when the community server fundamentally can't support the workflow, or compliance forbids it.
- Preference: **configuration over construction; fork over fresh build** (90% fit → post-process or fork).

---

## D2 · MCP tool losing to a built-in

**FRONT**
> The agent reaches for Grep/Read instead of your overlapping MCP tool. Fix?

**BACK**
- Enhance the **MCP tool's description** with examples and explicit boundary clauses (e.g. "use for semantic queries; prefer Grep for exact-string search").
- Same principle as 2.1 — descriptions are the routing layer.

---

## D2 · Grep vs Glob

**FRONT**
> Grep vs Glob: what does each search, and the mnemonic?

**BACK**
- **Grep** — file **contents**; returns matching lines+files. "What does the code *say*?" (callers, errors, imports, TODOs).
- **Glob** — file **paths**; returns paths. "What files *exist*?" (`**/*.test.tsx`, configs by extension).
- "Find React components" → Glob `**/*.tsx`. "Find callers of `formatDate`" → Grep `formatDate(`.

---

## D2 · Grep → Glob sequencing

**FRONT**
> "Find all callers of `legacyAuth`, then their test files." What order?

**BACK**
- **Grep first** (content-seeded): `legacyAuth(` → caller files → derive test names → **Glob** for the test paths.
- Rule: content-seeded → Grep then Glob; path-seeded (known file set → check contents) → Glob then Grep.

---

## D2 · Edit-failure escalation ladder

**FRONT**
> An Edit fails with "multiple matches". Escalation order?

**BACK**
1. **Expand the `old_string` anchor** with surrounding context until unique (first move).
2. If no unique anchor exists → **Read + Write** the full file.
3. If you meant every occurrence → `replace_all: true`.
- 🚨 Wrong: "use sed"; "delete and recreate".

---

## D2 · Incremental codebase understanding

**FRONT**
> The context-budget-friendly way to understand a codebase.

**BACK**
- **Grep** for entry points → **Read** only that file → **Grep** the identifiers it uses → **Read** only the implementations that matter.
- 🚨 Anti-pattern: read every file upfront — burns tens of thousands of tokens before any reasoning.

---

## D2 · Layer awareness (Domain 2)

**FRONT**
> Why is a `PreToolUse` hook usually wrong in a Domain 2 question?

**BACK**
- Hooks are a **Claude Code harness** feature. Domain 2 tests **API + MCP + tool-design** layers: `tool_choice`, `tools`, tool-result structure, `isError`.
- Match the fix to the layer the question is testing.

---

## D3 · CLAUDE.md hierarchy

**FRONT**
> The three CLAUDE.md levels, their paths, and which are version-controlled.

**BACK**
- **User** `~/.claude/CLAUDE.md` — personal, **not** shared.
- **Project** `.claude/CLAUDE.md` or root `CLAUDE.md` — shared via git.
- **Directory** `<subdir>/CLAUDE.md` — scopes **downward and local, never upward**.

---

## D3 · Divergent-developers bug

**FRONT**
> Dev A follows team conventions; Dev B on the same repo/branch doesn't. Root cause and fix?

**BACK**
- Dev A wrote the conventions to **user-level `~/.claude/CLAUDE.md`**; git never carried it.
- **Fix:** move to project-level `.claude/CLAUDE.md` (or root) and commit.
- 🚨 Wrong: `/memory reload`, restart, move to directory-level — none conjure a missing file.

---

## D3 · /memory command

**FRONT**
> What is `/memory` for?

**BACK**
- **Diagnosis** — lists which memory files are currently loaded.
- It confirms a missing-file diagnosis; it does **not fix** anything. Fix = put the file in the right location.

---

## D3 · Modular CLAUDE.md

**FRONT**
> Two ways to organise a bloated CLAUDE.md.

**BACK**
- `@import` syntax inside CLAUDE.md (reference external/per-package files).
- `.claude/rules/` directory of topic files (`testing.md`, etc.) with optional `paths:` frontmatter.
- 🚨 Wrong: compress by deleting examples — hides the structural problem.

---

## D3 · Skills vs CLAUDE.md

**FRONT**
> Skill or CLAUDE.md: when loaded, and purpose of each?

**BACK**
- **Skill** — loaded **on-demand when invoked**; task-specific workflows (`/review`).
- **CLAUDE.md** — **always loaded**; universal standards.
- "Needs to happen every time" → CLAUDE.md. "Invoked when needed" → skill.

---

## D3 · Skill frontmatter options

**FRONT**
> What do `context: fork`, `allowed-tools`, and `argument-hint` do?

**BACK**
- `context: fork` — runs in an isolated subagent; verbose output stays there, only a summary returns. ("clutters main conversation").
- `allowed-tools: [Read, Grep]` — restricts the skill's tools ("analyse only, read-only").
- `argument-hint` — prompts for a required parameter when invoked without one.

---

## D3 · Personal customisation of a team skill

**FRONT**
> A dev wants a stricter version of the team `/review` skill. Right move?

**BACK**
- Create `~/.claude/skills/review-strict/SKILL.md` — different name, personal location.
- 🚨 Wrong: edit the project skill (affects teammates).
- Two orthogonal axes: *who needs it* → location; *is output noisy* → `context: fork`.

---

## D3 · Path-specific rules

**FRONT**
> What are path-specific rules, and when do they beat directory-level CLAUDE.md?

**BACK**
- Files in `.claude/rules/` with `paths:` glob frontmatter; load **only** when editing matching files.
- Beat directory CLAUDE.md for **files spread across the codebase by pattern** (`**/*.test.*`) — one file, globs everywhere, no per-directory drift.
- Signature phrase: "pattern of files spread across the codebase".

---

## D3 · Standards must be ambient

**FRONT**
> Why is a `/migrate` slash command the wrong way to enforce a migration convention?

**BACK**
- Slash commands require devs to **remember to invoke** them; standards must be **ambient**.
- Use path-specific rules (or CLAUDE.md), not an opt-in command.

---

## D3 · Plan mode vs direct execution

**FRONT**
> The dividing line between plan mode and direct execution.

**BACK**
- **Decisions still to make?** → plan mode (large/architectural/multi-approach, unfamiliar codebase).
- **Known thing to do?** → direct execution (single-file fix, mechanical change).
- Hybrid "plan then direct-execute" is valid; a multi-file migration with differing APIs is plan mode despite "mechanical" framing.

---

## D3 · Explore subagent

**FRONT**
> The main conversation fills with grep output and file listings. Fix?

**BACK**
- Use the **Explore subagent** — isolates verbose discovery, returns summaries, preserves main context.
- Same goal as `context: fork` for skills; different mechanism.

---

## D3 · Iterative refinement hierarchy

**FRONT**
> Claude Code interprets a prose instruction differently each iteration. Best fix, and what NOT to do?

**BACK**
- Provide **2–3 concrete input/output examples** — the model generalises from examples more reliably than prose.
- Other tools: test-driven iteration (machine-checkable spec); interview pattern (ask questions first, for unfamiliar domains).
- 🚨 After prose fails 3×, **switch modality** — don't reword the prose.

---

## D3 · Batch vs sequence feedback

**FRONT**
> When do you give Claude feedback in one message vs sequentially?

**BACK**
- Fixes **interact** → single message (consistent decisions).
- Issues are **independent** → sequential (fix, verify, move on).

---

## D3 · CI hangs

**FRONT**
> The CI pipeline prints the banner then hangs. Fix?

**BACK**
- Add **`-p` (print mode)** — runs non-interactively. Without it, the job waits for interactive input.
- 🚨 Wrong: increase timeout; redirect /dev/null; detached shell; `--output-format text`.

---

## D3 · Structured CI output

**FRONT**
> An automated system must post findings as inline PR comments. What flags?

**BACK**
- `--output-format json` **and** `--json-schema <schema>` — JSON constrained to a parseable shape.

---

## D3 · Review session isolation

**FRONT**
> Why not reuse the code-generating session to review its own code?

**BACK**
- It retains the reasoning that produced the code → **motivated reasoning**, less likely to question itself.
- Use an **independent, fresh** Claude Code session for review.

---

## D3 · Incremental review / comment fatigue

**FRONT**
> Developers ignore the review bot because it repeats findings on every push. Fix?

**BACK**
- **Incremental review context:** pass prior findings into the next run; instruct Claude to report **only new or still-unaddressed** issues.
- 🚨 Wrong: remove the bot.

---

## D3 · CI generates low-quality tests

**FRONT**
> CI-generated tests are trivial boilerplate. Fix?

**BACK**
- Strengthen **`.claude/CLAUDE.md`** with testing standards, what makes a *valuable* test, and available fixtures/mocks (CI reads the same hierarchy).

---

## D4 · Categorical criteria beat confidence adjectives

**FRONT**
> "Be conservative / only high-confidence findings" produces bad results. Better instruction shape?

**BACK**
- **Categorical criteria:** *what to flag, what to report, what to skip* — no confidence adjectives.
- e.g. "Flag comments only when claimed behaviour contradicts actual code behaviour."

---

## D4 · False-positive trust problem

**FRONT**
> One finding category is noisy and devs now distrust ALL categories. Counterintuitive fix?

**BACK**
- **Disable the noisy category entirely** while improving its prompt; keep accurate categories active; re-enable later.
- 🚨 Wrong: lower its threshold or add more instructions — both keep noise flowing.

---

## D4 · Severity calibration

**FRONT**
> How do you stop severity levels from drifting across runs?

**BACK**
- Anchor each level with **concrete code examples**, not prose.
- 🚨 A five-level prose rubric looks thorough but drifts — it lacks code anchors.

---

## D4 · Few-shot: the headline rule

**FRONT**
> Most effective technique for output **consistency**, and how many examples?

**BACK**
- **Few-shot examples** — not more instructions, thresholds, or temperature changes.
- **2–4 targeted** examples on the ambiguous cases, each showing reasoning. Not 10, not 1.

---

## D4 · Few-shot deployment triggers

**FRONT**
> Three situations that call for few-shot examples.

**BACK**
1. Detailed instructions still produce inconsistent formatting.
2. Inconsistent judgement on ambiguous cases.
3. Extraction produces empty/null fields for info that exists in the document.
- Bonus: varied-structure examples **reduce hallucination** by teaching the *shape* of valid extractions.

---

## D4 · What tool_use guarantees

**FRONT**
> What does tool_use with a JSON schema guarantee — and what does it NOT?

**BACK**
- Guarantees **syntactic validity** only.
- Does **NOT** prevent: semantic errors (line items don't sum), field-placement errors, or **fabrication** of required fields.

---

## D4 · The fabrication factory

**FRONT**
> Why is a strict schema with all-required fields dangerous?

**BACK**
- It's a **fabrication factory** — *required* guarantees a value is present, even if invented.
- Fix with the anti-fabrication toolkit: nullable/optional fields, `"unclear"` enum, `"other"` + freeform detail.
- 🚨 "Do not fabricate" in the prompt can't override a required field.

---

## D4 · tool_choice for extraction

**FRONT**
> Extraction over documents of **unknown type** that must produce structured output. Which `tool_choice`?

**BACK**
- `"any"` — must call some tool, model picks the fitting one.
- 🚨 Named tool `{type:"tool",name:"extract_invoice"}` routes heterogeneous docs through one ill-fitting tool. `"auto"` lets the model escape into prose.

---

## D4 · Validation-retry boundary

**FRONT**
> What does validation-retry fix, and what can it never fix?

**BACK**
- **Fixes output errors:** format mismatch (date), structural (object vs array), misplaced values.
- **Cannot fix:** information genuinely **absent from the source** → use a nullable field, not retry.
- *Retry handles output errors; schema design handles source gaps.*

---

## D4 · Validation-retry payload

**FRONT**
> What three things go back to the model on a validation failure?

**BACK**
1. The original document.
2. The failed extraction output.
3. The specific validation **error message**.
- 🚨 Raising the retry limit 3→10 produces more fabrications, not accuracy.

---

## D4 · detected_pattern field

**FRONT**
> How do you improve a code-review bot's accuracy over time?

**BACK**
- Add a **`detected_pattern`** field to each finding → analyse dismissal patterns (if pattern X is dismissed 80% of the time, improve its prompt).
- Turns a black-box bot into a measurable system. 🚨 Not "iterate on the prompt" blindly.

---

## D4 · Self-correction via redundant extraction

**FRONT**
> How do you catch arithmetic and internal-consistency errors a schema can't?

**BACK**
- Extract `stated_total` **and** `calculated_total` (sum line items yourself); flag disagreement.
- Add a `conflict_detected` boolean for internally inconsistent sources (header date ≠ footer date).
- *Extract redundantly; let inconsistencies bubble up.*

---

## D4 · Batch API facts

**FRONT**
> Five facts about the Message Batches API.

**BACK**
1. **50% cost saving** vs synchronous.
2. **≤24-hour** processing window.
3. **No latency SLA.**
4. **No multi-turn tool calling** (single-shot only) — the sleeper trap.
5. **`custom_id`** correlates request/response.

---

## D4 · Sync vs batch matching rule

**FRONT**
> Which workflows go synchronous vs batch?

**BACK**
- **Blocking** (someone/something waiting: CI pre-merge, IDE suggestions, chat) → **synchronous**.
- **Latency-tolerant** (overnight tests, weekly audits) → **batch**.
- Multi-turn agentic loops → synchronous regardless.
- 🚨 "Switch everything to batch to save 50%" is never the answer — use a **mixed strategy**.

---

## D4 · Batch failure handling

**FRONT**
> 200 of 50,000 batch requests failed. What do you do, and how do you iterate on prompts?

**BACK**
- Identify failures by `custom_id`; resubmit **only those** (chunk oversized docs). 🚨 Don't re-batch all 50,000.
- Refine prompts on a **sample synchronously before** batching — batch iteration loops are ≤24h each.

---

## D4 · Multi-instance review

**FRONT**
> Why can't a model reliably review its own output in-session, and what's the fix?

**BACK**
- It retains the reasoning that produced the output → biased toward prior conclusions.
- Fix: spawn an **independent instance** (fresh session, no prior context). Same idea as the D3.6 CI rule.

---

## D4 · Multi-pass review for large repos

**FRONT**
> Why does a single pass fail on a large codebase, and what's the architecture?

**BACK**
- Single pass → attention dilution, contradictory findings, missed cross-file issues.
- Architecture: **per-file local pass** + a **separate cross-file integration pass**.
- 🚨 A larger context window does NOT fix attention dilution.

---

## D4 · Confidence-based routing

**FRONT**
> How do you route findings to human review reliably?

**BACK**
- Model self-reports confidence per finding → route **low-confidence** to humans, auto-apply high-confidence.
- **Calibrate thresholds on a labelled validation set** — never pick 0.9 by intuition.

---

## D5 · What summarisation destroys first

**FRONT**
> What does lossy summarisation compress away first, and the fix?

**BACK**
- Numbers, dates, order/case IDs, percentages, customer-stated expectations.
- **Fix:** a persistent **`<case_facts>` block** injected verbatim into every prompt — summarisation never touches it.

---

## D5 · Lost in the middle

**FRONT**
> What is "lost in the middle", and how do you mitigate it?

**BACK**
- Attention is biased to the **beginning and end**; middle content is retrieved less reliably. Structural, not a model bug.
- Mitigate: put key summaries at the **beginning**, use explicit section headers, surface the relevant slice of long results at the top.

---

## D5 · Tool result trimming

**FRONT**
> A 40-field lookup when 5 fields are needed. Where and why do you trim?

**BACK**
- Trim at the **integration layer, before** the result hits the context window.
- Untrimmed results **accumulate across turns** (turn 8 still carries turns 1–7's noise). Treat tool responses like API contracts, not data dumps.

---

## D5 · Stateless API & history

**FRONT**
> Why must every API request include the full conversation history?

**BACK**
- Claude API calls are **stateless**; dropping earlier messages breaks coherence.
- Make it economical with **prompt caching** on the stable prefix (system prompt + tools + early conversation).

---

## D5 · Upstream optimisation across agent boundaries

**FRONT**
> Downstream agents drown in upstream verbosity. Cheapest fix?

**BACK**
- Fix **upstream**: subagents return **structured key facts, citations, relevance/confidence** — not prose, reasoning chains, or narrative.
- Reasoning stays inside the subagent; only distilled conclusions cross the boundary.

---

## D5 · Valid escalation triggers

**FRONT**
> The three valid escalation triggers and the two unreliable ones.

**BACK**
- ✅ Explicit human request · policy gap/exception · no meaningful progress after legitimate attempts.
- 🚨 Sentiment/frustration (doesn't correlate with complexity) · raw self-reported confidence.

---

## D5 · Frustration vs explicit human request

**FRONT**
> How do you handle a frustrated customer vs one who explicitly asks for a human?

**BACK**
- **Explicit "I want a human"** → escalate immediately, even if trivially resolvable; don't investigate first.
- **Frustrated, simple issue, no human request** → acknowledge, offer resolution; escalate only if they **reiterate**.

---

## D5 · Ambiguous customer match

**FRONT**
> Search returns multiple matches for "John Smith". Correct move?

**BACK**
- **Ask for an additional identifier** (email, phone, order number, postcode).
- 🚨 Never resolve with a heuristic (most recent/active, "matches the description", proximity) — one extra turn beats acting on the wrong account.

---

## D5 · Structured error context

**FRONT**
> The four fields a structured error must carry for recovery.

**BACK**
1. **Failure type** (transient/validation/business/permission).
2. **What was attempted** (query, params, endpoint).
3. **Partial results** gathered before failure.
4. **Potential alternatives** (retry, fallback, narrower query).

---

## D5 · The two error anti-patterns

**FRONT**
> Two anti-patterns for reporting a tool failure in a pipeline.

**BACK**
- **Silent suppression** — `{"results":[], "status":"ok"}` → orchestrator thinks no data exists, zero recovery path. **Worst** 5.3 answer.
- **Workflow termination** — killing the whole pipeline on one failure → discards other subagents' successful partial results.
- Right: preserve successes, annotate the **coverage gap**.

---

## D5 · Codebase-exploration degradation

**FRONT**
> Two symptoms that a long exploration session is degrading, and the shared root cause.

**BACK**
- Model cites **"typical patterns"** instead of the specific classes/files it found.
- Context fills with verbose discovery, burying earlier conclusions.
- Root cause: high-signal early findings diluted by high-volume later exploration.

---

## D5 · Context-degradation mitigations

**FRONT**
> Four ways to fight context degradation in long sessions.

**BACK**
- **Scratchpad file** — write key findings, reference later (survives compaction/crash).
- **Subagent delegation** — coordinator receives distilled results only.
- **Summary injection** — summarise a phase before spawning the next.
- **`/compact`** — recovery valve near the limit (trades fidelity).
- 🚨 A bigger context window doesn't fix attention dilution.

---

## D5 · Crash recovery manifest

**FRONT**
> How does an agent survive a crash mid-task?

**BACK**
- Export structured state to a **manifest file** at checkpoints; on resume, load it into the agent's prompts.
- The **manifest is the source of truth, not the conversation history** — robust to crashes, context exhaustion, interruptions, multi-session jobs.

---

## D5 · Aggregate-metrics trap

**FRONT**
> "Our extraction is 97% accurate, let's automate." Why is this dangerous?

**BACK**
- A 97% **aggregate** can hide a 40% error rate on a rare-but-high-value document type.
- **Validate by document type AND field segment** before removing humans. A single number is never sufficient evidence.

---

## D5 · Stratified sampling post-deployment

**FRONT**
> After deployment, which extractions should you keep sampling and why?

**BACK**
- Continue **stratified sampling including high-confidence** extractions.
- Novel error patterns emerge over time and slip through silently — by definition they don't trip existing review thresholds.

---

## D5 · Field-level confidence calibration

**FRONT**
> The full pattern for confidence-based human review routing.

**BACK**
1. **Per-field** confidence (not per-document — field difficulty varies).
2. Calibrate thresholds on a **labelled validation set**.
3. Route **low-confidence fields** to humans; auto-process the rest.
4. Prioritise scarce reviewer time on the **highest-uncertainty** items.

---

## D5 · Information provenance bundle

**FRONT**
> The five fields that must travel with every claim, and what synthesis must not do.

**BACK**
- **Claim · source URL · document name · relevant excerpt · publication date.**
- The synthesis agent **preserves and merges** these — it must **not flatten them into prose**, or attribution dies ("studies show X").

---

## D5 · Conflicting sources

**FRONT**
> Two credible sources report different numbers for the same statistic. Right move and wrong moves?

**BACK**
- ✅ Annotate **both values with full attribution**; let the consumer decide.
- 🚨 Wrong: pick one arbitrarily · **average** them (fabricates a number neither reported) · silently pick the more recent / "better" source.

---

## D5 · Temporal reconciliation

**FRONT**
> A 28% figure (2022) and 32% (2024) look contradictory. How do you reframe it?

**BACK**
- Include **publication and data-collection dates** in structured output — many "conflicts" are different reporting periods.
- 28% (2022) vs 32% (2024) is a **trend**, not a contradiction.

---

## D5 · Content-appropriate rendering

**FRONT**
> Match rendering to content: financial data / news / technical findings.

**BACK**
- Financial data → **tables** (numbers in prose are hard to compare).
- News/narrative → **prose** (bullets lose causality).
- Technical findings → **structured lists**.
- 🚨 One uniform house format loses information.
