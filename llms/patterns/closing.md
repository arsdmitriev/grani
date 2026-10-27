# Closing panels: the patterns of grani-ui

Dismiss nested panels in order, the top one first, and leave the form behind them as it was.

Page: https://grani.arseni.work/patterns/closing

## Keep the current period until both days are picked

Your current period stays in effect until you select both ends of a new range. If you close the panel before selecting both dates, the unfinished range is discarded, and the panel next opens on its list of periods. If the app sets another period while you are selecting, the unfinished range is discarded too.

Why: You can explore dates and cancel without changing the records shown by the current filter.

Held by the library by itself.
Where: [Date range](https://grani.arseni.work/components/date-range).
Tests: 2, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/closing#half-pick-dropped

## Close only the top layer with Escape

Press Escape to step back from the last thing you opened. A list or calendar closes while the form behind it stays open. In a drawer with nested views, Escape goes back one level before closing the drawer. A search containing text uses the first Escape to clear it; a calendar’s month view uses it to return to the days.

Why: You can dismiss a temporary choice without accidentally closing the form you are still filling in.

Held by the library by itself.
Where: [Date picker](https://grani.arseni.work/components/date-picker), [Select](https://grani.arseni.work/components/select), [Time picker](https://grani.arseni.work/components/time-picker), [Drawer](https://grani.arseni.work/components/drawer), [Tooltip](https://grani.arseni.work/components/tooltip), [Popover](https://grani.arseni.work/components/popover), [Crud drawer](https://grani.arseni.work/components/crud-drawer), [Modal](https://grani.arseni.work/components/modal).
Tests: 11, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/closing#escape-top

## Close a popup without closing the form behind it

If a select’s list or a calendar is open inside a window or drawer, a click outside it closes only that list or calendar, and the form stays open. In a window this holds even for a click on the backdrop; the next click there closes the window.

Why: Clicking away is the usual way to dismiss a list you opened by mistake, and it should not cost you the form you were filling in.

Held by the library by itself.
Where: [Select](https://grani.arseni.work/components/select), [Date picker](https://grani.arseni.work/components/date-picker), [Crud drawer](https://grani.arseni.work/components/crud-drawer), [Modal](https://grani.arseni.work/components/modal).
Tests: 4, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/closing#press-top

## See one window at a time

If a dialog opens another dialog, the first one closes and the new one takes its place. If an edit dialog asks a question (a confirmation), the edit dialog is hidden until you answer, then returns as you left it, with focus on the button that asked. A side drawer remains visible beneath a dialog.

Why: You can tell which question needs an answer, and the keyboard cannot move into a hidden dialog by mistake.

Held by the library by itself.
Where: [Modal](https://grani.arseni.work/components/modal), [Confirm](https://grani.arseni.work/components/confirm).
Tests: 9, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/closing#one-window

## Close an open picker when its field is disabled

If a select or date field becomes disabled while its list or calendar is open, the popup closes. Focus returns to the field, so you keep your place in the form even though that field cannot currently accept a choice.

Why: An open list should not offer choices the field no longer accepts, and with focus on the field you do not have to find your place again.

Held by the library by itself.
Where: [Select](https://grani.arseni.work/components/select), [Date picker](https://grani.arseni.work/components/date-picker).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/closing#off-closes
