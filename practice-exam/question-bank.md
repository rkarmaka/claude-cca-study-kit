# Claude Certified Architect – Foundations: Exhaustive Question Bank

**Format:** All multiple choice, one correct answer + three distractors. Mirrors the exam style.
**Source material:** Anthropic CCA Foundations Exam Guide v0.1 (Feb 10 2025) + domain cheatsheets (domain1.md – domain5.md).
**Scoring guide on the real exam:** 720/1000 to pass. Scaled across 4 of 6 scenarios.

**How to use this bank:**
1. Cover the "Correct answer" and "Explanation" lines.
2. Answer the question.
3. Reveal — and **read the explanation even when you got it right**, because the same wrong-answer patterns recur.

**Distribution (mirrors exam weighting):**
- Domain 1 (Agentic Architecture & Orchestration) — 27% — Q1–Q50
- Domain 2 (Tool Design & MCP Integration) — 18% — Q51–Q85
- Domain 3 (Claude Code Configuration & Workflows) — 20% — Q86–Q125
- Domain 4 (Prompt Engineering & Structured Output) — 20% — Q126–Q165
- Domain 5 (Context Management & Reliability) — 15% — Q166–Q195
- Cross-domain integrative scenarios — Q196–Q220

---

## Domain 1: Agentic Architecture & Orchestration (Q1–Q50)

### TS 1.1 — Agentic Loops

**Q1.** Your agent is supposed to keep calling tools until the task is complete, then present a final answer. The loop currently terminates by checking whether the last `content` block contains the text "Done.", and you have just observed a bug where Claude began a tool-use response with the text "Let me look that up for you." and the loop exited immediately. What is the correct termination signal?

A) Check whether the assistant message contains a `text` block whose content matches a list of completion phrases.
B) Inspect `stop_reason`; continue when it is `"tool_use"`, terminate when it is `"end_turn"`.
C) Set a maximum iteration cap of 10 and treat reaching it as success.
D) Parse the last tool_result and stop when no more tool calls are needed by inspecting field values.

**Correct answer:** B
**Explanation:** `stop_reason` is the only authoritative termination signal. Parsing natural language ("Done.") is the canonical anti-pattern — tool-use responses can legally start with a text block. Iteration caps are safety nets, not primary stopping mechanisms. Tool-result inspection delegates termination semantics to tool authors and breaks for any tool whose result doesn't encode "done."

---

**Q2.** In the agentic loop you are building with the Claude API, you receive `stop_reason: "tool_use"` and three `tool_use` blocks in the assistant response. How must you structure the next API request to continue the loop?

A) Send a new `user` message containing one `tool_result` block per `tool_use_id`, in any order, with `is_error` set on the result if the tool failed.
B) Send three separate API requests, one for each `tool_use_id`, and concatenate the responses.
C) Send a single `tool_result` block summarising all three tool calls into one combined output.
D) Send an `assistant` message containing the `tool_result` blocks so the model treats them as its own.

**Correct answer:** A
**Explanation:** Parallel `tool_use` blocks require one `tool_result` per `tool_use_id`, all inside a single `user` turn. Order within the user turn is not required to match the assistant's order. Sending separate requests breaks conversation coherence; collapsing into one combined result loses the per-tool correlation; placing tool_results in an `assistant` message is invalid — tool results are user-role inputs.

---

**Q3.** You are debugging an agentic loop where Claude appears to never terminate. Logs show `stop_reason: "end_turn"` was returned on iteration 7, but your loop continued for two more iterations. Which design flaw is most likely to cause this behaviour?

A) The loop is keying termination on assistant text content rather than `stop_reason`.
B) The loop's iteration cap is set too high.
C) The tools are returning empty results, confusing the model.
D) The temperature is too high, leading to unstable completions.

**Correct answer:** A
**Explanation:** If `stop_reason: "end_turn"` was returned and the loop continued, the loop is not consulting `stop_reason` as the authoritative signal — it is checking something else (text content, iteration counter, tool results). Cap, tool results, and temperature do not override a delivered termination signal.

---

**Q4.** Which of the following is an anti-pattern in agentic loop design?

A) Appending each `tool_result` block to the conversation history before the next iteration.
B) Setting a high iteration cap (e.g., 50) as a safety net to prevent runaway loops.
C) Using `stop_reason == "tool_use"` to decide whether another iteration is needed.
D) Using the iteration cap as the primary mechanism for terminating the loop in normal cases.

**Correct answer:** D
**Explanation:** Iteration caps are safety nets, not termination logic. Relying on the cap as the primary stop condition means every successful run terminates abnormally. A, B, and C are correct practices: append tool_results to history, use a cap as belt-and-braces, and key termination on `stop_reason`.

---

**Q5.** Your agentic loop calls a `search_kb` tool, and the tool result is appended to the conversation. On the next iteration, Claude calls `search_kb` again with a slightly different query. What is the correct interpretation of this pattern?

A) The loop is broken — Claude is re-calling tools it already used. Add deduplication logic.
B) Claude is reasoning that the prior result was insufficient and a refined query is needed. This is normal model-driven decision-making.
C) The temperature is too high. Lower it to make the loop deterministic.
D) The tool description is too vague; tighten it so the model picks the right query the first time.

**Correct answer:** B
**Explanation:** Model-driven decision-making is what agentic loops enable — Claude reads prior tool results in context and decides what to do next. Re-querying with a refined query is the loop working as designed, not a bug. Deduplication blocks legitimate refinement. Temperature does not "cure" re-querying; a deterministic loop would still legitimately re-query. Tool descriptions help routing, not refinement decisions.

---

### TS 1.2 — Multi-Agent Orchestration

**Q6.** You are building a multi-agent research system with a coordinator and three subagents (web search, document analysis, synthesis). The synthesis subagent must access findings produced by the other two. How should information flow?

A) Web-search and document-analysis subagents each call the synthesis subagent directly when they finish.
B) All subagents share a global memory store that any subagent can read or write.
C) The coordinator collects findings from web-search and document-analysis, then invokes the synthesis subagent with those findings in its prompt.
D) The synthesis subagent autonomously polls for results from the other subagents until they are available.

**Correct answer:** C
**Explanation:** Hub-and-spoke is the only supported topology in Claude Agent SDK. The coordinator is the hub; subagents are spokes; all communication routes through the coordinator. Subagents do not talk to each other, do not share global memory automatically, and do not poll other subagents.

---

**Q7.** A multi-agent system researching "global trends in clean energy" produces a report that omits geothermal energy entirely. The web search agent, document analysis agent, and synthesis agent all completed successfully and their outputs look correct given their assignments. Logs show the coordinator decomposed the topic into "solar," "wind," and "hydroelectric." What is the most likely root cause?

A) The synthesis agent lacks instructions for identifying coverage gaps.
B) The web search subagent's queries were not comprehensive enough.
C) The coordinator's task decomposition was too narrow.
D) The document analysis agent filtered out geothermal sources.

**Correct answer:** C
**Explanation:** Each subagent executed its assigned task correctly. The missing topic originates upstream, in the coordinator's decomposition step, which omitted geothermal from the subtasks. Blaming downstream agents for faithfully executing a bad brief is a recurring trap.

---

**Q8.** A subagent in your hub-and-spoke research system requires a web search agent's results to do its job. Currently, you pass the URL of a results file written by the web search agent. The synthesis agent is fabricating source citations. What is the correct fix?

A) Increase the synthesis agent's context window so it can fit the entire web results file inline.
B) Include the complete web search findings — with claims, source URLs, document names, and excerpts — directly in the synthesis subagent's prompt.
C) Have the synthesis agent open the results file itself when invoked, after receiving the path.
D) Train the synthesis agent specifically on the format used by the web search agent.

**Correct answer:** B
**Explanation:** Subagents do not inherit coordinator context and do not automatically share memory. Every byte the synthesis subagent needs must be in its prompt. Passing a pointer to a file the subagent cannot reliably read leaves it grasping for missing information — exactly when fabrication occurs. Larger context windows don't help if the data isn't in the prompt; format training is over-engineering.

---

**Q9.** Logs show your research system is producing duplicated work — the web search subagent returns sources already covered by the document analysis subagent, wasting time and tokens. Which root cause should you investigate first?

A) The two subagents have identical tool sets and are racing on overlap.
B) The coordinator's scope partitioning between the two subagents is sloppy or absent.
C) The subagents are calling each other directly without coordinator mediation.
D) The synthesis step is failing to deduplicate before output.

**Correct answer:** B
**Explanation:** Duplication is a partitioning failure at the coordinator level — the coordinator did not assign distinct subtopics or source types to each subagent. Deduping after the fact wastes the same work. Subagents physically cannot call each other in hub-and-spoke architecture. Tool overlap alone does not cause duplication; assignment overlap does.

---

**Q10.** A research report is missing source attribution. The web search agent returned URLs, the document analysis agent returned document IDs and excerpts. The synthesis agent receives a flat list of claims. What is the most likely root cause?

A) The synthesis agent's prompt does not instruct it to cite sources.
B) The context-passing step collapsed structured claim-source pairs into prose, destroying metadata.
C) The web search agent's URLs were not formatted as Markdown.
D) The coordinator should run the synthesis step itself for better control.

**Correct answer:** B
**Explanation:** Attribution dies the moment structured data becomes prose. The fix is to pass structured claim-source bundles (claim + source URL + document name + excerpt + date) all the way through synthesis. Prompt instructions help, but cannot recover information that was already destroyed in context-passing. Markdown is irrelevant; centralising synthesis is over-engineering.

---

**Q11.** You are designing the coordinator's prompt for a multi-agent research system. Which prompt approach gives subagents the most flexibility while preserving research quality?

A) "Call web_search with query 'X'; then call document_analysis with results; then call synthesis with everything."
B) "Decompose the topic, partition scope across subagents, gather findings, synthesise with citations. Aim for breadth across all relevant subdomains."
C) "Use only the synthesis subagent for the entire task. It will call the others as needed."
D) "Use all subagents in parallel, always, without decomposition. The synthesis step will handle gaps."

**Correct answer:** B
**Explanation:** Coordinator prompts should be **goal-oriented** (what to achieve, quality criteria), not procedural (step-by-step instructions). Goal-oriented prompts let subagents adapt; procedural prompts make the coordinator brittle. C destroys hub-and-spoke; D wastes resources and breaks partitioning.

---

**Q12.** Which symptom most reliably indicates that the **coordinator's decomposition** is at fault rather than the subagents?

A) The synthesis step produces grammatically correct but vague language.
B) Some sources are missing attribution in the final report.
C) Major subtopics of the requested research area are entirely missing from the output, despite each subagent's output looking complete given what it was asked.
D) The same document appears cited twice with different excerpts.

**Correct answer:** C
**Explanation:** Missing topics → decomposition too narrow at the coordinator. Vague synthesis prose is a synthesis-prompt issue; missing attribution is a context-passing issue; double-cited documents is a partitioning issue. The decomposition diagnostic is the symptom of *whole areas absent*.

---

### TS 1.3 — Subagent Invocation & Context Passing

**Q13.** Your coordinator agent should delegate to a `web_search_agent` subagent using the `Task` tool, but the coordinator never calls `Task`. Inspect of the configuration shows the coordinator has `allowedTools: ["WebSearch", "Read", "Write", "Edit", "Grep"]`. What is the cause?

A) The `Task` tool is not present in `allowedTools`, so the coordinator physically cannot delegate.
B) The coordinator needs the `--multi-agent` CLI flag to enable subagent invocation.
C) The subagent's `AgentDefinition` is missing a `description` field.
D) The `web_search_agent` is not registered in the global agent registry.

**Correct answer:** A
**Explanation:** `Task` is the only mechanism for spawning subagents. If it is not in the coordinator's `allowedTools`, no amount of prompting will produce a delegation — the tool literally isn't available. There is no `--multi-agent` flag; subagent descriptions affect selection quality, not the ability to invoke; there is no global agent registry that gates invocation.

---

**Q14.** You want your coordinator to spawn two subagents in parallel rather than sequentially to halve latency. What is the correct approach?

A) Emit two `Task` tool_use blocks in a single coordinator response — they execute concurrently.
B) Emit one `Task` tool_use, wait for the result, then emit the second `Task` in the next turn.
C) Increase the `max_tokens` parameter to allow longer responses.
D) Use the `--parallel` flag on the Claude Agent SDK.

**Correct answer:** A
**Explanation:** Multiple `Task` tool_use blocks emitted in one assistant turn execute in parallel. Sequential turns serialise execution and triple latency. `max_tokens` and a `--parallel` flag are unrelated.

---

**Q15.** A subagent's `AgentDefinition` includes `description`, `prompt`, and a `tools` subset. Which field has the strongest effect on whether the coordinator chooses this subagent for a given task?

A) `tools` — fewer tools makes the subagent appear more focused.
B) `prompt` — the system prompt seeded into the subagent.
C) `description` — used by the coordinator's selection logic, written like a function docstring.
D) `model` — a more capable model attracts coordinator routing.

**Correct answer:** C
**Explanation:** The description is what the coordinator reads to choose between subagents. Treat it like a function docstring: what it does, when to use it, when not to. The prompt drives the subagent's behaviour *after* selection; tools and model affect capability, not routing.

---

**Q16.** You want to explore two alternative refactoring strategies in parallel, both starting from the same expensive codebase analysis that already finished. Which mechanism is appropriate?

A) Spawn two independent subagents from scratch, each repeating the codebase analysis.
B) Use `fork_session` to create two independent branches from the shared analysis baseline.
C) Run the two strategies sequentially in the same session.
D) Use `--resume` with two different session names to load the analysis.

**Correct answer:** B
**Explanation:** `fork_session` is designed for exactly this — independent branches that share an expensive computed state. Repeating the analysis (A) wastes the work; sequential exploration (C) defeats the parallelism goal; `--resume` continues one named session, not branching.

---

**Q17.** A coordinator prompt reads, "Call `web_search` then call `document_analysis` then call `synthesise`." What is the principal weakness of this prompt style?

A) It uses procedural instructions where goal-oriented instructions adapt to varying queries; subagents become rigid sequencers rather than capable workers.
B) It does not mention the `Task` tool by name.
C) It lacks emojis to attract attention.
D) It is too short to be effective.

**Correct answer:** A
**Explanation:** Goal-oriented coordinator prompts ("research X, achieve coverage Y, cite sources Z") give subagents room to adapt. Procedural prompts encode one fixed workflow and break when query shape varies. Mentioning `Task` belongs in `allowedTools`; length and emojis are irrelevant.

---

**Q18.** Two subagents share findings via metadata. The web search subagent returns a JSON array of `{claim, source_url, snippet, date}` objects. The synthesis subagent's input prompt receives a flattened paragraph: "Research found that X based on a study, and Y is also true." Where in the pipeline did attribution break?

A) The web search subagent — it should have returned a single prose summary.
B) The coordinator — when assembling the synthesis subagent's prompt, structured metadata was collapsed into prose.
C) The synthesis subagent — it should re-fetch the original sources itself.
D) The user — for not asking for citations.

**Correct answer:** B
**Explanation:** The coordinator is the data plumber between subagents. If the web search subagent returned structured data and the synthesis subagent received prose, the coordinator flattened it. The fix is to preserve structure when forming the next prompt.

---

**Q19.** Which is the correct way to think about a subagent's context at invocation?

A) The subagent automatically inherits the coordinator's full conversation history.
B) The subagent has access to all tool results from prior coordinator turns.
C) The subagent's universe is exactly what the coordinator put in its prompt — nothing else.
D) The subagent reads a shared memory file written by the coordinator.

**Correct answer:** C
**Explanation:** Subagents do not inherit context, do not share memory, and do not see prior coordinator tool results. The prompt is the universe. This is the most-misunderstood concept in multi-agent design.

---

### TS 1.4 — Workflow Enforcement & Handoff

**Q20.** Your customer support agent occasionally calls `process_refund` before verifying customer identity via `get_customer`, leading to refunds on misidentified accounts. The system prompt already says "always verify the customer first." You have observed a 7% bypass rate in production. What is the most effective fix?

A) Rewrite the system prompt with bolded, capitalised instructions emphasising the verification step.
B) Add 10 few-shot examples to the system prompt demonstrating the correct ordering.
C) Implement a programmatic prerequisite gate that blocks `process_refund` until `get_customer` has returned a verified customer ID.
D) Increase the verbosity of the verification message so the model is more likely to remember.

**Correct answer:** C
**Explanation:** When a single failure causes financial loss, you need deterministic enforcement (hook / prerequisite gate), not probabilistic prompt instructions. The 7% bypass rate is exactly the kind of residual error prompts cannot eliminate. Prompts and few-shots cap out around 98%; hooks deliver 100%.

---

**Q21.** Which of the following business rules **most clearly** requires programmatic enforcement (a hook) rather than prompt-based guidance?

A) Use British English in all customer-facing responses.
B) Avoid using emojis unless the customer used one first.
C) Refunds above £500 must be approved by a supervisor and never processed automatically.
D) Address the customer by first name in the opening sentence.

**Correct answer:** C
**Explanation:** Financial limits + escalation gates = hooks. The other rules are stylistic — a 99% adherence is acceptable because failures are not consequential. Hooks are reserved for compliance, financial, safety, security, and legal risks.

---

**Q22.** A customer support agent escalates to a human reviewer. Which information must be included in the handoff payload so the reviewer can act without reading the conversation transcript?

A) Customer ID, conversation summary, root cause analysis, action taken so far, recommended action, and compliance flags.
B) Just the conversation transcript so the reviewer has full context.
C) The customer's email address so the reviewer can re-initiate contact.
D) A confidence score from the agent indicating how unsure it is.

**Correct answer:** A
**Explanation:** Handoff payloads are designed to be self-contained — the reviewer should not need to scroll the chat. The exam-tested missing items are *root cause analysis* and *recommended action* (including refund amount). Sending only the transcript shifts burden onto the reviewer; just an email is incomplete; a confidence score isn't actionable.

---

**Q23.** A customer message reads, "My order #8891 hasn't arrived and you've charged my card twice." How should a well-designed agent process this multi-concern request?

A) Pick the most important concern and address it; ask the customer to resend the rest separately.
B) Decompose into two distinct concerns, investigate each in parallel sharing context, then synthesise a single unified resolution.
C) Escalate immediately because the request involves two unrelated issues.
D) Process them sequentially in the order they appear, never running tools in parallel.

**Correct answer:** B
**Explanation:** Multi-concern requests are decomposed into distinct items, investigated in parallel with shared context, and resolved in a single synthesised response. A loses information; C is unnecessary escalation; D adds avoidable latency.

---

**Q24.** Which of the following is **not** a valid use case for an Agent SDK `PreToolUse` hook?

