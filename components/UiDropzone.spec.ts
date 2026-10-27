import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import UiDropzone from './UiDropzone.vue'
import UiField from './UiField.vue'
import UiListItem from './UiListItem.vue'
import UiTruncate from './UiTruncate.vue'
import { focusInvalid } from '../utils/focusInvalid'
import { RUSSIAN, withGrani } from '../test/harness'

// A fixed lastModified: the same file twice must look the same, as it does from the OS.
const file = (name: string, size = 1024, type = 'application/pdf') =>
  new File([new Uint8Array(size)], name, { type, lastModified: 1_700_000_000_000 })
const base = { modelValue: [] as File[], ariaLabel: 'Statement' }

const input = (w: ReturnType<typeof mount>) => w.find('input[type=file]')
const drop = async (w: ReturnType<typeof mount>, files: File[]) => {
  const zone = w.find('.border-dashed')
  const ev = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent
  Object.defineProperty(ev, 'dataTransfer', { value: { files } })
  zone.element.dispatchEvent(ev)
  await w.vm.$nextTick()
}
const choose = async (w: ReturnType<typeof mount>, files: File[]) => {
  const el = input(w).element as HTMLInputElement
  Object.defineProperty(el, 'files', { value: files, configurable: true, writable: true })
  await input(w).trigger('change')
}

let mounted: ReturnType<typeof mount>[] = []
afterEach(() => {
  for (const w of mounted) w.unmount()
  mounted = []
})
const mountZone = (props: Record<string, unknown> = {}, plugins = withGrani()) => {
  const w = mount(UiDropzone, {
    props: { ...base, ...props },
    attachTo: document.body,
    global: { plugins },
  })
  mounted.push(w)
  return w
}

describe('UiDropzone — choosing', () => {
  it('the browse button opens the native input; a chosen file lands in the model', async () => {
    const w = mountZone()
    let clicked = false
    ;(input(w).element as HTMLInputElement).click = () => {
      clicked = true
    }
    await w.find('button').trigger('click')
    expect(clicked).toBe(true)
    await choose(w, [file('a.pdf')])
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toHaveLength(1)
  })

  it('a drop lands in the model too, and the drag state clears', async () => {
    const w = mountZone()
    await drop(w, [file('a.pdf')])
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toHaveLength(1)
    expect(w.find('[data-dragging]').exists()).toBe(false)
  })

  it('without multiple a new file replaces the old one; with multiple it is added', async () => {
    const one = mountZone({ modelValue: [file('a.pdf')] })
    await drop(one, [file('b.pdf')])
    expect((one.emitted('update:modelValue')![0]![0] as File[]).map((f) => f.name)).toEqual([
      'b.pdf',
    ])
    const many = mountZone({ modelValue: [file('a.pdf')], multiple: true })
    await drop(many, [file('b.pdf'), file('c.pdf')])
    expect((many.emitted('update:modelValue')![0]![0] as File[]).map((f) => f.name)).toEqual([
      'a.pdf',
      'b.pdf',
      'c.pdf',
    ])
  })

  it('lists the chosen files with their size and a remove button', async () => {
    const w = mountZone({ modelValue: [file('report.pdf', 2 * 1024 * 1024)] })
    expect(w.find('[role=listitem]').text()).toContain('report.pdf')
    expect(w.find('[role=listitem]').text()).toContain('2 MB')
    await w.find('[role=listitem] button').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[[]]])
  })
})

describe('UiDropzone — refusing', () => {
  it('refuses a wrong type, says so, and emits reject with the reason', async () => {
    const w = mountZone({ accept: 'application/pdf,.pdf' })
    await drop(w, [file('photo.png', 10, 'image/png')])
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('reject')?.[0]?.[0]).toMatchObject([{ reason: 'type' }])
    expect(w.find('[role=alert]').text()).toBe('photo.png: unsupported file type.')
    expect(w.find('button').attributes('aria-describedby')).toBe(
      w.find('[role=alert]').attributes('id'),
    )
  })

  it('accept understands a family and an extension', async () => {
    const w = mountZone({ accept: 'image/*,.pdf', multiple: true })
    await drop(w, [
      file('a.png', 10, 'image/png'),
      file('b.PDF', 10, ''),
      file('c.txt', 10, 'text/plain'),
    ])
    expect((w.emitted('update:modelValue')![0]![0] as File[]).map((f) => f.name)).toEqual([
      'a.png',
      'b.PDF',
    ])
    expect(w.emitted('reject')?.[0]?.[0]).toMatchObject([{ reason: 'type' }])
  })

  it('refuses a file over maxSize with the limit in the message', async () => {
    const w = mountZone({ maxSize: 1024 * 1024 })
    await drop(w, [file('big.pdf', 2 * 1024 * 1024)])
    expect(w.emitted('reject')?.[0]?.[0]).toMatchObject([{ reason: 'size' }])
    expect(w.find('[role=alert]').text()).toBe('big.pdf: exceeds the 1 MB file size limit.')
  })

  it('refuses files beyond maxFiles and keeps the ones that fit', async () => {
    const w = mountZone({ multiple: true, maxFiles: 2, modelValue: [file('a.pdf')] })
    await drop(w, [file('b.pdf'), file('c.pdf')])
    expect((w.emitted('update:modelValue')![0]![0] as File[]).map((f) => f.name)).toEqual([
      'a.pdf',
      'b.pdf',
    ])
    expect(w.emitted('reject')?.[0]?.[0]).toMatchObject([{ reason: 'count' }])
    expect(w.find('[role=alert]').text()).toBe('c.pdf: up to 2 files.')
  })

  it('the hint shows the size limit by default', () => {
    expect(mountZone({ maxSize: 30 * 1024 * 1024 }).text()).toContain('Maximum file size: 30 MB')
  })
})

