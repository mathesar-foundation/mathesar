import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  derived,
  get,
  readable,
} from 'svelte/store';

export function isReadable<T>(v: Readable<T> | T): v is Readable<T> {
  return (
    typeof v === 'object' &&
    v !== null &&
    'subscribe' in v &&
    typeof v.subscribe === 'function'
  );
}

export function ensureReadable<T>(v: Readable<T> | T): Readable<T> {
  if (isReadable(v)) {
    return v;
  }
  return readable(v);
}

/**
 * Collapse two nested stores into a single store.
 */
export function collapse<T>(outerStore: Readable<Readable<T>>): Readable<T> {
  // This is memory-safe because the Unsubscriber function gets returned from
  // the callback passed to `derive`.
  //
  // From https://svelte.dev/docs#run-time-svelte-store-derived
  //
  // > If you return a function from the callback, it will be called when a) the
  // > callback runs again, or b) the last subscriber unsubscribes.
  return derived(outerStore, (innerStore, set) => innerStore.subscribe(set));
}

function arrayWithValueSetAtIndex<T>(array: T[], index: number, item: T): T[] {
  const result = [...array];
  result[index] = item;
  return result;
}

/**
 * Unite an array of stores into a store of an array.
 */
export function unite<T>(stores: Readable<T>[]): Readable<T[]> {
  let results: T[] = [];
  return readable(results, (set) => {
    const unsubscribers = stores.map((store, index) =>
      store.subscribe((value) => {
        results = arrayWithValueSetAtIndex(results, index, value);
        set(results);
      }),
    );
    // This is memory safe because when the last subscriber unsubscribes from
    // the `unite` store, the function below will ensure that we're
    // unsubscribing from all the inner stores.
    return () => unsubscribers.forEach((unsubscriber) => unsubscriber());
  });
}

/**
 * Derive a sorted array of objects from a readable iterable of objects where
 * each object contains a nested readable property on which to sort.
 *
 * @example
 *
 * ```ts
 * const people = writable<Person[]>([]);
 * // Sort people from youngest to oldest
 * const sortedPeople = reactiveSort(
 *   people,
 *   (person) => person.age, // where `age` is `Readable<number>`
 *   (a, b) => a - b,
 * );
 * ```
 */
export function reactiveSort<Value, Key>(
  readableValues: Readable<IterableIterator<Value>>,
  getSortingKey: (outerValue: Value) => Readable<Key>,
  compareSortingKeys: (a: Key, b: Key) => number,
): Readable<Value[]> {
  return collapse(
    derived(readableValues, (values) => {
      const pieces = [...values].map((value) =>
        derived(getSortingKey(value), (key) => ({ value, key })),
      );
      return derived(unite(pieces), ($pieces) =>
        [...$pieces]
          .sort((a, b) => compareSortingKeys(a.key, b.key))
          .map((s) => s.value),
      );
    }),
  );
}

type StoreValue<S> = S extends Readable<infer T> ? T : never;

/**
 * This utility function allows you to set up `subscribe` functions on _other_
 * stores while ensuring that the corresponding unsubscriber functions will be
 * automatically run when all subscribers unsubscribe from the store returned
 * from this function. The use case for this function is rather esoteric, but it
 * helps avoid memory leaks when working with stores at a low level outside
 * Svelte components.
 */
export function withSideChannelSubscriptions<Store extends Readable<unknown>>(
  store: Store,
  subscriptionCreators: (() => Unsubscriber)[],
): Store {
  let childSubscriberCount = 0;
  let sideChannelUnsubscribers: Unsubscriber[] = [];

  function subscribe(subscriber: Subscriber<StoreValue<Store>>) {
    const unsubscribeFromParent = store.subscribe(
      subscriber as Subscriber<unknown>,
    );
    childSubscriberCount += 1;
    if (childSubscriberCount === 1) {
      // The first subscriber has subscribed, so we need to subscribe to the
      // side channel subscriptions.
      sideChannelUnsubscribers = subscriptionCreators.map((h) => h());
    }
    return () => {
      unsubscribeFromParent();
      childSubscriberCount -= 1;
      if (childSubscriberCount === 0) {
        // The last subscriber has unsubscribed, so we need to unsubscribe from
        // the side channel subscriptions.
        sideChannelUnsubscribers.forEach((u) => u());
        sideChannelUnsubscribers = [];
      }
    };
  }

  return {
    ...store,
    subscribe,
  };
}

