# Reference-field page-load creation design

**Status:** Human-approved design

## Problem & current behavior

The EN integration is opt-in through `en.referenceField`. `normalizeENConfig` reads that value and
returns a normalized `referenceField` only when `isSafeReferenceFieldName` accepts it
(`src/en/config.ts:21-39`). `installReferenceFieldListeners` then installs the `enlb:cta` and
`enlb:dismiss` listeners and replays a matching pending outcome
(`src/en/reference-field.ts:23-57`).

Today, a missing input is created only from `writeToForm`, which is reached by an accept/decline
outcome or a carry-over replay (`src/en/reference-field.ts:59-117`). A configured form can therefore
be present on initial page load while its reference input is absent. In particular, `en_txn10` is an
acceptance-data example for this issue, not a field name to embed in the implementation. The field
name must always come from the normalized configuration.

## Decision

Use a lifecycle-aware eager ensure during reference-field listener installation.

After the configured name passes the existing safe-name guard, the installation path will ensure the
field exists using the real EN form selector first and the legacy selector second. If the form is
already present, the ensure is immediate. If the document is still loading and no form is present,
the ensure registers one `{ once: true }` `DOMContentLoaded` retry. A loaded document with no form is
a silent no-op.

The cleanup returned by `installReferenceFieldListeners` must remove its not-yet-fired eager
`DOMContentLoaded` ensure callback. `init` uninstalls the previous reference-field listeners before
installing the next configuration (`src/index.ts:20-30`), so re-initializing before
`DOMContentLoaded` cannot leave a callback that creates the old configured field: the old callback is
removed, and only the current installation's callback may run. This cleanup rule applies only to the
new eager-ensure callback; it does not refactor or otherwise change the existing pending-replay
callback behavior.

The ensure is structural only. It does not represent an outcome and must not dispatch
`enlb:field-write`, write `sessionStorage`, change pending carry-over, alter analytics, or stamp
frequency state. Existing accept, decline, and carry-over paths continue to write and emit through
the existing guarded path. Accept-owns-outcome precedence remains unchanged: `cta-primary` must not
overwrite `lightbox_accepted` with `lightbox_declined` (the current decline-reason set excludes
`cta-primary`, `src/en/reference-field.ts:19-21`).

The configured name is dynamic. `en_txn10` must never be hardcoded, and no default field is added
when `en.referenceField` is absent or invalid.

## Alternatives / trade-offs

### Immediate-only ensure — rejected

An immediate query is sufficient when the form is already parsed, but it misses a form that is added
later in the same parse. The current auto-init path can run while `document.readyState` is
`"loading"` (`src/index.ts:100-121`), so installation needs the one lifecycle retry for a head-loaded
form.

### `MutationObserver` — rejected

Observing the document would find a form added after installation, but it introduces persistent
observer lifecycle and teardown complexity for a case covered by one `DOMContentLoaded` retry. The
approved design does not poll and does not observe.

## Architecture / components

- **Configuration:** `src/en/config.ts` remains the source of safe-name normalization. The ensure
  consumes `config.referenceField` from `installReferenceFieldListeners`; it does not read an
  alternate name or define a default.
- **EN writer:** `src/en/reference-field.ts` owns form detection, eager ensuring, outcome writes,
  replay, and their error boundaries. The real selector is `form.en__component--page`; the legacy
  fallback is `form[data-en-component="form"]` (`src/en/reference-field.ts:17-18, 84-90`).
- **Integration seam:** `src/index.ts` continues to install the EN reader through
  `installReferenceFieldListeners(normalizeENConfig(config))` (`src/index.ts:20-31`). No public helper
  or export is added.
- **Host DOM:** The only page-load mutation is one bare input appended inside the detected EN form.
  No ENgrid wrapper markup is introduced.
- **Unchanged consumers:** Analytics and diagnostics receive no new production event. The existing
  `enlb:field-write` event remains reserved for successful outcome writes and replay
  (`src/en/reference-field.ts:92-100`).

## Lifecycle / data flow

1. `init` normalizes the EN config and installs the reference-field listeners
   (`src/index.ts:28-30`).
2. Installation reads the normalized field and returns an inert uninstall function when the name is
   absent or unsafe (`src/en/reference-field.ts:23-25`).