A) Blocking a refund tool call when the amount exceeds the agent's authorisation limit.
B) Capturing the prior state hash of a database record for audit logging before the tool modifies it.
C) Normalising heterogeneous timestamps returned by different MCP tools so the model sees a uniform format.
D) Enforcing identity verification before allowing access to PII tools.

**Correct answer:** C
**Explanation:** `PreToolUse` fires *before* the tool executes, so it cannot transform tool *results*. Result normalisation belongs in `PostToolUse`. A, B, and D are all canonical PreToolUse use cases: gates, audit captures, authorisation.

---

**Q25.** Different MCP tools in your stack return timestamps in different formats (Unix epoch, ISO 8601, custom strings). The agent occasionally misinterprets these as different events. Which hook fixes this?

A) `PreToolUse` that rewrites the tool call's parameters before execution.
B) `PostToolUse` that normalises tool result data into a uniform format before the model sees it.
C) A `Stop` hook that converts the final answer.
D) No hook; rewrite the prompt to explain each format.

**Correct answer:** B
**Explanation:** `PostToolUse` is the canonical site for normalising heterogeneous tool result data — timestamps, currencies, field names, status codes. The model then reasons over a clean, consistent representation. Prompt instructions cannot reliably normalise structured data; PreToolUse fires too early; Stop is for end-of-loop, not per-tool.

---

**Q26.** A team is debating whether to enforce a "refunds over £200 require manager approval" rule via a system prompt instruction or a PreToolUse hook. Which framing best captures the difference?

A) Hooks are slower than prompts; use prompts unless latency is acceptable.
B) Prompts request behaviour with ~98% reliability; hooks require behaviour with 100% reliability. For financial rules, only the latter is acceptable.
C) Hooks and prompts are interchangeable; use whichever is easier to implement.
D) Hooks should be reserved for stylistic decisions; prompts handle financial logic.

**Correct answer:** B
**Explanation:** The decision rule for high-stakes scenarios is deterministic enforcement, period. Prompts are probabilistic and cap out around 95-98%; hooks are deterministic and deliver 100%. Latency is negligible; the two are not interchangeable for financial logic; D inverts the rule.

---

### TS 1.5 — Agent SDK Hooks

**Q27.** Which of the following keyword-trigger phrases in an exam question would most strongly point to a `PreToolUse` hook as the answer?

A) "The model is confused by varying tool output formats."
B) "Capture the prior state of the record before the tool modifies it for audit logging."
C) "PII is leaking into the final response."
D) "Tool result data needs redaction before the model processes it."

**Correct answer:** B
**Explanation:** "Prior state," "pre-condition," "before X happens" → PreToolUse. Format normalisation, redaction of *results*, and PII surfacing in *output* are all PostToolUse or output-layer concerns.

---

**Q28.** When should you prefer a hook over a subagent for enforcing a behaviour?

A) When the requirement is a rule that must be enforced deterministically, regardless of model judgement.
B) When the requirement involves different reasoning, a different prompt, or a different toolset.
C) When the team prefers a particular code style.
D) When you want to reduce model token consumption.

**Correct answer:** A
**Explanation:** Rules → hooks. Capabilities → subagents. A hook enforces; a subagent reasons. Token consumption is not the primary axis; B describes a subagent's role; C is unrelated.

---

**Q29.** A team adds a PreToolUse hook that "ranks tools by suitability for the current user query and reorders them." This is presented as a hook implementation. What is the fundamental problem with this approach?

A) PreToolUse hooks do not have access to user query text.
B) Hooks gate, block, or transform tool calls — they do not influence the model's tool selection ranking. Use tool descriptions and prompts for that.
C) The hook must be PostToolUse to influence ranking.
D) Hooks add too much latency to be used for ranking.

**Correct answer:** B
**Explanation:** Hooks operate at the tool-execution boundary; they cannot change which tool the model decides to call. Tool selection is governed by tool descriptions, system prompt content, and `tool_choice`. Reaching for a hook to do ranking is a layer-confusion error. C is wrong; D is not the primary issue.

---

### TS 1.6 — Task Decomposition Strategies

**Q30.** Your team needs to review all pull requests for security, performance, accessibility, and test coverage. The four checks always run on every PR and are largely independent. Which decomposition pattern best fits?

A) Fixed sequential pipeline — each check feeds the next.
B) Orchestrator–worker — N uniform workers, each handling a different sub-aspect, prompts supply scope.
C) Evaluator–optimiser — iterate until the PR passes.
D) Single-agent loop with all tools, no decomposition.

**Correct answer:** B
**Explanation:** Uniform workers differentiated only by prompt-supplied scope = orchestrator–worker. A would force sequential ordering that is not needed; C is for tasks where quality criteria are checkable and iteration matters; D is the pre-multi-agent baseline, and works here only if the PR is small.

---

**Q31.** You are designing an automated agent to "add comprehensive tests to a 50-file legacy codebase." There is no pre-known list of test cases. Which decomposition strategy applies?

A) Fixed sequential pipeline — every file processed identically.
B) Dynamic adaptive decomposition — first map the structure, identify high-impact areas, then plan subtasks based on findings.
C) Evaluator–optimiser — iterate from a single test file until coverage is hit.
D) Orchestrator–worker with one worker per file, all in parallel.

**Correct answer:** B
**Explanation:** When subtasks depend on what is discovered during exploration, fixed pipelines fail. Dynamic decomposition is appropriate: explore → prioritise → plan → execute. Orchestrator–worker presumes you know all subtasks up front; evaluator–optimiser presumes a measurable quality criterion that "comprehensive tests" lacks.

---

**Q32.** When should you reach for the **evaluator–optimiser** pattern?

A) When quality criteria are objectively checkable (coverage %, citation count, schema compliance) and first-pass output is often inadequate.
B) When quality criteria are subjective (writing voice, persuasiveness).
C) When you need maximum parallelism.
D) When you have exactly two subagents.

**Correct answer:** A
**Explanation:** Evaluator–optimiser requires a reliable evaluator. Subjective criteria spin the loop without convergence. Parallelism and agent count are orthogonal.

---

**Q33.** A multi-agent system is producing excellent output, but at 5x the cost of a single-agent loop on the same problem. The complexity is moderate, not exceptional. What does the exam treat as the principle here?

A) Multi-agent always wins; double down on the orchestration.
B) Single agent beats multi-agent when single suffices. Multi-agent is warranted only when the single agent genuinely cannot do the job.
C) Multi-agent is required for any task involving three or more steps.
D) Cost is irrelevant in production systems.

**Correct answer:** B
**Explanation:** Multi-agent adds latency, cost, and failure surface. Use it only when needed. This is one of the three global rules in Domain 1.

---

**Q34.** A "review every file individually, then run a cross-file integration pass" pattern fits which decomposition style?

A) Prompt chaining (a fixed sequential pipeline that splits work into focused passes).
B) Orchestrator–worker.
C) Evaluator–optimiser.
D) Dynamic adaptive decomposition.

**Correct answer:** A
**Explanation:** Prompt chaining is a fixed pipeline where each step has a focused scope: per-file analysis pass → cross-file integration pass. Each step's output feeds the next. The integration pass is the second step in the chain.

---

### TS 1.7 — Session State, Resumption, and Forking

**Q35.** You stopped a long codebase analysis session three days ago and want to continue it today. The files you analysed previously have been modified in the meantime. Which approach best preserves accuracy?

A) Resume with `--resume <session-name>`, no further information needed.
B) Start a new session with a structured summary of prior findings injected into the initial prompt.
C) Resume with `--resume <session-name>`, then inform the agent which specific files have changed so it can re-analyse only those.
D) Force the agent to re-run the entire analysis from scratch.

**Correct answer:** C
**Explanation:** Resuming is fine when the prior context is *mostly* valid; explicitly informing the agent about file changes triggers targeted re-analysis rather than blind reliance on stale tool results. (B) is appropriate when prior tool results are *broadly* stale; (A) misses the file changes; (D) wastes work.

---

**Q36.** Which is the correct distinction between `--resume <session-name>` and `fork_session`?

A) `--resume` reopens one session and continues it linearly. `fork_session` creates independent branches from a shared baseline, useful for exploring divergent approaches in parallel.
B) `--resume` is for interactive use; `fork_session` is for CI only.
C) `--resume` requires explicit context injection; `fork_session` does not.
D) They are identical with different names.

**Correct answer:** A
**Explanation:** Resume is linear continuation. Fork creates parallel branches that share a baseline. Use fork when you want to explore "what if we did X vs Y" from the same expensive analysis.

---

**Q37.** A long-running agent risks crashing mid-task. What pattern survives a crash without losing all progress?

A) Increase the model's max_tokens to keep the conversation longer.
B) Have each agent export structured state (a manifest) to a known file at checkpoints. On resume, the coordinator loads the manifest and injects it into the resumed agent's prompts.
C) Use temperature=0 so the agent's behaviour is reproducible.
D) Rely on session resumption alone with `--resume`.

**Correct answer:** B
**Explanation:** Manifest files are the source of truth across crashes, not conversation history. The coordinator loads the manifest on resume. Larger max_tokens, deterministic temperature, and naive session resume don't address crash recovery: the conversation may not be replayable, and tool results may be stale.

---

**Q38.** You are unsure whether to resume a long session or restart fresh with a structured summary. Which heuristic helps?

A) Always resume; sessions exist for that reason.
B) Always restart; fresh context is more reliable.
C) Resume when prior context is mostly valid. Restart with a summary when prior tool results are stale, files have changed, or the agent referenced "typical patterns" rather than session-specific facts.
D) Decide based on session length only — short = restart, long = resume.

**Correct answer:** C
**Explanation:** Resume vs restart-with-summary is a judgement call based on staleness. The exam tests the *staleness* dimension, not session length per se. Always-resume and always-restart are both wrong.

---

### Anti-Patterns & Distractors (Domain 1 Coverage)

**Q39.** Which of the following is the WORST way to make a customer support agent escalate certain cases?

A) Add an `escalate_to_human` tool with explicit categorical criteria in its description.
B) Have the agent self-report a confidence score (1-10) and escalate when it falls below 7.
C) Add an explicit escalation criterion with few-shot examples to the system prompt demonstrating when to escalate.
D) Implement a PreToolUse hook that intercepts non-escalation tool calls when a policy gap is detected.

**Correct answer:** B
**Explanation:** Self-reported confidence is poorly calibrated — agents are often *most* confident on the hardest cases (motivated reasoning). Sentiment-based and confidence-based escalation are the two unreliable triggers. The other three are valid: tool description with criteria, few-shot guidance, programmatic hook.

---

**Q40.** A customer says, "Just connect me to a human, I don't want to talk to a bot." What should a well-designed agent do?

A) Acknowledge the request and resolve the issue first to demonstrate value, then escalate if the customer remains dissatisfied.
B) Escalate immediately to a human, without attempting investigation, because the customer made an explicit request.
C) Ask the customer to clarify whether they really want a human.
D) Run sentiment analysis to confirm the customer is genuinely frustrated.

**Correct answer:** B
**Explanation:** Explicit human request = escalate immediately, even for trivially solvable issues. The cost of overriding an explicit preference is enormous. A patronisingly asks for confirmation; D introduces an unreliable inference step; the explicit request is the explicit request.

---

**Q41.** Your agent calls `get_customer` and receives multiple matches for "John Smith." What is the correct disambiguation strategy?

A) Pick the most recently active account; it is most likely the one the customer means.
B) Ask the customer for an additional identifier (email, order number, postcode).
C) Run all subsequent operations on every matched account in parallel.
D) Pick based on order details the customer mentioned, even if they do not exactly match any account.

**Correct answer:** B
**Explanation:** Ambiguous matches are resolved by asking for a disambiguator, never by heuristic. The cost of one extra turn is negligible; the cost of acting on the wrong account is huge (wrong refund, wrong PII exposure).

---

**Q42.** A subagent fails with a timeout. Which error propagation strategy enables the coordinator to make a recovery decision?

A) Return `{"results": [], "status": "ok"}` so the coordinator can continue gracefully.
B) Catch the exception silently and log it for later review.
C) Return structured error context: failure type, the query that was attempted, any partial results, and potential alternative approaches.
D) Terminate the entire pipeline so the user is not given misleading partial output.

**Correct answer:** C
**Explanation:** Structured error context enables intelligent recovery. Silent suppression (A, B) is the worst pattern — it hides failures behind apparent success. Pipeline termination (D) throws away other subagents' successful results.

---

**Q43.** Which is the canonical anti-pattern when two subagents fail intermittently in a research pipeline?

A) Classify errors into transient, validation, business, and permission categories and respond appropriately.
B) Retry every error with the same input, the same delay, and the same retry limit.
C) Use exponential backoff with jitter for transient errors.
D) Propagate non-retryable errors immediately without retry.

**Correct answer:** B
**Explanation:** Blanket retry across all error categories is wasteful (for permanent errors), risky (for business errors), and may double-process (for non-idempotent transient retries). Always classify first. The other three are correct practices.

---

**Q44.** Your agent occasionally double-charges customers when a transient API failure prompts a retry. What is the minimum fix?

A) Disable retries entirely.
B) Generate an idempotency key (UUID or hash of `{operation + customer + amount}`) on the first attempt and pass it on every retry; the server deduplicates.
C) Lower the retry timeout so retries are less likely.
D) Lower the temperature to make retries deterministic.

**Correct answer:** B
**Explanation:** Idempotency keys deduplicate on the server side, so retries are safe. Disabling retries trades reliability for safety; timeout and temperature don't address the root cause (the server has no way to recognise the duplicate).

---

**Q45.** A high-stakes question on the exam describes a scenario where you must guarantee a tool call happens before another tool call. Across the four answer options, which option is **most likely** to be the correct one?

A) "Add a stronger instruction to the system prompt to ensure the model calls the prerequisite tool first."
B) "Increase the model's temperature to encourage broader tool exploration."
C) "Implement a PreToolUse hook (or programmatic prerequisite gate) that blocks the downstream tool call until the prerequisite has completed."
D) "Route the request through a specialised subagent whose prompt emphasises the ordering."

**Correct answer:** C
**Explanation:** The "four-distractor pattern" for high-stakes ordering: option 1 is always the hook/gate; the others are probabilistic wraps that all fail under load. Memorise this shape.

---

**Q46.** Which observation suggests a multi-agent system's coordinator is partitioning research scope too narrowly across subagents?

A) Sources appear in the final output that are not relevant to the requested topic.
B) Major subdomains of the requested topic are entirely missing from the output, even though all subagent executions look complete.
C) Citations are formatted inconsistently across sections.
D) The system takes longer than expected to complete.

**Correct answer:** B
**Explanation:** Narrow partitioning → major chunks of the topic never get assigned to any subagent → output covers only what was assigned. (A) suggests a relevance/filter problem; (C) is a formatting issue; (D) is performance.

---

**Q47.** A coordinator wants to spawn three parallel subagents. The total subagent prompt sizes add up to 60% of the coordinator's context budget. Which design choice should you reconsider?

A) Reduce the number of subagents to one to save context.
B) Modify subagents to return structured key findings only (claims, citations, relevance), not verbose reasoning or full document quotes. The coordinator's context budget should be focused on coordination, not subagent prose.
C) Use a larger context window to fit all three subagent prompts.
D) Move subagent invocation to a sequential loop.

**Correct answer:** B
**Explanation:** The cheapest place to fix downstream context bloat is upstream. Subagent return shape should be structured key facts, not narrative. Reducing the count or going sequential breaks parallelism gains; larger context windows treat the symptom, not the cause.

---

**Q48.** A research system frequently hits long execution times. Profiling shows the coordinator spawns subagents sequentially: web search, then document analysis, then synthesis. Web search and document analysis are independent. What is the most leveraged fix?

A) Spawn web search and document analysis in parallel via two `Task` blocks in a single coordinator response; then invoke synthesis sequentially after both return.
B) Move all three subagents to parallel execution, including synthesis.
C) Reduce each subagent's prompt size to make them faster.
D) Increase the coordinator's `max_tokens` parameter.

**Correct answer:** A
**Explanation:** Parallel where independent, sequential where dependent. Synthesis depends on the other two, so it must run after. Pure parallelism with synthesis (B) breaks the dependency; prompt-size and max_tokens don't change the structural latency.

---

**Q49.** A coordinator's `allowedTools` lists `["WebSearch", "Read", "Grep"]`. The coordinator never delegates to subagents. What is missing?

A) `"Task"` is not in `allowedTools`, so the coordinator has no mechanism to invoke subagents.
B) `"Subagent"` is not in `allowedTools`.
C) The coordinator's prompt does not mention subagents.
D) The subagents' descriptions are missing.

**Correct answer:** A
**Explanation:** `Task` is the only mechanism to spawn subagents. Without it in `allowedTools`, the coordinator physically cannot delegate. There is no `"Subagent"` tool name; prompt mentions of subagents won't conjure the capability; descriptions affect selection quality, not invocation.

---

**Q50.** You observe that an agent is "stuck": it produces an assistant turn with `stop_reason: "tool_use"`, you execute the tool, return the result, and the next assistant turn re-issues the *same* tool call with the *same* arguments. What is the most likely cause?

A) The tool result was not appended to the conversation history before the next request.
B) The model is intentionally re-querying because it didn't trust the first result.
C) `temperature` is set to 0.
D) The model is broken; switch to a different model.

**Correct answer:** A
**Explanation:** When tool results are not appended to the history, each iteration sees an identical conversation state and Claude produces an identical action. This is a harness bug, not a model bug. Re-querying intentionally would produce *different* arguments; temperature and "broken model" are unrelated.

---

## Domain 2: Tool Design & MCP Integration (Q51–Q85)

### TS 2.1 — Tool Interface Design

**Q51.** Two MCP tools have descriptions "Retrieves customer information" and "Retrieves order details." Production logs show the agent calls the wrong tool ~22% of the time. Which fix should you try **first**?

A) Train a routing classifier model that pre-selects the correct tool from user queries.
B) Expand each tool's description to include input format, example queries, edge cases, and explicit boundary clauses against the other tool.
C) Merge both into a single `lookup_entity` tool that accepts any identifier.
D) Add 12 few-shot examples to the system prompt demonstrating the correct selection.

**Correct answer:** B
**Explanation:** Tool descriptions are the routing layer. Misrouting is a description problem until proven otherwise — and the cheapest fix is to expand descriptions. Routing classifiers add a model call and a new failure point; merging tools loses useful semantic distinction; few-shot examples treat the symptom while adding token overhead on every call.

---

**Q52.** A tool description contains the phrase "processes refunds, partial refunds, store credits, or exchanges depending on customer status." The model misroutes calls to this tool. Which fix is structurally correct?

