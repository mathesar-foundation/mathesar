import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  derived,
} from 'svelte/store';

import { collapse, ensureReadable, unite } from './storeUtils';
import WritableSet from './WritableSet';

/**
 * A store that holds a dynamically writable collection of readable input stores
 * and reduces all those input values down to a single readable output value.
 */
export default class ReductionStore<Input, Output> implements Readable<Output> {
  private inputs: WritableSet<Readable<Input>>;

  private output: Readable<Output>;

  constructor(reduce: (inputs: Input[]) => Output) {
    this.inputs = new WritableSet();
    this.output = collapse(
      derived(this.inputs, (inputs) => derived(unite([...inputs]), reduce)),
    );
  }

  /**
   * Add a new input to be incorporated into the reduced value of this store.
   *
   * @returns a function to unregister the input.
   */
  registerInput(input: Readable<Input> | Input): () => void {
    const readableInput = ensureReadable(input);
    this.inputs.add(readableInput);
    return () => this.inputs.delete(readableInput);
  }

  subscribe(
    run: Subscriber<Output>,
    invalidate?: ((value?: Output | undefined) => void) | undefined,
  ): Unsubscriber {
    return this.output.subscribe(run, invalidate);
  }
}
