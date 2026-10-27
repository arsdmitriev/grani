# The tests behind the patterns of grani-ui

Each test is named by its spec file and its title. The specs are in the repository, not in the package.

## Run the same checks on your screens

`grani-ui/test` gives your Playwright suite the checks below, for screens built with grani-ui. A check works the screen with the keyboard and by typing, and reads what a person gets: the focus, ARIA, the styles drawn, the requests. A state counts once it holds for 300 ms, so a focus that leaves a moment later still fails. A failure names the pattern and the chapter that explains it. A check that cannot run, because a locator matches nothing or a search sends no request, fails with `grani-ui/test <check>:` and what to fix in the test.

- `focusStartsInside(page, { opener, panel, start })` opens the panel with Enter on `opener` and checks that the focus lands on `start`: "Open with keyboard focus where the task begins".
- `focusComesBack(page, { opener, panel, close })` opens the panel, closes it with Escape or with `close`, and checks that the focus is back on `opener`: "Continue from where you opened the panel".
- `focusGoesToInvalid(page, { submit, field })` presses Enter on `submit` of a form that holds a refused value and checks that the focus goes into `field`, in view: "Go straight to the field that needs fixing".
- `lateAnswerDropped(page, { search, results, endpoint, queries })` types two searches, lets the answer to the second arrive first, and checks that the answer to the first does not replace `results`: "Results match the current search".
- `refreshKeepsRows(page, { rows, refresh, endpoint })` starts a refresh (a sort, another page, a Refresh button; not a new search, whose answer is new rows on purpose), holds its answer, and checks that the same `rows` stay, inside an element with `aria-busy="true"` and drawn dimmer: "Keep nearby content in place while loading".

Your app installs `@playwright/test` 1.39 or later; grani does not.

```ts
import { test } from '@playwright/test'
import { focusComesBack } from 'grani-ui/test'

test('closing the invoice gives the focus back to Edit', async ({ page }) => {
  await page.goto('/invoices')
  await focusComesBack(page, {
    opener: page.getByRole('button', { name: 'Edit INV-1001' }),
    panel: page.getByRole('dialog', { name: 'INV-1001' }),
  })
})
```

## See whether an action worked

Proof, in the tests: UiCopyButton: “after a copy the glyph is a check for 1.2 s, and a reader hears Copied outside the button”; UiCopyButton: “a copy whose button left the view is still heard”; UiCopyButton: “two buttons that fail share one toast”; UiCopyButton: “a refused clipboard emits copy false and shows no check”; UiListField: “a request says Adding… with a spinner; a failure gives the text back with a line”; UiToaster: “an error is an alert, the rest are status; the glyph follows the tone”; UiConfirm: “a failure closes the question into an error toast whose Retry asks again”; UiConfirm: “success says so in a toast only when asked to”; UiPasswordField: “says a password was generated, without saying it, and says it again on a second generate”; UiDropzone: “added and removed files are said in the status region”; UiDropzone: “a finished upload is said in the status region”; UiTable: “a failed load shows the message with a retry; a failed refresh shows the same plate in place of the rows”; UiLog: “a rejected onMore does not go unhandled and the button stays clickable to retry”.

## Ignore extra presses while a request runs

Proof, in the tests: UiIconButton: “keeps focus when loading starts and refuses the click before the caller”; UiIconButton: “fires click when enabled and never when disabled or loading”; UiMenu: “a busy item refuses the click and the menu stays open”; UiToaster: “the action runs once and closes its toast”; UiToaster: “a second click on the action during the leave fade does not run it twice”; UiListField: “pressing Enter twice while the add is on its way sends once”; UiListField: “typing goes on while the add is on its way, and the next Enter sends it”; UiListItem: “Loading puts a spinner in the glyph's place and refuses the press; the button stays enabled.”; UiListItem: “a loading link row refuses the click in the capture phase, ahead of the router”; UiConfirm: “the window waits for the action: the button loads, a second press sends nothing, Escape is refused”; UiButton: “a disabled or loading button does not fire click”; UiButton: “refuses the click before the caller's listener”; UiButton: “a loading submit button does not send its form”; UiBadge: “A double click on the cross removes once, even when the host re-renders between the clicks.”; UiBadge: “While a loading set from the click runs, a second press past the double-click window waits.”; UiDropzone: “busy: the row carries the upload, Browse refuses but holds, the drop is ignored, removing waits”; UiDropzone: “Browse keeps the focus while busy”; UiDropzone: “two quick presses on cancel or Retry ask once, until the app answers”; UiTable: “a retry in flight after a failure draws the skeleton: no retry is left to press twice”; UiTable: “a header pressed while rows load asks for no second sort and keeps the focus”; UiLog: “Show older calls @more once and is held while the promise runs”; UiPagination: “disabled holds the whole row: arrows off, numbers held but focusable, nothing asked”; UiPagination: “while loading, the pressed arrow keeps the focus with a spinner, the other is off, and a press asks nothing”; UiPagination: “a number pressed while its page loads shows a spinner in place of its digits and says busy”.

## Results match the current search

Proof, in the tests: UiTableToolbar: “the host echoing an older sent value does not erase what was typed since”; UiTableToolbar: “a clear made while a value is on its way is sent, and the late echo does not undo it”; UiSelect: “a late answer to an older query is dropped”; UiSelect: “a picked option keeps its label after the server answers another query”; UiSelect: “items seeds the label of a prefilled value before the first fetcher search resolves”.

## Start a new search on the first page

Proof, in the tests: UiDataTable: “a new search or sort asks for page one”; UiDataTable: “a person's change of a filter asks for page one; a filter set from outside does not”; UiPagination: “a page set back to one from outside is marked current, Previous is off, and the change is said”.

## Give every empty list a way forward

Proof, in the tests: UiListField: “an empty list says how to start; a query or a list hides the line”; UiListField: “an empty list counts nothing and offers the name right after it”; UiListField: “a search that finds nothing offers to add what was typed”; UiChartCard: “nothing to draw is the card’s own words, or the caller’s #empty”; UiNoData: “It holds the next step: a button of your own, with its own weight.”; UiNoData: “the next step comes after the title and the description”; UiNoData: “A failed load is said at once, on a red plate with a warning glyph.”; UiTable: “an empty page and a failed load say why; #empty puts the next step of your own in place”; UiLog: “a filter that hides every loaded event says so and offers all”; UiDataTable: “a search with no match offers to clear it, and the press asks for an empty search”; UiDataTable: “a filter that matches nothing offers to reset it, and the offer follows filtered”; UiDataTable: “a search with no match keeps Clear search and Reset filters, and the app's action stands beside them”; UiDataTable: “a list with no records yet says so and offers the app's action under its words”; UiDataTable: “a filter chosen in #filters makes an empty list offer Reset filters, which clears it”.

## Confirm only what cannot be undone

Proof, in the tests: UiConfirm: “asks in an alert dialog and answers true on confirm”; UiConfirm: “cancel, Escape and the cross answer false”; UiConfirm: “a row removed inside the action goes after a failure too: the Retry runs the same action”; UiConfirm: “a row removed inside the action hands the focus on too: the window gives it to the same button of the row now in its place”; UiConfirm: “Cancel with an action runs nothing, even a press on the confirm button in the same moment”; UiToaster: “a toast with an action stays longer than one without”; UiToaster: “A toast with an action shows its time as a haze over its whole stay; a plain one has none.”; UiToaster: “the close button and Escape on a focused toast close it; the pointer on the stack holds the clocks”; UiToaster: “the action runs once and closes its toast”.

## Get your text back when adding fails

Proof, in the tests: UiListField: “a request says Adding… with a spinner; a failure gives the text back with a line”; UiListField: “an onAdd that throws gives the text back with a line”; UiListField: “typing goes on while the add is on its way, and the next Enter sends it”; UiListField: “a line that says Enter tries again is true: after a failure the field holds the failed text”; UiListField: “a pasted list that fails does not say Enter tries again over an empty field”; UiListField: “a list waiting behind a failing add: the failure is still said, the failed text is back (draft bound)”.

## Know why an action is unavailable