A) Rename the tool to `process_customer_request` to better reflect its breadth.
B) Add few-shot examples showing each variant.
C) Split into purpose-specific tools (`issue_full_refund`, `issue_partial_refund`, `issue_store_credit`, `process_exchange`) each with tight contracts.
D) Add `tool_choice: "any"` so the model always calls some tool.

**Correct answer:** C
**Explanation:** "Or" and "depending on" between behaviours in a tool description signal that the tool is unsplittable at runtime — the model cannot route reliably. The fix is to split into purpose-specific tools, not to rename or add examples to a fundamentally generic tool. `tool_choice: "any"` does not improve routing among variants.

---

**Q53.** After expanding tool descriptions, misrouting persists. The system prompt contains the instruction "Always look up the customer first." Both tools accept customer-like identifiers. What should you check?

A) Whether the system prompt is competing with the tool descriptions through keyword-sensitive instructions that unintentionally bias selection.
B) Whether the model needs a longer context window.
C) Whether the temperature is too high.
D) Whether a routing classifier is required.

**Correct answer:** A
**Explanation:** System-prompt keywords can override well-written tool descriptions. After fixing descriptions, audit the system prompt for keyword conflicts. Don't double-down on more prompt routing rules; remove the conflicting associations.

---

**Q54.** Which of the following is **not** one of the five required components of a production-grade tool description?

A) Primary purpose (one sentence).
B) Input contract (formats, types, constraints).
C) Example queries it handles well.
D) Author name and version.

**Correct answer:** D
**Explanation:** The five components are: primary purpose, input contract, example queries, edge cases and limitations, and explicit boundaries vs. similar tools. Author and version may live in metadata but are not part of the description that the model consumes.

---

**Q55.** Which of the following correctly distinguishes when to rename vs. split a tool?

A) Rename when the tool's behaviour is wrong; split when the name is misleading.
B) Rename when a single behaviour needs clearer surface description; split when the tool performs distinct behaviours under different conditions.
C) Always split; renaming never works.
D) Always rename; splitting adds maintenance overhead.

**Correct answer:** B
**Explanation:** Renaming repairs a single-behaviour description that's mis-named. Splitting repairs a multi-behaviour tool — "or" / "depending on" branching in the description. The exam tests this distinction repeatedly.

---

### TS 2.2 — Structured Error Responses

**Q56.** An MCP tool fails because the database is unreachable. What is the correct error response shape so the agent can recover intelligently?

A) Return `{"results": [], "status": "ok"}` so the agent treats this as no results.
B) Return `{"isError": true, "errorCategory": "transient", "isRetryable": true, "description": "Database temporarily unreachable. Retry in a few seconds."}`.
C) Throw an exception that terminates the conversation.
D) Return `{"isError": true, "errorCategory": "business", "isRetryable": false, "description": "Operation failed."}`.

**Correct answer:** B
**Explanation:** Database unreachable = transient access failure, retryable. Empty-array silent suppression is the worst pattern; raising exceptions kills the loop; mis-classifying as a business error blocks legitimate retry.

---

**Q57.** What is the canonical 2.2 exam trap that conflates two response shapes?

A) Treating retryable errors as non-retryable.
B) Treating transient errors as permission errors.
C) Returning empty array `[]` for both "valid empty result (no matching customer)" AND "access failure (database unreachable)" — agents then retry endlessly on the empty answer.
D) Wrapping all errors in a generic "Operation failed" message.

**Correct answer:** C
**Explanation:** "Tool couldn't look" ≠ "tool looked and found nothing." Same empty surface, opposite correct behaviours. Distinguishing them with `isError` and `errorCategory` is the entire reason structured error responses exist.

---

**Q58.** A refund tool encounters a customer-side rule violation: refund amount exceeds the agent's authorisation. Which error shape is correct?

A) `{"isError": true, "errorCategory": "transient", "isRetryable": true}`
B) `{"isError": true, "errorCategory": "business", "isRetryable": false, "description": "Refund of £450 exceeds £200 self-service limit. Customer must speak with a supervisor."}`
C) `{"isError": false, "results": []}`
D) `{"isError": true, "errorCategory": "validation", "isRetryable": true}`

**Correct answer:** B
**Explanation:** Business errors (policy violation) are not retryable by the agent. The description should be customer-friendly because the agent will surface it. Mis-classifying as transient or validation invites futile retries; empty result is silent suppression.

---

**Q59.** Which is the correct retryability semantics?

A) Transient retryable = retry with the same input; validation retryable = retry only after correcting input.
B) Transient retryable = retry after correcting input; validation retryable = retry with the same input.
C) Both transient and validation should be retried with the same input.
D) Neither should ever be retried; escalate everything.

**Correct answer:** A
**Explanation:** Transient = same input later (timeout passes, service comes back). Validation = different input (corrected format / fields). Retrying validation with the same input loops forever.

---

**Q60.** A subagent transiently fails. How should it report the failure to the coordinator?

A) Always propagate every failure up to the coordinator immediately.
B) Perform local recovery first (retry, fallback source). Only propagate what cannot be resolved locally — and include what was attempted plus partial results.
C) Silently fail and return empty results to keep the pipeline flowing.
D) Terminate the entire workflow.

**Correct answer:** B
**Explanation:** Local recovery first; propagate only what can't be resolved locally. The propagation must include attempted query and partial results so the coordinator can make an intelligent decision. Silent failure and pipeline termination are both anti-patterns.

---

### TS 2.3 — Tool Distribution & `tool_choice`

**Q61.** A subagent has 18 tools and frequently selects suboptimal ones. Production sweet spot is ~4-5 tools per agent. Which corrective approach best fits?

A) Combine all 18 tools into one generic dispatcher tool.
B) Scope tools by agent role: split the 18 tools across multiple specialist agents (4-5 each), so each agent has only the tools relevant to its role.
C) Increase the model's context window so all 18 tool descriptions fit.
D) Reduce each tool's description to one sentence to save tokens.

**Correct answer:** B
**Explanation:** Reliability degrades past 7-10 tools per agent — softmax over descriptions thins probability margins. The fix is to scope tools to roles, not to compress descriptions or combine tools into a dispatcher. Larger context windows don't address selection reliability.

---

**Q62.** A workflow requires "extract intent before routing" as a mandatory first step. The system prompt says so, and 15% of messages still skip the extraction. What is the correct fix?

A) Add more emphatic prompt instructions.
B) Set `tool_choice: {"type": "tool", "name": "extract_intent"}` on the first turn; switch to `"auto"` for subsequent turns.
C) Set `tool_choice: "any"` so the model must call some tool.
D) Validate after the fact and re-invoke if extraction was skipped.

**Correct answer:** B
**Explanation:** Named-tool forcing is the deterministic way to mandate a specific first tool. Prompts request; `tool_choice` requires. `"any"` lets the model pick a different tool; after-the-fact validation is the wrong layer (too late, adds latency).

---

**Q63.** The synthesis agent in a research pipeline frequently needs simple fact verifications (date, name, statistic). Currently, verification round-trips through the coordinator and then the web search agent, adding 2-3 turns and 40% latency. 85% of verifications are simple lookups. What is the correct fix?

A) Give the synthesis agent the full `web_search` and `fetch_page` tools.
B) Give the synthesis agent a scoped, constrained `verify_fact(claim, max_sources=3)` tool, with the tool description explicitly stating that complex multi-source verifications must still route back to the coordinator.
C) Merge the synthesis and coordinator agents.
D) Cache previous verification results.

**Correct answer:** B
**Explanation:** This is the Q9-style pattern (verbatim from the exam guide): for high-frequency simple operations across roles, give the consuming agent a *constrained* version of the capability, with explicit fallback. Full `web_search` defeats role scoping. Merging agents destroys architecture. Caching can't help with novel claims.

---

**Q64.** Which `tool_choice` setting guarantees structured output when you have multiple extraction tools and the document type is unknown?

A) `"auto"`
B) `"any"`
C) `{"type": "tool", "name": "extract_invoice"}`
D) Omit `tool_choice` entirely.

**Correct answer:** B
**Explanation:** `"any"` forces the model to call *some* tool but lets it choose which — perfect for heterogeneous documents where different tools fit different types. `"auto"` lets the model return text; named-tool would force a wrong tool on most documents; omitting defaults to `"auto"`.

---

**Q65.** Which is true about giving a generic `fetch_url` tool to an agent?

A) It is always preferred over a constrained alternative.
B) It should be replaced with a constrained alternative (e.g., `load_document` that validates document URLs and content types) to reduce blast radius while preserving capability.
C) It does not affect tool selection reliability.
D) It is required by the Anthropic SDK.

**Correct answer:** B
**Explanation:** Replacing generic powerful tools with constrained alternatives is a recurring exam pattern. Same capability, narrower surface, reduced risk (no script injection, no fetching arbitrary endpoints).

---

### TS 2.4 — MCP Server Integration

**Q66.** A team's `.mcp.json` contains `"env": {"JIRA_API_TOKEN": "ATATT3xFf_actual_token_here"}`. The file is committed to git. What is the correct fix?

A) Add `.mcp.json` to `.gitignore` so the file is no longer shared.
B) Move the server config to `~/.claude.json` so it is no longer shared.
C) Change to `"env": {"JIRA_API_TOKEN": "${JIRA_API_TOKEN}"}` and have each developer set the variable locally. Also rotate the leaked token because git history is forever.
D) Encrypt the token in place using a custom encryption scheme.

**Correct answer:** C
**Explanation:** "Shared config, personal credentials." Use `${VAR}` expansion in the committed file; each developer sets the env var locally. Also rotate the leaked token. Adding to gitignore defeats team sharing; moving to `~/.claude.json` removes the integration from teammates; in-place "encryption" is security theatre.

---

**Q67.** Which scoping is correct for a team-wide MCP server config?

A) `~/.claude.json` (user level).
B) `.mcp.json` (project level, committed via version control).
C) `/etc/claude/global.mcp.json` (system level).
D) Both `~/.claude.json` and `.mcp.json`, redundantly.

**Correct answer:** B
**Explanation:** Project-level `.mcp.json` is committed and shared. User-level `~/.claude.json` is for personal experimentation. There is no system-level config; redundancy invites drift.

---

**Q68.** Your agent makes many exploratory tool calls at the start of conversations to discover what content is available. How can you reduce this overhead?

A) Tell the user to be more specific.
B) Expose MCP **resources** that catalogue available content (e.g., `jira://projects/INGEST/summary`, `db://schemas/orders`) — the agent reads the catalogue once, then queries precisely.
C) Cache previous tool call results across conversations.
D) Remove the exploratory tools.

**Correct answer:** B
**Explanation:** MCP resources expose content catalogues (vs tools which expose actions). Catalogues let the agent see what's available without probing. Caching across conversations introduces staleness; removing tools breaks workflows; better user briefing is unrelated.

---

**Q69.** When should you build a custom MCP server instead of using a community-maintained one?

A) Always — custom servers are more reliable.
B) When a community server fundamentally cannot support the workflow, or for team-specific internal systems, or when compliance prohibits the community one.
C) When the community server returns too much data.
D) When you want to support a different programming language.

**Correct answer:** B
**Explanation:** Exam preference: "configuration over construction" and "fork over fresh build." Custom servers are reserved for team-specific systems or genuine community-server gaps. For verbose responses, post-process or fork.

---

**Q70.** Agents reach for built-in Grep instead of an MCP code search tool with semantic capabilities. What is the corrective action?

A) Remove Grep from the toolset.
B) Enhance the MCP tool's description with examples and explicit boundary clauses (e.g., "Use this for semantic queries like 'where do we handle payment retries'. Prefer Grep for exact-string searches like 'TODO: fix'.").
C) Add a hook that blocks Grep calls.
D) Increase the model's context window so it can see all alternatives clearly.

**Correct answer:** B
**Explanation:** Built-in vs MCP tool overlap is a description-quality problem. Enhance MCP descriptions with examples and explicit boundary clauses against the built-ins. Removing Grep over-restricts; hook-blocking is the wrong layer.

---

### TS 2.5 — Built-in Tools

**Q71.** Which tool is appropriate for "find all callers of `formatDate` across the codebase"?

A) Glob with pattern `**/*.{ts,tsx}`.
B) Grep with pattern `formatDate(`.
C) Read every file in the directory and look for the string.
D) Edit the codebase to add comments at each call site.

**Correct answer:** B
**Explanation:** Callers = content search → Grep. Glob matches file paths, not function calls. Reading every file kills the context budget; editing is destructive.

---

**Q72.** Which tool is appropriate for "find all React component files"?

A) Glob with pattern `**/*.tsx`.
B) Grep with pattern `import React`.
C) Both, in sequence: Glob first to enumerate, Grep to filter.
D) Bash with `find` and `xargs grep`.

**Correct answer:** A
**Explanation:** "Files matching name/extension" → Glob. Grep on `import React` could miss components that don't import React explicitly (or include false positives in non-component files). Glob is the cleaner, direct mechanism.

---

**Q73.** An Edit call fails with "multiple matches for the old_string anchor." What is the correct **first** move?

A) Use `sed` instead.
B) Delete the file and recreate it with the new content.
C) Expand the `old_string` anchor with surrounding context until it is unique.
D) Set `replace_all: true` automatically.

**Correct answer:** C
**Explanation:** Edit's failure-escalation ladder: expand the anchor first. Read + Write is the second move when no unique anchor exists. `replace_all` is correct only when you genuinely want every occurrence changed. `sed` is the wrong tool category.

---

**Q74.** A task requires "find all callers of `legacyAuth`, then find the test files for those callers." Which sequence is correct?

A) Grep for `legacyAuth(` to find caller files; derive caller names; Glob for `**/{caller1,caller2}.test.{ts,tsx}` to find the related tests.
B) Glob first to enumerate all files, then Grep within each.
C) Read every file, then post-process.
D) Run a single Grep over the entire codebase for both `legacyAuth` and `test`.

**Correct answer:** A
**Explanation:** Content-seeded discovery (find usages → find their tests) goes Grep → Glob. The seed is content; the filter is path. Reverse only when the seed is a known file set.

---

**Q75.** A task requires "understand a 50-file codebase." Which strategy preserves context budget?

A) Read every file upfront and reason over the full contents.
B) Use Grep for entry points first, Read only the entry point, then Grep again for the identifiers found, Read selectively.
C) Use Glob to list all files, then Read the first 10.
D) Use Write to create a summary file before reading anything.

**Correct answer:** B
**Explanation:** Incremental codebase understanding: Grep for entry points → Read selectively → Grep for the identifiers found → Read selectively. Reading 50 files upfront destroys the context budget.

---

### Additional Tool Design & MCP Questions

**Q76.** A subagent has the tool `verify_fact`. Its description is "Verifies a fact." Production logs show the model rarely calls it, preferring to escalate to the coordinator. What is the cause?

A) The tool name is too short.
B) The description is minimal; the model lacks context to differentiate `verify_fact` from coordinator escalation. Expand the description with purpose, inputs, example queries, edge cases, and explicit boundary against escalation.
C) The agent's temperature is too low.
D) The agent should be merged with the coordinator.

**Correct answer:** B
**Explanation:** Minimal descriptions undermine adoption. Tool descriptions are the model's only routing signal. The fix is description expansion. Name length is not the bottleneck; temperature is unrelated; merging defeats role separation.

---

**Q77.** A coordinator's tool description says `extract_metadata` should always be called before `enrich_data`. The model occasionally skips `extract_metadata`. Which is the most reliable correction?

A) Add the ordering instruction more emphatically to the system prompt.
B) Set `tool_choice: {"type": "tool", "name": "extract_metadata"}` on the first turn; switch to `"auto"` after that.
C) Hide `enrich_data` from the model until `extract_metadata` has been called.
D) Trust the model's ordering and add no enforcement.

**Correct answer:** B
**Explanation:** Mandatory first step → named-tool forcing. Hiding tools dynamically (C) is generally not natively supported in single-turn API; emphatic prompts (A) are probabilistic; trusting the model (D) is what failed.

---

**Q78.** Which is the BEST single-line description for a tool called `query_orders`?

A) "Queries orders."
B) "Returns order data."
C) "Queries the orders table by customer ID or order ID. Returns up to 50 most-recent orders with status, amount, and shipping. Use for order lookups by ID; use `search_orders` for full-text or fuzzy queries."
D) "A versatile tool that does everything you need for orders, refunds, exchanges, and more."

**Correct answer:** C
**Explanation:** Production-grade descriptions include purpose, inputs, outputs, edge cases, and boundaries against similar tools. A and B are minimal; D is "or" / "depending on" branching disguised as a description.

---

**Q79.** An MCP tool returns 40 fields when only 5 are relevant for downstream reasoning. What is the correct integration practice?

A) Append all 40 fields to context; the model will figure out which matter.
B) Pre-trim tool responses to the 5 relevant fields *before* the result enters the conversation history.
C) Increase the model's context window to absorb the noise.
D) Disable the tool and use a different one.

**Correct answer:** B
**Explanation:** Tool result noise accumulates across turns and consumes context disproportionately to its value. Trim at the integration layer before the result hits context. The other options either keep noise (A, C) or are over-reactions (D).

---

**Q80.** What is the correct response when a tool query succeeds but returns no matches (e.g., "no customer with that email")?

A) `{"isError": true, "errorCategory": "transient", "isRetryable": true}` — retry in case data appears.
B) `{"isError": false, "results": []}` — valid empty result, the answer is "no matches."
C) `{"isError": true, "errorCategory": "business", "isRetryable": false}` — empty implies a policy issue.
D) Throw an exception so the loop terminates.

**Correct answer:** B
**Explanation:** Valid empty result = `isError: false` with empty array. The tool ran successfully and found no data; that *is* the answer. Treating it as an error sends the agent into futile retries or unnecessary escalation.

---

**Q81.** An MCP tool's `description` includes phrases like "do not call this on weekends" and "may misbehave when input includes apostrophes." Which is the correct evaluation?

A) Hide these from the model; they confuse it.
B) Edge cases and limitations belong in tool descriptions because they help the model route reliably. Keep them.
C) Convert these to runtime errors and have the tool refuse.
D) Move them to a separate documentation file the agent loads if needed.

**Correct answer:** B
**Explanation:** Edge cases and limitations are one of the five required description components. They help the model decide when *not* to call the tool. Hiding or externalising them undermines selection.

---

**Q82.** A `.mcp.json` has 12 configured servers, each exposing 5-15 tools. The agent's tool selection reliability has degraded significantly. What should you do?

A) Reduce the number of configured MCP servers to those relevant to the current project.
B) Use a larger model.
C) Increase the context window.
D) Restart the agent.

