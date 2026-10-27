<script lang="ts">
export const blurb = 'Choose a day or date range from a month view, using the mouse or keyboard.'
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToday } from '../composables/useToday'
import type { CalendarMark, DateSpan } from '../types/ui'

// Days around today, in the app's zone. Today is the server's day until the page is up, so the
// first render matches the prerendered one; then it is the person's day, and the examples move to it.
const { now } = useToday()
const shift = (iso: string, n: number, years = 0) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCFullYear(d.getUTCFullYear() + years)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const fromToday = (n: number, years = 0) => shift(now.value, n, years)
const LOW = computed(() => fromToday(-4))
const HIGH = computed(() => fromToday(10))
// Eighteen or older: the window ends years before today, and the calendar opens on its last month.
const ADULT = computed(() => fromToday(0, -18))
const day = ref<string | null>(null)
const bounded = ref<string | null>(null)
// Inside the window, or chosen before the window closed on it (a saved day, a filter): out there
// it keeps its ring beyond `max`, and the arrows walk back in.
const where = ref<'inside' | 'outside'>('inside')
watch(where, (w) => (bounded.value = fromToday(w === 'inside' ? 2 : 16)))
const withEntries = ref<string | null>(null)
const due = ref<string | null>(null)
const meeting = ref<string | null>(null)
// Taken days a week ahead: struck through, and a screen reader hears unavailable.
const BOOKED = computed(() => [6, 7, 8, 9].map((n) => fromToday(n)))
const start = ref('10:30')
const end = ref('12:30')
const born = ref<string | null>(null)
const checkIn = ref<string | null>(null)
const checkOut = ref<string | null>(null)
const ruSpan = ref<DateSpan | null>(null)
const QUICK = [
  { label: 'Today', days: 0, span: 'col-span-2' },
  { label: 'Tomorrow', days: 1, span: 'col-span-2' },
  { label: 'In 3 days', days: 3, span: 'col-span-2' },
  { label: 'In a week', days: 7, span: 'col-span-3' },
  { label: 'In 2 weeks', days: 14, span: 'col-span-3' },
]
// Payments in green, overdue in red; a day with both carries two dots. The label is what a
// reader hears: the color alone says nothing to a screen reader.
const paid = (day: string): CalendarMark => ({ day, tone: 'success', label: 'paid' })
const overdue = (day: string): CalendarMark => ({ day, tone: 'danger', label: 'overdue' })
const ENTRIES = computed(() => [
  paid(fromToday(-12)),
  paid(fromToday(-11)),
  overdue(fromToday(-4)),
  paid(fromToday(3)),
  overdue(fromToday(3)),
  paid(fromToday(0)),
])
// The calendar picks the span: the first press starts it, the second ends it, and only a whole
// span reaches the model.
const span = ref<DateSpan>({ from: null, to: null })
// The chosen days stand around today: set again when today moves (the page is up, midnight passes).
watch(
  now,
  () => {
    day.value = fromToday(-3)
    bounded.value = fromToday(where.value === 'inside' ? 2 : 16)
    withEntries.value = fromToday(0)
    meeting.value = fromToday(5)
    checkIn.value = fromToday(7)
    checkOut.value = fromToday(10)
    span.value = { from: fromToday(-2), to: fromToday(9) }
  },
  { immediate: true },
)

// The value read as a person reads it; the ISO day beside it is what the model holds. The card
// is as wide as the calendar (`w-min`): the footer's words give way, they never widen it.
const at = (iso: string) => new Date(`${iso}T00:00:00Z`)
const long = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('en', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(at(iso))
    : 'Nothing chosen'
const range = (s: DateSpan) =>
  s.from && s.to
    ? new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).formatRange(at(s.from), at(s.to))
    : 'Nothing chosen'
</script>

<template>
  <DemoBlock title="Base">
    <UiCard class="w-min">
      <UiCalendar v-model="day" />
      <template #footer>
        <span class="me-auto text-sm" :class="day ? 'text-fg' : 'text-fg-muted'">{{
          long(day)
        }}</span>
        <UiButton v-if="day" variant="ghost" size="xs" @click="day = null">Clear</UiButton>
      </template>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Range">
    <UiCard class="w-min">
      <UiCalendar v-model="span" range />
      <template #footer>
        <span class="me-auto text-sm text-fg">{{ range(span) }}</span>
      </template>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Min and max">
    <div class="flex flex-col items-center gap-4">
      <UiCard class="w-min">
        <UiCalendar v-model="bounded" :min="LOW" :max="HIGH" />
        <template #footer>
          <span class="me-auto text-sm text-fg">{{ long(bounded) }}</span>
          <span class="text-xs text-fg-muted">{{ range({ from: LOW, to: HIGH }) }}</span>
        </template>
      </UiCard>
      <UiRadioGroup v-model="where" variant="segmented" aria-label="Where the chosen day is">
        <UiRadio value="inside">Inside</UiRadio>
        <UiRadio value="outside">Outside</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="Marked">
    <UiCard class="w-min">
      <UiCalendar v-model="withEntries" :marked="ENTRIES" :unavailable="BOOKED" />
      <template #footer>
        <span class="me-auto text-sm text-fg">{{ long(withEntries) }}</span>
        <span class="flex items-center gap-2 text-xs text-fg-muted"
          ><span class="h-1 w-1 rounded-pill bg-success-border" />paid<span
            class="h-1 w-1 rounded-pill bg-danger-border"
          />overdue</span
        >
      </template>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Quick picks">
    <UiCard footer-variant="muted" class="w-min">
      <UiCalendar v-model="due" />
      <template #footer>
        <div class="grid w-full grid-cols-6 gap-[inherit]">
          <UiButton
            v-for="q in QUICK"
            :key="q.label"
            variant="outline"
            size="xs"
            :class="q.span"
            :aria-pressed="due === fromToday(q.days)"
            @click="due = fromToday(q.days)"
          >
            {{ q.label }}
          </UiButton>
        </div>
      </template>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="With time">
    <UiCard class="w-min">
      <UiCalendar v-model="meeting" />
      <UiSeparator class="my-4" />
      <div class="flex flex-col gap-4">
        <UiField label="Start time">
          <UiTimePicker v-model="start" class="w-full" />
        </UiField>
        <UiField label="End time">
          <UiTimePicker v-model="end" class="w-full" />
        </UiField>
      </div>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Date of birth">
    <UiCard class="w-min">
      <UiCalendar v-model="born" :max="ADULT" />
      <template #footer>
        <span class="me-auto text-sm" :class="born ? 'text-fg' : 'text-fg-muted'">{{
          long(born)
        }}</span>
        <span class="text-xs text-fg-muted">18 or older</span>
      </template>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Two on a page">
    <UiCard class="w-min">
      <UiCalendar v-model="checkIn" aria-label="Check-in" />
      <template #footer>
        <span class="me-auto text-sm text-fg">Check-in</span>
        <span class="text-xs text-fg-muted">{{ long(checkIn) }}</span>
      </template>
    </UiCard>
    <UiCard class="w-min">
      <UiCalendar v-model="checkOut" aria-label="Check-out" :min="checkIn ?? undefined" />
      <template #footer>
        <span class="me-auto text-sm text-fg">Check-out</span>
        <span class="text-xs text-fg-muted">{{ long(checkOut) }}</span>
      </template>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Russian" locale="ru">
    <!-- The app's language: createGrani({ locale: 'ru', translate }). The week starts on Monday,
         and Saturday and Sunday are named in red. -->
    <UiCalendar v-model="ruSpan" range />
  </DemoBlock>
</template>
