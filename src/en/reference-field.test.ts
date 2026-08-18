import { afterEach, describe, expect, it, vi } from 'vitest'
import { isSafeReferenceFieldName, normalizeENConfig } from './config'
import { installReferenceFieldListeners } from './reference-field'

const FIELD = 'supporter.appealCode'

type FormFixture = {
  form: HTMLFormElement
  input?: HTMLInputElement
}

function appendEnField(form: HTMLFormElement, input: HTMLInputElement): void {
  const field = document.createElement('div')
  field.className = 'en__field'
  const element = document.createElement('div')
  element.className = 'en__field__element'
  element.appendChild(input)
  field.appendChild(element)
  form.appendChild(field)
}

function mountEnForm(existingField?: 'hidden' | 'visible'): FormFixture {
  const form = document.createElement('form')
  form.method = 'post'
  form.id = 'en-form'
  form.name = 'pb_test'
  form.action = '#'
  form.className = 'en__component en__component--page'

  const email = document.createElement('input')
  email.type = 'email'
  email.name = 'supporter.emailAddress'
  email.className = 'en__field__input en__field__input--email'
  email.required = true
  appendEnField(form, email)

  let input: HTMLInputElement | undefined
  if (existingField) {
    input = document.createElement('input')
    input.type = existingField
    input.name = FIELD
    if (existingField === 'hidden') {
      input.required = true
    } else {
      input.id = 'en__field_supporter_appealCode'
      input.className = 'en__field__input en__field__input--text'
    }
    appendEnField(form, input)
  }

  const submitWrapper = document.createElement('div')
  submitWrapper.className = 'en__submit'
  const submit = document.createElement('button')
  submit.type = 'submit'
  submit.textContent = 'Submit'
  submitWrapper.appendChild(submit)
  form.appendChild(submitWrapper)
  document.body.appendChild(form)

  return { form, input }
}

function mountLegacyEnForm(): FormFixture {
  const form = document.createElement('form')
  form.dataset.enComponent = 'form'
  const email = document.createElement('input')
  email.type = 'email'
  email.name = 'supporter.emailAddress'
  email.required = true
  form.appendChild(email)
  document.body.appendChild(form)
  return { form }
}

function dispatch(name: string, detail: object): void {
  document.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }))
}

function fieldInput(form: HTMLFormElement, field = FIELD): HTMLInputElement | null {
  return Array.from(form.querySelectorAll<HTMLInputElement>('input')).find((input) => input.name === field) ?? null
}

function setDocumentReadyState(value: DocumentReadyState): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(document, 'readyState')
  Object.defineProperty(document, 'readyState', { configurable: true, value })
  return () => {
    if (descriptor) {
      Object.defineProperty(document, 'readyState', descriptor)
    } else {
      Reflect.deleteProperty(document, 'readyState')
    }
  }
}

afterEach(() => {
  document.body.innerHTML = ''
  sessionStorage.clear()
})

