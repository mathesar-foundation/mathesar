import { map } from 'iter-tools';
import { type Readable, type Writable, derived, writable } from 'svelte/store';

import { ImmutableMap } from '@mathesar-component-library';

/** Keys are stringified row or cell reference values */
type PrimitiveValuesForColumn<T> = Record<string, T>;
/** Keys are stringified column ids */
type PrimitiveValuesForSheet<T> = Record<string, PrimitiveValuesForColumn<T>>;

/** Keys are stringified row or cell reference values */
export type AssociatedCellValuesForColumn<T> = ImmutableMap<string, T>;
/** Keys are stringified column ids */
export type AssociatedCellValuesForSheet<T> = ImmutableMap<
  string,
  AssociatedCellValuesForColumn<T>
>;

function buildAssociatedCellValuesForColumn<T>(
  v: PrimitiveValuesForColumn<T>,
): AssociatedCellValuesForColumn<T> {
  return new ImmutableMap(Object.entries(v));
}

export function buildAssociatedCellValuesForSheet<T>(
  values: PrimitiveValuesForSheet<T>,
): AssociatedCellValuesForSheet<T> {
  return new ImmutableMap(
    map(
      ([k, v]) => [k, buildAssociatedCellValuesForColumn(v)],
      Object.entries(values ?? {}),
    ),
  );
}

function mergeAssociatedCellValuesForColumn<T>(
  a: AssociatedCellValuesForColumn<T>,
  b: AssociatedCellValuesForColumn<T>,
): AssociatedCellValuesForColumn<T> {
  return a.withEntries(b);
}

export function mergeAssociatedValuesForSheet<T>(
  a: AssociatedCellValuesForSheet<T>,
  b: AssociatedCellValuesForSheet<T>,
): AssociatedCellValuesForSheet<T> {
  return a.withEntries(b, mergeAssociatedCellValuesForColumn);
}

/**
 * In a sheet, sometimes we need the ability to associate a value with a cell
 * without relying on the value being "in" the cell.
 *
 * For example:
 *
 * - In a foreign key cell, we need to associate a record summary with the cell
 *   even though the cell data does not contain it directly.
 * - In a file cell, we need to associate a file manifest with the cell.
 *
 * Usage:
 *
 * - Writing to this store is done via the imperative methods. You can either
 *   write a whole set of associated values, e.g. as fetched from the records
 *   API; or you can add one "bespoke" associated value, e.g. as acquired when
 *   updating a single cell. The bespoke values don't get wiped out when setting
 *   the fetched values.
 *
 * - Reading from this store is done via its Readable interface where you'll get
 *   both the fetched values and the bespoke values merged together. Because the
 *   bespoke values are never cleared, values are taken from the fetched values
 *   with higher precedence.
 */
export default class AssociatedCellData<T>
  implements Readable<AssociatedCellValuesForSheet<T>>
{
  private fetched: Writable<AssociatedCellValuesForSheet<T>> = writable(
    new ImmutableMap(),
  );

  private bespoke: Writable<AssociatedCellValuesForSheet<T>> = writable(
    new ImmutableMap(),
  );

  private combined: Readable<AssociatedCellValuesForSheet<T>>;

  constructor() {
    this.combined = derived([this.bespoke, this.fetched], ([a, b]) =>
      mergeAssociatedValuesForSheet(a, b),
    );
  }

  subscribe(
    run: (value: AssociatedCellValuesForSheet<T>) => void,
    invalidate?: (value?: AssociatedCellValuesForSheet<T>) => void,
  ): () => void {
    return this.combined.subscribe(run, invalidate);
  }

  setFetchedValues(values: AssociatedCellValuesForSheet<T>): void {
    this.fetched.set(values);
  }

  setFetchedValuesFromPrimitive(values: PrimitiveValuesForSheet<T>): void {
    this.setFetchedValues(buildAssociatedCellValuesForSheet(values));
  }

  addBespokeValues(additional: AssociatedCellValuesForSheet<T>): void {
    this.bespoke.update((existing) =>
      mergeAssociatedValuesForSheet(existing, additional),
    );
  }

  addBespokeValue({
    columnId,
    key,
    value,
  }: {
    columnId: string;
    key: string;
    value: T;
  }): void {
    this.addBespokeValues(
      new ImmutableMap([[columnId, new ImmutableMap([[key, value]])]]),
    );
  }
}
