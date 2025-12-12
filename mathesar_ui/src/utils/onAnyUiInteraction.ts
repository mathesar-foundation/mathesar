const EVENT_TYPES = [
  'click',
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointercancel',
  'touchstart',
  'touchend',
  'touchmove',
  'wheel',
  'keydown',
  'keyup',
] as const;

type UIEventType = (typeof EVENT_TYPES)[number];

/**
 * Run a callback if any UI interaction of the
 * specified type is fired.
 */
export function onAnyUiInteraction(
  callback: () => void,
  eventTypes: readonly UIEventType[] = EVENT_TYPES,
) {
  let hasTriggered = false;

  const handleInteraction = () => {
    if (hasTriggered) return;
    hasTriggered = true;

    eventTypes.forEach((type) => {
      window.removeEventListener(type, handleInteraction, { capture: true });
    });

    callback();
  };

  eventTypes.forEach((type) => {
    window.addEventListener(type, handleInteraction, {
      capture: true,
      passive: true,
    });
  });
}
