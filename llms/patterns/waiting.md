# Loading and feedback: the patterns of grani-ui

Show progress, explain failures and confirm actions when needed.

Page: https://grani.arseni.work/patterns/waiting

## See whether an action worked

When an action ends, you can tell how it went: the content changes, a short message confirms it, or an error says what went wrong and what to do next. Messages and errors are announced by a screen reader too.

Why: You do not have to repeat an action, or check somewhere else, to find out whether it went through.

Held by the library by itself.
Where: [Toaster](https://grani.arseni.work/components/toaster), [Table](https://grani.arseni.work/components/table), [Log](https://grani.arseni.work/components/log), [List field](https://grani.arseni.work/components/list-field), [Password field](https://grani.arseni.work/components/password-field), [Dropzone](https://grani.arseni.work/components/dropzone), [Copy button](https://grani.arseni.work/components/copy-button), [Confirm](https://grani.arseni.work/components/confirm).
Tests: 13, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#answered

## Ignore extra presses while a request runs

After you press Send, a loading indicator shows that the request is running and further presses are ignored until it finishes. This prevents another click from starting the same action through that control. The app supplies the loading state unless the component manages the request itself.

Why: You do not need to press again to check whether the first click registered, and an impatient second press does not start an extra request through the busy control.

Held by the library by itself.
Where: [Button](https://grani.arseni.work/components/button), [Icon button](https://grani.arseni.work/components/icon-button), [Pagination](https://grani.arseni.work/components/pagination), [Table](https://grani.arseni.work/components/table), [Log](https://grani.arseni.work/components/log), [List field](https://grani.arseni.work/components/list-field), [Dropzone](https://grani.arseni.work/components/dropzone), [Confirm](https://grani.arseni.work/components/confirm), [Menu](https://grani.arseni.work/components/menu), [Toaster](https://grani.arseni.work/components/toaster), [List item](https://grani.arseni.work/components/list-item), [Badge](https://grani.arseni.work/components/badge).
Tests: 24, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#one-press

## Confirm only what cannot be undone

Ask for confirmation only before an action that cannot be undone, and name the action on its button. A change the app can reverse happens immediately, with Undo offered for a limited time in a notification. The app handles the reversal; the notification provides the action that triggers it.

Why: A question asked rarely gets read, so the one that matters is noticed. A reversible change is corrected with Undo instead of a question before every routine action.

Held by the library by itself.
Where: [Toaster](https://grani.arseni.work/components/toaster), [Confirm](https://grani.arseni.work/components/confirm).
Tests: 9, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#ask-what-stays

## See the value the app actually accepted

A field always shows the value the app holds, so you can tell whether an edit took effect. If the app rejects a change, the field returns to that value: a switch cannot stay on while its setting is still off. A form reset also restores the app’s current value, which is not necessarily the value saved on the server.

Why: You see at once that a change did not take effect, instead of finding out later that the screen and the app disagree.

Held by the library by itself.
Where: [Textarea](https://grani.arseni.work/components/textarea), [Switch](https://grani.arseni.work/components/switch), [Checkbox](https://grani.arseni.work/components/checkbox), [Radio group](https://grani.arseni.work/components/radio-group), [Stepper](https://grani.arseni.work/components/stepper), [Time picker](https://grani.arseni.work/components/time-picker), [Select](https://grani.arseni.work/components/select), [Scale input](https://grani.arseni.work/components/scale-input), [List field](https://grani.arseni.work/components/list-field), [Password field](https://grani.arseni.work/components/password-field), [Input](https://grani.arseni.work/components/input), [Dropzone](https://grani.arseni.work/components/dropzone), [Code input](https://grani.arseni.work/components/code-input).
Tests: 14, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#refused-goes-back

## Keep the chart when a refresh fails

If a chart refresh fails, the previous chart stays on screen, and “Not updated” with Retry makes clear that new data did not arrive. A table behaves differently: a failed load replaces its rows with the error and Retry.

Why: The figures you were reading stay available, with a clear sign that they are not current.

Held by the library by itself.
Where: [Chart card](https://grani.arseni.work/components/chart-card).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#kept-on-fail

## See upload progress and when it ends

While files upload, you can see how far the upload has gone and when it is done. The file list cannot be changed during the upload. When the upload ends at 100%, each file gets a check mark and a screen reader announces the result, such as “2 files uploaded”. If it fails, the files left behind say why and offer Retry. The app supplies the progress and any failure; the dropzone shows them.

Why: You can tell that the upload has started, which files are still on their way and when you can move on, instead of guessing from a single spinner.

Held by the library by itself.
Where: [Dropzone](https://grani.arseni.work/components/dropzone), [Progress](https://grani.arseni.work/components/progress).
Tests: 8, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#upload-shown

## See where the app is working

Progress appears where you expect the result. A busy button shows a spinner. A first load shows placeholders shaped like the coming content. A refresh keeps the existing content visible and dimmed, announces “Updating…”, and in a card adds one spinner over the content. A page whose layout is not yet known may show a single spinner in its center.

Why: You can distinguish loading from an empty result or an ignored click, without pressing again to find out.

Held by the library by itself.
Where: [Spinner](https://grani.arseni.work/components/spinner), [Progress](https://grani.arseni.work/components/progress), [Card](https://grani.arseni.work/components/card), [Filter list](https://grani.arseni.work/components/filter-list), [Filter](https://grani.arseni.work/components/filter), [Badge](https://grani.arseni.work/components/badge), [Skeleton](https://grani.arseni.work/components/skeleton).
Tests: 12, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#visible-work

## Keep nearby content in place while loading

You can keep reading, or reach for a button, while nearby content loads. Placeholders reserve space for the expected content, media keeps its space before it arrives, and a refresh keeps the existing content in place. The final result can still shift the layout once if its size differs from the reserved space.

Why: A button that shifts under the pointer is easy to miss, and a page that keeps changing shape makes you look for your reading position again.

Held by the library by itself.
Where: [App shell](https://grani.arseni.work/components/app-shell), [Button](https://grani.arseni.work/components/button), [Aspect ratio](https://grani.arseni.work/components/aspect-ratio), [Card](https://grani.arseni.work/components/card), [Skeleton](https://grani.arseni.work/components/skeleton), [Table](https://grani.arseni.work/components/table), [Avatar](https://grani.arseni.work/components/avatar), [Chart card](https://grani.arseni.work/components/chart-card), [Data table](https://grani.arseni.work/components/data-table), [Select](https://grani.arseni.work/components/select), [Log](https://grani.arseni.work/components/log), [Crud drawer](https://grani.arseni.work/components/crud-drawer).
Tests: 21, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#no-jolt

## Search while the table stays in place

You can keep typing while the table loads your search. Placeholder rows immediately replace the previous results, preserving their space and at least the height of an empty or error message. Sorting or paging within the same search keeps the existing rows visible and dimmed. Keyboard focus and your text stay in the search field throughout.

Why: The table does not collapse with every letter, and old results are not mistaken for the answer to the new query. Its height may change once, when the new result arrives.

Held by the library by itself.
Where: [Data table](https://grani.arseni.work/components/data-table), [Table](https://grani.arseni.work/components/table).
Tests: 8, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#still-list

## Keep reading as older events load

Older events are appended below the ones already shown, so loading more history does not send you back to the top. If “Load older events” had keyboard focus and disappears because no older events remain, focus moves to the first new event, and a screen reader announces how many arrived.

Why: You can continue from the newly loaded events instead of finding where you left off after the loading button disappears.

Held by the library by itself.
Where: [Log](https://grani.arseni.work/components/log).
Tests: 1, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#keep-place

## Keep counts short and in place

A count stays short: above the configured maximum, it is shortened to a value such as 99+, so it never grows past that. A value that is not a number is hidden, and a negative one counts as 0. An attention indicator disappears at zero; a total beside a label can still show 0.

Why: You can tell what needs attention without oversized counts, meaningless “NaN” values or a notification marker showing zero.

Held by the library by itself.
Where: [Indicator](https://grani.arseni.work/components/indicator), [Count](https://grani.arseni.work/components/count), [Tabs](https://grani.arseni.work/components/tabs).
Tests: 12, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#compact-counts

## Keep turning pages from the keyboard

You can keep paging from the keyboard without finding Next again after every load: the arrow you pressed keeps keyboard focus while the page loads. When that arrow reaches the end and becomes disabled, focus moves to the current page number or the compact page label. In a calendar, a month arrow that reaches its limit passes focus to the month heading, and a period’s arrow to the period button.

Why: You can read a long list, or step through months, without returning to the mouse after every step.

Held by the library by itself.
Where: [Pagination](https://grani.arseni.work/components/pagination), [Calendar](https://grani.arseni.work/components/calendar), [Date range](https://grani.arseni.work/components/date-range).
Tests: 6, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#pager-keeps-focus

## Announce a new password without reading it

When a generated password is accepted by the app, a screen reader confirms “New password generated” without reading the password itself. Generate another one and the confirmation is announced again.

Why: You get confirmation that generation worked without the password being read out where others can hear it.

Held by the library by itself.
Where: [Password field](https://grani.arseni.work/components/password-field).
Tests: 1, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#made-is-not-spoken

## Reduce motion without hiding loading

With the system’s reduced-motion setting enabled, sections open without sliding and attention indicators stop pulsing. Loading indicators keep moving, more slowly: spinners still turn and placeholders still shimmer.

Why: Decorative movement is removed, but you can still see that loading is in progress.

Held by the library by itself.
Where: [Reveal](https://grani.arseni.work/components/reveal), [Spinner](https://grani.arseni.work/components/spinner), [Indicator](https://grani.arseni.work/components/indicator), [Progress](https://grani.arseni.work/components/progress), [Skeleton](https://grani.arseni.work/components/skeleton).
Tests: 5, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/waiting#calm-motion
