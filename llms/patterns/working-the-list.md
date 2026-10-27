# Working with records: the patterns of grani-ui

Select rows, apply actions and move between records.

Page: https://grani.arseni.work/patterns/working-the-list

## Land on a page with records after a delete

When you delete the last record on the last page and other pages remain, the table requests the previous page, so you continue with the remaining records instead of an empty page. If the current page no longer exists for another reason, the table waits for loading to finish and then requests the new last page. The app loads the page the table requests.

Why: You can go on through the remaining records without meeting an empty page that looks like an empty list.

Held by the library by itself.
Where: [Data table](https://grani.arseni.work/components/data-table), [Pagination](https://grani.arseni.work/components/pagination).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#last-page-lands

## Show missing data as a gap

A missing value appears as a gap in a chart and a dash in a table, never as zero. A line breaks where data is missing and resumes at the next value, a bar leaves a gap or a gray stub, and a cell shows “—”. A real zero keeps its own representation, so the two look different.

Why: A day with no data does not read as a day when nothing sold, so the chart does not show a fall that never happened.

Held by the library by itself.
Where: [Sparkline](https://grani.arseni.work/components/sparkline), [Table](https://grani.arseni.work/components/table), [Data table](https://grani.arseni.work/components/data-table), [Area chart](https://grani.arseni.work/components/area-chart), [Bar chart](https://grani.arseni.work/components/bar-chart).
Tests: 11, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#gap-not-zero

## Show when a reporting period is still incomplete

A month still in progress is marked as a partial result: its bar is hatched or its line segment dashed, and the chart labels it “in progress”. This lets you tell the figures collected so far from a completed month before comparing them.

Why: Half a month’s total looks much lower than a full month’s. The marker keeps that difference from being read as a decline.

Held by the library by itself.
Where: [Bar chart](https://grani.arseni.work/components/bar-chart), [Area chart](https://grani.arseni.work/components/area-chart).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#partial-not-drop

## Show a shrinking loss as an improvement

A balance that goes from −100 to −50 has improved, and it is shown that way: +50%, better. The percentage is calculated against the absolute value of the previous figure, so moving toward zero from a loss is shown as an increase.

Why: The sign and the assessment agree: a smaller loss reads as an improvement, not as a decline.

Held by the library by itself.
Where: [Delta](https://grani.arseni.work/components/delta).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#loss-shrinks

## Act on several selected rows at once

Select several records to reveal actions for the whole selection. A strip replaces the toolbar, states the count, such as “2 selected”, and offers the actions supplied by the app plus a way to clear the selection.

Why: You can apply one change to many records in one step, instead of repeating it row by row.

Held by the library by itself.
Where: [Data table](https://grani.arseni.work/components/data-table).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#bulk-action

## Edit a value in its row

Offer an editor within a table row for small changes such as a status or amount. Make Save, Cancel and any correction needed after an error clear, so the task can be completed without opening a separate form.

Why: You can correct one value and continue down the list without navigating into a full form and back.

Not built yet: until it is, the app does it.

## Show when only some are selected

See whether a selection is partial before acting on it. The select-all checkbox shows a dash when some items are selected, and a screen reader announces a mixed state. In a table, activating it selects all selectable rows on the current page; activating it when all are selected clears them.

Why: You can tell a partial selection from a full one, or from none, before you act on the selected rows.

Held by the library by itself.
Where: [Checkbox](https://grani.arseni.work/components/checkbox), [Table](https://grani.arseni.work/components/table).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#mixed-says-some

## Copy a whole value in one press

Copy an entire id or link with one press, even when only a shortened version is displayed. A brief check mark confirms a successful copy.

Why: You get the exact value without selecting it by hand, so no character is missed and no ellipsis is copied with it.

Held by the library by itself.
Where: [Copy button](https://grani.arseni.work/components/copy-button).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#copy-value

## Remember hidden columns in this browser

Hide unnecessary columns once and return to the same table layout on later visits in this browser. With the default browser storage, a change in another tab is also reflected here.

Why: You set a table up for your work once, instead of hiding the same columns on every visit.

Held by the library by itself.
Where: [Table columns](https://grani.arseni.work/components/table-columns).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#columns-remembered

## Return to the list where you were

Return from a record to the same part of the list. The app should restore the filters, page and scroll position so you can continue reviewing the rows you left.

Why: You can go through a list record by record without finding your place again after each one.

Held by the app that uses it.
Where: in the app's own screens; no component of the library holds it by itself.

## Find records by the details you remember

Search using a detail you remember, such as a phone number, email address, invoice number or client’s company. The app should search the relevant fields and related records, and explain which details its search accepts.

Why: You can find a record without remembering its exact title, and understand when a different search is needed.

Held by the app that uses it.
Where: in the app's own screens; no component of the library holds it by itself.

## Reload or share a list as you see it

The search, the filters, the sort and the page are written into the page’s address, so a reload, a link sent to a colleague or the browser’s Back opens the list as you saw it.

Why: A colleague can open the same query, and you can return to it later without setting the filters again. The matching records may change as the underlying data changes.

Held by the library by itself.
Where: [Data table](https://grani.arseni.work/components/data-table).
Tests: 8, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#list-link

## Share a link to the open tab

A link should open the same tab you were viewing and preserve that choice after a reload. The app enables this by storing the active tab in the page address and restoring it when the page opens.

Why: Someone who opens your link lands on the section you meant, not on the first tab.

Held by the app that uses it.
Where: [Tabs](https://grani.arseni.work/components/tabs).

## Open a record from a link

Give each record a direct link so someone with access can open it without searching. The app provides the address and loads the corresponding record.

Why: A link points to exactly one record, so nobody has to search for it or guess which of two similar records was meant.

Held by the app that uses it.
Where: in the app's own screens; no component of the library holds it by itself.

## Open the records behind a number

Make a count such as “12 overdue invoices” open the records it represents. The app applies the corresponding filters so you can inspect the records or act on them.

Why: You can check a number, or act on the records behind it, without rebuilding its filters by hand.

Held by the app that uses it.
Where: in the app's own screens; no component of the library holds it by itself.

## Open a related record inside the drawer

Explore related information without leaving the record you started from. A row with a chevron leads to the related view, which the app shows inside the same drawer as a level of its own. Back names the previous level and returns to it, with focus on the row that opened the related view.

Why: You can inspect related records and return to the original task without reopening its drawer or re-entering the draft kept at the previous level.

Held by the library by itself.
Where: [Crud drawer](https://grani.arseni.work/components/crud-drawer), [List item](https://grani.arseni.work/components/list-item).
Tests: 5, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#open-related

## Save filters you use often

Save a frequently used set of filters under a name, then choose that name to apply them again. The app stores and restores the view; the records it returns can change over time.

Why: A weekly query becomes one choice instead of several filters to rebuild, while preserving the same selection criteria.

Held by the app that uses it.
Where: in the app's own screens; no component of the library holds it by itself.

## Choose which records to export

Before exporting, offer a clear choice between the selected rows and all records matching the current search and filters, including records on other pages.

Why: The file holds the set you meant, and you do not have to delete stray records from it afterwards.

Not built yet: until it is, the app does it.

## Create a related record from the form

If a required related record is missing, offer a way to create it from the current form. For example, add a new client while preparing an invoice, then return to the invoice with its draft intact.

Why: You finish the record you started, instead of leaving the form, creating the missing record elsewhere and typing everything again.

Not built yet: until it is, the app does it.

## Start a new record with known values

When the current task already identifies a value, prefill it in the new record. For example, an invoice created from a client’s page can start with that client selected. The app supplies the known values and lets you review them before saving.

Why: You can review information the app already knows instead of re-entering it, reducing typing and accidental mistakes.

Held by the app that uses it.
Where: in the app's own screens; no component of the library holds it by itself.

## Start a record from a copy

For a record similar to an existing one, let the app copy reusable values into a new draft. Review and change that draft before saving it as a separate record.

Why: A record much like an existing one takes a few edits instead of every value typed again.

Held by the app that uses it.
Where: in the app's own screens; no component of the library holds it by itself.

## Keep your browser’s keyboard shortcuts

Shortcuts you know from the browser and the system keep working inside the controls. The arrow keys move through a calendar, a list, tabs or a number, but with Ctrl, Cmd or Alt held the key goes to the browser: Alt+Left still goes back a page, and Cmd+Up still moves the text cursor to the start of a field. Alt+Down opens a list, as it does on a native select.

Why: People who work from the keyboard use these shortcuts without thinking; a control that takes one over changes a number or a date instead, and the shortcut seems broken in that one place.

Held by the library by itself.
Where: [Input](https://grani.arseni.work/components/input), [List field](https://grani.arseni.work/components/list-field), [Calendar](https://grani.arseni.work/components/calendar), [Select](https://grani.arseni.work/components/select), [Tabs](https://grani.arseni.work/components/tabs), [Code input](https://grani.arseni.work/components/code-input), [Date picker](https://grani.arseni.work/components/date-picker), [Time picker](https://grani.arseni.work/components/time-picker), [Menu](https://grani.arseni.work/components/menu), [Scale input](https://grani.arseni.work/components/scale-input), [Area chart](https://grani.arseni.work/components/area-chart).
Tests: 16, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#shortcuts-kept

## Select or clear a range of rows

Select a group of neighboring rows without checking each one: check row 3, then hold Shift and check row 10, and rows 3 through 10 are selected. From the keyboard, Shift+Space on the checkbox does the same. Clearing a checkbox the same way clears the range.

Why: Two checkbox actions select a whole range, so preparing a bulk action does not take a click per row.

Held by the library by itself.
Where: [Table](https://grani.arseni.work/components/table), [Data table](https://grani.arseni.work/components/data-table).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#range-select

## Search by a pasted list of values

Provide a way to paste several values, such as order numbers from a spreadsheet, and use the accepted entries together as search or filter criteria.

Why: You can work with a prepared set of records without entering and checking each search value separately.

Not built yet: until it is, the app does it.

## Filter by a value in a cell

Use a value already visible in a table as the next filter. For example, offer an action on a client’s name to show that client’s records without retyping the name. The application must connect the action to its filtering behavior.

Why: The value in front of you is often the next thing to search by, and retyping it costs time and invites typos.

Not built yet: until it is, the app does it.

## Reach frequent actions from the keyboard

Use Ctrl+B or Cmd+B to collapse or expand the sidebar. Use F8 to reach the newest notification’s action, or its close button if it has no action; press F8 again to return. Press / to start a search in the list on the page. The shortcuts do not run while you are typing in a field or editor.

Why: You can reach a notification’s Undo before it disappears and use common navigation actions without moving to the mouse.

Held by the library by itself.
Where: [App shell](https://grani.arseni.work/components/app-shell), [Table toolbar](https://grani.arseni.work/components/table-toolbar), [Toaster](https://grani.arseni.work/components/toaster).
Tests: 15, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#keyboard-actions

## Reopen a recent record

Keep recently opened records easy to return to. The app should provide a short recent-records list so you can reopen one directly instead of searching again.

Why: You can pick up interrupted work without repeating the search that found the record.

Held by the app that uses it.
Where: in the app's own screens; no component of the library holds it by itself.

## Pin the records you use often

Let people pin records they use regularly and reopen them from a persistent list. The app manages the pins and the list they appear in.

Why: Records you come back to every day stay one step away, however long the lists around them grow.

Held by the app that uses it.
Where: in the app's own screens; no component of the library holds it by itself.

## Step through records in one drawer

Review successive records without closing the drawer. Previous record and Next record ask for the neighboring record of the current list while the drawer stays open. While there is unsaved input or a save is running, they refuse with a shake instead of leaving your input behind.

Why: You can go through a run of records, such as checking each new order, without closing and reopening the drawer for each one.

Held by the library by itself.
Where: [Crud drawer](https://grani.arseni.work/components/crud-drawer).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#walk-records

## Save and start the next record

Choose Save and add another to continue entering records in the same drawer. After a successful save, the app clears the form and keeps the drawer open. Focus moves to the first field, ready for the next entry. A failed save keeps the current input for correction or retry.

Why: You can enter a batch without reopening the form after every successful save.

Held by the library by itself.
Where: [Crud drawer](https://grani.arseni.work/components/crud-drawer).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#save-and-new

## Read every chart value from the keyboard

Tab to a chart, then use the arrow keys, Home and End to explore its values. A screen reader announces the selected point and its data. A separate data table is also available to screen readers, including values that would otherwise appear only in a hover tooltip.

Why: Someone on a keyboard or a screen reader gets the same numbers as someone with a mouse, not only the shape of the line.

Held by the library by itself.
Where: [Area chart](https://grani.arseni.work/components/area-chart), [Bar chart](https://grani.arseni.work/components/bar-chart), [Donut chart](https://grani.arseni.work/components/donut-chart).
Tests: 6, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/working-the-list#values-by-keys
