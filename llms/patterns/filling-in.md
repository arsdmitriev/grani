# Forms and input: the patterns of grani-ui

Enter values, correct validation errors and submit a form.

Page: https://grani.arseni.work/patterns/filling-in

## Get your text back when adding fails

While an entry is being added, the field shows a spinner. You can keep typing, but pressing Enter again sends nothing. If adding fails, your text returns with a message such as “Could not add Meat. Press Enter to try again.”

Why: A failed request does not cost you the text you typed; one Enter tries again.

Held by the library by itself.
Where: [List field](https://grani.arseni.work/components/list-field).
Tests: 6, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#text-back

## Know why an action is unavailable

A button that cannot be pressed yet says what it waits for: “Add the client’s email first”. It keeps its place in the Tab order and shows the reason when you point at it, reach it with Tab, press it or tap it, and a screen reader reads the reason with it. A press does nothing until the reason is gone.

Why: A grey Save with no word sends a person hunting through the form for what is missing, or to support; the reason turns a dead end into the next step.

Held by the library by itself.
Where: [Button](https://grani.arseni.work/components/button), [Icon button](https://grani.arseni.work/components/icon-button), [Copy button](https://grani.arseni.work/components/copy-button).
Tests: 18, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#off-says-why

## Know what was refused and why

If something cannot be added, a message names it and says why, and a screen reader announces it at once. A dropzone names up to three files for each reason and counts the rest, for example “a.png, b.png, c.png and 2 more: unsupported file type.”, a sentence per reason. A list field keeps the refused text in the field to be corrected, and adds the valid entries typed or pasted with it.

Why: You know what to fix or leave out before you try again, and you correct a refused entry instead of typing it again.

Held by the library by itself.
Where: [Dropzone](https://grani.arseni.work/components/dropzone), [List field](https://grani.arseni.work/components/list-field).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#refused-by-name

## Submit the values shown in the form

The form sends the values you can see and review. Give each control a `name` to include it in a native form submission or `FormData`. Unchecked boxes, off switches, an empty select and disabled controls send nothing. An empty text field, a date picker with no day and a time picker with no time send an empty value. Resetting the form restores the app’s current values, so the app must clear those values to empty the form.

Why: The submitted values agree with the visible fields, and developers do not have to maintain a second set of hidden inputs themselves.

Held by the library by itself.
Where: [Date picker](https://grani.arseni.work/components/date-picker), [Input](https://grani.arseni.work/components/input), [Time picker](https://grani.arseni.work/components/time-picker), [Textarea](https://grani.arseni.work/components/textarea), [Switch](https://grani.arseni.work/components/switch), [Select](https://grani.arseni.work/components/select), [Scale input](https://grani.arseni.work/components/scale-input), [Radio group](https://grani.arseni.work/components/radio-group), [Password field](https://grani.arseni.work/components/password-field), [Dropzone](https://grani.arseni.work/components/dropzone), [Code input](https://grani.arseni.work/components/code-input), [Checkbox](https://grani.arseni.work/components/checkbox), [Stepper](https://grani.arseni.work/components/stepper).
Tests: 27, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#sends-like-native

## Finish a word in any script before it is sent

Japanese, Chinese and Korean are typed through an input method: the reading first, then the word picked with Enter. Until the word is picked nothing is sent or chosen, and the Enter that picks it does not search, tick a row or add an entry.

Why: A search for half a word, or an entry added halfway through typing it, is a wrong answer for anyone who writes these languages every day.

Held by the library by itself.
Where: [Table toolbar](https://grani.arseni.work/components/table-toolbar), [Input](https://grani.arseni.work/components/input), [Select](https://grani.arseni.work/components/select), [Filter list](https://grani.arseni.work/components/filter-list), [List field](https://grani.arseni.work/components/list-field).
Tests: 10, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#word-as-composed

## Avoid adding the same entry twice

If you add something already in the list, the list keeps one copy and says so, for example “a.pdf: already in the list.” A file is the same when its name, size and date match; a typed or pasted name when it matches a whole name in the list in any capitalization, repeats within one paste included.

Why: Nobody gets a second copy by accident, and you see why nothing new was added instead of wondering or finding it twice later.

Held by the library by itself.
Where: [Dropzone](https://grani.arseni.work/components/dropzone), [List field](https://grani.arseni.work/components/list-field).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#no-twice

## Show the error where the hint was

The hint below a field and its error share the same place: when the value has an error, the explanation replaces the hint, and when the error clears, the hint returns. A screen reader announces the error and identifies the field as invalid.

Why: You find the correction where you were already reading the instructions, and the fields below do not move to make room for a second message. A longer error can still increase the field’s height.

Held by the library by itself.
Where: [Field](https://grani.arseni.work/components/field), [List item](https://grani.arseni.work/components/list-item).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#error-takes-the-hints-place

## Leave invalid date values empty instead of guessing

If the app supplies an impossible date, such as 2026-13-40, the field shows its placeholder instead of converting it into another date. It has no clear button, and the form sends an empty value for it.

Why: An invalid value never silently becomes a day nobody selected.

Held by the library by itself.
Where: [Date picker](https://grani.arseni.work/components/date-picker).
Tests: 1, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#unreadable-is-none

## Respect date limits without losing a value

You can see which dates and times are available before choosing: values outside the allowed range stay visible but cannot be picked. A previously saved value outside the range is kept and marked invalid, so you can review and correct it. Calendar navigation respects the allowed range, but still lets you navigate back if the selected date is outside it.

Why: A previously saved value is not silently erased or replaced when the range changes: you can see what needs correcting and navigate back to an available date or time.

Held by the library by itself.
Where: [Time picker](https://grani.arseni.work/components/time-picker), [Calendar](https://grani.arseni.work/components/calendar), [Date picker](https://grani.arseni.work/components/date-picker).
Tests: 10, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#limit-shown

## Keep the end of a period after its start

Two date fields, from and to: the days before the start cannot be picked as the end. If the start is moved past an end already chosen, the end keeps its day and shows an error instead of changing by itself.

Why: A period that ends before it starts never reaches the report, and a day you chose is never changed behind your back.

Held by the library by itself.
Where: [Date picker](https://grani.arseni.work/components/date-picker).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#end-after-start

## See a date range before you pick its end

After the first day of a range, the calendar draws the range to the day under the pointer or the keyboard focus and says how many days it covers, such as “7 days”. Nothing is applied until you pick the last day.

Why: A week that came out eight days long, or a period one day short, is caught while you are still choosing it, not after the report has changed.

Held by the library by itself.
Where: [Calendar](https://grani.arseni.work/components/calendar), [Date range](https://grani.arseni.work/components/date-range).
Tests: 6, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#span-seen-first

## See which days are the weekend

The calendar names the days of rest in bold in its header, as the app’s language and region count them: Saturday and Sunday in most places, Friday and Saturday in Israel or Saudi Arabia. A due date put on a day off is seen by its column before it is picked.

Why: A deadline or a delivery set on a day when nobody works is caught while you choose it, not on the day itself.

Held by the library by itself.
Where: [Calendar](https://grani.arseni.work/components/calendar), [Date picker](https://grani.arseni.work/components/date-picker), [Date range](https://grani.arseni.work/components/date-range).
Tests: 7, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#weekend-shown

## See the day of the week beside a date

A date field shows the day of the week with the date, “Thu, Sep 24”, the year added when it is not this one, and a column of dates can carry it under each date. A due date put on a Saturday, or a day picked one off, is seen at a glance.

Why: People plan by days of the week: a meeting on the wrong Thursday or a deadline on a Sunday is caught before it is kept.

Held by the library by itself.
Where: [Date picker](https://grani.arseni.work/components/date-picker), `UiDateCell`.
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#weekday-said

## Save the day you picked, in any time zone

A date field holds and sends the day itself, `2026-10-24`, not a moment at midnight. A server or a colleague in another time zone reads the same 24th, so a date of birth or a due date never slips to the day before.

Why: A day kept as midnight in Moscow is already the 23rd on a server that runs in UTC: a birthday or a deadline moves by a day, and nobody notices until it matters.

Held by the library by itself.
Where: [Date picker](https://grani.arseni.work/components/date-picker), [Calendar](https://grani.arseni.work/components/calendar), [Date range](https://grani.arseni.work/components/date-range), `UiDateCell`.
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#day-stays-day

## Make small changes without losing decimal precision

The arrows adjust a price or measurement at the precision you entered. With a step of 0.1, 10.44 changes to 10.45 or 10.43, because its last decimal place is finer than the step. Results are rounded to that precision, so 0.2 plus 0.1 becomes 0.3 rather than a long string of digits.

Why: A small adjustment preserves the decimal places you entered without adding rounding digits to the result.

Held by the library by itself.
Where: [Input](https://grani.arseni.work/components/input).
Tests: 1, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#cent-stays-cent

## Enter numbers in the app’s local format

You type or paste a number the way your language writes it: “1 234,50” in Russian and “1,234.50” in English are both 1234.50. If the field cannot interpret a value unambiguously, it keeps the text as written for you to correct, and marks it invalid when you leave the field.

Why: You can enter numbers in the format you are used to, without removing separators by hand. An ambiguous number waits for your correction instead of being saved as the wrong amount.

Held by the library by itself.
Where: [Input](https://grani.arseni.work/components/input), [Stepper](https://grani.arseni.work/components/stepper).
Tests: 11, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#number-as-written

## Type a date or a time as your language writes it

Type `12.03.1987` in Russian or `03/12/1987` in American English, or the digits alone, and the date field reads the parts in the order your language writes them. Type `14:30`, `1430` or `2:30p`, and the time field reads it the same way. As you type, the calendar or the column jumps to what was read, and Enter takes it. A day or a time that does not exist is not taken, and never guessed.

Why: A date from a passport or a time from an invoice goes in at typing speed, instead of twelve years of paging back or scrolling through the hours, and you see how the field read it before it is kept.

Held by the library by itself.
Where: [Date picker](https://grani.arseni.work/components/date-picker), [Time picker](https://grani.arseni.work/components/time-picker).
Tests: 21, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#date-as-written

## Let the app check a code as soon as it is complete

When you type, paste or autofill the last character, the field tells the app that the code is complete, so the app can check it without a separate button. A code the app puts in the field itself, such as a restored draft, is not reported as completed, and input that leaves the code unchanged is not reported again.

Why: You can finish entering the code and the app can check it immediately, with no separate button to press. A restored draft is not sent for checking automatically.

Held by the library by itself.
Where: [Code input](https://grani.arseni.work/components/code-input).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#complete-once

## Go straight to the field that needs fixing

If a form cannot be submitted because a field has an error, focus moves to the first field you can correct, and the page scrolls enough to show it. UiModal with `form` and UiCrudDrawer do this by themselves when the app marks the field as the submit is checked, and again when `submitting` falls on an answer that marked one, unless you are typing in another field. Any error in a custom form is focused by the app calling `focusInvalid`.

Why: You can correct the problem immediately, even in a long form where the error was off screen, instead of pressing Save again or searching for the highlighted field.

Held by the library by itself.
Where: [Modal](https://grani.arseni.work/components/modal), [Checkbox](https://grani.arseni.work/components/checkbox), [Time picker](https://grani.arseni.work/components/time-picker), [Textarea](https://grani.arseni.work/components/textarea), [Switch](https://grani.arseni.work/components/switch), [Select](https://grani.arseni.work/components/select), [Scale input](https://grani.arseni.work/components/scale-input), [Radio group](https://grani.arseni.work/components/radio-group), [List field](https://grani.arseni.work/components/list-field), [Input](https://grani.arseni.work/components/input), [Field](https://grani.arseni.work/components/field), [Dropzone](https://grani.arseni.work/components/dropzone), [Code input](https://grani.arseni.work/components/code-input), [Stepper](https://grani.arseni.work/components/stepper), [List item](https://grani.arseni.work/components/list-item), [Crud drawer](https://grani.arseni.work/components/crud-drawer).
Tests: 20, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#focus-invalid

## Name states in words, not color alone

You can identify a status without its color: a badge says “Paid” or “Overdue”, a scale shows its numbers, and a screen reader announces whether a change is better or worse. Color reinforces the meaning. A badge without text triggers a development warning.

Why: The state stays readable for people who do not tell colors apart, in grayscale, and with a screen reader.

Held by the library by itself.
Where: [Badge](https://grani.arseni.work/components/badge), [Delta](https://grani.arseni.work/components/delta), [Scale input](https://grani.arseni.work/components/scale-input), [Link](https://grani.arseni.work/components/link), [List item](https://grani.arseni.work/components/list-item).
Tests: 8, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#level-not-by-colour

## Know what fits when a list has a limit

When a list allows only so many entries, what fits is added and a message says what was left out, for example “c.pdf: up to 2 files.” A list field that is full replaces its field with a message that explains the limit, and if the field had focus, focus moves to that message.

Why: You can tell why adding stopped and how much of a pasted list or a drop was accepted.

Held by the library by itself.
Where: [List field](https://grani.arseni.work/components/list-field), [Dropzone](https://grani.arseni.work/components/dropzone).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#nearly-full

## Toggle or pick by clicking the words

A click on the text of a checkbox, a switch or a radio works as a click on its box does. In a setting row, a click anywhere on the row, its title and description included, toggles its switch. Options shown as cards are picked by a click anywhere on the card: on its words, its image or its details, such as a price.

Why: The words give a much larger target than the small box, switch or radio.

Held by the library by itself.
Where: [Switch](https://grani.arseni.work/components/switch), [List item](https://grani.arseni.work/components/list-item), [Radio group](https://grani.arseni.work/components/radio-group), [Checkbox](https://grani.arseni.work/components/checkbox).
Tests: 5, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#label-is-target

## Drop files anywhere on the upload card

You can drop files anywhere on the upload card, including over files already listed. While the dropzone is on the page, a file dropped outside any drop target does not open in the browser tab. Other file inputs and drop targets still handle their own drops.

Why: A drop that misses by a few pixels does not replace the page and the form you were filling in.

Held by the library by itself.
Where: [Dropzone](https://grani.arseni.work/components/dropzone).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#whole-zone-is-target

## Clear a field and enter its replacement immediately

Press a field’s × and enter the replacement immediately, without clicking back into the field: clearing moves keyboard focus to the field, whether you use the mouse or the keyboard.

Why: The × disappears once the field is empty; without this, keyboard focus would be lost with it, and you would have to find the field again.

Held by the library by itself.
Where: [Time picker](https://grani.arseni.work/components/time-picker), [Select](https://grani.arseni.work/components/select), [List field](https://grani.arseni.work/components/list-field), [Input](https://grani.arseni.work/components/input), [Date picker](https://grani.arseni.work/components/date-picker).
Tests: 6, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#cleared-in-place

## See the password you generate

Generate a password to see it in plain text and copy it before saving. Clearing the field turns password hiding back on, so the next password you type is hidden.

Why: You never save a password you have not seen and could not type again on another device.

Held by the library by itself.
Where: [Password field](https://grani.arseni.work/components/password-field).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#made-is-seen

## Generate a password instead of inventing one

Press Generate to get a random password, 16 characters long by default, with an uppercase letter, a lowercase letter, a digit and a symbol. The app must still check any other requirements of its password policy.

Why: You get a ready-made password without inventing one or assembling the required character types yourself.

Held by the library by itself.
Where: [Password field](https://grani.arseni.work/components/password-field).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#strong-on-offer

## Show a password without leaving the field

Click the password visibility button to check what you typed, then continue editing immediately. Showing or hiding the characters keeps focus in the field and preserves the text cursor’s position.

Why: You can check what you typed and correct it at once, without clicking back into the field and finding your place.

Held by the library by itself.
Where: [Input](https://grani.arseni.work/components/input).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#eye-keeps-field

## Take back a scale answer

Click the selected value again, or press Delete or Backspace, to clear the answer to `null`. Space and Enter select an answer and never clear it. With `clearable` turned off, an answer cannot be cleared once given.

Why: You can withdraw an answer given by mistake, or one that no longer applies, instead of being forced to leave some value.

Held by the library by itself.
Where: [Scale input](https://grani.arseni.work/components/scale-input).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#mark-taken-back

## Know how to add files from a folder

If you drop a folder, a message tells you how to continue: “photos: folders are not accepted; drop the files inside.” Files dropped alongside the folder are processed separately and are added if they meet the file requirements.

Why: You get a next step you can take, instead of a refusal with no reason or an empty file in the list.

Held by the library by itself.
Where: [Dropzone](https://grani.arseni.work/components/dropzone).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#folder-refused

## Type, paste or autofill a code

Enter a code whichever way you have it: type it, paste it, or accept the browser’s autofill from a message where available. The cells share one input, so a complete code fills them at once. Pasted text keeps only the allowed characters and is cut to the code’s length.

Why: You use the code you already have without copying it one character at a time.

Held by the library by itself.
Where: [Code input](https://grani.arseni.work/components/code-input).
Tests: 1, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#code-any-way

## Show where the next code character goes

As you type a code, the cell for the next character is highlighted; on a full code, the last cell is. Backspace removes the last character, and the highlight moves back.

Why: You see where the next character goes and can enter the whole code without clicking between cells.

Held by the library by itself.
Where: [Code input](https://grani.arseni.work/components/code-input).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#code-moves-on

## Keep only the characters a code allows

Whatever you type or paste, the field keeps the allowed characters, removes the rest and cuts the result to the code’s length. A value supplied by the app, such as a restored draft, follows the same rules.

Why: A stray space or letter never remains in a numeric code. The app still needs to check whether the code itself is correct.

Held by the library by itself.
Where: [Code input](https://grani.arseni.work/components/code-input).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#code-refuses-wrong-kind

## Pick with Enter without sending the form

In a select, a filter or a calendar inside a form, Enter chooses the highlighted option or day and does not submit the form. The form is submitted only when you choose to submit it.

Why: Choosing a value from the keyboard does not send a half-filled form.

Held by the library by itself.
Where: [Select](https://grani.arseni.work/components/select), [List field](https://grani.arseni.work/components/list-field), [Filter list](https://grani.arseni.work/components/filter-list), [Filter](https://grani.arseni.work/components/filter), [Calendar](https://grani.arseni.work/components/calendar).
Tests: 8, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#enter-picks

## Submit a form with Enter

Enter in a single-line field submits a modal or drawer form, when submission is available. A quick second Enter, or one pressed while the app marks the save as running, does not submit again. The app validates and saves the submitted values.

Why: You can submit a completed form without moving to Save, and repeated presses while it is busy do not start another submission.

Held by the library by itself.
Where: [Modal](https://grani.arseni.work/components/modal), [Crud drawer](https://grani.arseni.work/components/crud-drawer).
Tests: 5, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#enter-saves

## Submit from a text box with Ctrl or Cmd+Enter

Send a modal or drawer form from a multiline text field with Ctrl+Enter or Cmd+Enter. Enter on its own still inserts a line break. The shortcut activates the submit button, so it is unavailable while that button is disabled or loading.

Why: You can write several lines and send them without reaching for the mouse.

Held by the library by itself.
Where: [Modal](https://grani.arseni.work/components/modal), [Crud drawer](https://grani.arseni.work/components/crud-drawer).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#meta-enter-saves

## Change a number with the arrow keys

ArrowUp increases a number and ArrowDown decreases it, without retyping and without moving the text cursor. Changes follow the configured step while preserving finer decimal precision when the value has it. The arrows stop at the minimum and maximum, but typed values still need validation. On a scale, the arrow keys change the answer, and Home and End reach the endpoints.

Why: You can make small changes without the mouse and without typing the number again.

Held by the library by itself.
Where: [Input](https://grani.arseni.work/components/input), [Stepper](https://grani.arseni.work/components/stepper), [Scale input](https://grani.arseni.work/components/scale-input).
Tests: 10, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#number-by-arrows

## Move by month or year from the keyboard

Page Up and Page Down move the calendar by a month, and with Shift by a year, so a distant date is a few key presses away. The day number is preserved where possible: moving back from May 31 goes to April 30, then March 31.

Why: A date months or years away is reached in a few key presses instead of one day at a time.

Held by the library by itself.
Where: [Calendar](https://grani.arseni.work/components/calendar).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#page-by-key

## Jump to a month from the heading

Press the calendar’s month heading to show all twelve months, change the year with the header arrows, and choose a month, without paging through every month in between. Escape returns to the day view.

Why: You can go directly to a month such as next September instead of pressing the next-month arrow repeatedly.

Held by the library by itself.
Where: [Calendar](https://grani.arseni.work/components/calendar).
Tests: 5, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#months-jump

## Remove selected tags with the keyboard

You can remove selected tags without the mouse: Tab reaches each tag’s remove button, and Enter or Space activates it. In a closed multi-select, Backspace removes the last visible tag. After a removal, keyboard focus moves to the next tag, or back to the field when no tag remains.

Why: You can correct a selection without switching to the mouse, and Backspace never removes a value you cannot see.

Held by the library by itself.
Where: [Select](https://grani.arseni.work/components/select), [Badge](https://grani.arseni.work/components/badge).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#tag-taken-back

## Pick a common date in one press

Choose a common date without opening the calendar. Buttons below the field can set Today, Yesterday, Tomorrow or another date relative to today, and the field shows the date a press set.

Why: When most entries fall on the same few days, you do not have to open the calendar for each one.

Held by the library by itself.
Where: [Date picker](https://grani.arseni.work/components/date-picker).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#common-days

## Pick range ends in either order

Choose the two ends of a date range in either order. The earlier date becomes the start and the later date the end. Your existing filter stays in effect until you have chosen both.

Why: You do not have to start over because you happened to press the later date first.

Held by the library by itself.
Where: [Date range](https://grani.arseni.work/components/date-range).
Tests: 1, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#either-order

## Paste a list to add several entries

Paste a column of values, such as email addresses, to add several entries at once. Each line goes the way a typed entry goes: spaces at the ends removed, the app’s cleanup applied, such as one capitalization for tags, then its check. Accepted lines are added together; duplicates are identified instead of being added again.

Why: You can reuse a list prepared elsewhere without entering each value on its own, and typed and pasted entries come out alike, so the list does not collect several spellings of one entry.

Held by the library by itself.
Where: [List field](https://grani.arseni.work/components/list-field).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#paste-many

## Keep keyboard focus where you are working

You can delete several rows without finding the Delete button after each one: when a row is removed, keyboard focus moves to the same button in the row that takes its place, so Enter deletes the next one. When a message, field or panel disappears while you are using it, focus moves to a control that remains.

Why: You can continue a sequence of actions from the keyboard without tabbing back into the list each time or switching to the mouse.

Held by the library by itself.
Where: [App shell](https://grani.arseni.work/components/app-shell), [Dropzone](https://grani.arseni.work/components/dropzone), [Reveal](https://grani.arseni.work/components/reveal), [Table](https://grani.arseni.work/components/table), [Copy button](https://grani.arseni.work/components/copy-button), [Filter list](https://grani.arseni.work/components/filter-list), [Toaster](https://grani.arseni.work/components/toaster), [List field](https://grani.arseni.work/components/list-field), [Input](https://grani.arseni.work/components/input).
Tests: 18, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#focus-stays

## Open a field from its label

Clicking a field’s label works as it does for a text field, where it puts the cursor in: it presses the control. A select opens its list and a dropzone its file dialog, so the label is as good a target as the field itself.

Why: The label is a larger target right above the field. A click on it reaches the field instead of doing nothing.

Held by the library by itself.
Where: [Field](https://grani.arseni.work/components/field).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#label-opens

## Name each field once for screen readers

A screen reader announces each field’s name once, followed by its hint or error. UiField connects those messages to the control they describe. Repeated text, such as a tooltip that matches an icon button’s name, is not announced twice.

Why: You can understand what a field asks for and how to correct it without guessing from a placeholder or listening to the same label twice.

Held by the library by itself.
Where: [Field](https://grani.arseni.work/components/field), [Time picker](https://grani.arseni.work/components/time-picker), [Textarea](https://grani.arseni.work/components/textarea), [Switch](https://grani.arseni.work/components/switch), [Select](https://grani.arseni.work/components/select), [Scale input](https://grani.arseni.work/components/scale-input), [Radio group](https://grani.arseni.work/components/radio-group), [List field](https://grani.arseni.work/components/list-field), [Password field](https://grani.arseni.work/components/password-field), [Button group](https://grani.arseni.work/components/button-group), [Icon button](https://grani.arseni.work/components/icon-button), [Tooltip](https://grani.arseni.work/components/tooltip), [Stepper](https://grani.arseni.work/components/stepper), [List item](https://grani.arseni.work/components/list-item).
Tests: 25, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#one-name-one-voice

## Announce required fields in words

A required field shows an asterisk and is announced as required, so you can identify it visually and with a screen reader. For a group, such as radio options or a scale, the requirement is announced once with the group’s label. The app still checks that an answer has been given.

Why: People who cannot see the asterisk still learn which answers they must give before they send the form.

Held by the library by itself.
Where: [Field](https://grani.arseni.work/components/field), [Scale input](https://grani.arseni.work/components/scale-input), [Radio group](https://grani.arseni.work/components/radio-group), [Input](https://grani.arseni.work/components/input), [Stepper](https://grani.arseni.work/components/stepper), [List item](https://grani.arseni.work/components/list-item).
Tests: 8, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#required-in-words

## Describe calendar marks in words

A screen reader announces each day’s full date and the meaning of its marks, such as “overdue” or “unavailable”, as well as which day is today and which days are outside the allowed range. The calendar’s colors and symbols are not the only way to learn a day’s state.

Why: Someone who cannot see the dots, the strike-through or the colors still learns that a day is overdue, taken or out of range before choosing it.

Held by the library by itself.
Where: [Calendar](https://grani.arseni.work/components/calendar).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#state-in-words

## Announce scale steps with their meaning

A screen reader announces both the position on a scale and what its endpoints mean. For example, a middle value is “7 of 10”, while the endpoints can be “1 of 10, easy” and “10 of 10, hard”.

Why: You can choose an answer knowing which end means easy or hard, even when you cannot see the labels below the scale.

Held by the library by itself.
Where: [Scale input](https://grani.arseni.work/components/scale-input).
Tests: 1, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/filling-in#mark-says-its-word
