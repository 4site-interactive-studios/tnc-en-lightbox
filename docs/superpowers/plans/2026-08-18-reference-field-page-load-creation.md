# Reference-field Page-load Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure a configured, safely normalized EN reference field exists during listener installation, while preserving existing inputs, outcome writes, carry-over replay, native submission, and host-page safety.

**Architecture:** `src/en/config.ts` remains the only source of safe-name normalization. `src/en/reference-field.ts` will add a private, lifecycle-aware eager ensure beside the existing outcome writer: it queries `form.en__component--page` first, falls back to `form[data-en-component="form"]`, and uses the existing first-name-match DOM lookup. `src/index.ts` remains the integration seam; its existing uninstall-before-reinstall order supplies stale-field prevention once the reference-field cleanup also removes the pending eager callback.

**Tech Stack:** TypeScript 6, Vite 8, Vitest 4 with jsdom, Playwright 1.61 cross-browser projects, npm scripts, and the existing zero-runtime-dependency IIFE build.

## Global Constraints

- Use the dynamic normalized `en.referenceField`; the unit suite covers the exact client acceptance example `en_txn10` and an unrelated dotted name, while `en_txn10` remains test/example data only and must never be hardcoded as a production constant or default.
- During ensure, an existing same-name input of any type is untouched; when missing, create exactly one bare hidden/name/empty/no-id/no-required input inside the selected form.
- Use the real EN form selector `form.en__component--page` first and the legacy selector `form[data-en-component="form"]` second.
- Ensure immediately, register one `DOMContentLoaded` retry only when the document is loading and no form is present, cancel a not-yet-fired eager callback during cleanup, and prevent a stale old field after reinitialization.
- Do not add `MutationObserver`, polling, timers, wrappers, a public API/helper export, `innerHTML`, or an unescaped dynamic selector.
- An empty ensure emits no `enlb:field-write`, storage write or clear, pending carry-over change, analytics effect, or frequency-state effect.
- Never throw into the host page; accept, decline, and replay behavior and event details remain unchanged.
- Keep zero runtime dependencies, one built `dist/en-lightbox.js`, and the existing 7400B gzip budget; do not change the budget without owner approval.
- TDD and mutation verification are mandatory.
- Implementation agents never commit, push, or create/switch branches; the orchestrator owns Git. Every checkpoint below gives exact orchestrator staging and commit commands, which the implementation agent reports but does not run.
- Keep `src/index.ts` unchanged: its current `init` path uninstalls the previous reference-field listener before installing the normalized next configuration.

---

## File map

| Path | Responsibility in this implementation | Expected action |
|---|---|---|
| `src/en/reference-field.ts` | Private eager ensure, EN form lookup, cleanup, and unchanged outcome/replay writer | Modify |
| `src/en/reference-field.test.ts` | Unit RED/GREEN contract, lifecycle, safety, idempotence, storage/event, and precedence coverage | Modify |
| `e2e/reference-field.spec.ts` | Page-load-before-interaction, dynamic-name, outcome, and native-submit browser proof | Modify |
| `.agentic/specs/wave-6/stream-c.md` | Owning wave-6 stream truth for page-load timing and empty ensure semantics | Modify |
| `EDITOR.md` | Page-editor timing and reference-field behavior guidance | Modify |
| `CLIENT_GUIDE.md` | Campaign setup FAQ timing and reference-field behavior guidance | Modify |
| `dist/en-lightbox.js` | Deterministically rebuilt shipped IIFE | Regenerate with `npm run build`; never hand-edit |
| `docs/superpowers/specs/2026-08-18-reference-field-page-load-creation-design.md` | Human-approved normative design already committed at `HEAD` | Read only |
| `docs/superpowers/plans/2026-08-18-reference-field-page-load-creation.md` | This implementation plan | Create now; do not edit during implementation |

No fixture change is planned. `e2e/harness.html` already exposes a real EN page-builder form, and `harnessUrl` accepts dynamic configuration. The unit suite uses the exact client example `en_txn10`; the E2E test can configure the unrelated dotted name `supporter.questions.848518`, which is absent from the current fixture, so it proves dynamic creation without changing `e2e/harness.html`, `e2e/carry-over.html`, or `e2e/carry-over-head.html`.

## Interfaces and invariants used by all tasks

The implementation remains private to `src/en/reference-field.ts` and uses these exact signatures:

```ts
function findENForm(): HTMLFormElement | null
function ensureField(field: string): boolean
function ensureFieldOnLoad(field: string): () => void
```

`findENForm` returns the first real EN form or the first legacy fallback form. `ensureField` returns `true` only when it finds or creates the matching input and returns `false` for an unsafe name, missing form, or guarded DOM failure. `ensureFieldOnLoad` performs the immediate ensure and returns cleanup for only its eager `DOMContentLoaded` callback; it does not alter the existing pending-replay callback.

## Task 1: RED unit contracts for immediate client-example and dynamic creation

**Files:**

- Modify: `src/en/reference-field.test.ts:5-7` for the client-example and unrelated dotted-name constants and `src/en/reference-field.test.ts:184` before the existing primary-CTA test for the new contracts.
- Test: `src/en/reference-field.test.ts`

**Interfaces:**

- Consumes: existing `mountEnForm`, `fieldInput`, `normalizeENConfig`, and `installReferenceFieldListeners` helpers.
- Produces: named RED tests that the minimal immediate ensure must satisfy without changing outcome paths.

- [ ] **Step 1: Add the exact client example, an unrelated dotted configured name, and an attribute snapshot helper.**

Insert immediately after the existing `const FIELD = 'supporter.appealCode'`:

```ts
const CLIENT_FIELD = 'en_txn10'
const DYNAMIC_FIELD = 'supporter.questions.848518'
```

Insert immediately after `fieldInput` and before `setDocumentReadyState`:

```ts
function attributeSnapshot(input: HTMLInputElement): Array<[string, string]> {
  return Array.from(input.attributes).map(
    (attribute): [string, string] => [attribute.name, attribute.value],
  )
}
```

- [ ] **Step 2: Add the immediate client-example, dynamic, preservation, idempotence, and no-side-effect tests.**

Insert before the existing test named `creates a hidden optional field for a primary CTA and emits the exact write detail`:

```ts
  it('creates the configured field immediately during installation without writing an outcome', () => {
    const { form } = mountEnForm()
    const writes: CustomEvent[] = []
    const onWrite = (event: Event) => writes.push(event as CustomEvent)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    document.addEventListener('enlb:field-write', onWrite)

    const uninstall = installReferenceFieldListeners({ referenceField: CLIENT_FIELD })

    try {
      const input = fieldInput(form, CLIENT_FIELD)
      expect(form.querySelectorAll(`input[name="${CLIENT_FIELD}"]`)).toHaveLength(1)
      expect(input).not.toBeNull()
      expect(input!.type).toBe('hidden')
      expect(input!.name).toBe(CLIENT_FIELD)
      expect(input!.value).toBe('')
      expect(input!.id).toBe('')
      expect(input!.hasAttribute('id')).toBe(false)
      expect(input!.hasAttribute('required')).toBe(false)
      expect(input!.className).toBe('')
      expect(input!.parentElement).toBe(form)
      expect(writes).toHaveLength(0)
      expect(setItem).not.toHaveBeenCalled()
      expect(sessionStorage.length).toBe(0)
    } finally {
      uninstall()
      document.removeEventListener('enlb:field-write', onWrite)
      setItem.mockRestore()
    }
  })

  it('uses the normalized dotted field name instead of a fixed field name', () => {
    const { form } = mountEnForm()
    const config = normalizeENConfig({ en: { referenceField: DYNAMIC_FIELD } })
    const uninstall = installReferenceFieldListeners(config)

    try {
      expect(fieldInput(form, DYNAMIC_FIELD)).not.toBeNull()
      expect(fieldInput(form, CLIENT_FIELD)).toBeNull()
      expect(fieldInput(form, FIELD)).toBeNull()
    } finally {
      uninstall()
    }
  })

  it.each(['hidden', 'visible'] as const)(
    'does not alter an existing %s same-name input during eager ensure',
    (kind) => {
      const { form, input } = mountEnForm(kind)
      const existing = input!
      existing.value = 'preexisting'
      existing.required = true
      existing.setAttribute('aria-describedby', 'keep-me')
      const before = {
        type: existing.type,
        value: existing.value,
        id: existing.id,
        required: existing.required,
        className: existing.className,
        attributes: attributeSnapshot(existing),
      }

      const uninstall = installReferenceFieldListeners({ referenceField: FIELD })

      try {
        expect(fieldInput(form)).toBe(existing)
        expect(attributeSnapshot(existing)).toEqual(before.attributes)
        expect({
          type: existing.type,
          value: existing.value,
          id: existing.id,
          required: existing.required,
          className: existing.className,
        }).toEqual({
          type: before.type,
          value: before.value,
          id: before.id,
          required: before.required,
          className: before.className,
        })
        expect(form.querySelectorAll(`input[name="${FIELD}"]`)).toHaveLength(1)
      } finally {
        uninstall()
      }
    },
  )

  it('is idempotent across repeated installation for a missing configured field', () => {
    const { form } = mountEnForm()
    const firstUninstall = installReferenceFieldListeners({ referenceField: FIELD })
    const secondUninstall = installReferenceFieldListeners({ referenceField: FIELD })

    try {
      expect(form.querySelectorAll(`input[name="${FIELD}"]`)).toHaveLength(1)
      expect(fieldInput(form)!.value).toBe('')
    } finally {
      firstUninstall()
      secondUninstall()
    }
  })
```

These assertions deliberately inspect the input before any `enlb:cta` or `enlb:dismiss` dispatch. The first named test verifies the exact client acceptance example `en_txn10`: count, name, type, empty value, no id, no `required`, no class, direct form parent, no `enlb:field-write`, and no storage. The separate dotted-name test uses the unrelated `DYNAMIC_FIELD` value and asserts that neither `CLIENT_FIELD` nor `FIELD` is created, proving the configured name is used rather than a production constant or default. The remaining assertions verify preservation of both visible and hidden existing inputs and repeat-install idempotence. They do not use a dynamic selector in production code; the test selector contains the already-known safe fixture field.

- [ ] **Step 3: Run the first named test against the current implementation and capture RED.**

Run:

```bash
npm ci
npm test -- src/en/reference-field.test.ts -t "creates the configured field immediately during installation without writing an outcome"
```

Expected: Vitest reports the named test as `FAIL` because `fieldInput(form, CLIENT_FIELD)` is `null` immediately after installation; the current implementation only reaches `findOrCreateInput` from `writeToForm` during an outcome or replay. Do not change source code before recording this failure.

- [ ] **Step 4: Orchestrator checkpoint (agent reports; does not run).**

After the RED evidence is recorded, the orchestrator may stage and commit only the unit-contract change:

```bash
git add src/en/reference-field.test.ts
git commit -m "test(en): cover eager reference-field creation"
```

The implementation agent performs neither command.

## Task 2: Minimal immediate ensure implementation and GREEN

**Files:**