Proof, in the tests: UiButton: “disabled with a reason, it stays in the Tab order and refuses a press, a submit too”; UiButton: “the reason is the button’s description, read once, and the hint on focus says it”; UiButton: “a reason with the button enabled is nothing: the button presses as ever”; UiButton: “a reason that comes and goes keeps the button, its focus and its ref”; UiButton: “a menu button that refuses its press opens nothing, by click or by arrow”; UiButton: “a press on a button off with a reason shows the reason, by mouse and by a tap on a menu button”; UiButton: “a blank reason is no reason: the button stays natively disabled, out of the Tab order”; UiButton: “a mouse press shows the reason, and the pointer leaving takes it away”; UiButton: “a reason that comes while the keyboard is on the button shows at once”; UiButton: “a hint that fails to load costs nothing but the hint: no error, the reason still read”; UiIconButton: “disabled with a reason, it stays in the Tab order, refuses a press and is described by it”; UiIconButton: “off with a reason, it shows the reason on keyboard focus and on a tap”; UiIconButton: “a reason that comes and goes keeps the square, its focus and its ref”; UiIconButton: “as a menu button that refuses its press, it opens nothing by arrow”; UiIconButton: “a UiTooltip around it names it while it works and says the reason while it is off, with no warning”; UiCopyButton: “an empty value keeps the button in the Tab order and says there is nothing to copy”; UiCopyButton: “disabled with a reason passes the reason on”; UiCopyButton: “an empty value copies nothing and the button is off”.

## See the value the app actually accepted

Proof, in the tests: UiTimePicker: “a change the parent refuses puts the picker back on the model”; UiTextarea: “a change the parent refuses puts the textarea back on the model”; UiTextarea: “a refused composition goes back to the model too”; UiSwitch: “a change the parent refuses leaves the switch on the model”; UiSelect: “a change the parent refuses puts the select back on the model”; UiListField: “a change the parent refuses puts the input back on the model”; UiScaleInput: “a refused pick leaves the bar and the tab stop on the model”; UiRadioGroup: “a vetoed change puts the DOM back on the model”; UiPasswordField: “a generate the owner refuses says nothing, reveals nothing and emits no generate”; UiInput: “a change the parent refuses puts the input back on the model”; UiDropzone: “a change the parent refuses leaves the list and the input on the model”; UiCodeInput: “a change the parent refuses puts the input back on the model”; UiCheckbox: “a vetoed change puts the DOM back on the model”; UiStepper: “a press of plus the parent refuses leaves the count on the model”.

## Know what was refused and why

Proof, in the tests: UiDropzone: “a refusal names the files it refused, three and then how many more”; UiDropzone: “every reason of a mixed batch is told”; UiListField: “check refuses with the reason and the text stays”; UiListField: “split, fix and check go the same way: a list typed with commas, tidied, the bad one kept”.

## Submit the values shown in the form

Proof, in the tests: UiTimePicker: “in a form it sends HH:mm under its name, and an empty value while empty”; UiTimePicker: “a disabled picker sends nothing with a form”; UiTextarea: “in a form it sends its value under its name, nothing when disabled”; UiTextarea: “a form reset leaves the textarea on its model”; UiSwitch: “in a form an on switch sends its value under its name and an off one sends nothing”; UiSwitch: “a form reset leaves the switch on its model”; UiSelect: “an empty select sends nothing under its name”; UiSelect: “a form reset leaves the select on its model, hidden input and trigger agreeing”; UiScaleInput: “in a form the mark sends under the name, none and disabled send nothing”; UiRadioGroup: “in a form the checked radio sends its value under the group name, and none sends nothing”; UiRadioGroup: “a form reset leaves the radios on the model, mark and DOM agreeing”; UiPasswordField: “in a form it sends the generated password under its name; a reset keeps it on its model”; UiPasswordField: “generate and copy inside a form do not submit it”; UiInput: “in a form it sends its value under its name”; UiInput: “a form reset leaves the input on its model”; UiInput: “Enter settles the number before the form is sent, in the same task”; UiInput: “in a comma locale a native form gets the number as the field shows it, 12,5”; UiDropzone: “in a form it sends the files under its name”; UiDropzone: “a form reset leaves the native input on its model”; UiDatePicker: “name sends the day with a form”; UiDatePicker: “a disabled picker sends nothing with a form”; UiDatePicker: “a value that is no day shows empty, has no cross, sends an empty value, and warns in dev”; UiCodeInput: “in a form it sends the code under its name”; UiCodeInput: “a form reset leaves the input on its model, cells and DOM agreeing”; UiCheckbox: “in a form a checked box sends its value and an empty one sends nothing”; UiCheckbox: “a form reset leaves the box on its model, glyph and DOM agreeing”; UiStepper: “in a form it sends its count under its name, and a reset puts the app's count back”.

## Finish a word in any script before it is sent

Proof, in the tests: UiTableToolbar: “no emit happens while a word is being composed”; UiTableToolbar: “the Enter that confirms an IME candidate sends nothing”; UiTableToolbar: “the Enter Safari sends after it ends a composition sends nothing at once”; UiInput: “emits nothing mid-composition and the final value at its end”; UiInput: “a re-render of the host mid-composition does not reset the characters being typed”; UiInput: “Escape and the arrow keys during an IME composition do nothing”; UiSelect: “an Enter that confirms an IME composition in the search picks nothing”; UiFilterList: “an Enter that confirms an IME composition in the search field does not toggle the active row”; UiFilterList: “an Enter Safari sends to confirm a composition (keyCode 229) ticks nothing”; UiListField: “the Enter that confirms an IME composition adds nothing”.

## Land on a page with records after a delete

Proof, in the tests: UiDataTable: “removing the last row of the last page lands on the page before”; UiDataTable: “a page beyond the last asks for the last one once the list is not loading”; UiPagination: “a stale page beyond the range renders as the last page”.

## Keep the chart when a refresh fails

Proof, in the tests: UiChartCard: “a failed refresh keeps the chart and says it on the title line, the reason in the tooltip”; UiChartCard: “a failed refresh is said in the live region with its reason”.

## See upload progress and when it ends

Proof, in the tests: UiDropzone: “progress out of range is clamped in the bar, the number and aria-valuenow”; UiDropzone: “the zone keeps one layout when busy turns on: Browse holds, the bar runs along the foot”; UiDropzone: “a finished upload is said in the status region”; UiDropzone: “an upload that ends below 100 is not marked done or said”; UiDropzone: “a failed upload marks the files it left with the reason and a Retry”; UiDropzone: “a failure is said in the status region once the upload stops”; UiProgress: “The bar says how far it is, and its fill follows value of max.”; UiProgress: “beyond max the number stays at max and valueText carries the real value”.

## Avoid adding the same entry twice

Proof, in the tests: UiDropzone: “the same file twice is refused as a duplicate”; UiListField: “a pasted column adds every line, repeats pointed at”; UiListField: “Enter adds even when a row holds the same letters; a repeat is refused with a line”; UiListField: “a repeat inside one paste is pointed at, not dropped without a word”.

## See where the app is working

Proof, in the tests: UiCard: “A refresh shows its work: the card dims what it shows and one spinner turns in its middle, over it, so nothing moves.”; UiCard: “A first load is a skeleton alone: no spinner for the same wait.”; UiCard: “loading over content keeps it at 60% and says updating; with nothing yet it draws the skeleton”; UiSkeleton: “A hidden block in the shape its host gives it.”; UiFilterList: “a refresh keeps the options in view, dimmed and busy, with no rows of skeleton”; UiFilterList: “a first load draws rows in the options' shape and says it loads, never "Nothing found"”; UiFilter: “a first load shows rows in the options' shape; a refresh keeps the options, dimmed, and says "Updating…"”; UiBadge: “While it works a spinner stands where the dot was, and the words say what runs.”; UiProgress: “The bar says how far it is, and its fill follows value of max.”; UiProgress: “Work of unknown length runs a band along the track and says no number.”; UiSpinner: “The ring turns, at the size its host gives it.”; UiSpinner: “With a name it is a status with that name; without one it is hidden from a screen reader.”.

## Show the error where the hint was

Proof, in the tests: UiField: “an error is announced, marks the control invalid and replaces the description; the label keeps its ink”; UiField: “when the error clears the description returns and the wiring follows”; UiListItem: “an error replaces the description, is an alert and marks the control invalid”; UiListItem: “When the error clears, the description comes back and describes the control again.”.

