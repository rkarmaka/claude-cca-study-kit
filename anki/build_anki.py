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


def card_tag(heading: str, fallback: str) -> str:
    """Tag a card by its domain marker (`D1 · ...`) or fall back to the source tag."""
    m = re.match(r"^D([1-5])\b", heading)
    if m:
        return f"CCA::D{m.group(1)}"
    # Otherwise derive from the title (strip emoji and "Card N —").
    title = re.sub(r"[🔴🟡🟢🔁🎯📌❌]", "", heading).strip()
    title = re.sub(r"^Card\s+\d+\s*[—-]\s*", "", title).strip()
    slug = re.sub(r"[^A-Za-z0-9]+", "_", title).strip("_")[:40]
    return f"{fallback}::{slug}" if slug else fallback


def parse_cards(md: str, fallback_tag: str) -> list[tuple[str, str, str]]:
    """Return (front_html, back_html, tags) for every FRONT/BACK section."""
    # Split into sections on level-2 headings, keeping the heading text.
    parts = re.split(r"^##\s+", md, flags=re.MULTILINE)
    cards: list[tuple[str, str, str]] = []

    for part in parts[1:]:
        heading, _, body = part.partition("\n")
        if "**FRONT**" not in body or "**BACK**" not in body:
            continue

        front_raw = body.split("**FRONT**", 1)[1].split("**BACK**", 1)[0]
        back_raw = body.split("**BACK**", 1)[1]
        # Trim trailing horizontal rule / next-section bleed.
        back_raw = re.split(r"^---\s*$", back_raw, flags=re.MULTILINE)[0]

        front = md_block_to_html(front_raw.strip())
        back = md_block_to_html(back_raw.strip())
        cards.append((front, back, card_tag(heading, fallback_tag)))
    return cards


def main() -> None:
    lines = ["#separator:tab", "#html:true", "#columns:Front\tBack\tTags"]
    total = 0
    for path, fallback in SOURCES:
        if not path.exists():
            print(f"  (skipped missing {path.name})")
            continue
        cards = parse_cards(path.read_text(encoding="utf-8"), fallback)
        total += len(cards)
        print(f"  {len(cards):>3} cards <- {path.name}")
        for front, back, tag in cards:
            # Tabs/newlines would break the TSV row; cards have neither after HTML.
            row = "\t".join(c.replace("\t", " ").replace("\n", " ")
                            for c in (front, back, tag))
            lines.append(row)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {total} cards -> {OUT.relative_to(HERE.parent)}")


if __name__ == "__main__":
    main()