- Modify: `src/en/reference-field.ts:23-57` for installation-time ensure, `src/en/reference-field.ts:59` for private form helpers, `src/en/reference-field.ts:87-90` for shared form lookup, and `src/en/reference-field.ts:107-117` for explicit empty construction.
- Test: `src/en/reference-field.test.ts` from Task 1.

**Interfaces:**

- Consumes: normalized `config.referenceField`, existing `isSafeReferenceFieldName`, `findOrCreateInput`, `replayPending`, and the existing outcome event/storage paths.
- Produces: private `findENForm(): HTMLFormElement | null` and `ensureField(field: string): boolean`; no export or public API change.

- [ ] **Step 1: Add the guarded shared form lookup and immediate ensure.**

Insert immediately before the existing `writeOutcome` function at `src/en/reference-field.ts:59`:

```ts
function findENForm(): HTMLFormElement | null {
  return (
    document.querySelector<HTMLFormElement>(EN_FORM_SELECTOR) ??
    document.querySelector<HTMLFormElement>(LEGACY_EN_FORM_SELECTOR)
  )
}

function ensureField(field: string): boolean {
  try {
    if (!isSafeReferenceFieldName(field)) return false
    const form = findENForm()
    if (!form) return false
    return findOrCreateInput(form, field) !== null
  } catch {
    // Page-load ensure is best-effort and must not escape into the host page.
    return false
  }
}
```

Replace the current installation body at `src/en/reference-field.ts:23-57` with this immediate-only version. The lifecycle cleanup is added in Task 3; this step intentionally proves only the synchronous contract:

```ts
export function installReferenceFieldListeners(config: NormalizedENIntegrationConfig): () => void {
  const field = config.referenceField
  if (!isSafeReferenceFieldName(field)) return () => undefined

  const onCta = (event: Event): void => {
    try {
      const role = (event as CustomEvent<CtaDetail>).detail?.role
      if (role === 'primary') writeOutcome(field, ACCEPTED)
    } catch {
      // A malformed host event must never escape into the host page.
    }
  }

  const onDismiss = (event: Event): void => {
    try {
      const reason = (event as CustomEvent<DismissDetail>).detail?.reason
      if (typeof reason === 'string' && DECLINE_REASONS.has(reason)) writeOutcome(field, DECLINED)
    } catch {
      // A malformed host event must never escape into the host page.
    }
  }

  try {
    document.addEventListener('enlb:cta', onCta)
    document.addEventListener('enlb:dismiss', onDismiss)
    ensureField(field)
    replayPending(field)
  } catch {
    return () => undefined
  }

  return () => {
    document.removeEventListener('enlb:cta', onCta)
    document.removeEventListener('enlb:dismiss', onDismiss)
  }
}
```

- [ ] **Step 2: Reuse the shared form lookup without changing outcome behavior.**

Inside the existing `try` block in `writeToForm`, replace only the two-selector expression at `src/en/reference-field.ts:87-90`:

```ts
const form = findENForm()
if (!form) return false
```

Keep the existing `findOrCreateInput(form, field)`, `input.value = value`, `enlb:field-write` detail `{ action, field, value }`, and return path byte-for-byte otherwise. This preserves first-match DOM-order writes and the current pending-storage boundary.

- [ ] **Step 3: Make the created input explicitly empty while retaining the existing-input branch.**

Replace the complete `findOrCreateInput` function at `src/en/reference-field.ts:107-117` with:

```ts
function findOrCreateInput(form: HTMLFormElement, field: string): HTMLInputElement | null {
  const existing = Array.from(form.querySelectorAll<HTMLInputElement>('input')).find(
    (input) => input.name === field,
  )
  if (existing) return existing

  const input = document.createElement('input')
  input.type = 'hidden'
  input.name = field
  input.value = ''
  form.appendChild(input)
  return input
}
```

Do not add an `id`, `required`, class, wrapper, ENgrid markup, or selector interpolation. The existing branch returns the same input without changing any property.

- [ ] **Step 4: Run the focused unit file GREEN.**

Run:

```bash
npm test -- src/en/reference-field.test.ts
```

Expected: every test in `src/en/reference-field.test.ts` passes, including the Task 1 exact-client-example (`en_txn10`), unrelated dotted-name (`DYNAMIC_FIELD`), preservation, idempotence, event, and storage assertions. The existing accept, decline, accept-precedence, selector-order, replay, and storage-retention tests remain green.

- [ ] **Step 5: Orchestrator checkpoint (agent reports; does not run).**

After the focused file is GREEN, the orchestrator may stage and commit the immediate implementation:

```bash
git add src/en/reference-field.ts
git commit -m "feat(en): create reference field during installation"
```

The implementation agent performs neither command.

## Task 3: RED/GREEN lifecycle cleanup and stale-field prevention

**Files:**

- Modify: `src/en/reference-field.test.ts` after the Task 1 idempotence test for lifecycle tests.
- Modify: `src/en/reference-field.ts:45-57` for eager retry ownership and cleanup; insert `ensureFieldOnLoad` immediately before `writeOutcome`.
- Test: `src/en/reference-field.test.ts`

**Interfaces:**

- Consumes: `ensureField(field: string): boolean`, `setDocumentReadyState`, and the existing `init` uninstall seam in `src/index.ts:20-30`.
- Produces: private `ensureFieldOnLoad(field: string): () => void`, which owns only the new eager callback. The existing `replayPending` `DOMContentLoaded` callback is not refactored or cancelled by this task.

- [ ] **Step 1: Add named lifecycle and host-boundary tests while Task 2 has no retry.**

Insert after `is idempotent across repeated installation for a missing configured field`:

