#!/usr/bin/env python3
"""Build an Anki-importable deck from flashcards.md.

Parses the FRONT/BACK cards in ../flashcards.md and emits a tab-separated
file (cca-flashcards.txt) that Anki imports natively — no add-ons required.

Anki fields accept HTML, so the light Markdown in each card is converted to
HTML (code spans, code blocks, bold, lists, line breaks) for clean rendering.

Usage:
    python3 build_anki.py            # writes cca-flashcards.txt next to this script

Import into Anki:
    File > Import > select cca-flashcards.txt
    - Type: Basic (Front/Back)
    - Field separator: Tab
    - "Allow HTML in fields": CHECKED
    - Field 1 -> Front, Field 2 -> Back, Field 3 -> Tags
"""
from __future__ import annotations

import html
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "cca-flashcards.txt"

# Card sources, each with a fallback Anki tag. A card whose heading starts with
# a domain marker (e.g. "D1 · ...") is tagged "CCA::D1" instead.
SOURCES = [
    (HERE.parent / "flashcards.md", "CCA::Traps"),
]


def md_inline_to_html(text: str) -> str:
    """Convert inline Markdown (code, bold, italics) to HTML, escaping the rest."""
    # Protect inline code spans first so their contents aren't escaped twice.
    spans: list[str] = []

    def stash(m: re.Match) -> str:
        spans.append(m.group(1))
        return f"\x00{len(spans) - 1}\x00"

    text = re.sub(r"`([^`]+)`", stash, text)
    text = html.escape(text)
    # bold (**x**) then italics (*x* / _x_)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", text)

    def unstash(m: re.Match) -> str:
        code = html.escape(spans[int(m.group(1))])
        return f"<code>{code}</code>"

    return re.sub(r"\x00(\d+)\x00", unstash, text)


def md_block_to_html(block: str) -> str:
    """Convert a card body (FRONT or BACK) from Markdown to HTML."""
    out: list[str] = []
    lines = block.splitlines()
    i = 0
    in_list = False

    def close_list() -> None:
        nonlocal in_list
        if in_list:
            out.append("</ul>")
            in_list = False

    while i < len(lines):
        line = lines[i]

        # Fenced code block -> <pre>
        if line.strip().startswith("```"):
            i += 1
            code: list[str] = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code.append(lines[i])
                i += 1
            i += 1  # skip closing fence
            close_list()
            out.append("<pre>" + html.escape("\n".join(code)) + "</pre>")
            continue

        stripped = line.strip()

        # Blockquote markers used on FRONT — strip the leading "> "
        if stripped.startswith(">"):
            stripped = stripped[1:].lstrip()

        if not stripped:
            close_list()
            i += 1
            continue

        # List item
        m = re.match(r"^[-*]\s+(.*)$", stripped)
        if m:
            if not in_list:
                out.append("<ul>")
                in_list = True
            out.append(f"<li>{md_inline_to_html(m.group(1))}</li>")
        else:
            close_list()
            out.append(f"<div>{md_inline_to_html(stripped)}</div>")
        i += 1

    close_list()
    return "".join(out)


# Human-readable deck labels, keyed by the deck slug emitted below.
DECK_LABELS = {
    "D1": "Agentic Architecture & Orchestration",
    "D2": "Tool Design & MCP Integration",
    "D3": "Claude Code Configuration & Workflows",
    "D4": "Prompt Engineering & Structured Output",
    "D5": "Context Management & Reliability",
    "Traps": "Repeat-mistake traps",
}

# Web app data + downloadable deck copy, served by docs/flashcards/.
WEB_DIR = HERE.parent / "docs" / "flashcards"
WEB_JSON = WEB_DIR / "cards.json"
WEB_DECK = WEB_DIR / "cca-flashcards.txt"


def deck_key(heading: str) -> str:
    """Group a card into a deck: a domain (`D1`–`D5`) or the repeat-mistake `Traps`."""
    m = re.match(r"^D([1-5])\b", heading)
    return f"D{m.group(1)}" if m else "Traps"


def card_tag(heading: str, fallback: str) -> str:
    """Tag a card by its domain marker (`D1 · ...`) or fall back to the source tag."""
    if re.match(r"^D([1-5])\b", heading):
        return f"CCA::{deck_key(heading)}"
    # Otherwise derive from the title (strip emoji and "Card N —").
    title = re.sub(r"[🔴🟡🟢🔁🎯📌❌]", "", heading).strip()
    title = re.sub(r"^Card\s+\d+\s*[—-]\s*", "", title).strip()
    slug = re.sub(r"[^A-Za-z0-9]+", "_", title).strip("_")[:40]
    return f"{fallback}::{slug}" if slug else fallback


def parse_cards(md: str, fallback_tag: str) -> list[dict]:
    """Return {front, back, tag, deck} for every FRONT/BACK section."""
    # Split into sections on level-2 headings, keeping the heading text.
    parts = re.split(r"^##\s+", md, flags=re.MULTILINE)
    cards: list[dict] = []

    for part in parts[1:]:
        heading, _, body = part.partition("\n")
        if "**FRONT**" not in body or "**BACK**" not in body:
            continue

        front_raw = body.split("**FRONT**", 1)[1].split("**BACK**", 1)[0]
        back_raw = body.split("**BACK**", 1)[1]
        # Trim trailing horizontal rule / next-section bleed.
        back_raw = re.split(r"^---\s*$", back_raw, flags=re.MULTILINE)[0]

        cards.append({
            "front": md_block_to_html(front_raw.strip()),
            "back": md_block_to_html(back_raw.strip()),
            "tag": card_tag(heading, fallback_tag),
            "deck": deck_key(heading),
        })
    return cards


def main() -> None:
    import json

    lines = ["#separator:tab", "#html:true", "#columns:Front\tBack\tTags"]
    all_cards: list[dict] = []
    for path, fallback in SOURCES:
        if not path.exists():
            print(f"  (skipped missing {path.name})")
            continue
        cards = parse_cards(path.read_text(encoding="utf-8"), fallback)
        all_cards.extend(cards)
        print(f"  {len(cards):>3} cards <- {path.name}")
        for c in cards:
            # Tabs/newlines would break the TSV row; cards have neither after HTML.
            row = "\t".join(v.replace("\t", " ").replace("\n", " ")
                            for v in (c["front"], c["back"], c["tag"]))
            lines.append(row)

    deck_text = "\n".join(lines) + "\n"
    OUT.write_text(deck_text, encoding="utf-8")
    print(f"Wrote {len(all_cards)} cards -> {OUT.relative_to(HERE.parent)}")

    # Web app: cards.json + a downloadable copy of the Anki deck.
    if WEB_DIR.exists():
        decks = [
            {"key": k, "label": DECK_LABELS.get(k, k),
             "count": sum(1 for c in all_cards if c["deck"] == k)}
            for k in ["D1", "D2", "D3", "D4", "D5", "Traps"]
            if any(c["deck"] == k for c in all_cards)
        ]
        payload = {
            "total": len(all_cards),
            "decks": decks,
            "cards": [{"front": c["front"], "back": c["back"], "deck": c["deck"]}
                      for c in all_cards],
        }
        WEB_JSON.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        WEB_DECK.write_text(deck_text, encoding="utf-8")
        print(f"Wrote web data -> {WEB_JSON.relative_to(HERE.parent)} "
              f"(+ downloadable deck)")
    else:
        print(f"  (skipped web data: {WEB_DIR} does not exist yet)")


if __name__ == "__main__":
    main()
