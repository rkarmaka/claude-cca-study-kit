# Claude Certified Architect — Foundations: Study Materials & Practice App

Self-made study notes, an original practice-question bank, and a local
practice-exam web app for the **Claude Certified Architect (CCA) — Foundations**
certification.

> **Disclaimer.** This is an independent, community study project. It is **not**
> affiliated with, endorsed by, or sponsored by Anthropic. It contains **no
> questions from the real certification exam** — all practice questions are
> original, written in the exam's style from the publicly available exam guide.
> Use it as a study aid alongside the official materials.

## Contents

| Path | What it is |
|------|------------|
| [`STUDY-GUIDE.md`](./STUDY-GUIDE.md) | How to use this repo — a suggested two-week study plan |
| [`study-notes/domain1.md`](./study-notes/domain1.md) – [`domain5.md`](./study-notes/domain5.md) | Condensed notes / cheatsheets, one per exam domain |
| [`study-notes/scenario-guide.md`](./study-notes/scenario-guide.md) | The 6 exam scenarios mapped to domains and the patterns each tests |
| [`study-notes/glossary.md`](./study-notes/glossary.md) | Every term, flag, path, and API the exam tests |
| [`study-notes/master-trap-sheet.md`](./study-notes/master-trap-sheet.md) | Every distractor pattern on one page — read it exam morning |
| [`flashcards.md`](./flashcards.md) | 111 quick-recall flashcards across all domains |
| [`anki/`](./anki/) | Builds an Anki-importable deck from the flashcards |
| [`practice-exam/question-bank.md`](./practice-exam/question-bank.md) | 220 original practice questions with answers and explanations |
| [`practice-exam/`](./practice-exam/) | A static (HTML/PDF) practice exam |
| [`exam-app/`](./exam-app/) | A local Flask app that runs timed, scored mock exams |
| [`cheatsheet-prompt.md`](./cheatsheet-prompt.md), [`slides-prompt.md`](./slides-prompt.md) | Prompts used to generate the study aids |
| [`docs/`](./docs/) | A GitHub Pages site: the practice exam, runnable in a browser |

## Exam domains & weighting

The notes and practice exam follow the published blueprint:

| Domain | Topic | Weight |
|--------|-------|--------|
| 1 | Agentic Architecture & Orchestration | 27% |
| 2 | Tool Design & MCP Integration | 18% |
| 3 | Claude Code Configuration & Workflows | 20% |
| 4 | Prompt Engineering & Structured Output | 20% |
| 5 | Context Management & Reliability | 15% |

## Practice app — quick start

```bash
cd exam-app
python3 -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt
python3 convert_to_json.py    # builds questions.json from ../question-bank.md
python3 app.py                # serves at http://localhost:5050
```

Each run samples 60 questions weighted by domain, enforces a 120-minute timer,
and reports a scaled score (pass at 720/1000) with a per-domain breakdown and
full answer review. See [`exam-app/README.md`](./exam-app/README.md) for details.

## Flashcards (Anki)

A pre-built 111-card deck is at [`anki/cca-flashcards.txt`](./anki/cca-flashcards.txt),
tagged by domain (`CCA::D1`–`CCA::D5`). Import it into Anki, or regenerate it from
`flashcards.md` with `python3 anki/build_anki.py`. See [`anki/README.md`](./anki/README.md).

## Run the practice exam in a browser (GitHub Pages)

The [`docs/`](./docs/) folder is a self-contained static site (a landing page plus
the static practice exam). To publish it:

1. Push this repo to GitHub.
2. **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/docs`.
3. The site appears at `https://<your-username>.github.io/<repo-name>/`.

Only `docs/` is published, so the Flask app and the (excluded) exam-guide PDF stay
out of the public site.

## What's *not* in this repo

To respect copyright and keep personal data out of version control, the
following are intentionally excluded (see `.gitignore`) and were never committed:

- Saved copies of the real exam platform pages and screenshots of the live exam
- The official exam-guide PDF
- A saved login/session token and personal account details

If you're studying for this certification, get those from the official source.

## License

Dual-licensed — see [`LICENSE-CONTENT.md`](./LICENSE-CONTENT.md) for the split:

- **Code** (`exam-app/`): [MIT](./LICENSE)
- **Written study materials** (notes, flashcards, question bank, prompts):
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
