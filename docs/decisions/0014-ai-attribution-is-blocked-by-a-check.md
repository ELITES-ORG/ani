# 0014. AI attribution is blocked by a check, not by a rule

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Coding agents append attribution trailers to commits by default — a
`Co-Authored-By` line naming the model, or a "Generated with" footer on a pull
request. The organisation's position is that commits are authored by the human
contributor alone: the history is a professional record, and the tooling used
to produce it is not authorship.

A written rule in `CLAUDE.md` is necessary and not sufficient. An agent's own
default behaviour asserts the opposite, and defaults win on the runs where
nobody is watching.

The failure is also not recoverable by amending. GitHub credits a co-author
the moment it first receives the commit and does not retract that credit when
the commit is force-pushed away — the account stays in the repository's
contributor list permanently.

## Decision

Block it mechanically, in two places:

1. A `commit-msg` hook in `.githooks/`, installed by `npm run hooks:install`,
   which rejects the commit locally before it exists.
2. The same check in CI over the pushed range, so a contributor who has not
   installed hooks is still caught.

The rule stays written in `CLAUDE.md` as well, because an agent that reads it
avoids the failure rather than hitting a wall.

## Alternatives considered

**The written rule alone.** Tried first in the sibling Bilikha repository;
trailers still appeared, which is why that project added the same hook.

**A server-side pre-receive hook.** Stronger, and unavailable on GitHub
without an enterprise instance.

**Cleaning up afterwards.** Does not work, for the reason above.

## Consequences

The trailer cannot reach `main` without someone deliberately bypassing both a
local hook and a CI check.

The local hook only works after `npm run hooks:install`, which is why that is
part of `npm run setup` rather than a step in a document somebody skims. CI is
the backstop for anyone who skipped it.

A contributor who genuinely wants a `Co-Authored-By` trailer for a human
pairing partner is unaffected: the check matches AI tool and model names, not
the trailer itself.
