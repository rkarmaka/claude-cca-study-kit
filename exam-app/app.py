"""Local Flask app for the CCA Foundations practice exam.

Run:
    python app.py

Then open http://localhost:5050
"""

import json
import random
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from flask import Flask, abort, redirect, render_template, request, url_for
from markupsafe import Markup, escape

BASE_DIR = Path(__file__).parent
QUESTIONS_FILE = BASE_DIR / "questions.json"
RUNS_DIR = BASE_DIR / "exam_runs"
RUNS_DIR.mkdir(exist_ok=True)

EXAM_DURATION_MINUTES = 120
TOTAL_QUESTIONS = 60
PASS_SCALED_SCORE = 720

# Distribution sums to 60. Weights follow the published exam blueprint;
# 5 cross-domain slots reflect the scenario-integration questions.
DOMAIN_DISTRIBUTION: dict[int, int] = {
    1: 15,  # Agentic Architecture & Orchestration (27%)
    2: 10,  # Tool Design & MCP Integration (18%)
    3: 11,  # Claude Code Configuration & Workflows (20%)
    4: 11,  # Prompt Engineering & Structured Output (20%)
    5: 8,   # Context Management & Reliability (15%)
    0: 5,   # Cross-domain integrative scenarios
}

assert sum(DOMAIN_DISTRIBUTION.values()) == TOTAL_QUESTIONS

DOMAIN_SHORT = {
    1: "Agentic Architecture",
    2: "Tool Design & MCP",
    3: "Claude Code Config",
    4: "Prompt Engineering",
    5: "Context Management",
    0: "Cross-Domain",
}


def _load_bank() -> tuple[list[dict], dict[int, list[dict]]]:
    if not QUESTIONS_FILE.exists():
        raise SystemExit(
            f"{QUESTIONS_FILE.name} not found. Run `python convert_to_json.py` first."
        )
    data = json.loads(QUESTIONS_FILE.read_text(encoding="utf-8"))
    questions = data["questions"]
    by_domain: dict[int, list[dict]] = {}
    for q in questions:
        by_domain.setdefault(q["domain"], []).append(q)
    return questions, by_domain


QUESTION_BANK, QUESTIONS_BY_DOMAIN = _load_bank()


def sample_exam_questions() -> list[dict]:
    sampled: list[dict] = []
    for domain, count in DOMAIN_DISTRIBUTION.items():
        pool = QUESTIONS_BY_DOMAIN.get(domain, [])
        if len(pool) < count:
            raise RuntimeError(
                f"Domain {domain} has {len(pool)} questions, need {count}"
            )
        sampled.extend(random.sample(pool, count))
    random.shuffle(sampled)
    return sampled


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_iso(s: str) -> datetime:
    return datetime.fromisoformat(s)


def save_run(run: dict) -> None:
    path = RUNS_DIR / f"{run['exam_id']}.json"
    path.write_text(json.dumps(run, indent=2, ensure_ascii=False), encoding="utf-8")


def load_run(exam_id: str) -> dict | None:
    # Guard against path traversal: only allow safe ids
    if not re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", exam_id):
        return None
    path = RUNS_DIR / f"{exam_id}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def list_runs() -> list[dict]:
    runs: list[dict] = []
    for p in sorted(RUNS_DIR.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True):
        try:
            r = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        runs.append(
            {
                "exam_id": r["exam_id"],
                "started_at": r["started_at"],
                "submitted_at": r.get("submitted_at"),
                "score": r.get("score"),
            }
        )
    return runs


def score_exam(run: dict) -> dict:
    total = len(run["questions"])
    correct = 0
    by_domain: dict[str, dict] = {}
    user_answers = run["user_answers"]

    for q in run["questions"]:
        d = q["domain"]
        key = str(d)
        if key not in by_domain:
            by_domain[key] = {
                "id": d,
                "label": DOMAIN_SHORT.get(d, "Unknown"),
                "total": 0,
                "correct": 0,
            }
        by_domain[key]["total"] += 1
        ua = user_answers.get(str(q["id"]))
        if ua == q["correct"]:
            correct += 1
            by_domain[key]["correct"] += 1

    for d in by_domain.values():
        d["percent"] = round((d["correct"] / d["total"]) * 100, 1) if d["total"] else 0.0

    percent = round((correct / total) * 100, 1) if total else 0.0
    scaled = round(100 + (correct / total) * 900) if total else 0
    return {
        "total": total,
        "correct": correct,
        "percent": percent,
        "scaled": scaled,
        "passed": scaled >= PASS_SCALED_SCORE,
        "pass_threshold": PASS_SCALED_SCORE,
        "by_domain": by_domain,
    }


