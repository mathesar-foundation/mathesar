import { type Tweened, tweened } from 'svelte/motion';
import { get } from 'svelte/store';

type Updater<T> = (target_value: T, value: T) => T;

/** Copied from tweened.d.ts */
interface TweenedOptions<T> {
  delay?: number;
  duration?: number;
  easing?: (t: number) => number;
  interpolate?: (a: T, b: T) => (t: number) => T;
}

interface Options extends TweenedOptions<number> {
  allowPause: boolean;
}

const defaults = {
  allowPause: true,
  duration: 0,
};

export interface PauseableTweened extends Tweened<number> {
  pause: () => void;
  resume: () => void;
}

export function pauseableTweened(
  initialValue: number,
  options: Partial<Options> = {},
): PauseableTweened {
  const fullOptions = { ...defaults, ...options };
  const store = tweened(initialValue, fullOptions);

  let isPaused = false;
  let targetValue = initialValue;
  let startingValue = initialValue;
  let { duration } = fullOptions;
  let promiseResolve = () => {};

  function makePromise() {
    return new Promise<void>((resolve) => {
      promiseResolve = resolve;
    });
  }

  function set(value: number, opts?: TweenedOptions<number>): Promise<void> {
    targetValue = value;
    duration = opts?.duration ?? fullOptions.duration;
    const promise = makePromise();
    void store
      .update((_targetValue, _currentValue) => {
        startingValue = _currentValue;
        return value;
      }, opts)
      .then(promiseResolve);

    // Why not directly return the Promise from `store.update`?
    //
    // Because if `pause` is called, it will call `store.update` again. Due to
    // the internal behavior of Tweened, that second call to `store.update` will
    // mean that the Promise returned from the first `store.update` will never
    // resolve.
    //
    // By creating a custom Promise, we can ensure that it will resolve, even in
    // the case where we've called `pause` and then `resume`.
    //
    // This approach definitely feels a bit hacky. It would be cleaner to
    // implement PauseableTweened from scratch, but it seemed a bit easier to
    // wrap Svelte's Tweened store.
    return promise;
  }

  function update(
    updater: Updater<number>,
    opts?: TweenedOptions<number>,
  ): Promise<void> {
    duration = opts?.duration ?? fullOptions.duration;
    startingValue = get(store);
    targetValue = updater(targetValue, startingValue);
    const promise = makePromise();
    void store.set(targetValue, opts).then(promiseResolve);
    // Why not directly return the Promise from `store.update`? See notes above
    // within `set`.
    return promise;
  }

  function pause() {
    if (!fullOptions.allowPause) {
      return;
    }
    isPaused = true;
    void store.update(
      (_targetValue, _currentValue) => {
        targetValue = _targetValue;
        return _currentValue;
      },
      { duration: 0 },
    );
  }

  function resume() {
    if (!isPaused) {
      return;
    }
    const currentValue = get(store);
    const rate = (targetValue - startingValue) / duration;
    const durationRemaining = (targetValue - currentValue) / rate;
    void store
      .set(targetValue, { duration: durationRemaining })
      .then(promiseResolve);
  }

  return {
    update,
    set,
    subscribe: store.subscribe,
    pause,
    resume,
  };
}