## Leave invalid date values empty instead of guessing

Proof, in the tests: UiDatePicker: “a value that is no day shows empty, has no cross, sends an empty value, and warns in dev”.

## Respect date limits without losing a value

Proof, in the tests: UiTimePicker: “a value outside min and max is kept and reads invalid”; UiDatePicker: “a preset outside min and max is held”; UiDatePicker: “an app's own preset is its words and its days from today; one outside min and max is disabled”; UiDatePicker: “a day outside min and max is kept and reads invalid”; UiDatePicker: “presets follow the calendar's window: backwards bounds are one window, a malformed bound is none”; UiCalendar: “the arrows and the months view stop at the window; a page stops at its edge day”; UiCalendar: “an empty calendar whose window ends before today opens on the window's last month”; UiCalendar: “a chosen day far outside the window can be walked back by the arrows and the year arrows”; UiCalendar: “a month arrow from inside the window never leaves the focus on a day outside it”; UiCalendar: “a malformed bound is ignored and warned about, not a dead calendar”.

## Keep the end of a period after its start

Proof, in the tests: UiDatePicker: “an end bound to its start keeps its day and reads invalid once the start moves past it”; UiDatePicker: “a day outside min and max is kept and reads invalid”.

## Keep the current period until both days are picked

Proof, in the tests: UiDateRange: “a half-made span is dropped on close: reopened, the panel is the list again”; UiDateRange: “a period set from outside while the calendar is half picked drops the half pick”.

## See a date range before you pick its end

Proof, in the tests: UiCalendar: “the band runs to the pointed day and the line counts its days; nothing is chosen or sent until the press”; UiCalendar: “the keys draw the band to the focused day, which says its length, and take it from a resting pointer”; UiCalendar: “a day the press cannot pick does not end the band, and the pointer leaving takes it back”; UiCalendar: “a pointer resting on the grid does not take the band back from the keys when the month turns”; UiCalendar: “while a span waits for its end, the days past the first taken day cannot end it”; UiDateRange: “a custom span is drawn to the pointed day and counted before the second press”.

## See which days are the weekend

Proof, in the tests: UiCalendar: “the header names the locale’s days of rest in bold, wherever its week starts”; UiCalendar: “a day of rest is drawn as any other day of the month: no ground, the same hover”; UiCalendar: “a weekday column is named by its full day”; calendar: “the weekend is the locale’s: Saturday and Sunday in ru and en-US, Friday and Saturday in Saudi Arabia”; calendar: “without week info the region decides the weekend, as the engine’s own CLDR does”; UiDatePicker: “its calendar names the days of rest in bold”; UiDateRange: “the calendar of a custom span names the days of rest in bold”.

## See the day of the week beside a date

Proof, in the tests: UiDatePicker: “shows the day by the locale, or the placeholder when empty”; UiDatePicker: “the field stands over the widest date and keeps the place of the cross, so a pick keeps its width”; UiDateCell: “context weekday names the day in full under either lead”.

## Save the day you picked, in any time zone

Proof, in the tests: UiDatePicker: “a picked day reaches the model and the form as that day, whatever the zone of the device or the app”; UiCalendar: “a click picks a day; a day of the next month picks into it”; UiDateRange: “Custom range opens the calendar on the span; two days make it custom, in either order, and close”; UiDateCell: “a day without a time stays that day in any time zone of the app”.

## Make small changes without losing decimal precision

Proof, in the tests: UiInput: “a click moves by the precision of the value: a cent stays a cent”.

## Enter numbers in the app’s local format

Proof, in the tests: UiInput: “a comma becomes a point in the emitted value and in the control”; UiInput: “a pasted formatted number is read the way it is written”; UiInput: “a paste drops the grouping marks of the locale and keeps the magnitude”; UiInput: “a paste the locale cannot read for sure is kept as written and marked invalid”; UiInput: “typing keeps the marks as typed; the field is read on blur”; UiInput: “text with no digit in a number field is marked invalid on blur”; UiInput: “the field tells the app when the model holds text the locale cannot read for sure, and when it no longer does”; UiInput: “while a number is typed the app hears unsure at once, and the red mark waits for blur”; UiInput: “a number field mounted again over a reset model clears the app flag the last one left”; UiStepper: “a count pasted as people write it is read in the app locale”; UiStepper: “a count the locale cannot read for sure tells the app, as its number field does”.

## Type a date or a time as your language writes it

Proof, in the tests: UiDatePicker: “digits typed on the field open the calendar on the day they read, and Enter takes it”; UiDatePicker: “reads the parts in the app’s language: day first in Russian”; UiDatePicker: “a day that does not exist is not taken, nor a day outside min and max”; UiDatePicker: “a press away takes a day typed as Enter would; Escape still drops it”; UiDatePicker: “Escape drops a typed day when the focus is on the panel itself”; UiDatePicker: “a press away from a text that reads no day says so”; UiDatePicker: “a stray digit or a year half typed is dropped on a press away, and said”; UiDatePicker: “a day written in full is taken on a press away, with its marks or as eight digits”; UiDatePicker: “th-TH: the year is read in the calendar the field writes it in”; UiDatePicker: “fa-IR: a day of another calendar is not typed at all, never read as a Gregorian one”; UiTimePicker: “three digits are H:mm: 230 and Enter is 02:30, not 23:00”; UiTimePicker: “a space after the hour ends it, as a colon does: 9 30 is 09:30, and nothing is emitted before”; UiTimePicker: “Enter on a time that does not exist takes nothing, says so and marks the field invalid”; UiTimePicker: “a time that does not exist is not taken: 2400 is not 02:40”; UiTimePicker: “a press away takes a time typed in full, and drops a shorter one, said”; UiTimePicker: “in a 12-hour language a press away wants the period, or an hour only the 24-hour clock has”; UiTimePicker: “in a 12-hour language the typed text names the half of the day it will be read in”; UiTimePicker: “a time outside the window is not taken by Enter nor by a press away, and said”; UiTimePicker: “Escape drops the typed time wherever the focus is in the panel”; calendar: “reads the parts in the locale’s order, with any marks between them”; calendar: “reads a day that does not exist, or a part half typed, as no day: never a guess”.

## Count the last day of a period whole

Proof, in the tests: dateRange: “runs from midnight of the first day to midnight after the last, in the app’s zone”; dateRange: “keeps a day whole across a change of the clock”; dateRange: “an open end is no bound, All time none at all, and ends given backwards are one period”; UiDateRange: “a period picked here gives a query its moments, the last day whole, by periodBounds”.

## Keep “Last month” and “Today” up to date

Proof, in the tests: UiDatePicker: “presets follow midnight”; UiDateRange: “a named preset whose days went stale is re-resolved against today, on mount and across a month end”; UiDateRange: “a preset without days in the model fills them”; dateRange: “a named preset is counted from today in the zone, whatever days it carries”.

## Mark today in the app’s time zone

Proof, in the tests: UiCalendar: “today is not marked before mount”; UiCalendar: “today is marked as the current date, once mounted”; UiCalendar: “today is the day of the app time zone, past midnight there before UTC”.

## Show missing data as a gap

Proof, in the tests: UiSparkline: “a missing value breaks the line, and the dot stands on the newest value there is”; UiSparkline: “a bar with no value leaves its place empty rather than drawing a stub”; UiSparkline: “a value alone between two gaps is drawn as a dot, not a speck of line”; UiAreaChart: “a missing value breaks the line instead of dropping to zero”; UiAreaChart: “a point with gaps around it keeps a dot”; UiBarChart: “a missing value keeps a thin stub, never a zero bar”; UiBarChart: “a zero period stays visible and distinct from a missing one”; UiTable: “renders headers and values: format, accessor, a dash for an empty value”; UiTable: “a format that returns an empty string still shows the table's dash”; UiDataTable: “draws typed cells with the library cells and an empty value as a dash”; UiDataTable: “a progress cell with no value is the empty-cell dash, never a bar at 0”.

## Show when a reporting period is still incomplete

