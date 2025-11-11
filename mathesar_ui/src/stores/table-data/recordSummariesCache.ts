import { api } from '@mathesar/api/rpc';
import type {
  RecordsSummaryListResponse,
  SummarizedRecordReference,
} from '@mathesar/api/rpc/_common/commonTypes';
import AsyncStore from '@mathesar/stores/AsyncStore';
import type { RowSeekerRecordStore } from '@mathesar/systems/row-seeker/RowSeekerController';
import { WritableMap } from '@mathesar-component-library';

/**
 * Centralized cache for record summaries across all tables.
 * This eliminates duplicate API calls when multiple cells reference the same table.
 */
export class RecordSummariesCache {
  /**
   * Cache of summaries per table.
   * Key: tableId, Value: Map of recordId -> summary
   */
  private cache = new Map<number, WritableMap<string, string>>();

  /**
   * Cache of AsyncStore instances per (tableId, databaseId) combination.
   * Key: `${tableId}_${databaseId}`, Value: RowSeekerRecordStore
   */
  private asyncStores = new Map<string, RowSeekerRecordStore>();

  /**
   * Get or create an AsyncStore for fetching record summaries for a specific table.
   * The store will automatically cache summaries as they're fetched.
   *
   * @param tableId - The table OID
   * @param databaseId - The database ID
   * @returns A RowSeekerRecordStore that caches results
   */
  getRecordStore(tableId: number, databaseId: number): RowSeekerRecordStore {
    const key = `${tableId}_${databaseId}`;

    // Return existing store if available
    if (this.asyncStores.has(key)) {
      return this.asyncStores.get(key)!;
    }

    // Get or create the summaries map for this table
    let summariesMap = this.cache.get(tableId);
    if (!summariesMap) {
      summariesMap = new WritableMap<string, string>();
      this.cache.set(tableId, summariesMap);
    }

    // Create a new AsyncStore that caches results
    const store = new AsyncStore<
      {
        limit?: number | null;
        offset?: number | null;
        search?: string | null;
      },
      RecordsSummaryListResponse
    >(async (params) => {
      const { limit = null, offset = null, search = null } = params;
      const response = await api.records
        .list_summaries({
          database_id: databaseId,
          table_oid: tableId,
          limit: limit ?? undefined,
          offset: offset ?? undefined,
          search: search ?? undefined,
        })
        .run();

      // Cache the summaries from the response
      // Even if search is provided, we cache the results for future use
      if (response.results) {
        for (const record of response.results) {
          if (
            record.key !== null &&
            record.key !== undefined &&
            typeof record.key !== 'boolean' &&
            record.summary
          ) {
            summariesMap.set(String(record.key), record.summary);
          }
        }
      }

      return response;
    });

    // Cache the store for reuse
    this.asyncStores.set(key, store);

    return store;
  }

  /**
   * Manually update a summary in the cache.
   *
   * @param tableId - The table OID
   * @param recordId - The record ID (will be stringified)
   * @param summary - The summary string
   */
  updateSummary(
    tableId: number,
    recordId: string | number,
    summary: string,
  ): void {
    let summariesMap = this.cache.get(tableId);
    if (!summariesMap) {
      summariesMap = new WritableMap<string, string>();
      this.cache.set(tableId, summariesMap);
    }
    summariesMap.set(String(recordId), summary);
  }

  /**
   * Get the summaries map for a specific table.
   *
   * @param tableId - The table OID
   * @returns The WritableMap of summaries, or undefined if not cached yet
   */
  getSummaries(tableId: number): WritableMap<string, string> | undefined {
    return this.cache.get(tableId);
  }

  /**
   * Clear the cache for a specific table.
   * This is useful when you know the table data has changed significantly.
   *
   * @param tableId - The table OID
   */
  clearTable(tableId: number): void {
    this.cache.delete(tableId);
    // Also clear any AsyncStores for this table (across all databases)
    // We need to find all keys that start with `${tableId}_`
    const keysToDelete: string[] = [];
    for (const key of this.asyncStores.keys()) {
      if (key.startsWith(`${tableId}_`)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.asyncStores.delete(key);
    }
  }
}
