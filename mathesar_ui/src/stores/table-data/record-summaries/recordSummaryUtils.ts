/**
 * @file
 *
 * This module is vestigial cruft leftover from a refactor. It would be nice to
 * clean this up at some point by either inlining these types or re-organizing
 * them into a more intuitive location. I'm skipping that cleanup work for now,
 * just for the sake of time.
 */

import type { ImmutableMap } from '@mathesar-component-library';

/** Keys are stringifed record ids */
type RecordSummariesForColumn = ImmutableMap<string, string>;

/** Keys are stringified column ids */
export type RecordSummariesForSheet = ImmutableMap<
  string,
  RecordSummariesForColumn
>;