Proof, in the tests: UiBarChart: “its tooltip and table say it is in progress”; UiBarChart: “the empty periods after it are to come: dashed outlines, not gray stubs”; UiAreaChart: “partial dashes the last segment and says the period is going”.

## Show a shrinking loss as an improvement

Proof, in the tests: UiDelta: “a negative base still reads by the direction of the move”; UiDelta: “invert with a negative base: a smaller loss is growth, so it is worse”.

## Keep a reset from restoring the old search

Proof, in the tests: UiTableToolbar: “a value set from outside replaces the typing and drops the pending send”.

## Let the app check a code as soon as it is complete

Proof, in the tests: UiCodeInput: “a value set from outside does not fire complete”; UiCodeInput: “complete fires again after a completed code is edited and filled anew”; UiCodeInput: “typing at a full code fires nothing when the model was over length”.

## Act on several selected rows at once

Proof, in the tests: UiDataTable: “the bulk slot gets the count, the selection and the size; the pager and the clear take the size”; UiDataTable: “shows the selection strip with the count, the bulk slot and a clear that empties the selection”.

## Keep Reset in one place

Proof, in the tests: UiTableColumns: “a tick applies at once; the summary counts the hidden; Reset is held until something differs”; UiFilter: “Reset is in the same place before and after the first tick, held while nothing is chosen”.

## Clear a search in one step

Proof, in the tests: UiListField: “Escape empties the field and stays; empty, it goes on to the host”; UiListField: “no line of keys under the list; the cross empties the field”; UiListField: “the cross and Add, pressed by keyboard, keep the focus in the field”; UiListField: “Escape with only a line under the field clears the line and stops there”; UiTableColumns: “from six columns a search narrows the list, and Escape empties it with the panel still open”; UiSelect: “the search clears its own text on Escape and keeps the panel open; a second Escape closes it”; UiInput: “a search with text shows a cross that clears it and keeps the focus”; UiInput: “Escape clears a search with text and goes no further; on an empty one it passes”; UiInput: “Escape in a search whose results are on their way goes no further and clears nothing”; UiTableToolbar: “the cross and Escape each send the empty value once, at once, and keep the focus”; UiFilter: “in the panel a search with text clears on Escape, and the panel stays open”; UiFilterList: “the search field clears its own text on Escape, keeping the popover open, before Escape can close it”; UiFilterList: “the cross empties the search and keeps the focus in it”.

## Find what you chose at the top of a long filter

Proof, in the tests: UiTableColumns: “from six columns the ones shown open at the top, in the order of the table”; UiTableColumns: “from six columns the shown and the hidden stand under their names, a line between”; UiFilterList: “from six options the chosen ones open at the top, in their own order, and stay put while ticking”; UiFilterList: “five or fewer keep their order”; UiFilter: “a long filter opens with the chosen options at its top”.

## Keep nearby buttons and fields in place

Proof, in the tests: UiFilter: “the funnel and the count share one fixed slot, so the width holds”; UiFilter: “a count above 9 reads 9+ and is spoken exactly”; UiDateRange: “the button stands over the widest named period, so a pick keeps its width”; UiDatePicker: “the field stands over the widest date and keeps the place of the cross, so a pick keeps its width”; UiDatePicker: “disabling keeps the width: the cross's place stays”; UiRadioGroup: “segments keep one weight whether chosen or not, so none changes width on a pick”; UiSelect: “the field keeps its width: the text stands over the longest labels, the cross keeps its place”; UiSelect: “the clear cross pulls to the capsule edge and, at xs, fits inside the capsule; its kept place matches it”; UiStepper: “the count keeps its 3em whatever its digits, minus and plus at the edges, so neither moves”.

## Keep nearby content in place while loading

Proof, in the tests: UiChartCard: “the first load hands the chart its skeleton and says it loads”; UiChartCard: “a refresh keeps the chart in view, dimmed and busy, and says it is updating”; UiChartCard: “the words of a failed load add no height of their own above and below”; UiSelect: “options the app is loading show rows in their shape and say so, never "No matches"”; UiAppShell: “places on their way draw five rows in their shape, keep the footer, and say so once”; UiButton: “reserves the loading width even when the loading prop arrives after the first render”; UiButton: “the idle width sizer carries the #loading slot text”; UiButton: “a toggle that is off holds the room of its check, so pressing it moves nothing”; UiAspectRatio: “The box holds its place before the media loads: its proportions are its own.”; UiCard: “a refresh dims the body in place: the content is not mounted again”; UiCard: “loading over content keeps it at 60% and says updating; with nothing yet it draws the skeleton”; UiCard: “a load after the empty state keeps it in place: the card keeps its height”; UiCrudDrawer: “#loading draws the skeleton of the form that comes, in place of the two default fields”; UiSkeleton: “A hidden block in the shape its host gives it.”; UiTable: “a skeleton row has the height of a text row and its bar follows the column alignment”; UiTable: “a refresh in flight keeps the existing rows instead of skeleton rows, and says it is busy”; UiLog: “older events append after the last one and leave the nodes already shown”; UiDataTable: “holds the footer while the first page loads, so nothing moves when the total arrives”; UiAvatar: “The avatar container and initials remain rendered while the photo loads.”; UiAvatar: “The avatar keeps its size while the photo loads, once it arrives and if it fails.”; UiAvatar: “Initials are shown on mount if the photo has already failed.”.

## Search while the table stays in place

Proof, in the tests: UiDataTable: “a new search draws skeleton rows at once, in place of the rows of the last answer”; UiDataTable: “the skeleton holds as many rows as were in view, and never fewer than the floor”; UiDataTable: “the empty answer and the failed load stand on the floor the skeleton fills”; UiDataTable: “a failed new search shows the plate with Retry, not the rows of the last answer; Retry brings the skeleton”; UiDataTable: “a sort or a page of the same search keeps the rows in place, dimmed”; UiDataTable: “while a search is out, the field keeps the focus and the typing, and draws no spinner”; UiTable: “a failed load shows the message with a retry; a failed refresh shows the same plate in place of the rows”; UiTable: “a retry in flight after a failure draws the skeleton: no retry is left to press twice”.

## Keep reading as older events load

Proof, in the tests: UiLog: “Show older keeps the place: focus moves to the first new event when the button goes, and the count is said”.

## Keep the page arrows under the pointer

Proof, in the tests: UiPagination: “the row holds the same number of slots on every page”; UiPagination: “every number is as wide as the widest, and a four-digit total holds the arrows”; UiPagination: “the compact label holds the width of its widest "N / M", and the gap the numbers' text size”.

## Keep at least one column visible

Proof, in the tests: useTableColumns: “a table with no required column keeps one column visible however many are unticked, including from storage”; UiTableColumns: “the last column shown is held and marked Last one”.

## See that a row goes on past its edge

Proof, in the tests: UiTable: “fades at the end while more columns wait there”; UiTable: “fades at the start once scrolled, and not at the end when the end is reached”; UiTable: “a table that fits draws no fade”; UiTable: “the horizontal scroll box is keyboard-focusable and named once the table overflows”; UiTable: “row actions add a sticky last column with a named header; a footer cell adds the footer row”; UiTable: “the end's shade stands at the row actions, where the columns slide under them”; UiTable: “an edge with more columns past it grows an arrow that pages the table, for the pointer”; UiTable: “at the end the arrow stands at the start and pages back”; UiTable: “an empty or a failed wide table draws no shade and no arrow over its plate”; UiTabs: “a long set scrolls sideways without a bar and never wraps”; UiTabs: “edges that hide tabs fade and grow arrows; a set that fits has neither”; UiTabs: “the arrows are for a mouse: drawn only on a device whose pointer hovers and is fine, never on touch”.

## Open a panel on the side where it fits

Proof, in the tests: UiDatePicker: “near the bottom of the window the calendar opens above the field; near the top, below it”; UiSelect: “near the bottom of the window the list opens above the field; near the top, below it”; anchorPosition: “stands below with a gap by default”; anchorPosition: “flips above only when below has no room and above has more”; anchorPosition: “pins to the bottom edge instead of leaving the screen”; anchorPosition: “stays inside the right edge”.

## Close only the top layer with Escape