describe('UiDropzone — states', () => {
  it('disabled: the plate, an inert button and no drop', async () => {
    const w = mountZone({ disabled: true, modelValue: [file('a.pdf')] })
    expect(w.find('.border-dashed').classes()).toContain('bg-border-strong/40')
    expect((w.find('.border-dashed button').element as HTMLButtonElement).disabled).toBe(true)
    await drop(w, [file('b.pdf')])
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.find('.border-dashed').classes().join(' ')).not.toMatch(/opacity/)
  })

  it('busy: the row carries the upload, Browse refuses but holds, the drop is ignored, removing waits', async () => {
    const w = mountZone({ busy: true, progress: 40, modelValue: [file('a.pdf')] })
    const row = w.find('[role=listitem]')
    expect(row.find('[role=progressbar]').attributes('aria-valuenow')).toBe('40')
    expect(row.text()).toContain('40%')
    expect(row.find('[aria-hidden=true][style*="width: 40%"]').exists()).toBe(true)
    expect(row.find('[data-remove]').exists()).toBe(false)
    expect(row.find('[data-cancel]').attributes('aria-label')).toBe('Cancel the upload')
    const browse = w.find('.border-dashed button')
    expect(browse.attributes('aria-disabled')).toBe('true')
    expect((browse.element as HTMLButtonElement).disabled).toBe(false)
    expect(browse.find('[role=status], .animate-spin').exists()).toBe(false)
    expect(w.find('.border-dashed [role=progressbar]').exists()).toBe(false)
    await drop(w, [file('b.pdf')])
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(mountZone().find('[role=progressbar]').exists()).toBe(false)
  })

  it('folded, the one line carries the upload; each pending row names its file', async () => {
    const files = ['a', 'b', 'c', 'd'].map((n) => file(`${n}.pdf`))
    const w = mountZone({ busy: true, progress: 30, multiple: true, modelValue: files })
    const line = w.find('[aria-expanded]')
    expect(line.find('[role=progressbar]').attributes('aria-valuenow')).toBe('30')
    expect(line.text()).toContain('30%')
    await line.trigger('click')
    expect(line.find('[role=progressbar]').exists()).toBe(false)
    const names = w
      .findAll('[role=listitem] [role=progressbar]')
      .map((b) => b.attributes('aria-label'))
    expect(names).toEqual([
      'Uploading a.pdf',
      'Uploading b.pdf',
      'Uploading c.pdf',
      'Uploading d.pdf',
    ])
  })

  it('the cross of an uploading row cancels the upload', async () => {
    const w = mountZone({ busy: true, progress: 40, modelValue: [file('a.pdf')] })
    await w.find('[data-cancel]').trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('a failed upload marks the files it left with the reason and a Retry', async () => {
    const w = mountZone({ failed: 'The connection dropped.', modelValue: [file('a.pdf')] })
    const row = w.find('[role=listitem]')
    expect(row.text()).toContain('The connection dropped.')
    await row.find('[data-retry]').trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    expect(row.find('[data-remove]').exists()).toBe(true)
    expect(mountZone({ failed: true, modelValue: [file('b.pdf')] }).text()).toContain(
      'Not uploaded',
    )
    const running = mountZone({ failed: true, busy: true, modelValue: [file('c.pdf')] })
    expect(running.find('[data-retry]').exists()).toBe(false)
  })

  it('a failure is said in the status region once the upload stops', async () => {
    const w = mountZone({ busy: true, modelValue: [file('a.pdf')] })
    await w.setProps({ busy: false, failed: 'The connection dropped.' })
    await vi.waitFor(() => expect(w.find('[role=status]').text()).toBe('The connection dropped.'))
  })

  it('two quick presses on cancel or Retry ask once, until the app answers', async () => {
    const w = mountZone({ busy: true, progress: 40, modelValue: [file('a.pdf')] })
    const cross = w.find('[data-cancel]')
    await cross.trigger('click')
    await cross.trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
    await w.setProps({ busy: false, failed: 'Lost.' })
    const retry = w.find('[data-retry]')
    await retry.trigger('click')
    await retry.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    await w.setProps({ busy: true, failed: false })
    await w.setProps({ busy: false, failed: 'Lost again.' })
    await w.find('[data-retry]').trigger('click')
    expect(w.emitted('retry')).toHaveLength(2)
  })

  it('a failed row drops its size, so the reason has the room', async () => {
    const a = file('a.pdf', 2048)
    const w = mountZone({ multiple: true, failed: 'The connection dropped.', modelValue: [a] })
    await w.setProps({ modelValue: [a, file('b.pdf', 2048)] })
    const rows = w.findAll('[role=listitem]')
    expect(rows[0]!.text()).not.toContain('2 KB')
    expect(rows[1]!.text()).toContain('2 KB')
  })

  it('a file added after a failure is a new file, not a failed one', async () => {
    const a = file('a.pdf')
    const w = mountZone({ multiple: true, failed: 'Lost.', modelValue: [a] })
    await w.setProps({ modelValue: [a, file('b.pdf')] })
    const rows = w.findAll('[role=listitem]')
    expect(rows[0]!.find('[data-retry]').exists()).toBe(true)
    expect(rows[1]!.find('[data-retry]').exists()).toBe(false)
    expect(rows[1]!.text()).not.toContain('Lost.')
  })

  it('a cancel the app answers is said in the status region', async () => {
    const w = mountZone({ busy: true, modelValue: [file('a.pdf')] })
    await w.find('[data-cancel]').trigger('click')
    await w.setProps({ busy: false })
    await vi.waitFor(() => expect(w.find('[role=status]').text()).toBe('Upload cancelled'))
  })

  it('busy with no percent spins on the row and fills nothing; with no row the bar runs in the zone', () => {
    const w = mountZone({ busy: true, modelValue: [file('a.pdf')] })
    const row = w.find('[role=listitem]')
    expect(row.findComponent({ name: 'UiSpinner' }).exists()).toBe(true)
    expect(row.find('[style*="width"]').exists()).toBe(false)
    expect(
      mountZone({ busy: true })
        .find('.border-dashed')
        .findComponent({ name: 'UiProgress' })
        .exists(),
    ).toBe(true)
  })

  it('the upload is said by a live region that is in the DOM before it starts', async () => {
    // A named spinner mounted with the busy state was often skipped by VoiceOver and NVDA.
    const w = mountZone()
    const status = w.find('[role=status]')
    expect(status.exists()).toBe(true)
    expect(status.text()).toBe('')
    await w.setProps({ busy: true })
    expect(w.find('[role=status]').element).toBe(status.element)
    expect(status.text()).toBe('Uploading…')
    expect(w.findAll('[role=status]')).toHaveLength(1)
  })

  it('after a finished upload the row shows a check and no remove, unless removable says so', () => {
    const done = mountZone({ progress: 100, modelValue: [file('a.pdf')] })
    expect(done.find('[role=listitem] button').exists()).toBe(false)
    expect(done.find('[role=listitem] svg').classes()).toContain('text-success')
    expect(
      mountZone({ progress: 100, removable: true, modelValue: [file('a.pdf')] })
        .find('[role=listitem] button')
        .exists(),
    ).toBe(true)
    expect(
      mountZone({ modelValue: [file('a.pdf')] })
        .find('[role=listitem] button')
        .exists(),
    ).toBe(true)
  })

  it('past three files the list folds into one line and unfolds on click', async () => {
    const files = ['a', 'b', 'c', 'd', 'e'].map((n) => file(`${n}.pdf`, 1024 * 1024))
    const w = mountZone({ multiple: true, modelValue: files })
    expect(w.findAll('[role=listitem]')).toHaveLength(0)
    const summary = w.find('[aria-expanded]')
    expect(summary.text()).toContain('5 files')
    expect(summary.text()).toContain('5 MB')
    await summary.trigger('click')
    expect(w.findAll('[role=listitem]')).toHaveLength(5)
    expect(
      mountZone({ multiple: true, modelValue: files.slice(0, 3) }).findAll('[role=listitem]'),
    ).toHaveLength(3)
  })

  it('invalid: red dashed border and aria-invalid on the button', () => {
    const w = mountZone({ invalid: true })
    expect(w.find('.border-dashed').classes()).toContain('border-danger-border')
    expect(w.find('.border-dashed button').attributes('aria-invalid')).toBe('true')
  })

  it('dragging over marks the zone; leaving clears it', async () => {
    const w = mountZone()
    await w.find('.border-dashed').trigger('dragenter', { dataTransfer: { types: ['Files'] } })
    expect(w.find('[data-dragging]').exists()).toBe(true)
    await w.find('.border-dashed').trigger('dragleave')
    expect(w.find('[data-dragging]').exists()).toBe(false)
  })
})

describe('UiDropzone — review follow-ups', () => {
  it('a drop anywhere on the card lands, not only on the dashed field', async () => {
    const w = mountZone({ multiple: true, modelValue: [file('a.pdf')] })
    const ev = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent
    Object.defineProperty(ev, 'dataTransfer', { value: { files: [file('b.pdf')] } })
    w.find('[role=listitem]').element.dispatchEvent(ev)
    await w.vm.$nextTick()
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toHaveLength(2)
    expect(ev.defaultPrevented).toBe(true)
  })

  it('the same file twice is refused as a duplicate', async () => {
    const w = mountZone({ multiple: true, modelValue: [file('a.pdf')] })
    await drop(w, [file('a.pdf')])
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('reject')?.[0]?.[0]).toMatchObject([{ reason: 'duplicate' }])
    expect(w.find('[role=alert]').text()).toBe('a.pdf: already in the list.')
  })

  it('every reason of a mixed batch is told', async () => {
    const w = mountZone({ multiple: true, accept: '.pdf', maxSize: 1024 })
    await drop(w, [file('x.png', 10, 'image/png'), file('big.pdf', 4096)])
    expect(w.find('[role=alert]').text()).toBe(
      'x.png: unsupported file type. big.pdf: exceeds the 1 KB file size limit.',
    )
  })

  it('counts are pluralized: one file at a time; an empty file is 0 KB', async () => {
    const w = mountZone({ maxSize: 1024 })
    await drop(w, [file('a.pdf', 10), file('b.pdf', 10)])
    expect(w.find('[role=alert]').text()).toBe('b.pdf: one file at a time.')
    expect(
      mountZone({ modelValue: [file('a.pdf', 0)] })
        .find('[role=listitem]')
        .text(),
    ).toContain('0 KB')
  })

  it('the fold button follows disabled', () => {
    const files = ['a', 'b', 'c', 'd'].map((n) => file(`${n}.pdf`))
    const w = mountZone({ multiple: true, disabled: true, modelValue: files })
    expect((w.find('[aria-expanded]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('Browse keeps the focus while busy', async () => {
    const w = mountZone()
    const browse = w.find('.border-dashed button').element as HTMLButtonElement
    browse.focus()
    await w.setProps({ busy: true })
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(w.find('.border-dashed button').element)
  })
})

describe('UiDropzone — inside UiField', () => {
  const Form = defineComponent({
    setup() {
      return () =>
        h(UiField, { label: 'Statement', required: true, error: 'Choose a file' }, () =>
          h(UiDropzone, { modelValue: [] }),
        )
    },
  })

  it('the field labels the browse button and describes it with the error', () => {
    const w = mount(Form)
    const button = w.find('button')
    expect(w.find('label').attributes('for')).toBe(button.attributes('id'))
    expect(button.attributes('aria-invalid')).toBe('true')
    const described = button.attributes('aria-describedby')!.split(' ')
    expect(described[0]).toBe(w.find('[role=alert]').attributes('id'))
    expect(w.find(`#${described[1]}`).text()).toBe('required')
  })
})

describe('UiDropzone — review follow-ups', () => {
  it('inside a field the browse button keeps its own word in its name and carries no aria-required', () => {
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(UiField, { label: 'Statement', required: true }, () =>
            h(UiDropzone, { modelValue: [] }),
          ),
      }),
    )
    const button = w.find('button')
    const [label, word] = button.attributes('aria-labelledby')!.split(' ')
    expect(w.find(`[id="${label}"]`).text()).toContain('Statement')
    expect(w.find(`[id="${word}"]`).text()).toBe('Choose a file')
    expect(button.attributes('aria-required')).toBeUndefined()
  })
})

