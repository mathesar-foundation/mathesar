/** The transition time for the highlight effect, in milliseconds */
export const HIGHLIGHT_TRANSITION_MS = 2 * 1000; // 2 seconds

/** The amount of time in milliseconds before we begin fading out the hint. */
export const HINT_EXPIRATION_START_MS = 10 * 1000; // 10 seconds

/** The time it will take to fade out the hint. */
export const HINT_EXPIRATION_TRANSITION_MS = 3 * 1000; // 3 seconds

/** The time at which we can remove the hint DOM nodes. */
export const HINT_EXPIRATION_END_MS =
  HINT_EXPIRATION_START_MS + HINT_EXPIRATION_TRANSITION_MS;
