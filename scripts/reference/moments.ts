// The chapters of the rules of behavior: what a person is doing when a rule holds. Small and
// apart from the rules' text, so the site's every page knows its chapters without loading the rules.

/** The moment a pattern belongs to: what the person is doing when it holds. */
export type Moment = 'open' | 'close' | 'form' | 'list' | 'answer' | 'work'

export const MOMENTS: Record<Moment, { label: string; summary: string }> = {
  open: {
    label: 'Focus and navigation',
    summary: 'Where keyboard focus starts, how it moves, and where it returns.',
  },
  close: {
    label: 'Closing panels',
    summary:
      'Dismiss nested panels in order, the top one first, and leave the form behind them as it was.',
  },
  form: {
    label: 'Forms and input',
    summary: 'Enter values, correct validation errors and submit a form.',
  },
  list: {
    label: 'Search and selection',
    summary: 'Find options, filter rows and navigate long lists.',
  },
  answer: {
    label: 'Loading and feedback',
    summary: 'Show progress, explain failures and confirm actions when needed.',
  },
  work: {
    label: 'Working with records',
    summary: 'Select rows, apply actions and move between records.',
  },
}

export const MOMENT_KEYS = Object.keys(MOMENTS) as Moment[]
// A chapter's address is fixed, not read from its label: a label can be reworded without breaking
// a link to its chapter.
const MOMENT_SLUGS: Record<Moment, string> = {
  open: 'opening',
  close: 'closing',
  form: 'filling-in',
  list: 'finding',
  answer: 'waiting',
  work: 'working-the-list',
}
export const momentSlug = (moment: Moment) => MOMENT_SLUGS[moment]
export const momentPath = (moment: Moment) => `/patterns/${momentSlug(moment)}`

export const momentBySlug = (slug: string) => MOMENT_KEYS.find((m) => momentSlug(m) === slug)
