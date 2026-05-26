# Anki flashcards

A **111-card** spaced-repetition deck built from [`../flashcards.md`](../flashcards.md):

- The curated *repeat-mistake* cards (tagged `CCA::Traps`).
- *Domain coverage cards* derived from the five cheatsheets (tagged `CCA::D1`–`CCA::D5`).

Drill them on your phone or desktop instead of re-reading the notes.

## Get the deck

The pre-built file [`cca-flashcards.txt`](./cca-flashcards.txt) is checked in, so
you can import it directly. To regenerate after editing `flashcards.md`:

```bash
python3 build_anki.py        # rewrites cca-flashcards.txt
```

No dependencies — standard library only. To add cards, append a `## Heading` +
`**FRONT**` / `**BACK**` block to `flashcards.md` (prefix the heading with
`D1`–`D5` to set its domain tag), then rerun.

## Import into Anki

1. **File → Import** and select `cca-flashcards.txt`.
2. Note type: **Basic** (Front / Back).
3. Field separator: **Tab** (the file declares this in its header).
4. Tick **Allow HTML in fields** — the cards use HTML for code blocks and lists.
5. Map: column 1 → **Front**, column 2 → **Back**, column 3 → **Tags**.

The header lines (`#separator:tab`, `#html:true`, `#columns:...`) let recent Anki
versions auto-configure most of the above on import.

## How to study

- Cards are tagged by domain (`CCA::D1`–`CCA::D5`) so you can build a filtered deck
  for a weak area, e.g. search `tag:CCA::D1` in the browser.
- Each card front is a scenario; recall the **rule** and the **trap** before flipping.
- Re-read [`../study-notes/master-trap-sheet.md`](../study-notes/master-trap-sheet.md)
  the morning of the exam — it consolidates every "reject / lean toward" pattern.
