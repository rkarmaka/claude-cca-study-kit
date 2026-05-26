# How to study with this repo

A suggested path through the materials for the **Claude Certified Architect (CCA)
— Foundations** exam. Adjust to your timeline; the order matters more than the
day count.

> **Pass mark:** 720/1000, scaled across 4 of 6 scenarios. The exam is multiple
> choice and scenario-driven — it rewards recognising *patterns and traps*, not
> memorising trivia. These materials are built around that.

## The materials, and when to use each

| Material | Use it for | When |
|---|---|---|
| [`study-notes/domain1.md`–`domain5.md`](./study-notes/) | Learning each domain's rules, tables, and mnemonics | First pass, then targeted review |
| [`study-notes/glossary.md`](./study-notes/glossary.md) | Looking up a term, flag, path, or API | Throughout, as a reference |
| [`flashcards.md`](./flashcards.md) / [`anki/`](./anki/) | Drilling repeat-mistake patterns | Daily, spaced repetition |
| [`practice-exam/question-bank.md`](./practice-exam/question-bank.md) | 220 questions with explanations | After each domain |
| [`exam-app/`](./exam-app/) | Timed, scored 60-question mock exams | Once you've covered all domains |
| [`study-notes/master-trap-sheet.md`](./study-notes/master-trap-sheet.md) | Final consolidation of every distractor pattern | The day before / morning of |

## Exam blueprint (weighting)

| Domain | Topic | Weight |
|---|---|---|
| 1 | Agentic Architecture & Orchestration | **27%** |
| 2 | Tool Design & MCP Integration | 18% |
| 3 | Claude Code Configuration & Workflows | 20% |
| 4 | Prompt Engineering & Structured Output | 20% |
| 5 | Context Management & Reliability | 15% |

Spend study time roughly in proportion. Domain 1 is the single biggest lever;
Domain 5 is smallest but its concepts cascade into 1, 2, and 4.

## A two-week plan

**Days 1–6 — learn the domains (one per ~1.5 days, weighted).**
For each domain: read the cheatsheet → answer that domain's slice of the question
bank with the answers covered → re-read the explanations *even for the ones you got
right* (the wrong-answer patterns recur) → note anything you missed.

- Day 1–2: Domain 1 (Q1–Q50)
- Day 3: Domain 2 (Q51–Q85)
- Day 4: Domain 3 (Q86–Q125)
- Day 5: Domain 4 (Q126–Q165)
- Day 6: Domain 5 (Q166–Q195) + cross-domain (Q196–Q220)

**Days 7–11 — drill and test.**
- Import the [Anki deck](./anki/) and review it daily (10 min).
- Take a full mock in the [exam app](./exam-app/) each day.
- After each mock, open the matching domain cheatsheet's *Distractor-Recognition
  Cribsheet* for every question you missed. Find the rule you violated.

**Days 12–13 — close the gaps.**
- Re-take mocks until you're consistently above ~800/1000 with no domain below 70%.
- Re-read the cheatsheets for your two weakest domains.

**Day 14 — consolidate.**
- Read [`master-trap-sheet.md`](./study-notes/master-trap-sheet.md) end to end.
- Light Anki review. Don't cram new material.

## How to read a scenario question (the meta-skill)

1. **Read the constraints twice.** "Stakeholders rejected X", "without modifying the
   tool", "must happen for everyone" each eliminate whole classes of answers.
2. **Identify the stakes.** Real loss (money/security/compliance/safety) →
   deterministic mechanism. Recoverable UX → prompt-level.
3. **Identify the layer.** API agent design vs Claude Code harness vs MCP config vs
   schema/prompt vs history management. Most distractors are the right idea at the
   wrong layer.
4. **Pick the cheapest fix that addresses the root cause**, not a symptom.
5. **Eliminate the always-false statements** (see the master trap sheet).

## A note on honesty

These are independent, community-written study aids — **no real exam questions**.
They reflect the published exam guide and the author's own reasoning. Use them
alongside the official materials, not instead of them.