Proof, in the tests: UiDrawer: “Escape closes only the layer on top: a window over the drawer first”; UiTooltip: “Escape on a shown tooltip inside a modal hides the hint and leaves the modal open”; UiTimePicker: “Escape in a window closes the list only”; UiPopover: “opened from a drawer: focus may sit in the panel, Escape closes the panel only”; UiCrudDrawer: “Escape in the open menu closes the menu, not the drawer”; UiCrudDrawer: “Escape goes one level up; at the top it closes”; UiModal: “Escape closes only the window on top”; UiDatePicker: “Escape in an open calendar inside a modal closes the calendar only”; UiSelect: “Escape on the trigger of an open select inside a modal closes the list only”; UiSelect: “Home and End jump, Escape closes and returns focus to the trigger”; UiSelect: “the search clears its own text on Escape and keeps the panel open; a second Escape closes it”.

## Close a popup without closing the form behind it

Proof, in the tests: UiCrudDrawer: “a backdrop press closes a select opened inside, and leaves the drawer open”; UiModal: “a backdrop press closes a select opened inside, and leaves the window open”; UiDatePicker: “a click away from the calendar inside a modal closes the calendar and keeps the modal”; UiSelect: “a press outside its list inside a modal closes the list and keeps the modal”.

## See one window at a time

Proof, in the tests: UiModal: “a window opened from a window takes its place: the first closes, and the focus goes back to what opened it”; UiModal: “a window opened over a window hides it, out of sight and out of reach; one is seen”; UiModal: “a window that is persistent is not replaced: it waits under the new one and comes back”; UiModal: “a window that is submitting is not replaced: it waits under the new one and comes back”; UiModal: “a question over a window does not take its place: the window comes back once it is answered”; UiModal: “a window opened while a menu of the window is still open takes its place”; UiModal: “three windows: only the top one is seen, and they come back one by one”; UiModal: “closed from outside, the one on top brings the one under back before the focus goes in”; UiConfirm: “hides the window until it is answered; the window comes back with the focus on what asked”.

## Go straight to the field that needs fixing

Proof, in the tests: UiTimePicker: “a picker marked invalid is what focusInvalid lands on”; UiTextarea: “a textarea marked invalid is what focusInvalid lands on”; UiSwitch: “a switch marked invalid is what focusInvalid lands on”; UiSelect: “focusInvalid on an invalid select focuses the trigger”; UiListField: “inside UiField the input takes the field id and invalid, and focusInvalid lands on it”; UiListField: “a refused draft is not the form’s refusal: Save sends once, the focus stays on Save”; UiScaleInput: “focusInvalid on an invalid scale focuses the chosen segment, else the first”; UiRadioGroup: “focusInvalid on an invalid radiogroup focuses the chosen radio, else the first”; UiInput: “an input marked invalid is what focusInvalid lands on”; UiField: “a group field in error: focusInvalid lands on a radio inside the group”; UiDropzone: “a dropzone marked invalid is what focusInvalid lands on”; UiCodeInput: “a code marked invalid is what focusInvalid lands on”; focusInvalid: “focuses the first invalid field in the root and scrolls it into view”; focusInvalid: “passes over a draft refused on its own (`data-draft`): it is not the form’s to fix”; UiCrudDrawer: “a submit that leaves a field invalid puts the focus on the first one”; UiCrudDrawer: “a refused submit can be sent again after the fix is made with a control that fires no input event”; UiModal: “a submit that leaves a field invalid puts the focus on the first one”; UiCheckbox: “a box marked invalid is what focusInvalid lands on”; UiStepper: “in a field in error, focusInvalid lands on the count”; UiListItem: “in a label row with an error, focusInvalid lands on its control”.

## Close an open picker when its field is disabled

Proof, in the tests: UiSelect: “disabling while open closes the list and keeps the focus on the field”; UiDatePicker: “disabling closes an open calendar”; UiDatePicker: “disabling while the calendar has the focus keeps it on the field, not on the body”.

## Show when only some are selected

Proof, in the tests: UiCheckbox: “indeterminate sets the DOM property and draws the fill”; UiCheckbox: “a press on a mixed box that the parent does not resolve leaves the DOM mixed”; UiTable: “the page checkbox selects the selectable rows, shows mixed for a part, clears when all are in”.

## Name states in words, not color alone

Proof, in the tests: UiScaleInput: “thermometer numerals take the ink that reads on their stop”; UiScaleInput: “empty numerals read in the body ink on their track”; UiBadge: “The words name the state in every form, from the label or the slot.”; UiBadge: “A badge with no words is a bare color and warns in development.”; UiListItem: “A notice says its tone in words before its title, not by color alone.”; UiListItem: “each tone of a notice draws its own glyph, and #media replaces it”; UiLink: “is underlined at rest: a touch screen has no hover”; UiDelta: “says better or worse for a screen reader, not only in color”.

## See how the rows are sorted

Proof, in the tests: UiTable: “a sortable header cycles first direction, the other one, then none; aria-sort follows”.

## Compare numbers in aligned columns

Proof, in the tests: UiTable: “an end-aligned column sets tabular figures”; UiDataTable: “a money column aligns to the end by itself; align start keeps it at the start”.

## Read old and new values in full

Proof, in the tests: UiLog: “a long was and became wrap and keep both values readable, none is cut”.

## See when each event happened

Proof, in the tests: UiLog: “a Date of today reads the hour, another day its date, another year its year; the exact moment is on the time”.

## Keep counts short and in place

Proof, in the tests: UiIndicator: “Past max the mark reads 99+, at any corner.”; UiIndicator: “At zero the mark is gone; a dot shows without a count.”; UiIndicator: “A count that is not a number hides the mark and warns in development.”; UiIndicator: “a negative count is none: the mark is gone, as at zero”; UiCount: “Above max it reads 99+: one digit is a circle, two grow a capsule.”; UiCount: “A count that is not a number shows nothing, with a warning in development.”; UiCount: “a negative count reads 0”; UiCount: “an unset count is 0, and a count that is not a number draws nothing”; UiTabs: “a count of zero draws no badge”; UiTabs: “a count past its limit reads 99+ and keeps the badge short”; UiTabs: “a badge with badgeLabel is read in words: the number hidden, the meaning said”; UiTabs: “a bare number badge warns in dev”.

## Read the full text when a label is shortened

Proof, in the tests: UiTruncate: “A cut text keeps its whole in a tooltip, while the cut is real.”; UiTruncate: “Text that fits gets no tooltip, and no native title either.”; UiTruncate: “The cut is measured again when the text changes.”; UiBadge: “A long label is cut at the width of its place.”; UiBadge: “A cut label keeps its whole text in a tooltip; text from the slot is cut without one.”; UiBarChart: “a category period keeps its label, cut to its band, and the table names it whole”; UiDonutChart: “a total too long for the hole is written short there, and in full in the table”; UiTable: “stands in a UiTruncate, not under a title”; UiCopyButton: “a long inline label stands in a UiTruncate, the glyph kept”; UiSelect: “a chosen label stands in a UiTruncate, its whole text in the tooltip while cut”; UiSelect: “the whole-label tooltip stays away while the list is open, where it would stand over the rows”.

## Notice when there are more options below

Proof, in the tests: UiTableColumns: “a long list of columns is cut at five rows and a half”; UiFilterList: “a long list is cut at five rows and a half”; UiSelect: “a long list is cut at five rows and a half”; UiDateRange: “the list is cut at five rows and a half”.

## Know what fits when a list has a limit

Proof, in the tests: UiDropzone: “refuses files beyond maxFiles and keeps the ones that fit”; UiListField: “a limit fits a paste into what is left; full, the field is gone and says what did not fit”; UiListField: “reaching the limit one item at a time says the list is full and hands it the focus”; UiListField: “a list that fills while a line stands says it is full, as well as what the line said”.

## Toggle or pick by clicking the words

Proof, in the tests: UiSwitch: “a label in the slot wraps the control, so clicking the text toggles too”; UiCheckbox: “the text is inside the label, so a click on it toggles”; UiListItem: “A click anywhere on a setting row, its title included, toggles the switch it names.”; UiRadioGroup: “the row is the label: a click on the text selects”; UiRadioGroup: “a click anywhere on a card picks it, its media and its meta included”.

## Drop files anywhere on the upload card