describe('UiDropzone — review follow-ups', () => {
  const Host = defineComponent({
    props: { files: { type: Array, required: true } },
    setup(p) {
      const model = ref(p.files as File[])
      return () =>
        h(UiDropzone, {
          modelValue: model.value,
          multiple: true,
          ariaLabel: 'Files',
          'onUpdate:modelValue': (v: File[]) => (model.value = v),
        })
    },
  })

  it('removing a file with the keyboard keeps the focus inside the card', async () => {
    const w = mount(Host, {
      props: { files: [file('a.pdf'), file('b.pdf')] },
      attachTo: document.body,
    })
    mounted.push(w)
    const first = w.find('[data-remove]')
    ;(first.element as HTMLElement).focus()
    await first.trigger('click')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(w.find('[data-remove]').element)
    await w.find('[data-remove]').trigger('click')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(document.activeElement?.textContent).toBe('Choose files')
  })

  it('a refused pick leaves the native input holding the model', async () => {
    const w = mountZone({ accept: '.pdf', modelValue: [file('a.pdf')] })
    const el = input(w).element as HTMLInputElement
    const set = vi.fn()
    Object.defineProperty(el, 'files', {
      configurable: true,
      get: () => [file('photo.png', 10, 'image/png')],
      set,
    })
    await input(w).trigger('change')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    if (typeof DataTransfer !== 'undefined') expect(set).toHaveBeenCalled()
  })

  it('the file rows stand on UiListItem', () => {
    const w = mountZone({ multiple: true, modelValue: [file('a.pdf'), file('b.pdf')] })
    expect(w.findAllComponents(UiListItem)).toHaveLength(2)
    expect(w.find('[role=list]').exists()).toBe(true)
  })

  it('progress out of range is clamped in the bar, the number and aria-valuenow', () => {
    const w = mountZone({ busy: true, progress: 140 })
    expect(w.text()).toContain('100%')
    expect(w.find('[role=progressbar]').attributes('aria-valuenow')).toBe('100')
    const nan = mountZone({ busy: true, progress: Number.NaN })
    expect(nan.text()).not.toContain('NaN')
  })

  it('the same refusal twice is announced twice; the message clears on remove', async () => {
    const w = mountZone({ accept: '.pdf', multiple: true, modelValue: [file('a.pdf')] })
    await drop(w, [file('x.png', 10, 'image/png')])
    await w.vm.$nextTick()
    const once = w.find('[role=alert]').element
    await drop(w, [file('y.png', 10, 'image/png')])
    await w.vm.$nextTick()
    expect(w.find('[role=alert]').element).not.toBe(once)
    expect(w.find('[role=alert]').text()).toBe('y.png: unsupported file type.')
    await w.find('[data-remove]').trigger('click')
    expect(w.find('[role=alert]').exists()).toBe(false)
  })

  it('the hint describes the browse button', () => {
    const w = mountZone({ maxSize: 1024 * 1024 })
    const id = w.find('button').attributes('aria-describedby')!
    expect(w.find(`[id="${id}"]`).text()).toBe('Maximum file size: 1 MB')
  })

  it('added and removed files are said in the status region', async () => {
    const w = mountZone({ multiple: true })
    await drop(w, [file('a.pdf')])
    await w.vm.$nextTick()
    expect(w.find('[role=status]').text()).toBe('a.pdf added')
    await drop(w, [file('b.pdf'), file('c.pdf')])
    await w.vm.$nextTick()
    expect(w.find('[role=status]').text()).toBe('2 files added')
    await w.setProps({ modelValue: [file('a.pdf')] })
    await w.find('[data-remove]').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('[role=status]').text()).toBe('a.pdf removed')
  })

  it('a file added after a finished upload is not shown as uploaded', async () => {
    const a = file('a.pdf')
    const w = mountZone({ multiple: true, progress: 100, modelValue: [a] })
    await w.setProps({ modelValue: [a, file('b.pdf')] })
    const rows = w.findAll('[role=listitem]')
    expect(rows[0]!.find('[data-remove]').exists()).toBe(false)
    expect(rows[1]!.find('[data-remove]').exists()).toBe(true)
  })

  it('@focus and @blur written on the dropzone fire on the browse button', async () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    const w = mount(UiDropzone, {
      props: base,
      attrs: { onFocus, onBlur, 'data-testid': 'dz' },
      attachTo: document.body,
    })
    mounted.push(w)
    await w.find('button').trigger('focus')
    await w.find('button').trigger('blur')
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)
    expect(input(w).attributes('data-testid')).toBe('dz')
  })

  it('a file dropped outside the card does not reach the browser default', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const drop = vi.spyOn(window, 'removeEventListener')
    const w = mountZone()
    const guard = add.mock.calls.find(([type]) => type === 'drop')![1] as (e: Event) => void
    const ev = new Event('drop', { cancelable: true })
    Object.defineProperty(ev, 'dataTransfer', { value: { types: ['Files'] } })
    guard(ev)
    expect(ev.defaultPrevented).toBe(true)
    w.unmount()
    mounted = mounted.filter((m) => m !== w)
    expect(drop).toHaveBeenCalledWith('drop', guard)
    add.mockRestore()
    drop.mockRestore()
  })

  it('drag-over changes the words, not only the color', async () => {
    const w = mountZone()
    await w.find('.border-dashed').trigger('dragenter', { dataTransfer: { types: ['Files'] } })
    expect(w.text()).toContain('Drop to add')
    expect(mountZone().text()).toContain('Drag a file here')
    expect(mountZone({ multiple: true }).text()).toContain('Drag files here')
  })

  it('a dropped folder is refused with a reason', async () => {
    const w = mountZone({ multiple: true })
    const folder = file('photos', 0, '')
    const ev = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent
    Object.defineProperty(ev, 'dataTransfer', {
      value: {
        files: [folder],
        items: [{ webkitGetAsEntry: () => ({ isDirectory: true }), getAsFile: () => folder }],
      },
    })
    w.find('.border-dashed').element.dispatchEvent(ev)
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('reject')?.[0]?.[0]).toMatchObject([{ reason: 'folder' }])
    expect(w.find('[role=alert]').text()).toBe(
      'photos: folders are not accepted; drop the files inside.',
    )
  })

  it('standalone the name is the aria label then Browse', () => {
    const w = mountZone()
    const ids = w.find('button').attributes('aria-labelledby')!.split(' ')
    expect(ids.map((id) => w.find(`[id="${id}"]`).text())).toEqual(['Statement', 'Choose a file'])
  })

  it('busy keeps the file input enabled, so a field label does not look disabled', () => {
    const w = mountZone({ busy: true })
    expect((input(w).element as HTMLInputElement).disabled).toBe(false)
  })

  it('accept */* takes any file', async () => {
    const w = mountZone({ accept: '*/*' })
    await drop(w, [file('a.bin', 10, 'application/octet-stream')])
    expect(w.emitted('update:modelValue')).toHaveLength(1)
  })

  it('after an upload ends the status region does not repeat the last added file', async () => {
    const w = mountZone({ multiple: true })
    await drop(w, [file('a.pdf')])
    await w.vm.$nextTick()
    await w.setProps({ busy: true })
    await w.setProps({ busy: false })
    expect(w.find('[role=status]').text()).toBe('')
  })

  it('a refusal survives a parent that takes the files a tick late; a reset from the parent clears it', async () => {
    const Late = defineComponent({
      setup() {
        const model = ref<File[]>([])
        return () =>
          h(UiDropzone, {
            modelValue: model.value,
            multiple: true,
            accept: '.pdf',
            ariaLabel: 'Files',
            'onUpdate:modelValue': async (v: File[]) => {
              await Promise.resolve()
              model.value = v
            },
          })
      },
    })
    const w = mount(Late, { attachTo: document.body })
    mounted.push(w)
    await drop(w, [file('a.pdf'), file('x.png', 10, 'image/png')])
    for (let i = 0; i < 4; i++) await w.vm.$nextTick()
    expect(w.find('[role=alert]').exists()).toBe(true)
    const z = mountZone({ accept: '.pdf', multiple: true })
    await drop(z, [file('x.png', 10, 'image/png')])
    await z.vm.$nextTick()
    await z.setProps({ modelValue: [] })
    await z.vm.$nextTick()
    expect(z.find('[role=alert]').exists()).toBe(false)
  })

  it('a drop on another file input on the page keeps its default', () => {
    const add = vi.spyOn(window, 'addEventListener')
    mountZone()
    const guard = add.mock.calls.find(([type]) => type === 'drop')![1] as (e: Event) => void
    add.mockRestore()
    const other = document.createElement('input')
    other.type = 'file'
    document.body.append(other)
    const ev = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(ev, 'dataTransfer', { value: { types: ['Files'] } })
    Object.defineProperty(ev, 'target', { value: other })
    guard(ev)
    expect(ev.defaultPrevented).toBe(false)
    other.remove()
  })

  it('a folder that gives no file handle is still refused as a folder', async () => {
    const w = mountZone({ multiple: true })
    const ev = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent
    Object.defineProperty(ev, 'dataTransfer', {
      value: {
        files: [file('photos', 0, '')],
        items: [
          {
            webkitGetAsEntry: () => ({ isDirectory: true, name: 'photos' }),
            getAsFile: () => null,
          },
        ],
      },
    })
    w.find('.border-dashed').element.dispatchEvent(ev)
    await w.vm.$nextTick()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('reject')?.[0]?.[0]).toMatchObject([{ reason: 'folder' }])
  })

  it('an uploaded row says so in words', () => {
    const w = mountZone({ progress: 100, modelValue: [file('a.pdf')] })
    expect(w.find('[role=listitem]').text()).toContain('Uploaded')
  })

  it('removing skips a locked row: the focus lands on the next removable one', async () => {
    const a = file('a.pdf')
    const b = file('b.pdf')
    const c = file('c.pdf')
    const Locked = defineComponent({
      setup() {
        const model = ref<File[]>([b])
        const progress = ref<number | null>(100)
        return { model, progress }
      },
      render() {
        return h(UiDropzone, {
          modelValue: this.model,
          multiple: true,
          progress: this.progress,
          ariaLabel: 'Files',
          'onUpdate:modelValue': (v: File[]) => (this.model = v),
        })
      },
    })
    const w = mount(Locked, { attachTo: document.body })
    mounted.push(w)
    ;(w.vm as unknown as { model: File[] }).model = [a, b, c]
    await w.vm.$nextTick()
    const buttons = w.findAll('[data-remove]')
    expect(buttons).toHaveLength(2)
    ;(buttons[0]!.element as HTMLElement).focus()
    await buttons[0]!.trigger('click')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Remove c.pdf')
  })
})

