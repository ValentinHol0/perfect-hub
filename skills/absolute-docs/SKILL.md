---
name: absolute-docs
description: Writes and reviews project documentation that people actually use - README, ADRs (architecture decision records), API reference, changelogs and release notes, how-to guides and code comments - with one content type per page, runnable examples and no filler. Use when the user asks to document something, write or update a README, ADR, API docs, changelog or migration guide, or when /absolute finishes a feature that changes public behaviour.
---

# Absolute Docs (Perfect Hub 4.0)

Docs are part of the product. Every page answers one question for one reader. Match the repository's existing conventions first (location, numbering, headings, tone, language); never start a second scheme next to an existing one.

## 1. Pick the content type (one per page)
| Type | Reader's question | Shape |
|---|---|---|
| Tutorial | "Teach me from zero" | Numbered steps to one working result; every step runnable |
| How-to | "How do I do X?" | Title = the task ("Rotate the API key"); prerequisites → steps → verify |
| Reference | "What exactly does Y accept/return?" | Complete, dry, consistent tables; no narrative |
| Explanation | "Why is it like this?" | Context, trade-offs, links to ADRs |
| Troubleshooting | "It fails with Z" | Symptom → cause → fix, one per heading |

## 2. Writing rules
- Open every page with a 1–2 sentence summary of what it gives the reader; open every section with its point.
- Sentences ≤ 20 words, paragraphs 2–4 sentences, active voice (if "by zombies" still fits after the verb, it's passive).
- Ban filler and pressure words: easy, simple, just, simply, quickly, obviously, very, really. Replace weasel words (significantly, often, typically) with a number.
- Banned AI-prose tells: recap transitions ("Now that we've…"), "In today's fast-paced world", spec-sheet voice ("provides", "is configurable") where a verb would do, "Whether you're A or B".
- Expand acronyms on first use. Units with a space: `64 KB`, `200 ms`.
- Placeholders are descriptive `snake_case` (`your_api_key_here`), never `<TOKEN>` or `xxx`.
- Code blocks: language tag, ≤ 80 columns, ≤ 25 lines, explained in prose, copy-pasteable (no `$` prompts in blocks meant to be run). Never end a guide with "see file X".
- Write in the project's documentation language; Ukrainian docs follow Ukrainian typography («лапки», апостроф ’).

## 3. README (in this order)
1. Name + one sentence: what it is and for whom.
2. Status line if relevant (version, CI badge — only if they're real).
3. **Quick start**: install → configure → run → see a result, in ≤ 5 commands that actually work on a clean machine.
4. Usage: the 3–5 most common tasks with examples.
5. Configuration: table of env vars/options (name · default · required · description).
6. Development: test, lint, build commands; project structure only if non-obvious.
7. Deployment / operations (or a link).
8. Troubleshooting for known sharp edges.
9. License, contributing, contact.
Verify every command in Quick start by running it (or say which ones you could not run).

## 4. ADR (architecture decision record)
Write one when a decision is expensive to reverse: framework or major dependency, data model/schema, auth strategy, API style, hosting/build, anything with a migration.
- Location and numbering: follow the repo (`docs/decisions/`, `docs/adr/`, `adr-tools`, MADR). None yet → `docs/decisions/NNNN-<slug>.md` starting at `0001`.
- Sections: **Status** (Proposed / Accepted / Superseded by NNNN / Deprecated) · **Date** · **Context** (forces, constraints, numbers) · **Decision** · **Alternatives considered** (each: pros, cons, why rejected) · **Consequences** (good, bad, follow-ups).
- Never edit an accepted ADR's decision or delete it — supersede it with a new one and link both ways.

## 5. API reference
- One entry per endpoint/function: signature or `METHOD /path`, purpose (one line), auth, parameters table (name · type · required · constraints · example), request example, response example per status code, errors (code · meaning · how to fix), rate limits, idempotency, pagination.
- Examples are real requests that work against a dev/test environment; mark them `[Unverified]` if you could not run them.
- Prefer generating from the source of truth (OpenAPI/JSON Schema, typed routes, docstrings) and keep prose to what generation can't express. Version breaking changes and link the migration guide.

## 6. Changelog & release notes
- `CHANGELOG.md` in Keep-a-Changelog form: `## [x.y.z] — YYYY-MM-DD` with `Added / Changed / Deprecated / Removed / Fixed / Security`; an `Unreleased` section on top.
- Entries are user-facing outcomes ("Gift cards can be redeemed across several orders"), not commit messages. Breaking changes first, with the migration step.
- Semantic Versioning: breaking → major, feature → minor, fix → patch. Derive the bump from the entries, not from habit.

## 7. Code comments
- Explain *why* (constraints, trade-offs, links to ADRs or issues), never restate *what* the code says.
- No commented-out code, no TODO for something you can do now, no stale comments — update or delete them with the code.
- Public functions in libraries get docstrings with parameters, return value, errors and one example.

## 8. Review checklist (docs diffs)
- [ ] One content type per page; title matches the reader's question.
- [ ] Every command/example runs (or is marked `[Unverified]`).
- [ ] No filler or AI-prose tells; numbers instead of weasel words.
- [ ] Links resolve; no "see file X" endings.
- [ ] Changelog/ADR/README updated when behaviour, decisions or setup changed.