**Correct answer:** A
**Explanation:** Tool discovery at connection time makes all tools from all configured servers available simultaneously — too many servers recreates the tool-overload problem at the MCP layer. Scope MCP servers to project relevance, not breadth.

---

**Q83.** What is the right way to think about MCP **tools** vs **resources**?

A) Tools and resources are interchangeable.
B) Tools = actions the agent can take. Resources = content the agent can read (catalogues, schemas, summaries).
C) Tools are for read; resources are for write.
D) Resources are deprecated.

**Correct answer:** B
**Explanation:** Tools execute actions; resources expose content. Mixing them up leads to over-tooling for content reads or under-using resources for catalogue patterns.

---

**Q84.** Which **Domain 2 distractor** describes the wrong layer?

A) "Set `tool_choice: {'type': 'tool', 'name': 'extract_intent'}` to mandate the first tool."
B) "Implement a `PreToolUse` hook to enforce mandatory tool ordering in the Anthropic API."
C) "Expand the MCP tool description to differentiate vs built-in tools."
D) "Return `isError: false, results: []` for valid empty results."

**Correct answer:** B
**Explanation:** `PreToolUse` is a Claude Code CLI harness feature, not an Anthropic API agent design primitive. For API-level agent design, the right answer is `tool_choice`, not a hook. Layer-awareness: reach for the API mechanism in API questions.

---

**Q85.** Your tool occasionally times out under heavy load. The retry budget is configured to "retry indefinitely." After 50 retries on a stuck request, you receive complaints. What is the design failure?

A) The tool description is misleading.
B) The error response should not include `isRetryable`.
C) The retry budget should be bounded with a configurable max-retries and `retryAfter` hints.
D) The tool should not be used at all.

**Correct answer:** C
**Explanation:** Even retryable errors need budgets. Well-designed tools include hints like `retryAfter` and the system enforces `maxRetries`. Indefinite retry is an operational failure mode, not a tool semantics issue.

---

## Domain 3: Claude Code Configuration & Workflows (Q86–Q125)

### TS 3.1 — CLAUDE.md Hierarchy

**Q86.** Developer A's Claude Code consistently follows the team's coding conventions. Developer B, working on the same repository on the same branch, gets inconsistent behaviour. What is the most likely cause?

A) Developer B needs to run `/memory reload`.
B) Developer A wrote the team conventions in `~/.claude/CLAUDE.md` (user-level). Since `~/.claude/` is personal and not version-controlled, Developer B's clone has no shared CLAUDE.md.
C) Developer B has a different model version installed.
D) The repository needs a `.claude/config.json` file with project settings.

**Correct answer:** B
**Explanation:** Divergent behaviour between teammates on the same repo → user-level vs project-level config bug. Conventions in `~/.claude/CLAUDE.md` live only on Developer A's machine; git never carries them. The fix is to move conventions to `.claude/CLAUDE.md` (or root `CLAUDE.md`) and commit.

---

**Q87.** A project has a CLAUDE.md at `.claude/CLAUDE.md` and another at `src/backend/CLAUDE.md`. When Claude Code operates on files in `src/api/`, which CLAUDE.md files are loaded?

A) Both the project-level and the `src/backend/` files.
B) Only the project-level `.claude/CLAUDE.md`. The `src/backend/CLAUDE.md` applies only when working in `src/backend/`.
C) Only the `src/backend/CLAUDE.md`.
D) Neither, unless explicitly invoked.

**Correct answer:** B
**Explanation:** Directory-level CLAUDE.md is scoped downward and local to its own subtree. Working in `src/api/` does NOT load `src/backend/CLAUDE.md`. Project-level CLAUDE.md applies everywhere within the repo.

---

**Q88.** Which command can verify which memory files Claude Code has currently loaded?

A) `/loaded`
B) `/memory`
C) `/config`
D) `/files`

**Correct answer:** B
**Explanation:** `/memory` lists which memory files are loaded. It's a diagnostic tool — confirms whether a file is or isn't loaded. Use it to verify, not to fix; the fix is to put the file in the correct location.

---

**Q89.** A project's CLAUDE.md has grown to 3000 lines and covers testing, API conventions, deployment, and security separately. What is the right way to organise this?

A) Keep all 3000 lines in one CLAUDE.md so context is loaded consistently.
B) Use `@import` syntax inside CLAUDE.md to reference modular files OR split into `.claude/rules/` topic files (`testing.md`, `api-conventions.md`, `deployment.md`).
C) Move 80% of the content to `~/.claude/CLAUDE.md` so it only loads on demand.
D) Delete sections you think are less important.

**Correct answer:** B
**Explanation:** Two equally valid patterns: `@import` for modular references, or `.claude/rules/` directory for topic files. Both keep CLAUDE.md focused. Keeping 3000 lines monolithic blocks the context window; moving to user-level removes content from teammates; deletion destroys knowledge.

---

**Q90.** Which combination of file paths exists in Claude Code's CLAUDE.md hierarchy?

A) `~/.claude/CLAUDE.md` (user); `.claude/CLAUDE.md` or root `CLAUDE.md` (project); `<subdir>/CLAUDE.md` (directory).
B) `/etc/claude/CLAUDE.md` (system); `.claude/CLAUDE.md` (project) only.
C) `claude.json` everywhere.
D) Only `.claude/CLAUDE.md` is supported.

**Correct answer:** A
**Explanation:** Three levels: user (`~/.claude/CLAUDE.md`), project (`.claude/CLAUDE.md` or root `CLAUDE.md`), directory (`<subdir>/CLAUDE.md`). No system-level support; no single-format constraint.

---

**Q91.** A new team member joins and clones the repo. They report that Claude Code does not follow the team's standards. The repo has a committed `.claude/CLAUDE.md`. What should you check first?

A) Whether the new member is using the same model.
B) Whether the new member has a conflicting `~/.claude/CLAUDE.md` that overrides project conventions — or whether they may not have pulled the latest branch with the committed CLAUDE.md.
C) Whether the team needs to upgrade Claude Code.
D) Whether the file is renamed correctly.

**Correct answer:** B
**Explanation:** The diagnostic instinct for divergent behaviour is the path-prefix question. Possibilities include the member's user-level config conflicting, or a stale checkout missing the committed file. Run `/memory` to see what is loaded.

---

### TS 3.2 — Custom Slash Commands and Skills

**Q92.** A team wants a `/review` slash command available to every developer when they clone the repo. Where should the command file live?

A) `~/.claude/commands/review.md`
B) `.claude/commands/review.md`
C) `CLAUDE.md` at the project root
D) `.claude/config.json` with a `commands` array

**Correct answer:** B
**Explanation:** Project-scoped commands go in `.claude/commands/` (committed via git, shared with all developers). `~/.claude/commands/` is personal. CLAUDE.md is for instructions, not command definitions. There is no `commands` array in any config.json.

---

**Q93.** A skill called `brainstorm` produces verbose output that clutters the main conversation. Which frontmatter option fixes this?

A) `output: minimal`
B) `context: fork`
C) `allowed-tools: []`
D) `argument-hint: brief`

**Correct answer:** B
**Explanation:** `context: fork` runs the skill in an isolated sub-agent; verbose output stays in the fork; only a summary returns to the main conversation. Same principle as the Explore subagent — keep noise out.

---

**Q94.** A skill should be restricted from writing files because it is "analysis only." Which frontmatter option enforces this?

A) `read-only: true`
B) `allowed-tools: [Read, Grep, Glob]`
C) `mode: analyse`
D) `restricted: true`

**Correct answer:** B
**Explanation:** `allowed-tools` restricts which tools the skill can call. Listing only Read/Grep/Glob blocks Write/Edit/Bash. The other field names do not exist in the frontmatter spec.

---

**Q95.** A skill is frequently invoked without arguments and the user is then confused about what to provide. Which frontmatter option helps?

A) `argument-hint: <feature-name>`
B) `required-args: true`
C) `usage: feature-name`
D) `prompt-for-args: true`

**Correct answer:** A
**Explanation:** `argument-hint` displays a prompt for the parameter when invoked without arguments. Other field names don't exist.

---

**Q96.** Your team has a project-scoped `/review` skill. One developer wants a stricter variant for personal use without affecting teammates. What is the correct approach?

A) Edit the project skill to add a "strict mode" flag.
B) Create a new skill in `~/.claude/skills/review-strict/SKILL.md` with personal customisations.
C) Override the team skill by creating `.claude/skills/review/strict.md`.
D) Use a CLAUDE.md instruction that adds strictness on top of the existing skill.

**Correct answer:** B
**Explanation:** Personal customisation pattern: new name, personal location, no impact on teammates. Editing the project skill affects everyone. There is no override mechanism via nested files.

---

**Q97.** Which is the correct distinction between Skills and CLAUDE.md?

A) Skills are project-scoped; CLAUDE.md is user-scoped.
B) Skills load on demand (invoked); CLAUDE.md is always loaded. Skills are for task-specific workflows; CLAUDE.md is for universal standards.
C) Skills are deprecated in favour of CLAUDE.md.
D) They are interchangeable.

**Correct answer:** B
**Explanation:** Two orthogonal categories. On-demand vs always-loaded. Task workflows vs universal standards. Category errors ("use a skill for ambient standards") fail because skills are opt-in.

---

**Q98.** A "must happen every time the code is reviewed" rule should live where?

A) In a skill in `.claude/skills/review/`
B) In a slash command in `.claude/commands/`
C) In CLAUDE.md (always loaded as ambient standards)
D) In `~/.claude/skills/` for the user only

**Correct answer:** C
**Explanation:** "Every time" = always-loaded standards. CLAUDE.md (project-level for team-wide) is the right home. Skills and commands are opt-in; user-level isn't shared.

---

**Q99.** A skill's directory is structured as `.claude/skills/migrate-component/SKILL.md`. What does the directory name become?

A) The skill's display label.
B) The skill's invocation name (e.g., `/migrate-component`).
C) An arbitrary folder name with no semantic meaning.
D) The subdirectory where the skill executes.

**Correct answer:** B
**Explanation:** The directory name is the skill's name. The invocation maps to `/migrate-component`.

---

### TS 3.3 — Path-Specific Rules

**Q100.** Test files are spread across the codebase (`src/api/__tests__/`, `src/ui/components/Button.test.tsx`, `src/utils/format.test.ts`). You want a single set of testing conventions to apply to all of them. Which mechanism fits best?

A) Create a CLAUDE.md in each directory containing tests.
B) Create a `.claude/rules/testing.md` file with YAML frontmatter `paths: ["**/*.test.*", "**/__tests__/**/*"]`.
C) Add the testing conventions to the root CLAUDE.md so they always load.
D) Create a `/test-conventions` skill that developers must invoke before writing tests.

**Correct answer:** B
**Explanation:** Pattern of files spread across the codebase → path-specific rules with glob frontmatter. Loads only when editing matching files. CLAUDE.md duplication invites drift; root CLAUDE.md burns tokens on every interaction; a slash command requires explicit invocation (not ambient).

---

**Q101.** Compared to directory-level CLAUDE.md, what is the principal advantage of path-specific rules in `.claude/rules/`?

A) They load deterministically; CLAUDE.md is best-effort.
B) They support files scattered across the codebase via glob patterns and load only when matching files are edited, reducing token usage.
C) They are version-controlled; CLAUDE.md is not.
D) They take priority over CLAUDE.md when both exist.

**Correct answer:** B
**Explanation:** Path rules use globs to match files anywhere, and load only when editing matching files. Directory CLAUDE.md cannot do scattered matching, and loads whenever working in its directory regardless of file relevance.

---

**Q102.** Which signature phrase in an exam question points to path-specific rules in `.claude/rules/`?

A) "Universal coding standards"
B) "A pattern of files spread across the codebase"
C) "Personal customisation"
D) "Always-loaded conventions"

**Correct answer:** B
**Explanation:** "Pattern of files spread across the codebase" is the signature phrase for path-specific rules. Other phrases point to CLAUDE.md (universal, always-loaded) or personal config (`~/.claude/`).

---

**Q103.** A YAML frontmatter `paths: ["terraform/**/*.tf"]` rule applies to:

A) Only `terraform/main.tf`.
B) All `.tf` files in the `terraform/` directory tree, recursively.
C) All `terraform/` directories anywhere in the codebase.
D) Any file with "terraform" in its path.

**Correct answer:** B
**Explanation:** Globs interpret `**/*.tf` under the `terraform/` prefix as "all `.tf` files in the terraform/ tree." Recursive via `**`, extension via `*.tf`.

---

**Q104.** A team has identical migration conventions in `src/api/migrations/`, `src/auth/migrations/`, and `src/billing/migrations/`. What is the most maintainable way to enforce them?

A) Three CLAUDE.md files, one per directory.
B) One path-specific rule file with `paths: ["**/migrations/**/*"]`.
C) A slash command in `.claude/commands/migrate-check.md`.
D) A note in the root CLAUDE.md describing all three locations.

**Correct answer:** B
**Explanation:** One rule, three locations via glob. Three CLAUDE.md files invite drift; slash command requires explicit invocation; a note in root CLAUDE.md burns tokens on every interaction and doesn't enforce per-directory rules.

---

### TS 3.4 — Plan Mode vs Direct Execution

**Q105.** You need to restructure a monolithic application into microservices. This involves changes across dozens of files and requires architectural decisions about service boundaries and module dependencies. Which mode should you use?

A) Direct execution, making changes incrementally to let boundaries emerge.
B) Direct execution with comprehensive upfront instructions.
C) Plan mode to explore, evaluate approaches, and design before committing to code changes.
D) Skip planning since the requirements are clearly defined.

**Correct answer:** C
**Explanation:** Plan mode is designed for large-scale changes, multiple valid approaches, and architectural decisions — exactly what monolith-to-microservices restructuring requires. Direct execution risks costly rework when dependencies are discovered late.

---

**Q106.** You need to fix a null pointer in `UserService.getById()` based on a clear stack trace. Which mode is appropriate?

A) Plan mode — even small changes benefit from planning.
B) Direct execution — well-scoped, clear cause, known fix.
C) Plan mode followed by direct execution after the plan.
D) Skip the fix entirely.

**Correct answer:** B
**Explanation:** Well-understood narrow scope with a clear cause = direct execution. Plan mode for a one-line fix is ceremony, not value. The dividing line is: are there decisions still to make (plan mode) or just a known thing to do (direct execution)?

---

**Q107.** Your main conversation context is filling up with grep output and file listings while you explore an unfamiliar codebase. What is the correct mitigation?

A) Increase `max_tokens` to absorb more context.
B) Use the Explore subagent to isolate verbose discovery output and receive summaries in the main conversation.
C) Reduce the number of files in the codebase.
D) Restart the session.

**Correct answer:** B
**Explanation:** Explore subagent isolates verbose discovery, returns summaries. Same principle as `context: fork` for skills — keep noise out of the main conversation. Larger max_tokens absorbs noise but does not fix attention dilution.

---

**Q108.** A migration from `winston` to `pino` across 30 files has differing APIs. Which mode is correct?

A) Direct execution — it's a mechanical migration.
B) Plan mode to design the migration approach, then direct execution per file.
C) Direct execution; switch to plan mode only if you hit unexpected complexity.
D) Skip the migration.

**Correct answer:** B
**Explanation:** Differing APIs + many files = architectural decisions about wrapping, helper utilities, and edge cases. Plan first, execute second. Calling this "mechanical" misses the API-difference dimension.

---

**Q109.** Which is **NOT** a valid trigger for plan mode?

A) Multiple valid approaches exist and need evaluation.
B) Multi-file modifications where changes interact.
C) Adding a single date-validation conditional to one function with a clear spec.
D) Unfamiliar codebase needs exploration before design.

**Correct answer:** C
**Explanation:** Plan mode is overhead. A single-function, clear-spec change is direct execution. The other three are canonical plan-mode triggers.

---

### TS 3.5 — Iterative Refinement

**Q110.** Claude Code interprets a natural-language instruction inconsistently across iterations. You have rephrased the instruction three times and gotten three different outputs. What is the most leveraged next step?

A) Rewrite the prose more carefully.
B) Provide 2-3 concrete input/output examples that demonstrate the desired transformation.
C) Increase the model's temperature for more exploration.
D) Switch models.

**Correct answer:** B
**Explanation:** When prose has failed 3+ times, switch modalities. Concrete examples constrain the output shape directly. Rewording prose tends to produce *different* misinterpretations, not fewer.

---

**Q111.** A developer is working in an unfamiliar domain (e.g., billing logic) and wants to avoid missing edge cases. Which pattern fits?

A) Write the code immediately and rely on tests to catch edge cases later.
B) Use the interview pattern: have Claude ask clarifying questions first to surface considerations the developer might miss.
C) Lower the temperature to make Claude more conservative.
D) Reduce the number of tools available.

**Correct answer:** B
**Explanation:** Interview pattern: Claude asks questions before implementing, surfacing edge cases in unfamiliar domains. Particularly useful for billing, security, compliance, or anywhere domain knowledge gaps exist.

---

**Q112.** When several issues are **interacting** (fixing one might affect the others), how should feedback be provided?

A) Sequentially, one issue at a time.
B) In a single message describing all issues together, so Claude makes consistent decisions across them.
C) Two issues per round.
D) Don't provide feedback; let the model self-correct.

**Correct answer:** B
**Explanation:** Interacting fixes → single message. Independent fixes → sequence them. Mixing causes Claude to make inconsistent decisions across batches.

---

**Q113.** Test-driven iteration in Claude Code means:

A) Write the implementation first, then test.
B) Write the test suite first, then iterate by sharing test failures back to Claude.
C) Skip tests; iterate on prose.
D) Run tests only at the end of development.

**Correct answer:** B
**Explanation:** Test-driven iteration gives Claude a machine-checkable specification. The test failure messages drive corrections, far more reliable than prose descriptions of what's wrong.

---

### TS 3.6 — CI/CD Integration

**Q114.** Your CI pipeline runs `claude "Analyse this PR for security issues"` and the job hangs indefinitely. What is the correct fix?

A) Increase the CI timeout to 90 minutes.
B) Redirect stdin from `/dev/null`.
C) Add the `-p` (`--print`) flag: `claude -p "Analyse this PR for security issues"`.
D) Set `CLAUDE_HEADLESS=true` as an environment variable.

**Correct answer:** C
**Explanation:** `-p` runs Claude Code in non-interactive mode. Without it, the CLI waits for interactive input — which never arrives in CI. Timeout treats the symptom; stdin redirection doesn't fix the documented CLI behaviour; `CLAUDE_HEADLESS` is not a real variable.

---

**Q115.** Your CI needs Claude Code output as machine-parseable JSON for automated inline PR comments. Which flag combination is correct?

