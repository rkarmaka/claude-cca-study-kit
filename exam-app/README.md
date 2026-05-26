# CCA Foundations — Practice Exam App

A minimal local web app for practising the Claude Certified Architect (Foundations) exam.

- 60 questions, randomly sampled each run, distributed across domains by exam weight
- 120-minute timer with auto-submit on expiry
- Scaled score (100–1000, pass at 720), per-domain breakdown, full answer review with explanations
- Each exam run saved as a JSON file in `exam_runs/`

## Setup

```bash
cd exam-app
python3 -m venv .venv && source .venv/bin/activate     # optional
pip install -r requirements.txt
python3 convert_to_json.py    # parses ../question-bank.md into questions.json
python3 app.py                # serves at http://localhost:5050
```

Then open <http://localhost:5050> in a browser.

## Question distribution per exam

| Domain | Weight | Questions |
|---|---|---|
| 1. Agentic Architecture & Orchestration | 27% | 15 |
| 2. Tool Design & MCP Integration | 18% | 10 |
| 3. Claude Code Configuration & Workflows | 20% | 11 |
| 4. Prompt Engineering & Structured Output | 20% | 11 |
| 5. Context Management & Reliability | 15% | 8 |
| Cross-Domain Integrative Scenarios | — | 5 |
| **Total** | | **60** |

## Files

```
exam-app/
├── app.py                   # Flask server
├── convert_to_json.py       # markdown → questions.json
├── questions.json           # generated; do not edit manually
├── requirements.txt
├── exam_runs/               # one JSON per attempt (created at runtime)
├── templates/               # Jinja templates
└── static/                  # CSS + JS
```

## Updating questions

If you edit `../question-bank.md`, re-run:

```bash
python3 convert_to_json.py
```

Then restart `app.py`.

## JSON schema (per exam run)

Each file at `exam_runs/<exam_id>.json` looks like:

```jsonc
{
  "exam_id": "a1b2c3d4e5",
  "started_at":   "2026-05-16T14:30:00+00:00",
  "expires_at":   "2026-05-16T16:30:00+00:00",
  "submitted_at": "2026-05-16T15:42:11+00:00",
  "duration_minutes": 120,
  "duration_seconds": 4331,
  "pass_threshold": 720,
  "questions": [ /* 60 sampled question objects */ ],
  "user_answers": { "1": "B", "2": "A", /* ... */ },
  "score": {
    "total": 60,
    "correct": 47,
    "percent": 78.3,
    "scaled": 805,
    "passed": true,
    "pass_threshold": 720,
    "by_domain": {
      "1": { "id": 1, "label": "Agentic Architecture", "total": 15, "correct": 11, "percent": 73.3 },
      /* ... */
    }
  }
}
```