```ts
  it('creates the field once on the single DOMContentLoaded retry', () => {
    const restoreReadyState = setDocumentReadyState('loading')
    let uninstall: (() => void) | undefined

    try {
      uninstall = installReferenceFieldListeners({ referenceField: FIELD })
      const { form } = mountEnForm()
      expect(fieldInput(form)).toBeNull()

      Object.defineProperty(document, 'readyState', { configurable: true, value: 'interactive' })
      document.dispatchEvent(new Event('DOMContentLoaded'))
      expect(form.querySelectorAll(`input[name="${FIELD}"]`)).toHaveLength(1)

      document.dispatchEvent(new Event('DOMContentLoaded'))
      expect(form.querySelectorAll(`input[name="${FIELD}"]`)).toHaveLength(1)
    } finally {
      uninstall?.()
      restoreReadyState()
    }
  })

  it('cancelling before DOMContentLoaded prevents eager creation', () => {
    const restoreReadyState = setDocumentReadyState('loading')
    let uninstall: (() => void) | undefined

    try {
      uninstall = installReferenceFieldListeners({ referenceField: FIELD })
      const { form } = mountEnForm()
      uninstall()
      uninstall = undefined

      Object.defineProperty(document, 'readyState', { configurable: true, value: 'interactive' })
      document.dispatchEvent(new Event('DOMContentLoaded'))
      expect(fieldInput(form)).toBeNull()
    } finally {
      uninstall?.()
      restoreReadyState()
    }
  })

  it('reinstalling before DOMContentLoaded never creates the stale field', () => {
    const restoreReadyState = setDocumentReadyState('loading')
    let uninstallOld: (() => void) | undefined
    let uninstallCurrent: (() => void) | undefined

    try {
      uninstallOld = installReferenceFieldListeners({ referenceField: FIELD })
      uninstallOld()
      uninstallOld = undefined
      uninstallCurrent = installReferenceFieldListeners({ referenceField: DYNAMIC_FIELD })
      const { form } = mountEnForm()

      Object.defineProperty(document, 'readyState', { configurable: true, value: 'interactive' })
      document.dispatchEvent(new Event('DOMContentLoaded'))

      expect(fieldInput(form, FIELD)).toBeNull()
      expect(form.querySelectorAll(`input[name="${DYNAMIC_FIELD}"]`)).toHaveLength(1)
    } finally {
      uninstallOld?.()
      uninstallCurrent?.()
      restoreReadyState()
    }
  })

  it('does not retry after DOMContentLoaded when the form is still absent', () => {
    const restoreReadyState = setDocumentReadyState('loading')
    let uninstall: (() => void) | undefined

    try {
      uninstall = installReferenceFieldListeners({ referenceField: FIELD })
      Object.defineProperty(document, 'readyState', { configurable: true, value: 'interactive' })
      document.dispatchEvent(new Event('DOMContentLoaded'))
      const { form } = mountEnForm()
      document.dispatchEvent(new Event('DOMContentLoaded'))
      expect(fieldInput(form)).toBeNull()
    } finally {
      uninstall?.()
      restoreReadyState()
    }
  })

  it('does not retry in a loaded document with no form', () => {
    const restoreReadyState = setDocumentReadyState('complete')
    const addEventListener = vi.spyOn(document, 'addEventListener')
    let uninstall: (() => void) | undefined

    try {
      uninstall = installReferenceFieldListeners({ referenceField: FIELD })
      expect(document.querySelector(`input[name="${FIELD}"]`)).toBeNull()
      expect(addEventListener).not.toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function), expect.anything())
    } finally {
      uninstall?.()
      addEventListener.mockRestore()
      restoreReadyState()
    }
  })

  it('swallows eager DOM lookup failures without throwing into the host page', () => {
    const querySelector = vi.spyOn(document, 'querySelector').mockImplementation(() => {
      throw new Error('host DOM failure')
    })
    let uninstall: (() => void) | undefined

    try {
      expect(() => {
        uninstall = installReferenceFieldListeners({ referenceField: FIELD })
      }).not.toThrow()
    } finally {
      uninstall?.()
      querySelector.mockRestore()
    }
  })
```

The retry test appends the form after installation, proves one creation after the first lifecycle event, and proves no duplicate after a second manually dispatched event. The cancellation and reinstall tests model the exact uninstall-before-next-install sequence used by `init`; only the current dynamic field may be created. The two no-form tests distinguish one loading-time retry from a loaded-document no-op. The final test covers the eager DOM boundary without changing the existing accept, decline, or replay tests.

- [ ] **Step 2: Run the named lifecycle tests RED against the Task 2 implementation.**

Run:

```bash
npm test -- src/en/reference-field.test.ts -t "DOMContentLoaded retry|cancelling before DOMContentLoaded|reinstalling before DOMContentLoaded|does not retry after DOMContentLoaded|does not retry in a loaded document|swallows eager DOM lookup failures"
```

Expected: the named retry, cancellation, reinstall, and post-event form tests fail because Task 2 performs only its immediate lookup and registers no eager callback; the loaded-document and guarded-DOM tests may pass. Record the failing named tests before changing the lifecycle implementation.

- [ ] **Step 3: Add the private one-retry scheduler with active-state cancellation.**

Insert immediately before `writeOutcome`:

```ts
function ensureFieldOnLoad(field: string): () => void {
  let active = true
  let pendingReady: (() => void) | null = null

  const ensure = (): void => {
    if (!active) return
    try {
      if (ensureField(field)) return
      if (document.readyState !== 'loading' || pendingReady) return

      const onReady = (): void => {
        pendingReady = null
        if (!active) return
        try {
          ensureField(field)
        } catch {
          // A deferred host DOM failure must not escape into the host page.
        }
      }

      pendingReady = onReady
      try {
        document.addEventListener('DOMContentLoaded', onReady, { once: true })
      } catch {
        pendingReady = null
        // A host document that rejects listener registration gets no retry.
      }
    } catch {
      // Reading host DOM state is best-effort and must not escape.
    }
  }

  ensure()

  return (): void => {
    active = false
    const onReady = pendingReady
    pendingReady = null
    if (!onReady) return
    try {
      document.removeEventListener('DOMContentLoaded', onReady)
    } catch {
      // The active flag still prevents a queued callback from creating a stale field.
    }
  }
}
```

Replace the `try` and returned cleanup portions of `installReferenceFieldListeners` with the following exact integration. Keep the existing `onCta`, `onDismiss`, and `replayPending` functions unchanged:

```ts
  let uninstallEagerEnsure: () => void = () => undefined

  try {
    document.addEventListener('enlb:cta', onCta)
    document.addEventListener('enlb:dismiss', onDismiss)
    uninstallEagerEnsure = ensureFieldOnLoad(field)
    replayPending(field)
  } catch {
    uninstallEagerEnsure()
    return () => undefined
  }

  return () => {
    uninstallEagerEnsure()
    document.removeEventListener('enlb:cta', onCta)
    document.removeEventListener('enlb:dismiss', onDismiss)
  }
```

This is the only new `DOMContentLoaded` callback. It is `{ once: true }`, never reschedules itself, and has both listener removal and an `active` guard. It does not touch `replayPending`'s existing callback or storage behavior. The immediate call occurs inside `ensureFieldOnLoad`, so the production load-bearing line for mutation verification is:

```ts
uninstallEagerEnsure = ensureFieldOnLoad(field)
```

- [ ] **Step 4: Run lifecycle and full focused unit GREEN.**

Run:

```bash
npm test -- src/en/reference-field.test.ts -t "DOMContentLoaded retry|cancelling before DOMContentLoaded|reinstalling before DOMContentLoaded|does not retry after DOMContentLoaded|does not retry in a loaded document|swallows eager DOM lookup failures"
npm test -- src/en/reference-field.test.ts
```

Expected: the named lifecycle tests and then every reference-field unit test pass. The pending replay tests still use their original callback and retain their existing storage/event assertions; when both callbacks run on `DOMContentLoaded`, eager creation runs first and replay writes the pending outcome through the unchanged `writeToForm` path.

- [ ] **Step 5: Orchestrator checkpoints (agent reports; does not run).**

After the lifecycle tests are added and RED, the orchestrator may preserve the test-first checkpoint:

```bash
git add src/en/reference-field.test.ts
git commit -m "test(en): cover eager reference-field lifecycle"
```

After the lifecycle implementation is GREEN, the orchestrator may stage and commit only the source change:

```bash
git add src/en/reference-field.ts
git commit -m "feat(en): cancel stale eager retries"
```

The implementation agent performs neither command.

## Task 4: E2E page-load, dynamic-name, outcome, and native-submit proof

**Files:**

- Modify: `e2e/reference-field.spec.ts:5-10` for a dynamic test field and `e2e/reference-field.spec.ts:45` before the existing interaction regression.
- Test: `e2e/reference-field.spec.ts`
- Read only: `e2e/harness.html`, `e2e/helpers.ts`, `e2e/carry-over.html`, and `e2e/carry-over-head.html`; no fixture modification is needed.

**Interfaces:**

- Consumes: `harnessUrl`, the current real EN form fixture, `expectFormSubmits`, and the built `dist/en-lightbox.js` served by the Playwright web server.
- Produces: one browser test that observes the configured dynamic input before any lightbox interaction, then verifies the normal primary outcome and native submit path.

- [ ] **Step 1: Add the dynamic page-load test.**

Insert immediately after `const FIELD = 'supporter.appealCode'`:

```ts
const DYNAMIC_FIELD = 'supporter.questions.848518'
```

Insert immediately before the existing test named `writes accepted for a close-action primary CTA and preserves form submission`:

```ts
test('creates a dynamic reference field before interaction and preserves native submission', async ({ page }) => {
  await page.goto(
    harnessUrl({
      ...baseConfig,
      en: { referenceField: DYNAMIC_FIELD },
      cta: { label: 'Accept', action: 'close' },
    }),
  )

  const field = page.locator(`#en-form input[name="${DYNAMIC_FIELD}"]`)
  await expect(field).toHaveCount(1)
  await expect(field).toHaveAttribute('type', 'hidden')
  await expect(field).toHaveValue('')
  await expect(field).not.toHaveAttribute('id')
  await expect(field).not.toHaveAttribute('required')

  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await page.locator('.enlb-cta:not(.enlb-cta--secondary)').click()
  await expect(field).toHaveValue('lightbox_accepted')

  expect(
    await page.locator('#en-form').evaluate(
      (element, fieldName) => new FormData(element as HTMLFormElement).get(fieldName),
      DYNAMIC_FIELD,
    ),
  ).toBe('lightbox_accepted')

  await expectFormSubmits(page)
})
```

The current harness already contains `supporter.appealCode`, but not `supporter.questions.848518`; this browser test intentionally uses the unrelated dotted name while the unit suite covers the exact client example `en_txn10`. Together they prove that the field came from the normalized configuration rather than a production constant and was created by page-load installation. The browser test checks the field before clicking any CTA, then exercises the existing accept write, verifies that native `FormData` serialization contains `lightbox_accepted` under the dynamic name, and runs the `SubmitEvent` path. The existing accept, legacy-selector, carry-over, Tealium, and decline tests remain the outcome regression matrix.

- [ ] **Step 2: Prove the new browser contract RED before rebuilding the artifact.**

Run against the committed pre-change distribution:

```bash
npm run e2e -- e2e/reference-field.spec.ts -g "creates a dynamic reference field before interaction and preserves native submission"
```

Expected: the named test fails at `await expect(field).toHaveCount(1)` because the committed `dist/en-lightbox.js` has not yet been rebuilt with the eager ensure. Preserve this RED evidence; do not edit a fixture or hand-edit `dist/en-lightbox.js` to make the test pass.

- [ ] **Step 3: Run the focused browser test GREEN after the deterministic build.**

After Task 5's `npm run build`, rerun the exact command:

```bash
npm run e2e -- e2e/reference-field.spec.ts -g "creates a dynamic reference field before interaction and preserves native submission"
```

Expected: the named test passes in the configured Playwright project run, with one empty optional hidden input present before interaction, `lightbox_accepted` after the primary CTA, `lightbox_accepted` returned by `new FormData(form).get(DYNAMIC_FIELD)`, and `{ fired: true, defaultPrevented: false, valid: true }` from `expectFormSubmits`.

- [ ] **Step 4: Orchestrator checkpoint (agent reports; does not run).**

After the E2E test is added and its pre-build RED evidence is recorded, the orchestrator may stage and commit only that test:

```bash
git add e2e/reference-field.spec.ts
git commit -m "test(e2e): verify page-load reference field"
```

The implementation agent performs neither command.

## Task 5: Documentation truth, deterministic distribution, and complete verification

**Files:**

- Modify: `.agentic/specs/wave-6/stream-c.md` after the existing `Remediation R2 (real EN pages)` section.
- Modify: `EDITOR.md:168-192` in the EN reference-field outcomes section.
- Modify: `CLIENT_GUIDE.md:328-346` in the reference-field FAQ answer.
- Regenerate: `dist/en-lightbox.js` with `npm run build`.
- Do not modify: package scripts, contract snapshots, fixtures, `src/index.ts`, analytics code, or `.agentic/contracts/budgets.json`.

**Interfaces:**

- Consumes: the implemented private eager lifecycle and the unchanged outcome/replay contract.
- Produces: docs that state installation-time ensure timing accurately, a rebuilt single IIFE, and the evidence packet required for handoff.

- [ ] **Step 1: Add the owning stream-c R3 truth.**

Append this exact section after the current `Remediation R2 (real EN pages)` bullets in `.agentic/specs/wave-6/stream-c.md`:

```md
## Remediation R3 (eager page-load creation)

- When `en.referenceField` normalizes to a safe name, listener installation immediately ensures a matching input in the first `form.en__component--page`, falling back to `form[data-en-component="form"]`.
- If no form exists while `document.readyState === "loading"`, installation registers exactly one `{ once: true }` `DOMContentLoaded` retry. A loaded document with no form is a silent no-op, uninstall removes a pending eager retry, and reinitialization cannot create the stale prior field.
- Ensure reuses an existing same-name input of any type unchanged; otherwise it appends one bare optional hidden input with the dynamic normalized name and empty value. Empty ensure emits no `enlb:field-write`, writes no pending storage, changes no analytics or frequency state, and does not alter native submission. Existing accept, decline, and carry-over write/replay paths remain unchanged.
```

- [ ] **Step 2: Replace the EDITOR reference-field timing prose.**

Replace all content under the existing `## Engaging Networks reference-field outcomes` heading through the sentence ending `Same-page writes do not require a redirect.` with this exact text:

````md
Set `en.referenceField` to the available Engaging Networks reference field designated by
Membership. Membership should choose a field that is not shared with the annual upsell (avoid
`en_txn2` when that campaign is present). The writer is config-gated and fully inert when this option is omitted.

```js
en: { referenceField: "supporter.appealCode" }
```

When a safe configured field is installed, the library immediately ensures that the matching input
exists in the real EN page form (`form.en__component--page`), using the legacy
`form[data-en-component="form"]` form only when the real selector is absent. If the form is not yet
present while the document is loading, it makes one `DOMContentLoaded` retry. A loaded document
with no matching form is a silent no-op.

The page-load ensure is structural only: it is not an outcome, does not emit `enlb:field-write`,
does not write pending carry-over storage, and does not affect analytics or dismissal frequency.
The configured name is dynamic, including valid dotted names such as `supporter.appealCode`.
The eager ensure leaves an existing same-name input of any type completely unchanged. When no matching
input exists, it creates one bare, empty, non-required hidden input without an `id`. Only a later accept,
decline, or replay outcome write updates the input's `.value`; those writes do not change its other
attributes.

A primary CTA writes the exact value `lightbox_accepted`; close-button, Escape, overlay, secondary
close, dismiss CTA, and API close paths write `lightbox_declined`. A primary CTA with `action: "close"`
remains an accept, so its follow-up close event does not overwrite `lightbox_accepted`.

The library keeps the most recent outcome in `sessionStorage` for a native redirect only after that
origin-page write occurred, so the origin page needs its EN form present. The destination page must
embed the same `dist/en-lightbox.js` asset and configure the same `en.referenceField`. Replay
automatically waits for DOM readiness, so a config-before-script embed in `<head>` is allowed; the
matching EN form then receives the value and the carry-over entry is cleared. Same-page writes do
not require a redirect.
````

Do not change the existing dynamic configuration example or the accept/decline value names.