A) `--output-format json`
B) `--output-format json --json-schema <schema>`
C) `--machine-readable`
D) `--format yaml`

**Correct answer:** B
**Explanation:** Both flags together: `--output-format json` produces JSON; `--json-schema` constrains the JSON to a specific shape for reliable downstream parsing.

---

**Q116.** Your team's CI generates low-quality tests — testing trivial getters, redundant scenarios. What is the best fix?

A) Train developers to write better tests manually.
B) Strengthen `.claude/CLAUDE.md` with testing standards: what makes a *valuable* test, available fixtures/mocks, testing patterns to follow.
C) Disable the CI test generation entirely.
D) Use a more capable model.

**Correct answer:** B
**Explanation:** CI-invoked Claude Code reads the same `.claude/CLAUDE.md`. Document testing standards and value criteria there. Without context, CI generates boilerplate; with it, tests target meaningful behaviour.

---

**Q117.** A code-generating session reviews its own changes and consistently misses issues that an independent reviewer catches. Which architectural choice is correct?

A) Reuse the code-generating session for review; it already knows the context.
B) Use an independent Claude Code instance (fresh session, no prior context) for the review step.
C) Lower temperature on the review step.
D) Add a `/self-review` slash command.

**Correct answer:** B
**Explanation:** Session context isolation rule: motivated reasoning makes self-review unreliable. Use a fresh instance for review. Same principle as multi-instance review in Domain 4.6.

---

**Q118.** Developers complain about "comment fatigue": the PR review bot posts duplicate comments on every push, including issues that were already addressed. What is the correct fix?

A) Disable the bot.
B) Have the bot re-run reviews only when developers explicitly request.
C) Include prior review findings in the bot's context on each re-run, and instruct it to report only new or still-unaddressed issues.
D) Switch to a more capable model.

**Correct answer:** C
**Explanation:** Incremental review context: pass prior findings, instruct Claude to report only new or unaddressed issues. Disabling the bot loses value; making review on-demand loses ambient quality; model size doesn't address the duplication problem.

---

**Q119.** You re-run a review on a PR after new commits. You want Claude to skip already-addressed issues. Which is the correct technique?

A) Pass only the new diff and let Claude re-discover what was already done.
B) Pass the prior review findings in context and explicitly instruct Claude to report only new or unaddressed issues.
C) Run a `diff` filter on the output and post-process.
D) Use a separate slash command per review iteration.

**Correct answer:** B
**Explanation:** Incremental review context. Instructing Claude what to skip + passing prior findings is the documented pattern.

---

### Additional Domain 3 Questions

**Q120.** Your team uses different conventions across React components, API handlers, and database models. Test files are spread alongside the code. What is the most maintainable arrangement?

A) One monolithic root CLAUDE.md with sections for each area.
B) Directory-level CLAUDE.md in each subdirectory.
C) Multiple `.claude/rules/` files with YAML frontmatter glob patterns scoping each convention set to its file types/paths.
D) Skills in `.claude/skills/` for each code type.

**Correct answer:** C
**Explanation:** Multiple path-specific rules with globs scale to scattered files and load only when relevant. Monolithic CLAUDE.md burns context; directory CLAUDE.md fragments and drifts; skills are on-demand, not ambient.

---

**Q121.** Why is a slash command a poor choice for enforcing a team standard?

A) Slash commands are slower than CLAUDE.md.
B) Standards must be ambient (always loaded). Slash commands require developers to remember to invoke them — opt-in, fragile to forgetting.
C) Slash commands cannot reference shared rules.
D) Slash commands are personal-only.

**Correct answer:** B
**Explanation:** Standards must be ambient; commands must be invoked. Opt-in invocation is unreliable for "must happen every time" rules. Slash commands can be project-scoped (`.claude/commands/`); the issue is invocation discipline.

---

**Q122.** Plan mode for investigation, then direct execution for implementation — is this a valid combined workflow?

A) No, you must pick one mode for the whole task.
B) Yes, this hybrid is a documented and recommended pattern for tasks where exploration is needed before implementation.
C) Only for codebase migrations.
D) Only if the task involves more than 100 files.

**Correct answer:** B
**Explanation:** Plan → direct execution is a valid hybrid: plan to investigate and design, exit plan mode, then execute. This combines safe exploration with concrete action.

---

**Q123.** Your CI runs `claude -p "..." --output-format json` and the JSON output occasionally has different schema variations across runs. Downstream parsing breaks. What is the fix?

A) Add `--strict` flag.
B) Use `--json-schema <schema-file>` to constrain the output to a specific shape.
C) Use the prompt to ask for "consistent JSON."
D) Run the command twice and take the intersection.

**Correct answer:** B
**Explanation:** `--json-schema` enforces a specific output shape, eliminating schema drift across runs. Prompt requests don't guarantee consistency; intersection doesn't make sense for structured output.

---

**Q124.** You want a personal version of an existing project skill, with a stricter rubric, without affecting teammates. Which approach works?

A) Add a `personal: true` frontmatter to the existing skill.
B) Create a new skill at `~/.claude/skills/review-strict/SKILL.md` (different name, personal location).
C) Edit `.claude/skills/review/SKILL.md` and add personal rules.
D) Use a CLAUDE.md instruction at the user level to modify the existing skill at runtime.

**Correct answer:** B
**Explanation:** Personal customisation of a team skill = new name + `~/.claude/skills/`. Never edit the team skill (affects everyone); there is no `personal: true` field; CLAUDE.md does not modify skills.

---

**Q125.** Your team uses CLAUDE.md to define standards, but new team members report inconsistent behaviour. Which is the right diagnostic move?

A) Restart Claude Code on each new member's machine.
B) Run `/memory` on each new member's machine to verify which CLAUDE.md files are actually loaded; trace any divergence to user-level vs project-level config or a stale checkout.
C) Reinstall the CLI.
D) Disable the CLAUDE.md mechanism entirely.

**Correct answer:** B
**Explanation:** `/memory` is for diagnosis. Once you know what's loaded, you can determine whether the new member has a conflicting user-level config or a stale checkout. Restart and reinstall don't address the root cause.

---

## Domain 4: Prompt Engineering & Structured Output (Q126–Q165)

### TS 4.1 — Explicit Criteria

**Q126.** A code review bot's prompt says "be conservative" and "only flag high-confidence issues." Developers complain the bot reports too many false positives. What is the most effective improvement?

A) Add "be EXTRA conservative" with bolded emphasis.
B) Lower the temperature to 0.
C) Replace "be conservative" with explicit categorical criteria: "Flag bugs (logical errors, null pointer risks, race conditions) and security vulnerabilities. Skip minor style preferences and local patterns."
D) Add a confidence threshold of 0.9.

**Correct answer:** C
**Explanation:** Categorical criteria beat vague confidence adjectives. "Flag X, report Y, skip Z" with concrete categories beats "be conservative" every time. Words like *conservative*, *careful*, or *high-confidence* without categorical definition are distractor signatures.

---

**Q127.** One category of review findings has a very high false-positive rate. Developers have stopped trusting *all* categories. What is the correct fix?

A) Tighten the prompt for the noisy category in place.
B) Lower the confidence threshold for the noisy category.
C) Temporarily disable the noisy category entirely while improving its prompt; keep the other categories active so developer trust is restored.
D) Raise the temperature for variation.

**Correct answer:** C
**Explanation:** High false-positives in one category destroy trust in all categories. The counterintuitive but correct fix is to *disable* the noisy category, iterate on its prompt offline, and re-enable once it meets quality bars. Tightening or lowering threshold in place keeps noise flowing.

---

**Q128.** A "severity" rubric has 5 levels described in prose. Findings end up classified inconsistently across runs. What is the right anchor?

A) Add a sixth severity level for finer granularity.
B) Anchor severity levels with **actual code examples** for each level (e.g., "Critical: SQL injection from unvalidated input. Example: ... ").
C) Replace severity with a numeric score.
D) Have the model self-report a confidence rating.

**Correct answer:** B
**Explanation:** Prose definitions of severity drift across runs. Concrete code examples for each level provide consistent anchors. More levels or numeric scores without anchors don't fix the drift.

---

### TS 4.2 — Few-Shot Prompting

**Q129.** A code-review prompt has detailed step-by-step instructions but still produces inconsistent judgement on ambiguous cases. Which technique most effectively addresses this?

A) Add more detailed step-by-step instructions covering every edge case.
B) Add 2-4 targeted few-shot examples covering ambiguous cases, each showing the reasoning for why one action was chosen over plausible alternatives.
C) Add 10+ examples to cover all possible cases.
D) Lower the temperature.

**Correct answer:** B
**Explanation:** Few-shot is the most effective technique for judgement consistency. 2-4 targeted examples on ambiguous cases — with reasoning — beats 10 on solved cases. Instructions have ceilings; randomness isn't the issue.

---

**Q130.** A structured data extraction system frequently returns null for fields that ARE present in the source document but in varied structural formats (inline citations vs bibliographies). Which technique fits?

A) Add validation-retry to recover the missing data.
B) Add few-shot examples demonstrating extraction from documents with varied structures (inline citations, bibliographies, narrative descriptions, structured tables).
C) Make the field required to force the model to extract something.
D) Lower the temperature.

**Correct answer:** B
**Explanation:** Few-shot examples covering varied document structures teach the model the *shape* of valid extractions across formats. Retry can't help when extraction failed structurally; required fields invite fabrication; temperature doesn't address structural learning.

---

**Q131.** Which is the correct number of few-shot examples for ambiguous-case targeting?

A) 1 example.
B) 2-4 targeted examples.
C) 10+ diverse examples covering all cases.
D) No examples; rely on detailed instructions.

**Correct answer:** B
**Explanation:** 2-4 targeted on ambiguous cases is the documented sweet spot. 1 is too narrow to generalise. 10+ on solved cases bloats context and doesn't improve judgement.

---

**Q132.** Few-shot examples are most effective for which failure mode?

A) JSON syntax errors.
B) Information genuinely absent from the source document.
C) Inconsistent judgement, inconsistent formatting, fabrication in extraction tasks from varied document structures.
D) Network timeouts.

**Correct answer:** C
**Explanation:** The three documented deployment triggers for few-shot: inconsistent formatting, inconsistent judgement on ambiguous cases, empty/null in extraction. Syntax errors → tool_use. Absent source data → schema design. Timeouts → infrastructure.

---

### TS 4.3 — Structured Output with tool_use

**Q133.** Which approach guarantees that the model's output is syntactically valid JSON?

A) Adding "return JSON like ..." to the prompt.
B) Using `tool_use` with a JSON schema as the tool's input parameters.
C) Setting `temperature: 0`.
D) Using `--output-format json` in the Anthropic API.

**Correct answer:** B
**Explanation:** `tool_use` with a JSON schema eliminates syntactic errors because the model's output is constrained by the schema. Prompt-based JSON gives no guarantees. Temperature doesn't affect structure. `--output-format json` is a Claude Code CLI flag, not an Anthropic API mechanism.

---

**Q134.** A strict JSON schema with all-required fields is used for invoice extraction. The model occasionally fabricates fields for documents where the data is absent. What is the root design flaw?

A) The schema has too many fields.
B) Making all fields required is a "fabrication factory" — required + absent source data → the model invents values to satisfy the schema. Make fields nullable when source documents may not contain them.
C) The model is broken.
D) The temperature should be 0.

**Correct answer:** B
**Explanation:** "Required" doesn't guarantee correctness — it guarantees *something* will be present, even if invented. Anti-fabrication toolkit: nullable fields, `"unclear"` enums, `"other"` + freeform detail.

---

**Q135.** Which `tool_choice` setting forces the model to call some tool but lets it pick which?

A) `"auto"`
B) `"any"`
C) `{"type": "tool", "name": "extract_invoice"}`
D) `"required"`

**Correct answer:** B
**Explanation:** `"any"` = must call a tool, model picks which. `"auto"` lets the model return text. Named-tool forces a specific tool. There is no `"required"` value.

---

**Q136.** A document type varies (could be an invoice, receipt, or contract). Which `tool_choice` is correct for guaranteed structured output across types?

A) `"auto"`
B) `"any"`
C) `{"type": "tool", "name": "extract_invoice"}`
D) Omit `tool_choice`.

**Correct answer:** B
**Explanation:** `"any"` forces structured output (must call some tool) but lets the model pick the right tool per document type. Named-tool would route invoices, receipts, and contracts through the wrong tool for two of three.

---

**Q137.** Which limitation does `tool_use` with a strict JSON schema NOT prevent?

A) JSON syntax errors.
B) Required-field omissions.
C) Semantic errors (e.g., line items don't sum to the stated total).
D) Type mismatches (string where number expected).

**Correct answer:** C
**Explanation:** Schemas validate structure and types; they don't check arithmetic, meaning, or field placement. tool_use's only guarantee is syntactic validity. Semantic correctness needs self-correction patterns (calculated vs stated total).

---

**Q138.** A schema needs to handle ambiguous cases gracefully. Which design pattern fits?

A) Make every field nullable.
B) Add an `"unclear"` enum value or an `"other"` enum value + freeform `detail` string for ambiguous and extensible categorisations.
C) Use a required boolean `is_clear`.
D) Add validation-retry.

**Correct answer:** B
**Explanation:** `"unclear"` enums let the model express uncertainty within the schema. `"other"` + detail enables extensibility. Both prevent fabrication and force-fits.

---

### TS 4.4 — Validation-Retry Loops

**Q139.** A document extraction occasionally returns dates in the wrong format. Which fix is appropriate?

A) Validation-retry: when validation fails, resend the original document, the failed extraction, and the specific validation error so the model can self-correct.
B) Make the date field nullable.
C) Add a `"unclear"` enum to the date field.
D) Switch to a larger model.

**Correct answer:** A
**Explanation:** Output errors (format mismatches) are exactly what validation-retry handles. Nullable / unclear handle source-absent cases. Bigger model is not the right layer.

---

**Q140.** A document extraction returns null for a field that does not exist in 15% of source documents. The team adds validation-retry to "recover the missing data." After 3 retries, the model starts fabricating values. What is the root cause?

A) The retry limit is too low.
B) The model is broken.
C) Validation-retry recovers output errors, not source gaps. When information is genuinely absent from the source, retry produces fabrications, not corrections. The correct fix is a nullable field.
D) The model needs a stronger system prompt.

**Correct answer:** C
**Explanation:** "Retry fixes output errors. Schema design fixes source gaps." This is the most-tested 4.4 boundary. More retries on absent data = more fabrications.

---

**Q141.** What three pieces of information should retry-with-feedback include on the follow-up request?

A) The validation error only.
B) A new copy of the system prompt.
C) The original document, the failed extraction output, and the specific validation error message.
D) Just the failed extraction.

**Correct answer:** C
**Explanation:** Triplet: original document + failed extraction + specific validation error. The model self-corrects based on the diff between intended and produced.

---

**Q142.** You want to improve a code review bot's accuracy over time using systematic data analysis of dismissed findings. Which schema design enables this?

A) Add a numeric confidence score to each finding.
B) Add a `detected_pattern` field to each finding (e.g., `"unvalidated_user_input_in_sql_concatenation"`), enabling later analysis of which patterns are most often dismissed by developers.
C) Add a free-text `notes` field.
D) Add a `severity` field.

**Correct answer:** B
**Explanation:** `detected_pattern` turns a black-box bot into a measurable system: track dismissal rates per pattern, identify high-noise patterns, improve those specifically. Confidence, notes, and severity don't enable systematic dismissal-pattern analysis.

---

**Q143.** A vendor invoice often has internal inconsistencies (header date ≠ footer date). Which design surfaces these for human review rather than picking one silently?

A) Pick the most recent date.
B) Average the two.
C) Add a `conflict_detected` boolean to the schema, set when internal source data is inconsistent.
D) Reject the document.

**Correct answer:** C
**Explanation:** Surface conflicts as data (`conflict_detected`). Silent resolution destroys information; averaging fabricates a number; rejection is overkill.

---

**Q144.** Invoice line items don't always sum to the stated total. Which schema design catches this?

A) Increase the retry limit.
B) Extract both `stated_total` and `calculated_total` (sum line items yourself); flag discrepancies for human review.
C) Use `tool_use` with all fields required.
D) Make `total` nullable.

**Correct answer:** B
**Explanation:** Extract redundantly and let inconsistencies bubble up. Schemas don't do arithmetic; the calculated/stated split surfaces math errors, OCR mistakes, or fraud without trusting either alone.

---

### TS 4.5 — Batch Processing

**Q145.** Which workload is appropriate for the Message Batches API?

A) Pre-merge CI checks blocking developers waiting for feedback.
B) Inline IDE suggestions where users wait.
C) Overnight technical-debt report generation for review the next morning.
D) Customer-facing chat support.

**Correct answer:** C
**Explanation:** Batch is for latency-tolerant workloads where no one waits. Overnight reports fit. Blocking workflows (pre-merge, IDE, chat) require synchronous APIs.

---

**Q146.** A manager proposes "switch everything to batch to save 50%." How should you respond?

A) Agree; 50% savings are significant.
B) Disagree; never use batch.
C) Use batch for latency-tolerant workloads (overnight reports), keep blocking workloads (pre-merge CI, customer chat) synchronous. The mixed strategy is correct.
D) Use batch only for non-production.

**Correct answer:** C
**Explanation:** Mixed strategy. Batch saves 50% on API cost but has up to 24-hour latency. Switching blocking workflows to batch costs more in developer wait time than it saves.

---

**Q147.** Which feature is **NOT** supported by the Message Batches API?

A) `custom_id` for correlating request/response pairs.
B) 50% cost savings vs synchronous.
C) Multi-turn tool calling within a single request (agentic loops).
D) Up to 24-hour processing window.

**Correct answer:** C
**Explanation:** Batch is single-shot only. Multi-turn tool calling (agentic loops) cannot run on batch. This is the sleeper trap.

---

**Q148.** A batch of 10,000 documents returns with 50 failures. How should you handle these?

A) Resubmit the entire batch.
B) Identify failures by `custom_id`, resubmit only the failures with appropriate modifications (e.g., chunking oversized documents).
C) Ignore the failures.
D) Switch the entire workflow to synchronous.

**Correct answer:** B
**Explanation:** `custom_id` correlates request/response. Resubmit only failures. Resubmitting the entire batch wastes the cost savings; ignoring loses data; switching the whole workflow is unnecessary.

---

**Q149.** Why is it important to refine prompts on a sample set *before* batch processing?

A) Refinement is not important.
B) Batch iterations are up to 24 hours each. Validating prompts synchronously first prevents 24-hour iteration loops when problems are discovered mid-batch.
C) Synchronous prompts produce more accurate outputs.
D) Batch outputs are read-only.

