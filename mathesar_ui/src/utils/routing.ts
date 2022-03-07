/**
 * @overview
 *
 * Our routing system is a mix of declarative logic (e.g. in App.svelte) and
 * imperative logic (e.g. `saveTabData` within `tabDataSaver.ts`). We need the
 * imperative logic because the query param which saves the tab data is quite
 * complex and would be difficult to implement declaratively.
 *
 * This file provides helpers for the imperative logic.
 */

import type { Unsubscriber, Writable } from 'svelte/store';
import { get } from 'svelte/store';
import { currentDBName } from '@mathesar/stores/databases';
import { getTabsForSchema } from '@mathesar/stores/tabs/manager';
import { saveTabData } from '@mathesar/stores/tabs/tabDataSaver';

/**
 * See https://github.com/centerofci/mathesar/pull/1109#discussion_r816957769
 * for more information on the origin of the approach used in this function and
 * why we need it.
 */
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