- [ ] **Step 3: Replace the CLIENT_GUIDE reference-field FAQ answer.**

Replace the answer under `**Can we record lightbox outcomes in an Engaging Networks reference field?**` through the sentence ending `do not share a field with another campaign.` with:

````md
Yes. Configure the reference field designated by Membership:

```javascript
en: { referenceField: "supporter.appealCode" }
```

When the configured name is safe, the library ensures the matching input during listener
installation, before any lightbox interaction. It selects the real EN page-builder form first and
uses the legacy EN form selector as a fallback. If the form is absent while the page is still
loading, it retries once on `DOMContentLoaded`; if the document is already loaded and no form is
present, it does nothing.

This empty ensure is not an outcome write: it emits no `enlb:field-write`, does not create pending
carry-over storage, and does not affect analytics or frequency state. The primary CTA writes
`lightbox_accepted`; close, Escape, overlay, secondary, dismiss, and API close paths write
`lightbox_declined`. A primary CTA with `action: "close"` remains accepted. Dotted EN names such
as `supporter.appealCode` are supported. The eager ensure leaves an existing same-name input of any type
completely unchanged; otherwise it creates one empty, optional hidden input without an `id`. Only a
later accept, decline, or replay outcome write updates the input's `.value`; those writes do not change
its other attributes.

A redirect CTA carries the latest outcome through the current session only after the origin page
wrote it to its EN form, so the origin form must be present. For carry-over, the destination page
must embed `dist/en-lightbox.js` and use the same configured field. Replay waits automatically for
DOM readiness, so a config-before-script embed in `<head>` is allowed; the value is cleared after a
successful replay. Membership owns the deployed field designation—avoid `en_txn2` when the annual
upsell uses it, and do not share a field with another campaign.
````

- [ ] **Step 4: Rebuild the committed distribution and keep contracts/budget unchanged.**

Run:

```bash
npm run build
```

Expected: Vite emits the single minified IIFE at `dist/en-lightbox.js`; no `.css` file or second runtime artifact is introduced. Do not hand-edit the generated file and do not alter `.agentic/contracts/budgets.json`.

Then run the required generators followed by the exact snapshot-diff command:

```bash
npm run contracts:generate
git add -AN && git diff --exit-code .agentic/contracts/snapshots/api-surface.txt .agentic/contracts/snapshots/config-schema.txt
```

Expected: both committed snapshots remain unchanged because the change is private to `src/en/reference-field.ts` and adds no public API or config-schema member. The `git add -AN` is the required deletion/untracked-file-safe form used by the contracts gate; it is not a commit.

Run the bundle-size gate:

```bash
node tools/sdd/check_size.mjs
```

Expected: `bundle-size OK: gzip <actual>B / budget 7400B`; report the measured `<actual>` value and do not raise the budget.

- [ ] **Step 5: Run the complete verification matrix.**

Run these exact commands from the repository root:

```bash
npm test -- src/en/reference-field.test.ts
npm test
npm run typecheck
npm run lint
npm run build
npm run contracts:generate
git add -AN && git diff --exit-code .agentic/contracts/snapshots/api-surface.txt .agentic/contracts/snapshots/config-schema.txt
node tools/sdd/check_size.mjs
python3 tools/sdd/check_contracts.py
npm run e2e -- e2e/reference-field.spec.ts -g "creates a dynamic reference field before interaction and preserves native submission"
npm run e2e
git diff --check

# Task 5 pre-final-checkpoint scope (working tree only; the plan is committed before implementation).
git status --short
git diff --name-only --diff-filter=ACMRTUXB

# Committed branch scope before the final Task 5 checkpoint.
git diff --name-only 2481b9c...HEAD
```

Expected: focused and full Vitest pass; typecheck and lint pass; the build is deterministic; both generated snapshots are unchanged; all registered contracts pass; the focused Playwright test passes; the full Playwright run passes in Chromium, Firefox, WebKit, and Mobile Chrome; `git diff --check` is clean. Before the final Task 5 orchestrator checkpoint, the working-tree audit must identify exactly these four Task-5 paths:

```text
.agentic/specs/wave-6/stream-c.md
CLIENT_GUIDE.md
EDITOR.md
dist/en-lightbox.js
```

At that same pre-final-checkpoint point, `git diff --name-only 2481b9c...HEAD` must contain the committed design and plan plus the earlier source, unit-test, and E2E checkpoints; it must not contain the four still-uncommitted Task-5 paths. The union of that committed branch diff and the working-tree diff is exactly the nine allowed paths below. The implementation-only subset is exactly these seven paths:

```text
.agentic/specs/wave-6/stream-c.md
CLIENT_GUIDE.md
EDITOR.md
dist/en-lightbox.js
e2e/reference-field.spec.ts
src/en/reference-field.test.ts
src/en/reference-field.ts
```

The final branch-wide `git diff --name-only 2481b9c...HEAD` audit, rerun after the final Task 5 checkpoint, is intentionally broader because it includes the already-committed design and plan files plus all seven implementation paths; it must allow exactly these nine paths:

```text
.agentic/specs/wave-6/stream-c.md
CLIENT_GUIDE.md
EDITOR.md
dist/en-lightbox.js
docs/superpowers/specs/2026-08-18-reference-field-page-load-creation-design.md
docs/superpowers/plans/2026-08-18-reference-field-page-load-creation.md
e2e/reference-field.spec.ts
src/en/reference-field.test.ts
src/en/reference-field.ts
```

After the final Task 5 orchestrator checkpoint commits the four Task-5 paths, the orchestrator reruns `git diff --name-only 2481b9c...HEAD`; it must then contain exactly the nine paths above, and `git status --short` must be clean. No contract snapshot, fixture, package script, `src/index.ts`, analytics, or budget change is expected.