**Correct answer:** B
**Explanation:** Iteration loops inside batch are unacceptably long. Refine synchronously, then batch. Otherwise, every prompt fix takes a day to validate.

---

### TS 4.6 — Multi-Instance Review

**Q150.** A model reviews its own output in the same session. Why is this approach unreliable?

A) The model is broken.
B) The model retains the reasoning context that produced the output, biasing it toward its prior conclusions (motivated reasoning). It's less likely to question its own decisions.
C) Tokens run out before review completes.
D) Temperature must be raised for self-review.

**Correct answer:** B
**Explanation:** Motivated reasoning. Same-session self-review is biased. The fix is an independent instance with no prior context.

---

**Q151.** A 14-file PR review produces inconsistent depth: detailed feedback on some files, superficial on others, contradictory findings between files. What is the correct restructuring?

A) Use a larger context window.
B) Split into focused passes: per-file local analysis, then a separate cross-file integration pass for data flow / contract issues.
C) Require developers to submit smaller PRs.
D) Run three independent reviews and flag issues found in at least two.

**Correct answer:** B
**Explanation:** Attention dilution can't be fixed by a bigger window. Focused passes ensure consistent depth per file; integration pass catches cross-file issues. Forcing smaller PRs shifts burden to developers; consensus voting suppresses subtle real bugs caught intermittently.

---

**Q152.** Which is the correct confidence-based review routing pattern?

A) Set confidence threshold to 0.9 universally.
B) Model self-reports field-level confidence; thresholds calibrated using a labelled validation set; low-confidence findings route to human review; reviewer time prioritised on highest-uncertainty items.
C) Have the model reject low-confidence outputs.
D) Use document-level confidence to route review.

**Correct answer:** B
**Explanation:** Field-level (not document-level) calibration on a labelled set is the documented pattern. 0.9 without calibration is meaningless; rejection wastes effort; document-level confidence hides field variance.

---

### Additional Domain 4 Questions

**Q153.** A prompt instructs Claude to "extract names and email addresses from this contact list" but extractions are inconsistent. Which fix is most effective?

A) Add "be careful and accurate" to the prompt.
B) Add 2-4 few-shot examples showing varied contact list formats (with and without titles, formal vs informal, embedded in prose vs structured).
C) Lower temperature to 0.
D) Increase max_tokens.

**Correct answer:** B
**Explanation:** Inconsistent extraction across formats → few-shot examples covering varied structures. Adjective additions don't constrain output shape; temperature doesn't fix structural variation.

---

**Q154.** Which is the right approach when source documents have data in inconsistent formats (some have dates as "March 3rd", others as "3/3/2025")?

A) Reject documents with unusual formats.
B) Include format normalisation rules in the prompt alongside the strict output schema (e.g., "output dates in ISO-8601 regardless of source format").
C) Use `tool_use` with a date type only.
D) Apply OCR.

**Correct answer:** B
**Explanation:** Schemas validate types, not formats. Prompts handle format normalisation. Combine both: strict schema + format rules in the prompt.

---

**Q155.** A prompt with all-required fields produces fabricated values when source data is absent. Even adding "do not fabricate" to the prompt doesn't help. Why?

A) The prompt instruction is too short.
B) Structural pressure (required fields) overrides prompt-level instructions. The fix is structural: make the field nullable.
C) The model is broken.
D) The temperature should be 0.

**Correct answer:** B
**Explanation:** Structure beats instruction. Required + absent source → fabrication. Prompt "do not fabricate" loses to schema pressure. Nullable fields remove the pressure.

---

**Q156.** Which is true about the `"other"` + freeform `detail` field pattern in an enum?

A) It is rarely useful.
B) It captures categories outside the enum, preserving information instead of force-fitting into wrong buckets. Use when categories may evolve over time or have a long tail.
C) It makes the schema invalid.
D) It is deprecated.

**Correct answer:** B
**Explanation:** `"other"` + detail is the extensibility pattern. Lets the model handle categories outside the enum cleanly.

---

**Q157.** Which is **NOT** a documented few-shot pattern?

A) Show reasoning for why one action was chosen over plausible alternatives.
B) Demonstrate the desired output format precisely.
C) Cover varied document structures to reduce hallucination.
D) Include 10+ examples to "saturate" the model's understanding.

**Correct answer:** D
**Explanation:** 2-4 targeted examples beat 10+ saturated ones. The other three are documented patterns.

---

**Q158.** A pre-merge CI check on a multi-turn agentic workflow takes ~30 seconds synchronously. The manager wants to "save 50% by moving to batch." What should you do?

A) Move to batch; 50% savings are worth it.
B) Keep synchronous: batch doesn't support multi-turn tool calling within a single request, and the workflow blocks the developer's merge.
C) Switch to a smaller model.
D) Reduce the agent's tool count.

**Correct answer:** B
**Explanation:** Two reasons keep it synchronous: blocking workflow + multi-turn agentic loop. Either alone is sufficient.

---

**Q159.** A multi-instance review pattern catches a subtle bug that the same-session review missed. What architectural principle does this illustrate?

A) More compute always helps.
B) Independent instances (fresh sessions, no prior reasoning context) are more effective at catching subtle issues than same-session review or extended thinking.
C) Subagents are required for reviews.
D) Review is unnecessary.

**Correct answer:** B
**Explanation:** Self-review limitation: same session retains motivated reasoning. Independent instance is the fix — same architectural idea as CI/CD session isolation.

---

**Q160.** A schema returns `"unclear"` more often than expected. The developer wants to "force the model to commit." What is the right framing?

A) Remove the `"unclear"` enum.
B) The `"unclear"` enum is functioning as intended — it expresses calibrated uncertainty rather than fabricating a confident answer. Investigate *why* the source documents trigger it (ambiguous data) rather than removing the option.
C) Force `tool_choice` to a named tool.
D) Lower the temperature.

**Correct answer:** B
**Explanation:** `"unclear"` is the right answer when ambiguity exists. Removing it just forces fabrication. Investigate the source.

---

**Q161.** A document classification system has 97% overall accuracy. Stakeholders want to remove human review. What should you do first?

A) Remove human review; 97% is enough.
B) Validate accuracy by document type AND field segment before automating. 97% overall could hide a 40% error rate on a rare-but-important type.
C) Increase the model size.
D) Increase the confidence threshold to 0.95.

**Correct answer:** B
**Explanation:** Aggregate metrics hide stratum-level failures. Validate by document type and field segment. The 97% headline is necessary but not sufficient evidence.

---

**Q162.** Even after deployment of an extraction system, you want to detect novel error patterns. Which technique fits?

A) Manually review every output.
B) Apply stratified random sampling of high-confidence extractions for ongoing audit, alongside the existing low-confidence routing.
C) Trust the existing review thresholds.
D) Reduce the confidence threshold.

**Correct answer:** B
**Explanation:** Novel error patterns slip past existing thresholds by definition. Stratified sampling of high-confidence cases catches them. Reviewing everything defeats automation; trust without verification misses drift.

---

**Q163.** A bot reports "this code has a bug" with a confidence score of 0.4. What is the right routing?

A) Auto-apply the finding.
B) Route to human review (low confidence).
C) Reject the finding entirely.
D) Always auto-apply regardless of confidence.

**Correct answer:** B
**Explanation:** Low-confidence findings → human review. The agent is signalling uncertainty; act on it.

---

**Q164.** A research team is building an extraction system with three confidence bands (high/medium/low). Reviewer capacity is limited. How should they allocate?

A) Review all bands equally.
B) Prioritise scarce reviewer capacity on highest-uncertainty (low-confidence and ambiguous) items. Stratified sample of high-confidence items for ongoing audit.
C) Review only low confidence.
D) Review only high confidence.

**Correct answer:** B
**Explanation:** Prioritise reviewers on highest-uncertainty items. Continue sampling the high-confidence band to detect novel errors. Don't review only one band.

---

**Q165.** Which **Domain 4 distractor** describes the wrong layer?

A) "Make the field nullable in the schema to address fabrication."
B) "Use `tool_use` to ensure line items sum to the stated total."
C) "Add validation-retry for format mismatches."
D) "Switch `tool_choice` to `'any'` for heterogeneous documents."

**Correct answer:** B
**Explanation:** Schemas validate structure and types — they do NOT perform arithmetic. Semantic checks (line items summing to total) require self-correction patterns (calculated vs stated), not schema design. This is a layer-confusion distractor.

---

## Domain 5: Context Management & Reliability (Q166–Q195)

### TS 5.1 — Context Preservation

**Q166.** A multi-turn customer support agent loses track of the customer's stated refund amount, deadline, and order ID across a long conversation. Progressive summarisation has compressed earlier turns. What is the canonical fix?

A) Increase the model's context window.
B) Extract transactional facts (customer ID, order #, refund amount, deadline) into a persistent "case facts" block injected verbatim into every prompt, outside the summarised history.
C) Disable summarisation entirely.
D) Lower the temperature.

**Correct answer:** B
**Explanation:** Summarisation is lossy compression that disproportionately destroys numerical values, dates, IDs, percentages, and customer-stated expectations. The fix is a persistent "case facts" block that summarisation never touches. Conversation history above and below can be compressed; the facts block is sacred.

---

**Q167.** A long synthesis document buries the key findings in the middle. Reviewers consistently miss them. What is the structural mitigation?

A) Use a larger model.
B) Place key findings summaries at the **beginning** of the document with explicit section headers (`## Findings`, `## Sources`); transformer attention is biased toward beginning and end.
C) Repeat the findings three times throughout the document.
D) Bold all findings.

**Correct answer:** B
**Explanation:** "Lost in the middle" is a structural attention bias, not a model bug. Mitigation: summarise at the beginning, use explicit section headers as structural anchors. Larger model doesn't fix attention dilution; repetition is noisy.

---

**Q168.** A tool returns 40 fields when downstream reasoning needs 5. The tool results accumulate across 8 turns. What is the correct mitigation?

A) Pass full tool responses to maintain fidelity.
B) Trim tool results to the 5 relevant fields at the integration layer, before they accumulate in context.
C) Drop the oldest turns to stay under the context limit.
D) Lower the temperature.

**Correct answer:** B
**Explanation:** Tool result noise accumulates disproportionately to its value. Trim at the integration layer before results hit context. Dropping turns breaks coherence (API is stateless); full responses balloon noise across turns.

---

**Q169.** A multi-agent research system has the synthesis subagent's context bloated by verbose reasoning chains from the web search subagent. What is the cheapest upstream fix?

A) Increase the synthesis subagent's context window.
B) Modify the web search subagent to return structured key facts and citations only, not verbose reasoning or full document quotes. The reasoning belongs *inside* the upstream subagent's context, not crossing the boundary.
C) Move synthesis into the coordinator.
D) Drop the web search subagent.

**Correct answer:** B
**Explanation:** Cheapest place to fix downstream context bloat is upstream. Subagent return shape = structured key facts; reasoning stays internal. Larger windows are throwing tokens at the wrong problem.

---

**Q170.** The Claude API is stateless. What does this mean for conversation management?

A) The API stores conversation history server-side.
B) Every API request must include the complete conversation history. Dropping earlier messages breaks coherence.
C) The API stores only the last 10 turns.
D) State is automatically compacted.

**Correct answer:** B
**Explanation:** Stateless API — you manage history. Each request needs the full history. Use prompt caching on the stable prefix to make this economical.

---

### TS 5.2 — Escalation & Ambiguity Resolution

**Q171.** Which of the following is a **valid** escalation trigger?

A) The customer sounds frustrated based on sentiment analysis.
B) The model self-reports confidence below 0.6.
C) The customer explicitly requests a human agent.
D) The conversation has gone on for more than 10 turns.

**Correct answer:** C
**Explanation:** Three valid triggers: explicit human request, policy gap, inability to make meaningful progress. Sentiment and self-reported confidence are the two unreliable triggers; conversation length is not a trigger at all.

---

**Q172.** A customer with a simple-looking refund request says, "Just give me a human, I don't want to deal with a bot." What is the correct action?

A) Resolve the issue first to demonstrate value; escalate only if the customer is still unhappy.
B) Acknowledge frustration and try to resolve.
C) Escalate immediately without first attempting investigation.
D) Ask the customer to confirm they really want a human.

**Correct answer:** C
**Explanation:** Explicit human request = escalate immediately. Even if the issue looks trivially resolvable. Overriding explicit requests is patronising and damages trust.

---

**Q173.** A customer is frustrated about a delayed package but has not asked for a human. The issue is straightforward (eligible for replacement). What is the correct action?

A) Escalate to a human because the customer is upset.
B) Acknowledge the frustration, offer resolution. Escalate only if the customer reiterates a preference for a human.
C) Run sentiment analysis to confirm escalation.
D) Ignore the frustration and process the resolution.

**Correct answer:** B
**Explanation:** Frustration alone ≠ complexity. Acknowledge and offer resolution. Escalate only if the customer reiterates the human-agent preference. Pure sentiment-based escalation is unreliable.

---

**Q174.** A customer search returns three matches for "John Smith." What is the correct action?

A) Pick the most recently active account.
B) Pick the one whose order details "match" the customer's description.
C) Ask the customer for an additional identifier (email, phone, order number, postcode).
D) Run all subsequent operations on every matched account in parallel.

**Correct answer:** C
**Explanation:** Ambiguous matches → ask for a disambiguator, never heuristic. The cost of one turn is negligible; the cost of acting on the wrong account is enormous.

---

**Q175.** A policy says "refunds for damaged items only." A customer requests a refund because a competitor offered a lower price (no damage). What is the correct response?

A) Auto-decline because the policy doesn't cover price matching.
B) Auto-process the refund because the customer is loyal.
C) Escalate to a human because the request involves a policy gap or exception not covered by documented policy.
D) Run sentiment analysis to decide.

**Correct answer:** C
**Explanation:** Policy gaps require human judgement. Auto-declining without judgement loses customers; auto-processing exceeds the agent's authority; sentiment doesn't help with policy.

---

### TS 5.3 — Error Propagation

**Q176.** Which is the **worst** error propagation pattern?

A) Returning structured error context (failure type, what was attempted, partial results, alternatives).
B) Returning `{"results": [], "status": "ok"}` on tool failure ("silent suppression").
C) Implementing local recovery in subagents and only propagating unresolved errors.
D) Annotating partial results with coverage gaps.

**Correct answer:** B
**Explanation:** Silent suppression is the worst pattern — orchestrator believes no data exists, has zero recovery signal. The other three are correct practices.

---

**Q177.** A subagent times out. Which error propagation enables the coordinator's intelligent recovery?

A) Generic "search unavailable" status.
B) Structured error: failure type (transient), what was attempted (specific query), partial results (anything gathered), potential alternatives (narrower query, fallback source).
C) Catch the exception silently and return empty results.
D) Terminate the entire workflow.

**Correct answer:** B
**Explanation:** Four required fields: failure type, attempt, partial results, alternatives. Generic statuses hide context; silent suppression hides the failure; termination throws away other subagents' results.

---

**Q178.** A tool query succeeds and returns an empty array. What is the correct interpretation?

A) Retry, in case data appears later.
B) Treat as a transient error.
C) `isError: false` + empty result = the tool ran successfully and found no matches. The empty result IS the answer; do not retry.
D) Escalate immediately.

**Correct answer:** C
**Explanation:** Valid empty result = the answer is "none." Retrying valid empties wastes budget and may produce misleading conclusions if data appears.

---

**Q179.** One subagent fails in a four-subagent pipeline. What is the correct system response?

A) Terminate the entire pipeline.
B) Preserve the three successes, annotate the synthesis with a coverage note about the unavailable area, let the consumer decide whether to act on partial data.
C) Silently drop the failed subagent's contribution and proceed without annotation.
D) Re-run all four subagents from scratch.

**Correct answer:** B
**Explanation:** Coverage annotations beat silent omission. Termination throws away partial successes. Re-running wastes the three successful runs. Silent omission destroys the gap signal.

---

### TS 5.4 — Codebase Exploration

**Q180.** A long codebase exploration session has the agent referring to "typical patterns" instead of specific classes it discovered earlier. What is the symptom and the fix?

A) Symptom: model degradation. Fix: switch model.
B) Symptom: context degradation in extended sessions (high-signal early findings diluted by verbose later exploration). Fix: write key findings to a scratchpad file and reference it for subsequent questions.
C) Symptom: high temperature. Fix: lower temperature.
D) Symptom: invalid prompt. Fix: rewrite the prompt.

**Correct answer:** B
**Explanation:** Context degradation = generic knowledge crowds out session-specific findings. Scratchpad files persist key findings across context boundaries. Temperature and prompt rewriting don't address retention; switching models hits the same problem at the same turn count.

---

**Q181.** Which is the correct distinction between scratchpad files and `/compact`?

A) Scratchpad preserves chosen facts in a known external location for future reference; `/compact` is a recovery valve that reduces current context usage (with fidelity loss). Use scratchpad proactively; `/compact` reactively.
B) They are identical.
C) `/compact` writes findings; scratchpad compacts context.
D) Scratchpad replaces `/compact`.

**Correct answer:** A
**Explanation:** Scratchpad = proactive persistence of key findings. `/compact` = reactive context reduction with fidelity loss. Use scratchpad first; `/compact` is the recovery valve.

---

**Q182.** A long-running multi-agent job risks crashing mid-task. What pattern enables resume-from-checkpoint without losing prior work?

A) Set high `max_tokens`.
B) Each agent exports structured state (a manifest) to a known file location at checkpoints. On resume, the coordinator loads the manifest and injects it into resumed agent prompts. The manifest is the source of truth, not conversation history.
C) Lower temperature for determinism.
D) Restart from scratch.

**Correct answer:** B
**Explanation:** Manifest pattern. Conversation history is fragile (stale, lost on crash); manifests are robust source of truth.

---

**Q183.** Which mitigation matches "parallel deep dives into specific questions without bloating the coordinator's context"?

A) Larger context window.
B) Subagent delegation: spawn subagents for specific investigations; coordinator receives distilled result only.
C) `/compact`.
D) Lower temperature.

**Correct answer:** B
**Explanation:** Subagent delegation isolates verbose exploration in the subagent's context; coordinator stays focused on coordination. Larger windows don't fix attention dilution; `/compact` loses fidelity.

---

### TS 5.5 — Confidence Calibration

**Q184.** A document extraction system reports 97% overall accuracy on a labelled validation set. Stakeholders want to fully automate. What should you check first?

A) Stratified accuracy by document type AND field segment — the 97% headline could mask a 40% failure rate on a rare-but-important document type.
B) Increase the confidence threshold.
C) Use a larger model.
D) Reduce the number of fields.

