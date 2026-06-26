import { describe, it, expect, afterEach } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'
import { sq } from './shadow-test-helpers'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.body.removeAttribute('aria-hidden')
  document.body.removeAttribute('inert')
  document.body.removeAttribute('tabindex')
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
  window.scrollTo = () => undefined
  localStorage.clear()
})

function mountEnForm(options?: { preExistingAttrs?: boolean }): {
  form: HTMLFormElement
  lastSubmit: { event: Event | null }
} {
  const form = document.createElement('form')
  form.className = 'en-form'
  form.dataset.enComponent = 'form'
  form.action = 'javascript:void(0)'

  const email = document.createElement('input')
  email.type = 'email'
  email.name = 'email'
  email.required = true

  const name = document.createElement('input')
  name.type = 'text'
  name.name = 'name'
  name.required = true

  if (options?.preExistingAttrs) {
    email.setAttribute('aria-hidden', 'true')
    email.setAttribute('tabindex', '0')
  }

  const submit = document.createElement('button')
  submit.type = 'submit'
  submit.textContent = 'Submit'

  form.appendChild(email)
  form.appendChild(name)
  form.appendChild(submit)
  document.body.appendChild(form)

  const lastSubmit: { event: Event | null } = { event: null }
  form.addEventListener('submit', (e) => {
    lastSubmit.event = e
  })

  return { form, lastSubmit }
}

function assertFormInvalid(form: HTMLFormElement): void {
  const email = form.querySelector('input[name="email"]') as HTMLInputElement
  const name = form.querySelector('input[name="name"]') as HTMLInputElement
  email.value = ''
  name.value = ''
  expect(form.checkValidity()).toBe(false)
}

function assertFormValid(form: HTMLFormElement): void {
  const email = form.querySelector('input[name="email"]') as HTMLInputElement
  const name = form.querySelector('input[name="name"]') as HTMLInputElement
  email.value = 'test@example.com'
  name.value = 'Test'
  expect(form.checkValidity()).toBe(true)
}

function assertFormSubmits(form: HTMLFormElement, lastSubmit: { event: Event | null }): void {
  const email = form.querySelector('input[name="email"]') as HTMLInputElement
  const name = form.querySelector('input[name="name"]') as HTMLInputElement
  email.value = 'test@example.com'
  name.value = 'Test'
  lastSubmit.event = null

  form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }))

  expect(lastSubmit.event).not.toBeNull()
  expect(lastSubmit.event!.defaultPrevented).toBe(false)
}

function assertFormFocusable(form: HTMLFormElement): void {
  const email = form.querySelector('input[name="email"]') as HTMLInputElement
  email.focus()
  expect(document.activeElement).toBe(email)
}

function assertFormRestored(form: HTMLFormElement): void {
  expect(form.hasAttribute('inert')).toBe(false)
  expect(form.getAttribute('aria-hidden')).toBeNull()
  expect(form.getAttribute('tabindex')).toBeNull()
}

function assertFormIsolated(form: HTMLFormElement): void {
  expect(form.hasAttribute('inert')).toBe(true)
  expect(form.getAttribute('aria-hidden')).toBe('true')
  expect(form.getAttribute('tabindex')).toBe('-1')
}

function assertPreExistingAttributesRestored(form: HTMLFormElement): void {
  const email = form.querySelector('input[name="email"]') as HTMLElement
  expect(email.getAttribute('aria-hidden')).toBe('true')
  expect(email.getAttribute('tabindex')).toBe('0')
}

function openLightboxWithCta(config: { cta?: { label: string; action?: 'redirect' | 'close'; href?: string } }): void {
  new Lightbox(
    normalizeConfig({
      header: 'H',
      body: 'B',
      cta: config.cta,
    }),
  ).open()
}

describe('EN form non-interference', () => {
  it('does not break an EN-shaped form when the lightbox is never opened', () => {
    const { form, lastSubmit } = mountEnForm()
    assertFormInvalid(form)
    assertFormValid(form)
    assertFormFocusable(form)
    assertFormSubmits(form, lastSubmit)
    assertFormRestored(form)
  })

  it('isolates the EN form while open and fully restores it after close via X button', () => {
    const { form, lastSubmit } = mountEnForm()
    const trigger = document.createElement('button')
    trigger.textContent = 'Open'
    document.body.appendChild(trigger)
    trigger.focus()

    openLightboxWithCta({ cta: { label: 'Close', action: 'close' } })

    assertFormIsolated(form)
    expect(document.body.style.overflow).toBe('hidden')

    ;(sq('.enlb-close') as HTMLElement).click()

    assertFormRestored(form)
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger)
    assertFormInvalid(form)
    assertFormValid(form)
    assertFormFocusable(form)
    assertFormSubmits(form, lastSubmit)
  })

  it('isolates the EN form while open and fully restores it after close via close CTA', () => {
    const { form, lastSubmit } = mountEnForm()
    const trigger = document.createElement('button')
    trigger.textContent = 'Open'
    document.body.appendChild(trigger)
    trigger.focus()

    openLightboxWithCta({ cta: { label: 'Close', action: 'close' } })

    assertFormIsolated(form)

    ;(sq('.enlb-cta') as HTMLElement).click()

    assertFormRestored(form)
    expect(document.activeElement).toBe(trigger)
    assertFormInvalid(form)
    assertFormValid(form)
    assertFormFocusable(form)
    assertFormSubmits(form, lastSubmit)
  })

  it('keeps the EN form isolated after a redirect CTA click; form works after closing', () => {
    const { form, lastSubmit } = mountEnForm()
    const trigger = document.createElement('button')
    trigger.textContent = 'Open'
    document.body.appendChild(trigger)
    trigger.focus()

    openLightboxWithCta({ cta: { label: 'Go', href: '#go', action: 'redirect' } })

    assertFormIsolated(form)
    const cta = sq('.enlb-cta') as HTMLElement
    expect(cta.tagName).toBe('A')
    expect(cta.getAttribute('href')).toBe('#go')
    cta.click()

    expect(sq('.enlb-overlay')).not.toBeNull()
    assertFormIsolated(form)

    ;(sq('.enlb-close') as HTMLElement).click()

    assertFormRestored(form)
    expect(document.activeElement).toBe(trigger)
    assertFormSubmits(form, lastSubmit)
    assertFormValid(form)
    assertFormFocusable(form)
  })

  it('restores pre-existing aria-hidden and tabindex on the EN form after close', () => {
    const { form } = mountEnForm({ preExistingAttrs: true })
    assertPreExistingAttributesRestored(form)

    openLightboxWithCta({ cta: { label: 'Close', action: 'close' } })
    assertFormIsolated(form)

    ;(sq('.enlb-close') as HTMLElement).click()

    assertFormRestored(form)
    assertPreExistingAttributesRestored(form)
  })

  it('does not orphan isolation attributes on the EN form after multiple open/close cycles', () => {
    const { form } = mountEnForm()
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', cta: { label: 'Close', action: 'close' } }),
    )
    lb.open()
    lb.close()
    lb.open()
    lb.close()

    assertFormRestored(form)
    expect(form.hasAttribute('aria-hidden')).toBe(false)
  })
})