describe('EN reference-field listener', () => {
  it('normalizes only safe configured field names and degrades malformed config', () => {
    expect(normalizeENConfig({ en: { referenceField: FIELD } })).toEqual({ referenceField: FIELD })
    expect(normalizeENConfig({ en: { referenceField: 'submit' } })).toEqual({})
    expect(normalizeENConfig({ en: { referenceField: 123 } })).toEqual({})
    expect(normalizeENConfig(null)).toEqual({})

    const throwingConfig = {}
    Object.defineProperty(throwingConfig, 'en', {
      get() {
        throw new Error('host getter failed')
      },
    })
    expect(() => normalizeENConfig(throwingConfig)).not.toThrow()
    expect(normalizeENConfig(throwingConfig)).toEqual({})

  })

  it('accepts safe dotted EN field names', () => {
    expect(isSafeReferenceFieldName(FIELD)).toBe(true)
    for (const field of [
      'supporter.appealCode',
      'supporter.questions.848518',
      'contact.subject',
      'supporter.phoneNumber2',
      'transaction.paycurrency',
      'supporter.submit',
      'supporter.action',
    ]) {
      expect(isSafeReferenceFieldName(field)).toBe(true)
      expect(normalizeENConfig({ en: { referenceField: field } })).toEqual({ referenceField: field })
    }
  })

  it.each([
    '',
    '.appealCode',
    'supporter.',
    'supporter..appealCode',
    'supporter appealCode',
    'supporter\tappealCode',
    'supporter.appeal-Code',
    'supporter.é',
    '1supporter',
    'bad"name',
    "bad'name",
    'bad<name>',
    'supporter[appealCode]',
    'supporter>appealCode',
    'supporter#appealCode',
    'supporter:appealCode',
    'supporter,appealCode',
    'submit',
    'action',
    'SUBMIT',
    'ACTION',
  ])('rejects hostile, malformed, or form-clobbering field name %s', (field) => {
    expect(isSafeReferenceFieldName(field)).toBe(false)
    expect(normalizeENConfig({ en: { referenceField: field } })).toEqual({})
  })

  it.each([undefined, null, 123, {}, []])('rejects non-string field names', (field) => {
    expect(() => isSafeReferenceFieldName(field)).not.toThrow()
    expect(isSafeReferenceFieldName(field)).toBe(false)
    expect(normalizeENConfig({ en: { referenceField: field } })).toEqual({})
  })

  it.each([
    'supporter.__proto__',
    '__proto__',
    'constructor',
    'supporter.constructor',
    'prototype',
  ])('rejects prototype-pollution field name %s', (field) => {
    expect(isSafeReferenceFieldName(field)).toBe(false)
    expect(normalizeENConfig({ en: { referenceField: field } })).toEqual({})
  })

  it('keeps the 128-character field-name limit', () => {
    expect(isSafeReferenceFieldName(`a${'b'.repeat(127)}`)).toBe(true)
    expect(isSafeReferenceFieldName(`a${'b'.repeat(128)}`)).toBe(false)
    expect(normalizeENConfig({ en: { referenceField: `a${'b'.repeat(128)}` } })).toEqual({})
  })

  it('creates a hidden optional field for a primary CTA and emits the exact write detail', () => {
    const { form } = mountEnForm()
    const writes: CustomEvent[] = []
    const onWrite = (event: Event) => writes.push(event as CustomEvent)
    document.addEventListener('enlb:field-write', onWrite)
    const uninstall = installReferenceFieldListeners({ referenceField: FIELD })

    dispatch('enlb:cta', { role: 'primary' })

    const input = fieldInput(form)
    expect(input).not.toBeNull()
    expect(input!.type).toBe('hidden')
    expect(input!.required).toBe(false)
    expect(input!.hasAttribute('required')).toBe(false)
    expect(input!.value).toBe('lightbox_accepted')
    expect(writes).toHaveLength(1)
    expect(writes[0].target).toBe(document)
    expect(writes[0].detail).toEqual({
      action: 'write',
      field: FIELD,
      value: 'lightbox_accepted',
    })

    uninstall()
    document.removeEventListener('enlb:field-write', onWrite)
  })

  it('keeps accepted when the close-action primary CTA is followed by cta-primary dismissal', () => {
    const { form } = mountEnForm()
    const writes: CustomEvent[] = []
    const onWrite = (event: Event) => writes.push(event as CustomEvent)
    document.addEventListener('enlb:field-write', onWrite)
    const uninstall = installReferenceFieldListeners({ referenceField: FIELD })

    dispatch('enlb:cta', { role: 'primary' })
    dispatch('enlb:dismiss', { reason: 'cta-primary' })

    expect(fieldInput(form)!.value).toBe('lightbox_accepted')
    expect(writes).toHaveLength(1)
    expect(writes[0].detail).toEqual({ action: 'write', field: FIELD, value: 'lightbox_accepted' })
    uninstall()
    document.removeEventListener('enlb:field-write', onWrite)
  })

  it.each(['close-button', 'esc', 'overlay', 'cta-secondary', 'cta-dismiss', 'api'] as const)(
    'writes declined for %s dismissal',
    (reason) => {
      const { form } = mountEnForm()
      const uninstall = installReferenceFieldListeners({ referenceField: FIELD })

      dispatch('enlb:dismiss', { reason })

      expect(fieldInput(form)!.value).toBe('lightbox_declined')
      uninstall()
    },
  )

  it('is fully inert when the reference field is not configured', () => {
    const { form } = mountEnForm()
    const addListener = vi.spyOn(document, 'addEventListener')
    const uninstall = installReferenceFieldListeners({})

    dispatch('enlb:cta', { role: 'primary' })
    dispatch('enlb:dismiss', { reason: 'api' })

    expect(fieldInput(form)).toBeNull()
    expect(sessionStorage.length).toBe(0)
    expect(addListener).not.toHaveBeenCalledWith('enlb:cta', expect.any(Function))
    expect(addListener).not.toHaveBeenCalledWith('enlb:dismiss', expect.any(Function))
    addListener.mockRestore()
    uninstall()
  })

  it.each([
    'bad"name',
    "bad'name",
    'bad<name>',
    'submit',
    'action',
  ])(
    'rejects hostile or form-clobbering field name %s',
    (field) => {
      const { form } = mountEnForm()
      const uninstall = installReferenceFieldListeners({ referenceField: field })

      dispatch('enlb:cta', { role: 'primary' })

      expect(form.querySelectorAll('input')).toHaveLength(1)
      expect(sessionStorage.length).toBe(0)
      uninstall()
    },
  )

  it('reuses an existing hidden input without changing its attributes', () => {
    const { form, input } = mountEnForm('hidden')
    const uninstall = installReferenceFieldListeners({ referenceField: FIELD })

    dispatch('enlb:cta', { role: 'primary' })
    dispatch('enlb:dismiss', { reason: 'api' })

    expect(form.querySelectorAll(`input[name="${FIELD}"]`)).toHaveLength(1)
    expect(fieldInput(form)).toBe(input)
    expect(input!.value).toBe('lightbox_declined')
    expect(input!.type).toBe('hidden')
    expect(input!.required).toBe(true)
    expect(input!.hasAttribute('required')).toBe(true)
    uninstall()
  })

  it('writes an existing visible input without changing its attributes or duplicating it', () => {
    const { form, input } = mountEnForm('visible')
    const visible = input!
    visible.required = true
    visible.setAttribute('aria-describedby', 'appeal-code-help')
    const uninstall = installReferenceFieldListeners({ referenceField: FIELD })

    dispatch('enlb:cta', { role: 'primary' })

    expect(visible.type).toBe('text')
    expect(visible.value).toBe('lightbox_accepted')
    expect(visible.required).toBe(true)
    expect(visible.hasAttribute('required')).toBe(true)
    expect(visible.id).toBe('en__field_supporter_appealCode')
    expect(visible.className).toBe('en__field__input en__field__input--text')
    expect(visible.getAttribute('aria-describedby')).toBe('appeal-code-help')
    expect(form.querySelectorAll(`input[name="${FIELD}"]`)).toHaveLength(1)
    uninstall()
  })

  it('writes the first matching input in DOM order', () => {
    const { form, input } = mountEnForm('visible')
    const first = input!
    const second = document.createElement('input')
    second.type = 'hidden'
    second.name = FIELD
    form.appendChild(second)
    const uninstall = installReferenceFieldListeners({ referenceField: FIELD })

    dispatch('enlb:cta', { role: 'primary' })

    expect(first.value).toBe('lightbox_accepted')
    expect(second.value).toBe('')
    uninstall()
  })

  it('detects a real EN page-builder form before an earlier legacy fallback form', () => {
    const legacy = mountLegacyEnForm()
    const { form } = mountEnForm()
    const uninstall = installReferenceFieldListeners({ referenceField: FIELD })

    dispatch('enlb:cta', { role: 'primary' })

    expect(fieldInput(form)?.value).toBe('lightbox_accepted')
    expect(fieldInput(legacy.form)).toBeNull()
    uninstall()
  })

  it('uses the legacy EN form fallback when a page-builder form is absent', () => {
    const { form } = mountLegacyEnForm()
    const uninstall = installReferenceFieldListeners({ referenceField: FIELD })

    dispatch('enlb:cta', { role: 'primary' })

    expect(fieldInput(form)?.value).toBe('lightbox_accepted')
    uninstall()
  })

  it('does not throw or create a field when no EN form exists', () => {
    const uninstall = installReferenceFieldListeners({ referenceField: FIELD })

    expect(() => dispatch('enlb:dismiss', { reason: 'api' })).not.toThrow()
    expect(document.querySelector(`input[name="${FIELD}"]`)).toBeNull()
    expect(sessionStorage.length).toBe(0)
    uninstall()
  })

  it('replays the last write on a destination page, emits replay detail, and clears storage', () => {
    const writes: CustomEvent[] = []
    const onWrite = (event: Event) => writes.push(event as CustomEvent)
    document.addEventListener('enlb:field-write', onWrite)
    const source = mountEnForm()
    const uninstallSource = installReferenceFieldListeners({ referenceField: FIELD })

    dispatch('enlb:cta', { role: 'primary' })
    dispatch('enlb:dismiss', { reason: 'api' })
    expect(fieldInput(source.form)!.value).toBe('lightbox_declined')
    uninstallSource()
    document.body.innerHTML = ''

    const destination = mountEnForm()
    const uninstallDestination = installReferenceFieldListeners({ referenceField: FIELD })

    expect(fieldInput(destination.form)!.value).toBe('lightbox_declined')
    expect(writes[writes.length - 1]?.detail).toEqual({
      action: 'replay',
      field: FIELD,
      value: 'lightbox_declined',
    })
    expect(sessionStorage.length).toBe(0)

    uninstallDestination()
    document.removeEventListener('enlb:field-write', onWrite)
  })

  it('defers pending replay until DOMContentLoaded, then writes, emits replay, and clears storage', () => {
    const restoreReadyState = setDocumentReadyState('loading')
    const writes: CustomEvent[] = []
    const onWrite = (event: Event) => writes.push(event as CustomEvent)
    document.addEventListener('enlb:field-write', onWrite)
    sessionStorage.setItem('enlb:reference-field', JSON.stringify({ field: FIELD, value: 'lightbox_accepted' }))
    let uninstall: (() => void) | undefined

    try {
      uninstall = installReferenceFieldListeners({ referenceField: FIELD })
      const destination = mountEnForm()

      expect(fieldInput(destination.form)).toBeNull()
      expect(writes).toHaveLength(0)
      expect(sessionStorage.getItem('enlb:reference-field')).not.toBeNull()

      Object.defineProperty(document, 'readyState', { configurable: true, value: 'interactive' })
      document.dispatchEvent(new Event('DOMContentLoaded'))

      expect(fieldInput(destination.form)?.value).toBe('lightbox_accepted')
      expect(writes).toHaveLength(1)
      expect(writes[0].detail).toEqual({ action: 'replay', field: FIELD, value: 'lightbox_accepted' })
      expect(sessionStorage.getItem('enlb:reference-field')).toBeNull()
    } finally {
      uninstall?.()
      document.removeEventListener('enlb:field-write', onWrite)
      restoreReadyState()
    }
  })

  it('keeps pending carry-over when the form is still absent at DOMContentLoaded', () => {
    const restoreReadyState = setDocumentReadyState('loading')
    const pending = JSON.stringify({ field: FIELD, value: 'lightbox_declined' })
    sessionStorage.setItem('enlb:reference-field', pending)
    let uninstall: (() => void) | undefined

    try {
      uninstall = installReferenceFieldListeners({ referenceField: FIELD })

      Object.defineProperty(document, 'readyState', { configurable: true, value: 'interactive' })
      expect(() => document.dispatchEvent(new Event('DOMContentLoaded'))).not.toThrow()

      expect(sessionStorage.getItem('enlb:reference-field')).toBe(pending)
    } finally {
      uninstall?.()
      restoreReadyState()
    }
  })

  it('uses the last interaction when multiple outcomes are stored before replay', () => {
    const form = mountEnForm()
    const uninstall = installReferenceFieldListeners({ referenceField: FIELD })

    dispatch('enlb:cta', { role: 'primary' })
    dispatch('enlb:dismiss', { reason: 'api' })
    dispatch('enlb:cta', { role: 'primary' })

    expect(fieldInput(form.form)!.value).toBe('lightbox_accepted')
    uninstall()
    document.body.innerHTML = ''

    const destination = mountEnForm()
    const replayUninstall = installReferenceFieldListeners({ referenceField: FIELD })
    expect(fieldInput(destination.form)!.value).toBe('lightbox_accepted')
    replayUninstall()
  })
})