describe('UiDropzone — review follow-ups, third pass', () => {
  const names = (el: HTMLInputElement) => Array.from(el.files ?? []).map((f) => f.name)
  const formWith = (props: Record<string, unknown>) => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiDropzone, { attachTo: form, props: { ...base, ...props } })
    mounted.push(w)
    return { form, w }
  }

  it('in a form it sends the files under its name', async () => {
    const { form } = formWith({
      name: 'docs',
      multiple: true,
      modelValue: [file('a.pdf'), file('b.pdf')],
    })
    await nextTick()
    // The files a form submit sends are the input's; FormData itself is checked in a browser.
    const el = form.querySelector<HTMLInputElement>('input[type=file]')!
    expect(el.name).toBe('docs')
    expect(names(el)).toEqual(['a.pdf', 'b.pdf'])

    form.remove()
  })

  it('a form reset leaves the native input on its model', async () => {
    const { form, w } = formWith({ name: 'docs', modelValue: [file('a.pdf')] })
    await nextTick()
    const el = input(w).element as HTMLInputElement
    // A browser empties a file input on reset; the engine here does not, so the reset is played by hand.
    el.files = new DataTransfer().files
    form.dispatchEvent(new Event('reset'))
    expect(names(el)).toEqual([])
    await new Promise((r) => setTimeout(r))
    expect(names(el)).toEqual(['a.pdf'])
    form.remove()
  })

  it('a change the parent refuses leaves the list and the input on the model', async () => {
    const w = mountZone({ name: 'docs' })
    await drop(w, [file('a.pdf')])
    await nextTick()
    expect(w.emitted('update:modelValue')).toHaveLength(1)
    expect(w.findAll('[role=listitem]')).toHaveLength(0)
    expect(names(input(w).element as HTMLInputElement)).toEqual([])
  })

  it("a caller's aria-invalid and aria-labelledby survive where the component sets none", () => {
    const w = mount(UiDropzone, {
      props: { modelValue: [] },
      attrs: { 'aria-invalid': 'true', 'aria-labelledby': 'docs-title' },
    })
    mounted.push(w)
    expect(w.find('.border-dashed button').attributes()).toMatchObject({
      'aria-invalid': 'true',
      'aria-labelledby': 'docs-title',
    })
  })

  it('a finished upload is said in the status region', async () => {
    const w = mountZone({
      multiple: true,
      modelValue: [file('a.pdf'), file('b.pdf')],
      busy: true,
      progress: 60,
    })
    await w.setProps({ progress: 100 })
    await w.setProps({ busy: false })
    await nextTick()
    await nextTick()
    expect(w.find('[role=status]').text()).toBe('2 files uploaded')
  })

  // Done is the app's word: `progress` at 100 when `busy` ends. Below it nothing is marked or said.
  it('an upload that ends below 100 is not marked done or said', async () => {
    const w = mountZone({
      multiple: true,
      modelValue: [file('a.pdf'), file('b.pdf')],
      busy: true,
      progress: 60,
    })
    await w.setProps({ busy: false })
    await nextTick()
    await nextTick()
    expect(w.find('[role=status]').text()).not.toContain('uploaded')
    expect(w.text()).not.toContain('Uploaded')
  })

  it('the zone keeps one layout when busy turns on: Browse holds, the bar runs along the foot', async () => {
    const w = mountZone()
    const before = w.find('.border-dashed').element.children.length
    await w.setProps({ busy: true, progress: 30 })
    const zone = w.find('.border-dashed')
    expect(zone.find('button').exists()).toBe(true)
    expect(zone.find('[role=progressbar]').classes()).toContain('absolute')
    // The bar is laid over the foot; everything else stands where it stood.
    expect(zone.element.children.length - 1).toBe(before)
  })

  it('a cut file name keeps its whole text in the tooltip', () => {
    const long = 'signed-agreement-with-all-appendices-and-the-final-pages-v3.pdf'
    const w = mountZone({ modelValue: [file(long)] })
    expect(w.findComponent(UiTruncate).props('text')).toBe(long)
  })

  it('a refusal names the files it refused, three and then how many more', async () => {
    const w = mountZone({ multiple: true, accept: '.pdf' })
    await drop(
      w,
      ['a', 'b', 'c', 'd', 'e'].map((n) => file(`${n}.png`, 10, 'image/png')),
    )
    expect(w.find('[role=alert]').text()).toBe(
      'a.png, b.png, c.png and 2 more: unsupported file type.',
    )
  })

  it('dragging text over the zone does not light it', async () => {
    const w = mountZone()
    await w.find('.border-dashed').trigger('dragenter', { dataTransfer: { types: ['text/plain'] } })
    expect(w.find('[data-dragging]').exists()).toBe(false)
  })

  it('the native input follows a model mutated in place', async () => {
    const files = reactive([file('a.pdf'), file('b.pdf')])
    const w = mountZone({ multiple: true, name: 'docs', modelValue: files })
    await nextTick()
    expect(names(input(w).element as HTMLInputElement)).toEqual(['a.pdf', 'b.pdf'])
    files.splice(0, 1)
    await nextTick()
    await nextTick()
    expect(names(input(w).element as HTMLInputElement)).toEqual(['b.pdf'])
  })

  it('invalid wears the red halo as a capsule does', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    expect(css).toMatch(
      /\.ui-dropzone\[data-invalid\]:not\(:has\(:disabled\)\) \{\s*box-shadow: 0 0 0 3px color-mix\(in oklab, var\(--color-danger\) 15%, transparent\)/,
    )
    expect(mountZone({ invalid: true }).classes()).toContain('ui-dropzone')
  })

  it('sizes round on the right side of the limit, by the locale', async () => {
    expect(mountZone({ maxSize: 1000 }).text()).toContain('Maximum file size: 0.9 KB')
    expect(mountZone({ maxSize: 1048000 }).text()).toContain('Maximum file size: 1023 KB')
    const w = mountZone({ modelValue: [file('a.pdf', 1.5 * 1024 * 1024)] }, withGrani(RUSSIAN))
    await nextTick()
    expect(w.find('[role=listitem]').text()).toContain('1,5 МБ')
  })

  it('a disabled zone mutes its rows', () => {
    const w = mountZone({ disabled: true, modelValue: [file('a.pdf')] })
    expect(w.find('[role=listitem] .truncate').classes()).toContain('text-disabled-fg')
  })

  it('dev warns when the dropzone has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      mounted.push(mount(UiDropzone, { props: { modelValue: [] } }))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no name'))
      warn.mockClear()
      mountZone()
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('a dropzone marked invalid is what focusInvalid lands on', () => {
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('form', [
            h(UiField, { label: 'Statement', error: 'Add the statement' }, () =>
              h(UiDropzone, { modelValue: [] }),
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    mounted.push(w)
    expect(focusInvalid(w.element as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(w.find('.border-dashed button').element)
  })
})

describe('UiDropzone — an upload of unknown length', () => {
  it('busy with no percent shows a running bar, not none', () => {
    const w = mountZone({ busy: true })
    const bar = w.findComponent({ name: 'UiProgress' })
    expect(bar.exists()).toBe(true)
    expect(bar.props('indeterminate')).toBe(true)
    expect(bar.attributes('aria-valuenow')).toBeUndefined()
  })
})

describe('UiDropzone — the count limit in words', () => {
  it('a limit of 21 is said as 21 in Russian, never as “only one file”', async () => {
    const w = mountZone(
      {
        multiple: true,
        maxFiles: 21,
        modelValue: Array.from({ length: 21 }, (_, i) => file(`f${i}.pdf`)),
      },
      withGrani(RUSSIAN),
    )
    await drop(w, [file('extra.pdf')])
    expect(w.find('[role=alert]').text()).toBe('extra.pdf: не больше 21 файла.')
  })

  it('one file at a time is said so, in either language', async () => {
    // One file in a single zone: a second dropped with it is the one refused.
    const single = mountZone({}, withGrani(RUSSIAN))
    await drop(single, [file('a.pdf'), file('b.pdf')])
    expect(single.find('[role=alert]').text()).toBe('b.pdf: только один файл.')
    const one = mountZone({ multiple: true, maxFiles: 1, modelValue: [file('a.pdf')] })
    await drop(one, [file('b.pdf')])
    expect(one.find('[role=alert]').text()).toBe('b.pdf: one file at a time.')
  })
})

describe('UiDropzone — an upload that ends', () => {
  const four = () => ['a', 'b', 'c', 'd'].map((n) => file(`${n}.pdf`))

  it('a failure after the bytes reached 100 is a failure: Retry, no check, no lock', async () => {
    const w = mountZone({ busy: true, progress: 100, modelValue: [file('a.pdf')] })
    await w.setProps({ busy: false, failed: 'Server said no.' })
    const row = w.find('[role=listitem]')
    expect(row.find('[data-retry]').exists()).toBe(true)
    expect(row.text()).not.toContain('Uploaded')
    expect(row.text()).toContain('Server said no.')
    expect(row.find('[data-remove]').exists()).toBe(true)
  })

  it('a finished file stays uploaded while a later file uploads', async () => {
    const a = file('a.pdf')
    const w = mountZone({ multiple: true, busy: true, progress: 100, modelValue: [a] })
    await w.setProps({ busy: false })
    await w.setProps({ modelValue: [a, file('b.pdf')] })
    await w.setProps({ busy: true, progress: 0 })
    const rows = w.findAll('[role=listitem]')
    expect(rows[0]!.text()).toContain('Uploaded')
    expect(rows[0]!.find('[role=progressbar]').exists()).toBe(false)
    expect(rows[1]!.find('[role=progressbar]').exists()).toBe(true)
  })

  it('folded, a failure opens the list on the files it left, with the reason and Retry', async () => {
    const w = mountZone({ multiple: true, busy: true, progress: 20, modelValue: four() })
    await w.setProps({ busy: false, failed: 'Lost.' })
    expect(w.find('[data-retry]').exists()).toBe(true)
    expect(w.text()).toContain('Lost.')
  })

  it('a failure the app clears while idle at 100 stays a failure until the next upload ends', async () => {
    const w = mountZone({ busy: true, progress: 100, modelValue: [file('a.pdf')] })
    await w.setProps({ busy: false, failed: 'Server said no.' })
    await w.setProps({ failed: false })
    const row = w.find('[role=listitem]')
    expect(row.text()).not.toContain('Uploaded')
    expect(row.find('[role=progressbar]').exists()).toBe(false)
  })

  it('an upload that delivers nothing new says no count of the last one', async () => {
    const files = [file('a.pdf'), file('b.pdf')]
    const w = mountZone({ multiple: true, busy: true, progress: 100, modelValue: files })
    await w.setProps({ busy: false })
    await vi.waitFor(() => expect(w.find('[role=status]').text()).toBe('2 files uploaded'))
    await w.setProps({ modelValue: [files[0]!] })
    await w.setProps({ busy: true, progress: 100 })
    await w.setProps({ busy: false })
    await nextTick()
    await nextTick()
    expect(w.find('[role=status]').text()).not.toBe('2 files uploaded')
  })

  it('a failure on a short list leaves a later long one folded', async () => {
    const files = ['a', 'b', 'c', 'd'].map((n) => file(`${n}.pdf`))
    const w = mountZone({ multiple: true, busy: true, modelValue: files.slice(0, 2) })
    await w.setProps({ busy: false, failed: 'Lost.' })
    await w.setProps({ failed: false, modelValue: files })
    expect(w.find('[aria-expanded]').attributes('aria-expanded')).toBe('false')
  })

  it('a list that stops folding forgets it was opened', async () => {
    const four = ['a', 'b', 'c', 'd'].map((n) => file(`${n}.pdf`))
    const w = mountZone({ multiple: true, modelValue: four })
    await w.find('[aria-expanded]').trigger('click')
    await w.setProps({ modelValue: four.slice(0, 2) })
    await w.setProps({ modelValue: four })
    expect(w.find('[aria-expanded]').attributes('aria-expanded')).toBe('false')
  })

  it('folded, a finished upload shows it was done on the one line', async () => {
    const w = mountZone({ multiple: true, busy: true, progress: 100, modelValue: four() })
    await w.setProps({ busy: false })
    expect(w.find('[aria-expanded]').find('[data-done]').exists()).toBe(true)
  })
})

describe('UiDropzone — a native required', () => {
  it('an empty required dropzone in a form sends the focus to Browse and says why', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiDropzone, {
      props: { ariaLabel: 'Scan', modelValue: [] },
      attrs: { required: true, name: 'scan' },
      attachTo: form,
      global: { plugins: withGrani() },
    })
    const input = w.find('input[type=file]').element as HTMLInputElement
    expect(input.required).toBe(true)
    const check = new Event('invalid', { cancelable: true })
    input.dispatchEvent(check)
    await nextTick()
    const browse = w.find('.border-dashed button')
    expect(check.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(browse.element)
    expect(browse.attributes('aria-invalid')).toBe('true')
    expect(w.find('[role=alert]').text()).toBe('A file is required.')
    await w.setProps({ modelValue: [file('a.pdf')] })
    await nextTick()
    expect(browse.attributes('aria-invalid')).toBeUndefined()
    w.unmount()
    form.remove()
  })

  it('a native required is said in words on Browse, as a field’s is', () => {
    const w = mount(UiDropzone, {
      props: { ariaLabel: 'Scan', modelValue: [] },
      attrs: { required: true },
      attachTo: document.body,
      global: { plugins: withGrani() },
    })
    const said = (w.find('.border-dashed button').attributes('aria-describedby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent?.trim())
    expect(said).toContain('required')
    w.unmount()
  })
})
