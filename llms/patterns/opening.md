# Focus and navigation: the patterns of grani-ui

Where keyboard focus starts, how it moves, and where it returns.

Page: https://grani.arseni.work/patterns/opening

## Mark today in the app’s time zone

The calendar marks today in the app’s time zone, or in the browser’s time zone if the app has not set one. On a page rendered by a server, the marker appears only after the calendar runs in the browser. A screen reader identifies it as the current date.

Why: Near midnight, the server’s date may differ from the date in the calendar’s time zone. Waiting for the browser avoids marking the wrong day as today, even briefly.

Held by the library by itself.
Where: [Calendar](https://grani.arseni.work/components/calendar).
Tests: 3, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/opening#readers-today

## Open a panel on the side where it fits

A field near the top of the window opens its calendar under it; a field near the bottom opens it above, so the calendar stays inside the window and the page needs no scrolling. The panel is never taller than the room it has, scrolling inside itself when the room is short, and never covers its field.

Why: You pick a day at the end of a long form without the calendar running off the screen, and the field you are filling stays in sight.

Held by the library by itself.
Where: [Date picker](https://grani.arseni.work/components/date-picker), [Select](https://grani.arseni.work/components/select).
Tests: 6, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/opening#opens-where-fits

## Know when a link opens a new tab

Before opening a link, you can tell whether it will use a new tab: an arrow follows the text, and a screen reader announces “opens in a new tab”. Links to another site use this behavior by default. Mail and phone links can open another app, so they do not carry the new-tab notice.

Why: You know that the original page will remain open and that you can return to it by switching tabs.

Held by the library by itself.
Where: [Link](https://grani.arseni.work/components/link), [Button](https://grani.arseni.work/components/button), [List item](https://grani.arseni.work/components/list-item).
Tests: 7, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/opening#new-tab-said

## Open with keyboard focus where the task begins

Open a form and start typing in its first field, or open a list and start choosing with the arrow keys. Searchable lists start in their search field, and a calendar starts on the selected day. In a confirmation dialog, focus starts on Cancel, so pressing Enter by habit does not approve the action.

Why: You can begin the task without first clicking a field or pressing Tab to find it. Confirmation dialogs give you time to read the question before approving it.

Held by the library by itself.
Where: [Filter list](https://grani.arseni.work/components/filter-list), [Popover](https://grani.arseni.work/components/popover), [Confirm](https://grani.arseni.work/components/confirm), [Table columns](https://grani.arseni.work/components/table-columns), [Filter](https://grani.arseni.work/components/filter), [Select](https://grani.arseni.work/components/select), [Date picker](https://grani.arseni.work/components/date-picker), [Calendar](https://grani.arseni.work/components/calendar), [Drawer](https://grani.arseni.work/components/drawer), [Modal](https://grani.arseni.work/components/modal), [Crud drawer](https://grani.arseni.work/components/crud-drawer).
Tests: 16, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/opening#focus-start

## Continue from where you opened the panel

After closing a dialog or side panel, continue from the button or row that opened it. Closing a popup with Escape or by choosing an option also returns focus to its opener, provided it is still on the page. Clicking outside a popup leaves focus where you clicked.

Why: You can open and close one record after another from the keyboard without looking for your place again each time.

Held by the library by itself.
Where: [Drawer](https://grani.arseni.work/components/drawer), [App shell](https://grani.arseni.work/components/app-shell), [Filter](https://grani.arseni.work/components/filter), [Table columns](https://grani.arseni.work/components/table-columns), [Date range](https://grani.arseni.work/components/date-range), [Select](https://grani.arseni.work/components/select), [Date picker](https://grani.arseni.work/components/date-picker), [Popover](https://grani.arseni.work/components/popover), [Modal](https://grani.arseni.work/components/modal), [Menu](https://grani.arseni.work/components/menu), [Crud drawer](https://grani.arseni.work/components/crud-drawer).
Tests: 18, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/opening#focus-back

## Pass a group with one press of Tab

Use Tab to reach a group of options, then the arrow keys to move within it. The next Tab leaves the group. This works for tabs, radio options, scale values, filter options and calendar days, so you do not have to Tab through each option separately. Separate controls, such as search and Reset buttons, have their own Tab stops.

Why: You can get past a group of twelve options without pressing Tab twelve times, while still reaching every option with the arrow keys.

Held by the library by itself.
Where: [Tabs](https://grani.arseni.work/components/tabs), [Filter list](https://grani.arseni.work/components/filter-list), [Calendar](https://grani.arseni.work/components/calendar), [Radio group](https://grani.arseni.work/components/radio-group), [Table columns](https://grani.arseni.work/components/table-columns), [Filter](https://grani.arseni.work/components/filter), [Scale input](https://grani.arseni.work/components/scale-input).
Tests: 10, named in patterns/tests.md beside this chapter
Link: https://grani.arseni.work/patterns/opening#one-stop