**Correct answer:** A
**Explanation:** Aggregate metrics hide stratum-level failures. Validate accuracy by document type and field segment before automating.

---

**Q185.** Even after calibration and deployment, novel error patterns can emerge. What discipline catches them?

A) Trust existing confidence thresholds.
B) Stratified random sampling of high-confidence extractions for ongoing audit, across types, fields, and confidence bands. Catches failures that don't trigger existing review thresholds.
C) Lower the confidence threshold.
D) Disable automation.

**Correct answer:** B
**Explanation:** Novel patterns slip past existing thresholds by definition. Ongoing audit of "the cases we think are fine" finds them. Lowering threshold floods reviewers; trust without verification misses drift.

---

**Q186.** Which is the correct confidence-routing pattern?

A) Per-document confidence; threshold 0.9 universally.
B) Per-field confidence; thresholds calibrated on a labelled validation set; low-confidence fields route to human review.
C) Trust the model's self-reported confidence at face value.
D) Use sentiment as a proxy for confidence.

**Correct answer:** B
**Explanation:** Per-field (not per-document) calibration on a labelled set. Document-level hides field variance; raw self-reported confidence is uncalibrated; sentiment is irrelevant.

---

### TS 5.6 — Information Provenance

**Q187.** A synthesis agent produces "studies show X" without traceable source. What was the design flaw upstream?

A) The synthesis agent's prompt is too short.
B) Subagents returned prose summaries instead of structured claim-source bundles (claim + URL + document name + excerpt + date). Attribution dies the moment any agent summarises.
C) The model is too small.
D) The synthesis agent should not exist.

**Correct answer:** B
**Explanation:** Provenance must travel with claims as structured data. Prose summaries collapse claim-source mappings. Fix: subagents return structured bundles; synthesis preserves them.

---

**Q188.** Two credible sources report different statistics for the same metric. What is the correct synthesis behaviour?

A) Pick the more recent one silently.
B) Average the two.
C) Annotate with both values and full source attribution; let the consumer decide.
D) Omit the statistic.

**Correct answer:** C
**Explanation:** Surface conflicts, don't resolve them. Picking silently erases information; averaging fabricates a number neither source reported; omitting destroys the metric entirely.

---

**Q189.** A report cites 28% (2022 data) and 32% (2024 data) for renewable share of generation. Without dates, the synthesis flagged this as a contradiction. What is the structural fix?

A) Make the model "guess less."
B) Require subagents to include publication date and data collection date in every structured output. Dates distinguish trends from contradictions.
C) Average the two values.
D) Omit one.

**Correct answer:** B
**Explanation:** Temporal metadata reframes "conflict" as "trend." Many apparent contradictions are just different reporting periods.

---

**Q190.** Financial data is rendered in prose paragraphs and reviewers find it hard to scan. What rendering matches the content?

A) Prose, but bolded.
B) Tables (numbers in prose are hard to scan and compare).
C) Bullet points.
D) JSON.

**Correct answer:** B
**Explanation:** Match rendering to content. Tables for financial data, prose for narrative, structured lists for technical findings. Uniform house style loses information.

---

### Additional Domain 5 Questions

**Q191.** A customer says, "Hi, I am extremely angry, my order didn't arrive!" The agent investigates and finds the order is eligible for an automatic replacement. What is the correct response?

A) Escalate immediately due to the anger.
B) Acknowledge frustration, offer the replacement resolution. Escalate only if the customer reiterates wanting a human.
C) Process the replacement without acknowledging frustration.
D) Ask the customer to calm down before continuing.

**Correct answer:** B
**Explanation:** Frustration alone is unreliable as an escalation trigger. The issue is resolvable; acknowledge + offer + watch for explicit escalation request.

---

**Q192.** A subagent returns `{"results": [], "isError": false}`. The agent retries the call three times. What is the design failure?

A) The agent's retry logic is wrong.
B) Either the tool is mis-reporting (a true access failure should be `isError: true`), or the agent is conflating "valid empty" with "access failure." The fix: ensure the tool returns the right error category and the agent stops retrying on valid empties.
C) The subagent should not return empty arrays.
D) Use a larger model.

**Correct answer:** B
**Explanation:** Either the contract is wrong (tool should signal `isError: true` for access failures) or the agent's recovery is wrong (retrying valid empties). Both are common bugs.

---

**Q193.** A coordinator wants to preserve information across context window exhaustion mid-task. Which pattern is correct?

A) Increase `max_tokens`.
B) Save key findings to a manifest file at checkpoints; on resume from a fresh session, load the manifest and inject into the resumed agent's prompts.
C) Lower temperature.
D) Disable the task.

**Correct answer:** B
**Explanation:** Manifest pattern survives context exhaustion. Conversation history can be discarded; manifest is the source of truth.

---

**Q194.** A research system produces a uniform bullet-point report combining financial data, technical findings, and narrative summaries of news. Reviewers find financial data hard to compare. What is the issue?

A) The report has too many sections.
B) Content-format mismatch — forcing financial data into bullets destroys comparability. Match rendering to content: tables for financial, prose for narrative, structured lists for technical.
C) The report needs more bullets.
D) The model is broken.

**Correct answer:** B
**Explanation:** Content type drives rendering. Uniform format trades clarity for consistency, which is the wrong trade. Financial → tables.

---

**Q195.** A document extraction system flags 1% of high-confidence cases via stratified sampling. The sample reveals a novel error pattern affecting 8% of cases for a new document template. What is the correct action?

A) Ignore — high-confidence cases should not be reviewed.
B) Add the new pattern to the validation set, recalibrate thresholds, and consider routing the affected document type to human review until the model's accuracy on it improves.
C) Lower the overall confidence threshold across all documents.
D) Disable the extraction system.

**Correct answer:** B
**Explanation:** Stratified sampling exists to catch exactly this. Update validation set, recalibrate, route the affected stratum appropriately. Lowering threshold universally floods reviewers; ignoring defeats the audit's purpose.

---

## Cross-Domain Integrative Scenarios (Q196–Q220)

These questions weave together two or more domains, mirroring the scenario-based structure of the real exam (Customer Support, Code Generation, Multi-Agent Research, Developer Productivity, CI/CD, Structured Data Extraction).

### Scenario A: Customer Support Resolution Agent

**Q196.** Your customer support agent has the tools `get_customer`, `lookup_order`, `process_refund`, `escalate_to_human`. Production data shows it occasionally processes refunds on misidentified accounts after skipping `get_customer`, and on a separate axis, it sometimes calls `escalate_to_human` for issues it could resolve autonomously while autonomously handling cases that need policy exceptions. Which two-part fix addresses both issues correctly?

A) (1) Stronger system prompt instruction to verify customers and (2) lower confidence threshold for escalation.
B) (1) PreToolUse hook blocking `lookup_order`/`process_refund` until `get_customer` returns a verified customer ID, AND (2) explicit categorical escalation criteria with few-shot examples demonstrating when to escalate vs resolve.
C) (1) Merge `get_customer` and `lookup_order` and (2) train a routing classifier.
D) (1) Add few-shot examples for ordering and (2) self-reported confidence threshold for escalation.

**Correct answer:** B
**Explanation:** High-stakes ordering (financial) → hook. Escalation calibration → explicit categorical criteria with few-shot. Prompt-only enforcement leaves residual failures; lower confidence is unreliable; merging tools and routing classifiers are over-engineered. Self-reported confidence is one of the two unreliable triggers.

---

**Q197.** A customer support agent loses transactional facts (refund amount, deadline, order ID) across long conversations, and on a separate axis fabricates source attribution in resolution summaries. Which combination of fixes is correct?

A) Extract transactional facts into a persistent "case facts" block injected verbatim into every prompt, AND require subagents to return structured claim-source mappings preserved through any synthesis step.
B) Disable summarisation, AND lower temperature.
C) Increase context window, AND increase temperature.
D) Drop the oldest turns, AND have the agent always cite "internal records."

**Correct answer:** A
**Explanation:** Both fixes operate at the right layer: (1) persistent case-facts block protects against summarisation losses; (2) structured claim-source mappings preserve attribution through synthesis. The distractors apply wrong-layer thinking or fabrication shortcuts.

---

**Q198.** A customer support agent's `process_refund` MCP tool occasionally returns generic "Operation failed" errors. The agent then retries indefinitely. Two issues are present. Which fix addresses both?

A) Disable retries entirely.
B) Return structured error responses (errorCategory, isRetryable, description) so the agent can distinguish transient retryable errors from business non-retryable errors, AND set a bounded `maxRetries` with backoff so even retryable errors don't loop indefinitely.
C) Always escalate every error to a human.
D) Use a stronger system prompt.

**Correct answer:** B
**Explanation:** Two-part fix: structured error responses + bounded retry budget. Generic errors prevent the agent from making intelligent recovery decisions; unbounded retries are a separate, additive operational failure.

---

**Q199.** The customer support agent is 55% first-contact-resolution, well below 80% target. Logs show the agent escalates straightforward damage-replacement cases (with photo evidence) while attempting to autonomously handle policy-exception cases requiring human judgement. Which fix addresses the root cause?

A) Add explicit escalation criteria with few-shot examples to the system prompt demonstrating when to escalate versus resolve.
B) Have the agent self-report a confidence score and route low-confidence to humans.
C) Deploy a separate classifier trained on historical tickets.
D) Implement sentiment analysis-based escalation.

**Correct answer:** A
**Explanation:** Unclear decision boundaries are the root cause. Categorical criteria with few-shot examples is the proportionate first fix. Self-reported confidence is unreliable; classifier is over-engineered; sentiment is the wrong proxy.

---

### Scenario B: Code Generation with Claude Code

**Q200.** Your team uses Claude Code and has two pain points: (1) new team members don't get team conventions because they were written to one developer's `~/.claude/CLAUDE.md`, and (2) test files spread across the codebase use varying conventions despite a "testing standards" section in CLAUDE.md being inconsistently applied. Which two-part fix is correct?

A) Move conventions to `.claude/CLAUDE.md` (committed) AND create `.claude/rules/testing.md` with `paths: ["**/*.test.*"]` for test-specific conventions.
B) Restart Claude Code AND increase context window.
C) Move conventions to root CLAUDE.md AND consolidate test conventions into one giant CLAUDE.md.
D) Use slash commands to inject conventions on demand.

**Correct answer:** A
**Explanation:** (1) Project-level CLAUDE.md is committed and shared. (2) Path-specific rules with globs apply to files spread across the codebase, loading only when relevant. Conventions live in CLAUDE.md only when universal; pattern-scattered conventions live in `.claude/rules/`.

---

**Q201.** You want all team members to access a `/review` slash command and have it produce structured JSON output usable as inline PR comments by your CI. Which is the correct combination?

A) Place command in `.claude/commands/review.md`; invoke from CI using `claude -p "/review" --output-format json --json-schema schema.json`.
B) Place command in `~/.claude/commands/`; invoke from CI without flags.
C) Place command in CLAUDE.md; invoke from CI with `--verbose`.
D) Place command in `.claude/config.json`; invoke from CI in interactive mode.

**Correct answer:** A
**Explanation:** Project-scoped command in `.claude/commands/` shares via version control. CI needs `-p` for non-interactive mode and `--output-format json --json-schema` for machine-parseable output. Inline PR comment automation requires both.

---

**Q202.** A skill produces verbose codebase analysis output that fills the main conversation context, AND occasionally writes destructive changes when developers wanted analysis only. Which combination of frontmatter options is correct?

A) `context: fork` AND `allowed-tools: [Read, Grep, Glob]`.
B) `read-only: true` AND `verbose: false`.
C) `context: main` AND `allowed-tools: all`.
D) `mode: silent` AND `prevent-writes: true`.

**Correct answer:** A
**Explanation:** `context: fork` keeps verbose output in an isolated sub-agent context. `allowed-tools` restricts the skill to read tools only. Other field names don't exist.

---

### Scenario C: Multi-Agent Research System

**Q203.** A multi-agent research system has a coordinator, web search, document analysis, and synthesis subagents. Production reveals: (1) major topic areas are missing from outputs and (2) the synthesis subagent fabricates source citations. Which two-part fix addresses both?

A) (1) Audit and broaden the coordinator's task decomposition to cover all major topic areas; (2) Pass structured claim-source bundles (claim + URL + doc + excerpt + date) all the way through to synthesis, instead of collapsing into prose.
B) (1) Increase subagent context windows and (2) lower temperature.
C) (1) Remove the synthesis agent and (2) merge web search with document analysis.
D) (1) Have subagents call each other directly and (2) reduce few-shot examples.

**Correct answer:** A
**Explanation:** Missing topics → coordinator decomposition (upstream). Missing citations → context-passing format. Each symptom has its own root cause and own fix. Subagents must not call each other; merging defeats hub-and-spoke; context windows don't address either issue.

---

**Q204.** Your research coordinator emits subagent invocations sequentially, tripling latency. You also observe the synthesis agent frequently bouncing simple verification questions back to the coordinator (40% latency overhead). Which two-part fix is correct?

A) (1) Emit independent subagent invocations as parallel `Task` tool_use blocks in a single coordinator response; (2) Give the synthesis agent a scoped `verify_fact(claim, max_sources=3)` tool with explicit fallback to the coordinator for complex multi-source verifications.
B) (1) Use larger models everywhere and (2) cache web search results.
C) (1) Merge all subagents into one; (2) increase max_tokens.
D) (1) Have subagents share global memory; (2) disable verification.

**Correct answer:** A
**Explanation:** (1) Parallel `Task` blocks in one turn execute concurrently. (2) Scoped cross-role tool for the common case + explicit fallback for complex cases. Both are documented patterns. Distractors break the hub-and-spoke topology or over-engineer.

---

**Q205.** A subagent in the research system times out. The current implementation returns `{"results": [], "status": "ok"}` so "the pipeline continues gracefully," and the workflow occasionally produces reports with major coverage gaps that are not flagged. Which combination is correct?

A) Replace silent suppression with structured error context (failure type, attempted query, partial results, alternatives), AND have the synthesis agent emit coverage annotations distinguishing well-established findings from areas with unavailable sources.
B) Increase the subagent's retry count to 100.
C) Catch the exception silently and log it.
D) Terminate the pipeline on any subagent failure.

**Correct answer:** A
**Explanation:** Silent suppression is the worst pattern. Structured errors enable recovery, and coverage annotations preserve gap visibility. Retry without recovery context still hits the timeout; termination throws away successful subagents; silent logging hides failure during execution.

---

**Q206.** A multi-agent research output presents two conflicting renewable-energy statistics (28% vs 32%) as a contradiction. Investigation shows the figures come from different years (2022 and 2024 respectively). What is the structural fix?

A) Have the synthesis agent pick the more recent figure silently.
B) Require subagents to include publication date AND data collection date in every structured output; the synthesis distinguishes trends (different dates) from contradictions (same date, different values).
C) Average the values.
D) Omit conflicting statistics.

**Correct answer:** B
**Explanation:** Temporal metadata reframes apparent conflicts as trends. Date-aware reconciliation is required structural metadata.

---

### Scenario D: Developer Productivity Tools

**Q207.** A developer-productivity agent explores unfamiliar codebases and helps with refactors. Over a long session, it starts referring to "typical patterns" instead of specific classes it discovered earlier, AND its `Edit` tool calls increasingly fail with "multiple matches." Which two-part fix is correct?

A) Write key findings to a scratchpad file referenced for subsequent questions, AND use Edit failure escalation (expand anchor → Read + Write fallback for truly identical surroundings).
B) Increase context window AND switch from Edit to Bash sed.
C) Lower temperature AND increase max_tokens.
D) Restart from scratch AND avoid using Edit entirely.

**Correct answer:** A
**Explanation:** Scratchpad files persist context across degradation. Edit failure escalation has a documented ladder: expand anchor first, then Read + Write fallback. `sed` is a wrong tool category; temperature doesn't address retention; restart hits the same problem at the same turn count.

---

**Q208.** A developer-productivity agent has 18 tools and frequently selects suboptimal ones. The team has also noticed that built-in Grep is preferred over a more capable semantic-search MCP tool. Which two-part fix is correct?

A) Scope tools by role across multiple specialist agents (4-5 each), AND enhance the MCP tool's description with examples and explicit boundary clauses against built-in Grep (e.g., "Use this for semantic queries; prefer Grep for exact string matches").
B) Add all tools to all agents AND remove Grep.
C) Reduce tool count via merging AND use a routing classifier.
D) Increase context window AND lower temperature.

**Correct answer:** A
**Explanation:** Tool overload (18 tools) → scope by role (4-5 each). Built-in vs MCP overlap → enhance MCP description with examples and boundaries. Removing Grep over-restricts; merging tools loses distinction; classifier is over-engineered.

---

**Q209.** A developer-productivity agent makes many exploratory MCP tool calls at conversation start to discover what content is available. Token usage is high. What is the correct architectural fix?

A) Increase the model's context window.
B) Expose MCP **resources** that catalogue available content (e.g., issue summaries, schema docs, doc hierarchies). The agent reads the catalogue once, then queries precisely.
C) Disable exploratory tools.
D) Cache previous tool calls across conversations.

**Correct answer:** B
**Explanation:** MCP resources expose content catalogues; the agent reads once, then queries precisely. Larger windows treat the symptom; disabling tools breaks the workflow; cross-conversation caching introduces staleness.

---

### Scenario E: Claude Code for CI/CD

**Q210.** A CI pipeline runs `claude "Analyse this PR"` and hangs. After fixing that issue, the pipeline output is plain text and the team wants machine-parseable JSON for automated inline PR comments. Which sequence of CLI fixes is correct?

A) Add `-p` flag for non-interactive mode, AND add `--output-format json --json-schema schema.json` for machine-parseable output constrained to a specific shape.
B) Increase timeout AND post-process the prose output.
C) Set `CLAUDE_HEADLESS=true` AND use `--format yaml`.
D) Redirect stdin from `/dev/null` AND use a regex parser.

**Correct answer:** A
**Explanation:** `-p` runs in non-interactive mode (the documented fix). `--output-format json --json-schema` constrains JSON for downstream parsing. Distractors use non-existent env vars or post-process fragile prose.

---

**Q211.** Your team reports comment fatigue from the PR review bot. Inspection shows: (1) the same Claude session is used for code generation and review (motivated reasoning); (2) re-runs after new commits post duplicate comments on issues already addressed. Which two-part fix is correct?

A) Use a fresh, independent Claude Code instance for the review step (no prior reasoning context), AND on re-runs, pass prior review findings in context with instructions to report only new or still-unaddressed issues.
B) Lower the temperature on review AND disable re-runs.
C) Use a larger model for review AND post all comments anyway.
D) Disable the review bot entirely.

