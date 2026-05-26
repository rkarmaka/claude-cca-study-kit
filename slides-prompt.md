# Prompt: Teaching Slide Deck

Paste this into Claude with `domain1.md` attached.

---

```
You are a senior instructional designer and presentation specialist. I am
giving you a markdown reference (domain1.md) covering Domain 1 of the Claude
Certified Architect exam — Agentic Architecture & Orchestration. I need to
teach this material to my engineering team in a 45-60 minute internal session.

TASK
Produce a complete, presenter-ready slide deck as a single self-contained
HTML file using reveal.js (load it via inline CDN script — that's the only
external dependency permitted). The deck must run in any modern browser by
double-clicking the file. No build step.

AUDIENCE
Mid-to-senior software engineers who write production code but have NOT
deeply worked with multi-agent systems. They understand LLMs and tool use at
a basic level. They learn best from concrete examples, code snippets, and
diagrams — not abstract bullet points.

DECK STRUCTURE (target ~35-45 slides)

1. TITLE SLIDE
   - Deck title, subtitle ("Internal Engineering Briefing"), date placeholder.
   - Clean, bold, no clutter.

2. AGENDA SLIDE
   - List the 7 task statements as the journey, plus opening framing and
     closing recap.

3. OPENING FRAMING (2-3 slides)
   - Why this matters: agents are how we ship LLM features that take real
     actions. The decisions in this deck are the difference between an agent
     that works in demos and one that survives production.
   - Introduce the THREE GLOBAL RULES as the through-line. They will recur on
     every section.

4. SEVEN SECTIONS — one per task statement (TS 1.1 through 1.7)
   For each task statement, produce roughly 4-6 slides:
   a. Section divider slide (large number badge "1.X", title, one-sentence
      thesis for the section).
   b. Concept slide — what the thing is, with a diagram or code snippet.
   c. Rules / anti-patterns slide — what to do, what to avoid. Use a
      two-column "DO / DON'T" layout where applicable.
   d. Production example slide — a realistic scenario with concrete details
      (customer support, trading agent, research system, code review pipeline).
      Show specifics: tool names, error codes, dollar amounts.
   e. Exam-style "spot the bug" or "pick the fix" slide — present a short
      scenario and 3-4 options, with the correct answer revealed via reveal.js
      fragment animation, plus a one-line explanation of WHY.

5. SYNTHESIS SLIDES (2-3 at the end)
   - The Distractor-Recognition Cribsheet as a single high-contrast slide.
   - The One-Line Mnemonics as a memorable closing slide.
   - A "what to read next" slide pointing to Anthropic's agent docs and the
     Claude Agent SDK reference.

6. Q&A / DISCUSSION CLOSE
   - Three prompts the team should leave able to answer.

CONTENT FIDELITY
- All content must come from domain1.md. Do not invent rules or examples
  beyond what's in the source.
- You may EXPAND on the source where it helps teaching — e.g. add a concrete
  production scenario or short Python snippet to illustrate a concept — but
  flag any expansion as an example, never as additional rules.
- Preserve all key terminology exactly: stop_reason, PreToolUse, PostToolUse,
  Task tool, allowedTools, fork_session, idempotency key, hub-and-spoke, etc.
- British English spelling throughout.

VISUAL DESIGN
- Modern, editorial, presentation-grade. Think Stripe Press meets a senior
  engineering all-hands deck. Not corporate blue. Not academic.
- Palette: deep indigo accent (#3730A3), warm off-white background (#FAF9F6),
  charcoal primary text (#111827), muted red for warnings (#B91C1C), muted
  green for affirmations (#15803D). Use accent colour sparingly and
  intentionally.
- Typography: a refined serif for headers (Georgia / "Source Serif" via
  system fonts), a clean sans-serif for body (system-ui stack with -apple-
  system, Inter fallback). Generous line-height and letter-spacing.
- Layout: lots of whitespace. No more than ~40 words per slide except the
  cribsheet. Use type size and weight for hierarchy, not borders.
- Code snippets: monospace (ui-monospace, "SF Mono", Menlo), dark-grey
  background, syntax-coloured by hand using <span> with inline colour.
- Diagrams: inline SVG only. Required diagrams:
    (1) The agentic loop flowchart (TS 1.1)
    (2) Hub-and-spoke topology with coordinator + 3 subagents and crossed-out
        peer-to-peer arrows (TS 1.2)
    (3) Context-passing comparison: prose blob vs structured JSON (TS 1.3)
    (4) Enforcement spectrum bar from probabilistic to deterministic (TS 1.4)
    (5) PreToolUse vs PostToolUse timeline (TS 1.5)
    (6) Decision tree for the four decomposition patterns (TS 1.6)
    (7) Error classification matrix (TS 1.7)
   Make every diagram clean, monochrome with accent-colour highlights, and
   large enough to read from the back of a room.
- Use subtle reveal.js fragment animations to progressively disclose lists
  and answer reveals. Do not use flashy transitions — fade or none only.

ENGAGEMENT TOUCHES
- Open each major section with the section's "exam tell" or memorable rule as
  a single oversized quote slide. Example: "stop_reason is the only
  authoritative termination signal." Pure typography, no other elements.
- Insert a "spot-the-bug" exercise at least three times across the deck where
  the audience reads code or a scenario and the answer fragments in.
- End with a callback to the Three Global Rules from the opening — close the
  loop.

DELIVERABLE
Return the complete HTML file as a single code block. Include in the file:
- Reveal.js loaded from cdn.jsdelivr.net (specify a pinned version)
- Inline <style> with all the custom theme
- All slides as <section> elements
- Speaker notes for every content slide using reveal.js's <aside class="notes">
  syntax. Speaker notes should be 2-3 sentences of what the presenter should
  actually say — not a restatement of the slide. They are the script.

No preamble in your response, no explanation after the code block. I will
save it as domain1-deck.html and open it in a browser.

CONSTRAINTS
- Reveal.js is the only external resource. No icon fonts, no Google Fonts,
  no images.
- Do not exceed 50 slides. Aim for 35-45.
- Every slide must work in B&W (don't rely on colour alone for meaning).
```

---

## Tips for best results

- Run on **Claude Opus 4.7**. Visual layout and information density at this scale is meaningfully better than smaller models.
- Attach `domain1.md` as a file — don't paste inline.
- Reveal.js gives you presenter mode (`S` key) where the speaker notes appear on your laptop while the audience sees only slides. Test this before the session.
- After the first generation, ask iteratively:
  - *"Slide 17's diagram is too small to read. Make it fill the slide and reduce surrounding text."*
  - *"Add a 'spot the bug' exercise after the TS 1.3 section using the synthesis-without-citations scenario."*
  - *"The Q&A close is too generic. Replace with three specific discussion prompts grounded in our codebase patterns."*

## Presentation day run order

1. Open the HTML file in Chrome
2. Press `F` for fullscreen
3. Press `S` for speaker view (opens a second window with notes + next-slide preview)
4. Drag that window to your laptop, mirror the main window to the projector
