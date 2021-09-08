import {
  get,
  writable,
} from 'svelte/store';
import type { Writable } from 'svelte/store';

import {
  getAllImportDetailsForSchema,
  removeImportFromView,
} from '@mathesar/stores/fileImports';
import { removeTableContent } from '@mathesar/stores/table-data/store';
import { getTablesStoreForSchema } from '@mathesar/stores/tables';
import URLQueryHandler from '@mathesar/utils/urlQueryHandler';

import type { Tab } from '@mathesar-components/types';
import type { SchemaEntry } from '@mathesar/App';

export interface MathesarTab extends Tab {
  id: unknown,
  label: string,
}

export interface TabList {
  activeTab: Writable<MathesarTab>,
  tabs: Writable<MathesarTab[]>,
}

const schemaMap: Map<number, TabList> = new Map();

export function getTabsForSchema(db: string, schemaId: number): TabList {
  let schemaTabs = schemaMap.get(schemaId);
  if (!schemaTabs) {
    const tabTables = [] as MathesarTab[];
    const tableStoreData = get(getTablesStoreForSchema(schemaId));

    URLQueryHandler.getAllTableConfigs(db).forEach(
      (entry) => {
        const table = tableStoreData.data.get(entry.id);
        if (table) {
          tabTables.push({
            id: entry.id,
            label: table.name,
          });
        } else {
          URLQueryHandler.removeTable(db, entry.id);
        }
      },
    );

    const imports = getAllImportDetailsForSchema(schemaId) as unknown as MathesarTab[];

    const tabs = [...imports, ...tabTables];
    const activeTab = tabTables.find(
      (table) => table.id === URLQueryHandler.getActiveTable(db),
    ) || tabs[0];

    schemaTabs = {
      tabs: writable(tabs),
      activeTab: writable(activeTab),
    };
    schemaMap.set(schemaId, schemaTabs);
  }
  return schemaTabs;
}

export function addTab(
  db: string,
  schemaId: SchemaEntry['id'],
  tab: MathesarTab,
  options?: { position?: number, status?: 'active' | 'inactive' },
): void {
  const { tabs, activeTab } = getTabsForSchema(db, schemaId);
  const tabData = get(tabs);
  const activeTabData = get(activeTab);

  if (!tab.isNew) {
    URLQueryHandler.addTable(db, tab.id as number, { position: options?.position });
  }
  const existingTab = tabData.find((tabEntry) => tabEntry.id === tab.id);
  if (!existingTab) {
    if (
      typeof options?.position === 'number'
      && options?.position > -1
      && options?.position < tabData.length
    ) {
      tabData.splice(options?.position, 0, tab);
      tabs.set([
        ...tabData,
      ]);
    } else {
      tabs.set([
        ...tabData,
        tab,
      ]);
    }
  }

  if (options?.status !== 'inactive') {
    if (activeTabData?.id !== tab.id) {
      activeTab.set(tab);
    }
  }
}

export function removeTab(
  db: string,
  schemaId: SchemaEntry['id'],
  removedTab: MathesarTab,
): void {
  const { tabs, activeTab } = getTabsForSchema(db, schemaId);
  const tabData = get(tabs);
  const activeTabData = get(activeTab);

  if (activeTabData?.isNew) {
    URLQueryHandler.removeActiveTable(db);
  }

  if (removedTab) {
    const removedTabIndexInTabsArray = tabData.findIndex((entry) => entry.id === removedTab.id);

    /**
     * If directly called, without changing the active tab to a tab other than the removed one,
     * active tab has to be manually changed.
     */
    if (activeTabData?.id === removedTab.id) {
      if (tabData[removedTabIndexInTabsArray + 1]) {
        activeTab.set(tabData[removedTabIndexInTabsArray + 1]);
      } else if (tabData[removedTabIndexInTabsArray - 1]) {
        activeTab.set(tabData[removedTabIndexInTabsArray - 1]);
      } else {
        activeTab.set(null);
      }
    }

    /**
     * If called from component event, the tab would already have been removed in previous tick.
     * If called directly, tab will have to be removed.
     * We have a find check, to avoid unnessary re-renders, incase of component events.
     */
    if (removedTabIndexInTabsArray > -1) {
      tabs.set(
        tabData.filter((tab) => tab.id !== removedTab.id),
      );
    }

    if (removedTab.isNew) {
      removeImportFromView(schemaId, removedTab.id as string);
    } else {
      URLQueryHandler.removeTable(db, removedTab.id as number, get(activeTab)?.id as number);
      removeTableContent(removedTab.id as number);
    }
  } else {
    // eslint-disable-next-line no-console
    console.error('Tab removal failed. RemovedTab information is missing');
  }
}

export function replaceTab(db: string, schemaId: SchemaEntry['id'], oldTabId: unknown, tab: MathesarTab): void {
  const { tabs, activeTab } = getTabsForSchema(db, schemaId);
  const tabData = get(tabs);
  const activeTabData = get(activeTab);

  const existingTabIndex = tabData.findIndex((tabEntry) => tabEntry.id === oldTabId);
  const existingTab = tabData[existingTabIndex];
  addTab(db, schemaId, tab, {
    position: existingTabIndex,
    status: activeTabData?.id === existingTab.id ? 'active' : 'inactive',
  });
  removeTab(db, schemaId, existingTab);
}

export function selectTab(db: string, tab: MathesarTab): void {
  if (tab.isNew) {
    URLQueryHandler.removeActiveTable(db);
  } else {
    URLQueryHandler.addTable(db, tab.id as number);
  }
}
