// The rules of behavior, each with the tests that prove it: the package's text for language
// models lists them, and the showcase plays them.

export { MOMENTS, type Moment } from './moments.ts'
import type { Moment } from './moments.ts'

/** One surface's part of a rule. */
export interface Holds {
  /** The option it holds on, read after the component's name: "with a photo". */
  when: string
  /** The props that make it so, in code: "`src` is set". */
  props: string
  /** What the person gets there. */
  guarantee: string
  /** What the app's code does for it, often nothing, and what it must not add. */
  yours: string
  /** What it does not do, where one would expect it to. */
  limit?: string
  /** What goes wrong without it: the trouble the rule keeps away. */
  without: string
  /** The smallest code that has it, one line. */
  code: string
}

export interface PatternEntry {
  /** The pattern's name, as the patterns page and a surface's Patterns read it. */
  title: string
  /** The pattern's short name, for a tab and a list: "Stable dimensions". */
  label?: string
  /** The pattern in one sentence, from the reader's side. */
  summary: string
  /** Why it matters to the person who meets it. */
  why: string
  /** Who holds it: the library by itself, or the app that uses it. */
  who: 'library' | 'app'
  /** The moment it belongs to: the patterns page lists it there. */
  moment: Moment
  /**
   * The tests that prove it: a spec file's name without `.spec.ts`, and the title of an `it`
   * in it. A gate finds each one; a renamed test is a red gate, not a stale claim.
   */
  proof?: Record<string, string | string[]>
  /** The surfaces it holds for, each with the demo tab that shows it: Try it opens that tab. */
  at: Record<string, string>
  /**
   * How a surface keeps the promise, written for an agent first: the page and the Markdown twin
   * read the same fields.
   */
  holds?: Record<string, Holds>
}

