# 0016. The interface assumes no app literacy

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Most of the people Ani is for do not use many apps. They own a phone, they
use Facebook and Messenger, and that is close to the whole of it. On the
supply side especially, a farmer listing kamote may never have filled in a
web form before.

That is not an accessibility footnote here, it is the primary design
constraint. A pattern that is merely *unfamiliar* to this audience fails as
completely as one that is broken.

## Decision

Six rules, applied everywhere. Each replaces a convention that is normal in
app design and wrong for these users.

**1. Never make someone type a number.** Quantity is a `−` / `+` stepper with
56px targets. Typing `0.25` into a text field to buy a quarter kilo is the
single most likely place a first-time user gives up. The field stays editable
for anyone who wants a large amount; nobody has to use it.

**2. Never disable the submit button.** A greyed-out button that does nothing
when tapped gives no reason and no way forward. Left enabled, the browser
blocks the submit and moves focus to the field that needs attention — which
is an answer. `disabled` is reserved for "already submitted".

**3. Labels are always visible.** No placeholder-as-label: it disappears the
moment someone types, leaving them unable to check what the box was for. A
hint under the label explains the format *before* anyone gets it wrong.

**4. Status is a sentence, not a word.** The database says `pending`; the
screen says "Waiting for the farm to confirm your order", and draws how far
along it is as four filled segments. "Is it nearly ready?" is answered
without reading.

**5. Ask before anything that cannot be undone by tapping again.** Removing
an item, emptying a basket. Cancel is listed first and is the wider target —
someone who opened the dialog by accident should find the way out before the
way through.

**6. An icon is never alone, and colour never carries meaning by itself.**
Every nav item has a word. Every status pill has a dot *and* text. Roughly
one man in twelve cannot separate red from green, which is an unfortunate
pair for a produce app.

## Alternatives considered

**Ship the conventional patterns and add an onboarding tour.** Tours are
skipped, and are only understood by people who did not need them. The
interface has to be the explanation.

**A separate "simple mode".** Two interfaces to build and test, and it asks
people to self-identify as needing help, which they will not do.

## Consequences

Screens are longer and plainer than a comparable app. Fewer things per
screen, bigger targets, more words. That is the intended trade.

Some of this costs real work: the stepper is a component rather than an
`<input type="number">`, and every destructive action needs a dialog. The
components exist so the cost is paid once.

**This is the rule that outranks the others.** If a future change makes a
screen more elegant and less obvious, it is the wrong change.
