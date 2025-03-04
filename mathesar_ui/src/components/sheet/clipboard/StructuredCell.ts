import { enumerate } from 'iter-tools';

export interface StructuredCell {
  /**
   * This corresponds to values within `abstractTypeCategory`. But we keep the
   * type as `string` so that StructuredCell values can be safely deserialized
   * without extra validation.
   */
  type: string;
  raw: unknown;
  formatted: string;
}

function validateCell(input: unknown): StructuredCell {
  // Some of this code is pretty messy because I wrote it for TS 4.8 which lacks
  // the [unlisted property narrowing][1] feature introduced in TS 4.9.
  //
  // [1]:
  // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#unlisted-property-narrowing-with-the-in-operator
  //
  // I also thought about bringing in Zod for this, but was reluctant to add
  // another dependency.

  if (typeof input !== 'object') {
    throw new Error('StructuredCell must be an object.');
  }
  if (input === null) {
    throw new Error('StructuredCell must be an object.');
  }
  if (!('type' in input)) {
    throw new Error('StructuredCell must have a `type` property.');
  }
  if (typeof (input as { type: unknown }).type !== 'string') {
    throw new Error('StructuredCell `type` property must be a string.');
  }
  if (!('raw' in input)) {
    throw new Error('StructuredCell must have a `raw` property.');
  }
  if (!('formatted' in input)) {
    throw new Error('StructuredCell must have a `formatted` property.');
  }
  if (typeof (input as { formatted: unknown }).formatted !== 'string') {
    throw new Error('StructuredCell `formatted` property must be a string.');
  }
  return input as StructuredCell;
}

function validateRow(input: unknown): StructuredCell[] {
  if (!Array.isArray(input)) {
    throw new Error('StructuredCells must be an array.');
  }
  return input.map(validateCell);
}

/**
 * Verifies that two rows are the same length and have identical sequences of
 * cell types.
 */
function assertRowConsistency(a: StructuredCell[], b: StructuredCell[]): void {
  if (a.length !== b.length) {
    throw new Error('StructuredCell rows must have the same length.');
  }
  for (const [i, cell] of enumerate(a)) {
    if (cell.type !== b[i].type) {
      throw new Error('StructuredCell rows must have the same types.');
    }
  }
}

function* validateRows(input: unknown): Generator<StructuredCell[]> {
  if (!Array.isArray(input)) {
    throw new Error('StructuredCellRows must be an array.');
  }

  const iter = input[Symbol.iterator]();
  const first = iter.next();
  if (first.done) return;
  const firstRow = validateRow(first.value);
  yield firstRow;

  while (true) {
    const next = iter.next();
    if (next.done) return;
    const row = validateRow(next.value);
    assertRowConsistency(firstRow, row);
    yield row;
  }
}

/**
 * This function exists to validate Mathesar data coming into Mathesar from the
 * user's clipboard. Even though this data would be associated with our custom
 * MIME type, we still validate it for good measure. For example it could happen
 * that a user copies from an older version of Mathesar and pastes into a newer
 * of Mathesar where the MIME type is still the same but the data structure has
 * changed. We need to perform this validation at runtime in order to rely on
 * the type system throughout the code that handles "paste" operations.
 */
export function validateStructuredCellRows(input: unknown): StructuredCell[][] {
  return [...validateRows(input)];
}
