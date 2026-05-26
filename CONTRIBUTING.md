# Contributing

Thanks for helping improve this community study resource for the **Claude Certified
Architect (CCA) — Foundations** exam. Corrections, new practice questions, and new
flashcards are all welcome.

> **Ground rule:** contribute **only original material** written from the public
> exam guide. Do **not** submit real exam questions, screenshots of the live exam,
> or anything under NDA. This repo deliberately contains no real exam content, and
> PRs that add any will be closed.

## Ways to contribute

| You want to… | Do this |
|---|---|
| Fix a typo, wrong answer, or misleading explanation | Open a PR (or an issue if unsure) |
| Add a practice question | Add it to `practice-exam/question-bank.md` (format below) |
| Add a flashcard | Add a card to `flashcards.md`, then regenerate the deck |
| Improve the notes | Edit the relevant `study-notes/domain*.md` |

## Adding a practice question

Append to the correct domain section of
[`practice-exam/question-bank.md`](./practice-exam/question-bank.md), keeping the
existing numbering and this exact shape:

```markdown
**Q###.** <scenario stem — a realistic situation, then a clear question>

A) <distractor a plausible-but-wrong answer a candidate might pick>
B) <correct answer>
C) <distractor>
D) <distractor>

**Correct answer:** B
**Explanation:** <why B is right AND why each distractor is wrong — teach the
pattern, not just the fact>
```

Guidelines:
- **One correct answer, three distractors.** Distractors should be tempting (the
  thing someone with incomplete knowledge would choose), not obviously wrong.
- **Explain every distractor**, not just the right answer — the explanations are
  the most valuable part.
- Keep questions in the **style of the exam guide**: scenario-driven, judgement-
  based, testing tradeoffs rather than trivia.
- Put the question in the section matching its domain (the bank is ordered D1→D5
  plus cross-domain).

After adding questions, rebuild the app's data so they appear in mock exams:

```bash
cd exam-app && python3 convert_to_json.py
```

## Adding a flashcard

Append a card to [`flashcards.md`](./flashcards.md) using this format:

```markdown
## D3 · Short title

**FRONT**
> The prompt or scenario.

**BACK**
- The rule / answer.
- 🚨 The trap to avoid.
```

Prefix the heading with `D1`–`D5` to set the Anki domain tag, then regenerate the
deck:

```bash
cd anki && python3 build_anki.py
```

Commit the regenerated `anki/cca-flashcards.txt` along with your card.

## Style

- British or American spelling is fine — match the file you're editing.
- Use `code formatting` for literals: paths (`~/.claude/CLAUDE.md`), flags (`-p`),
  fields (`stop_reason`), enums (`"any"`).
- Keep explanations tight. One sentence that changes what the reader knows beats a
  paragraph that restates the question.

## Licensing of contributions

By contributing you agree your work is licensed under the same terms as the repo:
code under [MIT](./LICENSE), written study materials under
[CC BY 4.0](./LICENSE-CONTENT.md).