Proof, in the tests: UiDropzone: “a drop anywhere on the card lands, not only on the dashed field”; UiDropzone: “a file dropped outside the card does not reach the browser default”; UiDropzone: “dragging text over the zone does not light it”.

## Clear a field and enter its replacement immediately

Proof, in the tests: UiTimePicker: “the cross clears it and the focus stays on the field”; UiSelect: “the clear button keeps the focus on the field”; UiListField: “the cross and Add, pressed by keyboard, keep the focus in the field”; UiInput: “a search with text shows a cross that clears it and keeps the focus”; UiDatePicker: “the cross clears and leaves focus on the trigger; at xs it fits inside the capsule”; UiDatePicker: “a clear with the calendar open closes it and leaves the focus on the field”.

## See the password you generate

Proof, in the tests: UiPasswordField: “generate fills the field, shows it and says so; the copy button wakes up”; UiPasswordField: “hides the password again once the value is emptied”.

## Generate a password instead of inventing one

Proof, in the tests: generatePassword: “every generated password holds a lower, an upper, a digit and a symbol”; UiPasswordField: “generate fills the field, shows it and says so; the copy button wakes up”.

## Show a password without leaving the field

Proof, in the tests: UiInput: “pressing the eye with a pointer keeps the focus in the value”; UiInput: “the eye keeps the caret where it was”.

## Take back a scale answer

Proof, in the tests: UiScaleInput: “a click picks; a click on the mark clears unless clearable is off”; UiScaleInput: “Delete and Backspace obey clearable=false”; UiScaleInput: “Space on the mark keeps it”.

## Know how to add files from a folder

Proof, in the tests: UiDropzone: “a dropped folder is refused with a reason”; UiDropzone: “a folder that gives no file handle is still refused as a folder”.

## Type, paste or autofill a code

Proof, in the tests: UiCodeInput: “a pasted SMS keeps the code inside it”.

## Show where the next code character goes

Proof, in the tests: UiCodeInput: “the cell for the next character is marked; a full code marks the last one”; UiCodeInput: “Backspace takes the last character and the next cell moves back”.

## Keep only the characters a code allows

Proof, in the tests: UiCodeInput: “keeps only allowed characters and cuts at the length; complete fires when full”; UiCodeInput: “a value from outside is filtered like a typed one”.

## Know when a link opens a new tab

Proof, in the tests: UiLink: “an external address opens in a new tab, safely, and says so to a screen reader”; UiLink: “an external link draws an arrow after the text, an internal one does not”; UiLink: “target overrides the default, and the screen-reader notice follows the real target”; UiButton: “an address with a protocol opens in a new tab and says so”; UiButton: “a new tab is seen as well as said: an arrow, and a caller target gets rel and the notice”; UiListItem: “a row linking to another site opens in a new tab and says so”; UiListItem: “a row to another site ends in the new-tab arrow, not the chevron”.

## Search once typing pauses

Proof, in the tests: UiDataTable: “the range is said after each load, and nothing while one runs”; UiSelect: “asks the server on open with an empty query, then 250 ms after the last key”; UiSelect: “reopening after a search asks once for the empty query”; UiSelect: “a press outside while a search waits asks the server for nothing”; UiSelect: “a search dropped before it was asked leaves the closed field showing its value, not a load”; UiSelect: “an answer on its way when the list closes changes nothing: the field shows its value”; UiTableToolbar: “sends the text once after the pause, with the last value”; UiTableToolbar: “Enter sends at once and does not submit a form around the toolbar”; UiTableToolbar: “no emit happens while a word is being composed”.

## Copy a whole value in one press

Proof, in the tests: UiCopyButton: “a glyph alone is an icon button named Copy; it copies the value whole”; UiCopyButton: “truncate shows the id cut in the middle in monospace and copies it whole; the glyph waits for hover”; UiCopyButton: “after a copy the glyph is a check for 1.2 s, and a reader hears Copied outside the button”; UiCopyButton: “a refused clipboard emits copy false and shows no check”.

## Remember hidden columns in this browser

Proof, in the tests: UiTableColumns: “a choice made in the menu is there after a remount”; useTableColumns: “survives a remount through localStorage, written at once”; useTableColumns: “a choice made in another tab reaches this one”.

## Reload or share a list as you see it

Proof, in the tests: useListAddress: “reads the view from the address before the first paint: search, sort, page and filters”; useListAddress: “a typed search changes the step in place; a page, a sort or a filter adds a step”; useListAddress: “Back reaches the list: the view follows the address and writes nothing back”; useListAddress: “reads, writes in place and as a step, keeps the path and the hash, and follows Back”; useListAddress: “an address without a sort opens on the default sort and writes nothing; Back to one returns to it”; useListAddress: “a column outside `sortKeys` reads as the default; one inside is read”; UiDataTable: “a view kept in the address opens on its search and page, and a typed search is written back in place”; UiDataTable: “a page past the last, from the address, is corrected in place, so Back leaves it”.

## Open a related record inside the drawer

Proof, in the tests: UiListItem: “a command row with step ends in a chevron beside its actions; a plain command has none”; UiListItem: “a step row chevron mirrors under rtl, slides only when enabled, and its text aligns to the start”; UiCrudDrawer: “a step shows a back button named by the level above, and no breadcrumb”; UiCrudDrawer: “a step in focuses its first field; the way up gives focus back to the row it left from”; UiCrudDrawer: “a backdrop press at a step goes back one level first, as Escape does, so it never discards an ancestor level's unsaved input”.

## Jump to an option by letter

Proof, in the tests: UiTableColumns: “a letter goes to the column that starts with it, and the same letter again to the next”; UiFilter: “a letter jumps to the next option that starts with it”; UiSelect: “a letter jumps to the first label with that prefix”; UiSelect: “a letter on the closed field opens on the first label that starts with it, the chosen one too”; UiSelect: “a Space after letters typed over the list belongs to the word: New J reaches New Jersey”; UiMenu: “a letter jumps to the next item whose label starts with it, wrapping”; UiFilterList: “keyboard as in a select: arrows move, Home and End jump, Enter and Space tick, a letter jumps”; UiFilterList: “the same letter pressed again goes on to the next option that starts with it”; UiFilterList: “a Space after letters typed over the list belongs to the word: New J reaches New Jersey”.

## Keep one option and clear the rest in one press

Proof, in the tests: UiTableColumns: “Only keeps the highlighted column alone, and a required column stays beside it”; UiTableColumns: “Only on a hidden column leaves that column alone in view”; UiFilterList: “Only on a row keeps it alone, and the press does not tick the row”; UiFilterList: “Alt+Enter keeps the highlighted option alone; a fixed chosen option stays”; UiFilter: “Only on the highlighted row keeps that option alone”.

## Pick with Enter without sending the form

Proof, in the tests: UiListField: “in a form Enter opens the row under the band or adds the text, and the form is not sent”; UiListField: “rows that arrive after the query still take the band: Enter opens the first match, adds nothing”; UiListField: “the band starts on the row named exactly as typed: “fruit” opens Fruit, not Fruit juice above it”; UiCalendar: “inside a form a pressed day picks it and the form is not submitted”; UiSelect: “inside a form Enter picks and the form is not submitted”; UiSelect: “Enter while the answer to the typed text is on its way picks nothing; once it comes, Enter picks from it”; UiFilter: “Enter in the search does not submit a form around the filter”; UiFilterList: “an Enter inside a form ticks and never submits it”.

## Submit a form with Enter

Proof, in the tests: UiModal: “Enter in a single-line field submits: the field and Save stand in one form”; UiModal: “a second submit before the host answers emits no second submit”; UiCrudDrawer: “Enter in a single-line field saves: the fields and Save stand in one form”; UiCrudDrawer: “the footer is exactly Cancel and Save; Save submits the form”; UiCrudDrawer: “a second Enter before submitting arrives sends no second request”.

## Submit from a text box with Ctrl or Cmd+Enter

Proof, in the tests: UiCrudDrawer: “Cmd+Enter in a textarea submits; Enter alone does not”; UiCrudDrawer: “Cmd+Enter in a list field that only adds submits too; its Enter alone adds”; UiModal: “Cmd+Enter in a textarea submits; Enter alone does not”.

## Change a number with the arrow keys

