import * as urls from '@mathesar/routes/urls';
import { derived } from 'svelte/store';
import { currentDatabase } from './databases';
import { currentSchema } from './schemas';
import { currentTable } from './tables';

/**
 * Sorry this is a bit convoluted. I'm open to better patterns here. This store
 * yields a function to get the RecordPage URL. A simpler approach would be to
 * export a function that creates derived stores, but we have a [frontend
 * standard][1] which steers us away from creating a lot of store instances and
 * this store will get used in every FK cell.
 *
 * [1]:
 * https://wiki.mathesar.org/en/engineering/standards/frontend#minimize-svelte-store-instances
 */
export const storeToGetRecordPageUrl = derived(
  [currentDatabase, currentSchema, currentTable],
  ([database, schema, table]) => {
    function getRecordPageUrl({
      databaseName,
      schemaId,
      tableId,
      recordId,
    }: {
      databaseName?: string;
      schemaId?: number;
      tableId?: number;
      recordId: unknown;
    }): string | undefined {
      const d = databaseName ?? database?.name;
      const s = schemaId ?? schema?.id;
      const t = tableId ?? table?.id;
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
