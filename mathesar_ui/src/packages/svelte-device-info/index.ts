import { type Readable, type Writable, writable } from 'svelte/store';

function readOnly<T>(store: Writable<T>): Readable<T> {
  return store;
}

const hasPhysicalMouse = writable(false);

const hasTouchCapability = writable(false);

function listenForMouseEvents() {
  function onMouseMove() {
    hasPhysicalMouse.set(true);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    stop();
  }

  function stop() {
    window.removeEventListener('mousemove', onMouseMove, { capture: true });
  }

  window.addEventListener('mousemove', onMouseMove, { capture: true });

  return stop;
}

function listenForTouchEvents() {
  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === 'touch') {
      hasTouchCapability.set(true);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      stop();
    }
  }

  function stop() {
    window.removeEventListener('pointerdown', onPointerDown, { capture: true });
  }

  window.addEventListener('pointerdown', onPointerDown, { capture: true });

  return stop;
}

export function observeDeviceInfo(): () => void {
  const cleanupFunctions = [listenForMouseEvents(), listenForTouchEvents()];
  return () => cleanupFunctions.forEach((f) => f());
}

export const deviceInfo = {
  hasPhysicalMouse: readOnly(hasPhysicalMouse),

  // We don't (yet?) have a good way to detect a physical keyboard, so we use
  // a physical mouse as a reasonably good proxy.
  mayHavePhysicalKeyboard: readOnly(hasPhysicalMouse),

  hasTouchCapability: readOnly(hasTouchCapability),
};