**Correct answer:** A
**Explanation:** (1) Session context isolation: motivated reasoning makes self-review unreliable. (2) Incremental review context: prior findings + "report only new" instruction. Both at the right architectural layer.

---

**Q212.** A CI workflow runs both (1) a blocking pre-merge code review and (2) overnight technical debt reports. The manager proposes "switch everything to batch for 50% cost savings." How should you respond?

A) Switch both to batch.
B) Keep both synchronous.
C) Keep the pre-merge check synchronous (blocking workflow, developers wait); move overnight debt reports to batch (latency-tolerant, no human waiting).
D) Disable batch processing.

**Correct answer:** C
**Explanation:** Mixed strategy. Blocking → synchronous. Latency-tolerant → batch. Don't switch blocking workflows to batch; don't suppress real cost savings on latency-tolerant ones.

---

**Q213.** A 14-file PR is reviewed in a single pass producing inconsistent depth and contradictory findings, AND your CI generates many low-quality tests (testing trivial getters, redundant scenarios). Which two-part fix is correct?

A) Split reviews into per-file passes + cross-file integration pass, AND strengthen `.claude/CLAUDE.md` with testing standards (what makes a valuable test, available fixtures, patterns).
B) Use a larger context window AND train developers better.
C) Run three independent reviews AND disable test generation.
D) Increase temperature AND use more tools.

**Correct answer:** A
**Explanation:** Attention dilution → per-file + cross-file passes. CI test quality → CLAUDE.md test value criteria. Both are documented patterns at the right layer.

---

### Scenario F: Structured Data Extraction

**Q214.** A structured data extraction system has two problems: (1) for 15% of source documents that lack certain fields, the model fabricates values; (2) when extraction format is wrong (e.g., date format), the system has no recovery mechanism. Which two-part fix is correct?

A) Make affected fields nullable in the schema (instructing the model to return null when not present), AND implement validation-retry-with-feedback (resend the original document, failed extraction, and specific validation error for self-correction).
B) Make all fields required AND increase retry limit.
C) Add "do not fabricate" to the prompt AND switch models.
D) Lower temperature AND use `tool_choice: 'any'`.

**Correct answer:** A
**Explanation:** Source gaps → nullable schema. Output format errors → validation-retry with feedback. Two distinct failure modes, two distinct fixes — at the right layer each. "All fields required" is a fabrication factory; "do not fabricate" prompt loses to structural pressure.

---

**Q215.** Your extraction system processes 100,000 documents nightly. Out of these, 200 fail due to oversized inputs. Which is the correct handling approach?

A) Resubmit the entire 100,000-document batch.
B) Use `custom_id` to identify the 200 failed documents, chunk them into smaller pieces, and resubmit only those with the chunking modifications.
C) Switch the entire workflow to synchronous.
D) Ignore the failures.

**Correct answer:** B
**Explanation:** `custom_id` correlates request/response. Resubmit only failures with appropriate modifications. Re-batching everything wastes savings; switching to synchronous breaks the latency-tolerant design; ignoring loses data.

---

**Q216.** Your extraction system achieves 97% overall accuracy on a labelled validation set. Stakeholders want to automate. You also want to catch novel error patterns post-deployment. Which two-part discipline is correct?

A) Validate accuracy by document type AND field segment before automating; after deployment, implement stratified random sampling of high-confidence extractions for ongoing audit.
B) Trust the 97% headline; sample only low-confidence cases for review.
C) Disable automation entirely.
D) Lower confidence threshold to 0.5 universally.

**Correct answer:** A
**Explanation:** Aggregate metrics hide stratum failures (validation by type + field). Novel error patterns slip past existing thresholds (stratified sampling of high-confidence). Both fixes are at the validation-discipline layer.

---

**Q217.** A vendor invoice extraction must (1) handle line items that don't always sum to the stated total, and (2) flag internally inconsistent dates (header vs footer). Which schema design fits both?

A) Extract `stated_total` and `calculated_total` (sum line items yourself) and flag discrepancies, AND add a `conflict_detected` boolean for internally inconsistent source data.
B) Require fields to be exact and reject mismatched documents.
C) Use `tool_use` with all fields required so the schema enforces consistency.
D) Average mismatched values.

**Correct answer:** A
**Explanation:** Self-correction via redundant extraction (`stated_total` + `calculated_total`) and `conflict_detected` boolean surface inconsistencies as data, letting the consumer decide. Schemas don't do arithmetic; required fields invite fabrication; averaging fabricates.

---

**Q218.** Your extraction system processes documents of unknown type (could be invoice, receipt, or contract). You need guaranteed structured output. Which `tool_choice` setting is correct, and why?

A) `"auto"` — the model may return text or call a tool as appropriate.
B) `"any"` — the model must call some tool, and the model picks which based on the document type.
C) `{"type": "tool", "name": "extract_invoice"}` — forces the invoice tool every time.
D) Omit `tool_choice` to use defaults.

**Correct answer:** B
**Explanation:** `"any"` forces structured output (must call a tool) while letting the model select the right tool per document type. `"auto"` lets the model return text; named-tool routes wrong documents through the wrong tool; omit defaults to `"auto"`.

---

### Mixed/Integrative

**Q219.** Which set of distractor patterns recurs across all five domains and should be **rejected on sight**?

A) "Increase the context window so the problem fits."
B) "Use a stronger system prompt instruction to enforce the behaviour."
C) "Run all subagents in parallel even when synthesis depends on them."
D) All three of the above are recurring wrong-layer distractors.

**Correct answer:** D
**Explanation:** "Increase context window" — wrong for attention dilution, lost-in-the-middle, accumulation problems. "Stronger system prompt" — wrong when financial/security/compliance enforcement is needed (use hooks/tool_choice/schema design). "Parallel synthesis with dependencies" — breaks structural ordering. All three appear repeatedly and are wrong.

---

**Q220.** Which **single architectural principle** unifies the most-tested patterns in this exam?

A) "Bigger context window is always better."
B) "Deterministic > probabilistic when stakes are real; structured > prose for downstream survival; calibrated > raw self-reported confidence."
C) "Always use multi-agent over single agent."
D) "Hooks fix everything."

**Correct answer:** B
**Explanation:** This three-part principle unifies Domain 1 (hooks for high stakes), Domain 2 (structured errors), Domain 4 (categorical criteria, schema design), Domain 5 (case-facts blocks, calibrated confidence). Memorise it as the architectural through-line.

---

## Answer Key (Quick Reference)

For rapid self-grading. Read explanations on items you got wrong.

| Q | A | Q | A | Q | A | Q | A | Q | A |
|---|---|---|---|---|---|---|---|---|---|
| 1 | B | 45 | C | 89 | B | 133 | B | 177 | B |
| 2 | A | 46 | B | 90 | A | 134 | B | 178 | C |
| 3 | A | 47 | B | 91 | B | 135 | B | 179 | B |
| 4 | D | 48 | A | 92 | B | 136 | B | 180 | B |
| 5 | B | 49 | A | 93 | B | 137 | C | 181 | A |
| 6 | C | 50 | A | 94 | B | 138 | B | 182 | B |
| 7 | C | 51 | B | 95 | A | 139 | A | 183 | B |
| 8 | B | 52 | C | 96 | B | 140 | C | 184 | A |
| 9 | B | 53 | A | 97 | B | 141 | C | 185 | B |
| 10 | B | 54 | D | 98 | C | 142 | B | 186 | B |
| 11 | B | 55 | B | 99 | B | 143 | C | 187 | B |
| 12 | C | 56 | B | 100 | B | 144 | B | 188 | C |
| 13 | A | 57 | C | 101 | B | 145 | C | 189 | B |
| 14 | A | 58 | B | 102 | B | 146 | C | 190 | B |
| 15 | C | 59 | A | 103 | B | 147 | C | 191 | B |
| 16 | B | 60 | B | 104 | B | 148 | B | 192 | B |
| 17 | A | 61 | B | 105 | C | 149 | B | 193 | B |
| 18 | B | 62 | B | 106 | B | 150 | B | 194 | B |
| 19 | C | 63 | B | 107 | B | 151 | B | 195 | B |
| 20 | C | 64 | B | 108 | B | 152 | B | 196 | B |
| 21 | C | 65 | B | 109 | C | 153 | B | 197 | A |
| 22 | A | 66 | C | 110 | B | 154 | B | 198 | B |
| 23 | B | 67 | B | 111 | B | 155 | B | 199 | A |
| 24 | C | 68 | B | 112 | B | 156 | B | 200 | A |
| 25 | B | 69 | B | 113 | B | 157 | D | 201 | A |
| 26 | B | 70 | B | 114 | C | 158 | B | 202 | A |
| 27 | B | 71 | B | 115 | B | 159 | B | 203 | A |
| 28 | A | 72 | A | 116 | B | 160 | B | 204 | A |
| 29 | B | 73 | C | 117 | B | 161 | B | 205 | A |
| 30 | B | 74 | A | 118 | C | 162 | B | 206 | B |
| 31 | B | 75 | B | 119 | B | 163 | B | 207 | A |
| 32 | A | 76 | B | 120 | C | 164 | B | 208 | A |
| 33 | B | 77 | B | 121 | B | 165 | B | 209 | B |
| 34 | A | 78 | C | 122 | B | 166 | B | 210 | A |
| 35 | C | 79 | B | 123 | B | 167 | B | 211 | A |
| 36 | A | 80 | B | 124 | B | 168 | B | 212 | C |
| 37 | B | 81 | B | 125 | B | 169 | B | 213 | A |
| 38 | C | 82 | A | 126 | C | 170 | B | 214 | A |
| 39 | B | 83 | B | 127 | C | 171 | C | 215 | B |
| 40 | B | 84 | B | 128 | B | 172 | C | 216 | A |
| 41 | B | 85 | C | 129 | B | 173 | B | 217 | A |
| 42 | C | 86 | B | 130 | B | 174 | C | 218 | B |
| 43 | B | 87 | B | 131 | B | 175 | C | 219 | D |
| 44 | B | 88 | B | 132 | C | 176 | B | 220 | B |

---

## Topic Index (Fast Lookup by Concept)

Use this to drill weak areas. Each concept links to question numbers covering it.

### Domain 1
- **Agentic loop & `stop_reason`:** Q1, Q2, Q3, Q4, Q5, Q50
- **Multi-agent orchestration / hub-and-spoke:** Q6, Q7, Q9, Q10, Q11, Q12, Q46
- **Subagent invocation, `Task` tool, `allowedTools`:** Q13, Q14, Q15, Q49
- **Subagent isolation principle (no inherited context):** Q8, Q18, Q19
- **Workflow enforcement (hooks vs prompts):** Q20, Q21, Q26, Q45
- **PreToolUse vs PostToolUse:** Q24, Q25, Q27, Q28, Q29
- **Multi-concern requests / handoff:** Q22, Q23
- **Task decomposition strategies:** Q30, Q31, Q32, Q33, Q34
- **Session management (resume, fork, manifests):** Q35, Q36, Q37, Q38
- **Error handling, idempotency, retries:** Q42, Q43, Q44
- **Escalation triggers (valid / unreliable):** Q39, Q40
- **Ambiguous customer matches:** Q41
- **Parallel vs sequential subagents:** Q47, Q48

### Domain 2
- **Tool description quality / routing:** Q51, Q52, Q53, Q54, Q55, Q76, Q77, Q78, Q81
- **Tool splitting (`or` / `depending on`):** Q52
- **Structured error responses (`isError`, categories):** Q56, Q57, Q58, Q59, Q60, Q80
- **Retry semantics:** Q59, Q85
- **Subagent local recovery:** Q60
- **Tool count / scoping by role:** Q61
- **`tool_choice` (`auto` / `any` / named):** Q62, Q64, Q77
- **Scoped cross-role tools (`verify_fact` pattern):** Q63
- **Constrained alternatives (`load_document` not `fetch_url`):** Q65
- **MCP server scoping & credentials (`${VAR}`):** Q66, Q67
- **MCP resources for content catalogues:** Q68, Q83
- **Custom vs community MCP servers:** Q69
- **Built-in vs MCP tool overlap:** Q70
- **Grep vs Glob:** Q71, Q72, Q74
- **Edit failure ladder:** Q73
- **Incremental codebase understanding:** Q75
- **Tool result trimming:** Q79
- **MCP overload at server layer:** Q82
- **Layer awareness (API vs CLI hooks):** Q84

### Domain 3
- **CLAUDE.md hierarchy paths (user/project/directory):** Q86, Q87, Q90
- **`~/.claude/` vs `.claude/` divergent-developers bug:** Q86, Q91, Q125
- **`/memory` for diagnosis:** Q88, Q125
- **Modular CLAUDE.md (`@import`, `.claude/rules/`):** Q89
- **Project vs personal slash commands:** Q92
- **Skill frontmatter (`context: fork`, `allowed-tools`, `argument-hint`):** Q93, Q94, Q95, Q124
- **Personal skill customisation:** Q96, Q124
- **Skills vs CLAUDE.md (on-demand vs always-loaded):** Q97, Q98
- **Skill directory naming:** Q99
- **Path-specific rules in `.claude/rules/`:** Q100, Q101, Q102, Q103, Q104, Q120
- **Plan mode vs direct execution:** Q105, Q106, Q108, Q109, Q122
- **Explore subagent:** Q107
- **Iterative refinement (examples, interview, test-driven):** Q110, Q111, Q113
- **Interacting vs independent feedback:** Q112
- **CI/CD `-p` flag:** Q114
- **CI/CD structured JSON output:** Q115, Q123
- **CLAUDE.md for CI test quality:** Q116
- **Session context isolation (PR review):** Q117
- **Incremental review context (comment fatigue):** Q118, Q119
- **Slash command vs ambient standards:** Q121

### Domain 4
- **Categorical criteria vs vague adjectives:** Q126
- **False-positive trust spillover:** Q127
- **Severity calibration with code examples:** Q128
- **Few-shot patterns (count, content, deployment triggers):** Q129, Q130, Q131, Q132, Q153, Q157
- **`tool_use` syntactic guarantees:** Q133
- **Fabrication factory (required + absent source):** Q134, Q155
- **`tool_choice` settings:** Q135, Q136
- **`tool_use` semantic limitations:** Q137, Q165
- **Schema patterns (nullable, unclear, other + detail):** Q138, Q154, Q156, Q160
- **Validation-retry effectiveness boundary:** Q139, Q140, Q141
- **`detected_pattern` field for improvement:** Q142
- **Self-correction (`calculated` vs `stated`, `conflict_detected`):** Q143, Q144
- **Batch API characteristics (50% cost, 24h, no multi-turn):** Q145, Q146, Q147, Q158
- **Batch failure handling by `custom_id`:** Q148
- **Refining prompts synchronously before batch:** Q149
- **Self-review limitation:** Q150, Q159
- **Multi-pass review architecture:** Q151
- **Confidence calibration (per-field, validation set):** Q152, Q163, Q164
- **Aggregate-metrics trap (stratified validation):** Q161
- **Stratified sampling of high-confidence cases:** Q162

### Domain 5
- **Persistent "case facts" block:** Q166
- **Lost in the middle / structural attention:** Q167
- **Tool result trimming:** Q168
- **Upstream subagent return shape:** Q169
- **Stateless API:** Q170
- **Three valid escalation triggers:** Q171, Q175
- **Explicit human request:** Q172, Q191
- **Frustration nuance:** Q173, Q191
- **Ambiguous customer matches:** Q174
- **Silent suppression (worst pattern):** Q176, Q192
- **Structured error context (four fields):** Q177
- **Valid empty vs access failure:** Q178, Q192
- **Coverage annotations / partial-results preservation:** Q179
- **Context degradation symptoms:** Q180
- **Scratchpad vs `/compact`:** Q181
- **Manifest pattern for crash recovery:** Q182, Q193
- **Subagent delegation for context isolation:** Q183
- **Aggregate metrics hide strata:** Q184
- **Stratified sampling post-deployment:** Q185, Q195
- **Per-field confidence calibration:** Q186
- **Provenance / claim-source mappings:** Q187
- **Conflict handling (don't average, don't pick silently):** Q188
- **Temporal metadata (dates distinguish trends from contradictions):** Q189
- **Content-appropriate rendering:** Q190, Q194

### Cross-Domain Scenarios
- **Customer Support:** Q196, Q197, Q198, Q199
- **Code Generation:** Q200, Q201, Q202
- **Multi-Agent Research:** Q203, Q204, Q205, Q206
- **Developer Productivity:** Q207, Q208, Q209
- **CI/CD:** Q210, Q211, Q212, Q213
- **Structured Data Extraction:** Q214, Q215, Q216, Q217, Q218
- **Unifying principles & distractor patterns:** Q219, Q220

---

## Final Notes

**The signature distractor shapes to reject on sight (across all domains):**

1. "Increase the context window so the problem fits." (Wrong for attention dilution, accumulation, lost-in-the-middle.)
2. "Add a stronger system prompt instruction." (Wrong when stakes are real — hooks/`tool_choice`/schema design are correct.)
3. "Lower the temperature." (Wrong for judgement, consistency, fabrication, and most other failure modes.)
4. "Use a larger model." (Wrong for design-layer problems.)
5. "Have subagent A pass results directly to subagent B." (Always wrong — hub-and-spoke topology.)
6. "Average the conflicting figures to balance the sources." (Always wrong — fabricates a number.)
7. "Use sentiment-based or self-reported confidence to escalate." (Always wrong — both are unreliable.)
8. "Retry indefinitely." (Always wrong — bound the retry budget.)
9. "Return empty results with status=ok on tool failure." (Silent suppression — the worst error pattern.)
10. "Make all fields required to guarantee complete extractions." (Fabrication factory.)

**The signature correct-answer shapes (across all domains):**

1. "Hook / programmatic gate" — for high-stakes ordering and compliance.
2. "Structured data passed verbatim" — for context preservation across boundaries.
3. "Few-shot examples with reasoning, 2-4 targeted on ambiguous cases" — for judgement consistency.
4. "Nullable fields / `unclear` enum / `other` + detail" — for source-gap handling.
5. "Validation-retry with feedback (original document + failed extraction + specific error)" — for output errors.
6. "Calibrated, field-level confidence routing to human review" — for human-in-the-loop.
7. "Persistent case-facts block injected verbatim into every prompt" — against summarisation losses.
8. "Match the rendering to the content type." — for synthesis outputs.
9. "Per-file pass + cross-file integration pass." — for large-PR review.
10. "Independent Claude instance for review" — for self-review limitations.

Print this question bank, work through it twice, and read all explanations. By the second pass, the distractor patterns become recognisable on sight — and that is how you pass with margin to spare.
