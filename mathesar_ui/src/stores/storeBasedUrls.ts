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

import { connectionsStore } from './databases';
import { currentSchema } from './schemas';
import { currentTable } from './tables';

export const storeToGetRecordPageUrl = derived(
  [connectionsStore.currentConnection, currentSchema, currentTable],
  ([connection, schema, table]) => {
    function getRecordPageUrl({
      connectionId,
      schemaId,
      tableId,
      recordId,
    }: {
      connectionId?: number;
      schemaId?: number;
      tableId?: number;
      recordId: unknown;
    }): string | undefined {
      const d = connectionId ?? connection?.id;
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
  [connectionsStore.currentConnection, currentSchema, currentTable],
  ([connection, schema, table]) => {
    function getTablePageUrl({
      connectionId,
      schemaId,
      tableId,
    }: {
      connectionId?: number;
      schemaId?: number;
      tableId?: number;
    }): string | undefined {
      const d = connectionId ?? connection?.id;
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
