# Prompt: Single-Page Visual Cheatsheet

Paste this into Claude (web app or Claude Code) with `domain1.md` attached.

---

```
You are a senior information designer and educator. I am giving you a markdown
cheatsheet (domain1.md) for Domain 1 of the Claude Certified Architect exam.

TASK
Produce a single-page, print-ready visual cheatsheet as a self-contained HTML
file (inline CSS, no external dependencies, no JavaScript frameworks). It must
render to ONE A4 page in landscape orientation when printed to PDF via a
browser's print dialog (Chrome/Safari). Use @page { size: A4 landscape;
margin: 8mm; } and design within those bounds.

CONTENT REQUIREMENTS
- Cover all 7 task statements (1.1 through 1.7) from the provided markdown.
- Preserve the three Global Rules as a prominent banner at the top.
- Preserve the distractor-recognition cribsheet ("reject these / lean toward
  these") as a high-contrast two-column block.
- Preserve the one-line mnemonics as a strip at the bottom.
- Do not invent content. Only use what is in the markdown. Compress, do not
  rewrite.

VISUAL DESIGN
- Use a clean editorial layout: CSS grid, multi-column flow where appropriate.
- Each task statement gets its own card with: a numbered badge (1.1–1.7), a
  short title, 3-5 bullet points or a compact table, and a single keyword
  "EXAM TELL" callout (e.g. "Tell: 'prior state' → PreToolUse").
- Use inline SVG icons (lock, gear, arrow, branch, eye, shield, refresh) — one
  per task statement card. Draw them as simple geometric shapes; do not
  reference external icon sets.
- Use ONE accent colour for emphasis, a neutral text colour, and a subtle
  background tint for cards. Suggested palette: deep indigo accent (#3730A3),
  warm off-white background (#FAF9F6), charcoal text (#1F2937), muted red for
  "reject" items (#B91C1C), muted green for "lean toward" items (#15803D).
- Typography: a serif for headers (Georgia or similar system serif), a clean
  sans-serif for body (system-ui stack). Use weight, size, and colour to
  create hierarchy — not borders everywhere.
- Include at least TWO inline-SVG diagrams: (a) the enforcement spectrum bar
  from probabilistic → deterministic, (b) the hub-and-spoke coordinator
  topology. Both must be tiny, monochrome with accent colour highlights, and
  fit inside their cards.
- Use icons or symbols (✓ ✗ → ⚠) sparingly to mark rules visually.

DENSITY & LEGIBILITY
- Target body text 8.5-9.5pt, headers 11-14pt. Must be readable when printed.
- No filler. Every pixel earns its place. If something doesn't fit, compress
  wording before reducing font size.
- Use abbreviation tables where helpful (e.g. PreToolUse / PostToolUse rows).

DELIVERABLE
Return only the complete HTML file as a single code block. No preamble, no
explanation after. I will save it as domain1-cheatsheet.html and print to PDF.

CONSTRAINTS
- No external fonts, CDNs, images, or scripts.
- No emoji (use SVG icons or unicode glyphs only).
- Must print cleanly on a B&W printer too (don't rely on colour alone for
  meaning — use weight, position, and shape as redundant cues).
- British English spelling throughout.
```

---

## Tips for best results

- Run it on **Claude Opus 4.7** (visual layout quality is meaningfully better than Sonnet/Haiku at single-shot HTML design).
- Attach `domain1.md` as a file, don't paste it inline — the model treats attached files as authoritative source material.
- If the first output doesn't fit one page, reply: *"It overflows to two pages. Compress task statements 1.3 and 1.6, which are the densest. Keep all section headings but tighten bullet wording."*
- If the design is bland, reply: *"Make the enforcement spectrum and hub-and-spoke diagrams more visually striking. Use the accent colour more deliberately on the three Global Rules banner."*

Save the result, open it in Chrome, **Cmd+P → Save as PDF → Landscape → A4 → margins: minimum**.
