// This file provides a simple and efficient way to track user interactions
// like clicks, key presses, and scrolls. It uses a single counter that
// increments with every user action.

// Functions are provided to "subscribe" to these events and to
// "snapshot" the counter, allowing you to easily check if any
// activity has occurred since the snapshot was taken.

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

let tick = 0;
const activeSubscriptions = new Map<string, number>();

function increment() {
  tick += 1;
}

export function subscribeUIInteractions(
  eventTypes: readonly UIEventType[] = EVENT_TYPES,
) {
  const key = eventTypes.join(',');

  if (!activeSubscriptions.has(key)) {
    eventTypes.forEach((type) => {
      window.addEventListener(type, increment, {
        capture: true,
        passive: true,
      });
    });
    activeSubscriptions.set(key, 0);
  }

  activeSubscriptions.set(key, (activeSubscriptions.get(key) ?? 0) + 1);

  return () => {
    const current = activeSubscriptions.get(key) ?? 0;
    if (current > 1) {
      activeSubscriptions.set(key, current - 1);
    } else {
      eventTypes.forEach((type) => {
        window.removeEventListener(type, increment, { capture: true });
      });
      activeSubscriptions.delete(key);
    }
  };
}

export function snapshotInteractions(): number {
  return tick;
}

export function hadInteractionSince(snapshot: number): boolean {
  return tick !== snapshot;
}
