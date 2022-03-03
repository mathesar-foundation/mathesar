import type { Unsubscriber, Writable } from 'svelte/store';
import { get } from 'svelte/store';
import { currentDBName } from '@mathesar/stores/databases';
import { getTabsForSchema } from '@mathesar/stores/tabs/manager';
import { saveTabData } from '@mathesar/stores/tabs/tabDataSaver';

export function beginUpdatingUrlWhenSchemaChanges(
  currentSchemaId: Writable<number | undefined>,
): Unsubscriber {
  return currentSchemaId.subscribe((schemaId) => {
    if (!schemaId) {
      return;
    }
    const dbName = get(currentDBName);
    const tabList = getTabsForSchema(dbName, schemaId);
    const tabData = get(tabList.savableTabData);
    saveTabData(tabData);
  });
}
