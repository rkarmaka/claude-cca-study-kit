"""Parse question-bank.md into questions.json.

Run once after generating or editing question-bank.md:
    python convert_to_json.py
"""

import json
import re
from collections import Counter
from pathlib import Path

BASE_DIR = Path(__file__).parent
SOURCE_MD = BASE_DIR.parent / "question-bank.md"
OUTPUT_JSON = BASE_DIR / "questions.json"

DOMAIN_LABELS = {
    1: "Agentic Architecture & Orchestration",
    2: "Tool Design & MCP Integration",
    3: "Claude Code Configuration & Workflows",
    4: "Prompt Engineering & Structured Output",
    5: "Context Management & Reliability",
    0: "Cross-Domain Integrative",
}


def build_domain_map(content: str) -> dict[int, int]:
    """Map question id -> domain number based on section headers."""
    domain_map: dict[int, int] = {}

    domain_re = re.compile(r"## Domain (\d+):.*?\(Q(\d+)[–-]Q(\d+)\)")
    for m in domain_re.finditer(content):
        d = int(m.group(1))
        start, end = int(m.group(2)), int(m.group(3))
        for q in range(start, end + 1):
            domain_map[q] = d

    cross_re = re.search(
        r"## Cross-Domain Integrative Scenarios \(Q(\d+)[–-]Q(\d+)\)", content
    )
    if cross_re:
        start, end = int(cross_re.group(1)), int(cross_re.group(2))
        for q in range(start, end + 1):
            domain_map[q] = 0

    return domain_map


QUESTION_RE = re.compile(
    r"\*\*Q(\d+)\.\*\*\s+(?P<question>.+?)\n\n"
    r"A\)\s+(?P<a>.+?)\n"
    r"B\)\s+(?P<b>.+?)\n"
    r"C\)\s+(?P<c>.+?)\n"
    r"D\)\s+(?P<d>.+?)\n\n"
    r"\*\*Correct answer:\*\*\s+(?P<correct>[A-D])\s*\n"
    r"\*\*Explanation:\*\*\s+(?P<explanation>.+?)\n\n---",
    re.DOTALL,
)


def parse_questions(md_text: str) -> list[dict]:
    domain_map = build_domain_map(md_text)
    questions: list[dict] = []
    for m in QUESTION_RE.finditer(md_text):
        qid = int(m.group(1))
        questions.append(
            {
                "id": qid,
                "domain": domain_map.get(qid, -1),
                "domain_label": DOMAIN_LABELS.get(domain_map.get(qid, -1), "Unknown"),
                "question": m.group("question").strip(),
                "options": {
                    "A": m.group("a").strip(),
                    "B": m.group("b").strip(),
                    "C": m.group("c").strip(),
                    "D": m.group("d").strip(),
                },
                "correct": m.group("correct"),
                "explanation": m.group("explanation").strip(),
            }
        )
    questions.sort(key=lambda q: q["id"])
    return questions


def main() -> None:
    if not SOURCE_MD.exists():
        raise SystemExit(f"Source file not found: {SOURCE_MD}")

    md_text = SOURCE_MD.read_text(encoding="utf-8")
    questions = parse_questions(md_text)

    if not questions:
        raise SystemExit("No questions parsed. Check the markdown format.")

    output = {
        "source": str(SOURCE_MD.name),
        "total": len(questions),
        "domain_labels": DOMAIN_LABELS,
        "questions": questions,
    }
    OUTPUT_JSON.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")

    counts = Counter(q["domain"] for q in questions)
    print(f"Parsed {len(questions)} questions -> {OUTPUT_JSON}")
    for d in sorted(counts):
        print(f"  Domain {d} ({DOMAIN_LABELS.get(d, 'Unknown')}): {counts[d]}")


if __name__ == "__main__":
    main()
