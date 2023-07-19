import { filter, findBest, firstHighest, firstLowest } from 'iter-tools';

import { ImmutableMap } from '@mathesar/component-library';

export default class Series<Id> {
  private readonly values: Id[];

  /** Maps the id value to its index */
  private readonly indexLookup: ImmutableMap<Id, number>;

  /**
   * @throws Error if duplicate values are provided
   */
  constructor(values: Id[] = []) {
    this.values = values;
    this.indexLookup = new ImmutableMap(
      values.map((value, index) => [value, index]),
    );
    if (new Set(values).size !== values.length) {
      throw new Error('Duplicate values are not allowed within a Series.');
    }
  }

  private getIndex(value: Id): number | undefined {
    return this.indexLookup.get(value);
  }

  get length(): number {
    return this.values.length;
  }

  /**
   * Return an iterator of all values between the two provided values,
   * inclusive. Iteration occurs in the order stored. The two provided values
   * may be present in any order.
   *
   * @throws an Error if either value is not present in the sequence
   */
  range(a: Id, b: Id): Iterable<Id> {
    const aIndex = this.getIndex(a);
    const bIndex = this.getIndex(b);

    if (aIndex === undefined || bIndex === undefined) {
      throw new Error('Id value not found within sequence.');
    }

    const startIndex = Math.min(aIndex, bIndex);
    const endIndex = Math.max(aIndex, bIndex);

    return this.values.slice(startIndex, endIndex + 1);
  }

  get first(): Id | undefined {
    return this.values[0];
  }

  get last(): Id | undefined {
    return this.values[this.values.length - 1];
  }

  has(value: Id): boolean {
    return this.getIndex(value) !== undefined;
  }

  /**
   * This method is used for `min` and `max`, but could potentially be used for
   * other things too.
   *
   * @param comparator Corresponds to the [iter-tools comparators][1]
   *
   * [1]:
   * https://github.com/iter-tools/iter-tools/blob/d7.5/API.md#compare-values-and-return-true-or-false
   */
  best(
    values: Iterable<Id>,
    comparator: (best: number, v: number) => boolean,
  ): Id | undefined {
    const validValues = filter((v) => this.has(v), values);
    return findBest(comparator, (v) => this.getIndex(v) ?? 0, validValues);
  }

  min(values: Iterable<Id>): Id | undefined {
    return this.best(values, firstLowest);
  }

  max(values: Iterable<Id>): Id | undefined {
    return this.best(values, firstHighest);
  }

  /**
   * @returns the value positioned relative to the given value by the given
   * offset. If the offset is 0, the given value will be returned. If the offset
   * is positive, the returned value will be that many positions _after_ the
   * given value. If no such value is present, then `undefined` will be
   * returned.
   */
  offset(value: Id, offset: number): Id | undefined {
    if (offset === 0) {
      return this.has(value) ? value : undefined;
    }
    const index = this.getIndex(value);
    if (index === undefined) {
      return undefined;
    }
    return this.values[index + offset];
  }

  /**
   * This is similar to `offset`, but accepts an iterable of values and treats
   * them as a unified block to be collapsed into one value. When `offset` is
   * positive, the returned value will be that many positions _after_ the last
   * value in the block. If no such value is present, then `undefined` will be
   * returned. If offset is zero, then `undefined` will be returned.
   */
  collapsedOffset(values: Iterable<Id>, offset: number): Id | undefined {
    if (offset === 0) {
      return undefined;
    }
    const outerValue = offset > 0 ? this.max(values) : this.min(values);
    if (outerValue === undefined) {
      return undefined;
    }
    return this.offset(outerValue, offset);
  }

  [Symbol.iterator](): Iterator<Id> {
    return this.values[Symbol.iterator]();
  }
}