Proof, in the tests: UiScaleInput: “one tab stop, on the mark; arrows, Home, End move it and Delete clears”; UiScaleInput: “ArrowUp at max and ArrowDown at min emit nothing”; UiInput: “ArrowUp and ArrowDown step and do not move the caret; other keys pass”; UiInput: “ArrowUp at max and ArrowDown at min emit nothing”; UiInput: “a step keeps the caret where it was”; UiInput: “an arrow stops at a bound off the step grid, by key and by button”; UiInput: “a step writes plain digits, never an exponent, and keeps the cents it was written with”; UiStepper: “the buttons rest at the bounds and while disabled; the keyboard steps too”; UiStepper: “pressing minus or plus with a pointer keeps the focus and the caret in the count”; UiStepper: “minus and plus at the edges, the count centered in monospace, step 1 by default”.

## Keep your browser’s keyboard shortcuts

Proof, in the tests: UiListField: “with Shift, Alt, Ctrl or Cmd an arrow is the browser’s, as in any text field: the band stays”; UiListField: “Cmd or Ctrl with Enter is the form’s: nothing is added and the key goes on”; UiInput: “a numeric field steps on an arrow alone; with Alt, Ctrl or Meta the caret is the browser’s”; UiInput: “Shift with an arrow selects, as the browser does: no step”; UiCalendar: “Alt or ⌘ with an arrow moves no day and lets the browser have the key”; UiCalendar: “in the months view too, a chord moves no month and leaves the key”; UiDatePicker: “ArrowDown and Alt with ArrowDown open the calendar; Ctrl or Meta leave the key”; UiTimePicker: “Alt with ArrowDown opens the panel, as a select does; Ctrl leaves the key”; UiTimePicker: “Alt, Ctrl or Meta with an arrow moves no row and no column, and leaves the key”; UiSelect: “Alt with ArrowDown opens the list, as a select does; Ctrl or Meta leave the key”; UiSelect: “in the open list Ctrl or Meta with an arrow moves no highlight and leaves the key”; UiMenu: “Alt with ArrowDown opens the menu; Ctrl or Meta leave the key”; UiTabs: “a browser chord on a tab is not swallowed: Alt+ArrowLeft and Cmd+ArrowRight emit nothing”; UiScaleInput: “keys with Alt, Ctrl or Meta pass through and change nothing”; UiAreaChart: “Alt, Ctrl or Meta with an arrow, Home or End leaves the point and the key alone”; UiCodeInput: “Alt with an arrow goes to the browser (back a page); ⌘ or Ctrl with one keeps the caret at the end”.

## Move by month or year from the keyboard

Proof, in the tests: UiCalendar: “arrows move a day and a week; PageUp a month, Shift+PageDown a year; Home and End the week”; UiCalendar: “PageUp from the 31st lands on the 31st again where a month has one”.

## Jump to a month from the heading

Proof, in the tests: UiCalendar: “the caption opens the months of the year; a month opens its days”; UiCalendar: “the months view: the shown month has focus, arrows move over the grid”; UiCalendar: “leaving the months view after a year step leaves exactly one focusable day in the shown month”; UiCalendar: “a month button says its month and year”; UiCalendar: “Escape in the months view goes back to the days and does not reach the host”.

## Select or clear a range of rows

Proof, in the tests: UiTable: “Shift with a second checkbox marks every row between”; UiTable: “Shift over marked rows clears the range, as the pressed row goes”; UiTable: “Shift+Space from the keyboard marks the range too”; UiDataTable: “Shift with a second row checkbox passes the whole range up through the block”.

## Remove selected tags with the keyboard

Proof, in the tests: UiBadge: “The cross is a named button that removes the badge.”; UiSelect: “the cross of a tag drops that pick and moves the focus to the next tag”; UiSelect: “removing the last tag puts the focus back on the field”; UiSelect: “Backspace takes back the last pick in view, a value outside items shown as its text too”.

## Pick a common date in one press

Proof, in the tests: UiDatePicker: “presets pick today and yesterday in one click; the field shows the day they set”; UiDatePicker: “presets true gives the seven default days, in order”.

## Pick range ends in either order

Proof, in the tests: UiDateRange: “Custom range opens the calendar on the span; two days make it custom, in either order, and close”.

## Paste a list to add several entries

Proof, in the tests: UiListField: “a pasted column adds every line, repeats pointed at”; UiListField: “split, fix and check go the same way: a list typed with commas, tidied, the bad one kept”; UiListField: “a column pasted while an add is on its way is not swallowed: it waits and goes in as a list”; UiListField: “a list waiting behind an add is not sent after the field was disabled”.

## Reach frequent actions from the keyboard

Proof, in the tests: UiTableToolbar: “/ from the page goes to the search, and the field says its shortcut”; UiTableToolbar: “typed in a field, / stays a slash”; UiTableToolbar: “the first list on the page takes /”; UiTableToolbar: “a / the app took first, a window open over the list, or a list held inert keep it”; UiToaster: “F8 moves the focus to the newest toast action; the region names the key”; UiToaster: “F8 with no toast does nothing and leaves the key to the page”; UiAppShell: “Ctrl or ⌘ B toggles the collapse, but not while typing in a field”; UiAppShell: “Ctrl or ⌘ B is refused in any editable text, not only contenteditable="true"”; UiAppShell: “Ctrl or ⌘ B does nothing while a window is open above the shell”; UiAppShell: “a held Ctrl or ⌘ B toggles once”; UiAppShell: “a held Ctrl or ⌘ B is taken from the browser on every repeat, and toggles once”; UiAppShell: “Ctrl or ⌘ B works on a non-Latin layout”; UiAppShell: “Ctrl or ⌘ B follows the typed letter on a Latin layout”; UiAppShell: “narrow: Ctrl or ⌘ B opens and closes the sheet”; UiAppShell: “two shells: Ctrl or ⌘ B reaches the one the focus is in, else only the first”.

## Step through records in one drawer

Proof, in the tests: UiCrudDrawer: “index and total walk the list: ↑ and ↓ emit move, held at the ends”; UiCrudDrawer: “unsaved input or a save on its way refuse to walk the list, with a shake”; UiCrudDrawer: “without total there is no list to walk”; UiCrudDrawer: “at a step the arrows are gone, and they are back one level up”.

## Save and start the next record

Proof, in the tests: UiCrudDrawer: “it asks with another: true, and Save and Enter with another: false”; UiCrudDrawer: “when the save for another ends, the cursor is in the first field of the clean form”; UiCrudDrawer: “saved to add another, the cursor goes to the first field though it keeps its default”; UiCrudDrawer: “a save for another that failed leaves the cursor alone though the first field is empty”.

## Read every chart value from the keyboard

Proof, in the tests: UiAreaChart: “the plot is one tab stop: focus says the newest point, the arrows walk”; UiAreaChart: “a hidden table holds every value for a screen reader”; UiBarChart: “the plot is one tab stop: focus says the newest period, the arrows walk”; UiBarChart: “a hidden table holds every value for a screen reader”; UiDonutChart: “the ring is one tab stop; the arrows walk the parts and each is said”; UiDonutChart: “a hidden table holds every part, its share and the total”.

## Open with keyboard focus where the task begins

Proof, in the tests: UiDrawer: “focus goes to the first field, not the cross; without fields to the panel”; UiFilterList: “opened in a popover, a list of six and more puts the focus in its search”; UiFilter: “opened, the focus goes to the list, or to its search from six options up”; UiTableColumns: “opened, the focus goes to the list of columns”; UiTableColumns: “opened on six columns or more, the focus goes to the search”; UiConfirm: “asks in an alert dialog and answers true on confirm”; UiPopover: “focus goes to the first control and Tab goes round inside”; UiPopover: “focus goes to the first list, not to a search further down”; UiDatePicker: “opens a calendar on the chosen day; a pick closes it and returns focus to the button”; UiDatePicker: “with no value and today outside the window it opens on the nearest day”; UiCalendar: “shows the month of the value, the value picked and one focusable day marked to open on”; UiModal: “focus goes to the first field, not the cross; without fields to the window”; UiSelect: “focuses the filter, narrows by label, and says when nothing matches”; UiCrudDrawer: “loading: a skeleton, Save held, no submit; focus moves to the first field when it ends”; UiCrudDrawer: “a step into a form takes the first drawn field, a select too”; UiCrudDrawer: “a step with no field takes the focus on the panel, not on a button that decides”.

