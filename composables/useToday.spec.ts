import { useShared } from './useShared'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { today } from '../utils/calendar'
import { useToday } from './useToday'

const seen: string[] = []
const Probe = defineComponent({
  setup() {
    const { now } = useToday()
    seen.push(now.value)
    return () => h('span')
  },
})

describe('useToday — review follow-ups', () => {
  it('a calendar mounted after midnight of a long-open page opens on the real today', () => {
    mount(Probe).unmount()
    // The page has been up for days: the seed the server wrote is an old day.
    useShared('grani:today', () => '').value = '2020-01-01'
    seen.length = 0
    mount(Probe).unmount()
    expect(seen).toEqual([today()])
  })
})
