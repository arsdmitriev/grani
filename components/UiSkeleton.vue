<!--
  UiSkeleton: the shape of content on its way. Take it in a block of your own while its first load
  runs; a card, a table, a drawer and a chart card draw their own under `loading`.

  Size. Size and shape come from the classes the host passes (`h-4 w-32`, `h-64 w-full`,
  `rounded-pill` for an avatar); without them it has no size. A line of text is an `inline-block h-3
  align-middle` inside a block of the text's size, which keeps the line's height. A page skeleton is
  several of these, mirroring the real layout.

  Decoration. It is decoration, and its shimmer is the sign that the first load runs: under reduced
  motion it keeps shimmering, slower, since a still gray block reads as a broken page. The host's
  live region announces the loading state.

  By hand. UiCard, UiTable, UiDataTable, UiCrudDrawer and UiChartCard (with its charts) draw it
  themselves under `loading`. Place it by hand only in blocks of your own, which bring their own
  `role="status"` and drop it when the data comes.

  Keyboard. Not interactive: it takes no focus and holds no control.

  Reader.
  - Hidden: `aria-hidden`; the loading state is announced by the host's live region, a
    `role="status"` the host brings and drops when the data comes.

  States. One: a shimmering block, slower under reduced motion, in the size and shape the host's
  classes give it; without them it has no size.

  Not for.
  - An action in flight: UiSpinner.
  - Work measured or of unknown length: UiProgress.
  - Nothing there or a failed load: UiNoData.
  - Loading a card, a table, a drawer or a chart card: UiCard, UiTable, UiCrudDrawer and
    UiChartCard draw it themselves under `loading`.
-->
<template>
  <div class="ui-skeleton animate-pulse rounded-control bg-skeleton" aria-hidden="true" />
</template>

<script setup lang="ts"></script>
