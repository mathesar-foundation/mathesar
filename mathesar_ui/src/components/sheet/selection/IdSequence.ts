import { ImmutableMap } from '@mathesar/component-library';

export default class IdSequence<Id> {
  private readonly values: Id[];

  /** Maps the id value to its index */
  private readonly indexLookup: ImmutableMap<Id, number>;

  /**
   * @throws Error if duplicate values are provided
   */
  constructor(values: Id[]) {
    this.values = values;
    this.indexLookup = new ImmutableMap(
      values.map((value, index) => [value, index]),
    );
    if (new Set(values).size !== values.length) {
      throw new Error('Duplicate values are not allowed within an IdSequence.');
    }
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
    const aIndex = this.indexLookup.get(a);
    const bIndex = this.indexLookup.get(b);

    if (aIndex === undefined || bIndex === undefined) {
      throw new Error('Id value not found within sequence.');
    }

    const startIndex = Math.min(aIndex, bIndex);
    const endIndex = Math.max(aIndex, bIndex);

    return this.values.slice(startIndex, endIndex + 1);
  }

  [Symbol.iterator](): Iterator<Id> {
    return this.values[Symbol.iterator]();
  }
}