## Continue from where you opened the panel

Proof, in the tests: UiDrawer: “focus returns to the opener on close”; UiAppShell: “Escape closes the sheet and the focus returns to the menu button that opened it.”; UiAppShell: “A press on the backdrop closes the sheet, and the focus returns to the menu button too.”; UiPopover: “Escape and close() from inside return focus to the button”; UiFilter: “Escape closes the panel and returns the focus to the button”; UiTableColumns: “Escape closes the panel and returns the focus to the button”; UiDateRange: “closing returns the focus to the button: a preset, a custom span, Escape”; UiModal: “focus returns to the opener on close”; UiSelect: “Home and End jump, Escape closes and returns focus to the trigger”; UiSelect: “Tab from the filter closes and puts focus back on the trigger”; UiSelect: “after a pick from a searchable list the focus is back on the field; a press outside leaves it where it was”; UiMenu: “running an item closes the menu and returns focus to the button”; UiMenu: “the focus is on the button before the command runs, so a command that removes the button leaves it to the list”; UiDatePicker: “opens a calendar on the chosen day; a pick closes it and returns focus to the button”; UiCrudDrawer: “focus returns to the opener once the drawer closes”; UiCrudDrawer: “the arrow that reaches the end hands the focus to the other arrow”; UiCrudDrawer: “closed, a tick, then the row removed: the focus goes to the next row, the table first”; UiCrudDrawer: “closed, a tick, then the row removed: the focus goes to the next row, the drawer first”.

## Keep keyboard focus where you are working

Proof, in the tests: UiFilterList: “when the options drop under six while the search holds text and focus, the text goes and the focus stays in the list”; UiFilterList: “options that arrive with six or more while the list holds the focus hand the focus to the search”; UiToaster: “running the action from the keyboard gives the focus back where it came from”; UiAppShell: “Ctrl or ⌘ B with the focus on the logo hands the focus to the button”; UiAppShell: “collapsing with the focus inside #banner hands it to the toggle”; UiDropzone: “removing a file with the keyboard keeps the focus inside the card”; UiDropzone: “removing skips a locked row: the focus lands on the next removable one”; UiListField: “Enter adds what is offered, empties the field and keeps the focus”; UiListField: “removing a row puts the focus on its neighbor”; UiListField: “the rows change in place (splice): the removed row’s neighbor takes the focus”; UiListField: “when the list has room again, a focus on the line that said it was full goes back into the field”; UiTable: “a row deleted under the focus hands it to the same control of the row now in its place”; UiTable: “the page checkbox turned off with the last row gives the focus to the table box”; UiReveal: “returns focus to the trigger when the block collapses with focus inside it”; UiReveal: “closing a block no control names, with focus inside, returns focus to the element above”; UiInput: “the cross turning into the spinner keeps the focus in the field”; UiCopyButton: “focus stays on the button after a copy”; UiCopyButton: “copied the old way, through a field no one sees, the focus comes back to the button”.

## Pass a group with one press of Tab

Proof, in the tests: UiScaleInput: “one tab stop, on the mark; arrows, Home, End move it and Delete clears”; UiRadioGroup: “is a radiogroup whose radios share one name and reflect the value”; UiCalendar: “one day is a tab stop, so a focus trap around the calendar goes round it”; UiCalendar: “arrows move a day and a week; PageUp a month, Shift+PageDown a year; Home and End the week”; UiTabs: “marks the active tab and gives only it a tab stop”; UiTabs: “arrows wrap round the ends; Home and End jump to the ends”; UiTabs: “a pane with a focusable child adds no tab stop of its own; a pane of words does”; UiFilterList: “keyboard as in a select: arrows move, Home and End jump, Enter and Space tick, a letter jumps”; UiFilter: “the list is one tab stop, and Reset the next”; UiTableColumns: “the list is one tab stop, and Reset the next once something differs”.

## Keep turning pages from the keyboard

Proof, in the tests: UiCalendar: “the arrow that reaches the window's edge hands the focus to the caption”; UiCalendar: “a pick on a day of the next month keeps focus on that day”; UiDateRange: “the arrow that turns off at the window hands the focus to the button”; UiPagination: “keyboard paging on a loading list keeps the focus inside the pager”; UiPagination: “while loading, the pressed arrow keeps the focus with a spinner, the other is off, and a press asks nothing”; UiPagination: “compact: an arrow that goes inert hands the focus to the label, also while disabled”.

## Open a field from its label

Proof, in the tests: UiField: “the label resolves to the control, so a click on it focuses the control”; UiField: “a click on the label of a select opens its list, as a click on the select does”; UiField: “a click on the label of a dropzone opens the file dialog, as Browse does”.

## Name each field once for screen readers

Proof, in the tests: UiButtonGroup: “in a group field the legend names it and the error describes it”; UiButtonGroup: “its own ariaLabel wins over the legend”; UiIconButton: “ariaLabel is the accessible name; no tooltip and no title show it”; UiTooltip: “a hint equal to the trigger name is not wired as its description”; UiTimePicker: “inside UiField with a description it is named once and described once”; UiTextarea: “inside UiField with a description it is named once and described once”; UiTextarea: “warns in dev when it has no name”; UiSwitch: “with its own text inside UiField it is named by that text, as UiCheckbox”; UiSwitch: “slot text and ariaLabel together emit one name”; UiSelect: “takes id, required, error and description from the field”; UiSelect: “a standalone listbox takes the ariaLabel”; UiListField: “inside UiField group the input is named by the legend and described by the error”; UiScaleInput: “inside UiField the label names the group and the description describes it”; UiRadioGroup: “the name is the label text; the description and meta are read once after it”; UiPasswordField: “inside UiField the input takes the field id and the label names it”; UiPasswordField: “inside a UiField with no label the input keeps its ariaLabel”; UiPasswordField: “the copy button says it copies the password”; UiField: “labels the control through a generated id”; UiField: “warns in dev when a field holds two controls”; UiField: “a bare element in a group field takes labelId for aria-labelledby and gets no id”; UiField: “a required group of input and select marks the legend once, not each control”; UiStepper: “inside UiField the label points at the count, and the error and required reach it”; UiStepper: “the buttons are named by what they change: Decrease Guests, Increase Guests”; UiListItem: “the title names the control, the description describes it, the row is its label”; UiListItem: “two controls in one label row warn in dev: a label names one”.

## Announce required fields in words

Proof, in the tests: UiScaleInput: “required on the scale says aria-required standalone and stays silent inside a group field”; UiRadioGroup: “required on the group says aria-required and puts required on each input; inside a group field it stays silent”; UiInput: “inside UiField it takes the id, the error and required from the field”; UiField: “required puts an asterisk on the label and aria-required on the control”; UiField: “a required group of radios hears "required" once, from the legend”; UiField: “a required field around a dropzone says required in words”; UiStepper: “inside UiField the label points at the count, and the error and required reach it”; UiListItem: “required puts an asterisk on the title and aria-required on the control”.

## Describe calendar marks in words

Proof, in the tests: UiCalendar: “a dot says its label to a reader; a taken day says it is unavailable”; UiCalendar: “today is marked as the current date, once mounted”; UiCalendar: “a chosen day outside min and max is the disabled state, not a fade”; UiCalendar: “a span day outside min and max is disabled and not struck”.

## Announce scale steps with their meaning

Proof, in the tests: UiScaleInput: “the first and last radio name their end words”.

## Announce a new password without reading it

Proof, in the tests: UiPasswordField: “says a password was generated, without saying it, and says it again on a second generate”.

## Reduce motion without hiding loading

Proof, in the tests: UiReveal: “It opens and closes at once when the system asks for reduced motion.”; UiSpinner: “It keeps turning, slower, when the system asks for reduced motion.”; UiSkeleton: “It keeps shimmering, slower, when the system asks for reduced motion.”; UiProgress: “The running band keeps running, slower, when the system asks for reduced motion.”; UiIndicator: “Its pulse stops when the system asks for reduced motion: it calls, it does not work.”.
