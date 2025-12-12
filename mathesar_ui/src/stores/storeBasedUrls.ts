/**
 * @file
 *
 * Sorry the functions in here are a bit convoluted. I'm open to better patterns
 * here. These stores yield functions to get URLs. A simpler approach would be
 * to export a function that creates derived stores, but we have a [frontend
 * standard](../../STANDARDS.md) which steers us away from creating a lot of
 * store instances and this store will get used in every FK cell.
 */

import { derived } from 'svelte/store';

import * as urls from '@mathesar/routes/urls';

import { databasesStore } from './databases';
import { currentSchema } from './schemas';
import { currentTable } from './tables';

export const storeToGetRecordPageUrl = derived(
  [databasesStore.currentDatabase, currentSchema, currentTable],
  ([database, schema, table]) => {
    function getRecordPageUrl({
      databaseId,
      schemaId,
      tableId,
      recordId,
    }: {
      databaseId?: number;
      schemaId?: number;
      tableId?: number;
      recordId: unknown;
    }): string | undefined {
      const d = databaseId ?? database?.id;
      const s = schemaId ?? schema?.oid;
      const t = tableId ?? table?.oid;
      const r = recordId ?? undefined;
      if (
        d === undefined ||
        s === undefined ||
        t === undefined ||
        r === undefined
      ) {
        return undefined;
      }
      return urls.getRecordPageUrl(d, s, t, r);
    }
    return getRecordPageUrl;
  },
);

export const storeToGetTablePageUrl = derived(
  [databasesStore.currentDatabase, currentSchema, currentTable],
  ([database, schema, table]) => {
    function getTablePageUrl({
      databaseId,
      schemaId,
      tableId,
    }: {
      databaseId?: number;
      schemaId?: number;
      tableId?: number;
    }): string | undefined {
      const d = databaseId ?? database?.id;
      const s = schemaId ?? schema?.oid;
      const t = tableId ?? table?.oid;
      if (d === undefined || s === undefined || t === undefined) {
        return undefined;
      }
      return urls.getTablePageUrl(d, s, t);
    }
    return getTablePageUrl;
  },
);
