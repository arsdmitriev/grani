import { onBeforeUpdate, shallowReactive, useSlots } from 'vue'

/**
 * Which slots the component is given, read again before every render. Slots are not reactive: a
 * `computed` that reads `slots.picks` keeps its first answer when the slot comes or goes later
 * (`<template v-if="…" #picks>`). Read `seen.picks` where it would read `slots.picks`. @internal
 */
export function useSlotsSeen(
  slots: Readonly<Record<string, unknown>> = useSlots(),
): Readonly<Record<string, boolean>> {
  const seen = shallowReactive<Record<string, boolean>>({})
  const look = () => {
    for (const name of new Set([...Object.keys(slots), ...Object.keys(seen)])) {
      const given = Boolean(slots[name])
      if (seen[name] !== given) seen[name] = given
    }
  }
  look()
  onBeforeUpdate(look)
  return seen
}