export const PATTERNS: Record<string, PatternEntry> = {
  focusStart: {
    title: 'Open with keyboard focus where the task begins',
    label: 'Focus starts inside',
    summary:
      'Open a form and start typing in its first field, or open a list and start choosing with the arrow keys. Searchable lists start in their search field, and a calendar starts on the selected day. In a confirmation dialog, focus starts on Cancel, so pressing Enter by habit does not approve the action.',
    why: 'You can begin the task without first clicking a field or pressing Tab to find it. Confirmation dialogs give you time to read the question before approving it.',
    who: 'library',
    moment: 'open',
    proof: {
      UiDrawer: 'focus goes to the first field, not the cross; without fields to the panel',
      UiFilterList: 'opened in a popover, a list of six and more puts the focus in its search',
      UiFilter: 'opened, the focus goes to the list, or to its search from six options up',
      UiTableColumns: [
        'opened, the focus goes to the list of columns',
        'opened on six columns or more, the focus goes to the search',
      ],
      UiConfirm: 'asks in an alert dialog and answers true on confirm',
      UiPopover: [
        'focus goes to the first control and Tab goes round inside',
        'focus goes to the first list, not to a search further down',
      ],
      UiDatePicker: [
        'opens a calendar on the chosen day; a pick closes it and returns focus to the button',
        'with no value and today outside the window it opens on the nearest day',
      ],
      UiCalendar:
        'shows the month of the value, the value picked and one focusable day marked to open on',
      UiModal: 'focus goes to the first field, not the cross; without fields to the window',
      UiSelect: 'focuses the filter, narrows by label, and says when nothing matches',
      UiCrudDrawer: [
        'loading: a skeleton, Save held, no submit; focus moves to the first field when it ends',
        'a step into a form takes the first drawn field, a select too',
        'a step with no field takes the focus on the panel, not on a button that decides',
      ],
    },
    at: {
      UiFilterList: 'Search',
      UiPopover: 'Base',
      UiConfirm: 'Base',
    },
    holds: {
      UiFilterList: {
        when: 'it opens in a panel with six options or more',
        props: 'none',
        guarantee:
          'Start typing to narrow the options as soon as the panel opens: keyboard focus goes straight to the list’s search field.',
        yours: 'Place the list inside a UiPopover, UiFilter or UiTableColumns.',
        without:
          'The panel opens with keyboard focus left on the button that opened it, and you press Tab before you can type a search.',
        code: '<UiPopover><UiFilterList v-model="countries" :items="all" /></UiPopover>',
      },
      UiTableColumns: {
        when: 'you open the columns panel',
        props: 'none',
        guarantee:
          'Use the arrow keys to move between columns and Space to show or hide one. With six or more columns, focus starts in the search field instead, so you can find a column by name.',
        yours: 'Nothing.',
        without:
          'The panel opens with keyboard focus left on its button, and you press Tab before you can turn a column on or off.',
        code: '<UiTableToolbar v-model:search="query" :columns="cols" />',
      },
      UiFilter: {
        when: 'you open the filter’s panel',
        props: 'none',
        guarantee:
          'Start choosing with the arrow keys as soon as the panel opens. With six or more options, focus starts in the search field so you can narrow the list by typing.',
        yours: 'Nothing.',
        without:
          'The panel opens with keyboard focus left on the filter button, and you press Tab before you can choose.',
        code: '<UiFilter v-model="tags" label="Tags" :items="TAGS" />',
      },
      UiSelect: {
        when: 'its list has a search field',
        props: '`searchable` or `fetcher`',
        guarantee:
          'Opening the list puts keyboard focus in its search field, so typing narrows the options at once. When nothing matches, the list says so in words instead of showing an empty box.',
        yours: 'Nothing.',
        without:
          'The list opens with keyboard focus left on the field, and you press Tab or click before you can search.',
        code: '<UiSelect v-model="country" :items="countries" searchable />',
      },
      UiDatePicker: {
        when: 'you open the calendar',
        props: 'none',
        guarantee:
          'Continue from the date already selected: the calendar opens on that date and gives it keyboard focus. With no selection, it starts on today, or the nearest allowed day if today is outside the allowed range.',
        yours: 'Nothing.',
        without:
          'The calendar opens on today while your date is in March, and you page back to it month by month.',
        code: '<UiDatePicker v-model="due" />',
      },
      UiCalendar: {
        when: 'it opens',
        props: 'none',
        guarantee:
          'The calendar shows the selected month and places keyboard focus on the selected day, ready for the arrow keys. With no selection, it starts on today, or the nearest allowed day if today is outside the allowed range.',
        yours: 'Nothing.',
        without:
          'The calendar opens on today while your date is in March, or with no day for keyboard focus to start on.',
        code: '<UiCalendar v-model="due" />',
      },
      UiConfirm: {
        when: 'you are asked to confirm an action',
        props: 'none: every question asked with `confirm`',
        guarantee:
          'Keyboard focus starts on Cancel, the safe answer, so an Enter pressed by habit cancels the action instead of confirming it.',
        yours:
          'Ask with `confirm`, and name the action on its button with `confirmLabel`, such as Delete or Leave.',
        without:
          'Keyboard focus starts on the red Delete button, and an Enter pressed by habit deletes the order.',
        code: "await confirm({ title: 'Delete ORD-1041?', message: 'This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' })",
      },
      UiDrawer: {
        when: 'the panel opens',
        props: 'none: every UiDrawer',
        guarantee:
          'Start filling in the form immediately: focus goes to its first field, including a select or switch. The close button does not take focus first. If there are no fields, focus goes to the panel itself.',
        yours: 'Put the field where the task starts first in the panel’s content.',
        without:
          'Keyboard focus starts on the close button, so the first Enter closes the panel you just opened.',
        code: '<UiDrawer v-model:open="open" title="View settings">…</UiDrawer>',
      },
      UiPopover: {
        when: 'the panel opens, from the keyboard or a click',
        props: 'none: every UiPopover; `data-autofocus` names another place',
        guarantee:
          'Start typing or choosing as soon as the panel opens. Focus goes to its first field or list, including a select or switch. If there are none, it goes to the first button.',
        yours:
          'Put the field to start on first, or mark another one with the `data-autofocus` attribute.',
        without:
          'The panel opens with keyboard focus left on the button that opened it, so what you type does not reach the panel’s field.',
        code: '<UiPopover>\n  <template #trigger><UiButton>Note</UiButton></template>\n  <UiField label="Note"><UiInput v-model="note" /></UiField>\n</UiPopover>',
      },
    },
  },
  focusBack: {
    title: 'Continue from where you opened the panel',
    label: 'Focus comes back',
    summary:
      'After closing a dialog or side panel, continue from the button or row that opened it. Closing a popup with Escape or by choosing an option also returns focus to its opener, provided it is still on the page. Clicking outside a popup leaves focus where you clicked.',
    why: 'You can open and close one record after another from the keyboard without looking for your place again each time.',
    who: 'library',
    moment: 'open',
    proof: {
      UiDrawer: 'focus returns to the opener on close',
      UiAppShell: [
        'Escape closes the sheet and the focus returns to the menu button that opened it.',
        'A press on the backdrop closes the sheet, and the focus returns to the menu button too.',
      ],
      UiPopover: 'Escape and close() from inside return focus to the button',
      UiFilter: 'Escape closes the panel and returns the focus to the button',
      UiTableColumns: 'Escape closes the panel and returns the focus to the button',
      UiDateRange: 'closing returns the focus to the button: a preset, a custom span, Escape',
      UiModal: 'focus returns to the opener on close',
      UiSelect: [
        'Home and End jump, Escape closes and returns focus to the trigger',
        'Tab from the filter closes and puts focus back on the trigger',
        'after a pick from a searchable list the focus is back on the field; a press outside leaves it where it was',
      ],
      UiMenu: [
        'running an item closes the menu and returns focus to the button',
        'the focus is on the button before the command runs, so a command that removes the button leaves it to the list',
      ],
      UiDatePicker:
        'opens a calendar on the chosen day; a pick closes it and returns focus to the button',
      UiCrudDrawer: [
        'focus returns to the opener once the drawer closes',
        'the arrow that reaches the end hands the focus to the other arrow',
        'closed, a tick, then the row removed: the focus goes to the next row, the table first',
        'closed, a tick, then the row removed: the focus goes to the next row, the drawer first',
      ],
    },
    at: {
      UiDrawer: 'Detail',
      UiAppShell: 'Narrow',
      UiFilter: 'One dimension',
    },
    holds: {
      UiTableColumns: {
        when: 'you close the columns panel with Escape',
        props: 'none',
        guarantee:
          'Focus returns to the columns button at the end of the toolbar, so you can continue through the toolbar with Tab.',
        yours: 'Nothing.',
        limit:
          'If the panel is closed by a click outside it, keyboard focus stays where the click put it.',
        without:
          'After Escape, keyboard focus drops to the start of the page, and you tab through the page again to reach the table.',
        code: '<UiTableToolbar v-model:search="query" :columns="cols" />',
      },
      UiFilter: {
        when: 'you close the filter’s panel with Escape',
        props: 'none',
        guarantee:
          'Keyboard focus goes back to the filter button, so the next Tab continues along the toolbar from there.',
        yours: 'Nothing.',
        limit:
          'If the panel is closed by a click outside it, keyboard focus stays where the click put it.',
        without:
          'Keyboard focus is lost with the closed panel: it falls to the page, a screen reader loses its place, and you look for the button again.',
        code: '<UiFilter v-model="kinds" label="Categories" :items="CATEGORIES" />',
      },
      UiDateRange: {
        when: 'the period panel closes',
        props: 'none',
        guarantee:
          'Whether you close the panel by choosing a preset, finishing a custom range or pressing Escape, keyboard focus goes back to the period button.',
        yours: 'Nothing.',
        without:
          'The panel closes and keyboard focus falls to the page: a screen reader loses its place, and you look for the filters again.',
        code: '<UiDateRange v-model="issued" />',
      },
      UiSelect: {
        when: 'the list closes',
        props: 'none',
        guarantee:
          'After choosing an option, pressing Escape, or pressing Tab from the list’s search field, focus returns to the select field. Clicking outside closes the list and leaves focus where you clicked.',
        yours: 'Nothing.',
        without:
          'The list closes and keyboard focus falls to the page: a screen reader loses its place, and you look for the field again.',
        code: '<UiSelect v-model="currency" :items="currencies" />',
      },
      UiDatePicker: {
        when: 'you pick a day or close the calendar',
        props: 'none',
        guarantee:
          'Keyboard focus returns to the date field’s button, also when the picker sits inside a window.',
        yours: 'Nothing.',
        without:
          'After a pick, keyboard focus falls to the page: a screen reader loses its place, and you look for the form again.',
        code: '<UiDatePicker v-model="due" />',
      },
      UiDrawer: {
        when: 'the panel closes by Escape, a press on the backdrop, the close button, or `open` set to false',
        props: 'none: every UiDrawer',
        guarantee:
          'Keyboard focus goes back to what opened the panel, most often a row of the list, so you continue down the list from the row you opened.',
        yours:
          'Open the panel from a button or row that will remain on the page when the panel closes. An action in the panel that removes its record closes the panel first, waits a tick (`await nextTick()`), then removes the row: a UiTable then hands keyboard focus to the same control of the row now in its place.',
        limit:
          'A row removed before the panel closes takes the opener with it, and keyboard focus falls to the page. So does a delete asked through UiConfirm with an `action`: the question gives the focus back to the panel’s row, which left with the panel.',
        without:
          'The panel closes with keyboard focus inside it, focus falls to the page, and you look for your place in the list again.',
        code: '<UiListItem as="button" :title="row.id" @click="open(row)" />\n<UiDrawer v-model:open="isOpen" :title="row.id">…</UiDrawer>',
      },
      UiAppShell: {
        when: 'the navigation sheet of a narrow layout closes',
        props: 'none: every UiAppShell under 768px wide',
        guarantee:
          'Escape or a press on the backdrop closes the sheet, and keyboard focus returns to the menu button that opened it.',
        yours: 'Nothing.',
        without:
          'The sheet closes with keyboard focus inside it: focus falls to the page, and a screen reader loses its place.',
        code: '<UiAppShell :nav="nav" :current="route.path">…</UiAppShell>',
      },
    },
  },
  focusInvalid: {
    title: 'Go straight to the field that needs fixing',
    label: 'Focus on the error',
    summary:
      'If a form cannot be submitted because a field has an error, focus moves to the first field you can correct, and the page scrolls enough to show it. UiModal with `form` and UiCrudDrawer do this by themselves when the app marks the field as the submit is checked, and again when `submitting` falls on an answer that marked one, unless you are typing in another field. Any error in a custom form is focused by the app calling `focusInvalid`.',
    why: 'You can correct the problem immediately, even in a long form where the error was off screen, instead of pressing Save again or searching for the highlighted field.',
    who: 'library',
    moment: 'form',
    proof: {
      UiTimePicker: 'a picker marked invalid is what focusInvalid lands on',
      UiTextarea: 'a textarea marked invalid is what focusInvalid lands on',
      UiSwitch: 'a switch marked invalid is what focusInvalid lands on',
      UiSelect: 'focusInvalid on an invalid select focuses the trigger',
      UiListField: [
        'inside UiField the input takes the field id and invalid, and focusInvalid lands on it',
        'a refused draft is not the form’s refusal: Save sends once, the focus stays on Save',
      ],
      UiScaleInput: 'focusInvalid on an invalid scale focuses the chosen segment, else the first',
      UiRadioGroup:
        'focusInvalid on an invalid radiogroup focuses the chosen radio, else the first',
      UiInput: 'an input marked invalid is what focusInvalid lands on',
      UiField: 'a group field in error: focusInvalid lands on a radio inside the group',
      UiDropzone: 'a dropzone marked invalid is what focusInvalid lands on',
      UiCodeInput: 'a code marked invalid is what focusInvalid lands on',
      focusInvalid: [
        'focuses the first invalid field in the root and scrolls it into view',
        'passes over a draft refused on its own (`data-draft`): it is not the form’s to fix',
      ],
      UiCrudDrawer: [
        'a submit that leaves a field invalid puts the focus on the first one',
        'a refused submit can be sent again after the fix is made with a control that fires no input event',
      ],
      UiModal: 'a submit that leaves a field invalid puts the focus on the first one',
      UiCheckbox: 'a box marked invalid is what focusInvalid lands on',
      UiStepper: 'in a field in error, focusInvalid lands on the count',
      UiListItem: 'in a label row with an error, focusInvalid lands on its control',
    },
    at: { UiModal: 'Form', UiCheckbox: 'In a form' },
    holds: {
      UiTimePicker: {
        when: 'a form is sent with no time',
        props: '`invalid`, or the error of its UiField',
        guarantee:
          'When the time field is the first one in error, keyboard focus lands on it, so you can enter the time straight away.',
        yours:
          'Pass the error to its UiField, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        without:
          'The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.',
        code: '<UiField label="Ends at" :error="err"><UiTimePicker v-model="end" /></UiField>',
      },
      UiTextarea: {
        when: 'a form is sent with the text in error',
        props: '`invalid`, or the error of its UiField',
        guarantee:
          'When the textarea is the first field with an error, keyboard focus lands in it, so you can type the fix straight away.',
        yours:
          'Pass the error to its UiField, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        without:
          'The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.',
        code: '<UiField label="Comment" :error="err"><UiTextarea v-model="comment" /></UiField>',
      },
      UiSwitch: {
        when: 'a form is sent with the switch in error',
        props: '`invalid`, or the error of its UiField',
        guarantee:
          'When the switch is the first field with an error, keyboard focus lands on it, so you can turn it on from the keyboard straight away.',
        yours:
          'Pass the error to its UiField, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        without:
          'The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.',
        code: '<UiField :error="err"><UiSwitch v-model="terms">I accept the terms</UiSwitch></UiField>',
      },
      UiSelect: {
        when: 'a form is sent with no choice made',
        props: '`invalid`, or the error of its UiField',
        guarantee:
          'When the select is the first field with an error, keyboard focus lands on its button, so you can open the list and choose straight away.',
        yours:
          'Pass the error to its UiField, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        without:
          'The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.',
        code: '<UiField label="Currency" :error="err"><UiSelect v-model="currency" :items="currencies" /></UiField>',
      },
      UiScaleInput: {
        when: 'a form is sent with no step chosen',
        props: '`invalid`, or the error of its `UiField group`',
        guarantee:
          'When the scale is the first field with an error, keyboard focus lands on the chosen step, or on the first step when none is chosen, so you can pick an answer from the keyboard.',
        yours:
          'Pass the error to its `UiField group`, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        without:
          'The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.',
        code: '<UiField label="Pain" group :error="err"><UiScaleInput v-model="pain" /></UiField>',
      },
      UiRadioGroup: {
        when: 'a form is sent with no option chosen',
        props: '`invalid`, or the error of its `UiField group`',
        guarantee:
          'When the group is the first field with an error, keyboard focus lands on the chosen radio, or on the first one when none is chosen, so you can move through the options with the arrow keys.',
        yours:
          'Pass the error to its `UiField group`, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        without:
          'The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.',
        code: '<UiField label="Region" group :error="err"><UiRadioGroup v-model="region">…</UiRadioGroup></UiField>',
      },
      UiListField: {
        when: 'a form is sent with this list in error',
        props: 'the error of its `UiField group`',
        guarantee:
          'When this is the first field with an error, focus moves to its input so you can correct or add an entry immediately. The input uses the enclosing field’s id and error message.',
        yours:
          'Pass the error to its `UiField group`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        limit:
          'A draft refused by `check` is not the form’s error: it reads as invalid to a screen reader, yet Save sends, and the focus stays on Save.',
        without:
          'The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.',
        code: '<UiField label="Tags" group :error="err"><UiListField … /></UiField>',
      },
      UiInput: {
        when: 'a form is sent with this field in error',
        props: '`invalid`, or the error of its UiField',
        guarantee:
          'When this is the first field with an error, focus moves into it so you can correct the value immediately. A red border and focus ring make the field easy to find.',
        yours:
          'Set `invalid`, or pass the error to its UiField. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        without:
          'The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.',
        code: '<UiField :error="err"><UiInput v-model="email" /></UiField>',
      },
      UiField: {
        when: 'a form is sent with this field in error',
        props: '`error`',
        guarantee:
          'The control is marked invalid so the form can find it, bring it into view and move focus to it. In a `group` field, focus goes to the selected radio option, or the first if none is selected.',
        yours:
          'Pass the error in `error`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        without:
          'The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.',
        code: '<UiField label="Seat" group :error="err">…</UiField>',
      },
      UiDropzone: {
        when: 'a required file is missing on submit',
        props: '`invalid`, or the error of its UiField',
        guarantee:
          'When the dropzone is the first field with an error, keyboard focus lands on its Browse button, and the zone shows a red dashed border, so you can open the file picker straight away.',
        yours:
          'Set `invalid`, or pass the error to its UiField. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        without:
          'The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.',
        code: '<UiField :error="err"><UiDropzone v-model="files" /></UiField>',
      },
      UiCodeInput: {
        when: 'a code is wrong or missing on submit',
        props: '`invalid`, or the error of its UiField',
        guarantee:
          'When the code is the first field with an error, keyboard focus lands in its input, and the cells show a red border and halo, so you can type the code again straight away.',
        yours:
          'Set `invalid`, or pass the error to its UiField. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        without:
          'The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.',
        code: '<UiField :error="err"><UiCodeInput v-model="code" /></UiField>',
      },
      UiCheckbox: {
        when: 'a required box is left empty on submit',
        props: '`invalid`, or the error of its UiField',
        guarantee:
          'When the box is the first field with an error, keyboard focus lands on it, drawn with a red border, so you can tick it from the keyboard straight away.',
        yours:
          'Set `invalid`, or pass the error to its UiField. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        without:
          'The form does not send, keyboard focus stays on Save, and you have to find the box that needs a tick yourself.',
        code: '<UiField :error="err"><UiCheckbox v-model="terms">I accept the terms</UiCheckbox></UiField>',
      },
      UiModal: {
        when: 'a window with `form` is sent, and the app marks a field with an error',
        props: '`form`, a field with `error` (`aria-invalid`) set as the submit is checked',
        guarantee:
          'The dialog moves keyboard focus to the first field with an error and scrolls it into view, so you can start correcting immediately. A shake shows that the submission was rejected. Once you start correcting, Save becomes available for another attempt.',
        yours:
          "Check the form in your `submit` handler and set the field's `error` there, before any `await`: the window looks for the first error right after the submit. An error the server returns after an `await` is focused when `submitting` falls: keep `submitting` true while the request is out and mark the field no later than you lower it. In a custom form, mark the field, wait for the render (`await nextTick()`), then call `focusInvalid(root)` from `grani-ui` with an element of yours around the fields.",
        without:
          'The error appears under its field while keyboard focus stays on Save, and you have to find what went wrong.',
        code: '<UiModal v-model:open="open" title="New client" form @submit="save">\n  <UiField label="Email" :error="emailError"><UiInput v-model="email" /></UiField>\n</UiModal>',
      },
      UiStepper: {
        when: 'a form is sent with this field in error',
        props: '`error` on UiField',
        guarantee: 'When this is the first field with an error, the focus moves into the count.',
        yours: 'Nothing.',
        without: 'Keyboard focus stays on Save, and you look for the count yourself.',
        code: '<UiField label="Guests" :error="err"><UiStepper v-model="guests" /></UiField>',
      },
      UiListItem: {
        when: 'a form is sent with a setting row in error',
        props: '`error`',
        guarantee:
          'The row marks its control invalid, so when it is the first field with an error, keyboard focus lands on the control.',
        yours:
          'Pass the error in `error`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.',
        without: 'Keyboard focus stays on Save, and you look for the row yourself.',
        code: '<UiListItem as="label" title="Accept the terms" :error="err">…</UiListItem>',
      },
    },
  },
  oneNameOneVoice: {
    title: 'Name each field once for screen readers',
    label: 'One name',
    summary:
      'A screen reader announces each field’s name once, followed by its hint or error. UiField connects those messages to the control they describe. Repeated text, such as a tooltip that matches an icon button’s name, is not announced twice.',
    why: 'You can understand what a field asks for and how to correct it without guessing from a placeholder or listening to the same label twice.',
    who: 'library',
    moment: 'form',
    proof: {
      UiButtonGroup: [
        'in a group field the legend names it and the error describes it',
        'its own ariaLabel wins over the legend',
      ],
      UiIconButton: 'ariaLabel is the accessible name; no tooltip and no title show it',
      UiTooltip: 'a hint equal to the trigger name is not wired as its description',
      UiTimePicker: 'inside UiField with a description it is named once and described once',
      UiTextarea: [
        'inside UiField with a description it is named once and described once',
        'warns in dev when it has no name',
      ],
      UiSwitch: [
        'with its own text inside UiField it is named by that text, as UiCheckbox',
        'slot text and ariaLabel together emit one name',
      ],
      UiSelect: [
        'takes id, required, error and description from the field',
        'a standalone listbox takes the ariaLabel',
      ],
      UiListField:
        'inside UiField group the input is named by the legend and described by the error',
      UiScaleInput: 'inside UiField the label names the group and the description describes it',
      UiRadioGroup: 'the name is the label text; the description and meta are read once after it',
      UiPasswordField: [
        'inside UiField the input takes the field id and the label names it',
        'inside a UiField with no label the input keeps its ariaLabel',
        'the copy button says it copies the password',
      ],
      UiField: [
        'labels the control through a generated id',
        'warns in dev when a field holds two controls',
        'a bare element in a group field takes labelId for aria-labelledby and gets no id',
        'a required group of input and select marks the legend once, not each control',
      ],
      UiStepper: [
        'inside UiField the label points at the count, and the error and required reach it',
        'the buttons are named by what they change: Decrease Guests, Increase Guests',
      ],
      UiListItem: [
        'the title names the control, the description describes it, the row is its label',
        'two controls in one label row warn in dev: a label names one',
      ],
    },
    at: { UiField: 'Base' },
    holds: {
      UiTimePicker: {
        when: 'it needs a name',
        props: 'a UiField around it, or `ariaLabel`',
        guarantee:
          "A screen reader announces it once, by the field's label or by `ariaLabel`, with the time as the locale writes it; the description and the error are announced with it, once.",
        yours: 'Put it in a UiField with a `label`, or give it `ariaLabel`.',
        without: 'A time field announced only by its placeholder.',
        code: '<UiField label="Starts at"><UiTimePicker v-model="start" /></UiField>',
      },
      UiTextarea: {
        when: 'it needs a name',
        props: 'a UiField around it, or `ariaLabel`',
        guarantee:
          'A screen reader announces the field’s label or `ariaLabel`, followed by its description and error, each once. The placeholder is never used as its name, and a missing name triggers a development warning.',
        yours: 'Put it in a UiField with a `label`, or give it `ariaLabel`.',
        without: 'A textarea named only by its placeholder, which disappears as soon as you type.',
        code: '<UiField label="Bio"><UiTextarea v-model="bio" /></UiField>',
      },
      UiSwitch: {
        when: 'it needs a name',
        props: 'the default slot, `ariaLabel`, or a UiField around it',
        guarantee:
          'A screen reader gets one name: the switch’s text, then `ariaLabel` if there is no text, then the surrounding UiField’s label if neither is provided. The field’s description and error are announced with it.',
        yours:
          'Give it words in the default slot, or `ariaLabel`; a switch with no name warns in development.',
        without: 'A switch announced with two names, or with none.',
        code: '<UiSwitch v-model="summary">Weekly summary</UiSwitch>',
      },
      UiSelect: {
        when: 'it needs a name',
        props: 'a UiField around it, or `ariaLabel`',
        guarantee:
          "The select and its open list are announced once, by the field's label or by `ariaLabel`; the description and the error are announced with it.",
        yours: 'Put it in a UiField with a `label`, or give it `ariaLabel`.',
        without: 'A list announced with two names, or a select named only by its placeholder.',
        code: '<UiField label="Currency"><UiSelect v-model="currency" :items="currencies" /></UiField>',
      },
      UiScaleInput: {
        when: 'it sits in a field',
        props: 'a `UiField group` around it, or `ariaLabel`',
        guarantee:
          "The field's label names the scale as a whole, and the description or the error is announced with it, once; each step keeps its own short name.",
        yours: 'Put it in a UiField with `group`, or give it `ariaLabel`.',
        without: 'A scale announced with two names, or with none.',
        code: '<UiField label="Difficulty" group><UiScaleInput v-model="difficulty" /></UiField>',
      },
      UiRadioGroup: {
        when: 'its options have descriptions',
        props: '`description`, `#meta`',
        guarantee:
          'Each radio is named by its own words alone; its `description` and `#meta` are announced once, after the name.',
        yours: 'Put the name in the slot, and the rest in `description` or `#meta`.',
        without: 'A radio whose announced name runs on into its description.',
        code: '<UiRadio value="team" description="Up to 10 seats">Team</UiRadio>',
      },
      UiListField: {
        when: 'it sits inside a UiField with `group`',
        props: '`ariaLabel`, the placeholder, or the legend',
        guarantee:
          "The input is named once, by the field's legend or by its own `ariaLabel`, and the field's error is announced as its description.",
        yours: 'Name the list by what it holds, such as Tags or Allowed domains.',
        without: 'An input announced with two names, or only by its placeholder.',
        code: '<UiField label="Tags" group><UiListField … /></UiField>',
      },
      UiPasswordField: {
        when: 'it sits in a field',
        props: '`ariaLabel`, or the label of its UiField',
        guarantee:
          "The input is named by the field's label, or by `ariaLabel` when the field has no label; the show, copy and generate buttons have names of their own, such as “Copy the password”.",
        yours: 'Put it in a UiField with a `label`, or give it `ariaLabel`.',
        without: 'Three unnamed buttons beside an unnamed input.',
        code: '<UiField label="New password"><UiPasswordField v-model="password" /></UiField>',
      },
      UiField: {
        when: 'it wraps any control',
        props: '`label`',
        guarantee:
          'A screen reader identifies the control by its label and reads its hint or error with it. The field connects the label to the control through its id, or through `labelId` when the control cannot use a native label. Two controls in one field trigger a development warning.',
        yours: 'Keep one control per field; put a row of controls in a field with `group`.',
        without: 'A control announced twice, or with no name, and its hint never announced.',
        code: '<UiField label="Name"><UiInput v-model="name" /></UiField>',
      },
      UiButtonGroup: {
        when: 'it holds a row of joined buttons',
        props: '`ariaLabel`, or a `UiField group` around it',
        guarantee:
          "The group is named once: by its own `ariaLabel`, or by the legend of the `UiField group` around it, with the field's description or error announced as its description. Its own `ariaLabel` wins over the legend, and each button keeps its own name.",
        yours:
          'Name the group by what its buttons do together, such as Pagination or Message actions; a group with no name warns in development.',
        limit:
          'Inside a UiField without `group`, the input in the group is the named control, and the group takes no name from the field.',
        without:
          'A screen reader encounters several buttons with no explanation of what they do together.',
        code: '<UiButtonGroup ariaLabel="Message actions">…</UiButtonGroup>',
      },
      UiIconButton: {
        when: 'it shows an icon with no text',
        props: '`ariaLabel`, required',
        guarantee:
          'Its name comes from `ariaLabel` alone, and the icon is hidden from screen readers. On its own it shows no tooltip; a UiTooltip around it shows the name on screen, and a screen reader does not announce it a second time.',
        yours:
          'Name the action, not the icon: Send a reminder, not Bell. Wrap it in UiTooltip where people need to see the name.',
        limit:
          'While it is off with a `disabledReason`, the tooltip shows the reason in place of the name; a screen reader still hears the name, then the reason.',
        without:
          'An icon announced only as “button”, or its name announced twice: once as the label and again as the hint.',
        code: '<UiTooltip content="Settings"><UiIconButton :icon="Settings" ariaLabel="Settings" /></UiTooltip>',
      },
      UiTooltip: {
        when: 'its hint repeats the name of its trigger, as on an icon button',
        props: "`content` equal to the trigger's `ariaLabel`",
        guarantee:
          "When the hint matches the trigger's `aria-label` letter for letter, it is not connected as a description, so a screen reader announces the name once; a hint that adds something is announced as the trigger's description.",
        yours:
          'Name an icon button with `ariaLabel`, and use the hint to add what the name does not say.',
        without:
          'A screen reader announces “Columns, Columns”: the name, then the same word as its description.',
        code: '<UiTooltip content="Columns">\n  <UiIconButton :icon="Columns3" ariaLabel="Columns" />\n</UiTooltip>',
      },
      UiStepper: {
        when: 'it stands in a UiField, or takes `ariaLabel`',
        props: 'none',
        guarantee:
          'The count is named once, by its label, and each button says what it changes: Decrease Guests.',
        yours: 'Nothing.',
        without: 'Two buttons with no name, and a count read with none.',
        code: '<UiField label="Guests"><UiStepper v-model="guests" /></UiField>',
      },
      UiListItem: {
        when: 'it is a setting row with `as="label"`',
        props: '`as="label"`, `title`',
        guarantee:
          'The title names the control in `#actions` once, and the description is read with it.',
        yours: 'Put one control in `#actions`, with no text or `ariaLabel` of its own.',
        without:
          'A switch at the end of a row with no name, or a name other than the words beside it.',
        code: '<UiListItem as="label" title="Weekly digest"><template #actions><UiSwitch v-model="digest" /></template></UiListItem>',
      },
    },
  },
  madeIsSeen: {
    title: 'See the password you generate',
    label: 'Password shown',
    summary:
      'Generate a password to see it in plain text and copy it before saving. Clearing the field turns password hiding back on, so the next password you type is hidden.',
    why: 'You never save a password you have not seen and could not type again on another device.',
    who: 'library',
    moment: 'form',
    proof: {
      UiPasswordField: [
        'generate fills the field, shows it and says so; the copy button wakes up',
        'hides the password again once the value is emptied',
      ],
    },
    at: { UiPasswordField: 'Base' },
    holds: {
      UiPasswordField: {
        when: 'a password is generated',
        props: 'none; Generate is the button at the end',
        guarantee:
          'The generated password appears in plain text and the copy button becomes available once the app accepts the value. Clearing the field turns password hiding back on for the next password you type.',
        yours:
          'Bind the field with `v-model`; the generated password appears when the app accepts the new value. Use `@generate` to copy it into a repeat-password field.',
        without: 'A password set behind dots that you never saw and cannot type again.',
        code: '<UiPasswordField v-model="password" @generate="repeat = $event" />',
      },
    },
  },
  madeIsNotSpoken: {
    title: 'Announce a new password without reading it',
    label: 'Not read aloud',
    summary:
      'When a generated password is accepted by the app, a screen reader confirms “New password generated” without reading the password itself. Generate another one and the confirmation is announced again.',
    why: 'You get confirmation that generation worked without the password being read out where others can hear it.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiPasswordField:
        'says a password was generated, without saying it, and says it again on a second generate',
    },
    at: { UiPasswordField: 'Base' },
    holds: {
      UiPasswordField: {
        when: 'you generate a password',
        props: 'none',
        guarantee:
          'Each password the app accepts is confirmed to a screen reader without including the password in the announcement. Generating another one repeats the confirmation.',
        yours: 'Nothing.',
        without: 'The confirmation reads the new password aloud, so anyone nearby can hear it.',
        code: '<UiPasswordField v-model="password" />',
      },
    },
  },
  strongOnOffer: {
    title: 'Generate a password instead of inventing one',
    label: 'Strong on offer',
    summary:
      'Press Generate to get a random password, 16 characters long by default, with an uppercase letter, a lowercase letter, a digit and a symbol. The app must still check any other requirements of its password policy.',
    why: 'You get a ready-made password without inventing one or assembling the required character types yourself.',
    who: 'library',
    moment: 'form',
    proof: {
      generatePassword: 'every generated password holds a lower, an upper, a digit and a symbol',
      UiPasswordField: 'generate fills the field, shows it and says so; the copy button wakes up',
    },
    at: {},
    holds: {
      UiPasswordField: {
        when: 'you set a new password',
        props: '`length` (16 by default, never under 10)',
        guarantee:
          'Generate is one press away, and the password it gives has a lowercase letter, an uppercase letter, a digit and a symbol, at the length set by `length`.',
        yours:
          'Set `length` where your policy asks for more than 16 characters; a value under 10 is raised to 10. Check any other rule of your policy yourself.',
        without: 'You are left to invent a password that the policy may refuse.',
        code: '<UiPasswordField v-model="key" :length="32" />',
      },
    },
  },
  errorTakesTheHintsPlace: {
    title: 'Show the error where the hint was',
    label: 'Error replaces hint',
    summary:
      'The hint below a field and its error share the same place: when the value has an error, the explanation replaces the hint, and when the error clears, the hint returns. A screen reader announces the error and identifies the field as invalid.',
    why: 'You find the correction where you were already reading the instructions, and the fields below do not move to make room for a second message. A longer error can still increase the field’s height.',
    who: 'library',
    moment: 'form',
    proof: {
      UiField: [
        'an error is announced, marks the control invalid and replaces the description; the label keeps its ink',
        'when the error clears the description returns and the wiring follows',
      ],
      UiListItem: [
        'an error replaces the description, is an alert and marks the control invalid',
        'When the error clears, the description comes back and describes the control again.',
      ],
    },
    at: { UiField: 'Error' },
    holds: {
      UiField: {
        when: 'an error appears under a field that has a description',
        props: '`description`, `error`',
        guarantee:
          'The error takes the hint’s place, so you can find the correction where you were already reading the instructions. If it fits in the same space, the fields below do not move. A screen reader announces the error and the control’s invalid state. The label keeps its usual color, and the hint and its connection to the control return when the error clears.',
        yours: 'Write the error as an instruction for fixing the value, about as long as the hint.',
        without:
          'The error stacks under the hint, the field grows, and the next field jumps down under the pointer.',
        code: '<UiField label="Email" description="We send the receipt here." :error="err">…</UiField>',
      },
      UiListItem: {
        when: 'a setting row with a description shows an error',
        props: '`description`, `error`',
        guarantee:
          'The error takes the description’s place and is announced, and the control is marked invalid. When the error clears, the description comes back.',
        yours: 'Write the error as what to do, about as long as the description.',
        without:
          'The error stacks under the description, and a screen reader does not hear it with the control.',
        code: '<UiListItem as="label" title="Accept the terms" description="Needed before the first payout." :error="err">…</UiListItem>',
      },
    },
  },
  requiredInWords: {
    title: 'Announce required fields in words',
    label: 'Required in words',
    summary:
      'A required field shows an asterisk and is announced as required, so you can identify it visually and with a screen reader. For a group, such as radio options or a scale, the requirement is announced once with the group’s label. The app still checks that an answer has been given.',
    why: 'People who cannot see the asterisk still learn which answers they must give before they send the form.',
    who: 'library',
    moment: 'form',
    proof: {
      UiScaleInput:
        'required on the scale says aria-required standalone and stays silent inside a group field',
      UiRadioGroup:
        'required on the group says aria-required and puts required on each input; inside a group field it stays silent',
      UiInput: 'inside UiField it takes the id, the error and required from the field',
      UiField: [
        'required puts an asterisk on the label and aria-required on the control',
        'a required group of radios hears "required" once, from the legend',
        'a required field around a dropzone says required in words',
      ],
      UiStepper:
        'inside UiField the label points at the count, and the error and required reach it',
      UiListItem: 'required puts an asterisk on the title and aria-required on the control',
    },
    at: {
      UiField: 'Required',
    },
    holds: {
      UiScaleInput: {
        when: 'an answer is needed',
        props: '`required`, or a required `UiField group`',
        guarantee:
          'On its own, the scale is announced as required (`aria-required`); inside a required `UiField group`, the legend says it once instead. The requirement is only announced: the browser does not check it when the form is sent.',
        yours: 'Set `required`, and check for `null` before you save.',
        without: 'An asterisk that a screen reader skips.',
        code: '<UiScaleInput v-model="effort" required aria-label="Effort" />',
      },
      UiRadioGroup: {
        when: 'an answer is needed',
        props: '`required`, or a required `UiField group`',
        guarantee:
          'The group is announced as required. With its own `required`, each radio carries native `required` too, so a native form checks that an answer was chosen; inside a required `UiField group`, the legend says it once instead.',
        yours:
          'Set `required` on the group, or on the UiField around it, and check for `null` before you save.',
        limit:
          'A required `UiField group` only says it: the browser checks the group’s own `required`, not the field’s.',
        without: 'An asterisk that a screen reader skips.',
        code: '<UiRadioGroup v-model="plan" required>…</UiRadioGroup>',
      },
      UiInput: {
        when: 'it must be filled',
        props: '`required` on its UiField',
        guarantee:
          'Inside a required UiField, the input is announced as required (`aria-required`), and the field draws the asterisk.',
        yours: 'Set `required` on the UiField.',
        without: 'An asterisk that a screen reader skips.',
        code: '<UiField label="Email" required><UiInput v-model="email" /></UiField>',
      },
      UiField: {
        when: 'a field must be filled',
        props: '`required`',
        guarantee:
          'The label shows an asterisk, and `aria-required` identifies the requirement to a screen reader. In a `group`, “required” is included once with the group’s label. For a dropzone, it is included in the Browse button’s description.',
        yours: 'Set `required` on the field instead of typing an asterisk into the label.',
        without:
          'The asterisk is visible, but a screen reader does not announce it, so some people discover the requirement only when the form is rejected.',
        code: '<UiField label="Email" required>…</UiField>',
      },
      UiStepper: {
        when: 'it must be filled',
        props: '`required` on UiField',
        guarantee:
          'Inside a required UiField, the count is announced as required, and the field draws the asterisk.',
        yours: 'Nothing.',
        without: 'An asterisk that a screen reader skips.',
        code: '<UiField label="Guests" required><UiStepper v-model="guests" /></UiField>',
      },
      UiListItem: {
        when: 'a setting row must be answered',
        props: '`required`',
        guarantee:
          'The title shows an asterisk, and the control in `#actions` is announced as required (`aria-required`).',
        yours:
          'Set `required` on the row instead of typing an asterisk into the title. The app still checks the answer.',
        without: 'An asterisk that a screen reader skips.',
        code: '<UiListItem as="label" title="Accept the terms" required>…</UiListItem>',
      },
    },
  },
  labelOpens: {
    title: 'Open a field from its label',
    label: 'Label opens',
    summary:
      'Clicking a field’s label works as it does for a text field, where it puts the cursor in: it presses the control. A select opens its list and a dropzone its file dialog, so the label is as good a target as the field itself.',
    why: 'The label is a larger target right above the field. A click on it reaches the field instead of doing nothing.',
    who: 'library',
    moment: 'form',
    proof: {
      UiField: [
        'the label resolves to the control, so a click on it focuses the control',
        'a click on the label of a select opens its list, as a click on the select does',
        'a click on the label of a dropzone opens the file dialog, as Browse does',
      ],
    },
    at: { UiField: 'Base' },
    holds: {
      UiField: {
        when: 'it holds a single control',
        props: 'none: any UiField',
        guarantee:
          'A click on the label presses the control, as it puts the cursor in a text field: a select opens its list and a dropzone its file dialog. It holds for the control the label points at by its id.',
        yours: 'Nothing.',
        limit:
          'A radio group and a scale take a `group` field, whose legend presses nothing: each option takes its own click.',
        without:
          'A label set above the control by hand and not tied to it: a click on it does nothing, and the list opens only from the select itself.',
        code: '<UiField label="Currency"><UiSelect v-model="currency" :items="CURRENCIES" /></UiField>',
      },
    },
  },
  numberByArrows: {
    title: 'Change a number with the arrow keys',
    label: 'Arrows step',
    summary:
      'ArrowUp increases a number and ArrowDown decreases it, without retyping and without moving the text cursor. Changes follow the configured step while preserving finer decimal precision when the value has it. The arrows stop at the minimum and maximum, but typed values still need validation. On a scale, the arrow keys change the answer, and Home and End reach the endpoints.',
    why: 'You can make small changes without the mouse and without typing the number again.',
    who: 'library',
    moment: 'form',
    proof: {
      UiScaleInput: [
        'one tab stop, on the mark; arrows, Home, End move it and Delete clears',
        'ArrowUp at max and ArrowDown at min emit nothing',
      ],
      UiInput: [
        'ArrowUp and ArrowDown step and do not move the caret; other keys pass',
        'ArrowUp at max and ArrowDown at min emit nothing',
        'a step keeps the caret where it was',
        'an arrow stops at a bound off the step grid, by key and by button',
        'a step writes plain digits, never an exponent, and keeps the cents it was written with',
      ],
      UiStepper: [
        'the buttons rest at the bounds and while disabled; the keyboard steps too',
        'pressing minus or plus with a pointer keeps the focus and the caret in the count',
        'minus and plus at the edges, the count centered in monospace, step 1 by default',
      ],
    },
    at: { UiInput: 'Numbers', UiStepper: 'Base' },
    holds: {
      UiScaleInput: {
        when: 'you set the answer from the keyboard',
        props: 'none',
        guarantee:
          'The arrow keys move the answer from the step that has keyboard focus, Home and End jump to the ends, and an arrow key past an end changes nothing.',
        yours: 'Nothing.',
        without: 'A row of buttons that the arrow keys do not move.',
        code: '<UiScaleInput v-model="difficulty" />',
      },
      UiInput: {
        when: 'it is `numeric` with a `step`',
        props: '`numeric`, `step`, `min`, `max`',
        guarantee:
          'ArrowUp and ArrowDown, or the Increase and Decrease buttons, adjust the value without moving the text cursor. Changes follow the step and decimal-precision rules, keep the digits the value was written with (10.99 goes to 11.00), and stop at `min` and `max`, including a bound off the step’s grid. The buttons are skipped when tabbing, so Tab continues to the next field.',
        yours:
          'Pass `step`, and `min` and `max` where the value has bounds. Check typed values yourself: only the arrows stop at the bounds.',
        without: 'The only way to change a number is to type it again.',
        code: '<UiInput v-model="qty" numeric :step="1" :min="0" />',
      },
      UiStepper: {
        when: 'always: its minus and plus, and ArrowUp and ArrowDown in the count',
        props: '`step`, `min`, `max`',
        guarantee:
          'Minus, plus and the arrow keys move the count by the step and stop at `min` and `max`. A press leaves the focus in the count, so the arrow keys go on from there.',
        yours: 'Pass `min` and `max` where the count has bounds, and `step` if it is not 1.',
        limit:
          'Typing is not clamped: a count typed past `max` stays as typed, and the form checks it.',
        without:
          'Buttons beside a field that take the focus, so the next arrow key goes nowhere, and a count that runs past its bounds.',
        code: '<UiStepper v-model="guests" :min="1" :max="9" ariaLabel="Guests" />',
      },
    },
  },
  markSaysItsWord: {
    title: 'Announce scale steps with their meaning',
    label: 'Ends named',
    summary:
      'A screen reader announces both the position on a scale and what its endpoints mean. For example, a middle value is “7 of 10”, while the endpoints can be “1 of 10, easy” and “10 of 10, hard”.',
    why: 'You can choose an answer knowing which end means easy or hard, even when you cannot see the labels below the scale.',
    who: 'library',
    moment: 'form',
    proof: { UiScaleInput: 'the first and last radio name their end words' },
    at: { UiScaleInput: 'Base' },
    holds: {
      UiScaleInput: {
        when: 'its ends mean something',
        props: '`lowLabel`, `highLabel`',
        guarantee:
          'Each step is named by its number out of the total, “7 of 10”, and the first and last add their end words: “1 of 10, easy”, “10 of 10, hard”.',
        yours: 'Write the end words in `lowLabel` and `highLabel`.',
        without:
          'Steps named by their number alone: the words under the ends are printed, but never announced with the step.',
        code: '<UiScaleInput v-model="difficulty" low-label="easy" high-label="hard" />',
      },
    },
  },
  levelNotByColour: {
    title: 'Name states in words, not color alone',
    label: 'Words, not only color',
    summary:
      'You can identify a status without its color: a badge says “Paid” or “Overdue”, a scale shows its numbers, and a screen reader announces whether a change is better or worse. Color reinforces the meaning. A badge without text triggers a development warning.',
    why: 'The state stays readable for people who do not tell colors apart, in grayscale, and with a screen reader.',
    who: 'library',
    moment: 'form',
    proof: {
      UiScaleInput: [
        'thermometer numerals take the ink that reads on their stop',
        'empty numerals read in the body ink on their track',
      ],
      UiBadge: [
        'The words name the state in every form, from the label or the slot.',
        'A badge with no words is a bare color and warns in development.',
      ],
      UiListItem: [
        'A notice says its tone in words before its title, not by color alone.',
        'each tone of a notice draws its own glyph, and #media replaces it',
      ],
      UiLink: 'is underlined at rest: a touch screen has no hover',
      UiDelta: 'says better or worse for a screen reader, not only in color',
    },
    at: { UiBadge: 'Tones' },
    holds: {
      UiDelta: {
        when: 'it shows a change',
        props: 'none: every UiDelta',
        guarantee:
          'The sign appears in the badge beside the color, and a screen reader announces the change with a word: “+12%, better”, “-8%, worse”.',
        yours: 'Set `invert` when lower is better, so the word agrees with the color.',
        without:
          'A green or red pill whose meaning is lost on anyone who does not tell the colors apart.',
        code: '<UiDelta :current="112" :previous="100" label="vs August" />',
      },
      UiScaleInput: {
        when: 'the fill is colored by the answer',
        props: '`variant="thermometer"`, `invert`',
        guarantee:
          'The color comes with the number on each segment and with the readout, such as “7 / 10”; each number takes a text color that stays readable on its segment, filled or empty.',
        yours: 'Keep the numbers or the readout visible.',
        without: 'A bar that turns red with no number to say how far.',
        code: '<UiScaleInput v-model="energy" variant="thermometer" />',
      },
      UiLink: {
        when: 'it sits in a line of text',
        props: 'none: every UiLink',
        guarantee:
          'It is underlined at rest in its own color, so it stands apart from the words around it without relying on color, or on hover, which a touch screen does not have.',
        yours: 'Nothing. Do not remove the underline to make a link quieter; use `tone="neutral"`.',
        without:
          'A link distinguished by color alone looks like ordinary text to anyone who cannot see that difference.',
        code: '<UiLink to="/orders/1041">the order</UiLink>',
      },
      UiListItem: {
        when: 'it is a notice: a plain row with `tone`',
        props: '`tone`',
        guarantee:
          "A screen reader announces its tone in a word before the title (Note, Done, Warning, Error), and the tone's icon is drawn beside the colored edge, so color never carries the tone alone.",
        yours:
          'Write the title and the text; the tone word comes from the library. An icon of your own in `#media` must show the tone as plainly.',
        limit:
          "An icon given in `#media` replaces the tone's icon, and the row cannot check that yours still shows the tone.",
        without: 'A colored edge alone: in grayscale, a warning and a success look the same.',
        code: '<UiListItem tone="warning" title="Rate missing" description="Add the June rate." />',
      },
      UiBadge: {
        when: 'it shows a status or a tag',
        props: '`label` or the default slot, with a `tone`',
        guarantee:
          'Its words name the state in every variant, and its tone only adds to them; a badge with no words warns in development that it is a bare color.',
        yours:
          'Give every badge its word, such as Paid or Overdue, and use the same word for the same state everywhere.',
        limit: 'It does not choose the word for you; a tone alone is not a name.',
        without:
          'Colored dots alone: in grayscale, or for someone who does not tell red from green, Paid and Overdue look the same.',
        code: '<UiBadge tone="danger" label="Overdue" />',
      },
    },
  },
  newTabSaid: {
    title: 'Know when a link opens a new tab',
    label: 'New tab said',
    summary:
      'Before opening a link, you can tell whether it will use a new tab: an arrow follows the text, and a screen reader announces “opens in a new tab”. Links to another site use this behavior by default. Mail and phone links can open another app, so they do not carry the new-tab notice.',
    why: 'You know that the original page will remain open and that you can return to it by switching tabs.',
    who: 'library',
    moment: 'open',
    proof: {
      UiLink: [
        'an external address opens in a new tab, safely, and says so to a screen reader',
        'an external link draws an arrow after the text, an internal one does not',
        'target overrides the default, and the screen-reader notice follows the real target',
      ],
      UiButton: [
        'an address with a protocol opens in a new tab and says so',
        'a new tab is seen as well as said: an arrow, and a caller target gets rel and the notice',
      ],
      UiListItem: [
        'a row linking to another site opens in a new tab and says so',
        'a row to another site ends in the new-tab arrow, not the chevron',
      ],
    },
    at: { UiLink: 'Base' },
    holds: {
      UiLink: {
        when: 'its address is another site, or it has `target="_blank"`',
        props: '`to` with an absolute address',
        guarantee:
          'You see an arrow after the last word, a screen reader announces “opens in a new tab” after the text, and the new tab opens without access to the page that opened it.',
        yours:
          'Pass the address in `to`. To open it in the current tab, set `target="_self"`; this also removes the new-tab arrow and announcement.',
        limit:
          'Any absolute URL is treated as an external link, even if it points to the app’s own site. Use `target="_self"` when that link should open in the current tab.',
        without:
          'A new tab opens without warning: Back does nothing there, and a screen reader gives no sign that the page moved to another tab.',
        code: '<UiLink to="https://help.example.com">the help center</UiLink>',
      },
      UiButton: {
        when: 'its `to` is another site, or it has `target="_blank"`',
        props: '`to`',
        guarantee:
          'It shows the same arrow after its label as a link does, and a screen reader announces “opens in a new tab” in the same way.',
        yours: 'Pass the address in `to`; nothing else is needed.',
        without:
          'Pressing the button opens another tab without warning, and Back there does not return to this page.',
        code: '<UiButton to="https://status.example.com">Status page</UiButton>',
      },
      UiListItem: {
        when: 'the whole row is a link to another site',
        props: '`to`',
        guarantee:
          'The row opens the site in a new tab and ends in an arrow instead of the chevron, and a screen reader announces “opens in a new tab” after the row’s title.',
        yours: 'Pass the address in `to`; nothing else is needed.',
        without: 'The row opens another tab without saying so.',
        code: '<UiListItem to="https://docs.example.com" title="Guide" />',
      },
    },
  },
  markTakenBack: {
    title: 'Take back a scale answer',
    label: 'Answer cleared',
    summary:
      'Click the selected value again, or press Delete or Backspace, to clear the answer to `null`. Space and Enter select an answer and never clear it. With `clearable` turned off, an answer cannot be cleared once given.',
    why: 'You can withdraw an answer given by mistake, or one that no longer applies, instead of being forced to leave some value.',
    who: 'library',
    moment: 'form',
    proof: {
      UiScaleInput: [
        'a click picks; a click on the mark clears unless clearable is off',
        'Delete and Backspace obey clearable=false',
        'Space on the mark keeps it',
      ],
    },
    at: { UiScaleInput: 'Base' },
    holds: {
      UiScaleInput: {
        when: 'an answer may be withdrawn',
        props: '`clearable`, on by default',
        guarantee:
          'A click on the chosen step, Delete or Backspace clears the answer to `null`; Space and Enter never clear. With `clearable` off, an answer once given stays.',
        yours: 'Treat `null` as no answer.',
        without: 'As with native radios, once a step is checked, the answer cannot be taken back.',
        code: '<UiScaleInput v-model="pain" low-label="none" high-label="worst" />',
      },
    },
  },
  centStaysCent: {
    title: 'Make small changes without losing decimal precision',
    label: 'Cents kept',
    summary:
      'The arrows adjust a price or measurement at the precision you entered. With a step of 0.1, 10.44 changes to 10.45 or 10.43, because its last decimal place is finer than the step. Results are rounded to that precision, so 0.2 plus 0.1 becomes 0.3 rather than a long string of digits.',
    why: 'A small adjustment preserves the decimal places you entered without adding rounding digits to the result.',
    who: 'library',
    moment: 'form',
    proof: { UiInput: 'a click moves by the precision of the value: a cent stays a cent' },
    at: { UiInput: 'Numbers' },
    holds: {
      UiInput: {
        when: 'a number is stepped with the arrows',
        props: '`numeric` with `step`',
        guarantee:
          'With a fractional `step`, the arrows use the value’s last decimal place when it is finer than the step: 10.44 with a step of 0.1 becomes 10.45. Results are rounded to the precision in use, so 0.2 plus 0.1 becomes 0.3.',
        yours: 'Pass `step`, and `min` and `max` where the value has bounds.',
        without:
          'A price that jumps from 10.44 to 10.54 under the arrow, or that shows 0.30000000000000004 after two clicks.',
        code: '<UiInput v-model="price" numeric :step="0.1" :min="0" />',
      },
    },
  },
  numberAsWritten: {
    title: 'Enter numbers in the app’s local format',
    label: 'Number as written',
    summary:
      'You type or paste a number the way your language writes it: “1 234,50” in Russian and “1,234.50” in English are both 1234.50. If the field cannot interpret a value unambiguously, it keeps the text as written for you to correct, and marks it invalid when you leave the field.',
    why: 'You can enter numbers in the format you are used to, without removing separators by hand. An ambiguous number waits for your correction instead of being saved as the wrong amount.',
    who: 'library',
    moment: 'form',
    proof: {
      UiInput: [
        'a comma becomes a point in the emitted value and in the control',
        'a pasted formatted number is read the way it is written',
        'a paste drops the grouping marks of the locale and keeps the magnitude',
        'a paste the locale cannot read for sure is kept as written and marked invalid',
        'typing keeps the marks as typed; the field is read on blur',
        'text with no digit in a number field is marked invalid on blur',
        'the field tells the app when the model holds text the locale cannot read for sure, and when it no longer does',
        'while a number is typed the app hears unsure at once, and the red mark waits for blur',
        'a number field mounted again over a reset model clears the app flag the last one left',
      ],
      UiStepper: [
        'a count pasted as people write it is read in the app locale',
        'a count the locale cannot read for sure tells the app, as its number field does',
      ],
    },
    at: { UiInput: 'Numbers' },
    holds: {
      UiInput: {
        when: 'a number is typed or pasted as people write it',
        props: '`numeric`',
        guarantee:
          "The number is read in the app's locale: 1,234.50 is 1234.50 in English, and 1 234,50 is 1234.50 in Russian. A pasted number with both a point and a comma, such as 1.234,56, is read by the mark that comes last. Text the locale cannot read for sure, or text with no digit at all, stays as written and is marked invalid when you leave the field.",
        yours:
          'The model contains a number written as text with a decimal point, such as `1234.50`, or `null` for an empty field. Text the field cannot read for sure reaches the model as written, and the model alone cannot tell it from a number: in Russian, 2,500 and an unsure 2.500 both arrive as `2.500`. Listen to `unsure`: it is `true` while the field holds such text, typing included, and every field says it again when it mounts, so refuse to save while it is `true`.',
        limit:
          "The locale is the app's, set with `createGrani({ locale })`. `unsure` comes right after the model it concerns, so read it when saving, not inside the `update:modelValue` handler. A locale switched at run time reads the shown text again but does not rewrite the model.",
        without:
          'A native number field that does not accept the thousands comma and hands the app an empty amount.',
        code: '<UiInput v-model="amount" numeric />',
      },
      UiStepper: {
        when: 'a count is typed or pasted as people write it',
        props: 'none',
        guarantee: 'The count is read in the app’s locale: a pasted 1 200 is 1200 in Russian.',
        yours:
          'Listen to `unsure` if the count is saved: a count the locale cannot read for sure, such as 1.200 in Russian, reaches the model as written, and `unsure` is `true` while the count holds it.',
        without: 'A pasted 1 200 the field cannot read.',
        code: '<UiStepper v-model="pieces" ariaLabel="Pieces" />',
      },
    },
  },
  eyeKeepsField: {
    title: 'Show a password without leaving the field',
    label: 'Eye keeps the cursor',
    summary:
      'Click the password visibility button to check what you typed, then continue editing immediately. Showing or hiding the characters keeps focus in the field and preserves the text cursor’s position.',
    why: 'You can check what you typed and correct it at once, without clicking back into the field and finding your place.',
    who: 'library',
    moment: 'form',
    proof: {
      UiInput: [
        'pressing the eye with a pointer keeps the focus in the value',
        'the eye keeps the caret where it was',
      ],
    },
    at: { UiInput: 'Password' },
    holds: {
      UiInput: {
        when: 'it is a password field',
        props: '`type="password"`',
        guarantee:
          'The eye button shows or hides the password without moving keyboard focus or the text cursor out of the field, so you can continue typing immediately. `v-model:passwordVisible` lets the app control visibility too.',
        yours: 'Nothing.',
        without:
          'An eye that takes keyboard focus: the next key you type does not reach the password, and you have to click back into the field.',
        code: '<UiInput v-model="password" type="password" />',
      },
    },
  },
  labelIsTarget: {
    title: 'Toggle or pick by clicking the words',
    label: 'Click the label',
    summary:
      'A click on the text of a checkbox, a switch or a radio works as a click on its box does. In a setting row, a click anywhere on the row, its title and description included, toggles its switch. Options shown as cards are picked by a click anywhere on the card: on its words, its image or its details, such as a price.',
    why: 'The words give a much larger target than the small box, switch or radio.',
    who: 'library',
    moment: 'form',
    proof: {
      UiSwitch: 'a label in the slot wraps the control, so clicking the text toggles too',
      UiCheckbox: 'the text is inside the label, so a click on it toggles',
      UiListItem:
        'A click anywhere on a setting row, its title included, toggles the switch it names.',
      UiRadioGroup: [
        'the row is the label: a click on the text selects',
        'a click anywhere on a card picks it, its media and its meta included',
      ],
    },
    at: { UiSwitch: 'Base', UiListItem: 'Setting', UiRadioGroup: 'Card' },
    holds: {
      UiRadioGroup: {
        when: 'its options are rows or cards',
        props: 'the default slot of each UiRadio; `variant="card"` or `"card-check"` for cards',
        guarantee:
          'The whole row is the label of its radio: a click on the words picks it, and a long label wraps beside the mark. A card is picked by a click anywhere on it, its words, `#media` and `#meta` included.',
        yours:
          'Put the words in the slot and the details in `description`, `#media` or `#meta`, not beside the component.',
        without:
          'A radio in a corner of the card: a click on the words or the price picks nothing.',
        code: '<UiRadioGroup v-model="plan" variant="card">…</UiRadioGroup>',
      },
      UiSwitch: {
        when: 'the switch has words',
        props: 'the default slot',
        guarantee:
          'The words sit inside the label around the switch, so a click on them toggles it, as a click on the track does; while the switch is disabled, they do not.',
        yours:
          'Put the words in the default slot; in a setting row, use UiListItem with `as="label"`.',
        without: 'Words beside the switch that only name it: a click on them does nothing.',
        code: '<UiSwitch v-model="summary">Weekly summary</UiSwitch>',
      },
      UiCheckbox: {
        when: 'its text is in the slot',
        props: 'the default slot',
        guarantee:
          'The whole row is the label: a click on the text toggles the box, and a long text wraps beside it.',
        yours: 'Put the text in the default slot, not beside the component.',
        without: 'The 18 px box is the only target, and a click on the words does nothing.',
        code: '<UiCheckbox v-model="receipt">Send me the receipt by email</UiCheckbox>',
      },
      UiListItem: {
        when: 'it is a setting row with `as="label"`',
        props: '`as="label"`, with one control in `#actions`',
        guarantee:
          "The whole row is the label of its control: a click on the title, the description or the space between toggles it, and a screen reader announces the title as the control's name.",
        yours: 'Put exactly one control in `#actions`: a label names one control.',
        limit: 'Two controls in one row warn in development, and neither gets a clear name.',
        without:
          'A click on the words does nothing; only the small switch at the end of the row responds.',
        code: '<UiListItem as="label" title="Weekly digest" description="Every Monday.">\n  <template #actions><UiSwitch v-model="digest" /></template>\n</UiListItem>',
      },
    },
  },
  mixedSaysSome: {
    title: 'Show when only some are selected',
    label: 'Some selected',
    summary:
      'See whether a selection is partial before acting on it. The select-all checkbox shows a dash when some items are selected, and a screen reader announces a mixed state. In a table, activating it selects all selectable rows on the current page; activating it when all are selected clears them.',
    why: 'You can tell a partial selection from a full one, or from none, before you act on the selected rows.',
    who: 'library',
    moment: 'work',
    proof: {
      UiCheckbox: [
        'indeterminate sets the DOM property and draws the fill',
        'a press on a mixed box that the parent does not resolve leaves the DOM mixed',
      ],
      UiTable:
        'the page checkbox selects the selectable rows, shows mixed for a part, clears when all are in',
    },
    at: { UiCheckbox: 'Select all', UiTable: 'Selectable' },
    holds: {
      UiTable: {
        when: 'some, but not all, selectable rows of the page are selected',
        props: '`selectable`',
        guarantee:
          'The page checkbox shows the dash and is announced as mixed. A press selects every selectable row of the page and leaves out rows that cannot be selected; a press when all of them are selected clears them.',
        yours: 'Nothing.',
        limit:
          'It counts only the page in view: rows selected on other pages do not count toward it.',
        without: 'The page checkbox looks empty while some rows are selected, as if nothing were.',
        code: '<UiTable v-model:selection="picked" selectable :columns="columns" :items="rows" aria-label="Invoices" />',
      },
      UiCheckbox: {
        when: 'it selects all of a group and only some items are on',
        props: '`indeterminate`',
        guarantee:
          'The box shows a dash and is announced as mixed. A press reports the new value to the app, and the box stays mixed until the app resolves it.',
        yours:
          'Set `indeterminate` while some but not all items are on, and decide what a press on the box does, for example turn them all on.',
        without: 'A select-all box that looks empty while two of three items are ticked.',
        code: '<UiCheckbox :model-value="all" :indeterminate="some" @update:model-value="setAll">All</UiCheckbox>',
      },
    },
  },
  refusedGoesBack: {
    title: 'See the value the app actually accepted',
    label: 'Back to the value',
    summary:
      'A field always shows the value the app holds, so you can tell whether an edit took effect. If the app rejects a change, the field returns to that value: a switch cannot stay on while its setting is still off. A form reset also restores the app’s current value, which is not necessarily the value saved on the server.',
    why: 'You see at once that a change did not take effect, instead of finding out later that the screen and the app disagree.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiTimePicker: 'a change the parent refuses puts the picker back on the model',
      UiTextarea: [
        'a change the parent refuses puts the textarea back on the model',
        'a refused composition goes back to the model too',
      ],
      UiSwitch: 'a change the parent refuses leaves the switch on the model',
      UiSelect: 'a change the parent refuses puts the select back on the model',
      UiListField: 'a change the parent refuses puts the input back on the model',
      UiScaleInput: 'a refused pick leaves the bar and the tab stop on the model',
      UiRadioGroup: 'a vetoed change puts the DOM back on the model',
      UiPasswordField:
        'a generate the owner refuses says nothing, reveals nothing and emits no generate',
      UiInput: 'a change the parent refuses puts the input back on the model',
      UiDropzone: 'a change the parent refuses leaves the list and the input on the model',
      UiCodeInput: 'a change the parent refuses puts the input back on the model',
      UiCheckbox: 'a vetoed change puts the DOM back on the model',
      UiStepper: 'a press of plus the parent refuses leaves the count on the model',
    },
    at: {
      UiTextarea: 'Refused',
      UiSwitch: 'Refused',
      UiCheckbox: 'Refused',
      UiRadioGroup: 'Refused',
    },
    holds: {
      UiStepper: {
        when: 'the app refuses a count, more than it has, or the form is reset',
        props: '`modelValue` with `@update:model-value`',
        guarantee:
          'If the app refuses the count a press or a key asked for, the stepper shows the count the app holds again. A form reset brings it back too.',
        yours: 'Pass the count the app holds as `modelValue`, and say why a count was refused.',
        limit:
          'The app takes or refuses a count in the same tick it is sent: a count it answers later is overtaken by the next press or key, so a count confirmed by a server is a draft the app keeps.',
        without: 'The stepper shows 6 while the app, with 5 in stock, still holds 5.',
        code: '<UiStepper :model-value="qty" @update:model-value="ask" ariaLabel="Quantity" />',
      },
      UiTimePicker: {
        when: 'the app refuses a time',
        props: '`modelValue` with `@update:model-value`',
        guarantee: 'If the app refuses the time you pick, the field shows the previous time again.',
        yours: 'Pass the time the app holds as `modelValue`, and explain why a time was refused.',
        without: 'The field shows a time the app is not using.',
        code: '<UiTimePicker :model-value="start" @update:model-value="ask" />',
      },
      UiTextarea: {
        when: 'the app refuses a change, or the form is reset',
        props: '`v-model`, or `modelValue` with `@update:model-value`',
        guarantee:
          'A refused change is undone and the text cursor stays where you were typing, so you can go on. This also holds for text composed with an input method (IME), as for Chinese or Japanese. A form reset brings back the app’s text.',
        yours: 'Pass the text the app holds as `modelValue`, and explain why a change was refused.',
        without: 'The refused words stay on the screen, although the app did not accept them.',
        code: '<UiTextarea :model-value="note" @update:model-value="take" />',
      },
      UiSwitch: {
        when: 'the app saves the change and may refuse it',
        props: '`modelValue` with `@update:model-value`, `loading`',
        guarantee:
          'You can see whether a setting changed. The switch follows the app’s value, so a rejected change leaves it in its previous position. While the app marks the update as loading, it shows progress, keeps focus and ignores further presses.',
        yours:
          'Pass the value the app holds as `modelValue`, set `loading` while the change is saved, and explain why a change was refused.',
        without: 'The switch flips on the press and stays on, while the setting is still off.',
        code: '<UiSwitch :model-value="sync" :loading="saving" @update:model-value="turn" />',
      },
      UiSelect: {
        when: 'the app refuses a choice, or the form is reset',
        props: '`v-model`, or `modelValue` with `@update:model-value`',
        guarantee:
          'If the app refuses your choice, the field shows the previous option again, and the form still sends that option. A form reset brings back the app’s value.',
        yours:
          'Pass the value the app holds as `modelValue`, and explain why a choice was refused.',
        without: 'The field shows an option the app did not accept.',
        code: '<UiSelect :model-value="kept" :items="currencies" @update:model-value="ask" />',
      },
      UiScaleInput: {
        when: 'the app refuses a mark, or the form is reset',
        props: '`v-model`, or `modelValue` with `@update:model-value`',
        guarantee:
          'If the app rejects a rating, the scale returns to the accepted value. When you Tab into it again, focus starts on that value.',
        yours: 'Pass the mark the app holds as `modelValue`, and explain why a mark was refused.',
        without: 'The bar is filled to a mark the app did not accept.',
        code: '<UiScaleInput :model-value="kept" @update:model-value="ask" />',
      },
      UiRadioGroup: {
        when: 'the app refuses a choice, or the form is reset',
        props: '`v-model`, or `modelValue` with `@update:model-value`',
        guarantee:
          'If the app refuses your choice, the previous answer is selected again. A form reset brings back the app’s answer.',
        yours: 'Pass the answer the app holds as `modelValue`.',
        without: 'An answer looks selected that the app did not accept.',
        code: '<UiRadioGroup :model-value="kept">…</UiRadioGroup>',
      },
      UiListField: {
        when: 'the app refuses a change to the text in the field',
        props: '`v-model:query`',
        guarantee:
          'The field shows the text as the app holds it, after a refused change and after a form reset.',
        yours: 'Keep `v-model:query` on the text the app holds.',
        without: 'The field shows text the app did not accept.',
        code: '<UiListField v-model:query="draft" … />',
      },
      UiPasswordField: {
        when: 'the app refuses a change, or the form is reset',
        props: '`v-model`, or `modelValue` with `@update:model-value`',
        guarantee:
          'If the app refuses a generated password, the field does not reveal it and a screen reader does not announce it. A form reset brings back the app’s value.',
        yours: 'Pass the password the app holds as `modelValue`.',
        without:
          'The field shows a generated password the app did not accept, and you might copy it.',
        code: '<UiPasswordField :model-value="kept" />',
      },
      UiInput: {
        when: 'the app refuses a change, or the form is reset',
        props: '`v-model`, or `modelValue` with `@update:model-value`',
        guarantee:
          'A refused change disappears from the field, and a form reset brings back the app’s value.',
        yours: 'Pass the value the app holds as `modelValue`.',
        without: 'The field shows text the app did not accept.',
        code: '<UiInput :model-value="kept" />',
      },
      UiDropzone: {
        when: 'the app refuses a change, or the form is reset',
        props: '`v-model`, or `modelValue` with `@update:model-value`',
        guarantee:
          'If the app refuses the files you drop or pick, the file list and the files the form would send stay as they were. After a form reset, both still match the app’s files.',
        yours: 'Pass the files the app holds as `modelValue`.',
        without: 'The list shows a file the app did not accept.',
        code: '<UiDropzone :model-value="kept" />',
      },
      UiCodeInput: {
        when: 'the app refuses a change, or the form is reset',
        props: '`v-model`, or `modelValue` with `@update:model-value`',
        guarantee:
          'If the app refuses a change, the field and its cells show the app’s code again. A form reset brings the app’s code back too.',
        yours:
          "Pass the code the app holds as `modelValue`; to clear a wrong code, set it to `''`.",
        without: 'The cells show a code the app did not accept.',
        code: '<UiCodeInput :model-value="kept" />',
      },
      UiCheckbox: {
        when: 'the app refuses a change, or the form is reset',
        props: '`v-model`, or `modelValue` with `@update:model-value`',
        guarantee:
          'The tick follows the app’s value, not your press: if the app keeps its old value, the box goes back to it.',
        yours:
          'Pass the value the app holds as `modelValue`; to refuse a change, leave that value unchanged.',
        without:
          'The box stays ticked after the change failed: the screen shows Share as on while the app has it off.',
        code: '<UiCheckbox :model-value="shared" @update:model-value="share">Share</UiCheckbox>',
      },
    },
  },
  sendsLikeNative: {
    title: 'Submit the values shown in the form',
    label: 'Sent with the form',
    summary:
      'The form sends the values you can see and review. Give each control a `name` to include it in a native form submission or `FormData`. Unchecked boxes, off switches, an empty select and disabled controls send nothing. An empty text field, a date picker with no day and a time picker with no time send an empty value. Resetting the form restores the app’s current values, so the app must clear those values to empty the form.',
    why: 'The submitted values agree with the visible fields, and developers do not have to maintain a second set of hidden inputs themselves.',
    who: 'library',
    moment: 'form',
    proof: {
      UiTimePicker: [
        'in a form it sends HH:mm under its name, and an empty value while empty',
        'a disabled picker sends nothing with a form',
      ],
      UiTextarea: [
        'in a form it sends its value under its name, nothing when disabled',
        'a form reset leaves the textarea on its model',
      ],
      UiSwitch: [
        'in a form an on switch sends its value under its name and an off one sends nothing',
        'a form reset leaves the switch on its model',
      ],
      UiSelect: [
        'an empty select sends nothing under its name',
        'a form reset leaves the select on its model, hidden input and trigger agreeing',
      ],
      UiScaleInput: 'in a form the mark sends under the name, none and disabled send nothing',
      UiRadioGroup: [
        'in a form the checked radio sends its value under the group name, and none sends nothing',
        'a form reset leaves the radios on the model, mark and DOM agreeing',
      ],
      UiPasswordField: [
        'in a form it sends the generated password under its name; a reset keeps it on its model',
        'generate and copy inside a form do not submit it',
      ],
      UiInput: [
        'in a form it sends its value under its name',
        'a form reset leaves the input on its model',
        'Enter settles the number before the form is sent, in the same task',
        'in a comma locale a native form gets the number as the field shows it, 12,5',
      ],
      UiDropzone: [
        'in a form it sends the files under its name',
        'a form reset leaves the native input on its model',
      ],
      UiDatePicker: [
        'name sends the day with a form',
        'a disabled picker sends nothing with a form',
        'a value that is no day shows empty, has no cross, sends an empty value, and warns in dev',
      ],
      UiCodeInput: [
        'in a form it sends the code under its name',
        'a form reset leaves the input on its model, cells and DOM agreeing',
      ],
      UiCheckbox: [
        'in a form a checked box sends its value and an empty one sends nothing',
        'a form reset leaves the box on its model, glyph and DOM agreeing',
      ],
      UiStepper:
        "in a form it sends its count under its name, and a reset puts the app's count back",
    },
    at: { UiDatePicker: 'Base', UiInput: 'Form' },
    holds: {
      UiDatePicker: {
        when: 'it sits inside a native form',
        props: '`name`',
        guarantee:
          'It sends the day as `YYYY-MM-DD` under its `name`, the day the field shows, and an empty value while it has none.',
        yours: 'Give it a `name`.',
        without: 'A date field written as a button and a calendar, which the form never sends.',
        code: '<UiDatePicker v-model="due" name="due" />',
      },
      UiTimePicker: {
        when: 'it sits inside a native form',
        props: '`name`',
        guarantee:
          'It sends the time as `HH:mm` under its `name`, the time the field shows, an empty value while it has none, and nothing while disabled.',
        yours: 'Give it a `name`.',
        without: 'A time field on screen that the form never sends.',
        code: '<UiTimePicker v-model="at" name="at" />',
      },
      UiTextarea: {
        when: 'it sits inside a native form',
        props: '`name`',
        guarantee:
          "It sends its text under its `name`, nothing while disabled, and after a form reset it shows the app's value again.",
        yours: 'Give it a `name`.',
        without: 'A text field on screen that the form never sends.',
        code: '<UiTextarea v-model="note" name="note" />',
      },
      UiSwitch: {
        when: 'it sits inside a native form',
        props: '`name`, `value`',
        guarantee:
          "When on, it sends `value` (`on` by default) under its `name`; when off or disabled, it sends nothing. After a form reset it shows the app's value again.",
        yours:
          'Give it a `name`, and a `value` where the server expects something other than `on`.',
        without: 'A switch on screen that the form never sends.',
        code: '<UiSwitch v-model="digest" name="digest">Weekly digest</UiSwitch>',
      },
      UiSelect: {
        when: 'it sits inside a native form',
        props: '`name`',
        guarantee:
          'The chosen value is included under its `name` through a hidden input. An empty or disabled select sends nothing. After a form reset, the visible choice and the submitted value both match the app’s current value.',
        yours: 'Give it a `name`.',
        without: 'A list on screen that the form never sends.',
        code: '<UiSelect v-model="currency" :items="currencies" name="currency" />',
      },
      UiScaleInput: {
        when: 'it sits inside a native form',
        props: '`name`',
        guarantee:
          'A hidden input sends the chosen step under its `name`; with no answer, or while disabled, nothing is sent.',
        yours: 'Give it a `name`, and check `required` yourself: the hidden input does not.',
        without: 'A scale on screen that the form never sends.',
        code: '<UiScaleInput v-model="effort" name="effort" />',
      },
      UiRadioGroup: {
        when: 'it sits inside a native form',
        props: '`name`',
        guarantee:
          "The chosen radio sends its value under the group's `name`, and nothing is sent while none is chosen. After a form reset, the radios show the app's value again.",
        yours: 'Give each group in a form its own `name`.',
        limit: 'A disabled group sends nothing, as a disabled radio does: the form leaves it out.',
        without: 'Radios on screen that the form never sends, or two groups merged under one name.',
        code: '<UiRadioGroup v-model="plan" name="plan">…</UiRadioGroup>',
      },
      UiPasswordField: {
        when: 'it sits inside a native form',
        props: '`name`',
        guarantee:
          "The password is sent under its `name`, a generated one included, and after a form reset the field shows the app's value again. Generate and Copy are plain buttons, so pressing them inside a form does not send it.",
        yours: 'Give it a `name`, and give the repeat field a name of its own.',
        without:
          'A password field the form never sends, or a Generate button that sends the form before it is filled in.',
        code: '<UiPasswordField v-model="password" name="password" />',
      },
      UiInput: {
        when: 'it sits inside a native form',
        props: '`name`',
        guarantee:
          "The value is sent under its `name`, and after a form reset the field shows the app's value again.",
        yours: 'Give it a `name` where the form is sent natively.',
        limit:
          'A `numeric` field sends the number as it shows it: `12,5` in a locale that writes a decimal comma, while the model holds `12.5`. A server that reads such a form reads the comma, or the app sends the model itself.',
        without: 'A field on screen that the form never sends.',
        code: '<UiInput v-model="email" name="email" />',
      },
      UiDropzone: {
        when: 'it sits inside a native form',
        props: '`name`',
        guarantee:
          'The submitted files match the list shown in the component, including after a form reset: a native file input behind the card tracks the app’s file list and submits it under the field’s `name`.',
        yours: 'Give it a `name` where the form is sent natively.',
        without: 'A file list on screen that the form never sends.',
        code: '<UiDropzone v-model="files" name="invoice" />',
      },
      UiCodeInput: {
        when: 'it sits inside a native form',
        props: '`name`',
        guarantee:
          "The code is sent under its `name`, and after a form reset the input and its cells show the app's value again.",
        yours: 'Give it a `name` where the form is sent natively.',
        without: 'Code cells on screen that the form never sends.',
        code: '<UiCodeInput v-model="code" name="otp" />',
      },
      UiCheckbox: {
        when: 'it sits inside a native form',
        props: '`name`, `value`',
        guarantee:
          "A ticked box sends its `value` under its `name`, an empty one sends nothing, and after a form reset the box and its tick show the app's value again.",
        yours: 'Give it a `name` where the form is sent natively.',
        without: 'A box on screen that the form never sends.',
        code: '<UiCheckbox v-model="news" name="newsletter" value="yes">Newsletter</UiCheckbox>',
      },
      UiStepper: {
        when: 'it sits inside a native form',
        props: '`name`',
        guarantee:
          'The count is sent under its `name`, and after a form reset it shows the app’s count again.',
        yours: 'Nothing.',
        without: 'A count on screen the form never sends.',
        code: '<UiStepper v-model="guests" name="guests" ariaLabel="Guests" />',
      },
    },
  },
  refusedByName: {
    title: 'Know what was refused and why',
    label: 'Refusal named',
    summary:
      'If something cannot be added, a message names it and says why, and a screen reader announces it at once. A dropzone names up to three files for each reason and counts the rest, for example “a.png, b.png, c.png and 2 more: unsupported file type.”, a sentence per reason. A list field keeps the refused text in the field to be corrected, and adds the valid entries typed or pasted with it.',
    why: 'You know what to fix or leave out before you try again, and you correct a refused entry instead of typing it again.',
    who: 'library',
    moment: 'form',
    proof: {
      UiDropzone: [
        'a refusal names the files it refused, three and then how many more',
        'every reason of a mixed batch is told',
      ],
      UiListField: [
        'check refuses with the reason and the text stays',
        'split, fix and check go the same way: a list typed with commas, tidied, the bad one kept',
      ],
    },
    at: { UiDropzone: 'Refused', UiListField: 'Invite' },
    holds: {
      UiListField: {
        when: 'An item fails its `check`.',
        props: '`check`',
        guarantee:
          'The rejected item stays in the field to be corrected, with the reason from `check` on the line under it, which a screen reader announces. The valid items entered together with it are added.',
        yours:
          'Return a clear correction from `check`, such as “Enter a complete email address, including the domain.”',
        without: 'A rejected entry disappears without a word, and you have to type it again.',
        code: '<UiListField :check="isEmail" … />',
      },
      UiDropzone: {
        when: 'files are refused',
        props: '`accept`, `maxSize`, `maxFiles`',
        guarantee:
          'You can tell which files need attention: each rejection reason names up to three affected files and counts any others. A batch with unsupported types and oversized files gets a sentence for each reason, announced as an alert by a screen reader.',
        yours:
          'Set the limits with `accept`, `maxSize` and `maxFiles`; the wording comes from the library.',
        without: 'Some files are missing from the list, with no word about which or why.',
        code: '<UiDropzone v-model="files" accept=".pdf" :max-size="5e6" multiple />',
      },
    },
  },
  wholeZoneIsTarget: {
    title: 'Drop files anywhere on the upload card',
    label: 'Drop anywhere',
    summary:
      'You can drop files anywhere on the upload card, including over files already listed. While the dropzone is on the page, a file dropped outside any drop target does not open in the browser tab. Other file inputs and drop targets still handle their own drops.',
    why: 'A drop that misses by a few pixels does not replace the page and the form you were filling in.',
    who: 'library',
    moment: 'form',
    proof: {
      UiDropzone: [
        'a drop anywhere on the card lands, not only on the dashed field',
        'a file dropped outside the card does not reach the browser default',
        'dragging text over the zone does not light it',
      ],
    },
    at: { UiDropzone: 'Base' },
    holds: {
      UiDropzone: {
        when: 'a file is dragged over the card',
        props: 'none',
        guarantee:
          'The whole card accepts drops, including its file rows. A file dropped outside the card and any other drop target does not open in the tab. The card highlights only for dragged files, not for dragged text.',
        yours: 'Nothing.',
        without:
          'A drop a few pixels past the dashed line opens the file in the tab, and the form is gone.',
        code: '<UiDropzone v-model="files" />',
      },
    },
  },
  noTwice: {
    title: 'Avoid adding the same entry twice',
    label: 'No duplicates',
    summary:
      'If you add something already in the list, the list keeps one copy and says so, for example “a.pdf: already in the list.” A file is the same when its name, size and date match; a typed or pasted name when it matches a whole name in the list in any capitalization, repeats within one paste included.',
    why: 'Nobody gets a second copy by accident, and you see why nothing new was added instead of wondering or finding it twice later.',
    who: 'library',
    moment: 'form',
    proof: {
      UiDropzone: 'the same file twice is refused as a duplicate',
      UiListField: [
        'a pasted column adds every line, repeats pointed at',
        'Enter adds even when a row holds the same letters; a repeat is refused with a line',
        'a repeat inside one paste is pointed at, not dropped without a word',
      ],
    },
    at: { UiDropzone: 'Multiple', UiListField: 'Base' },
    holds: {
      UiListField: {
        when: 'An item is already in the list.',
        props: '`existing`, `@taken`',
        guarantee:
          'A name is a duplicate when it matches a complete name in `existing`, ignoring capitalization: “Fruit” matches “fruit”, but “Fru” is a different entry. A duplicate is skipped and identified below the field, and `@taken` reports the existing name so the app can highlight its row. A name repeated within one paste is handled the same way.',
        yours:
          'List the current names in `existing`, and highlight the row that `@taken` names. Put a new name into `existing` before the promise `@add` returned settles: one put there later can be added twice.',
        without: 'A duplicate is either dropped without a word or added a second time.',
        code: '<UiListField :existing="names" @taken="light" … />',
      },
      UiDropzone: {
        when: 'the same file is dropped or chosen again',
        props: '`multiple`',
        guarantee:
          'A file already listed, with the same name, size and date, is refused and named as already in the list; the list keeps one copy, and `reject` reports it with the reason `duplicate`.',
        yours: 'Nothing.',
        without: 'The same invoice listed twice and uploaded twice.',
        code: '<UiDropzone v-model="files" multiple />',
      },
    },
  },
  folderRefused: {
    title: 'Know how to add files from a folder',
    label: 'Folder refused',
    summary:
      'If you drop a folder, a message tells you how to continue: “photos: folders are not accepted; drop the files inside.” Files dropped alongside the folder are processed separately and are added if they meet the file requirements.',
    why: 'You get a next step you can take, instead of a refusal with no reason or an empty file in the list.',
    who: 'library',
    moment: 'form',
    proof: {
      UiDropzone: [
        'a dropped folder is refused with a reason',
        'a folder that gives no file handle is still refused as a folder',
      ],
    },
    at: {},
    holds: {
      UiDropzone: {
        when: 'a folder is dropped',
        props: 'none',
        guarantee:
          'A dropped folder is rejected with an explanation, even when the browser provides no file for it. Files dropped alongside it are processed separately and added if accepted.',
        yours: 'Nothing.',
        without: 'A folder taken as an empty file of 0 bytes.',
        code: '<UiDropzone v-model="files" multiple />',
      },
    },
  },
  uploadShown: {
    title: 'See upload progress and when it ends',
    label: 'Upload shown',
    summary:
      'While files upload, you can see how far the upload has gone and when it is done. The file list cannot be changed during the upload. When the upload ends at 100%, each file gets a check mark and a screen reader announces the result, such as “2 files uploaded”. If it fails, the files left behind say why and offer Retry. The app supplies the progress and any failure; the dropzone shows them.',
    why: 'You can tell that the upload has started, which files are still on their way and when you can move on, instead of guessing from a single spinner.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiDropzone: [
        'progress out of range is clamped in the bar, the number and aria-valuenow',
        'the zone keeps one layout when busy turns on: Browse holds, the bar runs along the foot',
        'a finished upload is said in the status region',
        'an upload that ends below 100 is not marked done or said',
        'a failed upload marks the files it left with the reason and a Retry',
        'a failure is said in the status region once the upload stops',
      ],
      UiProgress: [
        'The bar says how far it is, and its fill follows value of max.',
        'beyond max the number stays at max and valueText carries the real value',
      ],
    },
    at: { UiDropzone: 'Upload' },
    holds: {
      UiDropzone: {
        when: 'the app uploads the files',
        props: '`busy`, `progress`, `failed`',
        guarantee:
          'Every file not yet uploaded shows the one `progress` you give: a percentage in place of its size and a bar behind its name. The percentage is capped at 100, and the card keeps its layout when the upload starts. When `busy` turns false with `progress` at 100, the files get check marks and a screen reader announces how many were uploaded. If the upload fails, each file left behind shows the reason you give in `failed`, or “Not uploaded”, with Retry, and a screen reader announces the reason once the upload stops.',
        yours:
          'Bind `busy` and `progress` while the upload runs, and set `progress` to 100 before `busy` turns false: an upload that ends below 100 is not marked done. Set `failed` when it fails, at any percent, and clear it when the next upload starts; handle the `cancel` and `retry` events.',
        limit: 'One percentage for the whole upload: a file does not show progress of its own.',
        without:
          'A spinner somewhere on the page, and no sign of which file is uploading, whether it has finished or which files a failure left behind.',
        code: '<UiDropzone v-model="files" :busy="sending" :progress="percent" :failed="error" @retry="send" />',
      },
      UiProgress: {
        when: 'it is the bar of an upload',
        props: "`value` of `max` bound to the upload's share",
        guarantee:
          'The bar fills as the file uploads, and its number never goes past the end. The announcement that the upload is done comes from UiDropzone, not from the bar.',
        yours:
          'Update `value` with the upload’s measured progress. Inside UiDropzone, its `busy` and `progress` values drive the bar for you.',
        without: 'Nothing moves while the file uploads, and you cannot tell how much is left.',
        code: '<UiDropzone :busy="uploading" :progress="share" />',
      },
    },
  },
  codeAnyWay: {
    title: 'Type, paste or autofill a code',
    label: 'Type, paste, autofill',
    summary:
      'Enter a code whichever way you have it: type it, paste it, or accept the browser’s autofill from a message where available. The cells share one input, so a complete code fills them at once. Pasted text keeps only the allowed characters and is cut to the code’s length.',
    why: 'You use the code you already have without copying it one character at a time.',
    who: 'library',
    moment: 'form',
    proof: { UiCodeInput: 'a pasted SMS keeps the code inside it' },
    at: { UiCodeInput: 'Base' },
    holds: {
      UiCodeInput: {
        when: 'a code arrives',
        props: '`autocomplete` (`one-time-code` by default)',
        guarantee:
          'One input supports typing, pasting and, where the browser offers it, autofill from a message. Pasted text keeps only the allowed characters and is cut to the code’s length: for a numeric code, “Your code is 482911, do not share it.” becomes 482911. This filters characters; it does not identify a code among several numbers in a message.',
        yours:
          'Keep `autocomplete` set to `one-time-code` for verification-code autofill unless the field serves another purpose. Autofill availability depends on the browser and message source.',
        without:
          'Six inputs of one character each: a paste puts one character in the first cell, and the rest of the code is lost.',
        code: '<UiCodeInput v-model="code" />',
      },
    },
  },
  codeMovesOn: {
    title: 'Show where the next code character goes',
    label: 'Cursor moves on',
    summary:
      'As you type a code, the cell for the next character is highlighted; on a full code, the last cell is. Backspace removes the last character, and the highlight moves back.',
    why: 'You see where the next character goes and can enter the whole code without clicking between cells.',
    who: 'library',
    moment: 'form',
    proof: {
      UiCodeInput: [
        'the cell for the next character is marked; a full code marks the last one',
        'Backspace takes the last character and the next cell moves back',
      ],
    },
    at: {},
    holds: {
      UiCodeInput: {
        when: 'you type a code',
        props: 'none',
        guarantee:
          'While the field has keyboard focus, the cell for the next character is highlighted with a text cursor in it; once the code is full, the last cell is highlighted. Backspace removes the last character, and the highlight moves back.',
        yours: 'Nothing.',
        without: 'A text cursor lost among six boxes.',
        code: '<UiCodeInput v-model="code" />',
      },
    },
  },
  codeRefusesWrongKind: {
    title: 'Keep only the characters a code allows',
    label: 'Wrong kind refused',
    summary:
      'Whatever you type or paste, the field keeps the allowed characters, removes the rest and cuts the result to the code’s length. A value supplied by the app, such as a restored draft, follows the same rules.',
    why: 'A stray space or letter never remains in a numeric code. The app still needs to check whether the code itself is correct.',
    who: 'library',
    moment: 'form',
    proof: {
      UiCodeInput: [
        'keeps only allowed characters and cuts at the length; complete fires when full',
        'a value from outside is filtered like a typed one',
      ],
    },
    at: { UiCodeInput: 'Letters' },
    holds: {
      UiCodeInput: {
        when: 'Characters the code does not allow are typed or pasted.',
        props: '`pattern`, `inputMode`, `length`',
        guarantee:
          "Only characters that match the code's pattern stay, and the code is cut at its length. A value set from outside, such as a restored draft, is filtered and cut in the same way.",
        yours:
          'For a code that is not digits only, set `inputMode="text"`, which allows letters and digits, or pass your own `pattern`. Set `length` when the code is not six characters long.',
        without:
          'Letters end up in a numeric code, and you find out only when the server refuses a code that could never be valid.',
        code: '<UiCodeInput v-model="code" />',
      },
    },
  },
  completeOnce: {
    title: 'Let the app check a code as soon as it is complete',
    label: 'Complete once',
    summary:
      'When you type, paste or autofill the last character, the field tells the app that the code is complete, so the app can check it without a separate button. A code the app puts in the field itself, such as a restored draft, is not reported as completed, and input that leaves the code unchanged is not reported again.',
    why: 'You can finish entering the code and the app can check it immediately, with no separate button to press. A restored draft is not sent for checking automatically.',
    who: 'library',
    moment: 'form',
    proof: {
      UiCodeInput: [
        'a value set from outside does not fire complete',
        'complete fires again after a completed code is edited and filled anew',
        'typing at a full code fires nothing when the model was over length',
      ],
    },
    at: { UiCodeInput: 'Base' },
    holds: {
      UiCodeInput: {
        when: 'The last character of the code is entered.',
        props: '`@complete`',
        guarantee:
          '`complete` fires once, with the code, when typing, a paste or an autofill fills the last cell. It fires again only after the code is edited and filled anew. A value set from outside, such as a restored draft, fires nothing.',
        yours:
          "Check or send the code in `@complete`. If the code is wrong, set the value back to `''`, so the same code can be typed again.",
        without:
          'A draft restored into the field is sent for checking as soon as the page opens, before you have typed anything.',
        code: '<UiCodeInput v-model="code" @complete="verify" />',
      },
    },
  },
  enterSaves: {
    title: 'Submit a form with Enter',
    summary:
      'Enter in a single-line field submits a modal or drawer form, when submission is available. A quick second Enter, or one pressed while the app marks the save as running, does not submit again. The app validates and saves the submitted values.',
    why: 'You can submit a completed form without moving to Save, and repeated presses while it is busy do not start another submission.',
    who: 'library',
    moment: 'form',
    proof: {
      UiModal: [
        'Enter in a single-line field submits: the field and Save stand in one form',
        'a second submit before the host answers emits no second submit',
      ],
      UiCrudDrawer: [
        'Enter in a single-line field saves: the fields and Save stand in one form',
        'the footer is exactly Cancel and Save; Save submits the form',
        'a second Enter before submitting arrives sends no second request',
      ],
    },
    at: {},
    holds: {
      UiModal: {
        when: 'The window has `form`, and you are typing in a single-line field.',
        props: '`form`, a `type="submit"` button in `#footer`',
        guarantee:
          'Enter in the field submits the form, as a browser does when a form has a submit button. A second Enter emits no second `submit` until the save ends, or until you move in the form or change it.',
        yours:
          'Make the main action a `type="submit"` button in `#footer`, and set `submitting` while the save runs.',
        without:
          'You have to leave the field and move to Save, and a quick second Enter sends the form twice.',
        code: '<UiModal v-model:open="open" title="Rename" form :submitting="saving" @submit="save">\n  <UiField label="Name"><UiInput v-model="name" /></UiField>\n  <template #footer><UiButton type="submit">Save</UiButton></template>\n</UiModal>',
      },
      UiCrudDrawer: {
        when: 'You are typing in a single-line field of the record.',
        props: 'the drawer’s own Save; `submitting` while the save runs',
        guarantee:
          'Enter saves the record, as pressing Save does. A second Enter sends no second `submit` until the save ends, or until you move in the form or change it.',
        yours:
          'Set `submitting` while the request runs, and close the drawer or mark the field in error when it answers.',
        without:
          'You have to leave the field and move to Save, and a quick second Enter sends the record twice.',
        code: '<UiCrudDrawer v-model:open="open" :title="record.name" :submitting="saving" @submit="save">…</UiCrudDrawer>',
      },
    },
  },
  metaEnterSaves: {
    title: 'Submit from a text box with Ctrl or Cmd+Enter',
    label: 'Cmd+Enter sends',
    summary:
      'Send a modal or drawer form from a multiline text field with Ctrl+Enter or Cmd+Enter. Enter on its own still inserts a line break. The shortcut activates the submit button, so it is unavailable while that button is disabled or loading.',
    why: 'You can write several lines and send them without reaching for the mouse.',
    who: 'library',
    moment: 'form',
    proof: {
      UiCrudDrawer: [
        'Cmd+Enter in a textarea submits; Enter alone does not',
        'Cmd+Enter in a list field that only adds submits too; its Enter alone adds',
      ],
      UiModal: 'Cmd+Enter in a textarea submits; Enter alone does not',
    },
    at: { UiModal: 'Form' },
    holds: {
      UiModal: {
        when: 'The window has `form`, and you are typing in a text box.',
        props: '`form`, a `type="submit"` button in `#footer`',
        guarantee:
          'Ctrl+Enter or Cmd+Enter in a text field activates the form’s submit button. It does nothing while the button is disabled or loading, or while focus is on Cancel. In a multiline field, Enter alone still inserts a line break.',
        yours:
          'Nothing beyond the `type="submit"` button in `#footer` that Enter needs too: the shortcut presses it.',
        without:
          'You have to leave the text field and move to Save before you can submit the form.',
        code: '<UiModal v-model:open="open" title="Note" form @submit="save">\n  <UiField label="Note"><UiTextarea v-model="note" /></UiField>\n  <template #footer><UiButton type="submit">Save</UiButton></template>\n</UiModal>',
      },
    },
  },
  enterPicks: {
    title: 'Pick with Enter without sending the form',
    label: 'Enter picks',
    summary:
      'In a select, a filter or a calendar inside a form, Enter chooses the highlighted option or day and does not submit the form. The form is submitted only when you choose to submit it.',
    why: 'Choosing a value from the keyboard does not send a half-filled form.',
    who: 'library',
    moment: 'form',
    proof: {
      UiListField: [
        'in a form Enter opens the row under the band or adds the text, and the form is not sent',
        'rows that arrive after the query still take the band: Enter opens the first match, adds nothing',
        'the band starts on the row named exactly as typed: “fruit” opens Fruit, not Fruit juice above it',
      ],
      UiCalendar: 'inside a form a pressed day picks it and the form is not submitted',
      UiSelect: [
        'inside a form Enter picks and the form is not submitted',
        'Enter while the answer to the typed text is on its way picks nothing; once it comes, Enter picks from it',
      ],
      UiFilter: 'Enter in the search does not submit a form around the filter',
      UiFilterList: 'an Enter inside a form ticks and never submits it',
    },
    at: { UiSelect: 'Search' },
    holds: {
      UiListField: {
        when: 'The list field stands in a form, such as a drawer’s.',
        props: 'none',
        guarantee:
          'Enter opens the row under the band, or adds the typed text when no row is there, and never submits the form around it. The band starts on the row named exactly as typed, else on the first match, so “fruit” opens Fruit, not Fruit juice above it.',
        yours: 'Nothing.',
        without: 'Enter, meant to add a tag, saves the half-filled record.',
        code: '<form><UiListField :existing="tags" @add="addTags" /></form>',
      },
      UiFilterList: {
        when: 'The filter list is inside a form.',
        props: 'none',
        guarantee:
          'Enter ticks the highlighted option, in the list or from its search box, and never submits the form around it.',
        yours: 'Nothing.',
        without: 'Pressing Enter to tick an option submits the half-filled form.',
        code: '<form><UiFilterList v-model="tags" :items="tags" /></form>',
      },
      UiFilter: {
        when: 'The filter is inside a form and has a search box.',
        props: 'none',
        guarantee:
          'Enter in the search box ticks the first match and never submits the form around the filter.',
        yours: 'Nothing.',
        without: 'In a search box inside a form, Enter submits the form before anything is ticked.',
        code: '<form><UiFilter v-model="tags" label="Tags" :items="TAGS" /></form>',
      },
      UiSelect: {
        when: 'The select is inside a form.',
        props: '`searchable`, `fetcher`, or none',
        guarantee:
          'On the closed select, Enter opens the list. In the open list or its search box, Enter picks the highlighted option. In both cases the form around it is not submitted. While the answer to the text typed in a server search is on its way, Enter picks nothing: the rows in view answer an older word.',
        yours: 'Nothing.',
        without:
          'With a plain text field and a list under it, Enter submits the form before anything is picked.',
        code: '<form><UiSelect v-model="country" :items="countries" searchable /></form>',
      },
      UiCalendar: {
        when: 'The calendar is inside a form.',
        props: 'none',
        guarantee: 'Enter or Space on a day picks it, and the form around it is not submitted.',
        yours:
          'Nothing; every button in the calendar is `type="button"`, so none of them submits the form.',
        without: 'Enter on a day submits the half-filled form.',
        code: '<form @submit="save"><UiCalendar v-model="due" /></form>',
      },
    },
  },
  oneStop: {
    title: 'Pass a group with one press of Tab',
    label: 'One Tab per group',
    summary:
      'Use Tab to reach a group of options, then the arrow keys to move within it. The next Tab leaves the group. This works for tabs, radio options, scale values, filter options and calendar days, so you do not have to Tab through each option separately. Separate controls, such as search and Reset buttons, have their own Tab stops.',
    why: 'You can get past a group of twelve options without pressing Tab twelve times, while still reaching every option with the arrow keys.',
    who: 'library',
    moment: 'open',
    proof: {
      UiScaleInput: 'one tab stop, on the mark; arrows, Home, End move it and Delete clears',
      UiRadioGroup: 'is a radiogroup whose radios share one name and reflect the value',
      UiCalendar: [
        'one day is a tab stop, so a focus trap around the calendar goes round it',
        'arrows move a day and a week; PageUp a month, Shift+PageDown a year; Home and End the week',
      ],
      UiTabs: [
        'marks the active tab and gives only it a tab stop',
        'arrows wrap round the ends; Home and End jump to the ends',
        'a pane with a focusable child adds no tab stop of its own; a pane of words does',
      ],
      UiFilterList:
        'keyboard as in a select: arrows move, Home and End jump, Enter and Space tick, a letter jumps',
      UiFilter: 'the list is one tab stop, and Reset the next',
      UiTableColumns: 'the list is one tab stop, and Reset the next once something differs',
    },
    at: {
      UiTabs: 'Panel',
      UiFilterList: 'Search',
      UiCalendar: 'Base',
      UiRadioGroup: 'Segmented',
    },
    holds: {
      UiFilterList: {
        when: 'a filter has many options',
        props: 'none',
        guarantee:
          'Tab reaches the list, or its search field when one is present. Use the arrow keys to move between options, Home and End to reach the first or last, and Enter or Space to select. Tab then moves to the next control.',
        yours: 'Nothing.',
        limit:
          'Once the search holds text, its clear button (the cross) appears and takes a press of Tab of its own, so the list then takes two.',
        without:
          'Each option is its own checkbox, so a filter of twelve categories takes twelve presses of Tab to get past.',
        code: '<UiFilterList v-model="kinds" :items="kinds" />',
      },
      UiTableColumns: {
        when: 'the columns panel is open',
        props: 'none',
        guarantee:
          'Tab reaches the column list as one group, so you do not have to visit every column. Reset is the next available stop when the view differs from the default.',
        yours: 'Nothing.',
        without:
          'Each column is its own checkbox, so a wide table costs a press of Tab per column.',
        code: '<UiTableToolbar v-model:search="query" :columns="cols" />',
      },
      UiFilter: {
        when: 'the filter’s panel is open',
        props: 'none',
        guarantee:
          'Tab reaches the options as one group, or their search field when present. Reset is the next stop when available, so the number of options does not add more Tab presses.',
        yours: 'Nothing.',
        limit:
          'Once the search holds text, its clear button (the cross) appears and adds one more press of Tab.',
        without:
          'Each option is its own checkbox, so twelve categories take twelve presses of Tab before you reach Reset.',
        code: '<UiFilter v-model="kinds" label="Categories" :items="CATEGORIES" />',
      },
      UiScaleInput: {
        when: 'a question is answered on a scale',
        props: 'none',
        guarantee:
          'The scale takes one press of Tab, on the chosen step, or on the first step while there is no answer. The arrow keys move the mark, and Home and End take it to the ends.',
        yours: 'Nothing.',
        without:
          'Each step is its own button, so a scale of ten steps takes ten presses of Tab to pass one question.',
        code: '<UiScaleInput v-model="difficulty" />',
      },
      UiRadioGroup: {
        when: 'you choose one answer from a group',
        props: 'none',
        guarantee:
          'The group takes one press of Tab, on the chosen answer or on the first. The arrow keys change the answer, the same way whether the options are drawn as rows, cards or segments.',
        yours: 'Nothing.',
        without: 'Segments built as separate buttons take a press of Tab each.',
        code: '<UiRadioGroup v-model="plan">…</UiRadioGroup>',
      },
      UiCalendar: {
        when: 'a month of days is shown',
        props: 'none: every UiCalendar',
        guarantee:
          'Tab reaches the previous-month button, the month heading, the next-month button and the days as four separate stops. Within the days, start on the selected day or today. Use the arrow keys to move by day or week, Page Up and Page Down to change months, and Enter to choose. The next Tab leaves the day grid.',
        yours: 'Place the field that comes next after the calendar, not inside it.',
        limit:
          'The header’s month arrows and the month’s name take a press of Tab each, so a month is four presses of Tab, not one.',
        without:
          'Every day is a separate Tab stop, so getting to the field after the calendar can take more than thirty key presses.',
        code: '<UiCalendar v-model="due" />',
      },
      UiTabs: {
        when: 'a screen is split into tabs',
        props: '`tabs`, `v-model` and `ariaLabel`',
        guarantee:
          'The tab strip takes one press of Tab and enters on the open tab. The arrow keys move to the next or previous tab and open it, wrapping round at the ends; Home and End go to the first and last tab, and the next Tab goes into the open pane.',
        yours:
          'Name the strip with `ariaLabel`, and put each pane in the slot named after its tab.',
        limit:
          'A pane that is not shown is unmounted, so a form inside it keeps what was typed only if the parent holds the values.',
        without:
          'Tabs built as a row of buttons take a press of Tab each before you reach the content below them.',
        code: '<UiTabs v-model="tab" :tabs="tabs" ariaLabel="Client"><template #overview>…</template></UiTabs>',
      },
    },
  },
  letterJumps: {
    title: 'Jump to an option by letter',
    label: 'Letter jumps',
    summary:
      'Find a known option by typing its first letter while the list has focus: G can take you to Germany. Repeat the letter to move to the next matching option. In a list with a search field, typing searches instead.',
    why: 'When you already know the name, you do not have to press the Down arrow once for every option above it.',
    who: 'library',
    moment: 'list',
    proof: {
      UiTableColumns:
        'a letter goes to the column that starts with it, and the same letter again to the next',
      UiFilter: 'a letter jumps to the next option that starts with it',
      UiSelect: [
        'a letter jumps to the first label with that prefix',
        'a letter on the closed field opens on the first label that starts with it, the chosen one too',
        'a Space after letters typed over the list belongs to the word: New J reaches New Jersey',
      ],
      UiMenu: 'a letter jumps to the next item whose label starts with it, wrapping',
      UiFilterList: [
        'keyboard as in a select: arrows move, Home and End jump, Enter and Space tick, a letter jumps',
        'the same letter pressed again goes on to the next option that starts with it',
        'a Space after letters typed over the list belongs to the word: New J reaches New Jersey',
      ],
    },
    at: {
      UiMenu: 'Long',
      UiFilter: 'One dimension',
      UiFilterList: 'Few',
      UiTableColumns: 'In a toolbar',
    },
    holds: {
      UiTableColumns: {
        when: 'a table of five columns or fewer, where no search takes the letters',
        props: 'none: every UiTableColumns',
        guarantee:
          'A letter goes to the first column that starts with it, and the same letter again to the next.',
        yours: 'Nothing.',
        without: 'Arrowing down the list one column at a time to reach the one you know by name.',
        code: '<UiTableToolbar v-model:search="q" :columns="columns" />',
      },
      UiFilter: {
        when: 'its list has no search: five options or fewer',
        props: 'none',
        guarantee:
          'A letter moves the highlight to the first option that starts with it; the same letter again goes on to the next one, and from the last match back to the first. Enter or Space then ticks the highlighted option.',
        yours: 'Nothing.',
        limit:
          'From six options the list gets a search field, and letters type into the search instead of jumping.',
        without:
          'A column of checkboxes where a letter does nothing, so you press the Down arrow once for each option above the one you want.',
        code: '<UiFilter v-model="kinds" label="Categories" :items="CATEGORIES" />',
      },
      UiFilterList: {
        when: 'the list has no search',
        props: 'five options or fewer',
        guarantee:
          'A letter moves the highlight to the first option that starts with it; the same letter again goes on to the next one, and from the last match back to the first. Letters typed together find a word, its spaces too. Enter or Space then ticks the highlighted option.',
        yours: 'Nothing.',
        limit:
          'From six options the list gets a search field, and letters type into the search instead of jumping.',
        without:
          'A column of checkboxes where a letter does nothing, so you press the Down arrow once for each option above the one you want.',
        code: '<UiFilterList v-model="kinds" :items="kinds" />',
      },
      UiSelect: {
        when: 'the list has no filter field',
        props: 'none',
        guarantee:
          'On the closed field, a letter opens the list with the first option that starts with it highlighted; in the open list, it moves the highlight there. The same letter again goes on to the next option that starts with it. Letters typed together find a word, its spaces too: "new j" reaches New Jersey.',
        yours: 'Nothing.',
        without: 'A long list that you walk one row at a time with the arrow keys.',
        code: '<UiSelect v-model="currency" :items="currencies" />',
      },
      UiMenu: {
        when: 'the menu is open',
        props: 'none: every UiMenu',
        guarantee:
          'Type a letter to move focus to the next menu item that starts with it. Repeat it to cycle through matching items, returning to the start after the last match. If no item matches, focus stays where it is.',
        yours:
          'Give the items labels that start with different letters where you can, so one press reaches each of them.',
        without:
          'A letter does nothing, and you move through the menu with the arrow keys, one item at a time.',
        code: '<UiMenu>\n  <template #trigger><UiButton>Move to</UiButton></template>\n  <UiListItem v-for="f in folders" :key="f" as="button" :title="f" />\n</UiMenu>',
      },
    },
  },
  focusStays: {
    title: 'Keep keyboard focus where you are working',
    label: 'Focus stays near',
    summary:
      'You can delete several rows without finding the Delete button after each one: when a row is removed, keyboard focus moves to the same button in the row that takes its place, so Enter deletes the next one. When a message, field or panel disappears while you are using it, focus moves to a control that remains.',
    why: 'You can continue a sequence of actions from the keyboard without tabbing back into the list each time or switching to the mouse.',
    who: 'library',
    moment: 'form',
    proof: {
      UiFilterList: [
        'when the options drop under six while the search holds text and focus, the text goes and the focus stays in the list',
        'options that arrive with six or more while the list holds the focus hand the focus to the search',
      ],
      UiToaster: 'running the action from the keyboard gives the focus back where it came from',
      UiAppShell: [
        'Ctrl or ⌘ B with the focus on the logo hands the focus to the button',
        'collapsing with the focus inside #banner hands it to the toggle',
      ],
      UiDropzone: [
        'removing a file with the keyboard keeps the focus inside the card',
        'removing skips a locked row: the focus lands on the next removable one',
      ],
      UiListField: [
        'Enter adds what is offered, empties the field and keeps the focus',
        'removing a row puts the focus on its neighbor',
        'the rows change in place (splice): the removed row’s neighbor takes the focus',
        'when the list has room again, a focus on the line that said it was full goes back into the field',
      ],
      UiTable: [
        'a row deleted under the focus hands it to the same control of the row now in its place',
        'the page checkbox turned off with the last row gives the focus to the table box',
      ],
      UiReveal: [
        'returns focus to the trigger when the block collapses with focus inside it',
        'closing a block no control names, with focus inside, returns focus to the element above',
      ],
      UiInput: 'the cross turning into the spinner keeps the focus in the field',
      UiCopyButton: [
        'focus stays on the button after a copy',
        'copied the old way, through a field no one sees, the focus comes back to the button',
      ],
    },
    at: {
      UiAppShell: 'Sidebar',
      UiDropzone: 'Many',
      UiReveal: 'Own state',
      UiTable: 'Row actions',
    },
    holds: {
      UiTable: {
        when: 'Rows are deleted or sorted while keyboard focus is on a button in a row.',
        props: 'none: every UiTable',
        guarantee:
          'After you delete a row, keyboard focus moves to the same button in the row that takes its place, or in the previous row if you deleted the last one, so the next delete is one Enter away. A row deleted while a window opened from it holds the focus (a confirmation’s `action`) is handed on the same way when the window closes. If the page becomes empty, focus moves to the table container. After sorting, focus stays on the same button in the same record, wherever that record moves.',
        yours:
          'Nothing. Remove or reorder the rows in `items` as usual; the table moves keyboard focus itself.',
        limit:
          'This applies to buttons in a row and to a row’s UiMenu, which gives the focus back to its button before the command runs, so Delete from the ⋯ menu lands on the ⋯ of the next row. A menu of your own that keeps the focus until the row is gone loses it with the row.',
        without:
          "Every delete loses keyboard focus, and you tab through the page again to reach the next row's Delete button.",
        code: '<UiTable :columns="columns" :items="rows">\n  <template #row-actions="{ row }">\n    <UiIconButton :icon="Trash2" ariaLabel="Delete" @click="remove(row)" />\n  </template>\n</UiTable>',
      },
      UiCopyButton: {
        when: 'you copy from the keyboard',
        props: 'none',
        guarantee:
          'Keyboard focus stays on the button after the copy, also where the browser has no Clipboard API (a page over plain HTTP) and the copy goes through a field no one sees, so Tab goes on from there.',
        yours: 'Nothing.',
        without: 'Focus left in a hidden field after a copy, and the next Tab starts from nowhere.',
        code: '<UiCopyButton :value="order.id" />',
      },
      UiFilterList: {
        when: 'The number of options crosses six, so the search box appears or disappears.',
        props: 'none',
        guarantee:
          'When the list reaches six options, a search field appears; if the list had keyboard focus, focus moves into the search so you can start typing. If the count falls below six while the search has focus, the search text clears and focus returns to the list. The arrow keys remain available for choosing options.',
        yours: 'Nothing.',
        without:
          'The search box is removed while it has keyboard focus, focus leaves the panel, and you have to find the list again.',
        code: '<UiFilterList v-model="tags" :items="tags" :loading="pending" />',
      },
      UiToaster: {
        when: 'A message closes while keyboard focus is in it: by Escape, its close button or its action.',
        props: 'none: every UiToaster',
        guarantee:
          'Keyboard focus goes back to where it was before it moved into the message, for example the field you were typing in, not to the start of the page.',
        yours: 'Nothing.',
        without:
          'The message closes with keyboard focus inside it, focus is lost, and you have to find the field you were in again.',
        code: '<UiToaster />',
      },
      UiAppShell: {
        when: 'The sidebar collapses, for example with Ctrl or ⌘ B, while keyboard focus is on the logo link or inside `#banner`.',
        props: 'none: every UiAppShell',
        guarantee:
          'When the logo link or a banner disappears while it has keyboard focus, focus moves to the collapse button, which remains available in the narrow sidebar, so you can continue from there.',
        yours: 'Nothing.',
        without:
          'The banner closes with keyboard focus inside it, focus is lost, and you have to find the sidebar again.',
        code: '<UiAppShell :nav="nav" :current="route.path">\n  <template #banner>…</template>\n</UiAppShell>',
      },
      UiReveal: {
        when: 'The block closes while keyboard focus is inside it.',
        props: '`v-model:open` with a `#trigger`, or `:open` and an `id` a control points at',
        guarantee:
          'Focus returns to the control that opens the section, or to the nearest button or field above it if no linked control is found. The next Tab continues from there.',
        yours:
          "Pass `controls` from the `#trigger` slot to the trigger as `aria-controls`. A control placed elsewhere points at the block through the block's `id`.",
        limit:
          'A control that does not name the block in `aria-controls` and does not stand right above it is not found, so focus is not moved there.',
        without:
          'Keyboard focus is lost with the closed block, and you have to find the control again.',
        code: '<UiReveal v-model:open="open">\n  <template #trigger="{ open, toggle, controls }">\n    <UiSwitch :model-value="open" :aria-controls="controls" @update:model-value="toggle" />\n  </template>\n  …\n</UiReveal>',
      },
      UiListField: {
        when: 'A row is removed from the keyboard.',
        props: 'none: every UiListField',
        guarantee:
          'After you remove an entry, keyboard focus moves to the remove button of the next row, or of the previous row if there is none, and to the input when no entries remain, so you can remove several without finding the button each time. Adding with Enter clears the input and keeps focus there for the next entry.',
        yours: 'Nothing.',
        without:
          'Keyboard focus is lost with the removed row, and you have to find the list again.',
        code: '<UiListField :search="false" placeholder="Add an email…" @add="add">\n  <UiListItem v-for="name in emails" :key="name" :title="name" />\n</UiListField>',
      },
      UiDropzone: {
        when: 'A file is removed from the keyboard.',
        props: '`multiple`',
        guarantee:
          'Keep removing files from the keyboard: focus moves to the next file’s remove button, then the previous one if needed, or Choose files when no suitable file remains. Files without a remove button, such as completed uploads, are skipped.',
        yours: 'Nothing.',
        without:
          'Keyboard focus is lost with the removed file, and you have to tab back into the drop zone.',
        code: '<UiDropzone v-model="files" multiple ariaLabel="Reports" />',
      },
    },
  },
  escapeTop: {
    title: 'Close only the top layer with Escape',
    label: 'Escape, top first',
    summary:
      'Press Escape to step back from the last thing you opened. A list or calendar closes while the form behind it stays open. In a drawer with nested views, Escape goes back one level before closing the drawer. A search containing text uses the first Escape to clear it; a calendar’s month view uses it to return to the days.',
    why: 'You can dismiss a temporary choice without accidentally closing the form you are still filling in.',
    who: 'library',
    moment: 'close',
    proof: {
      UiDrawer: 'Escape closes only the layer on top: a window over the drawer first',
      UiTooltip:
        'Escape on a shown tooltip inside a modal hides the hint and leaves the modal open',
      UiTimePicker: 'Escape in a window closes the list only',
      UiPopover: 'opened from a drawer: focus may sit in the panel, Escape closes the panel only',
      UiCrudDrawer: [
        'Escape in the open menu closes the menu, not the drawer',
        'Escape goes one level up; at the top it closes',
      ],
      UiModal: 'Escape closes only the window on top',
      UiDatePicker: 'Escape in an open calendar inside a modal closes the calendar only',
      UiSelect: [
        'Escape on the trigger of an open select inside a modal closes the list only',
        'Home and End jump, Escape closes and returns focus to the trigger',
        'the search clears its own text on Escape and keeps the panel open; a second Escape closes it',
      ],
    },
    at: {
      UiDatePicker: 'Window',
    },
    holds: {
      UiSelect: {
        when: 'its list is open inside a window or a drawer',
        props: 'none',
        guarantee:
          'Escape closes the list only, and keyboard focus goes back to the field; the window stays open. With text in its search, the first Escape clears the text and the list stays.',
        yours: 'Nothing.',
        without: 'One Escape closes the list and the form behind it at once.',
        code: '<UiModal v-model:open="open"><UiSelect v-model="country" :items="countries" /></UiModal>',
      },
      UiTimePicker: {
        when: 'its list is open inside a window',
        props: 'none',
        guarantee:
          'Escape closes the list of times only, and keyboard focus goes back to the field; the window stays open.',
        yours: 'Nothing.',
        without: 'One Escape closes the list and the window behind it at once.',
        code: '<UiModal v-model:open="open"><UiTimePicker v-model="at" /></UiModal>',
      },
      UiDatePicker: {
        when: 'its calendar is open inside a window or a drawer',
        props: 'none',
        guarantee:
          'Escape closes the calendar alone and returns keyboard focus to the field; the window and its half-filled form stay.',
        yours: 'Nothing.',
        without:
          'Escape on the calendar closes the window too, and what you typed in its form is lost.',
        code: '<UiModal v-model:open="editing"><UiDatePicker v-model="due" /></UiModal>',
      },
      UiDrawer: {
        when: 'a window or a list is open over the panel',
        props: 'none: every UiDrawer',
        guarantee:
          'Escape closes the topmost dialog or list while the drawer remains open. A later Escape reaches the drawer, where it goes back a level or closes the drawer at its top level.',
        yours: 'Nothing.',
        without:
          'One Escape closes the window and the panel under it, and what you typed in the panel goes with them.',
        code: '<UiDrawer v-model:open="open" title="Filters">…</UiDrawer>',
      },
      UiTooltip: {
        when: 'a hint is shown inside a window, a drawer or a panel',
        props: 'none: every UiTooltip',
        guarantee:
          'The first Escape hides the hint and goes no further; the window under it closes only with the next Escape.',
        yours: 'Nothing.',
        without:
          'Escape meant for a hint closes the whole window, and what you typed in it is lost.',
        code: '<UiTooltip content="Back to the default columns">\n  <UiButton variant="ghost">Reset</UiButton>\n</UiTooltip>',
      },
    },
  },
  pressTop: {
    title: 'Close a popup without closing the form behind it',
    label: 'Outside, top first',
    summary:
      'If a select’s list or a calendar is open inside a window or drawer, a click outside it closes only that list or calendar, and the form stays open. In a window this holds even for a click on the backdrop; the next click there closes the window.',
    why: 'Clicking away is the usual way to dismiss a list you opened by mistake, and it should not cost you the form you were filling in.',
    who: 'library',
    moment: 'close',
    proof: {
      UiCrudDrawer: 'a backdrop press closes a select opened inside, and leaves the drawer open',
      UiModal: 'a backdrop press closes a select opened inside, and leaves the window open',
      UiDatePicker:
        'a click away from the calendar inside a modal closes the calendar and keeps the modal',
      UiSelect: 'a press outside its list inside a modal closes the list and keeps the modal',
    },
    at: {},
    holds: {
      UiSelect: {
        when: 'its list is open inside a window or a drawer',
        props: 'none',
        guarantee:
          'A press outside the list, on the backdrop too, closes the list alone, and the window stays open; the next press there closes the window.',
        yours: 'Nothing.',
        without: 'A press beside the list closes the window under it as well, with the form in it.',
        code: '<UiModal v-model:open="open"><UiSelect v-model="country" :items="countries" /></UiModal>',
      },
      UiDatePicker: {
        when: 'its calendar is open inside a window',
        props: 'none',
        guarantee:
          'A click away from the calendar closes the calendar alone, and the window stays open.',
        yours: 'Nothing.',
        without:
          'A click beside the calendar closes the window under it as well, with the form in it.',
        code: '<UiModal v-model:open="editing"><UiDatePicker v-model="due" /></UiModal>',
      },
    },
  },
  oneWindow: {
    title: 'See one window at a time',
    label: 'One window seen',
    summary:
      'If a dialog opens another dialog, the first one closes and the new one takes its place. If an edit dialog asks a question (a confirmation), the edit dialog is hidden until you answer, then returns as you left it, with focus on the button that asked. A side drawer remains visible beneath a dialog.',
    why: 'You can tell which question needs an answer, and the keyboard cannot move into a hidden dialog by mistake.',
    who: 'library',
    moment: 'close',
    proof: {
      UiModal: [
        'a window opened from a window takes its place: the first closes, and the focus goes back to what opened it',
        'a window opened over a window hides it, out of sight and out of reach; one is seen',
        'a window that is persistent is not replaced: it waits under the new one and comes back',
        'a window that is submitting is not replaced: it waits under the new one and comes back',
        'a question over a window does not take its place: the window comes back once it is answered',
        'a window opened while a menu of the window is still open takes its place',
        'three windows: only the top one is seen, and they come back one by one',
        'closed from outside, the one on top brings the one under back before the focus goes in',
      ],
      UiConfirm:
        'hides the window until it is answered; the window comes back with the focus on what asked',
    },
    at: { UiModal: 'Over a window' },
    holds: {
      UiModal: {
        when: 'a window opens while another window is open',
        props:
          '`role="alertdialog"` for a question about the window under it; every UiModal, UiConfirm included',
        guarantee:
          'A window opened from a window takes its place: the first closes, and when the new one closes keyboard focus returns to what opened the first. A question is different: the window underneath is hidden from sight, from the keyboard and from screen readers while it asks, and comes back as it was once it is answered, with keyboard focus on the button that asked. Either way the page keeps one dimmed backdrop instead of two.',
        yours:
          'Give a question about the window `role="alertdialog"` (UiConfirm has it). Bind `open` with `v-model`: the first window closes by its `update:open` and says `close`, as on any close. Mark a window holding input `persistent`, so another window does not take its place.',
        limit:
          'A window with unsaved input (`persistent`) or a request on its way (`submitting`) is not closed for another: it waits hidden under the new one and comes back.',
        without:
          'Two windows sit on top of each other over a doubly dimmed page, and it is hard to tell which one is asking.',
        code: '<UiModal v-model:open="editing" title="Edit the client">…</UiModal>\n<UiModal v-model:open="dropping" role="alertdialog" title="Delete the client?">…</UiModal>',
      },
    },
  },
  onePress: {
    title: 'Ignore extra presses while a request runs',
    label: 'One press, one request',
    summary:
      'After you press Send, a loading indicator shows that the request is running and further presses are ignored until it finishes. This prevents another click from starting the same action through that control. The app supplies the loading state unless the component manages the request itself.',
    why: 'You do not need to press again to check whether the first click registered, and an impatient second press does not start an extra request through the busy control.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiIconButton: [
        'keeps focus when loading starts and refuses the click before the caller',
        'fires click when enabled and never when disabled or loading',
      ],
      UiMenu: 'a busy item refuses the click and the menu stays open',
      UiToaster: [
        'the action runs once and closes its toast',
        'a second click on the action during the leave fade does not run it twice',
      ],
      UiListField: [
        'pressing Enter twice while the add is on its way sends once',
        'typing goes on while the add is on its way, and the next Enter sends it',
      ],
      UiListItem: [
        "Loading puts a spinner in the glyph's place and refuses the press; the button stays enabled.",
        'a loading link row refuses the click in the capture phase, ahead of the router',
      ],
      UiConfirm:
        'the window waits for the action: the button loads, a second press sends nothing, Escape is refused',
      UiButton: [
        'a disabled or loading button does not fire click',
        "refuses the click before the caller's listener",
        'a loading submit button does not send its form',
      ],
      UiBadge: [
        'A double click on the cross removes once, even when the host re-renders between the clicks.',
        'While a loading set from the click runs, a second press past the double-click window waits.',
      ],
      UiDropzone: [
        'busy: the row carries the upload, Browse refuses but holds, the drop is ignored, removing waits',
        'Browse keeps the focus while busy',
        'two quick presses on cancel or Retry ask once, until the app answers',
      ],
      UiTable: [
        'a retry in flight after a failure draws the skeleton: no retry is left to press twice',
        'a header pressed while rows load asks for no second sort and keeps the focus',
      ],
      UiLog: 'Show older calls @more once and is held while the promise runs',
      UiPagination: [
        'disabled holds the whole row: arrows off, numbers held but focusable, nothing asked',
        'while loading, the pressed arrow keeps the focus with a spinner, the other is off, and a press asks nothing',
        'a number pressed while its page loads shows a spinner in place of its digits and says busy',
      ],
    },
    at: { UiButton: 'Loading', UiIconButton: 'Loading', UiPagination: 'Loading' },
    holds: {
      UiTable: {
        when: 'you press a column header or Retry while rows load',
        props: '`loading`',
        guarantee:
          'While rows load, a column heading keeps keyboard focus, but pressing it does not request another sort. When the app starts loading after Retry, placeholder rows replace the Retry button, so it cannot be pressed again while the request runs.',
        yours: 'Set `loading` from the moment you ask for rows until they arrive.',
        limit:
          'Row checkboxes and `#row-actions` stay active during a refresh, because the selection holds row keys, not the rows themselves.',
        without:
          'Two presses send two requests, and the answer that arrives last may be the older one.',
        code: '<UiTable v-model:sort="sort" :columns="columns" :items="rows" :loading="pending" />',
      },
      UiPagination: {
        when: 'a page is loading',
        props: '`loading`',
        guarantee:
          'The arrow or page number you pressed shows a spinner and keeps keyboard focus while the page loads. Further presses are ignored until loading finishes, and the page numbers stay where they were.',
        yours:
          'Pass the list’s loading flag as `loading`, from the moment the page is requested until it has arrived.',
        limit:
          'Without `loading`, nothing holds a second press: two presses a moment apart ask for two pages.',
        without: 'Next takes every press: a double press asks twice and skips a page.',
        code: '<UiPagination v-model:page="page" :page-size="25" :total="total" :loading="loading" />',
      },
      UiLog: {
        when: 'older events load on request',
        props: '`@more` returning a promise',
        guarantee:
          '“Load older events” calls `@more` once and ignores further presses until its promise settles.',
        yours: 'Return the promise of the load from `@more`.',
        without: 'The button sends a second request while the first is still on its way.',
        code: '<UiLog :items="events" has-more @more="loadOlder" />',
      },
      UiListField: {
        when: 'an item is being added',
        props: '`@add` returning a promise',
        guarantee:
          'While the add is on its way, a second Enter or Add sends nothing. You can keep typing, and the text waits for your next Enter.',
        yours:
          'Return the request’s promise from `@add`, and put the new names into `existing` before it settles, so the next add finds them. Give the request a timeout.',
        limit:
          'A promise that never settles holds the field until it unmounts: Escape and `disabled` do not let it go.',
        without: 'An impatient second Enter sends the same item twice.',
        code: '<UiListField :existing="emails" @add="invite" />',
      },
      UiDropzone: {
        when: 'an upload is running',
        props: '`busy`',
        guarantee:
          'Browse ignores presses but keeps keyboard focus, dropped files are ignored, and removing a file waits until the upload ends. The cross that cancels the upload and Retry after a failure each ask once, until the app answers by changing `busy` or `failed`.',
        yours:
          'Bind `busy` while the upload runs, and answer a cancel or a Retry by changing `busy` or `failed`.',
        without: 'A second file can be dropped into an upload that is half done.',
        code: '<UiDropzone v-model="files" :busy="sending" />',
      },
      UiButton: {
        when: 'its request is on its way',
        props: '`loading` while the request runs',
        guarantee:
          'The button shows a spinner and text such as “Sending…”, so you know the action has started. Further presses, by mouse or keyboard, reach neither your handler nor the form’s submit action, and keyboard focus stays on the button.',
        yours: 'Set `loading` from the press until the request answers.',
        limit:
          'The button does not know about the request: without `loading`, every press reaches your handler. It stops extra presses in the interface; making the operation safe to repeat on the server remains the app’s job.',
        without: 'Pressing Send again while the invoice is on its way submits the form twice.',
        code: '<UiButton type="submit" :loading="sending" loading-text="Sending…">Send</UiButton>',
      },
      UiIconButton: {
        when: 'its request is on its way',
        props: '`loading` while the request runs',
        guarantee:
          'A spinner replaces the icon, a second press by mouse or keyboard is stopped before it reaches your handler, and keyboard focus stays on the button.',
        yours: 'Set `loading` from the press until the request answers.',
        limit:
          'The button does not know about the request: without `loading`, every press reaches your handler.',
        without: 'Pressing the bell twice while sending is slow sends the client two reminders.',
        code: '<UiIconButton :icon="Bell" :loading="sending" ariaLabel="Send a reminder" @click="send" />',
      },
      UiConfirm: {
        when: 'a question asked with an `action`',
        props: '`confirm({ ..., action: () => request })`',
        guarantee:
          'The confirmation stays open while its `action` runs. Its button shows a spinner and ignores further presses. Escape and a click outside do not close the dialog until the request finishes.',
        yours:
          'Pass the request as `action` instead of running it after the answer, and give it a timeout of its own: a request that never settles keeps the dialog open.',
        without:
          'The dialog closes before the result is known, and a quick second press can send the delete again.',
        code: "await confirm({ title, message, confirmLabel: 'Delete', action: () => api.remove(id) })",
      },
      UiMenu: {
        when: 'an item’s command is running (`loading` on the item)',
        props: '`loading` on the UiListItem command row',
        guarantee:
          'While the item is marked `loading`, a spinner replaces its icon and further clicks are ignored. The menu stays open until the command finishes.',
        yours: 'Set `loading` on the item from its click until the command answers.',
        without: 'A second click on a slow item runs the command again.',
        code: '<UiListItem as="button" title="Export" :loading="exporting" @click="exportAll" />',
      },
      UiToaster: {
        when: 'a message with an action, such as Undo or Open',
        props: '`action: { label, onClick }`',
        guarantee:
          'The action closes its notification and runs once for that notification. Another press during the fade-out does not run it again.',
        yours: 'Nothing: `onClick` is called once.',
        without: 'A double press on Undo restores the invoice twice.',
        code: "toast.show({ title: 'Invoice deleted', action: { label: 'Undo', onClick: restore } })",
      },
      UiListItem: {
        when: 'a command or link row is loading',
        props: '`as="button"` or `to`, with `loading` set while the request runs',
        guarantee:
          'A spinner replaces the icon, and further presses are stopped before your listener or the router sees them, so a link row does not navigate. Keyboard focus stays on the row.',
        yours: 'Set `loading` from the press until the request answers.',
        without: 'A second press on a slow row sends the request again.',
        code: '<UiListItem as="button" title="Sync the bank feed" :loading="syncing" @click="sync">\n  <template #actions><RefreshCw /></template>\n</UiListItem>',
      },
      UiBadge: {
        when: 'it can be removed (`removable`)',
        props: '`removable`, the host removing it on `remove`',
        guarantee:
          'A double click on the remove button emits one removal. If removing takes time, set `loading` after the first click to block further presses until it finishes.',
        yours:
          'Remove the badge on `remove`, and move keyboard focus elsewhere, since the badge disappears.',
        without: 'A double click sends the removal twice.',
        code: '<UiBadge label="Kiosk" removable @remove="drop(\'kiosk\')" />',
      },
    },
  },
  pagerHoldsStill: {
    title: 'Keep the page arrows under the pointer',
    label: 'Arrows hold still',
    summary:
      'You can click Next repeatedly without moving the mouse. When there are more pages than fit, the number of page slots stays constant, and each slot is as wide as the largest page number. The compact label, such as “3 / 20”, also keeps a steady width.',
    why: 'Without it, a quick second click can land on a page number that moved into the arrow’s place and open a page you did not ask for.',
    who: 'library',
    moment: 'list',
    proof: {
      UiPagination: [
        'the row holds the same number of slots on every page',
        'every number is as wide as the widest, and a four-digit total holds the arrows',
        'the compact label holds the width of its widest "N / M", and the gap the numbers\' text size',
      ],
    },
    at: { UiPagination: 'Many pages' },
    holds: {
      UiPagination: {
        when: 'there are more pages than fit',
        props: 'none',
        guarantee:
          'The Previous and Next arrows stay in place as you change pages. The page slots keep a constant count and are wide enough for the largest page number, such as four digits for 1,200 pages. The compact label, such as “3 / 20”, also reserves the width of its widest value.',
        yours: 'Nothing.',
        limit:
          'When the pager’s container is too narrow, the page numbers are replaced by a compact label between the arrows. This depends on the space given to the pager, not the screen size. Larger page numbers need more space.',
        without:
          'Each number is as wide as its digits and the window of pages grows and shrinks, so the Next arrow moves out from under the pointer between clicks.',
        code: '<UiPagination v-model:page="page" :page-size="25" :total="total" />',
      },
    },
  },
  pagerKeepsFocus: {
    title: 'Keep turning pages from the keyboard',
    label: 'Focus kept',
    summary:
      'You can keep paging from the keyboard without finding Next again after every load: the arrow you pressed keeps keyboard focus while the page loads. When that arrow reaches the end and becomes disabled, focus moves to the current page number or the compact page label. In a calendar, a month arrow that reaches its limit passes focus to the month heading, and a period’s arrow to the period button.',
    why: 'You can read a long list, or step through months, without returning to the mouse after every step.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiCalendar: [
        "the arrow that reaches the window's edge hands the focus to the caption",
        'a pick on a day of the next month keeps focus on that day',
      ],
      UiDateRange: ['the arrow that turns off at the window hands the focus to the button'],
      UiPagination: [
        'keyboard paging on a loading list keeps the focus inside the pager',
        'while loading, the pressed arrow keeps the focus with a spinner, the other is off, and a press asks nothing',
        'compact: an arrow that goes inert hands the focus to the label, also while disabled',
      ],
    },
    at: { UiPagination: 'Loading' },
    holds: {
      UiPagination: {
        when: 'you page with the keyboard through a list that loads',
        props: '`loading`',
        guarantee:
          'The arrow or page number you pressed keeps keyboard focus while the page loads. When an arrow becomes disabled at the end, focus moves to the current page number or the compact label, such as “3 / 20”; it also moves there when a narrow container replaces the page numbers with that label. If the whole pager becomes `disabled`, focus moves from the disabled arrow to the current page.',
        yours:
          'Set `loading` from the page request until it finishes. Use `disabled` when paging is unavailable altogether; it disables the arrows.',
        without:
          'The arrow turns off while the page loads, keyboard focus is lost, and you have to find the page controls again.',
        code: '<UiPagination v-model:page="page" :page-size="25" :total="total" :loading="loading" />',
      },
      UiCalendar: {
        when: 'you move between months with its arrows',
        props: 'none',
        guarantee:
          'When an arrow turns off at the first or last allowed month, keyboard focus moves to the month caption between the arrows. When you pick a day of the next month, focus stays on that day.',
        yours: 'Nothing.',
        without:
          'Keyboard focus is lost on the turned-off arrow: it falls to the page, and a screen reader loses its place.',
        code: '<UiCalendar v-model="day" :min="from" :max="to" />',
      },
      UiDateRange: {
        when: 'you step a period with its arrows up to `min` or `max`',
        props: '`stepper`, with `min` or `max`',
        guarantee:
          'The arrow you pressed keeps keyboard focus, and a screen reader announces the new days. When a step reaches the end of the window and the arrow turns off, focus moves to the period button after the arrows.',
        yours: 'Nothing.',
        without:
          'Keyboard focus is lost on the turned-off arrow: it falls to the page, and a screen reader loses its place.',
        code: '<UiDateRange v-model="issued" stepper :max="today" />',
      },
    },
  },
  pageByKey: {
    title: 'Move by month or year from the keyboard',
    summary:
      'Page Up and Page Down move the calendar by a month, and with Shift by a year, so a distant date is a few key presses away. The day number is preserved where possible: moving back from May 31 goes to April 30, then March 31.',
    why: 'A date months or years away is reached in a few key presses instead of one day at a time.',
    who: 'library',
    moment: 'form',
    proof: {
      UiCalendar: [
        'arrows move a day and a week; PageUp a month, Shift+PageDown a year; Home and End the week',
        'PageUp from the 31st lands on the 31st again where a month has one',
      ],
    },
    at: {},
    holds: {
      UiCalendar: {
        when: 'A day has keyboard focus.',
        props: 'none',
        guarantee:
          'Use Left and Right to move by day, Up and Down by week, and Home and End to reach the week’s first and last days. Page Up and Page Down move by month; add Shift to move by year. The original day number is restored when a later month has it, so May 31 → April 30 → March 31.',
        yours: 'Nothing.',
        without: 'A date a year away takes twelve clicks on a small arrow button.',
        code: '<UiCalendar v-model="due" />',
      },
    },
  },
  monthsJump: {
    title: 'Jump to a month from the heading',
    summary:
      'Press the calendar’s month heading to show all twelve months, change the year with the header arrows, and choose a month, without paging through every month in between. Escape returns to the day view.',
    why: 'You can go directly to a month such as next September instead of pressing the next-month arrow repeatedly.',
    who: 'library',
    moment: 'form',
    proof: {
      UiCalendar: [
        'the caption opens the months of the year; a month opens its days',
        'the months view: the shown month has focus, arrows move over the grid',
        'leaving the months view after a year step leaves exactly one focusable day in the shown month',
        'a month button says its month and year',
        'Escape in the months view goes back to the days and does not reach the host',
      ],
    },
    at: {},
    holds: {
      UiCalendar: {
        when: 'The day you need is many months away.',
        props: 'none',
        guarantee:
          "The heading opens a grid of the year's months, the same height as the days, so the calendar does not change size. Keyboard focus starts on the month shown, the arrows move across the grid, and a screen reader announces each month with its year, such as “March 2026”. Choosing a month opens its days with keyboard focus on one day of it, and Escape returns to the days without closing the popover or window around the calendar.",
        yours: 'Nothing.',
        without: 'Reaching a day next autumn means paging through every month in between.',
        code: '<UiCalendar v-model="due" />',
      },
    },
  },
  stateInWords: {
    title: 'Describe calendar marks in words',
    summary:
      'A screen reader announces each day’s full date and the meaning of its marks, such as “overdue” or “unavailable”, as well as which day is today and which days are outside the allowed range. The calendar’s colors and symbols are not the only way to learn a day’s state.',
    why: 'Someone who cannot see the dots, the strike-through or the colors still learns that a day is overdue, taken or out of range before choosing it.',
    who: 'library',
    moment: 'form',
    proof: {
      UiCalendar: [
        'a dot says its label to a reader; a taken day says it is unavailable',
        'today is marked as the current date, once mounted',
        'a chosen day outside min and max is the disabled state, not a fade',
        'a span day outside min and max is disabled and not struck',
      ],
    },
    at: {},
    holds: {
      UiCalendar: {
        when: 'Days are marked, taken or outside the allowed range.',
        props: '`marked`, `unavailable`, `min`, `max`',
        guarantee:
          'Each day button is named by its full date, then by the labels of its dots, then by the word “unavailable” when it is taken, for example “Thursday, September 10, 2026, overdue”. Today is marked as the current date. A day outside `min` and `max` is disabled for a screen reader and drawn in the disabled colors, not faded and not struck through, so it does not look like a taken day.',
        yours:
          'Give each kind of dot a `label` that says what it means; a dot without one is announced only as “marked”.',
        without:
          'A screen reader announces only the date, so the dot that means overdue and the strike that means taken are lost to anyone who cannot see them.',
        code: '<UiCalendar v-model="day" :marked="entries" :unavailable="booked" />',
      },
    },
  },
  readersToday: {
    title: 'Mark today in the app’s time zone',
    summary:
      'The calendar marks today in the app’s time zone, or in the browser’s time zone if the app has not set one. On a page rendered by a server, the marker appears only after the calendar runs in the browser. A screen reader identifies it as the current date.',
    why: 'Near midnight, the server’s date may differ from the date in the calendar’s time zone. Waiting for the browser avoids marking the wrong day as today, even briefly.',
    who: 'library',
    moment: 'open',
    proof: {
      UiCalendar: [
        'today is not marked before mount',
        'today is marked as the current date, once mounted',
        'today is the day of the app time zone, past midnight there before UTC',
      ],
    },
    at: {},
    holds: {
      UiCalendar: {
        when: 'today is in the month shown',
        props: "none; the zone is the app's",
        guarantee:
          'Today is marked in the app’s time zone, or the browser’s time zone when none is configured. The marker appears only after the calendar runs in the browser, and a screen reader identifies that day as the current date.',
        yours:
          'If today should follow a fixed time zone rather than each browser’s, set it once with `createGrani({ timeZone })`.',
        without: 'The server’s date is marked as today while it is still yesterday where you are.',
        code: '<UiCalendar v-model="day" />',
      },
    },
  },
  limitShown: {
    title: 'Respect date limits without losing a value',
    label: 'Limits shown',
    summary:
      'You can see which dates and times are available before choosing: values outside the allowed range stay visible but cannot be picked. A previously saved value outside the range is kept and marked invalid, so you can review and correct it. Calendar navigation respects the allowed range, but still lets you navigate back if the selected date is outside it.',
    why: 'A previously saved value is not silently erased or replaced when the range changes: you can see what needs correcting and navigate back to an available date or time.',
    who: 'library',
    moment: 'form',
    proof: {
      UiTimePicker: 'a value outside min and max is kept and reads invalid',
      UiDatePicker: [
        'a preset outside min and max is held',
        "an app's own preset is its words and its days from today; one outside min and max is disabled",
        'a day outside min and max is kept and reads invalid',
        "presets follow the calendar's window: backwards bounds are one window, a malformed bound is none",
      ],
      UiCalendar: [
        'the arrows and the months view stop at the window; a page stops at its edge day',
        "an empty calendar whose window ends before today opens on the window's last month",
        'a chosen day far outside the window can be walked back by the arrows and the year arrows',
        'a month arrow from inside the window never leaves the focus on a day outside it',
        'a malformed bound is ignored and warned about, not a dead calendar',
      ],
    },
    at: {
      UiTimePicker: 'Odd values',
      UiCalendar: 'Date of birth',
    },
    holds: {
      UiTimePicker: {
        when: 'The times are limited by `min` and `max`.',
        props: '`min`, `max`',
        guarantee:
          'You can see hours and minutes outside the allowed range, but cannot select them. The range can cross midnight. A previously stored time outside it remains visible and is marked invalid, so you can correct it.',
        yours:
          "State the allowed window in the field's description, since the list alone does not say why some times cannot be picked.",
        without:
          'A list of only the allowed times: a saved time outside them shows as an empty field, and saving the form sends no time.',
        code: '<UiTimePicker v-model="opens" min="08:00" max="12:00" />',
      },
      UiDatePicker: {
        when: 'The field has `min` or `max`.',
        props: '`min`, `max`',
        guarantee:
          'A date outside the allowed range stays visible, is marked invalid and is still submitted with the form. The calendar opens within the range, and a quick-date button for a day outside it is disabled. Reversed `min` and `max` bounds are read as one range; an invalid bound is ignored.',
        yours: "Pass `min` and `max`, and explain the limit in the field's description.",
        without:
          'A saved day outside the range is replaced without notice, or a quick-date button picks a day the form then refuses.',
        code: '<UiDatePicker v-model="due" min="2026-09-10" max="2026-10-10" />',
      },
      UiCalendar: {
        when: 'The calendar has `min` or `max`, for example for a date of birth.',
        props: '`min`, `max`',
        guarantee:
          'With no date selected, the calendar opens on the nearest allowed month. Paging by month or year stays within the bounds, and keyboard focus never lands on an unavailable day. If the selected date is far outside the range, the arrows still let you navigate back into it. An invalid bound is ignored with a warning.',
        yours:
          'Pass `min` and `max` as `YYYY-MM-DD` days, and let the calendar choose the month it opens on.',
        without:
          'A date-of-birth calendar opens on the current month, where no day can be picked, and you page back eighteen years to reach one.',
        code: '<UiCalendar v-model="born" :max="adult" />',
      },
    },
  },
  clearedInPlace: {
    title: 'Clear a field and enter its replacement immediately',
    label: 'Cleared in place',
    summary:
      'Press a field’s × and enter the replacement immediately, without clicking back into the field: clearing moves keyboard focus to the field, whether you use the mouse or the keyboard.',
    why: 'The × disappears once the field is empty; without this, keyboard focus would be lost with it, and you would have to find the field again.',
    who: 'library',
    moment: 'form',
    proof: {
      UiTimePicker: 'the cross clears it and the focus stays on the field',
      UiSelect: 'the clear button keeps the focus on the field',
      UiListField: 'the cross and Add, pressed by keyboard, keep the focus in the field',
      UiInput: 'a search with text shows a cross that clears it and keeps the focus',
      UiDatePicker: [
        'the cross clears and leaves focus on the trigger; at xs it fits inside the capsule',
        'a clear with the calendar open closes it and leaves the focus on the field',
      ],
    },
    at: {
      UiTimePicker: 'States',
    },
    holds: {
      UiTimePicker: {
        when: 'A time may be left empty.',
        props: '`clearable`',
        guarantee:
          'The × sets the value to `null`, and keyboard focus stays on the field. A required field has no ×, because empty is not allowed there.',
        yours: 'Treat `null` as no time.',
        without:
          'The × disappears together with the time it cleared, and keyboard focus is lost with it.',
        code: '<UiTimePicker v-model="remind" clearable />',
      },
      UiSelect: {
        when: 'An answer may be left empty.',
        props: '`clearable`',
        guarantee:
          'The × sets the value to `null`, or to `[]` with `multiple`, and keyboard focus moves to the field. A required field has no ×.',
        yours: 'Treat `null` as no answer.',
        without:
          'The × empties the field and keyboard focus is lost, so you have to find the field again.',
        code: '<UiSelect v-model="currency" :items="currencies" clearable />',
      },
      UiListField: {
        when: 'The × or Add is pressed.',
        props: 'none',
        guarantee:
          'Both × and Add keep keyboard focus in the input, including when activated from the keyboard, so you can clear the text or add an entry and type the next one immediately.',
        yours: 'Nothing.',
        without:
          'After clearing or adding, keyboard focus is lost, and you go back to the field to type the next entry.',
        code: '<UiListField … />',
      },
      UiInput: {
        when: 'A search field has text.',
        props: '`type="search"`',
        guarantee: 'The × empties the field and leaves keyboard focus in it.',
        yours: 'Nothing; do not add a × of your own in `#end`.',
        without:
          'The × empties the field and keyboard focus is lost, so you have to find the field again.',
        code: '<UiInput v-model="q" type="search" />',
      },
      UiDatePicker: {
        when: 'The field is `clearable` and holds a day.',
        props: '`clearable`',
        guarantee:
          "The × empties the field and leaves keyboard focus on the field's button, also while the calendar is open, which then closes. A required field has no ×.",
        yours: 'Nothing.',
        without:
          'The × empties the field and keyboard focus is lost, so you have to find the field again.',
        code: '<UiDatePicker v-model="due" clearable />',
      },
    },
  },
  commonDays: {
    title: 'Pick a common date in one press',
    label: 'Common days',
    summary:
      'Choose a common date without opening the calendar. Buttons below the field can set Today, Yesterday, Tomorrow or another date relative to today, and the field shows the date a press set.',
    why: 'When most entries fall on the same few days, you do not have to open the calendar for each one.',
    who: 'library',
    moment: 'form',
    proof: {
      UiDatePicker: [
        'presets pick today and yesterday in one click; the field shows the day they set',
        'presets true gives the seven default days, in order',
      ],
    },
    at: { UiDatePicker: 'Presets' },
    holds: {
      UiDatePicker: {
        when: 'Most entries fall on the same few days.',
        props: '`presets`',
        guarantee:
          'Buttons with days counted from today stand under the field, one press each, and the field shows the day a press set. They are actions, not toggles, so they stay narrow: Today, Yesterday and A week ago fit on one line under a field 288 px wide.',
        yours:
          'Pass the ids that fit the field in `presets`, or `true` for all seven (Today, Yesterday, A week ago, Tomorrow, In 3 days, In a week, In 2 weeks), and add your own with `{ label, days }`.',
        without: 'You open the calendar to pick yesterday, every time.',
        code: '<UiDatePicker v-model="spent" :presets="[\'today\', \'yesterday\']" />',
      },
    },
  },
  unreadableIsNone: {
    title: 'Leave invalid date values empty instead of guessing',
    label: 'Unreadable is empty',
    summary:
      'If the app supplies an impossible date, such as 2026-13-40, the field shows its placeholder instead of converting it into another date. It has no clear button, and the form sends an empty value for it.',
    why: 'An invalid value never silently becomes a day nobody selected.',
    who: 'library',
    moment: 'form',
    proof: {
      UiDatePicker:
        'a value that is no day shows empty, has no cross, sends an empty value, and warns in dev',
    },
    at: { UiDatePicker: 'States' },
    holds: {
      UiDatePicker: {
        when: 'The value is not a valid day.',
        props: 'none',
        guarantee:
          'The field shows its placeholder, has no × and submits an empty value, and a warning appears in development.',
        yours: 'Pass a `YYYY-MM-DD` day or `null`.',
        without:
          'A field built on `Date` rolls 31 February over to 3 March and shows a day nobody entered, or shows “Invalid Date”.',
        code: '<UiDatePicker v-model="due" />',
      },
    },
  },
  searchClears: {
    title: 'Clear a search in one step',
    label: 'Search clears',
    summary:
      'Clear a search with × or Escape and start typing another term immediately. Focus stays in the field. Inside a panel, the first Escape clears nonempty text without closing the panel; another Escape can then close it.',
    why: 'You can try one term after another without selecting and deleting the old text, or reopening a panel that Escape closed.',
    who: 'library',
    moment: 'list',
    proof: {
      UiListField: [
        'Escape empties the field and stays; empty, it goes on to the host',
        'no line of keys under the list; the cross empties the field',
        'the cross and Add, pressed by keyboard, keep the focus in the field',
        'Escape with only a line under the field clears the line and stops there',
      ],
      UiTableColumns:
        'from six columns a search narrows the list, and Escape empties it with the panel still open',
      UiSelect:
        'the search clears its own text on Escape and keeps the panel open; a second Escape closes it',
      UiInput: [
        'a search with text shows a cross that clears it and keeps the focus',
        'Escape clears a search with text and goes no further; on an empty one it passes',
        'Escape in a search whose results are on their way goes no further and clears nothing',
      ],
      UiTableToolbar:
        'the cross and Escape each send the empty value once, at once, and keep the focus',
      UiFilter: 'in the panel a search with text clears on Escape, and the panel stays open',
      UiFilterList: [
        'the search field clears its own text on Escape, keeping the popover open, before Escape can close it',
        'the cross empties the search and keeps the focus in it',
      ],
    },
    at: { UiFilter: 'Many options: a search', UiTableColumns: 'In a toolbar' },
    holds: {
      UiListField: {
        when: 'the field has text',
        props: 'none',
        guarantee:
          'The cross empties the field and keeps keyboard focus in it, from the keyboard too. Escape empties it as well, or clears the line under it, and goes no further, so a drawer around the list stays open; on an empty field Escape reaches the drawer.',
        yours: 'Nothing. Do not add a clear button of your own.',
        without: 'Escape in the field closes the whole drawer instead of clearing what you typed.',
        code: '<UiListField :existing="tags" @add="addTags" />',
      },
      UiTableColumns: {
        when: 'a table of six columns or more',
        props: 'none: every UiTableColumns',
        guarantee:
          'A search stands over the list of columns and narrows it as you type. Its cross or Escape empties it and keeps the focus in the field; an Escape with no text closes the panel.',
        yours: 'Nothing.',
        without:
          'An Escape meant for the text that closes the whole panel, so the search starts over.',
        code: '<UiTableToolbar v-model:search="q" :columns="columns" />',
      },
      UiTableToolbar: {
        when: 'the search has text',
        props: 'none: every UiTableToolbar',
        guarantee:
          '× or Escape clears the search, and you can type the next term without leaving the field. The empty value reaches the app immediately, bypassing the usual 250 ms delay, even when earlier typing was still waiting to be sent.',
        yours: 'Nothing. Do not add a clear button of your own: the field already has one.',
        without:
          'The field looks empty while the list is still filtered by text the field no longer shows.',
        code: '<UiTableToolbar v-model:search="q" />',
      },
      UiFilterList: {
        when: 'it has six options or more, and so a search field',
        props: 'none',
        guarantee:
          'The cross or Escape empties a search that has text and keeps keyboard focus in it. That Escape stops there, so the popover around the list stays open; the next Escape reaches the popover.',
        yours: 'Nothing. Do not add a clear button of your own.',
        without:
          'A search field in a popover where Escape closes the whole panel instead of clearing the text.',
        code: '<UiFilterList v-model="tags" :items="tags" />',
      },
      UiFilter: {
        when: 'it has six options or more, and so a search field',
        props: 'none',
        guarantee:
          'Escape in a search with text empties it and keeps the panel open, with keyboard focus still in the search; the next Escape closes the panel.',
        yours: 'Nothing.',
        without:
          'A plain field in a popover, where the Escape meant for the text closes the whole panel.',
        code: '<UiFilter v-model="tags" label="Tags" :items="TAGS" />',
      },
      UiSelect: {
        when: 'the filter has text',
        props: '`searchable` or `fetcher`',
        guarantee:
          'A cross clears the filter and keeps keyboard focus in it. Escape clears it first and keeps the list open; a second Escape closes the list.',
        yours: 'Nothing.',
        without: 'A filter you can clear only by selecting its text and deleting it.',
        code: '<UiSelect v-model="country" :items="countries" searchable />',
      },
      UiInput: {
        when: 'a search field has text',
        props: '`type="search"`',
        guarantee:
          'A cross clears it and keeps keyboard focus in the field. Escape clears it too and goes no further. In an empty search Escape passes on, so an Escape meant for something around the field, such as a dialog, still reaches it.',
        yours: 'Nothing.',
        without: 'A search you can clear only by selecting its text and deleting it.',
        code: '<UiInput v-model="q" type="search" />',
      },
    },
  },
  outsideWins: {
    title: 'Keep a reset from restoring the old search',
    label: 'Reset wins',
    summary:
      'After Reset filters, a saved view or Back changes the search, the field shows that new value immediately. Any earlier typing still waiting for the search delay is discarded, so it cannot reapply the old filter a moment later.',
    why: 'You can trust that a reset or saved view will stay in effect instead of changing again because of text entered before it.',
    who: 'library',
    moment: 'list',
    proof: {
      UiTableToolbar: 'a value set from outside replaces the typing and drops the pending send',
    },
    at: { UiTableToolbar: 'Above a table' },
    holds: {
      UiTableToolbar: {
        when: 'the app sets the search itself: a reset, a saved view, a step back',
        props: '`v-model:search`',
        guarantee:
          'The field shows the search value the app set and discards any earlier text still waiting for the typing delay, so the old search is never sent afterward.',
        yours: 'Set `search` to the new value; there is no pending send for you to cancel.',
        without:
          'The list is reset while the field still shows the old text, and the pending send can filter the list by it again.',
        code: '<UiTableToolbar v-model:search="q" />\n<UiButton @click="q = \'\'">Reset filters</UiButton>',
      },
    },
  },
  emptyNextStep: {
    title: 'Give every empty list a way forward',
    label: 'Way forward',
    summary:
      'An empty area explains what happened: there are no records yet, nothing matches the current search or filters, or loading failed, and it never leaves you at a dead end. It offers the next step it can, such as Clear search, Reset filters, Retry or Show all, and beside it a step of the app, such as creating what you searched for or adding the first record.',
    why: 'You can decide what to do next instead of guessing whether to wait, change a filter or reload the page.',
    who: 'library',
    moment: 'list',
    proof: {
      UiListField: [
        'an empty list says how to start; a query or a list hides the line',
        'an empty list counts nothing and offers the name right after it',
        'a search that finds nothing offers to add what was typed',
      ],
      UiChartCard: 'nothing to draw is the card’s own words, or the caller’s #empty',
      UiNoData: [
        'It holds the next step: a button of your own, with its own weight.',
        'the next step comes after the title and the description',
        'A failed load is said at once, on a red plate with a warning glyph.',
      ],
      UiTable:
        'an empty page and a failed load say why; #empty puts the next step of your own in place',
      UiLog: 'a filter that hides every loaded event says so and offers all',
      UiDataTable: [
        'a search with no match offers to clear it, and the press asks for an empty search',
        'a filter that matches nothing offers to reset it, and the offer follows filtered',
        "a search with no match keeps Clear search and Reset filters, and the app's action stands beside them",
        "a list with no records yet says so and offers the app's action under its words",
        'a filter chosen in #filters makes an empty list offer Reset filters, which clears it',
      ],
    },
    at: { UiNoData: 'Nothing matches', UiDataTable: 'States' },
    holds: {
      UiListField: {
        when: 'the list is empty, or nothing matches the typed text',
        props: '`empty` for the words of an empty list',
        guarantee:
          'An empty list says how to start: “Nothing here yet: type a name and press Enter.” A search that finds nothing offers to add what was typed, with Add ↵ at the end of the field and Enter.',
        yours:
          'Say in `empty` what the list holds when the default words do not fit, such as “No tags yet: type one and press Enter.”',
        without: 'An empty card under a field, with no word on what to type or that Enter adds.',
        code: '<UiListField :existing="tags" empty="No tags yet: type one and press Enter." @add="addTags" />',
      },
      UiChartCard: {
        when: 'there is nothing to draw for the period',
        props: '`empty`, `#empty`',
        guarantee:
          'In place of the chart the card says “No data for this period” with a short hint, or shows what the app put in `#empty`, such as a UiNoData with its next step.',
        yours:
          'Provide a useful next action in `#empty`, such as choosing another period, importing data or creating the first record.',
        without: 'Empty axes that look like a chart of zeros.',
        code: '<UiChartCard title="Revenue" empty><template #empty><UiNoData title="No sales in September" /></template></UiChartCard>',
      },
      UiDataTable: {
        when: 'a search or a filter leaves no rows, or there are no records yet',
        props: '`v-model:search`, `filtered`, `@reset-filters`, `#empty-actions`',
        guarantee:
          'A search with no match says “No matching records” and offers Clear search, Reset filters while a filter is on, and your own step beside them, such as adding the client searched for. With no records yet your step stands alone under the words. A failed load says why and offers Retry.',
        yours:
          'A UiFilter in `#filters` counts by itself, and Reset filters resets it. Pass `filtered` while another filter of yours is on, and clear it when `reset-filters` arrives. Give the step only your app knows in `#empty-actions`, such as New invoice, or creating the client that was searched for; without it, no records yet is the words alone.',
        without:
          'An empty table body that says neither why it is empty nor how to get the rows back.',
        code: '<UiDataTable v-model:search="q" :filtered="statuses.length > 0" @reset-filters="statuses = []" />',
      },
      UiTable: {
        when: 'a page has no rows, or the first load failed',
        props: '`filtered`, `error`, `#empty`',
        guarantee:
          'An empty page says why: “No records yet”, or “No matching records” with `filtered`. A failed load says “Could not load records” with the message you pass in `error`, offers Retry, and a screen reader announces it at once.',
        yours:
          'Use `#empty` to supply a UiNoData message with an action such as Create or Reset. For a failed load, pass an explanation in `error` and load again on `retry`.',
        limit: 'Without `#empty`, an empty page says why but offers no button.',
        without: 'A blank table, which reads as a failed load.',
        code: '<UiTable :columns="columns" :items="rows" :filtered="Boolean(query)">\n  <template #empty="{ filtered }">…</template>\n</UiTable>',
      },
      UiLog: {
        when: 'a filter hides every loaded event',
        props: '`filters`',
        guarantee:
          'It says “No events of this kind are loaded.” and offers Show all, which turns the filter off and brings back every loaded event.',
        yours: 'Nothing.',
        without: 'An empty timeline that reads as if nothing ever happened to the record.',
        code: '<UiLog :items="events" :filters="kinds" />',
      },
      UiNoData: {
        when: 'a list, a table or a section has nothing to show',
        props:
          '`title` and `description` for the cause, the step in `#actions`; `tone="danger"` for a failed load',
        guarantee:
          'The message explains the cause through `title` and `description`, with the actions from `#actions` below it. With `tone="danger"`, it shows a warning icon on a red background and is announced immediately by a screen reader.',
        yours:
          'Explain the cause and offer a useful action: Create when there are no records, Reset when filters hide them, or Retry with `tone="danger"` when loading fails. UiTable, UiDataTable and UiLog include this message component in their own states.',
        limit:
          'It does not tell the causes apart by itself; only the app knows why the list is empty.',
        without: 'A blank area or “No data” message gives no explanation or next step.',
        code: '<UiNoData title="Nothing matches" description="Change the filters or reset them."><template #actions><UiButton variant="secondary" @click="reset">Reset the filters</UiButton></template></UiNoData>',
      },
    },
  },
  compactCounts: {
    title: 'Keep counts short and in place',
    label: 'Compact counts',
    summary:
      'A count stays short: above the configured maximum, it is shortened to a value such as 99+, so it never grows past that. A value that is not a number is hidden, and a negative one counts as 0. An attention indicator disappears at zero; a total beside a label can still show 0.',
    why: 'You can tell what needs attention without oversized counts, meaningless “NaN” values or a notification marker showing zero.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiIndicator: [
        'Past max the mark reads 99+, at any corner.',
        'At zero the mark is gone; a dot shows without a count.',
        'A count that is not a number hides the mark and warns in development.',
        'a negative count is none: the mark is gone, as at zero',
      ],
      UiCount: [
        'Above max it reads 99+: one digit is a circle, two grow a capsule.',
        'A count that is not a number shows nothing, with a warning in development.',
        'a negative count reads 0',
        'an unset count is 0, and a count that is not a number draws nothing',
      ],
      UiTabs: [
        'a count of zero draws no badge',
        'a count past its limit reads 99+ and keeps the badge short',
        'a badge with badgeLabel is read in words: the number hidden, the meaning said',
        'a bare number badge warns in dev',
      ],
    },
    at: { UiIndicator: 'Max', UiCount: 'Zero and overflow' },
    holds: {
      UiIndicator: {
        when: 'on the corner of what it marks',
        props: '`count` and `max` (99 by default)',
        guarantee:
          'The indicator stays compact: above `max`, it shows a shortened count such as 99+. It disappears at zero or when the value is not a number.',
        yours:
          'Pass the real count, and name the state on the element it marks, using the slot’s `text`, such as “Inbox, 99+”. Do not draw a 0 yourself.',
        limit: 'It does not announce the count to a screen reader; the element it marks does.',
        without:
          'A large number such as 1284 spills out of its corner, a red 0 stays when nothing is waiting, and a bad value shows as “NaN”.',
        code: '<UiIndicator :count="unread"><UiIconButton :icon="Inbox" ariaLabel="Inbox" /></UiIndicator>',
      },
      UiTabs: {
        when: 'a tab has a count',
        props: '`badge` and `badgeLabel` on the tab',
        guarantee:
          'The count shows only above zero and reads 99+ past its limit. A screen reader announces the words you give, such as “3 unread”, instead of a bare number.',
        yours:
          'Give `badgeLabel` the count in words, such as “3 unread”; a bare number triggers a warning in development.',
        without:
          'A 0 sits on every quiet tab, and a screen reader announces “Inbox 3” without saying what the 3 counts.',
        code: "<UiTabs :tabs=\"[{ value: 'inbox', label: 'Inbox', badge: 3, badgeLabel: '3 unread' }]\" … />",
      },
      UiCount: {
        when: 'beside a label',
        props: '`count` and `max` (99 by default)',
        guarantee:
          'The count is never longer than its largest form, such as 99+ above `max`. A value that is not a number is hidden; a known total of zero is shown as 0.',
        yours:
          'Pass the real count. While it is unknown, pass `NaN`, which draws nothing, or hide the count with `v-if`: an unset `count` is 0. When the count stands alone, say its unit in its accessible name.',
        limit:
          'It is as wide as its digits, so a count that gains a digit moves what stands beside it by a few pixels. It does not hide a 0; for a mark that should disappear at zero, use UiIndicator.',
        without:
          'A long number widens its button or tab and pushes its neighbors aside, and a bad value shows as “NaN”.',
        code: '<UiButton>Inbox <UiCount :count="unread" /></UiButton>',
      },
    },
  },
  wholeText: {
    title: 'Read the full text when a label is shortened',
    label: 'Whole text',
    summary:
      'When a name is too long for its place, it is cut to one line with an ellipsis, and hovering over it or tapping it shows the full text in a tooltip. The tooltip appears only while the text is really cut, and a screen reader always reads the full text. A number that must fit, such as the total in the middle of a donut chart, is shortened instead, and its full value stands in the legend and in the table a screen reader reads.',
    why: 'You can distinguish names that begin alike without guessing what is hidden at the end.',
    who: 'library',
    moment: 'list',
    proof: {
      UiTruncate: [
        'A cut text keeps its whole in a tooltip, while the cut is real.',
        'Text that fits gets no tooltip, and no native title either.',
        'The cut is measured again when the text changes.',
      ],
      UiBadge: [
        'A long label is cut at the width of its place.',
        'A cut label keeps its whole text in a tooltip; text from the slot is cut without one.',
      ],
      UiBarChart:
        'a category period keeps its label, cut to its band, and the table names it whole',
      UiDonutChart:
        'a total too long for the hole is written short there, and in full in the table',
      UiTable: 'stands in a UiTruncate, not under a title',
      UiCopyButton: 'a long inline label stands in a UiTruncate, the glyph kept',
      UiSelect: [
        'a chosen label stands in a UiTruncate, its whole text in the tooltip while cut',
        'the whole-label tooltip stays away while the list is open, where it would stand over the rows',
      ],
    },
    at: { UiTruncate: 'Fits or cut' },
    holds: {
      UiSelect: {
        when: 'the chosen option is longer than its field',
        props: 'none',
        guarantee:
          'The field shows the chosen label on one line, cut with an ellipsis, and its whole text shows in a tooltip on hover while the cut is real. The chevron and the clear button stay in view.',
        yours: 'Nothing; give the field the width its row allows.',
        limit:
          'Only the mouse shows it: a tap opens the list, keyboard focus opens no tooltip, and while the list is open there is none, since it would stand over the rows; the rows of the list are cut too. A screen reader hears the whole label.',
        without:
          'A long client name cut at the end of a narrow field, with no way to read the rest but opening the list.',
        code: '<UiSelect v-model="client" :items="CLIENTS" class="w-48" />',
      },
      UiTable: {
        when: 'a column is set to `truncate`',
        props: '`columns[].truncate`',
        guarantee:
          'The cell keeps one line, cut with an ellipsis, and the whole text stands in a tooltip while the cut is real.',
        yours:
          'Set `truncate` on a column of long names, and a `width` where it should not take the room left.',
        without:
          'A row that grows to three lines for one long name, or a name cut with no way to read the rest.',
        code: '<UiTable :columns="[{ key: \'client\', label: \'Client\', truncate: true }]" :items="rows" aria-label="Invoices" />',
      },
      UiBarChart: {
        when: 'the periods are names, not dates, and are longer than their band',
        props: '`x`',
        guarantee:
          'Each category keeps a label under its bar, shortened to fit when necessary. The bar’s tooltip and the data table available to screen readers provide the full name.',
        yours: 'Nothing; keep the names short where you can.',
        without: 'Long names are thinned out until only one label in four is left on the axis.',
        code: '<UiBarChart :x="regions" :series="series" ariaLabel="Orders by region" />',
      },
      UiDonutChart: {
        when: 'the total or a part is too long for the hole',
        props: '`format`',
        guarantee:
          'The center of the chart uses a compact total, such as “5.3T”, so it fits. The legend and the data table available to screen readers provide the full number.',
        yours:
          'If you pass a `format` function, return a short figure when it is called with the `compact` option.',
        without: 'A total cut to “5,300,000,00…” in the middle of the ring.',
        code: '<UiDonutChart :parts="parts" format="money" ariaLabel="Assets" />',
      },
      UiCopyButton: {
        when: 'an `inline` label is longer than its line',
        props: '`label` with `variant="inline"`',
        guarantee:
          'The label keeps one line, cut with an ellipsis, and its whole text shows in a tooltip while the cut is real. The copy glyph stays in view, and the accessible name is never cut.',
        yours:
          'Keep the label of a framed or ghost copy button to a few words; show a long value there with `truncate`, cut in the middle.',
        limit:
          'The tooltip opens on hover and tap, not on keyboard focus; a screen reader hears the whole name.',
        without: 'A long reference that pushes the glyph off the end of its line.',
        code: '<UiCopyButton :value="ref" :label="ref" variant="inline" />',
      },
      UiTruncate: {
        when: 'one line of text in a narrow place',
        props: '`text`',
        guarantee:
          'Hover or tap a shortened label to read its full text. The component measures whether it fits and checks again when the text or available space changes. Text that fits has no tooltip or native `title`.',
        yours:
          'Pass the full text in `text` and give the component the width it has. Do not cut text by hand with the `truncate` class and a `title`.',
        limit:
          'The text is not a Tab stop, so a keyboard cannot open this tooltip. If people need the full value to complete a task, provide a nearby button or link that opens it.',
        without:
          'An ellipsis and nothing more: the end of the name is gone, and the only way to read it is to widen the window.',
        code: '<UiTruncate :text="file.name" />',
      },
      UiBadge: {
        when: 'it has a long label',
        props: '`label`',
        guarantee:
          'A label longer than its place is cut the same way, with its full text in a tooltip, so the badge does not grow past its column.',
        yours: 'Nothing. Content you put in the slot instead of `label` handles its own cut.',
        without: 'A badge that grows past its column, or a label cut with no way to read the rest.',
        code: '<UiBadge :label="tag.name" />',
      },
    },
  },
  visibleWork: {
    title: 'See where the app is working',
    label: 'Visible work',
    summary:
      'Progress appears where you expect the result. A busy button shows a spinner. A first load shows placeholders shaped like the coming content. A refresh keeps the existing content visible and dimmed, announces “Updating…”, and in a card adds one spinner over the content. A page whose layout is not yet known may show a single spinner in its center.',
    why: 'You can distinguish loading from an empty result or an ignored click, without pressing again to find out.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiCard: [
        'A refresh shows its work: the card dims what it shows and one spinner turns in its middle, over it, so nothing moves.',
        'A first load is a skeleton alone: no spinner for the same wait.',
        'loading over content keeps it at 60% and says updating; with nothing yet it draws the skeleton',
      ],
      UiSkeleton: 'A hidden block in the shape its host gives it.',
      UiFilterList: [
        'a refresh keeps the options in view, dimmed and busy, with no rows of skeleton',
        'a first load draws rows in the options\' shape and says it loads, never "Nothing found"',
      ],
      UiFilter:
        'a first load shows rows in the options\' shape; a refresh keeps the options, dimmed, and says "Updating…"',
      UiBadge: 'While it works a spinner stands where the dot was, and the words say what runs.',
      UiProgress: [
        'The bar says how far it is, and its fill follows value of max.',
        'Work of unknown length runs a band along the track and says no number.',
      ],
      UiSpinner: [
        'The ring turns, at the size its host gives it.',
        'With a name it is a status with that name; without one it is hidden from a screen reader.',
      ],
    },
    at: { UiSpinner: 'Where it turns', UiProgress: 'Bar', UiCard: 'States' },
    holds: {
      UiFilterList: {
        when: 'its options are loading',
        props: '`loading`',
        guarantee:
          'On the first load, five placeholder rows show that options are still arriving. During a refresh, the existing options stay visible but dimmed and unavailable, with the message “Updating…”.',
        yours: 'Set `loading` while the options are loading.',
        limit:
          'A list of more than five options adds its search field above the rows only once they arrive, because their number is not known before.',
        without: 'An empty panel says “Nothing found” while the options are still on their way.',
        code: '<UiFilterList v-model="tags" :items="tags" :loading="pending" />',
      },
      UiFilter: {
        when: 'the options of a single-group filter are loading',
        props: '`loading`',
        guarantee:
          'Loading is shown in the options panel: placeholders on a first load, and during a refresh the existing options dimmed and unavailable, with “Updating…”.',
        yours:
          'Set `loading` while the options are loading; with several sections, set it on each UiFilterList. If the options failed to load, set `disabled` and explain the failure on the page.',
        limit:
          'The filter button itself shows no progress indicator: the wait is shown in the panel, where the options are.',
        without: 'The panel says “Nothing found” while the options are still on their way.',
        code: '<UiFilter v-model="kinds" label="Categories" :items="kinds" :loading="pending" />',
      },
      UiCard: {
        when: 'it is loading over existing content',
        props: '`loading`',
        guarantee:
          'During a refresh, the content and the title dim to 60% and one undimmed spinner turns in the middle of the card, over it, so nothing in the card moves, and its status region says “Updating…”. The card’s own buttons keep their color and still work. A first load uses placeholders without an additional indicator.',
        yours:
          'Bind `loading` to the request; the wording comes from the library. Over `#empty` the card adds nothing: give its Retry `loading`, which shows the wait on the button and refuses a second press.',
        limit:
          'Only the card’s own controls, in `#actions`, a whole `#header` and `#footer`, keep their color; a button in the body dims with the content and still works.',
        without: 'The card only turns pale, and you cannot tell that it is waiting for an answer.',
        code: '<UiCard title="Invoices" :loading="refreshing">…</UiCard>',
      },
      UiSpinner: {
        when: 'a request is running',
        props:
          'it is mounted while the request runs; `aria-label` is set when no words beside it say what is loading',
        guarantee:
          'A spinning ring shows that work is in progress. With an accessible name it is exposed as a status with that name; without a name it is hidden from a screen reader.',
        yours:
          'Show it when the request starts and remove it when the request ends. A spinner that mounts with its name is often not read out, so say the wait in a live region that was on the page before the request starts (UiCard `loading` has one). Inside a button, a badge, a switch or a row, set their `loading` instead of placing a spinner yourself.',
        limit: 'It does not stop a second click; the button’s `loading` does.',
        without:
          'Nothing changes after the click, so you click again and the same request goes twice.',
        code: '<UiButton :loading="saving">Save</UiButton>',
      },
      UiProgress: {
        when: 'the amount of work completed is known',
        props:
          '`value` of `max`, moved as the work goes; `indeterminate` when the length is unknown',
        guarantee:
          'The bar fills with the measured progress, and a screen reader can read its current value. When progress cannot be measured, an animated band shows ongoing work without implying a percentage.',
        yours:
          'Update `value` with the measured progress and name the bar with `aria-label`. Use `indeterminate` when the amount completed is unknown.',
        limit:
          'It does not estimate progress: the bar is only as accurate as the `value` it receives.',
        without: 'A spinner shows that work is ongoing but cannot tell you how much has finished.',
        code: '<UiProgress :value="sent" :max="size" aria-label="Upload of report.pdf" />',
      },
      UiBadge: {
        when: 'the status it shows is being worked on (`loading`)',
        props: '`loading`, with words that say what runs ("Syncing")',
        guarantee:
          'The badge shows a spinner in place of its dot and text such as “Syncing”, and it is marked busy for assistive technology.',
        yours:
          'Set `loading` while the work runs and give words for it. When it must be announced, add a live region of your own.',
        without: 'The badge keeps its old word while the work runs, as if nothing were happening.',
        code: '<UiBadge tone="info" label="Syncing" loading />',
      },
      UiSkeleton: {
        when: 'on a first load whose layout is known',
        props: 'shown from the request to its answer',
        guarantee:
          'Placeholders show that content is still loading and where it will appear; their shimmer shows that loading is in progress.',
        yours:
          'Show it from the start of the request until the answer, and never next to a spinner for the same wait.',
        without: 'A blank space that looks empty rather than loading.',
        code: '<UiSkeleton class="h-4 w-48" />',
      },
    },
  },
  calmMotion: {
    title: 'Reduce motion without hiding loading',
    label: 'Calm motion',
    summary:
      'With the system’s reduced-motion setting enabled, sections open without sliding and attention indicators stop pulsing. Loading indicators keep moving, more slowly: spinners still turn and placeholders still shimmer.',
    why: 'Decorative movement is removed, but you can still see that loading is in progress.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiReveal: 'It opens and closes at once when the system asks for reduced motion.',
      UiSpinner: 'It keeps turning, slower, when the system asks for reduced motion.',
      UiSkeleton: 'It keeps shimmering, slower, when the system asks for reduced motion.',
      UiProgress:
        'The running band keeps running, slower, when the system asks for reduced motion.',
      UiIndicator:
        'Its pulse stops when the system asks for reduced motion: it calls, it does not work.',
    },
    at: {},
    holds: {
      UiReveal: {
        when: 'the block opens or closes, with reduced motion on',
        props: 'the system setting `prefers-reduced-motion: reduce`',
        guarantee:
          'With reduced motion enabled, the section appears or disappears immediately, without sliding.',
        yours: 'Nothing.',
        without: 'Sections keep sliding open and shut although you asked for less movement.',
        code: '<UiReveal v-model:open="open">…</UiReveal>',
      },
      UiSpinner: {
        when: 'reduced motion is on',
        props: 'the system setting `prefers-reduced-motion: reduce`',
        guarantee: 'The spinner continues turning, slowed to one rotation every 1.6 seconds.',
        yours:
          'Nothing. A loading indicator of your own keeps moving only with the `animate-spin` class or the `data-motion-keep` attribute; otherwise it stops with every other animation.',
        without: 'The ring stops with every other animation, and the screen looks frozen.',
        code: '<UiSpinner />',
      },
      UiIndicator: {
        when: 'it pulses (`pulse`) and reduced motion is on',
        props: '`pulse`, and the system setting `prefers-reduced-motion: reduce`',
        guarantee:
          'The pulse stops and the mark stays. The pulse calls for attention rather than showing work, so it is the kind of movement reduced motion removes.',
        yours:
          'Nothing. Use `pulse` for something that needs attention, never for work in progress.',
        without: 'A ring keeps expanding around the mark although you asked for less movement.',
        code: '<UiIndicator dot pulse><UiAvatar name="Anna Petrova" /></UiIndicator>',
      },
      UiProgress: {
        when: 'the work has an unknown length and reduced motion is on',
        props: '`indeterminate`, and the system setting `prefers-reduced-motion: reduce`',
        guarantee: 'The band keeps running along the track, once every 1.6 seconds instead of 1.2.',
        yours: 'Nothing.',
        without: 'The band stops partway along the track, and the work looks stuck.',
        code: '<UiProgress indeterminate aria-label="Uploading" />',
      },
      UiSkeleton: {
        when: 'reduced motion is on',
        props: 'the system setting `prefers-reduced-motion: reduce`',
        guarantee:
          'The placeholder animation slows from one pulse every 2 seconds to one every 3 seconds.',
        yours: 'Nothing.',
        without:
          'The placeholders stand still and gray, and the page looks stalled rather than loading.',
        code: '<UiSkeleton class="h-4 w-32" />',
      },
    },
  },
  stillList: {
    title: 'Search while the table stays in place',
    label: 'Still while loading',
    summary:
      'You can keep typing while the table loads your search. Placeholder rows immediately replace the previous results, preserving their space and at least the height of an empty or error message. Sorting or paging within the same search keeps the existing rows visible and dimmed. Keyboard focus and your text stay in the search field throughout.',
    why: 'The table does not collapse with every letter, and old results are not mistaken for the answer to the new query. Its height may change once, when the new result arrives.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiDataTable: [
        'a new search draws skeleton rows at once, in place of the rows of the last answer',
        'the skeleton holds as many rows as were in view, and never fewer than the floor',
        'the empty answer and the failed load stand on the floor the skeleton fills',
        'a failed new search shows the plate with Retry, not the rows of the last answer; Retry brings the skeleton',
        'a sort or a page of the same search keeps the rows in place, dimmed',
        'while a search is out, the field keeps the focus and the typing, and draws no spinner',
      ],
      UiTable: [
        'a failed load shows the message with a retry; a failed refresh shows the same plate in place of the rows',
        'a retry in flight after a failure draws the skeleton: no retry is left to press twice',
      ],
    },
    at: {},
    holds: {
      UiDataTable: {
        when: 'a new search or filter is running, or a sort or page change within the same search',
        props: '`search`, `loading`',
        guarantee:
          'A new search replaces the previous rows, empty message or error with placeholders, matching the previous row count and at least the height of an empty or error message. Sorting or paging keeps the existing rows visible and dimmed. A failed request replaces the rows with a Retry message at the same height, and pressing Retry restores the placeholders. The search field keeps your text and keyboard focus and shows no spinner of its own.',
        yours:
          'Set `loading` while the request runs. For a filter of your own, also empty `items` in the same step that sets `loading`, until its answer comes: the placeholder rows then take their place, as many as were in view.',
        limit:
          'An answer with more or fewer rows than were in view changes the table’s height once, when it arrives.',
        without:
          'The list dims for one letter and blanks for the next, and everything below it jumps up and down while you type.',
        code: '<UiDataTable v-model:search="search" :columns="columns" :items="rows" :total="total" :loading="pending" />',
      },
    },
  },
  noJolt: {
    title: 'Keep nearby content in place while loading',
    label: 'Stable dimensions',
    summary:
      'You can keep reading, or reach for a button, while nearby content loads. Placeholders reserve space for the expected content, media keeps its space before it arrives, and a refresh keeps the existing content in place. The final result can still shift the layout once if its size differs from the reserved space.',
    why: 'A button that shifts under the pointer is easy to miss, and a page that keeps changing shape makes you look for your reading position again.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiChartCard: [
        'the first load hands the chart its skeleton and says it loads',
        'a refresh keeps the chart in view, dimmed and busy, and says it is updating',
        'the words of a failed load add no height of their own above and below',
      ],
      UiSelect:
        'options the app is loading show rows in their shape and say so, never "No matches"',
      UiAppShell:
        'places on their way draw five rows in their shape, keep the footer, and say so once',
      UiButton: [
        'reserves the loading width even when the loading prop arrives after the first render',
        'the idle width sizer carries the #loading slot text',
        'a toggle that is off holds the room of its check, so pressing it moves nothing',
      ],
      UiAspectRatio: 'The box holds its place before the media loads: its proportions are its own.',
      UiCard: [
        'a refresh dims the body in place: the content is not mounted again',
        'loading over content keeps it at 60% and says updating; with nothing yet it draws the skeleton',
        'a load after the empty state keeps it in place: the card keeps its height',
      ],
      UiCrudDrawer:
        '#loading draws the skeleton of the form that comes, in place of the two default fields',
      UiSkeleton: 'A hidden block in the shape its host gives it.',
      UiTable: [
        'a skeleton row has the height of a text row and its bar follows the column alignment',
        'a refresh in flight keeps the existing rows instead of skeleton rows, and says it is busy',
      ],
      UiLog: 'older events append after the last one and leave the nodes already shown',
      UiDataTable:
        'holds the footer while the first page loads, so nothing moves when the total arrives',
      UiAvatar: [
        'The avatar container and initials remain rendered while the photo loads.',
        'The avatar keeps its size while the photo loads, once it arrives and if it fails.',
        'Initials are shown on mount if the photo has already failed.',
      ],
    },
    at: {
      UiAppShell: 'Loading',
      UiButton: 'Loading',
      UiAspectRatio: 'Fit',
      UiCard: 'States',
      UiSkeleton: 'By hand',
      UiTable: 'States',
      UiAvatar: 'Photo',
    },
    holds: {
      UiChartCard: {
        when: 'the data loads, refreshes, comes back empty or fails',
        props: '`loading`, `empty`, `error`',
        guarantee:
          'On the first load, placeholders reserve space for the chart and its headline. A refresh keeps the chart visible and dimmed. An empty result or a failed first load shows its message in the chart’s space; a failed refresh keeps the existing chart and marks it as not updated.',
        yours:
          'Keep `value` and `caption` as `null` while they load, so their lines keep their space.',
        without: 'A small spinner first, then a chart that pushes the cards below it down.',
        code: '<UiChartCard title="Revenue" :value="total" :loading="pending" :empty="!rows.length"><UiBarChart … /></UiChartCard>',
      },
      UiDataTable: {
        when: 'the first page loads',
        props: '`loading`, `total`',
        guarantee:
          'The footer already has its space while the first page loads, so the total appears without moving the content below. Sorting or paging keeps the existing rows visible and dimmed. A new search preserves the space as described in “Search while the table stays in place”.',
        yours: 'Leave `total` unset until the first answer.',
        without: 'The footer appears with the total and pushes the page down.',
        code: '<UiDataTable :items="rows" :total="total" :loading="loading" />',
      },
      UiTable: {
        when: 'rows load: the first page, or a refresh with rows in view',
        props: '`loading`, `skeletonRows`',
        guarantee:
          'The first load shows placeholder rows sized like text rows, as many as the page size. A refresh keeps the existing rows visible, dimmed and marked busy, so the table does not collapse while waiting.',
        yours: 'Set `skeletonRows` to the page size.',
        limit: 'A page that comes back shorter or longer still changes the height once.',
        without:
          'The rows disappear for the refresh, and everything below the table jumps up, then down.',
        code: '<UiTable :columns="columns" :items="rows" :loading="pending" :skeleton-rows="20" />',
      },
      UiSelect: {
        when: 'the app loads the options itself',
        props: '`loading`',
        guarantee:
          'While the list has no results, it shows placeholders shaped like options, with checkboxes when `multiple` is enabled. Once open, it keeps the height it has reached as options arrive. A selected value whose option is still loading shows a loading state in the field.',
        yours: 'Pass `loading` while the options load; a `fetcher` reports its own loading.',
        without:
          'An empty list says nothing matches, then grows under the pointer when the options arrive.',
        code: '<UiSelect v-model="courier" :items="couriers ?? []" :loading="!couriers" />',
      },
      UiAppShell: {
        when: 'the navigation items arrive from the server after the shell is drawn',
        props: '`loading`',
        guarantee:
          'While the navigation loads, the sidebar draws five placeholder rows in the shape of its places, with the logo and the footer already in place. When the places arrive they take the rows’ place.',
        yours: 'Pass `loading` with an empty `nav` until the items arrive.',
        limit:
          'Vertical positions match the placeholders only for a single navigation group without a heading. Additional groups or headings can move rows when they arrive.',
        without:
          'The sidebar is an empty column with nothing to show that places are coming, and the rows appear all at once when the items arrive.',
        code: '<UiAppShell :nav="places ?? []" :loading="!places" :current="route.path">…</UiAppShell>',
      },
      UiLog: {
        when: 'older events arrive',
        props: '`hasMore`, `@more`',
        guarantee:
          'Older events are added after the last one; what was already on screen stays where it was.',
        yours:
          'Append older events to `items`; do not replace the array when loading more history.',
        without: 'The list is redrawn from the top, and you have to find your place again.',
        code: '<UiLog :items="events" :has-more="more" @more="loadOlder" />',
      },
      UiButton: {
        when: 'its loading text is longer than its label, or it is a toggle',
        props: '`loading`, with `loadingText` or the `#loading` slot; `pressed`',
        guarantee:
          'From the first render, the button reserves room for both its label and its loading text, so “Save” becomes “Saving…” without moving anything beside it. A toggle that is off reserves the room for its check mark the same way, so pressing it moves nothing.',
        yours:
          'Nothing: pass the loading text to the button (`loadingText` or the `#loading` slot) instead of swapping its label yourself.',
        without: '“Save” grows into “Saving…” and pushes Cancel aside just as you reach for it.',
        code: '<UiButton :loading="saving" loading-text="Saving…">Save</UiButton>',
      },
      UiAspectRatio: {
        when: 'a photo, a video or an embedded frame is on its way',
        props: '`ratio`, the media in the slot',
        guarantee:
          'The box takes its height from its width and ratio before the media arrives, so the text below stays where it is when the media loads or fails.',
        yours:
          'Give the box a width (its column or a class), and set the background shown while it waits.',
        without:
          'An image has no size until it arrives: the space is empty, then everything below jumps down.',
        code: '<UiAspectRatio :ratio="4 / 3" class="bg-neutral-subtle">\n  <img :src="photo" alt="…" />\n</UiAspectRatio>',
      },
      UiCard: {
        when: 'it loads, on a first load and on a refresh',
        props: '`loading`, bound where the card loads, `false` included',
        guarantee:
          'The first load shows three placeholder lines. During a refresh, the card keeps what it shows mounted, its content dimmed or its empty state unchanged, so the card keeps its space and any input already entered in that content.',
        yours:
          'Bind `loading` to the request. A body with its own layout, such as a table or a chart, draws its own placeholders.',
        without:
          'The content gives way to a spinner during a refresh: the card shrinks, and everything below it jumps up, then back down.',
        code: '<UiCard title="Invoices" :loading="loading">…</UiCard>',
      },
      UiSkeleton: {
        when: 'on a first load',
        props: 'the host gives it the size and shape of what comes',
        guarantee:
          'The placeholder reserves space in the shape of the expected content, so when the content replaces it nothing nearby moves, as long as the dimensions match.',
        yours:
          'Give it the size and shape of the content to come, and remove it when the data arrives. Inside a card, a table, a drawer or a chart card, set their `loading` instead.',
        limit:
          'It does not announce that the page is loading; the surrounding component’s `role="status"` does.',
        without:
          'The space stays empty, and when the content arrives everything below it jumps down.',
        code: '<UiSkeleton class="h-4 w-48" />',
      },
      UiAvatar: {
        when: 'it has a photo',
        props: '`src` is set',
        guarantee:
          'The initials hold the place while the photo loads or if it fails, and the avatar never changes size.',
        yours: 'Nothing. Do not put a spinner or a placeholder of your own over the avatar.',
        limit: 'A failed photo is not retried; a new `src` tries again.',
        without:
          'An empty spot while the photo loads, a broken-image icon if it fails, and the row shifts when it arrives.',
        code: '<UiAvatar name="Anna Petrova" src="/anna.jpg" />',
      },
    },
  },
  keepPlace: {
    title: 'Keep reading as older events load',
    label: 'Focus after loading',
    summary:
      'Older events are appended below the ones already shown, so loading more history does not send you back to the top. If “Load older events” had keyboard focus and disappears because no older events remain, focus moves to the first new event, and a screen reader announces how many arrived.',
    why: 'You can continue from the newly loaded events instead of finding where you left off after the loading button disappears.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiLog:
        'Show older keeps the place: focus moves to the first new event when the button goes, and the count is said',
    },
    at: { UiLog: 'Older' },
    holds: {
      UiLog: {
        when: 'older events load on request',
        props: '`hasMore`, `@more`',
        guarantee:
          'If “Load older events” had focus and disappears after the final load, focus moves to the first new event. A screen reader announces the result, such as “2 older events loaded”.',
        yours: 'Resolve the `@more` promise once the older events are in `items`.',
        without:
          'The button disappears with keyboard focus on it; focus falls to the page, and a screen reader loses its place.',
        code: '<UiLog :items="events" :has-more="more" @more="loadOlder" />',
      },
    },
  },
  exactTime: {
    title: 'See when each event happened',
    label: 'Exact time',
    summary:
      'Read a record’s history by day, with each event’s time shown beside it. When events use Date values, headings identify Today, Yesterday or a date, including the year for older events. Hover over a time to see the complete date and time in the app’s time zone.',
    why: 'You can distinguish recent activity from older events and find out exactly when a change happened.',
    who: 'library',
    moment: 'list',
    proof: {
      UiLog:
        'a Date of today reads the hour, another day its date, another year its year; the exact moment is on the time',
    },
    at: {},
    holds: {
      UiLog: {
        when: 'events carry a Date',
        props: '`at` as a Date',
        guarantee:
          'When every event uses a Date value, the history groups events by day and shows each event’s time. Headings identify Today, Yesterday or the weekday and date, adding the year when needed. Hover over a time for the full date and time in the app’s time zone. If any timestamp is supplied as text, events are not grouped by day and each retains its own date.',
        yours:
          'Set the time zone in `createGrani({ timeZone })`; otherwise the server and the browser may show different hours and days.',
        without: '“2 days ago” with no way to tell the hour.',
        code: '<UiLog :items="events" />',
      },
    },
  },
  wasAndBecame: {
    title: 'Read old and new values in full',
    label: 'Values never cut',
    summary:
      'See exactly what changed in a record, with the old and new values shown together. Long values wrap onto more lines so the differing characters remain visible. A single change appears on one line; several changes use a table.',
    why: 'You can review the change without opening an older version, even when two long values differ only at the end.',
    who: 'library',
    moment: 'list',
    proof: { UiLog: 'a long was and became wrap and keep both values readable, none is cut' },
    at: { UiLog: 'Changes' },
    holds: {
      UiLog: {
        when: 'an event changed values',
        props: '`changes` with `from` and `to`',
        guarantee:
          'No value is cut: a long one wraps, so the old and the new value read in full. One change stands on its own line, such as “Status Waiting → Approved”; several stand in a table with the field, the previous value and the new value.',
        yours:
          'Pass each change in `changes` with `from` and `to`, the values as they were before and after.',
        without: 'Values cut to one line: two long addresses that differ at the end look the same.',
        code: '<UiLog :items="events" />',
      },
    },
  },
  offCloses: {
    title: 'Close an open picker when its field is disabled',
    label: 'Off closes',
    summary:
      'If a select or date field becomes disabled while its list or calendar is open, the popup closes. Focus returns to the field, so you keep your place in the form even though that field cannot currently accept a choice.',
    why: 'An open list should not offer choices the field no longer accepts, and with focus on the field you do not have to find your place again.',
    who: 'library',
    moment: 'close',
    proof: {
      UiSelect: 'disabling while open closes the list and keeps the focus on the field',
      UiDatePicker: [
        'disabling closes an open calendar',
        'disabling while the calendar has the focus keeps it on the field, not on the body',
      ],
    },
    at: { UiSelect: 'States' },
    holds: {
      UiSelect: {
        when: 'it is disabled while its list is open',
        props: '`disabled`',
        guarantee: 'The list closes and keyboard focus stays on the field.',
        yours: 'Nothing.',
        without: 'The list stays open over a field that no longer accepts a choice.',
        code: '<UiSelect v-model="currency" :items="currencies" :disabled="saving" />',
      },
      UiDatePicker: {
        when: 'it is disabled while its calendar is open',
        props: '`disabled`',
        guarantee:
          'The calendar closes, and keyboard focus moves from the calendar to the field instead of falling to the page.',
        yours: 'Nothing.',
        without: 'The calendar stays open over a field that no longer accepts a day.',
        code: '<UiDatePicker v-model="due" :disabled="locked" />',
      },
    },
  },
  fiveRows: {
    title: 'Notice when there are more options below',
    label: 'Five and a half rows',
    summary:
      'A long list shows five options and part of the sixth, so you can see there is more to scroll to. You scroll inside the list to reach the rest. The list is never taller than the available screen space.',
    why: 'The partially visible row shows that the list continues, so you are less likely to miss an option below the edge.',
    who: 'library',
    moment: 'list',
    proof: {
      UiTableColumns: 'a long list of columns is cut at five rows and a half',
      UiFilterList: 'a long list is cut at five rows and a half',
      UiSelect: 'a long list is cut at five rows and a half',
      UiDateRange: 'the list is cut at five rows and a half',
    },
    at: { UiFilterList: 'Search', UiTableColumns: 'In a toolbar' },
    holds: {
      UiTableColumns: {
        when: 'a table of more than five columns',
        props: 'none: every UiTableColumns',
        guarantee:
          'The list shows five columns and half of the sixth, so the cut says more wait below; the keys bring a column past the cut into view.',
        yours: 'Nothing.',
        without: 'A list cut on a row’s edge that looks finished while columns wait below it.',
        code: '<UiTableToolbar v-model:search="q" :columns="columns" />',
      },
      UiFilterList: {
        when: 'there are many options',
        props: 'none',
        guarantee:
          'The list is cut at five and a half rows, so the half row shows there is more below. When you move with the arrow keys, the highlighted row is scrolled into view inside the list.',
        yours: 'Nothing.',
        without: 'A list cut at a row edge that looks finished.',
        code: '<UiFilterList v-model="countries" :items="all" />',
      },
      UiDateRange: {
        when: 'there are more presets than fit',
        props: 'none',
        guarantee:
          'The list of presets is cut at five and a half rows, so the half row shows there are more below.',
        yours: 'Nothing.',
        without: 'A list cut at a row edge that looks finished.',
        code: '<UiDateRange v-model="issued" />',
      },
      UiSelect: {
        when: 'the list is long',
        props: 'none',
        guarantee:
          'The list is cut at five and a half rows, so the half row shows there is more below.',
        yours: 'Nothing.',
        without: 'A list cut at a row edge that looks finished.',
        code: '<UiSelect v-model="country" :items="countries" />',
      },
    },
  },
  steadyWidth: {
    title: 'Keep nearby buttons and fields in place',
    label: 'Steady width',
    summary:
      'Controls keep their width as their values change, so nearby controls stay in place. Filters, date fields, selects, steppers and period buttons reserve room for their widest content, and the segments of a switcher such as Day, Week, Month keep one width whichever is selected. A custom date range may still widen its button if it is wider than every named period.',
    why: 'When you make several choices in a row, the next button stays where you expect it, so a click meant for it does not land on another one.',
    who: 'library',
    moment: 'list',
    proof: {
      UiFilter: [
        'the funnel and the count share one fixed slot, so the width holds',
        'a count above 9 reads 9+ and is spoken exactly',
      ],
      UiDateRange: 'the button stands over the widest named period, so a pick keeps its width',
      UiDatePicker: [
        'the field stands over the widest date and keeps the place of the cross, so a pick keeps its width',
        "disabling keeps the width: the cross's place stays",
      ],
      UiRadioGroup:
        'segments keep one weight whether chosen or not, so none changes width on a pick',
      UiSelect: [
        'the field keeps its width: the text stands over the longest labels, the cross keeps its place',
        'the clear cross pulls to the capsule edge and, at xs, fits inside the capsule; its kept place matches it',
      ],
      UiStepper:
        'the count keeps its 3em whatever its digits, minus and plus at the edges, so neither moves',
    },
    at: { UiFilter: 'Sizes', UiDatePicker: 'Base', UiRadioGroup: 'Segmented', UiStepper: 'Base' },
    holds: {
      UiStepper: {
        when: 'the count grows past a digit, 9 to 10',
        props: 'none',
        guarantee:
          'Minus and plus stand at the edges of a count of one width, so a count that grows from 9 to 10 to 100 moves neither of them: pressing plus again lands on plus.',
        yours: 'Nothing; give the stepper a width where the row needs a wider count.',
        limit:
          'A count longer than its width is cut at its end, not widened: give the stepper a width for counts that large.',
        without:
          'A field as wide as its number: at 10 it widens, and the plus moves from under the pointer pressing it.',
        code: '<UiStepper v-model="qty" :min="1" ariaLabel="Quantity" />',
      },
      UiSelect: {
        when: 'one option is picked from a list it holds',
        props: '`items`, without `fetcher` or `multiple`',
        guarantee:
          'Picking an option, or clearing it, does not move the fields beside it: the field reserves the width of its longest option or its placeholder, and keeps the place of the clear button while it is hidden.',
        yours:
          'Give the field a width where the row needs one; without it, the field is as wide as its longest option.',
        limit:
          'Options from a server (`fetcher`) and several picks (`multiple`) are not known in advance, so their field does not reserve the longest one. The longest labels are counted in letters: one of wide letters outside the three longest can still widen the field.',
        without:
          'A field as wide as its text: a longer option widens it at the pick and pushes the field beside it.',
        code: '<UiSelect v-model="currency" :items="CURRENCIES" />',
      },
      UiRadioGroup: {
        when: 'it is a segmented bar',
        props: '`variant="segmented"`',
        guarantee:
          'Each segment keeps the same font weight and width whether selected or not, so choosing one does not push the next option sideways.',
        yours: 'Nothing.',
        without:
          'The picked segment turns bold, its word grows wider, and the segments after it shift sideways.',
        code: '<UiRadioGroup v-model="period" variant="segmented">…</UiRadioGroup>',
      },
      UiFilter: {
        when: 'something is chosen in it',
        props: 'none',
        guarantee:
          'The count replaces the filter icon in a slot of fixed width, up to 9 and then “9+”, so the button and everything beside it in the toolbar stay in place.',
        yours: 'Nothing.',
        without:
          'A count added after the label: the button grows at the first tick and pushes the period filter beside it.',
        code: '<UiFilter v-model="kinds" label="Categories" :items="CATEGORIES" />',
      },
      UiDateRange: {
        when: 'it stands in a toolbar',
        props: 'none',
        guarantee:
          'The button reserves the width of the widest named period, and of All time and Custom range, so picking one of them does not move the search and filters beside it. With `stepper` the arrows stand before the button, so at the start of a row, as in a toolbar’s `#start`, a longer period never moves them from under the pointer.',
        yours: 'Nothing.',
        limit:
          'A custom span of another year, or across the turn of a year, can be wider than every named period: the button then grows toward the end of the row.',
        without: 'A button as wide as its text, so each pick shifts the rest of the row.',
        code: '<UiDateRange v-model="issued" />',
      },
      UiDatePicker: {
        when: 'a day is picked or cleared, or the field turns off',
        props: 'none',
        guarantee:
          'Choosing or clearing a date does not move neighboring fields. The field reserves enough width for the longest date in the app’s format or its placeholder, and keeps space for the clear button even when it is hidden.',
        yours:
          'Give the field a width where the row needs one; without it, the field is as wide as its widest date.',
        without:
          'A field as wide as its text: it changes width when a date replaces the placeholder or the clear button appears, and pushes the amount field beside it.',
        code: '<UiDatePicker v-model="due" />',
      },
    },
  },
  resetHeld: {
    title: 'Keep Reset in one place',
    label: 'Reset held',
    summary:
      'Reset stays in the footer of filter and column panels. It becomes available when there is something to reset, without appearing as a new row or moving the options you are selecting.',
    why: 'You can tick several boxes in a row without a click landing on a row that was pushed into its place.',
    who: 'library',
    moment: 'list',
    proof: {
      UiTableColumns:
        'a tick applies at once; the summary counts the hidden; Reset is held until something differs',
      UiFilter:
        'Reset is in the same place before and after the first tick, held while nothing is chosen',
    },
    at: { UiFilter: 'One dimension' },
    holds: {
      UiTableColumns: {
        when: 'the panel is open and you hide or show the first column',
        props: 'none',
        guarantee:
          'Reset and the hidden-column count, such as “2 hidden”, have a fixed place in the footer. Reset becomes available when column visibility differs from the default, without changing the panel’s layout.',
        yours: 'Nothing.',
        limit:
          'Reset returns to the columns hidden by default (`hiddenByDefault`), not to every column shown.',
        without:
          'A Reset that appears only once a column is hidden, so the footer changes under the pointer.',
        code: '<UiTableToolbar v-model:search="query" :columns="cols" />',
      },
      UiFilter: {
        when: 'the panel is open and you tick its first box',
        props: 'none',
        guarantee:
          'Reset is present below the divider from the moment the panel opens. It stays disabled until an option is selected, then becomes available without moving any rows.',
        yours:
          'With one dimension, nothing. With several sections, pass `count` and clear the sections’ lists when `reset` arrives.',
        without:
          'A Clear link that appears above the list at the first tick, so the rows move down under the pointer.',
        code: '<UiFilter v-model="kinds" label="Categories" :items="CATEGORIES" />',
      },
    },
  },
  chosenFirst: {
    title: 'Find what you chose at the top of a long filter',
    label: 'Chosen first',
    summary:
      'From six options, a filter opens with the options you already chose at the top, in their own order. The order stays while the panel is open, so a tick never moves a row under the pointer.',
    why: 'In a long list you see and change your choice at once, instead of scrolling to find the ticks.',
    who: 'library',
    moment: 'list',
    proof: {
      UiTableColumns: [
        'from six columns the ones shown open at the top, in the order of the table',
        'from six columns the shown and the hidden stand under their names, a line between',
      ],
      UiFilterList: [
        'from six options the chosen ones open at the top, in their own order, and stay put while ticking',
        'five or fewer keep their order',
      ],
      UiFilter: 'a long filter opens with the chosen options at its top',
    },
    at: { UiFilter: 'Many options: a search', UiTableColumns: 'In a toolbar' },
    holds: {
      UiTableColumns: {
        when: 'a table of six columns or more',
        props: 'none: every UiTableColumns',
        guarantee:
          'The columns the table shows open at the top of the list under Shown, in the table’s order, and the hidden ones below a line under Hidden, so you see why the list runs in another order than the table; the order holds while the panel is open, so a tick never moves a row under the pointer.',
        yours: 'Nothing.',
        without: 'The columns in view scattered down a long list, some below its fold.',
        code: '<UiTableToolbar v-model:search="q" :columns="columns" />',
      },
      UiFilter: {
        when: 'the panel of a filter of six options or more opens with something chosen',
        props: '`items`, `v-model`',
        guarantee:
          'The chosen options stand first, in their own order, and the rest follow; the order is the one the panel opened with, so nothing moves while you tick.',
        yours: 'Nothing.',
        limit:
          'Five options or fewer keep their order, which is read at a glance and may mean something, such as Paid, Due, Overdue.',
        without: 'The ticks of a long filter scattered down the list, below its fold.',
        code: '<UiFilter v-model="tags" label="Tags" :items="TAGS" />',
      },
    },
  },
  onlyThis: {
    title: 'Keep one option and clear the rest in one press',
    label: 'Only this',
    summary:
      'The highlighted option of a filter offers Only, which keeps that option chosen and clears the others. From the keyboard, Alt+Enter does the same.',
    why: 'Narrowing a list to one value takes one press instead of unticking every other box.',
    who: 'library',
    moment: 'list',
    proof: {
      UiTableColumns: [
        'Only keeps the highlighted column alone, and a required column stays beside it',
        'Only on a hidden column leaves that column alone in view',
      ],
      UiFilterList: [
        'Only on a row keeps it alone, and the press does not tick the row',
        'Alt+Enter keeps the highlighted option alone; a fixed chosen option stays',
      ],
      UiFilter: 'Only on the highlighted row keeps that option alone',
    },
    at: { UiFilter: 'One dimension', UiTableColumns: 'In a toolbar' },
    holds: {
      UiTableColumns: {
        when: 'a table of three columns or more',
        props: 'none: every UiTableColumns',
        guarantee:
          'The highlighted row offers Only, which shows that column alone and hides the others in one press; a required column stays beside it, and Reset brings the default back.',
        yours: 'Nothing.',
        without: 'Unticking every other column, one by one, to look at a single one.',
        code: '<UiTableToolbar v-model:search="q" :columns="columns" />',
      },
      UiFilter: {
        when: 'a filter of three options or more is open',
        props: '`items`, `v-model`',
        guarantee:
          'The highlighted row shows Only at its end; it, or Alt+Enter, keeps that option alone and unticks the others. A fixed option stays as it is.',
        yours: 'Nothing.',
        limit: 'A filter of one or two options offers no Only: a single tick does the same.',
        without: 'Unticking every other box, one by one, to see a single value.',
        code: '<UiFilter v-model="statuses" label="Status" :items="STATUSES" />',
      },
    },
  },
  edgeSaysMore: {
    title: 'See that a row goes on past its edge',
    label: 'More past the edge',
    summary:
      'When columns or tabs do not fit, the side with more past it is marked, and with a mouse an arrow there pages to the rest: a table shades the edge where its columns slide under the row actions, tabs fade theirs. A wide table scrolls from the keyboard too, and keeps the actions of its rows in view at the end.',
    why: 'A table cut at the screen’s edge reads as complete, and the column you need, or the actions of a row, stay out of sight.',
    who: 'library',
    moment: 'list',
    proof: {
      UiTable: [
        'fades at the end while more columns wait there',
        'fades at the start once scrolled, and not at the end when the end is reached',
        'a table that fits draws no fade',
        'the horizontal scroll box is keyboard-focusable and named once the table overflows',
        'row actions add a sticky last column with a named header; a footer cell adds the footer row',
        "the end's shade stands at the row actions, where the columns slide under them",
        'an edge with more columns past it grows an arrow that pages the table, for the pointer',
        'at the end the arrow stands at the start and pages back',
        'an empty or a failed wide table draws no shade and no arrow over its plate',
      ],
      UiTabs: [
        'a long set scrolls sideways without a bar and never wraps',
        'edges that hide tabs fade and grow arrows; a set that fits has neither',
        'the arrows are for a mouse: drawn only on a device whose pointer hovers and is fine, never on touch',
      ],
    },
    at: { UiTable: 'Wide' },
    holds: {
      UiTable: {
        when: 'its columns are wider than its box',
        props: 'none: every UiTable; `#row-actions` for the actions of a row',
        guarantee:
          'A shade marks the edge with more columns past it: the end at first, at the row actions, where the columns slide under them, and the start once scrolled. On a desktop pointer an arrow in the header’s band pages the table toward that edge; the scroll box takes the focus and the arrow keys scroll it. The actions of each row stay at the end, in view.',
        yours:
          'Nothing. Give a column of long names `truncate`, and a `width` where a column should not grow.',
        limit:
          'The arrows are for a desktop pointer: on a touch screen the table is swiped. An arrow stands over the edge of the header cell under it, which is pressed beside it. The header row does not stick to the top of the page as the page scrolls.',
        without:
          'A table cut at the screen’s edge that looks complete, with the actions of its rows out of sight.',
        code: '<UiTable :columns="manyColumns" :items="rows" aria-label="Invoices" />',
      },
      UiTabs: {
        when: 'its tabs are wider than their strip',
        props: 'none: every UiTabs',
        guarantee:
          'The strip scrolls sideways without a bar and never wraps; an edge that hides tabs fades, and with a mouse an arrow there pages to the rest.',
        yours: 'Nothing.',
        without:
          'Tabs past the edge that nobody knows are there, or a strip that breaks onto a second line.',
        code: '<UiTabs v-model="tab" :tabs="tabs" aria-label="Sections" />',
      },
    },
  },
  lastColumnStays: {
    title: 'Keep at least one column visible',
    label: 'Last column stays',
    summary:
      'The column menu keeps at least one column visible. Once only one remains, its checkbox is disabled and marked “Last one”. If an older saved preference would hide every column, the first column is shown instead.',
    why: 'You can still identify the records in the table instead of seeing empty rows that look like a loading failure.',
    who: 'library',
    moment: 'list',
    proof: {
      useTableColumns:
        'a table with no required column keeps one column visible however many are unticked, including from storage',
      UiTableColumns: 'the last column shown is held and marked Last one',
    },
    at: { UiTableColumns: 'No column required' },
    holds: {
      UiTableColumns: {
        when: 'no column is required and all but one are hidden',
        props: '`useTableColumns(key, columns)` with no `required`',
        guarantee:
          'The last column shown cannot be unticked and is marked “Last one”, so the table always shows at least one column.',
        yours:
          'Put an identifying column, such as a name or record number, in `required` to keep it visible. The component prevents hiding the last visible column automatically.',
        limit:
          'A stored choice that hides every column, for example one saved for an older set of columns, shows the first column.',
        without:
          'A menu that unticks the last column, leaving empty rows that read as a failed load.',
        code: "const cols = useTableColumns('invoices', COLUMNS)",
      },
    },
  },
  lastDayWhole: {
    title: 'Count the last day of a period whole',
    label: 'Last day whole',
    summary:
      'A period from the 1st to the 31st takes in everything on the 31st, up to midnight by the app’s clock. The filter hands the app the moments its period covers, from midnight of the first day to midnight after the last, so a query never stops where the last day begins or at the server’s midnight.',
    why: 'A report for October that quietly leaves out the invoices of the 31st, or moves its edges by the server’s time zone, gives a wrong total that nobody checks.',
    who: 'library',
    moment: 'list',
    proof: {
      dateRange: [
        'runs from midnight of the first day to midnight after the last, in the app’s zone',
        'keeps a day whole across a change of the clock',
        'an open end is no bound, All time none at all, and ends given backwards are one period',
      ],
      UiDateRange:
        'a period picked here gives a query its moments, the last day whole, by periodBounds',
    },
    at: { UiDateRange: 'Toolbar' },
    holds: {
      UiDateRange: {
        when: 'the app queries records by the moment they happened',
        props: '`periodBounds(period, { timeZone })`',
        guarantee:
          'It gives the moments the period covers: midnight of its first day and midnight after its last, by the clock of the zone given, so a query for `at >= start && at < end` counts the last day whole, a day the clock changes on too.',
        yours:
          'Query with these two moments, not with the bare days, and pass the zone the app gave `createGrani({ timeZone })`, its `locale`, and the filter’s `min` and `max`.',
        limit:
          'The filter does not run the query: an app that compares timestamps with the bare days still loses the last day.',
        without:
          'A query for `at <= "2026-10-31"` stops at the midnight that starts the 31st, and that day’s invoices are missing from the report.',
        code: "const { start, end } = periodBounds(period, { timeZone: 'Europe/Moscow', locale: 'ru' })",
      },
    },
  },
  namedPeriodRolls: {
    title: 'Keep “Last month” and “Today” up to date',
    label: 'Period rolls',
    summary:
      'A saved period keeps the meaning of its name: opening a Last month link in October shows September. Named periods are recalculated when the page opens and when the day changes. Date-picker presets such as Today update within a minute of midnight. A custom range keeps the exact dates you chose.',
    why: 'A saved view or a shared link keeps meaning what its name says, so you do not read an old month’s figures as the latest ones.',
    who: 'library',
    moment: 'list',
    proof: {
      UiDatePicker: 'presets follow midnight',
      UiDateRange: [
        'a named preset whose days went stale is re-resolved against today, on mount and across a month end',
        'a preset without days in the model fills them',
      ],
      dateRange: 'a named preset is counted from today in the zone, whatever days it carries',
    },
    at: { UiDateRange: 'Toolbar' },
    holds: {
      UiDateRange: {
        when: 'a named period is kept, in a URL or a saved view',
        props: '`v-model` with `preset`',
        guarantee:
          'A saved view on Last month still shows the previous calendar month when opened later: the period is recalculated when the page opens and when the day changes, and the updated dates are sent through `v-model`. A preset that has no dates yet gets them filled in.',
        yours:
          'Store `preset` together with the dates, including in the URL, so the component knows whether to recalculate a named period or preserve a custom range. Query with `periodBounds`: it counts a named period from today itself, so the first request, on the server too, asks for the new month and not the days saved with the link.',
        without: 'Days saved once: “Last month” shows the same month forever.',
        code: '<UiDateRange v-model="issued" />',
      },
      UiDatePicker: {
        when: 'it has presets and the page stays open past midnight',
        props: '`presets`',
        guarantee:
          'The presets move on within a minute of midnight, in the app’s time zone: after midnight, Today picks the new day.',
        yours: 'Nothing.',
        without:
          'After midnight, Today still picks the day before, and Yesterday the day before that.',
        code: '<UiDatePicker v-model="spent" presets />',
      },
    },
  },
  halfPickDropped: {
    title: 'Keep the current period until both days are picked',
    label: 'Half pick dropped',
    summary:
      'Your current period stays in effect until you select both ends of a new range. If you close the panel before selecting both dates, the unfinished range is discarded, and the panel next opens on its list of periods. If the app sets another period while you are selecting, the unfinished range is discarded too.',
    why: 'You can explore dates and cancel without changing the records shown by the current filter.',
    who: 'library',
    moment: 'close',
    proof: {
      UiDateRange: [
        'a half-made span is dropped on close: reopened, the panel is the list again',
        'a period set from outside while the calendar is half picked drops the half pick',
      ],
    },
    at: { UiDateRange: 'Outside' },
    holds: {
      UiDateRange: {
        when: 'you start a custom range and leave it unfinished',
        props: 'none',
        guarantee:
          'Nothing is applied until both days are picked. Closing the panel after one day drops that day and keeps the period as it was, and a period set from outside drops it too, so your next click starts a new range.',
        yours: 'Nothing.',
        without:
          'Each click applies at once: the first day becomes “from that day on”, and the list changes for a range you never finished.',
        code: '<UiDateRange v-model="issued" />',
      },
    },
  },
  eitherOrder: {
    title: 'Pick range ends in either order',
    label: 'Either order',
    summary:
      'Choose the two ends of a date range in either order. The earlier date becomes the start and the later date the end. Your existing filter stays in effect until you have chosen both.',
    why: 'You do not have to start over because you happened to press the later date first.',
    who: 'library',
    moment: 'form',
    proof: {
      UiDateRange:
        'Custom range opens the calendar on the span; two days make it custom, in either order, and close',
    },
    at: { UiDateRange: 'Toolbar' },
    holds: {
      UiDateRange: {
        when: 'You choose a custom range in the calendar.',
        props: 'none',
        guarantee:
          'After the first day, the calendar asks for the other one (“Now choose the last day”) and the range in effect stays as it was. The second day completes the range in either order: the earlier day is the start, the later the end, the range applies as `custom`, and the panel closes.',
        yours: 'Nothing.',
        without:
          'The first press is always the start, so choosing the end first gives a range that ends before it begins.',
        code: '<UiDateRange v-model="issued" />',
      },
    },
  },
  spanSeenFirst: {
    title: 'See a date range before you pick its end',
    label: 'Range seen first',
    summary:
      'After the first day of a range, the calendar draws the range to the day under the pointer or the keyboard focus and says how many days it covers, such as “7 days”. Nothing is applied until you pick the last day.',
    why: 'A week that came out eight days long, or a period one day short, is caught while you are still choosing it, not after the report has changed.',
    who: 'library',
    moment: 'form',
    proof: {
      UiCalendar: [
        'the band runs to the pointed day and the line counts its days; nothing is chosen or sent until the press',
        'the keys draw the band to the focused day, which says its length, and take it from a resting pointer',
        'a day the press cannot pick does not end the band, and the pointer leaving takes it back',
        'a pointer resting on the grid does not take the band back from the keys when the month turns',
        'while a span waits for its end, the days past the first taken day cannot end it',
      ],
      UiDateRange: 'a custom span is drawn to the pointed day and counted before the second press',
    },
    at: { UiCalendar: 'Range' },
    holds: {
      UiCalendar: {
        when: 'it picks a range',
        props: '`range`',
        guarantee:
          'After the first day, the band runs to the day under the pointer, or to the day with the keyboard focus, and the line under the month counts its days. A screen reader hears the count after the focused day’s date. A day the second press cannot pick does not end the band, and a taken day stops it: the days past it show disabled.',
        yours: 'Nothing.',
        limit:
          'A touch screen has no pointer resting on a day: there the count shows once the range is picked.',
        without:
          'Only the first day shows until the second press, and a range one day too long is noticed after it is applied.',
        code: '<UiCalendar v-model="leave" range />',
      },
      UiDateRange: {
        when: 'you pick a custom range',
        props: 'none',
        guarantee:
          'The calendar of Custom range draws the range before your second press and counts its days, while the period in effect stays as it was.',
        yours: 'Nothing.',
        without:
          'A custom range is seen only once it is applied, and a list filtered one day short looks like a list with nothing more in it.',
        code: '<UiDateRange v-model="issued" />',
      },
    },
  },
  weekendShown: {
    title: 'See which days are the weekend',
    label: 'Weekend named',
    summary:
      'The calendar names the days of rest in bold in its header, as the app’s language and region count them: Saturday and Sunday in most places, Friday and Saturday in Israel or Saudi Arabia. A due date put on a day off is seen by its column before it is picked.',
    why: 'A deadline or a delivery set on a day when nobody works is caught while you choose it, not on the day itself.',
    who: 'library',
    moment: 'form',
    proof: {
      UiCalendar: [
        'the header names the locale’s days of rest in bold, wherever its week starts',
        'a day of rest is drawn as any other day of the month: no ground, the same hover',
        'a weekday column is named by its full day',
      ],
      calendar: [
        'the weekend is the locale’s: Saturday and Sunday in ru and en-US, Friday and Saturday in Saudi Arabia',
        'without week info the region decides the weekend, as the engine’s own CLDR does',
      ],
      UiDatePicker: 'its calendar names the days of rest in bold',
      UiDateRange: 'the calendar of a custom span names the days of rest in bold',
    },
    at: { UiCalendar: 'Base' },
    holds: {
      UiCalendar: {
        when: 'a month is shown',
        props: 'none; the days come from the app’s `locale`',
        guarantee:
          'The names of the days of rest in the header are bold, so their columns are found at a glance. The days themselves look like any other, so the chosen day, today, a range and the marks keep their look. A screen reader hears each column by its full day name.',
        yours: 'Nothing; `createGrani({ locale })` sets whose weekend it is.',
        limit:
          'The weekend is the locale’s, not a team’s schedule: a shift that works on Saturday still sees it in bold. Days the app closes go in `unavailable`.',
        without:
          'Every day name looks the same, and a Saturday is found by counting columns from the start of the week, which moves with the language.',
        code: '<UiCalendar v-model="due" />',
      },
      UiDatePicker: {
        when: 'you open the calendar',
        props: 'none',
        guarantee:
          'The calendar it opens names the days of rest in bold, so a due date on a day off is seen before it is picked.',
        yours: 'Nothing.',
        without: 'A due date set on a Saturday is noticed when nobody is at work to meet it.',
        code: '<UiDatePicker v-model="due" />',
      },
      UiDateRange: {
        when: 'you pick a custom range',
        props: 'none',
        guarantee:
          'The calendar of Custom range names the days of rest in bold, so a range that starts or ends on a day off is seen while you pick it.',
        yours: 'Nothing.',
        without:
          'A report period that ends on a Sunday looks the same as one that ends on a Friday.',
        code: '<UiDateRange v-model="issued" />',
      },
    },
  },
  dayStaysDay: {
    title: 'Save the day you picked, in any time zone',
    label: 'Day stays the day',
    summary:
      'A date field holds and sends the day itself, `2026-10-24`, not a moment at midnight. A server or a colleague in another time zone reads the same 24th, so a date of birth or a due date never slips to the day before.',
    why: 'A day kept as midnight in Moscow is already the 23rd on a server that runs in UTC: a birthday or a deadline moves by a day, and nobody notices until it matters.',
    who: 'library',
    moment: 'form',
    proof: {
      UiDatePicker:
        'a picked day reaches the model and the form as that day, whatever the zone of the device or the app',
      UiCalendar: 'a click picks a day; a day of the next month picks into it',
      UiDateRange:
        'Custom range opens the calendar on the span; two days make it custom, in either order, and close',
      UiDateCell: 'a day without a time stays that day in any time zone of the app',
    },
    at: { UiDatePicker: 'Base' },
    holds: {
      UiDatePicker: {
        when: 'a day is picked',
        props: '`v-model`, and `name` in a form',
        guarantee:
          'The model and the form get the day as `YYYY-MM-DD`, and the field shows that same day, whatever the time zone of the device or of `createGrani({ timeZone })`.',
        yours:
          'Store it as a date, not a timestamp; turn it into a moment only where one is meant, in the zone that is meant.',
        without:
          'The field keeps midnight where the person is, the server reads it in UTC, and the 24th is saved as the 23rd.',
        code: '<UiDatePicker v-model="born" name="born" />',
      },
      UiCalendar: {
        when: 'a day is picked',
        props: '`v-model`',
        guarantee:
          'It sends the day as `YYYY-MM-DD`, a day and not a moment, in every time zone the specs run in.',
        yours: 'Nothing.',
        without: 'A picked day sent as midnight lands on the day before east of UTC.',
        code: '<UiCalendar v-model="due" />',
      },
      UiDateRange: {
        when: 'a custom range is picked',
        props: 'none',
        guarantee:
          'The period’s ends are days, `from` and `to` as `YYYY-MM-DD`, so a range never shifts by a day.',
        yours: 'Count the last day whole when you query by moments.',
        without: 'A period sent as two midnights starts and ends a day early on a server in UTC.',
        code: '<UiDateRange v-model="issued" />',
      },
      UiDateCell: {
        when: 'the value is a day with no time',
        props: '`value` as `YYYY-MM-DD`',
        guarantee: 'It shows that day in any time zone of the app, never the day before or after.',
        yours: 'Nothing.',
        without: 'A date of birth shows a day early for every reader west of the server.',
        code: '<UiDateCell value="2026-09-24" />',
      },
    },
  },
  dateAsWritten: {
    title: 'Type a date or a time as your language writes it',
    label: 'Typed as written',
    summary:
      'Type `12.03.1987` in Russian or `03/12/1987` in American English, or the digits alone, and the date field reads the parts in the order your language writes them. Type `14:30`, `1430` or `2:30p`, and the time field reads it the same way. As you type, the calendar or the column jumps to what was read, and Enter takes it. A day or a time that does not exist is not taken, and never guessed.',
    why: 'A date from a passport or a time from an invoice goes in at typing speed, instead of twelve years of paging back or scrolling through the hours, and you see how the field read it before it is kept.',
    who: 'library',
    moment: 'form',
    proof: {
      UiDatePicker: [
        'digits typed on the field open the calendar on the day they read, and Enter takes it',
        'reads the parts in the app’s language: day first in Russian',
        'a day that does not exist is not taken, nor a day outside min and max',
        'a press away takes a day typed as Enter would; Escape still drops it',
        'Escape drops a typed day when the focus is on the panel itself',
        'a press away from a text that reads no day says so',
        'a stray digit or a year half typed is dropped on a press away, and said',
        'a day written in full is taken on a press away, with its marks or as eight digits',
        'th-TH: the year is read in the calendar the field writes it in',
        'fa-IR: a day of another calendar is not typed at all, never read as a Gregorian one',
      ],
      UiTimePicker: [
        'three digits are H:mm: 230 and Enter is 02:30, not 23:00',
        'a space after the hour ends it, as a colon does: 9 30 is 09:30, and nothing is emitted before',
        'Enter on a time that does not exist takes nothing, says so and marks the field invalid',
        'a time that does not exist is not taken: 2400 is not 02:40',
        'a press away takes a time typed in full, and drops a shorter one, said',
        'in a 12-hour language a press away wants the period, or an hour only the 24-hour clock has',
        'in a 12-hour language the typed text names the half of the day it will be read in',
        'a time outside the window is not taken by Enter nor by a press away, and said',
        'Escape drops the typed time wherever the focus is in the panel',
      ],
      calendar: [
        'reads the parts in the locale’s order, with any marks between them',
        'reads a day that does not exist, or a part half typed, as no day: never a guess',
      ],
    },
    at: { UiDatePicker: 'Base' },
    holds: {
      UiDatePicker: {
        when: 'a digit is typed on the field',
        props: 'none; the order comes from the app’s `locale`',
        guarantee:
          'The field shows what you type, the calendar opens on the day it reads, selected and focused, and Enter accepts it. A click away from the calendar also accepts it when the date is written in full (day, month and a four-digit year), so a stray digit never changes the field; Escape discards it, wherever focus is in the calendar. A missing part is taken from today, and a two-digit year is the nearest one, at most ten years ahead. A day that does not exist, or one outside `min` and `max`, is not accepted, and a screen reader announces why.',
        yours: 'Nothing; `createGrani({ locale })` sets the order of the parts.',
        limit:
          'Words are not read: “tomorrow” or “12 March” is the calendar’s and the presets’ to give. A calendar whose months differ from the Gregorian one (Persian, Hijri) takes no typing; the Buddhist year of Thai is read as written.',
        without:
          'A date of birth from a passport is paged to month by month, thirty-nine years back, or typed into a plain text field that reads `03/12` as the twelfth of March in one country and the third of December in another.',
        code: '<UiDatePicker v-model="born" />',
      },
      UiTimePicker: {
        when: 'a digit is typed on the field',
        props: 'none; 12 or 24 hours come from the app’s `locale`, or `hourCycle`',
        guarantee:
          'The field shows what is typed, the Hour column moves to the hour it reads, and Enter takes the time to the minute, off the step too. Three digits are `H:mm` and four `HH:mm`; a mark (`:`, `.`, a space) ends the hour. A 12-hour field says the half of the day it reads (`2:30 AM`) until `a` or `p` sets another. A press away takes the time when it is written in full, and in a 12-hour language with its half of the day; Escape drops it. A time that does not exist, or one outside `min` and `max`, is not taken: the field is marked invalid and a screen reader announces why.',
        yours: 'Nothing; `createGrani({ locale })` sets 12 or 24 hours.',
        limit:
          'Words are not read: “noon” or “half past two” is the columns’ to give. Where the half of the day is not written with a and p (Korean, Arabic), a press away takes a time written to the minute on the 24-hour clock.',
        without:
          'A time is scrolled to in a list of minutes, or typed into a plain text field that reads `230` as 23:0 and sends a time nobody meant.',
        code: '<UiTimePicker v-model="starts" />',
      },
    },
  },
  weekdaySaid: {
    title: 'See the day of the week beside a date',
    label: 'Weekday shown',
    summary:
      'A date field shows the day of the week with the date, “Thu, Sep 24”, the year added when it is not this one, and a column of dates can carry it under each date. A due date put on a Saturday, or a day picked one off, is seen at a glance.',
    why: 'People plan by days of the week: a meeting on the wrong Thursday or a deadline on a Sunday is caught before it is kept.',
    who: 'library',
    moment: 'form',
    proof: {
      UiDatePicker: [
        'shows the day by the locale, or the placeholder when empty',
        'the field stands over the widest date and keeps the place of the cross, so a pick keeps its width',
      ],
      UiDateCell: 'context weekday names the day in full under either lead',
    },
    at: { UiDatePicker: 'Base' },
    holds: {
      UiDatePicker: {
        when: 'it holds a day',
        props: 'none',
        guarantee:
          'The field writes the weekday before the date, in the app’s language, and stands as wide as its widest weekday beside its widest month, so a pick never moves what is beside it.',
        yours: 'Nothing.',
        limit:
          'Cut in a narrow column, the whole day shows in a tooltip on hover, not on the field itself. Without `presets` the field runs no clock: a page left open past New Year shows last year’s days without their year until the field is created again, as when the page is reloaded.',
        without:
          'The field says “Oct 24, 2026”, and that it is a Saturday comes out when nobody is at work.',
        code: '<UiDatePicker v-model="due" />',
      },
      UiDateCell: {
        when: 'a column of dates is read by the day of the week',
        props: '`context="weekday"`',
        guarantee:
          'The weekday is written in full under the date or the time, in the app’s language.',
        yours: 'Choose it for the columns read by the week: shifts, deliveries, meetings.',
        without: 'A column of dates where a Sunday looks like any other day.',
        code: '<UiDateCell :value="row.due" variant="day" context="weekday" />',
      },
    },
  },
  endAfterStart: {
    title: 'Keep the end of a period after its start',
    label: 'End after start',
    summary:
      'Two date fields, from and to: the days before the start cannot be picked as the end. If the start is moved past an end already chosen, the end keeps its day and shows an error instead of changing by itself.',
    why: 'A period that ends before it starts never reaches the report, and a day you chose is never changed behind your back.',
    who: 'library',
    moment: 'form',
    proof: {
      UiDatePicker: [
        'an end bound to its start keeps its day and reads invalid once the start moves past it',
        'a day outside min and max is kept and reads invalid',
      ],
    },
    at: { UiDatePicker: 'Limits' },
    holds: {
      UiDatePicker: {
        when: 'it is the end of a period, its `min` bound to the start',
        props: '`:min="from"`',
        guarantee:
          'In the end field’s calendar, days before the start are disabled. If the start moves past the end you chose, the end stays visible, marked invalid and still submitted, so you can correct it instead of losing it.',
        yours:
          'Bind `min` to the start field’s value, and refuse the save while the end reads invalid, saying why in the field’s error.',
        without:
          'The end takes any day, and a period from the 25th to the 20th is saved as if it were fine.',
        code: '<UiDatePicker v-model="to" :min="from" />',
      },
    },
  },

  opensWhereFits: {
    title: 'Open a panel on the side where it fits',
    label: 'Opens where it fits',
    summary:
      'A field near the top of the window opens its calendar under it; a field near the bottom opens it above, so the calendar stays inside the window and the page needs no scrolling. The panel is never taller than the room it has, scrolling inside itself when the room is short, and never covers its field.',
    why: 'You pick a day at the end of a long form without the calendar running off the screen, and the field you are filling stays in sight.',
    who: 'library',
    moment: 'open',
    proof: {
      UiDatePicker:
        'near the bottom of the window the calendar opens above the field; near the top, below it',
      UiSelect:
        'near the bottom of the window the list opens above the field; near the top, below it',
      anchorPosition: [
        'stands below with a gap by default',
        'flips above only when below has no room and above has more',
        'pins to the bottom edge instead of leaving the screen',
        'stays inside the right edge',
      ],
    },
    at: { UiDatePicker: 'Base' },
    holds: {
      UiSelect: {
        when: 'its field stands near the bottom of the window',
        props: 'none',
        guarantee:
          'The list opens above the field when the room below is too short for it and the room above is longer, and under it otherwise. It never covers the field and never leaves the window.',
        yours: 'Nothing.',
        limit: 'The room is measured in the window, not in a scrolling box inside the page.',
        without: 'A list under a field at the end of a long form runs off the screen.',
        code: '<UiSelect v-model="country" :items="countries" />',
      },
      UiDatePicker: {
        when: 'its field stands near the bottom of the window',
        props: 'none',
        guarantee:
          'The calendar opens above the field when the room below is too short for it and the room above is longer, and under it otherwise. It never covers the field and never leaves the window.',
        yours: 'Nothing.',
        limit:
          'The room is measured in the window: a scrolling box inside the page does not count, since the panel is drawn over the page, not inside the box.',
        without:
          'A calendar under a field at the end of a long form runs off the screen, and you scroll the page to reach the end of the month.',
        code: '<UiDatePicker v-model="due" />',
      },
    },
  },
  askWhatStays: {
    title: 'Confirm only what cannot be undone',
    label: 'Undo, not a question',
    summary:
      'Ask for confirmation only before an action that cannot be undone, and name the action on its button. A change the app can reverse happens immediately, with Undo offered for a limited time in a notification. The app handles the reversal; the notification provides the action that triggers it.',
    why: 'A question asked rarely gets read, so the one that matters is noticed. A reversible change is corrected with Undo instead of a question before every routine action.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiConfirm: [
        'asks in an alert dialog and answers true on confirm',
        'cancel, Escape and the cross answer false',
        'a row removed inside the action goes after a failure too: the Retry runs the same action',
        'a row removed inside the action hands the focus on too: the window gives it to the same button of the row now in its place',
        'Cancel with an action runs nothing, even a press on the confirm button in the same moment',
      ],
      UiToaster: [
        'a toast with an action stays longer than one without',
        'A toast with an action shows its time as a haze over its whole stay; a plain one has none.',
        'the close button and Escape on a focused toast close it; the pointer on the stack holds the clocks',
        'the action runs once and closes its toast',
      ],
    },
    at: { UiToaster: 'Undo' },
    holds: {
      UiConfirm: {
        when: 'an action with irreversible consequences, such as permanently deleting a record or sending a message that cannot be recalled',
        props: "`confirm({ title, confirmLabel, tone: 'danger' })`",
        guarantee:
          'Nothing happens until you answer the question. The confirmation button names the action, such as “Delete”, and keyboard focus starts on Cancel. The dialog returns `true` or `false`, and an `action` you pass runs only after confirmation.',
        yours:
          'Ask only before what cannot be reversed. A change that can be reversed is done at once and offered back with Undo in a toast. Remove the row inside `action`, with the request: a Retry after a failure runs the same `action`, and removes it then.',
        limit:
          'A row of a list of your own removed inside `action` takes the focus with it to the page: the window gives it back to a button that is gone. In a UiTable the focus goes to the same button of the row now in its place.',
        without:
          '“Are you sure?” before every delete, until the question gets answered without reading.',
        code: "await confirm({ title: 'Delete ORD-1041?', message: 'This cannot be undone.', confirmLabel: 'Delete', tone: 'danger', action: () => api.delete(id).then(() => remove(id)) })",
      },
      UiToaster: {
        when: 'a change that can be reversed: a delete, an archive, a move',
        props: "`action: { label: 'Undo', onClick }` on the toast",
        guarantee:
          'A notification with Undo stays visible longer than one without an action. Its background fades to show the time remaining, and the timer pauses while the pointer is over the notifications or keyboard focus is inside them. Undo runs once for that notification.',
        yours:
          'Make the change, retain the information needed to reverse it, and connect the toast’s Undo action to that reversal.',
        without: 'Either a delete is gone for good, or every delete first asks “Are you sure?”.',
        code: "toast.show({\n  title: 'Invoice deleted',\n  action: { label: 'Undo', onClick: restore },\n})",
      },
    },
  },
  answered: {
    title: 'See whether an action worked',
    label: 'Outcome shown',
    summary:
      'When an action ends, you can tell how it went: the content changes, a short message confirms it, or an error says what went wrong and what to do next. Messages and errors are announced by a screen reader too.',
    why: 'You do not have to repeat an action, or check somewhere else, to find out whether it went through.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiCopyButton: [
        'after a copy the glyph is a check for 1.2 s, and a reader hears Copied outside the button',
        'a copy whose button left the view is still heard',
        'two buttons that fail share one toast',
        'a refused clipboard emits copy false and shows no check',
      ],
      UiListField:
        'a request says Adding… with a spinner; a failure gives the text back with a line',
      UiToaster: 'an error is an alert, the rest are status; the glyph follows the tone',
      UiConfirm: [
        'a failure closes the question into an error toast whose Retry asks again',
        'success says so in a toast only when asked to',
      ],
      UiPasswordField:
        'says a password was generated, without saying it, and says it again on a second generate',
      UiDropzone: [
        'added and removed files are said in the status region',
        'a finished upload is said in the status region',
      ],
      UiTable:
        'a failed load shows the message with a retry; a failed refresh shows the same plate in place of the rows',
      UiLog: 'a rejected onMore does not go unhandled and the button stays clickable to retry',
    },
    at: { UiToaster: 'Request' },
    holds: {
      UiTable: {
        when: 'loading rows fails',
        props: '`error`, `@retry`',
        guarantee:
          'When a load fails, whether first or refresh, a message with Retry replaces the rows, and a screen reader announces it once; no old rows are left on screen. Pressing Retry brings the placeholder rows back.',
        yours: 'Pass the error message in words as `error`, and load again on `@retry`.',
        without:
          'An empty table, with no sign of whether there are no records or the request failed.',
        code: '<UiTable :columns="columns" :items="rows" :error="failure" :loading="pending" @retry="load" />',
      },
      UiLog: {
        when: 'older events fail to load',
        props: '`@more` rejecting',
        guarantee:
          'A message below the list says the load failed (“Could not load older events. Try again.”), and “Load older events” stays available to try again.',
        yours: 'Reject the `@more` promise when the load fails.',
        without: 'The button silently does nothing after a failure.',
        code: '<UiLog :items="events" has-more @more="loadOlder" />',
      },
      UiListField: {
        when: 'an item is added, refused or fails',
        props: 'none',
        guarantee:
          'While an entry is being added, the field shows progress and a screen reader announces “Adding…”. Validation errors explain what to correct. A failed request restores the text and explains how to retry. Error messages appear below the field and are announced as alerts.',
        yours:
          'Return the request’s promise from the add handler so the field can report its progress and failure. Show success in the updated list, for example by highlighting the new row.',
        without:
          'The field changes without a word, and you cannot tell whether the item was added.',
        code: '<UiListField … />',
      },
      UiPasswordField: {
        when: 'a password is generated or copied',
        props: 'none',
        guarantee:
          'When a password is generated, a screen reader confirms it without reading the password. The copy button announces its own result. Generating or copying again produces a new confirmation.',
        yours: 'Nothing.',
        without: 'A press with no answer: you cannot tell whether anything happened.',
        code: '<UiPasswordField v-model="password" />',
      },
      UiDropzone: {
        when: 'files are added, removed or uploaded',
        props: 'none',
        guarantee:
          'A screen reader announces what was added, removed or uploaded, such as “a.pdf added” or “2 files uploaded”, and a refused file is announced as an alert with its reason.',
        yours: 'Show a failed upload in the field’s error.',
        without: 'The list changes without a word to a screen reader.',
        code: '<UiDropzone v-model="files" />',
      },
      UiCopyButton: {
        when: 'you copy',
        props: 'none; `toast` where the button leaves the view once pressed',
        guarantee:
          'The button shows a check mark for 1.2 seconds, and a screen reader announces “Copied”, even if the button has left the screen. If clipboard access is refused, a warning mark replaces the check mark for the same 1.2 seconds, a screen reader announces “Could not copy”, and an error message appears; several copy buttons that fail at once share one message.',
        yours:
          'Mount `<UiToaster />` once in the app: the error message, and a success one with `toast`, show there. Add `toast` only where the button leaves the screen after the press, as in a menu.',
        without: 'A press with no answer: you copy again, or paste the old value.',
        code: '<UiCopyButton :value="link" label="Copy link" />',
      },
      UiConfirm: {
        when: 'a question asked with an `action`',
        props: '`success` and `error` beside `action`',
        guarantee:
          'The dialog closes when its `action` finishes. If the action fails, an error message appears with Retry, which opens the confirmation again. If it succeeds, a message appears only when you supply `success`, for cases where nothing on the page shows the result.',
        yours:
          'Supply `action` so the dialog can track the request. Add `success` only when the result is not already clear from a change on the page.',
        without: 'The dialog closes, and nothing says the delete failed.',
        code: "await confirm({ title, message, action, success: 'Order deleted', error: 'Could not delete' })",
      },
      UiToaster: {
        when: 'a request started by a button, such as a send or a save',
        props:
          "the button's `loading` while the request runs, then `toast.success` or `toast.error`",
        guarantee:
          'While the request runs, its button shows a spinner and ignores a second press. When the request completes, a message states the outcome, and a screen reader announces an error immediately.',
        yours:
          'Keep the button in `loading` until the request answers, then report the outcome with `toast.success` or `toast.error`; an error says what to do next. Where the button leaves the screen once pressed, as a menu row does, `toast.promise` shows the wait in a message instead.',
        without:
          'The button is pressed, and nothing says whether the request went or how it ended.',
        code: "sending.value = true\ntry {\n  await send(invoice)\n  toast.success('INV-0042 sent')\n} catch {\n  toast.error('Could not send', { description: 'Check the connection and send it again.' })\n} finally {\n  sending.value = false\n}",
      },
    },
  },
  searchFromPageOne: {
    title: 'Start a new search on the first page',
    label: 'From page one',
    summary:
      'When you type a new search, sort by another column or change a filter, the table asks for page one, so the new results are read from their start. The pager marks page one as the current page.',
    why: 'Staying on page 4 of a new search shows the middle of its results, or an empty page that reads as no results, while the first matches wait on page one.',
    who: 'library',
    moment: 'list',
    proof: {
      UiDataTable: [
        'a new search or sort asks for page one',
        "a person's change of a filter asks for page one; a filter set from outside does not",
      ],
      UiPagination:
        'a page set back to one from outside is marked current, Previous is off, and the change is said',
    },
    at: { UiDataTable: 'List', UiPagination: 'Many pages' },
    holds: {
      UiDataTable: {
        when: 'a list that pages gets a new search, a new sort or a changed filter',
        props: '`v-model:page`, `v-model:search`, `v-model:sort`, UiFilter in `#filters`',
        guarantee:
          'A new search, a press on a sortable header, or a choice the person changes in a UiFilter (a tick, Only, Reset) asks for page one through `v-model:page`. A filter or a page the app sets from outside moves nothing, so a linked page keeps its place.',
        yours: 'Load the page the table asks for, with the search and the sort it comes with.',
        limit:
          'A filter that is not a UiFilter, and a tick in a list of a UiFilter of several dimensions, do not move the page: set it to one where they change.',
        without:
          'Page 4 of the new results, or an empty page that reads as no results, while the first matches stand on page one.',
        code: '<UiDataTable v-model:search="query" v-model:page="page" v-model:sort="sort" :items="rows" :total="total" />',
      },
      UiPagination: {
        when: 'the list moves the page back to one',
        props: 'none',
        guarantee:
          'Page one is marked as the current page, Previous is off, and a screen reader hears “Page 1 of 6”.',
        yours:
          'Set `v-model:page` to 1 when the search or the sort changes; UiDataTable does it for you.',
        limit: 'The pager does not know the search: it shows the page it is given.',
        without: 'The pager still marks page 4 while the list starts over.',
        code: '<UiPagination v-model:page="page" :page-size="25" :total="total" />',
      },
    },
  },
  wordAsComposed: {
    title: 'Finish a word in any script before it is sent',
    label: 'Words in the making',
    summary:
      'Japanese, Chinese and Korean are typed through an input method: the reading first, then the word picked with Enter. Until the word is picked nothing is sent or chosen, and the Enter that picks it does not search, tick a row or add an entry.',
    why: 'A search for half a word, or an entry added halfway through typing it, is a wrong answer for anyone who writes these languages every day.',
    who: 'library',
    moment: 'form',
    proof: {
      UiTableToolbar: [
        'no emit happens while a word is being composed',
        'the Enter that confirms an IME candidate sends nothing',
        'the Enter Safari sends after it ends a composition sends nothing at once',
      ],
      UiInput: [
        'emits nothing mid-composition and the final value at its end',
        'a re-render of the host mid-composition does not reset the characters being typed',
        'Escape and the arrow keys during an IME composition do nothing',
      ],
      UiSelect: 'an Enter that confirms an IME composition in the search picks nothing',
      UiFilterList: [
        'an Enter that confirms an IME composition in the search field does not toggle the active row',
        'an Enter Safari sends to confirm a composition (keyCode 229) ticks nothing',
      ],
      UiListField: 'the Enter that confirms an IME composition adds nothing',
    },
    at: { UiTableToolbar: 'Above a table' },
    holds: {
      UiTableToolbar: {
        when: 'a search is typed through an input method',
        props: 'none: every UiTableToolbar',
        guarantee:
          'Nothing is sent while the word is being composed, and the Enter that picks it sends nothing; the whole word goes out once the typing pauses.',
        yours: 'Nothing.',
        without:
          'A search sent for every reading of the word, and one more for the Enter that picks it.',
        code: '<UiTableToolbar v-model:search="query" />',
      },
      UiInput: {
        when: 'a word is typed through an input method',
        props: 'none: every UiInput',
        guarantee:
          '`v-model` gets nothing while the word is composed and the whole word once it is picked. A page that redraws the field meanwhile keeps the characters being typed, and Escape and the arrows belong to the input method.',
        yours: 'Nothing; keep the model as the field sends it.',
        without:
          'A model that changes with every reading, and a redraw that drops what was being composed.',
        code: '<UiInput v-model="name" />',
      },
      UiSelect: {
        when: 'its search is typed through an input method',
        props: '`searchable`',
        guarantee: 'The Enter that picks the word picks no option.',
        yours: 'Nothing.',
        without: 'An option chosen by the key that only meant to finish a word.',
        code: '<UiSelect v-model="city" :items="cities" searchable />',
      },
      UiFilterList: {
        when: 'its search is typed through an input method',
        props: 'more than five options',
        guarantee:
          'The Enter that picks the word ticks no row, the late Enter Safari sends included.',
        yours: 'Nothing.',
        without: 'A row ticked by the key that only meant to finish a word.',
        code: '<UiFilterList v-model="cities" :items="CITIES" />',
      },
      UiListField: {
        when: 'an entry is typed through an input method',
        props: 'none: every UiListField',
        guarantee:
          'The Enter that picks the word adds nothing; the entry is added by the Enter after it.',
        yours: 'Nothing.',
        without: 'Half a word added to the list, and the rest of it typed as a second entry.',
        code: '<UiListField :existing="tags" @add="addTags" />',
      },
    },
  },
  offSaysWhy: {
    title: 'Know why an action is unavailable',
    label: 'Says why',
    summary:
      'A button that cannot be pressed yet says what it waits for: “Add the client’s email first”. It keeps its place in the Tab order and shows the reason when you point at it, reach it with Tab, press it or tap it, and a screen reader reads the reason with it. A press does nothing until the reason is gone.',
    why: 'A grey Save with no word sends a person hunting through the form for what is missing, or to support; the reason turns a dead end into the next step.',
    who: 'library',
    moment: 'form',
    proof: {
      UiButton: [
        'disabled with a reason, it stays in the Tab order and refuses a press, a submit too',
        'the reason is the button’s description, read once, and the hint on focus says it',
        'a reason with the button enabled is nothing: the button presses as ever',
        'a reason that comes and goes keeps the button, its focus and its ref',
        'a menu button that refuses its press opens nothing, by click or by arrow',
        'a press on a button off with a reason shows the reason, by mouse and by a tap on a menu button',
        'a blank reason is no reason: the button stays natively disabled, out of the Tab order',
        'a mouse press shows the reason, and the pointer leaving takes it away',
        'a reason that comes while the keyboard is on the button shows at once',
        'a hint that fails to load costs nothing but the hint: no error, the reason still read',
      ],
      UiIconButton: [
        'disabled with a reason, it stays in the Tab order, refuses a press and is described by it',
        'off with a reason, it shows the reason on keyboard focus and on a tap',
        'a reason that comes and goes keeps the square, its focus and its ref',
        'as a menu button that refuses its press, it opens nothing by arrow',
        'a UiTooltip around it names it while it works and says the reason while it is off, with no warning',
      ],
      UiCopyButton: [
        'an empty value keeps the button in the Tab order and says there is nothing to copy',
        'disabled with a reason passes the reason on',
        'an empty value copies nothing and the button is off',
      ],
    },
    at: { UiButton: 'Disabled' },
    holds: {
      UiButton: {
        when: 'it is disabled for a reason the person can act on',
        props: '`disabled` with `disabledReason`',
        guarantee:
          'The button looks disabled but stays in the Tab order. It cannot be activated, submit a form or open its menu, including through the arrow keys. A tooltip explains why the button is unavailable when you hover, focus, click or tap it, and a screen reader announces the same reason as its description. If the reason appears or disappears while the button has keyboard focus, focus stays on it.',
        yours:
          'Word the reason as the next step (“Add the client’s email first”) and clear `disabled` once it is done. Without a reason the button stays natively disabled, out of the Tab order.',
        limit:
          'The reason is one line, not a list of every missing field: a long form says its errors at the fields (UiField) when Save is pressed instead. A button with `to` is a link while it works and a new button element while it is off, so keyboard focus does not stay across that change.',
        without:
          'A grey button that Tab passes over and nothing explains: the person hunts for what is missing.',
        code: '<UiButton :disabled="!email" disabled-reason="Add the client’s email first">Save</UiButton>',
      },
      UiIconButton: {
        when: 'a row’s action is off for a reason the person can act on',
        props: '`disabled` with `disabledReason`',
        guarantee:
          'The square keeps its disabled look and its focus, refuses the press, and says why in a tooltip and as its description, beside its own name. A UiTooltip you wrap around it for its name keeps naming it while it works; while it is off, the reason shows instead.',
        yours: 'Word the reason as UiButton’s; `ariaLabel` still names the action.',
        without:
          'A grey glyph that Tab passes over: Delete is off, and nobody says that paid invoices stay.',
        code: '<UiIconButton :icon="Trash2" aria-label="Delete" :disabled="paid" disabled-reason="Paid invoices cannot be deleted" />',
      },
      UiCopyButton: {
        when: 'there is nothing to copy yet, or copying is off for a reason',
        props: '`disabled` with `disabledReason`; an empty `value` needs neither',
        guarantee:
          'An empty value keeps the button in the Tab order and says “Nothing to copy” in a tooltip and as its description, and a press copies nothing. A `disabledReason` is said the same way.',
        yours:
          'Word a reason of your own as the next step (“Publish the page first”). Without one, `disabled` alone takes the button out of the Tab order.',
        without:
          'A copy button that Tab skips beside an empty field, and nobody says there is nothing to copy yet.',
        code: '<UiCopyButton :value="page.url" :disabled="!page.published" disabled-reason="Publish the page first" />',
      },
    },
  },
  lateDropped: {
    title: 'Results match the current search',
    label: 'Late answer dropped',
    summary:
      'In a select, a slow response to an older query cannot replace the results for newer text, and the option you chose keeps its name while the results change. In a table toolbar, a search value the app applies late cannot overwrite newer typing or undo a clear. Either way, an old response never changes what you are currently searching for.',
    why: 'You can keep searching without a slow response restoring text or results from a question you have already moved past.',
    who: 'library',
    moment: 'list',
    proof: {
      UiTableToolbar: [
        'the host echoing an older sent value does not erase what was typed since',
        'a clear made while a value is on its way is sent, and the late echo does not undo it',
      ],
      UiSelect: [
        'a late answer to an older query is dropped',
        'a picked option keeps its label after the server answers another query',
        'items seeds the label of a prefilled value before the first fetcher search resolves',
      ],
    },
    at: { UiSelect: 'Search', UiTableToolbar: 'Above a table' },
    holds: {
      UiTableToolbar: {
        when: 'the app applies the search late, as a router query does',
        props: '`v-model:search`',
        guarantee:
          'When the app applies a search value the toolbar sent earlier, the toolbar recognizes it as a delayed update: it keeps the text you typed since then and sends that newer value when ready, including an empty value if you cleared the search.',
        yours: 'Apply the values in the order they arrive.',
        limit:
          'The toolbar expects each value it sends to be applied to `search`. If the app drops one, the toolbar still treats it as pending. A later external update with that same value can then be mistaken for the delayed response instead of a new reset.',
        without:
          'The late value writes the old text back into the field, and a clear you made is undone.',
        code: '<UiTableToolbar\n  :search="String(route.query.q ?? \'\')"\n  @update:search="(q) => router.replace({ query: { q } })"\n/>',
      },
      UiSelect: {
        when: 'the options come from a server',
        props: '`fetcher`, `items` for a value given in advance',
        guarantee:
          'A search response is shown only if it still belongs to the current query; a response to an older one is ignored instead of replacing newer results. The option you chose keeps its name in the field when a new search no longer returns it, and a value set in advance shows the label given in `items` before the first search answers.',
        yours:
          "Return the options for the query you are given. When you prefill a value, also pass its option in `items`, such as `{ value: 7, label: 'Anna Petrova' }`.",
        without:
          'Every answer is shown as it arrives, so a slow answer to an old query covers the newer one, and the choice turns into its raw value once the results change.',
        code: '<UiSelect v-model="client" :fetcher="findClients" :items="[{ value: 7, label: \'Anna Petrova\' }]" />',
      },
    },
  },
  typingAsksOnce: {
    title: 'Search once typing pauses',
    label: 'Asks once',
    summary:
      'A search is sent after a 250 ms pause in typing, not on every letter. In the table toolbar, Enter sends it immediately. Text still being composed with an input method, such as Japanese input, is not sent until composition finishes. When the response arrives, a screen reader announces how many results were found.',
    why: 'A word typed quickly produces one request instead of a request and a redraw for every letter.',
    who: 'library',
    moment: 'list',
    proof: {
      UiDataTable: 'the range is said after each load, and nothing while one runs',
      UiSelect: [
        'asks the server on open with an empty query, then 250 ms after the last key',
        'reopening after a search asks once for the empty query',
        'a press outside while a search waits asks the server for nothing',
        'a search dropped before it was asked leaves the closed field showing its value, not a load',
        'an answer on its way when the list closes changes nothing: the field shows its value',
      ],
      UiTableToolbar: [
        'sends the text once after the pause, with the last value',
        'Enter sends at once and does not submit a form around the toolbar',
        'no emit happens while a word is being composed',
      ],
    },
    at: { UiTableToolbar: 'Above a table' },
    holds: {
      UiDataTable: {
        when: 'the answer to a search comes',
        props: '`v-model:search`, `loading`, `total`',
        guarantee:
          'The text goes out once the typing pauses, through its toolbar; once the rows of the answer are in, a screen reader hears how many were found, “1–10 of 12”. Nothing is said while the answer is on its way.',
        yours: 'Set `loading` while the answer is on its way, and `total` when it comes.',
        without: 'A list that changes under a screen reader with no word of what the search found.',
        code: '<UiDataTable v-model:search="query" :items="rows" :total="total" :loading="pending" />',
      },
      UiTableToolbar: {
        when: 'you type in the search',
        props: 'none: every UiTableToolbar',
        guarantee:
          'The text is sent once, 250 ms after the last key, with the latest value. Enter sends it at once and does not submit a form around the toolbar. Nothing is sent while an input method, for example for Japanese, is still composing a word.',
        yours: 'Load the list on `update:search`, not on every key.',
        without: 'A request on every key: five letters, five requests.',
        code: '<UiTableToolbar v-model:search="q" />',
      },
      UiSelect: {
        when: 'the options come from a server',
        props: '`fetcher`',
        guarantee:
          'Opening the list calls `fetcher` with an empty query. Typing calls it after a 250 ms pause. Reopening after a search requests the empty query again. While results are loading, the visible options remain in place and are dimmed. A list closed within the pause asks nothing, and the closed field shows its value, not a load.',
        yours: 'Return the options for the query you are given.',
        without: 'A request on every key.',
        code: '<UiSelect v-model="client" :fetcher="findClients" />',
      },
    },
  },
  tagTakenBack: {
    title: 'Remove selected tags with the keyboard',
    label: 'Tag taken back',
    summary:
      'You can remove selected tags without the mouse: Tab reaches each tag’s remove button, and Enter or Space activates it. In a closed multi-select, Backspace removes the last visible tag. After a removal, keyboard focus moves to the next tag, or back to the field when no tag remains.',
    why: 'You can correct a selection without switching to the mouse, and Backspace never removes a value you cannot see.',
    who: 'library',
    moment: 'form',
    proof: {
      UiBadge: 'The cross is a named button that removes the badge.',
      UiSelect: [
        'the cross of a tag drops that pick and moves the focus to the next tag',
        'removing the last tag puts the focus back on the field',
        'Backspace takes back the last pick in view, a value outside items shown as its text too',
      ],
    },
    at: { UiSelect: 'Multiple' },
    holds: {
      UiSelect: {
        when: 'Selections show as tags.',
        props: '`multiple`, `tags`',
        guarantee:
          "A tag's × removes that selection and moves keyboard focus to the next tag, or back to the field after the last tag. With the list closed, Backspace on the field removes the last selection shown. A value missing from `items` shows as its own text, so it is one of them.",
        yours: 'Nothing.',
        without:
          'A tag’s cross takes the keyboard focus away with the tag: it falls to the page, and a screen reader loses its place.',
        code: '<UiSelect v-model="cities" :items="cities" multiple tags />',
      },
      UiBadge: {
        when: 'A badge shows a selected tag and has `removable`.',
        props: '`removable`',
        guarantee:
          'Its × is a real button with a name such as “Remove Desserts”: Tab reaches it, and Enter or Space presses it.',
        yours:
          'Remove the item in `@remove`. When the label alone does not say what is removed, name it with `removeLabel`.',
        without: 'A × that only the mouse can press.',
        code: '<UiBadge label="Kiosk" removable @remove="drop(\'kiosk\')" />',
      },
    },
  },
  pasteMany: {
    title: 'Paste a list to add several entries',
    label: 'Paste many',
    summary:
      'Paste a column of values, such as email addresses, to add several entries at once. Each line goes the way a typed entry goes: spaces at the ends removed, the app’s cleanup applied, such as one capitalization for tags, then its check. Accepted lines are added together; duplicates are identified instead of being added again.',
    why: 'You can reuse a list prepared elsewhere without entering each value on its own, and typed and pasted entries come out alike, so the list does not collect several spellings of one entry.',
    who: 'library',
    moment: 'form',
    proof: {
      UiListField: [
        'a pasted column adds every line, repeats pointed at',
        'split, fix and check go the same way: a list typed with commas, tidied, the bad one kept',
        'a column pasted while an add is on its way is not swallowed: it waits and goes in as a list',
        'a list waiting behind an add is not sent after the field was disabled',
      ],
    },
    at: { UiListField: 'Base' },
    holds: {
      UiListField: {
        when: 'A column of values is pasted into the field, or entries are typed.',
        props:
          'none; `split`, `fix` and `check` decide what a list is, how an entry is tidied and what passes',
        guarantee:
          'Typed or pasted, every entry goes the same way: split with `split`, trimmed, normalized with `fix`, then validated with `check`. The accepted lines of a paste reach `@add` together, while duplicates are skipped and identified in a message below the field. A column pasted while an add is on its way waits for it, then goes in as a list; when that add fails, its line and its text stay.',
        yours:
          'Nothing extra: `@add` receives the pasted items as one array, as it does a typed item. Set `split` to decide whether commas and semicolons separate items too, `fix` for what can be corrected automatically, such as letter case, and `check` for what cannot.',
        without:
          'A single-line field drops the line breaks, so three pasted addresses run together into one entry that nobody can mail.',
        code: '<UiListField :existing="emails" @add="invite" />',
      },
    },
  },
  textBack: {
    title: 'Get your text back when adding fails',
    label: 'Text back',
    summary:
      'While an entry is being added, the field shows a spinner. You can keep typing, but pressing Enter again sends nothing. If adding fails, your text returns with a message such as “Could not add Meat. Press Enter to try again.”',
    why: 'A failed request does not cost you the text you typed; one Enter tries again.',
    who: 'library',
    moment: 'form',
    proof: {
      UiListField: [
        'a request says Adding… with a spinner; a failure gives the text back with a line',
        'an onAdd that throws gives the text back with a line',
        'typing goes on while the add is on its way, and the next Enter sends it',
        'a line that says Enter tries again is true: after a failure the field holds the failed text',
        'a pasted list that fails does not say Enter tries again over an empty field',
        'a list waiting behind a failing add: the failure is still said, the failed text is back (draft bound)',
      ],
    },
    at: { UiListField: 'Base' },
    holds: {
      UiListField: {
        when: 'Adding a typed entry fails.',
        props: "`@add` returning the request's promise",
        guarantee:
          'While the request runs, a second Enter or Add sends nothing, the field shows a spinner, a screen reader announces “Adding…”, and you can keep typing. If the request fails, or the handler throws, the text returns to the field with a line saying it could not be added and that Enter tries again. If you typed something new while the request ran, that text stays instead, and the line only says what could not be added.',
        yours:
          "Return the request's promise from `@add`, and let it reject when the request fails; a handler that throws counts as a failure too.",
        without:
          'The field empties as soon as you press Enter; if the request then fails, the text is gone and you type it again.',
        code: '<UiListField :existing="emails" @add="invite" />',
      },
    },
  },
  nearlyFull: {
    title: 'Know what fits when a list has a limit',
    label: 'Up to the limit',
    summary:
      'When a list allows only so many entries, what fits is added and a message says what was left out, for example “c.pdf: up to 2 files.” A list field that is full replaces its field with a message that explains the limit, and if the field had focus, focus moves to that message.',
    why: 'You can tell why adding stopped and how much of a pasted list or a drop was accepted.',
    who: 'library',
    moment: 'form',
    proof: {
      UiDropzone: 'refuses files beyond maxFiles and keeps the ones that fit',
      UiListField: [
        'a limit fits a paste into what is left; full, the field is gone and says what did not fit',
        'reaching the limit one item at a time says the list is full and hands it the focus',
        'a list that fills while a line stands says it is full, as well as what the line said',
      ],
    },
    at: { UiListField: 'Limit' },
    holds: {
      UiDropzone: {
        when: 'files would go past `maxFiles`',
        props: '`multiple`, `maxFiles`',
        guarantee:
          'The files that fit are added; the rest are refused and named with the limit, such as “c.pdf: up to 2 files.”, and `reject` reports them with the reason `count`.',
        yours: 'Set `maxFiles`.',
        without:
          'A drop of three files into a list that allows two takes all three, and the error comes only when the form is saved.',
        code: '<UiDropzone v-model="files" multiple :max-files="2" />',
      },
      UiListField: {
        when: 'The list has a `limit`.',
        props: '`limit`',
        guarantee:
          'Only as many entries as still fit are added, and you can see how much of a pasted list was accepted. A full list replaces its input with a message such as “Limit reached: 3 items” or “Could not add 1 item: this list allows up to 3.” If the input had keyboard focus, focus moves to the message.',
        yours:
          'Set `limit`. It is counted against the names in `existing`, so keep `existing` up to date.',
        without:
          'The list takes an eleventh entry when ten are allowed, and the error appears only when the form is saved.',
        code: '<UiListField :limit="10" … />',
      },
    },
  },
  rangeSelect: {
    title: 'Select or clear a range of rows',
    label: 'Range select',
    summary:
      'Select a group of neighboring rows without checking each one: check row 3, then hold Shift and check row 10, and rows 3 through 10 are selected. From the keyboard, Shift+Space on the checkbox does the same. Clearing a checkbox the same way clears the range.',
    why: 'Two checkbox actions select a whole range, so preparing a bulk action does not take a click per row.',
    who: 'library',
    moment: 'work',
    proof: {
      UiTable: [
        'Shift with a second checkbox marks every row between',
        'Shift over marked rows clears the range, as the pressed row goes',
        'Shift+Space from the keyboard marks the range too',
      ],
      UiDataTable: 'Shift with a second row checkbox passes the whole range up through the block',
    },
    at: { UiTable: 'Selectable' },
    holds: {
      UiDataTable: {
        when: 'rows can be selected',
        props: '`selectable`, `v-model:selection`',
        guarantee:
          'Shift with a second row checkbox selects every row between it and the one pressed before, and the app receives the whole range in one update of `v-model:selection`.',
        yours: 'Nothing.',
        without: 'Fifty presses to select fifty rows.',
        code: '<UiDataTable v-model:selection="picked" selectable :items="rows" />',
      },
      UiTable: {
        when: 'a row checkbox is pressed with Shift, with the pointer or with Shift+Space',
        props: '`selectable`, `v-model:selection`',
        guarantee:
          'Every selectable row between the checkbox you activate and the previous one takes its new state: checking selects the range, unchecking clears it.',
        yours:
          'Keep `v-model:selection` to rows that still exist: drop the keys of rows that were deleted.',
        limit: 'A range stays within the page in view and skips rows that cannot be selected.',
        without: 'Ten rows take ten presses.',
        code: '<UiTable v-model:selection="picked" selectable :columns="columns" :items="rows" />',
      },
    },
  },
  sortSays: {
    title: 'See how the rows are sorted',
    label: 'Sort said',
    summary:
      'Press a sortable column heading to sort by it, press again for the opposite direction, and a third time to clear the sort. An arrow shows the current direction, and a screen reader can announce it. The app applies the requested order to the rows.',
    why: 'You know which column orders the rows, and which way, before you read them, instead of comparing rows to guess.',
    who: 'library',
    moment: 'list',
    proof: {
      UiTable:
        'a sortable header cycles first direction, the other one, then none; aria-sort follows',
    },
    at: {},
    holds: {
      UiTable: {
        when: 'a column is `sortable`',
        props: '`sortable` and `defaultSortDir` on a column, `v-model:sort`',
        guarantee:
          'A press on its header asks for the column’s first direction (`defaultSortDir`, ascending unless set), then the other direction, then no sort. An arrow icon shows the direction, and `aria-sort` lets a screen reader announce it.',
        yours:
          'Order the rows by `sort` yourself: the table reports the choice and does not reorder the rows.',
        without:
          'Nothing shows how the rows are sorted, so you have to compare values to work out their order.',
        code: '<UiTable v-model:sort="sort" :columns="[{ key: \'amount\', label: \'Amount\', sortable: true }]" :items="rows" />',
      },
    },
  },
  keptOnFail: {
    title: 'Keep the chart when a refresh fails',
    label: 'Kept on fail',
    summary:
      'If a chart refresh fails, the previous chart stays on screen, and “Not updated” with Retry makes clear that new data did not arrive. A table behaves differently: a failed load replaces its rows with the error and Retry.',
    why: 'The figures you were reading stay available, with a clear sign that they are not current.',
    who: 'library',
    moment: 'answer',
    proof: {
      UiChartCard: [
        'a failed refresh keeps the chart and says it on the title line, the reason in the tooltip',
        'a failed refresh is said in the live region with its reason',
      ],
    },
    at: {},
    holds: {
      UiChartCard: {
        when: 'a refresh fails while a chart is shown',
        props: '`error` without `empty`, `@retry`',
        guarantee:
          'The previous chart stays fully visible and keeps its space. “Not updated” and Retry appear beside the title; the reason is shown in a tooltip and announced by a screen reader.',
        yours:
          'Keep the old data in the chart, pass the reason in words as `error`, and clear `error` once a load succeeds.',
        without: 'The error takes the chart’s place, and the numbers you were reading are gone.',
        code: '<UiChartCard title="Revenue" :error="failure" :loading="pending" @retry="load"><UiAreaChart … /></UiChartCard>',
      },
    },
  },
  digitsLine: {
    title: 'Compare numbers in aligned columns',
    label: 'Digits line up',
    summary:
      'You can compare amounts or counts by scanning down the column: the numbers are right-aligned in equal-width digits, so matching decimal places line up when the values share the same format and precision.',
    why: 'You can spot the largest amount or an odd one out by scanning the column, without reading each number.',
    who: 'library',
    moment: 'list',
    proof: {
      UiTable: 'an end-aligned column sets tabular figures',
      UiDataTable: 'a money column aligns to the end by itself; align start keeps it at the start',
    },
    at: {},
    holds: {
      UiTable: {
        when: "a column has `align: 'end'`",
        props: "`align: 'end'` on a column",
        guarantee:
          'The column aligns numbers to the end and uses equal-width digits, so with consistent decimal formatting the digits line up and values are easy to compare down the column.',
        yours:
          'Format the numbers alike down a column, with the same number of decimals, so their digits line up.',
        without: '1,111 and 8,888 have different widths, so the eye compares lengths, not values.',
        code: "<UiTable :columns=\"[{ key: 'amount', label: 'Amount', align: 'end' }]\" :items=\"rows\" />",
      },
      UiDataTable: {
        when: "a column is `type: 'money'`",
        props: "`type: 'money'`; `align: 'start'` turns it off",
        guarantee:
          "A money column aligns to the end with equal-width digits by itself, its heading too, so amounts of different lengths line up. `align: 'start'` keeps it at the start.",
        yours:
          "Nothing for money. Give other numeric columns `align: 'end'`, and format them alike down the column.",
        without:
          'Amounts of different lengths start at the left edge, and 1,111.00 cannot be compared with 98.50 by eye.',
        code: '<UiDataTable :columns="[{ key: \'total\', label: \'Total\', type: \'money\' }]" :items="rows" :total="rows.length" />',
      },
    },
  },
  gapNotZero: {
    title: 'Show missing data as a gap',
    label: 'A gap, not a zero',
    summary:
      'A missing value appears as a gap in a chart and a dash in a table, never as zero. A line breaks where data is missing and resumes at the next value, a bar leaves a gap or a gray stub, and a cell shows “—”. A real zero keeps its own representation, so the two look different.',
    why: 'A day with no data does not read as a day when nothing sold, so the chart does not show a fall that never happened.',
    who: 'library',
    moment: 'work',
    proof: {
      UiSparkline: [
        'a missing value breaks the line, and the dot stands on the newest value there is',
        'a bar with no value leaves its place empty rather than drawing a stub',
        'a value alone between two gaps is drawn as a dot, not a speck of line',
      ],
      UiAreaChart: [
        'a missing value breaks the line instead of dropping to zero',
        'a point with gaps around it keeps a dot',
      ],
      UiBarChart: [
        'a missing value keeps a thin stub, never a zero bar',
        'a zero period stays visible and distinct from a missing one',
      ],
      UiTable: [
        'renders headers and values: format, accessor, a dash for an empty value',
        "a format that returns an empty string still shows the table's dash",
      ],
      UiDataTable: [
        'draws typed cells with the library cells and an empty value as a dash',
        'a progress cell with no value is the empty-cell dash, never a bar at 0',
      ],
    },
    at: { UiSparkline: 'Gaps', UiTable: 'Base' },
    holds: {
      UiTable: {
        when: 'a cell has no value',
        props: '`items` with `null` where there is no value',
        guarantee:
          'A cell with no value shows a dash, and so does one whose `format` returns an empty or blank string. A real `0` is printed as 0.',
        yours: 'Pass `null` where there is no value, and `0` only for a real zero.',
        without:
          'A missing amount is printed as 0 and read as nothing owed, or the cell is left empty and reads as a value still loading.',
        code: '<UiTable :columns="columns" :items="[{ id: 1, paid: null }]" aria-label="Invoices" />',
      },
      UiDataTable: {
        when: 'a typed cell has no value',
        props: '`columns[].type`',
        guarantee:
          'A money, date or progress cell with no value shows the table’s dash: a missing progress is never a bar at 0.',
        yours: 'Pass `null` where there is no value, and `0` only for a real zero.',
        without:
          'A task with no progress reported is drawn as an empty bar and read as not started.',
        code: "<UiDataTable :columns=\"[{ key: 'done', label: 'Done', type: 'progress' }]\" :items=\"rows\" />",
      },
      UiSparkline: {
        when: 'a value is missing',
        props: '`values` with `null` where there is no data',
        guarantee:
          'A `null` breaks the line, which resumes at the next available value. An isolated value is shown as a dot so it remains visible, and the endpoint dot marks the latest available value. In a bar sparkline, missing data leaves an empty space.',
        yours: 'Pass `null` where there is no data, and `0` only for a real zero.',
        without: 'A missing day is drawn as a dive to zero: a fall that never happened.',
        code: '<UiSparkline :values="[40, 44, null, 47, 52]" />',
      },
      UiAreaChart: {
        when: 'a series has a point with no data',
        props: '`series[].values` with `null` where there is no data',
        guarantee:
          'The line and its area break at a `null` and go on after it, and a point alone between two gaps keeps a dot. The tooltip and the data table available to screen readers show a dash there, never 0.',
        yours: 'Pass `null` where there is no data, and `0` only for a real zero.',
        without: 'A month with no data is drawn as a fall to zero and counted as zero in a sum.',
        code: '<UiAreaChart :x="months" :series="[{ key: \'r\', label: \'Revenue\', values: [40, null, 47] }]" ariaLabel="Revenue" />',
      },
      UiBarChart: {
        when: 'a period has no data',
        props: '`series[].values` with `null` where there is no data',
        guarantee:
          'A `null` keeps a thin gray stub in its place, never a bar of zero. A real zero keeps a sliver in the series color, so a month with no data and a month with nothing in it never look alike.',
        yours: 'Pass `null` where there is no data, and `0` only for a real zero.',
        without:
          'Two empty slots: a month with no data and a month with nothing in it look the same.',
        code: '<UiBarChart :x="months" :series="[{ key: \'o\', label: \'Orders\', values: [12, null, 0] }]" ariaLabel="Orders" />',
      },
    },
  },
  valuesByKeys: {
    title: 'Read every chart value from the keyboard',
    label: 'Values by keys',
    summary:
      'Tab to a chart, then use the arrow keys, Home and End to explore its values. A screen reader announces the selected point and its data. A separate data table is also available to screen readers, including values that would otherwise appear only in a hover tooltip.',
    why: 'Someone on a keyboard or a screen reader gets the same numbers as someone with a mouse, not only the shape of the line.',
    who: 'library',
    moment: 'work',
    proof: {
      UiAreaChart: [
        'the plot is one tab stop: focus says the newest point, the arrows walk',
        'a hidden table holds every value for a screen reader',
      ],
      UiBarChart: [
        'the plot is one tab stop: focus says the newest period, the arrows walk',
        'a hidden table holds every value for a screen reader',
      ],
      UiDonutChart: [
        'the ring is one tab stop; the arrows walk the parts and each is said',
        'a hidden table holds every part, its share and the total',
      ],
    },
    at: { UiAreaChart: 'Series' },
    holds: {
      UiAreaChart: {
        when: 'you need the values, not only the shape',
        props: '`ariaLabel`',
        guarantee:
          'Tab reaches the plot and shows the newest point. The arrow keys, Home and End move between points, and a screen reader announces each one, for example “September 2026: Spending 3,640, Income 5,100”. A data table available to screen readers holds every point of every series.',
        yours: 'Name the chart with `ariaLabel`: what it shows and over which period.',
        without:
          'A tooltip only a mouse can open: Tab skips the chart, and a screen reader announces only an image.',
        code: '<UiAreaChart :x="months" :series="series" ariaLabel="Spending and income by month" />',
      },
      UiBarChart: {
        when: 'you need the values, not only the shape',
        props: '`ariaLabel`',
        guarantee:
          'Tab reaches the plot and shows the newest period. The arrow keys, Home and End move between periods, and a screen reader announces each with every series, adding “in progress” for a period still running. A data table available to screen readers holds every value and each reference mark.',
        yours: 'Name the chart with `ariaLabel`.',
        without: 'Bars whose numbers exist only in a tooltip that appears on hover.',
        code: '<UiBarChart :x="months" :series="series" ariaLabel="Orders by month" />',
      },
      UiDonutChart: {
        when: 'you need the parts, not only the ring',
        props: '`ariaLabel`',
        guarantee:
          'Tab reaches the ring; the arrow keys, Home and End move between the parts, and each is announced, for example “Groceries: 1,240, 34%”. A data table available to screen readers holds every part, including the ones folded into Other, and the total.',
        yours: 'Name the chart with `ariaLabel`.',
        without:
          'Shares a screen reader never announces, and parts folded into Other that nobody can read.',
        code: '<UiDonutChart :parts="parts" ariaLabel="Spending by category, September" />',
      },
    },
  },
  partialNotDrop: {
    title: 'Show when a reporting period is still incomplete',
    label: 'In progress, not a drop',
    summary:
      'A month still in progress is marked as a partial result: its bar is hatched or its line segment dashed, and the chart labels it “in progress”. This lets you tell the figures collected so far from a completed month before comparing them.',
    why: 'Half a month’s total looks much lower than a full month’s. The marker keeps that difference from being read as a decline.',
    who: 'library',
    moment: 'work',
    proof: {
      UiBarChart: [
        'its tooltip and table say it is in progress',
        'the empty periods after it are to come: dashed outlines, not gray stubs',
      ],
      UiAreaChart: 'partial dashes the last segment and says the period is going',
    },
    at: { UiBarChart: 'Partial' },
    holds: {
      UiBarChart: {
        when: 'the newest period is not over',
        props: '`partial`',
        guarantee:
          'The latest period with data is hatched and labeled “in progress” in its tooltip, its keyboard readout and the data table for screen readers. Future periods are drawn as dashed outlines, so data that is not yet due looks different from data that is missing.',
        yours: 'Set `partial` while the period runs, and remove it once the period closes.',
        without:
          'A partial September total looks like a complete month with half of August’s sales, even though September is still underway.',
        code: '<UiBarChart :x="days" :series="series" partial ariaLabel="Orders by day" />',
      },
      UiAreaChart: {
        when: 'the last point is not over',
        props: '`partial`',
        guarantee:
          'The last segment of the line is dashed, and the axis label, the tooltip and the data table available to screen readers say the period is in progress, for example “Sep · in progress”.',
        yours: 'Set `partial` while the period runs, and remove it once the period closes.',
        without: 'The line dives at its end for a month that still has a week to go.',
        code: '<UiAreaChart :x="months" :series="series" partial ariaLabel="Revenue by month" />',
      },
    },
  },
  lossShrinks: {
    title: 'Show a shrinking loss as an improvement',
    label: 'Smaller loss is growth',
    summary:
      'A balance that goes from −100 to −50 has improved, and it is shown that way: +50%, better. The percentage is calculated against the absolute value of the previous figure, so moving toward zero from a loss is shown as an increase.',
    why: 'The sign and the assessment agree: a smaller loss reads as an improvement, not as a decline.',
    who: 'library',
    moment: 'work',
    proof: {
      UiDelta: [
        'a negative base still reads by the direction of the move',
        'invert with a negative base: a smaller loss is growth, so it is worse',
      ],
    },
    at: { UiDelta: 'Losses' },
    holds: {
      UiDelta: {
        when: 'the value before is below zero: a loss, a deficit, a negative balance',
        props: '`current`, `previous`',
        guarantee:
          'The percentage is calculated against the absolute value of `previous`: −100 to −50 is +50%, better; −100 to −150 is −50%, worse. For a metric where lower is better, set `invert`: it reverses the better/worse assessment, not the sign of the percentage.',
        yours:
          'Pass both values as they are, signs included, and do not count the percent yourself.',
        without:
          '`(current - previous) / previous` shows -50% in red for a loss that halved, so an improvement reads as a fall.',
        code: '<UiDelta :current="-50" :previous="-100" label="vs August" />',
      },
    },
  },
  lastPageLands: {
    title: 'Land on a page with records after a delete',
    label: 'Last page lands',
    summary:
      'When you delete the last record on the last page and other pages remain, the table requests the previous page, so you continue with the remaining records instead of an empty page. If the current page no longer exists for another reason, the table waits for loading to finish and then requests the new last page. The app loads the page the table requests.',
    why: 'You can go on through the remaining records without meeting an empty page that looks like an empty list.',
    who: 'library',
    moment: 'work',
    proof: {
      UiDataTable: [
        'removing the last row of the last page lands on the page before',
        'a page beyond the last asks for the last one once the list is not loading',
      ],
      UiPagination: 'a stale page beyond the range renders as the last page',
    },
    at: { UiDataTable: 'List' },
    holds: {
      UiDataTable: {
        when: 'rows are deleted, or the page asked for is past the last',
        props: '`v-model:page`, `total`, `page-size`',
        guarantee:
          'After you delete the last row of the last page, the table requests the previous page while records remain, so you see rows instead of an empty page. If the current page is past the end for any other reason, the table waits until `loading` is false and then requests the last valid page based on the updated `total`.',
        yours:
          'Keep `total` up to date, and load the page the table asks for through `v-model:page`.',
        without:
          'After you delete the last row of the last page, you are left on an empty page, and the list looks empty while it still has records.',
        code: '<UiDataTable v-model:page="page" :items="rows" :total="total" :page-size="20" />',
      },
      UiPagination: {
        when: 'the list has shrunk below the current page',
        props: 'none',
        guarantee:
          'The pager shows the last page that exists as the current one, so a page number is always marked and Next is off at the end.',
        yours:
          'Set the page to the last one when the total drops below it; UiDataTable does this for you.',
        limit:
          'The pager adjusts its display only. It does not change `v-model:page` or load records; the app must update the page value and data.',
        without:
          'The pager shows page 3 of 2 as requested: no page number is marked as current, and Next leads nowhere.',
        code: '<UiPagination v-model:page="page" :page-size="25" :total="total" />',
      },
    },
  },
  filterFromCell: {
    title: 'Filter by a value in a cell',
    summary:
      'Use a value already visible in a table as the next filter. For example, offer an action on a client’s name to show that client’s records without retyping the name. The application must connect the action to its filtering behavior.',
    why: 'The value in front of you is often the next thing to search by, and retyping it costs time and invites typos.',
    who: 'library',
    moment: 'work',
    at: {},
  },
  pasteValues: {
    title: 'Search by a pasted list of values',
    summary:
      'Provide a way to paste several values, such as order numbers from a spreadsheet, and use the accepted entries together as search or filter criteria.',
    why: 'You can work with a prepared set of records without entering and checking each search value separately.',
    who: 'library',
    moment: 'work',
    at: {},
  },
  recentRecords: {
    title: 'Reopen a recent record',
    summary:
      'Keep recently opened records easy to return to. The app should provide a short recent-records list so you can reopen one directly instead of searching again.',
    why: 'You can pick up interrupted work without repeating the search that found the record.',
    who: 'app',
    moment: 'work',
    at: {},
  },
  pinRecords: {
    title: 'Pin the records you use often',
    summary:
      'Let people pin records they use regularly and reopen them from a persistent list. The app manages the pins and the list they appear in.',
    why: 'Records you come back to every day stay one step away, however long the lists around them grow.',
    who: 'app',
    moment: 'work',
    at: {},
  },
  shortcutsKept: {
    title: 'Keep your browser’s keyboard shortcuts',
    label: 'Shortcuts kept',
    summary:
      'Shortcuts you know from the browser and the system keep working inside the controls. The arrow keys move through a calendar, a list, tabs or a number, but with Ctrl, Cmd or Alt held the key goes to the browser: Alt+Left still goes back a page, and Cmd+Up still moves the text cursor to the start of a field. Alt+Down opens a list, as it does on a native select.',
    why: 'People who work from the keyboard use these shortcuts without thinking; a control that takes one over changes a number or a date instead, and the shortcut seems broken in that one place.',
    who: 'library',
    moment: 'work',
    proof: {
      UiListField: [
        'with Shift, Alt, Ctrl or Cmd an arrow is the browser’s, as in any text field: the band stays',
        'Cmd or Ctrl with Enter is the form’s: nothing is added and the key goes on',
      ],
      UiInput: [
        'a numeric field steps on an arrow alone; with Alt, Ctrl or Meta the caret is the browser’s',
        'Shift with an arrow selects, as the browser does: no step',
      ],
      UiCalendar: [
        'Alt or ⌘ with an arrow moves no day and lets the browser have the key',
        'in the months view too, a chord moves no month and leaves the key',
      ],
      UiDatePicker:
        'ArrowDown and Alt with ArrowDown open the calendar; Ctrl or Meta leave the key',
      UiTimePicker: [
        'Alt with ArrowDown opens the panel, as a select does; Ctrl leaves the key',
        'Alt, Ctrl or Meta with an arrow moves no row and no column, and leaves the key',
      ],
      UiSelect: [
        'Alt with ArrowDown opens the list, as a select does; Ctrl or Meta leave the key',
        'in the open list Ctrl or Meta with an arrow moves no highlight and leaves the key',
      ],
      UiMenu: 'Alt with ArrowDown opens the menu; Ctrl or Meta leave the key',
      UiTabs:
        'a browser chord on a tab is not swallowed: Alt+ArrowLeft and Cmd+ArrowRight emit nothing',
      UiScaleInput: 'keys with Alt, Ctrl or Meta pass through and change nothing',
      UiAreaChart:
        'Alt, Ctrl or Meta with an arrow, Home or End leaves the point and the key alone',
      UiCodeInput:
        'Alt with an arrow goes to the browser (back a page); ⌘ or Ctrl with one keeps the caret at the end',
    },
    at: { UiInput: 'Numbers' },
    holds: {
      UiListField: {
        when: 'the field has keyboard focus',
        props: 'none',
        guarantee:
          'ArrowUp and ArrowDown alone move the band over the matches; with Shift held they select text, and with Alt, Ctrl or Cmd held the browser moves the text cursor. Cmd+Enter or Ctrl+Enter adds nothing: it reaches the form around the list, so a drawer saves.',
        yours: 'Nothing.',
        without:
          'Cmd+Enter, meant to save the drawer, adds the half-typed name to the list instead.',
        code: '<UiListField :existing="tags" @add="addTags" />',
      },
      UiInput: {
        when: 'a number field with arrows',
        props: '`numeric` with `step`',
        guarantee:
          'ArrowUp and ArrowDown alone change the number by the step. With Alt, Ctrl or Cmd held the number stays and the browser moves the text cursor, and with Shift it selects, as in any text field.',
        yours: 'Nothing.',
        without: 'Cmd+Up, meant to move the cursor to the start, adds one to the price instead.',
        code: '<UiInput v-model="price" numeric :step="1" />',
      },
      UiCalendar: {
        when: 'keyboard focus is on a day or a month',
        props: 'none: every UiCalendar',
        guarantee:
          'The arrow keys move between days; with Alt or Cmd held they move nothing and the browser takes the key, so Alt+Left still goes back a page. The months view does the same.',
        yours: 'Nothing.',
        without: 'Alt+Left, meant to go back a page, moves the focus to the day before instead.',
        code: '<UiCalendar v-model="due" />',
      },
      UiSelect: {
        when: 'the field or its open list has keyboard focus',
        props: 'none: every UiSelect',
        guarantee:
          'Alt+Down opens the list, as on a native select. With Ctrl or Cmd held an arrow opens nothing and moves no highlight, so the browser’s own shortcut runs.',
        yours: 'Nothing.',
        without: 'Ctrl+Down, meant for the page, opens the list or moves its highlight instead.',
        code: '<UiSelect v-model="currency" :items="currencies" />',
      },
      UiTabs: {
        when: 'keyboard focus is on a tab',
        props: 'none: every UiTabs',
        guarantee:
          'The arrows move between tabs; with Alt or Cmd held the tab stays and the browser takes the key, so Alt+Left still goes back a page.',
        yours: 'Nothing.',
        without: 'Going back a page from the row of tabs switches the tab instead.',
        code: '<UiTabs v-model="tab" :tabs="tabs" ariaLabel="Client" />',
      },
      UiCodeInput: {
        when: 'a one-time code is typed',
        props: 'none: every UiCodeInput',
        guarantee: 'Alt with an arrow goes to the browser, so Alt+Left still goes back a page.',
        yours: 'Nothing.',
        limit:
          'Ctrl or Cmd with an arrow keeps the cursor after the last character: a code is typed from its end, so the field holds that key.',
        without: 'Alt+Left, meant to go back a page, moves the cursor inside the code instead.',
        code: '<UiField :error="err"><UiCodeInput v-model="code" /></UiField>',
      },
    },
  },
  keyboardActions: {
    title: 'Reach frequent actions from the keyboard',
    label: 'Shortcut keys',
    summary:
      'Use Ctrl+B or Cmd+B to collapse or expand the sidebar. Use F8 to reach the newest notification’s action, or its close button if it has no action; press F8 again to return. Press / to start a search in the list on the page. The shortcuts do not run while you are typing in a field or editor.',
    why: 'You can reach a notification’s Undo before it disappears and use common navigation actions without moving to the mouse.',
    who: 'library',
    moment: 'work',
    proof: {
      UiTableToolbar: [
        '/ from the page goes to the search, and the field says its shortcut',
        'typed in a field, / stays a slash',
        'the first list on the page takes /',
        'a / the app took first, a window open over the list, or a list held inert keep it',
      ],
      UiToaster: [
        'F8 moves the focus to the newest toast action; the region names the key',
        'F8 with no toast does nothing and leaves the key to the page',
      ],
      UiAppShell: [
        'Ctrl or ⌘ B toggles the collapse, but not while typing in a field',
        'Ctrl or ⌘ B is refused in any editable text, not only contenteditable="true"',
        'Ctrl or ⌘ B does nothing while a window is open above the shell',
        'a held Ctrl or ⌘ B toggles once',
        'a held Ctrl or ⌘ B is taken from the browser on every repeat, and toggles once',
        'Ctrl or ⌘ B works on a non-Latin layout',
        'Ctrl or ⌘ B follows the typed letter on a Latin layout',
        'narrow: Ctrl or ⌘ B opens and closes the sheet',
        'two shells: Ctrl or ⌘ B reaches the one the focus is in, else only the first',
      ],
    },
    at: { UiAppShell: 'Sidebar', UiTableToolbar: 'Above a table' },
    holds: {
      UiTableToolbar: {
        when: 'a page with a list on it',
        props: 'none: every UiTableToolbar, and so every UiDataTable',
        guarantee:
          'Pressing `/` anywhere outside a field moves keyboard focus to the search of the first list in view, or to the list in the window open over the page when there is one. The field names the key to a screen reader.',
        yours:
          'Nothing. An app that takes `/` for itself calls `preventDefault` on it first, and the list leaves it.',
        limit:
          'Only the first list in view takes the key; a list hidden in a closed tab or panel is passed over.',
        without:
          'A trip to the mouse, or a run of Tab presses, to start a search you meant to type.',
        code: '<UiTableToolbar v-model:search="query" />',
      },
      UiToaster: {
        when: 'a notification is shown, with a window open or not',
        props: 'none: every UiToaster',
        guarantee:
          "F8 from anywhere on the page moves keyboard focus to the newest notification's action, or to its close button when it has none, and F8 again returns focus to where it was. With no notification on screen, the key is left to the page.",
        yours:
          'List F8 wherever your app lists its keys; the notification region already names it to a screen reader as “Notifications (F8)”.',
        without: 'A notification only the mouse can reach, gone before keyboard focus gets there.',
        code: '<UiToaster />',
      },
      UiAppShell: {
        when: 'you collapse the sidebar, or open it as a panel on a narrow screen, from the keyboard',
        props: 'none: every UiAppShell',
        guarantee:
          "Ctrl or ⌘ B collapses and expands the sidebar, or opens and closes it as a panel on a narrow screen. It does nothing while you type in a field or an editor, or while a window or a panel is open above the shell, and a held key toggles once. On a Latin layout it is the key that types B; on another alphabet, the key in B's place.",
        yours: 'List the shortcut wherever your app lists its keys.',
        limit:
          'With two shells on one page, the shortcut goes to the one that holds keyboard focus, or else to the first one. In Firefox, Ctrl or ⌘ B also opens the bookmarks sidebar: where the shell acts on the key, held as well, it takes the key from the browser; in a text field, under a window or a panel, the browser keeps it.',
        without: 'The sidebar can be folded only by aiming at its small button.',
        code: '<UiAppShell v-model:collapsed="collapsed" :nav="nav" :current="route.path" />',
      },
    },
  },
  searchAnyField: {
    title: 'Find records by the details you remember',
    summary:
      'Search using a detail you remember, such as a phone number, email address, invoice number or client’s company. The app should search the relevant fields and related records, and explain which details its search accepts.',
    why: 'You can find a record without remembering its exact title, and understand when a different search is needed.',
    who: 'app',
    moment: 'work',
    at: {},
  },
  tabLink: {
    title: 'Share a link to the open tab',
    summary:
      'A link should open the same tab you were viewing and preserve that choice after a reload. The app enables this by storing the active tab in the page address and restoring it when the page opens.',
    why: 'Someone who opens your link lands on the section you meant, not on the first tab.',
    who: 'app',
    moment: 'work',
    at: {},
    holds: {
      UiTabs: {
        when: 'a tab should be shared as a link',
        props: '`v-model`',
        guarantee:
          'It shows the tab named by `v-model` and reports every change through it; it does not read or write the page address itself.',
        yours:
          'Bind `v-model` to a query parameter of the route and read it back when the page opens. If the address names a tab that no longer exists, fall back to the first one.',
        without:
          'A link that always opens on the first tab, whatever tab was open when it was sent.',
        code: '<UiTabs v-model="tabInUrl" :tabs="tabs" ariaLabel="Client" />',
      },
    },
  },
  listLink: {
    title: 'Reload or share a list as you see it',
    label: 'In the address',
    summary:
      'The search, the filters, the sort and the page are written into the page’s address, so a reload, a link sent to a colleague or the browser’s Back opens the list as you saw it.',
    why: 'A colleague can open the same query, and you can return to it later without setting the filters again. The matching records may change as the underlying data changes.',
    who: 'library',
    moment: 'work',
    proof: {
      useListAddress: [
        'reads the view from the address before the first paint: search, sort, page and filters',
        'a typed search changes the step in place; a page, a sort or a filter adds a step',
        'Back reaches the list: the view follows the address and writes nothing back',
        'reads, writes in place and as a step, keeps the path and the hash, and follows Back',
        'an address without a sort opens on the default sort and writes nothing; Back to one returns to it',
        'a column outside `sortKeys` reads as the default; one inside is read',
      ],
      UiDataTable: [
        'a view kept in the address opens on its search and page, and a typed search is written back in place',
        'a page past the last, from the address, is corrected in place, so Back leaves it',
      ],
    },
    at: { UiDataTable: 'List' },
    holds: {
      UiDataTable: {
        when: 'its view is bound to `useListAddress`',
        props:
          '`useListAddress()`, `v-model:search`, `v-model:sort`, `v-model:page`, each filter’s `v-model`',
        guarantee:
          'A reload, a link and Back open the list with the same search, filters, sort and page. A typed search changes the address in place; a page, a sort or a filter adds a step that Back undoes. A page past the last, from an old link, is corrected in place, so Back never lands on it again.',
        yours:
          'Call `useListAddress` once in the page, with your filters and their empty values (`[]` for several, `null` for one), bind the view, and load the rows for it. A filter of ids is named in `numbers`. The sort the list opens on goes in the `sort` option, since assigning it to the view afterwards would overwrite the address. `sortKeys` names the columns the address may sort by; without it, check the key before it reaches your request.',
        limit:
          'The columns shown are a person’s preference, kept in the browser, not in the address. A page rendered by a server is drawn with the defaults, and the address lands once it is mounted.',
        without:
          'A reload or a shared link opens the list from its start, and the person sets the search, the filters and the page again.',
        code: 'const view = useListAddress({ status: [] })',
      },
    },
  },
  recordLink: {
    title: 'Open a record from a link',
    summary:
      'Give each record a direct link so someone with access can open it without searching. The app provides the address and loads the corresponding record.',
    why: 'A link points to exactly one record, so nobody has to search for it or guess which of two similar records was meant.',
    who: 'app',
    moment: 'work',
    at: {},
  },
  countOpensList: {
    title: 'Open the records behind a number',
    summary:
      'Make a count such as “12 overdue invoices” open the records it represents. The app applies the corresponding filters so you can inspect the records or act on them.',
    why: 'You can check a number, or act on the records behind it, without rebuilding its filters by hand.',
    who: 'app',
    moment: 'work',
    at: {},
  },
  openRelated: {
    title: 'Open a related record inside the drawer',
    label: 'Step in',
    summary:
      'Explore related information without leaving the record you started from. A row with a chevron leads to the related view, which the app shows inside the same drawer as a level of its own. Back names the previous level and returns to it, with focus on the row that opened the related view.',
    why: 'You can inspect related records and return to the original task without reopening its drawer or re-entering the draft kept at the previous level.',
    who: 'library',
    moment: 'work',
    proof: {
      UiListItem: [
        'a command row with step ends in a chevron beside its actions; a plain command has none',
        'a step row chevron mirrors under rtl, slides only when enabled, and its text aligns to the start',
      ],
      UiCrudDrawer: [
        'a step shows a back button named by the level above, and no breadcrumb',
        'a step in focuses its first field; the way up gives focus back to the row it left from',
        "a backdrop press at a step goes back one level first, as Escape does, so it never discards an ancestor level's unsaved input",
      ],
    },
    at: { UiCrudDrawer: 'Steps', UiListItem: 'Actions of a record' },
    holds: {
      UiListItem: {
        when: 'a row leads one level in',
        props: '`as="button"` with `step`, a count or a word in `#actions`',
        guarantee:
          'A chevron at the end of the row shows that it opens a deeper view. It sits beside any count or text, mirrors for right-to-left languages, and the whole row acts as one button.',
        yours: 'When the row is pressed, open the step in the drawer the row stands in.',
        without:
          'A row that opens a second window over the drawer, or one that looks like every other button.',
        code: '<UiListItem as="button" step title="Payments" @click="open(\'payments\')">\n  <template #actions><span>3</span></template>\n</UiListItem>',
      },
      UiCrudDrawer: {
        when: 'a level is opened from a row of the level above',
        props: '`path`, the titles of the levels above; `back` with the level to go to',
        guarantee:
          'The related view opens inside the same drawer, with focus on its first field and a named Back button, such as “Back to Fruit”. Escape, Cancel and clicking the backdrop return one level instead of closing the whole drawer. The previous draft is retained, and focus returns to the row that opened the view.',
        yours:
          'Swap the body and the title for the step, pass the titles of the levels above in `path`, and go to the level that `back` names.',
        without:
          'A second window over the first: the record behind it is hidden, and closing the window drops keyboard focus to the page.',
        code: '<UiCrudDrawer v-model:open="open" :title="title" :path="path" @back="goTo">…</UiCrudDrawer>',
      },
    },
  },
  copyValue: {
    title: 'Copy a whole value in one press',
    label: 'Copied whole',
    summary:
      'Copy an entire id or link with one press, even when only a shortened version is displayed. A brief check mark confirms a successful copy.',
    why: 'You get the exact value without selecting it by hand, so no character is missed and no ellipsis is copied with it.',
    who: 'library',
    moment: 'work',
    proof: {
      UiCopyButton: [
        'a glyph alone is an icon button named Copy; it copies the value whole',
        'truncate shows the id cut in the middle in monospace and copies it whole; the glyph waits for hover',
        'after a copy the glyph is a check for 1.2 s, and a reader hears Copied outside the button',
        'a refused clipboard emits copy false and shows no check',
      ],
    },
    at: { UiCopyButton: 'Base' },
    holds: {
      UiCopyButton: {
        when: 'beside an id, a key or a link',
        props: '`value`, and `truncate` where the value is too long to show',
        guarantee:
          'One press puts the whole value on the clipboard, even when it is shown cut in the middle. For 1.2 seconds the button shows a check mark, and a screen reader announces “Copied”, so you know the copy succeeded. If the browser refuses clipboard access, no check mark appears.',
        yours: 'Pass the whole value in `value`, and shorten only what is shown, with `truncate`.',
        limit:
          "For a secret, set neither `label` nor `truncate`: both put text on the screen and in the button's accessible name.",
        without: 'A copy of what is shown: the cut id lands in the clipboard, ellipsis and all.',
        code: '<UiCopyButton :value="order.id" :truncate="12" />',
      },
    },
  },
  savedViews: {
    title: 'Save filters you use often',
    summary:
      'Save a frequently used set of filters under a name, then choose that name to apply them again. The app stores and restores the view; the records it returns can change over time.',
    why: 'A weekly query becomes one choice instead of several filters to rebuild, while preserving the same selection criteria.',
    who: 'app',
    moment: 'work',
    at: {},
  },
  columnsRemembered: {
    title: 'Remember hidden columns in this browser',
    label: 'Columns remembered',
    summary:
      'Hide unnecessary columns once and return to the same table layout on later visits in this browser. With the default browser storage, a change in another tab is also reflected here.',
    why: 'You set a table up for your work once, instead of hiding the same columns on every visit.',
    who: 'library',
    moment: 'work',
    proof: {
      UiTableColumns: 'a choice made in the menu is there after a remount',
      useTableColumns: [
        'survives a remount through localStorage, written at once',
        'a choice made in another tab reaches this one',
      ],
    },
    at: { UiTableColumns: 'In a toolbar' },
    holds: {
      UiTableColumns: {
        when: 'the table is opened again in this browser',
        props: '`useTableColumns(key, columns)`',
        guarantee:
          'The column choice is stored as soon as it changes and restored on the next visit. With the default browser storage, changes made in another tab are also applied to this one.',
        yours:
          'Name the kind of table in `key` (for example `invoices`), and pass the signed-in user as `scope` when two people share a browser.',
        limit:
          'Preferences belong to this browser and are not shared through a URL. A server-rendered page may briefly show default columns before the stored choice applies. With `createGrani({ storage })`, automatic updates from other tabs are unavailable; the last tab to save a choice wins.',
        without: 'A choice kept only in the page: the hidden columns are back on every visit.',
        code: "const cols = useTableColumns('invoices', COLUMNS)",
      },
    },
  },
  inlineEdit: {
    title: 'Edit a value in its row',
    summary:
      'Offer an editor within a table row for small changes such as a status or amount. Make Save, Cancel and any correction needed after an error clear, so the task can be completed without opening a separate form.',
    why: 'You can correct one value and continue down the list without navigating into a full form and back.',
    who: 'library',
    moment: 'work',
    at: {},
  },
  bulkAction: {
    title: 'Act on several selected rows at once',
    label: 'Bulk action',
    summary:
      'Select several records to reveal actions for the whole selection. A strip replaces the toolbar, states the count, such as “2 selected”, and offers the actions supplied by the app plus a way to clear the selection.',
    why: 'You can apply one change to many records in one step, instead of repeating it row by row.',
    who: 'library',
    moment: 'work',
    proof: {
      UiDataTable: [
        'the bulk slot gets the count, the selection and the size; the pager and the clear take the size',
        'shows the selection strip with the count, the bulk slot and a clear that empties the selection',
      ],
    },
    at: {},
    holds: {
      UiDataTable: {
        when: 'selected rows take an action',
        props: '`#bulk`',
        guarantee:
          'The toolbar becomes a selection strip showing how many rows are selected, with the count also announced by a screen reader. The `#bulk` slot receives the count, selection and size for the app’s actions. A separate button clears the selection.',
        yours: 'Put the actions in `#bulk` and apply them to the selection the slot gives you.',
        without: 'Actions far from the rows they act on, or no way to act on several rows at once.',
        code: '<UiDataTable v-model:selection="picked" selectable><template #bulk="{ count }">…</template></UiDataTable>',
      },
    },
  },
  walkRecords: {
    title: 'Step through records in one drawer',
    summary:
      'Review successive records without closing the drawer. Previous record and Next record ask for the neighboring record of the current list while the drawer stays open. While there is unsaved input or a save is running, they refuse with a shake instead of leaving your input behind.',
    why: 'You can go through a run of records, such as checking each new order, without closing and reopening the drawer for each one.',
    who: 'library',
    moment: 'work',
    proof: {
      UiCrudDrawer: [
        'index and total walk the list: ↑ and ↓ emit move, held at the ends',
        'unsaved input or a save on its way refuse to walk the list, with a shake',
        'without total there is no list to walk',
        'at a step the arrows are gone, and they are back one level up',
      ],
    },
    at: {},
    holds: {
      UiCrudDrawer: {
        when: 'The drawer opens a record from a list of two records or more.',
        props: '`index` and `total`, the `move` event',
        guarantee:
          'Previous record and Next record (↑ and ↓ in the header) ask for the record before or after this one; at the first or the last record that way is off. While `persistent` marks unsaved input, or `submitting` a save, they refuse with a shake and your input stays. At a step into what the record holds they are gone: you go up first, so the walk never drops the input of a level above.',
        yours:
          'Pass the record’s place in the list as `index` and the list’s length as `total`, load the record whose index `move` carries, and set `persistent` while there is unsaved input.',
        without: 'You close the drawer, find the next row and open it again for every record.',
        code: '<UiCrudDrawer v-model:open="open" :title="record.name" :index="i" :total="rows.length" @move="i = $event">…</UiCrudDrawer>',
      },
    },
  },
  prefill: {
    title: 'Start a new record with known values',
    summary:
      'When the current task already identifies a value, prefill it in the new record. For example, an invoice created from a client’s page can start with that client selected. The app supplies the known values and lets you review them before saving.',
    why: 'You can review information the app already knows instead of re-entering it, reducing typing and accidental mistakes.',
    who: 'app',
    moment: 'work',
    at: {},
  },
  createRelated: {
    title: 'Create a related record from the form',
    summary:
      'If a required related record is missing, offer a way to create it from the current form. For example, add a new client while preparing an invoice, then return to the invoice with its draft intact.',
    why: 'You finish the record you started, instead of leaving the form, creating the missing record elsewhere and typing everything again.',
    who: 'library',
    moment: 'work',
    at: {},
  },
  duplicate: {
    title: 'Start a record from a copy',
    summary:
      'For a record similar to an existing one, let the app copy reusable values into a new draft. Review and change that draft before saving it as a separate record.',
    why: 'A record much like an existing one takes a few edits instead of every value typed again.',
    who: 'app',
    moment: 'work',
    at: {},
  },
  saveAndNew: {
    title: 'Save and start the next record',
    label: 'Save and add another',
    summary:
      'Choose Save and add another to continue entering records in the same drawer. After a successful save, the app clears the form and keeps the drawer open. Focus moves to the first field, ready for the next entry. A failed save keeps the current input for correction or retry.',
    why: 'You can enter a batch without reopening the form after every successful save.',
    who: 'library',
    moment: 'work',
    proof: {
      UiCrudDrawer: [
        'it asks with another: true, and Save and Enter with another: false',
        'when the save for another ends, the cursor is in the first field of the clean form',
        'saved to add another, the cursor goes to the first field though it keeps its default',
        'a save for another that failed leaves the cursor alone though the first field is empty',
      ],
    },
    at: { UiCrudDrawer: 'Several' },
    holds: {
      UiCrudDrawer: {
        when: 'you enter a batch of new records',
        props: '`saveAnother`, and `submit` read for `another`',
        guarantee:
          'The Save menu offers Save and add another. When that save finishes and the app clears the form, keyboard focus moves to its first field, ready for the next record, even when that field keeps a default such as a currency. If the save fails and the form is left as it was sent, focus stays where it was.',
        yours:
          'Set `submitting` while saving. `submit` includes `another: true` for Save and add another, and `another: false` for Save or Enter. After a successful save with `another: true`, clear the form (a default may stay) and keep the drawer open.',
        limit:
          'The drawer tells a cleared form from a failed save by comparing the fields with what they held when Save and add another was pressed. A form reset to exactly what was sent counts as a failed save, unless every field is empty; an answer that adds or removes a field counts as a cleared form.',
        without:
          'The drawer closes after each save, and every next record starts with opening it again.',
        code: '<UiCrudDrawer v-model:open="open" title="New client" save-another @submit="save">…</UiCrudDrawer>',
      },
    },
  },
  exportSelection: {
    title: 'Choose which records to export',
    summary:
      'Before exporting, offer a clear choice between the selected rows and all records matching the current search and filters, including records on other pages.',
    why: 'The file holds the set you meant, and you do not have to delete stray records from it afterwards.',
    who: 'library',
    moment: 'work',
    at: {},
  },
  backKeepsPlace: {
    title: 'Return to the list where you were',
    summary:
      'Return from a record to the same part of the list. The app should restore the filters, page and scroll position so you can continue reviewing the rows you left.',
    why: 'You can go through a list record by record without finding your place again after each one.',
    who: 'app',
    moment: 'work',
    at: {},
  },
}
