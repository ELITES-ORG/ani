# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Ani is small and will be worked on intermittently, by people and by agents
who will not have been present for earlier conversations. Decisions made for
good reasons look arbitrary a month later, and the usual outcome is that
someone "fixes" them, discovers the original reason the hard way, and reverts.

Several decisions here are counter-intuitive on purpose because the operating
constraints are unusual — see
[constraints](../explanation/constraints.md).

## Decision

Record decisions with consequences as numbered Markdown files in
`docs/decisions/`, using `_template.md`. Number sequentially, never renumber,
and never delete — a decision that stops being true is marked superseded and
links to its replacement.

## Alternatives considered

**Comments in code.** Good for local "why", useless for a decision spanning
several files or rejecting an alternative that left no trace in the codebase.
Both are used; they answer different questions.

**A wiki or issue tracker.** Decisions drift away from the code they govern
and are not reviewable in a pull request alongside the change they justify.

## Consequences

A settled question stays settled, and revisiting one starts from the original
reasoning rather than from scratch. The cost is a page of writing at the point
a decision is made, which is exactly when the context is cheapest to capture.

Not every choice earns a record. One with an obvious default does not.
