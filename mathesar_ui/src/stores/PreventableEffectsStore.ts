import { writable, type Writable } from 'svelte/store';

interface Effect<Value, EffectNames> {
  name: EffectNames;
  run: (v: Value) => void;
}

/**
 * This is a writable store that holds effects which run when the value changes.
 * Unlike other effect mechanisms in Svelte, this store allows you to prevent
 * certain effects from running when the value changes — and control over that
 * prevention is delegated to the call site of the update.
 *
 * The use case for this store is when you have an imperative effect that you
 * want to run _almost_ all the time. By default you want the effect to run. But
 * for some cases (when you do a little extra work), then you can prevent the
 * effect from running while performing an update.
 *
 * ## Example
 *
 * ```ts
 * const store = new PreventableEffectsStore(0, {
 *  log: (v) => console.log(v),
 * });
 *
 * store.update((v) => v + 1); // logs 1
 * store.update((v) => v + 1, { prevent: ['log'] }); // does not log
 * ```
 */
export default class PreventableEffectsStore<
  Value,
  EffectNames extends string,
> {
  private value: Writable<Value>;

  private effects: Effect<Value, EffectNames>[] = [];

  constructor(
    initialValue: Value,
    effectMap: Record<EffectNames, (v: Value) => void>,
  ) {
    this.value = writable(initialValue);
    this.effects = Object.entries(effectMap).map(([name, run]) => ({
      name: name as EffectNames,
      run: run as (v: Value) => void,
    }));
  }

  private runEffects(
    value: Value,
    options: { prevent?: EffectNames[] } = {},
  ): void {
    this.effects
      .filter(({ name }) => !options.prevent?.includes(name))
      .forEach(({ run }) => run(value));
  }

  subscribe(run: (value: Value) => void): () => void {
    return this.value.subscribe(run);
  }

  update(
    getNewValue: (oldValue: Value) => Value,
    options: { prevent?: EffectNames[] } = {},
  ): void {
    this.value.update((oldValue) => {
      const newValue = getNewValue(oldValue);
      this.runEffects(newValue, options);
      return newValue;
    });
  }

  set(value: Value): void {
    this.value.set(value);
  }
}