/**
 * This store utility allows listening on a store and any of it's nested stores
 * and derive a value from them.
 *
 * The returned store updates itself synchronously when the source store is modified.
 * However, when the inner stores are modified, the store only updates during the
 * microtask queue execution of the current eventloop.
 *  - This prevents inner stores from firing a bunch of updates when they are updated
 *    together, or immediately after the source is updated.
 *  - This utility also returns a tick function to wait for the store update to finish.
 *
 * When using this store in a ts file within a synchronous block, it should be treated
 * like an async store.
 */
export function asyncDynamicDerived<SourceSubstance, T>(
  source: Readable<SourceSubstance>,
  collectDeps: (sourceSubstance: SourceSubstance) => Iterable<Readable<any>>,
  compute: (sourceSubstance: SourceSubstance, getValue: typeof get) => T,
  initial: T,
): Readable<T> & { tick(): Promise<void> } {
  let flushScheduled = false;
  let pendingRuns = 0;
  const waiters: Array<() => void> = [];

  const resolveIfIdle = () => {
    if (!flushScheduled && pendingRuns === 0) {
      const toResolve = waiters.splice(0, waiters.length);
      toResolve.forEach((r) => r());
    }
  };

  const scheduleFlush = (fn: () => void): void => {
    if (flushScheduled) {
      return;
    }
    flushScheduled = true;
    pendingRuns += 1;

    const run = () => {
      flushScheduled = false;
      fn();
      pendingRuns -= 1;
      resolveIfIdle();
    };

    // Place the call as a microtask in the event loop
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(run);
    } else {
      void Promise.resolve().then(run);
    }
  };

  const base = readable(initial, (set) => {
    let reSubscribing = false;
    let sourceChangeId = 0;

    let deps: Readable<unknown>[] = [];
    let dynamicUnsubs: Unsubscriber[] = [];

    const update = (_sourceChangeId: number) => {
      if (sourceChangeId !== _sourceChangeId) {
        return;
      }
      const sourceSubtance = get(source);
      set(compute(sourceSubtance, get));
    };

    const resubscribeDynamics = (
      nextDeps: Set<Readable<any>>,
      _sourceChangeId: number,
    ) => {
      reSubscribing = true;
      const newDeps = [...nextDeps.values()];
      dynamicUnsubs.forEach((unsub) => unsub());
      dynamicUnsubs = newDeps.map((dep) =>
        dep.subscribe(() => {
          if (sourceChangeId !== _sourceChangeId || reSubscribing) {
            return;
          }
          scheduleFlush(() => update(_sourceChangeId));
        }),
      );
      deps = newDeps;
      reSubscribing = false;
    };

    const baseUnsub = source.subscribe(() => {
      sourceChangeId += 1;

      const sourceSubtance = get(source);
      const collectedDeps = collectDeps(sourceSubtance);
      const nextDeps = new Set<Readable<any>>(collectedDeps);

      resubscribeDynamics(nextDeps, sourceChangeId);
      update(sourceChangeId);
    });

    return () => {
      sourceChangeId = 0;
      baseUnsub();
      dynamicUnsubs.forEach((unsub) => unsub());
      dynamicUnsubs = [];
    };
  });

  const tick = (): Promise<void> => {
    if (!flushScheduled && pendingRuns === 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      waiters.push(resolve);
    });
  };

  return {
    subscribe: base.subscribe,
    tick,
  };
}
