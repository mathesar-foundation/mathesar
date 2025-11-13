import type { JoinPath } from '@mathesar/api/rpc/tables';

/**
 * Aggregation type for columns that produce multiple results
 * (e.g., many-to-many relationships)
 */
export type AggregationType = 'list' | 'count';

export interface RelatedColumnEntry {
  /**
   * The join path from the base table to the target table containing this column.
   * Format: [[table_oid, column_attnum], [table_oid, column_attnum], ...]
   */
  readonly joinPath: JoinPath;
  /**
   * The column attnum in the target table
   */
  readonly columnId: number;
  /**
   * Whether this relationship produces multiple results (e.g., reverse FK or
   * many-to-many). When true, an aggregation type is required.
   */
  readonly multipleResults: boolean;
  /**
   * How to aggregate the results when multipleResults is true.
   * Only applies when multipleResults is true.
   */
  readonly aggregation?: AggregationType;
}

/**
 * Terse format for URL serialization:
 * [joinPath, columnId, multipleResults, aggregation?]
 */
type TerseRelatedColumnEntry = [
  JoinPath,
  number,
  boolean,
  AggregationType | undefined,
];

export type TerseRelatedColumns = TerseRelatedColumnEntry[];

/**
 * Represents the set of related columns that are temporarily added to the
 * table view. These columns come from linked tables via foreign key
 * relationships.
 *
 * This class is similar to Filtering, Sorting, and Grouping in that it:
 * - Stores view-specific metadata
 * - Serializes to/from URL parameters
 * - Does not yet affect the data fetching (will be added in future iterations)
 */
export class RelatedColumns {
  entries: RelatedColumnEntry[];

  constructor({ entries }: { entries?: RelatedColumnEntry[] } = {}) {
    this.entries = entries ?? [];
  }

  /**
   * Create a unique identifier for a related column entry based on its
   * join path and column ID. This is used to check for duplicates.
   */
  private static getEntryKey(entry: RelatedColumnEntry): string {
    return `${JSON.stringify(entry.joinPath)}_${entry.columnId}`;
  }

  hasEntry(entry: RelatedColumnEntry): boolean {
    const key = RelatedColumns.getEntryKey(entry);
    return this.entries.some((e) => RelatedColumns.getEntryKey(e) === key);
  }

  withEntry(entry: RelatedColumnEntry): RelatedColumns {
    if (this.hasEntry(entry)) {
      return this;
    }
    return new RelatedColumns({
      entries: [...this.entries, entry],
    });
  }

  withoutEntry(entryIndex: number): RelatedColumns {
    return new RelatedColumns({
      entries: [
        ...this.entries.slice(0, entryIndex),
        ...this.entries.slice(entryIndex + 1),
      ],
    });
  }

  /**
   * Remove entry by matching join path and column ID
   */
  withoutMatchingEntry(entry: RelatedColumnEntry): RelatedColumns {
    const key = RelatedColumns.getEntryKey(entry);
    return new RelatedColumns({
      entries: this.entries.filter(
        (e) => RelatedColumns.getEntryKey(e) !== key,
      ),
    });
  }

  terse(): TerseRelatedColumns {
    return this.entries.map((entry) => [
      entry.joinPath,
      entry.columnId,
      entry.multipleResults,
      entry.aggregation,
    ]);
  }

  static fromTerse(terse: TerseRelatedColumns): RelatedColumns {
    return new RelatedColumns({
      entries: terse.map((terseEntry) => ({
        joinPath: terseEntry[0],
        columnId: terseEntry[1],
        multipleResults: terseEntry[2],
        aggregation: terseEntry[3],
      })),
    });
  }
}
