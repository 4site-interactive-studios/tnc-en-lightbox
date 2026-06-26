import { describe, it, expect, afterEach, vi } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
  window.scrollTo = () => undefined
  localStorage.clear()
})

function mountEnForm(): { form: HTMLFormElement; submitHandler: ReturnType<typeof vi.fn> } {
  const form = document.createElement('form')
  form.className = 'en-form'
  form.dataset.enComponent = 'form'
  form.noValidate = true

  const email = document.createElement('input')
  email.type = 'email'
  email.name = 'email'
  email.required = true

  const name = document.createElement('input')
  name.type = 'text'
  name.name = 'name'
  name.required = true

  const submit = document.createElement('button')
  submit.type = 'submit'
  submit.textContent = 'Submit'

  form.appendChild(email)
  form.appendChild(name)
  form.appendChild(submit)
  document.body.appendChild(form)

  const submitHandler = vi.fn((e: Event) => {
    e.preventDefault()
  })
  form.addEventListener('submit', submitHandler)

  return { form, submitHandler }
}

function assertFormFunctional(form: HTMLFormElement, submitHandler: ReturnType<typeof vi.fn>): void {
  const email = form.querySelector('input[name="email"]') as HTMLInputElement
  email.focus()
  expect(document.activeElement).toBe(email)

  email.value = 'test@example.com'
  const name = form.querySelector('input[name="name"]') as HTMLInputElement
  name.value = 'Test'
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  expect(submitHandler).toHaveBeenCalled()
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

describe('EN form non-interference', () => {
  it('does not break an EN-shaped form when the lightbox is never opened', () => {
    const { form, submitHandler } = mountEnForm()
    assertFormFunctional(form, submitHandler)
    assertFormRestored(form)
  })

  it('isolates the EN form while open and fully restores it after close via X button', () => {
    const { form, submitHandler } = mountEnForm()
    const trigger = document.createElement('button')
    trigger.textContent = 'Open'
    document.body.appendChild(trigger)
    trigger.focus()

    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B', cta: { label: 'Close', action: 'close' } }))
    lb.open()

    assertFormIsolated(form)
    expect(document.body.style.overflow).toBe('hidden')

    ;(document.querySelector('.enlb-close') as HTMLElement).click()

    assertFormRestored(form)
    expect(document.activeElement).toBe(trigger)
    expect(document.body.style.overflow).toBe('')
    assertFormFunctional(form, submitHandler)
  })

  it('isolates the EN form while open and fully restores it after close via close CTA', () => {
    const { form, submitHandler } = mountEnForm()
    const trigger = document.createElement('button')
    trigger.textContent = 'Open'
    document.body.appendChild(trigger)
    trigger.focus()

    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B', cta: { label: 'Close', action: 'close' } }))
    lb.open()

    assertFormIsolated(form)

    ;(document.querySelector('.enlb-cta') as HTMLElement).click()

    assertFormRestored(form)
    expect(document.activeElement).toBe(trigger)
    assertFormFunctional(form, submitHandler)
  })

  it('leaves the EN form isolated while a redirect CTA is clicked', () => {
    const { form, submitHandler } = mountEnForm()
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', cta: { label: 'Go', href: '#go', action: 'redirect' } }),
    )
    lb.open()

    assertFormIsolated(form)
    const cta = document.querySelector('.enlb-cta') as HTMLElement
    expect(cta.tagName).toBe('A')
    expect(cta.getAttribute('href')).toBe('#go')
    cta.click()

    expect(document.querySelector('.enlb-overlay')).not.toBeNull()
    assertFormIsolated(form)
    submitHandler.mockClear()
    assertFormFunctional(form, submitHandler)
  })

  it('does not orphan aria-hidden attributes on the EN form after multiple open/close cycles', () => {
    const { form } = mountEnForm()
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B', cta: { label: 'Close', action: 'close' } }))

    lb.open()
    lb.close()
    lb.open()
    lb.close()

    assertFormRestored(form)
    expect(form.hasAttribute('aria-hidden')).toBe(false)
  })
})