3. For a safe name, installation runs the eager ensure. It selects the real EN form first, then the
   legacy form. It reuses an existing same-name input or creates the missing bare hidden input.
4. If no form was found while `document.readyState === 'loading'`, the eager ensure retries once on
   `DOMContentLoaded`. The retry repeats the same guarded form lookup and creation check. The
   uninstall returned by installation removes this eager callback if it has not fired. Reinitializing
   before `DOMContentLoaded` therefore removes the old callback before installing the new one, so a
   later event can create only the current configured field. There is no polling or observer path.
5. Installation then retains the current replay behavior. A matching pending record can populate the
   already ensured input and dispatch the existing `action: 'replay'` write event; if the form is
   still unavailable at the one replay retry, the pending record remains available as it does today.
   The eager-callback cleanup above applies only to the new eager ensure callback; the existing replay
   retry is out of scope.
6. A later primary CTA or recognized decline reason enters `writeOutcome`, which writes the configured
   outcome value, emits the existing `action: 'write'` event, and saves pending carry-over when the
   write succeeds (`src/en/reference-field.ts:59-62`). The eager empty input is not itself an
   outcome.

## Exact DOM contract

When the selected form has no input whose `name` equals the normalized configured field:

- Create exactly one `input` element with `document.createElement('input')`, adapting ENgrid's safe
  construction; never use `innerHTML` for this element.
- Set `type` to `hidden` directly (`input.type = 'hidden'`).
- Set `name` to the normalized configured field directly (`input.name = field`).
- Set `value` to the empty string directly (`input.value = ''`). Equivalent `setAttribute` calls are
  acceptable for these assignments.
- Append it directly inside the detected form.
- Do not add an `id`, wrapper, class, `required`, or any other attribute.

When a same-name input of any type already exists, create nothing and do not alter that input’s
value, type, id, `required` state, or any other attribute during eager ensure. Later outcome writes
may update the value through the existing first-match write path; they must not replace the input or
change its other attributes. Repeated initialization or installation must leave the form with one
configured field when it started without one.

The name is always the normalized `en.referenceField` value, including valid dotted names. The
implementation must compare input names through a safe DOM lookup and must not interpolate the name
into an unescaped selector or markup. It must not copy ENgrid wrappers, classes, ENgrid-specific form
or submit selectors, unconditional duplicate creation, or a throwing missing-form fallback. The
reference comparison is
`/Users/fernando/sites/engrid/packages/scripts/src/engrid.ts:103-146` (`ENGrid.createHiddenInput`),
adapted only for the bare input contract above.

## Error / idempotence rules

- Absent, invalid, hostile, form-clobbering, or unsafe configuration remains inert and must not
  throw. The existing safe-name validation and normalization boundaries remain in force
  (`src/en/config.ts:13-39`).
- Form queries, `document.readyState`, element creation/insertion, and the eager ensure's one
  deferred callback are guarded so DOM getter failures or host DOM exceptions do not escape into the
  host page.
- A missing form while loading receives one eager `DOMContentLoaded` retry only. Uninstall removes
  that eager callback if it has not fired. A missing form after the document is loaded receives no
  retry. No timer, polling loop, or `MutationObserver` is allowed.
- The eager-callback cleanup rule does not change the existing pending-replay retry or its current
  behavior.
- Storage errors remain optional and non-throwing. Eager ensure does not read, write, or clear
  `sessionStorage`; the existing replay and outcome paths retain their current storage boundaries
  (`src/en/reference-field.ts:120-149`).
- An existing same-name input is never duplicated or structurally changed by ensure. A missing input
  is created only after a form is found, so repeated installs are idempotent.
- Empty ensure is not a lifecycle or analytics event. It must not emit `enlb:field-write`, create
  pending carry-over, change analytics behavior, or stamp dismissal frequency state.

## Testing / red-green / mutation plan

TDD is mandatory. The first new unit test must be red against the current implementation: install
listeners with a configured field and assert that the missing field exists immediately, without
dispatching an interaction. The current code does not create until `writeToForm` is reached, so this
named eager-creation test must fail before the minimal implementation is added, then pass after it is
added.

The unit matrix must cover:

- a present real EN form with the configured field absent: immediate one hidden, empty, optional
  input;
- arbitrary safe configured names, including a dotted name, proving the implementation does not
  hardcode `en_txn10`;
