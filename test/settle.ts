import { nextTick } from 'vue'

/**
 * Waits for the render to land and for the clock to pass the next millisecond. A click dispatched
 * in the millisecond its button was rendered is dropped by Vue: a button with a capture listener
 * (UiButton refuses a click while loading) stamps the event with the time, and the click handler
 * attached in that same millisecond reads it as older than itself. A person never clicks that
 * fast; a test does, and then fails now and then.
 */
export async function settle() {
  for (let i = 0; i < 4; i++) await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 2))
}