# --- Jinja filter: minimal inline markdown (backtick code + **bold**) ---

_CODE_RE = re.compile(r"`([^`]+)`")
_BOLD_RE = re.compile(r"\*\*([^*]+)\*\*")


def render_inline_md(value: str | None) -> Markup:
    if not value:
        return Markup("")
    s = str(escape(value))
    s = _BOLD_RE.sub(r"<strong>\1</strong>", s)
    s = _CODE_RE.sub(r"<code>\1</code>", s)
    return Markup(s)


def format_dt(iso: str | None) -> str:
    if not iso:
        return ""
    try:
        dt = parse_iso(iso)
    except ValueError:
        return iso
    return dt.astimezone().strftime("%Y-%m-%d %H:%M")


def format_duration(seconds: int | None) -> str:
    if seconds is None:
        return ""
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h}h {m}m {s}s"
    return f"{m}m {s}s"


# --- App ---

app = Flask(__name__)
app.jinja_env.filters["md"] = render_inline_md
app.jinja_env.filters["dt"] = format_dt
app.jinja_env.filters["dur"] = format_duration


@app.route("/")
def index():
    return render_template(
        "index.html",
        runs=list_runs(),
        total_questions=TOTAL_QUESTIONS,
        duration=EXAM_DURATION_MINUTES,
        pass_threshold=PASS_SCALED_SCORE,
        distribution=[
            (DOMAIN_SHORT[d], n) for d, n in DOMAIN_DISTRIBUTION.items()
        ],
    )


@app.route("/start", methods=["POST"])
def start_exam():
    exam_id = uuid.uuid4().hex[:10]
    questions = sample_exam_questions()
    started = datetime.now(timezone.utc)
    expires = started + timedelta(minutes=EXAM_DURATION_MINUTES)
    run = {
        "exam_id": exam_id,
        "started_at": started.isoformat(),
        "expires_at": expires.isoformat(),
        "duration_minutes": EXAM_DURATION_MINUTES,
        "pass_threshold": PASS_SCALED_SCORE,
        "questions": questions,
        "user_answers": {},
        "submitted_at": None,
        "score": None,
    }
    save_run(run)
    return redirect(url_for("exam", exam_id=exam_id))


@app.route("/exam/<exam_id>")
def exam(exam_id: str):
    run = load_run(exam_id)
    if not run:
        abort(404)
    if run.get("submitted_at"):
        return redirect(url_for("results", exam_id=exam_id))
    return render_template("exam.html", run=run, domain_short=DOMAIN_SHORT)


@app.route("/submit/<exam_id>", methods=["POST"])
def submit_exam(exam_id: str):
    run = load_run(exam_id)
    if not run:
        abort(404)
    if run.get("submitted_at"):
        return redirect(url_for("results", exam_id=exam_id))

    answers: dict[str, str] = {}
    for q in run["questions"]:
        ans = request.form.get(f"q_{q['id']}")
        if ans in ("A", "B", "C", "D"):
            answers[str(q["id"])] = ans

    submitted = datetime.now(timezone.utc)
    started = parse_iso(run["started_at"])
    run["user_answers"] = answers
    run["submitted_at"] = submitted.isoformat()
    run["duration_seconds"] = int((submitted - started).total_seconds())
    run["score"] = score_exam(run)
    save_run(run)
    return redirect(url_for("results", exam_id=exam_id))


@app.route("/results/<exam_id>")
def results(exam_id: str):
    run = load_run(exam_id)
    if not run:
        abort(404)
    if not run.get("submitted_at"):
        return redirect(url_for("exam", exam_id=exam_id))
    return render_template("results.html", run=run, domain_short=DOMAIN_SHORT)


@app.route("/review/<exam_id>")
def review(exam_id: str):
    run = load_run(exam_id)
    if not run or not run.get("submitted_at"):
        abort(404)
    return render_template("review.html", run=run, domain_short=DOMAIN_SHORT)


@app.route("/history")
def history():
    return render_template("history.html", runs=list_runs())


@app.errorhandler(404)
def not_found(_):
    return render_template("error.html", message="Not found."), 404


if __name__ == "__main__":
    app.run(debug=True, port=5050)