- existing visible and hidden same-name inputs: unchanged attributes and no duplicate;
- repeated init/install: still one configured input;
- no form while loading: one `DOMContentLoaded` retry creates the input after the form appears;
- uninstall before `DOMContentLoaded` while eager ensure is pending: dispatching the event creates no
  eager field;
- uninstall and re-install before `DOMContentLoaded` with a different safe field: after the form
  appears, the event creates only the current configured field and never the stale field;
- no form after that retry, and no form when the document is already loaded: silent no-op;
- absent, invalid, hostile, and unsafe configuration: inert and non-throwing;
- eager ensure emits no `enlb:field-write` and does not create pending storage;
- later accept and decline interactions populate the same input and emit the normal write event;
- accept-owns-outcome precedence remains intact;
- existing carry-over body/head regressions remain green.

Mutation verification must break the load-bearing eager ensure call, run the named eager-creation
test, and show it red; restoring that call must return the test to green. The verification record must
also include the full unit suite, typecheck, lint, build, contract checks, bundle-size check, and the
four-browser Playwright e2e run. The e2e coverage must assert that the configured field exists before
interaction and that native form submission still succeeds.

## Docs / spec coupling

The implementation must update the owning wave-6 stream-c spec
(`.agentic/specs/wave-6/stream-c.md`) and the user-facing timing language in `EDITOR.md` and
`CLIENT_GUIDE.md`. Those docs must say that a configured field is ensured during listener
installation; a form absent during parsing gets one `DOMContentLoaded` retry; a loaded document with
no form is a no-op; and empty ensure is not an outcome write or `enlb:field-write` event. They must
continue to describe dynamic configuration, existing-input preservation, accept/decline writes,
carry-over replay, and native form submission accurately.

The implementation also rebuilds the committed `dist/en-lightbox.js`. No analytics production change
is part of this design, and the existing bundle budget is not increased without human approval.

## Non-goals

- Hardcoded field names, including `en_txn10`.
- ENgrid wrappers, classes, form selectors, submit selectors, or duplicate-producing behavior.
- `MutationObserver`, polling, or a persistent lifecycle watcher.
- A public ensure helper or any new public API.
- Generated ids, wrappers, classes, or `required` on the created input.
- Changing existing inputs during eager ensure.
- New analytics or lifecycle events.
- Outcome writes, carry-over storage, analytics changes, or frequency-state stamps caused by empty
  ensure.
- EN submit interception or changes to native form submission.

## Acceptance criteria

The follow-up is accepted when all of the following are true:

1. With a safe configured `en.referenceField` and a detected form, the matching input exists on page
   load before any lightbox interaction, with the exact bare hidden-input contract and an empty value.
2. The normalized configured name is used for every field lookup and creation; no field name is
   hardcoded.
3. Existing same-name visible or hidden inputs remain the sole input and retain their attributes;
   missing inputs are created once only.
4. A form missing during parsing is handled by one `DOMContentLoaded` retry; an absent form after
   that point is a silent no-op, with no polling or observer.
5. Uninstalling before the eager `DOMContentLoaded` callback fires removes that callback and creates
   no eager field; uninstalling and re-installing with a different safe field leaves only the current
   configured field eligible for creation and never creates the stale field.
6. Invalid or hostile configuration, DOM failures, missing forms, and storage failures do not throw
   into the host page.
7. Empty ensure emits no `enlb:field-write`, does not set pending carry-over, and does not affect
   analytics or frequency state.
8. Later accept, decline, and carry-over paths populate the same field and retain their existing
   event detail, storage, and accept-precedence behavior.
9. Unit, mutation, typecheck, lint, build, contract, bundle-size, and four-browser e2e verification
   pass, including page-load existence and native form-submission assertions.
10. The owning spec, EDITOR/CLIENT_GUIDE timing guidance, and committed distribution are updated by
   the implementation without analytics production changes or an unapproved budget increase.

## Issue references

- GitHub issue #71: `feat(en): create configured reference field on page load`.
- Follow-up context: #69 and #55.
- Owning stream brief: `.agentic/specs/wave-6/stream-c.md` (stream issue #58; wave issue #55).
- Reference comparison: `/Users/fernando/sites/engrid/packages/scripts/src/engrid.ts:103-146`,
  `ENGrid.createHiddenInput`.
