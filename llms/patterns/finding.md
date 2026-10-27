# Search and selection: the patterns of grani-ui

Find options, filter rows and navigate long lists.

Page: https://grani.arseni.work/patterns/finding

## Results match the current search

In a select, a slow response to an older query cannot replace the results for newer text, and the option you chose keeps its name while the results change. In a table toolbar, a search value the app applies late cannot overwrite newer typing or undo a clear. Either way, an old response never changes what you are currently searching for.

Why: You can keep searching without a slow response restoring text or results from a question you have already moved past.

Held by the library by itself.
Where: [Select](https://grani.arseni.work/components/select), [Table toolbar](https://grani.arseni.work/components/table-toolbar).
Tests: 5, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#late-dropped

## Start a new search on the first page

When you type a new search, sort by another column or change a filter, the table asks for page one, so the new results are read from their start. The pager marks page one as the current page.

Why: Staying on page 4 of a new search shows the middle of its results, or an empty page that reads as no results, while the first matches wait on page one.

Held by the library by itself.
Where: [Data table](https://grani.arseni.work/components/data-table), [Pagination](https://grani.arseni.work/components/pagination).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#search-from-page-one

## Give every empty list a way forward

An empty area explains what happened: there are no records yet, nothing matches the current search or filters, or loading failed, and it never leaves you at a dead end. It offers the next step it can, such as Clear search, Reset filters, Retry or Show all, and beside it a step of the app, such as creating what you searched for or adding the first record.

Why: You can decide what to do next instead of guessing whether to wait, change a filter or reload the page.

Held by the library by itself.
Where: [No data](https://grani.arseni.work/components/no-data), [Data table](https://grani.arseni.work/components/data-table), [List field](https://grani.arseni.work/components/list-field), [Chart card](https://grani.arseni.work/components/chart-card), [Table](https://grani.arseni.work/components/table), [Log](https://grani.arseni.work/components/log).
Tests: 14, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#empty-next-step

## Count the last day of a period whole

A period from the 1st to the 31st takes in everything on the 31st, up to midnight by the app’s clock. The filter hands the app the moments its period covers, from midnight of the first day to midnight after the last, so a query never stops where the last day begins or at the server’s midnight.

Why: A report for October that quietly leaves out the invoices of the 31st, or moves its edges by the server’s time zone, gives a wrong total that nobody checks.

Held by the library by itself.
Where: [Date range](https://grani.arseni.work/components/date-range).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#last-day-whole

## Keep “Last month” and “Today” up to date

A saved period keeps the meaning of its name: opening a Last month link in October shows September. Named periods are recalculated when the page opens and when the day changes. Date-picker presets such as Today update within a minute of midnight. A custom range keeps the exact dates you chose.

Why: A saved view or a shared link keeps meaning what its name says, so you do not read an old month’s figures as the latest ones.

Held by the library by itself.
Where: [Date range](https://grani.arseni.work/components/date-range), [Date picker](https://grani.arseni.work/components/date-picker).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#named-period-rolls

## Keep a reset from restoring the old search

After Reset filters, a saved view or Back changes the search, the field shows that new value immediately. Any earlier typing still waiting for the search delay is discarded, so it cannot reapply the old filter a moment later.

Why: You can trust that a reset or saved view will stay in effect instead of changing again because of text entered before it.

Held by the library by itself.
Where: [Table toolbar](https://grani.arseni.work/components/table-toolbar).
Tests: 1, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#outside-wins

## Keep Reset in one place

Reset stays in the footer of filter and column panels. It becomes available when there is something to reset, without appearing as a new row or moving the options you are selecting.

Why: You can tick several boxes in a row without a click landing on a row that was pushed into its place.

Held by the library by itself.
Where: [Filter](https://grani.arseni.work/components/filter), [Table columns](https://grani.arseni.work/components/table-columns).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#reset-held

## Clear a search in one step

Clear a search with × or Escape and start typing another term immediately. Focus stays in the field. Inside a panel, the first Escape clears nonempty text without closing the panel; another Escape can then close it.

Why: You can try one term after another without selecting and deleting the old text, or reopening a panel that Escape closed.

Held by the library by itself.
Where: [Filter](https://grani.arseni.work/components/filter), [Table columns](https://grani.arseni.work/components/table-columns), [List field](https://grani.arseni.work/components/list-field), [Table toolbar](https://grani.arseni.work/components/table-toolbar), [Filter list](https://grani.arseni.work/components/filter-list), [Select](https://grani.arseni.work/components/select), [Input](https://grani.arseni.work/components/input).
Tests: 13, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#search-clears

## Find what you chose at the top of a long filter

From six options, a filter opens with the options you already chose at the top, in their own order. The order stays while the panel is open, so a tick never moves a row under the pointer.

Why: In a long list you see and change your choice at once, instead of scrolling to find the ticks.

Held by the library by itself.
Where: [Filter](https://grani.arseni.work/components/filter), [Table columns](https://grani.arseni.work/components/table-columns), [Filter list](https://grani.arseni.work/components/filter-list).
Tests: 5, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#chosen-first

## Keep nearby buttons and fields in place

Controls keep their width as their values change, so nearby controls stay in place. Filters, date fields, selects, steppers and period buttons reserve room for their widest content, and the segments of a switcher such as Day, Week, Month keep one width whichever is selected. A custom date range may still widen its button if it is wider than every named period.

Why: When you make several choices in a row, the next button stays where you expect it, so a click meant for it does not land on another one.

Held by the library by itself.
Where: [Filter](https://grani.arseni.work/components/filter), [Date picker](https://grani.arseni.work/components/date-picker), [Radio group](https://grani.arseni.work/components/radio-group), [Stepper](https://grani.arseni.work/components/stepper), [Select](https://grani.arseni.work/components/select), [Date range](https://grani.arseni.work/components/date-range).
Tests: 9, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#steady-width

## Keep the page arrows under the pointer

You can click Next repeatedly without moving the mouse. When there are more pages than fit, the number of page slots stays constant, and each slot is as wide as the largest page number. The compact label, such as “3 / 20”, also keeps a steady width.

Why: Without it, a quick second click can land on a page number that moved into the arrow’s place and open a page you did not ask for.

Held by the library by itself.
Where: [Pagination](https://grani.arseni.work/components/pagination).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#pager-holds-still

## Keep at least one column visible

The column menu keeps at least one column visible. Once only one remains, its checkbox is disabled and marked “Last one”. If an older saved preference would hide every column, the first column is shown instead.

Why: You can still identify the records in the table instead of seeing empty rows that look like a loading failure.

Held by the library by itself.
Where: [Table columns](https://grani.arseni.work/components/table-columns).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#last-column-stays

## See that a row goes on past its edge

When columns or tabs do not fit, the side with more past it is marked, and with a mouse an arrow there pages to the rest: a table shades the edge where its columns slide under the row actions, tabs fade theirs. A wide table scrolls from the keyboard too, and keeps the actions of its rows in view at the end.

Why: A table cut at the screen’s edge reads as complete, and the column you need, or the actions of a row, stay out of sight.

Held by the library by itself.
Where: [Table](https://grani.arseni.work/components/table), [Tabs](https://grani.arseni.work/components/tabs).
Tests: 12, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#edge-says-more

## See how the rows are sorted

Press a sortable column heading to sort by it, press again for the opposite direction, and a third time to clear the sort. An arrow shows the current direction, and a screen reader can announce it. The app applies the requested order to the rows.

Why: You know which column orders the rows, and which way, before you read them, instead of comparing rows to guess.

Held by the library by itself.
Where: [Table](https://grani.arseni.work/components/table).
Tests: 1, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#sort-says

## Compare numbers in aligned columns

You can compare amounts or counts by scanning down the column: the numbers are right-aligned in equal-width digits, so matching decimal places line up when the values share the same format and precision.

Why: You can spot the largest amount or an odd one out by scanning the column, without reading each number.

Held by the library by itself.
Where: [Table](https://grani.arseni.work/components/table), [Data table](https://grani.arseni.work/components/data-table).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#digits-line

## Read old and new values in full

See exactly what changed in a record, with the old and new values shown together. Long values wrap onto more lines so the differing characters remain visible. A single change appears on one line; several changes use a table.

Why: You can review the change without opening an older version, even when two long values differ only at the end.

Held by the library by itself.
Where: [Log](https://grani.arseni.work/components/log).
Tests: 1, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#was-and-became

## See when each event happened

Read a record’s history by day, with each event’s time shown beside it. When events use Date values, headings identify Today, Yesterday or a date, including the year for older events. Hover over a time to see the complete date and time in the app’s time zone.

Why: You can distinguish recent activity from older events and find out exactly when a change happened.

Held by the library by itself.
Where: [Log](https://grani.arseni.work/components/log).
Tests: 1, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#exact-time

## Read the full text when a label is shortened

When a name is too long for its place, it is cut to one line with an ellipsis, and hovering over it or tapping it shows the full text in a tooltip. The tooltip appears only while the text is really cut, and a screen reader always reads the full text. A number that must fit, such as the total in the middle of a donut chart, is shortened instead, and its full value stands in the legend and in the table a screen reader reads.

Why: You can distinguish names that begin alike without guessing what is hidden at the end.

Held by the library by itself.
Where: [Truncate](https://grani.arseni.work/components/truncate), [Select](https://grani.arseni.work/components/select), [Table](https://grani.arseni.work/components/table), [Bar chart](https://grani.arseni.work/components/bar-chart), [Donut chart](https://grani.arseni.work/components/donut-chart), [Copy button](https://grani.arseni.work/components/copy-button), [Badge](https://grani.arseni.work/components/badge).
Tests: 11, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#whole-text

## Notice when there are more options below

A long list shows five options and part of the sixth, so you can see there is more to scroll to. You scroll inside the list to reach the rest. The list is never taller than the available screen space.

Why: The partially visible row shows that the list continues, so you are less likely to miss an option below the edge.

Held by the library by itself.
Where: [Filter list](https://grani.arseni.work/components/filter-list), [Table columns](https://grani.arseni.work/components/table-columns), [Date range](https://grani.arseni.work/components/date-range), [Select](https://grani.arseni.work/components/select).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#five-rows

## Search once typing pauses

A search is sent after a 250 ms pause in typing, not on every letter. In the table toolbar, Enter sends it immediately. Text still being composed with an input method, such as Japanese input, is not sent until composition finishes. When the response arrives, a screen reader announces how many results were found.

Why: A word typed quickly produces one request instead of a request and a redraw for every letter.

Held by the library by itself.
Where: [Table toolbar](https://grani.arseni.work/components/table-toolbar), [Data table](https://grani.arseni.work/components/data-table), [Select](https://grani.arseni.work/components/select).
Tests: 9, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#typing-asks-once

## Jump to an option by letter

Find a known option by typing its first letter while the list has focus: G can take you to Germany. Repeat the letter to move to the next matching option. In a list with a search field, typing searches instead.

Why: When you already know the name, you do not have to press the Down arrow once for every option above it.

Held by the library by itself.
Where: [Menu](https://grani.arseni.work/components/menu), [Filter](https://grani.arseni.work/components/filter), [Filter list](https://grani.arseni.work/components/filter-list), [Table columns](https://grani.arseni.work/components/table-columns), [Select](https://grani.arseni.work/components/select).
Tests: 9, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#letter-jumps

## Keep one option and clear the rest in one press

The highlighted option of a filter offers Only, which keeps that option chosen and clears the others. From the keyboard, Alt+Enter does the same.

Why: Narrowing a list to one value takes one press instead of unticking every other box.

Held by the library by itself.
Where: [Filter](https://grani.arseni.work/components/filter), [Table columns](https://grani.arseni.work/components/table-columns), [Filter list](https://grani.arseni.work/components/filter-list).
Tests: 5, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/finding#only-this