- [ ] **Step 6: Perform mutation verification without committing the mutation.**

Start from the GREEN source and temporarily remove or bypass exactly this load-bearing invocation in `installReferenceFieldListeners`:

```ts
uninstallEagerEnsure = ensureFieldOnLoad(field)
```

For the mutation only, leave `uninstallEagerEnsure` at its initialized no-op and omit the invocation; do not alter `ensureField`, the tests, or the existing replay callback. Run:

```bash
npm test -- src/en/reference-field.test.ts -t "creates the configured field immediately during installation without writing an outcome"
```

Expected: the named eager test is RED because the missing configured input is absent immediately after installation. Record the mutation as `src/en/reference-field.ts`, the exact invocation above, and the observed failure reason.

Restore the invocation byte-exactly and rerun:

```bash
npm test -- src/en/reference-field.test.ts -t "creates the configured field immediately during installation without writing an outcome"
```

Expected: the named eager test is GREEN again. Confirm the mutation is absent from the final diff before handoff.

- [ ] **Step 7: Orchestrator checkpoint (agent reports; does not run).**

After docs are accurate, the generated distribution and all verification evidence are GREEN, the orchestrator may stage and commit the implementation-facing docs and artifact:

```bash
git add .agentic/specs/wave-6/stream-c.md EDITOR.md CLIENT_GUIDE.md dist/en-lightbox.js
git commit -m "docs(en): document page-load reference field"
```

The implementation agent performs neither command.

After this final Task-5 commit, the orchestrator—not the implementation agent—reruns the branch-wide audit and clean-tree check:

```bash
git diff --name-only 2481b9c...HEAD
git status --short
```

Expected: the first command contains exactly the nine allowed paths listed in Step 5, and the second command produces no output. This post-commit verification is orchestrator-owned and is not a command the implementation agent runs after returning its evidence packet.

## Plan self-check before handoff

- [ ] Spec coverage: Tasks 1-2 explicitly cover the exact client example `en_txn10` and the unrelated dotted name `DYNAMIC_FIELD` (`supporter.questions.848518`), proving arbitrary normalized names and no production hardcoding/default; they also cover the exact bare input, existing-input preservation, selector precedence, idempotence, no field-write/storage side effects, and outcome compatibility. Task 3 covers one retry, no loaded retry, cleanup, stale-field prevention, host DOM failures, and unchanged replay; Task 4 covers page-load timing, dynamic creation, outcome writing, native `FormData` serialization, and native submission; Task 5 covers docs, distribution, contracts, size, full suites, mutation proof, and separated working-tree versus branch-wide scope audits.
- [ ] Placeholder scan: no unfinished-marker text, unspecified test instruction, or undefined helper is present; every proposed helper has a signature, insertion point, implementation body, and test command.
- [ ] Type/signature consistency: `findENForm(): HTMLFormElement | null`, `ensureField(field: string): boolean`, and `ensureFieldOnLoad(field: string): () => void` are used consistently; the existing `installReferenceFieldListeners(...): () => void` interface is unchanged.
- [ ] Path/command check: every path matches the current repository; commands come from `package.json`, the contract registry, or the existing SDD scripts; snapshot diff follows `npm run contracts:generate`; the scope commands distinguish the pre-final-checkpoint working-tree audit from the final post-commit `git diff --name-only 2481b9c...HEAD` audit owned by the orchestrator.
- [ ] Scope check: no source logic outside `src/en/reference-field.ts`, no fixture change, no public export, no analytics change, no budget change, and no generated snapshot drift is planned.

## Acceptance / evidence packet

The coder must return one evidence packet containing:

1. RED evidence for the named immediate unit test using `CLIENT_FIELD` (`en_txn10`), the lifecycle tests, and the focused E2E test where the pre-build RED was run, including the failing test names and reasons.
2. GREEN Vitest counts for the focused reference-field file and full `npm test`, plus focused and full Playwright counts across the configured four projects; the unit-suite evidence must show the exact client example `en_txn10` and the unrelated dotted `DYNAMIC_FIELD` case, with `en_txn10` remaining test data only and never a production constant/default.
3. The mutation line `uninstallEagerEnsure = ensureFieldOnLoad(field)`, the named eager test’s RED result with that invocation bypassed, and the GREEN result after byte-exact restoration.
4. Typecheck, lint, build, exact contract snapshot-diff result, `python3 tools/sdd/check_contracts.py` result, measured gzip size against the 7400B budget, focused E2E result, full E2E result, and `git diff --check` result.
5. Separate pre-final-checkpoint scope evidence: `git status --short` plus the working-tree `git diff --name-only --diff-filter=ACMRTUXB`, which must list exactly the four Task-5 paths; and an implementation-only list matching exactly the seven paths listed in Task 5. The implementation agent returns this packet before the final Task-5 orchestrator checkpoint. After receiving it and committing Task 5, the orchestrator independently reruns `git diff --name-only 2481b9c...HEAD` and `git status --short`; the branch-wide result must contain exactly the two planning files plus those seven implementation paths, and the working tree must be clean. Include no unplanned fixture, snapshot, public API, analytics, or budget changes.
6. A LEARNINGS report only if the work reveals a genuinely novel durable invariant. Never manufacture an entry; follow `.agentic/AGENTS.md` and report a non-obvious lesson in the delivery notes when no durable-file change is warranted.
7. An explicit statement that the implementation agent performed no commit, push, branch, or worktree operation; all Git checkpoint commands were orchestrator-only instructions.
