import {
  derived,
  writable,
  get,
  type Readable,
  type Writable,
} from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { Tab } from '@mathesar-component-library/types';
import type QueryModel from './QueryModel';

/**
 * This is a function instead of a const because we can't run `get(_)` at the
 * top level since i18n isn't initialized at build time.
 */
function makeTabMap() {
  return {
    exploration: { label: get(_)('exploration') },
    column: { label: get(_)('column') },
    cell: { label: get(_)('cell') },
  };
}

export interface ExplorationInspectorTab extends Tab {
  id: keyof ReturnType<typeof makeTabMap>;
  label: string;
}

function makeTab([id, { label }]: [string, { label: string }]) {
  return { id, label } as ExplorationInspectorTab;
}

function makeTabList(tabMap: Record<string, { label: string }>) {
  return Object.entries(tabMap).map(makeTab);
}

export default class QueryInspector {
  tabs: Readable<ExplorationInspectorTab[]>;

  activeTabId: Writable<ExplorationInspectorTab['id']>;

  activeTab: Readable<ExplorationInspectorTab>;

  constructor(query: Writable<QueryModel>) {
    const tabMap = makeTabMap();
    this.tabs = derived(query, (q) => {
      if (q.isSaved()) {
        return makeTabList(tabMap);
      }
      const { exploration, ...unsavedExplorationTabMap } = tabMap;
      return makeTabList(unsavedExplorationTabMap);
    });
    const firstTabId = get(this.tabs)[0].id;
    this.activeTabId = writable(firstTabId);
    this.activeTab = derived(this.activeTabId, (id) =>
      makeTab([id, tabMap[id]]),
    );
  }

  activate(tabId: ExplorationInspectorTab['id']) {
    this.activeTabId.set(tabId);
  }
}
