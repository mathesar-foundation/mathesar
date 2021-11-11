import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { Tab } from '@mathesar-component-library/types';
import type { TabularData } from '@mathesar/stores/table-data/types';
import type {
  Database, DBObjectEntry, SchemaEntry, TabularType,
} from '@mathesar/App';
import { getTabularContent, removeTabularContent } from '@mathesar/stores/table-data';
import { getTablesStoreForSchema } from '@mathesar/stores/tables';
import {
  getAllImportDetailsForSchema,
  removeImportFromView,
} from '@mathesar/stores/fileImports';
import { parseTabListConfigFromURL, TabListConfig } from './utils';

export interface MathesarTab extends Tab {
  id: string,
  label: string,
  isNew: boolean,
  tabularData?: TabularData,
}

interface TabAddOptions {
  position?: number,
  status?: 'active' | 'inactive'
}

function calculateTabId(type: TabularType, id: DBObjectEntry['id']): MathesarTab['id'] {
  return `type_${type}_id_${id}`;
}

function getTabsFromImports(schemaId: SchemaEntry['id']): MathesarTab[] {
  const imports: MathesarTab[] = getAllImportDetailsForSchema(schemaId).map(
    (entry) => ({
      ...entry,
      isNew: true,
      label: 'New Table',
    }),
  );
  return imports;
}

function getTabsFromConfig(
  schemaId: SchemaEntry['id'],
  tabListConfig?: TabListConfig,
): MathesarTab[] {
  const tabs: MathesarTab[] = [];
  const tableStoreData = get(getTablesStoreForSchema(schemaId));
  tabListConfig.tabularDataParamList?.forEach(
    (entry) => {
      const table = tableStoreData.data.get(entry[1]);
      if (table) {
        tabs.push({
          id: calculateTabId(entry[0], entry[1]),
          label: table.name,
          isNew: false,
          tabularData: getTabularContent(entry[0], entry[1], entry),
        });
      } else {
        // URLQueryHandler.removeTable(db, entry.id);
      }
    },
  );
  return tabs;
}

/**
 * This class currently depends on three stores/group of stores
 * - Tables store
 * - TableData dynamic stores
 * - FileImports store
 */
export class TabList {
  dbName: Database['name'];

  schemaId: SchemaEntry['id'];

  tabs: Writable<MathesarTab[]>;

  activeTab: Writable<MathesarTab>;

  constructor(dbName: Database['name'], schemaId: SchemaEntry['id']) {
    this.dbName = dbName;
    this.schemaId = schemaId;

    // Load incomplete imports from fileImports store
    const importedFileTabs = getTabsFromImports(schemaId);

    // Load tables & views from URL
    const tabListConfig = parseTabListConfigFromURL(dbName, schemaId);
    const tabularTabs = getTabsFromConfig(schemaId, tabListConfig);

    const tabs = [...importedFileTabs, ...tabularTabs];
    const activeTab = tabularTabs.find(
      (tab) => tab.tabularData.type === tabListConfig.activeTabularTab?.[0]
        && tab.tabularData.id === tabListConfig.activeTabularTab?.[1],
    ) || tabs[0];

    this.tabs = writable(tabs);
    this.activeTab = writable(activeTab);
  }

  add(tab: MathesarTab, options?: TabAddOptions): void {
    const tabSubstance = get(this.tabs);
    const activeTabSubstance = get(this.activeTab);

    const existingTab = tabSubstance.find((tabEntry) => tabEntry.id === tab.id);
    if (!existingTab) {
      if (
        typeof options?.position === 'number'
        && options?.position > -1
        && options?.position < tabSubstance.length
      ) {
        tabSubstance.splice(options?.position, 0, tab);
        this.tabs.set([
          ...tabSubstance,
        ]);
      } else {
        this.tabs.set([
          ...tabSubstance,
          tab,
        ]);
      }
    }

    if (options?.status !== 'inactive') {
      if (activeTabSubstance?.id !== tab.id) {
        this.activeTab.set(tab);
      }
    }
  }

  remove(tab: MathesarTab): void {
    const tabSubstance = get(this.tabs);
    const activeTabSubstance = get(this.activeTab);

    if (activeTabSubstance?.isNew) {
      // URLQueryHandler.removeActiveTable(db);
    }

    if (tab) {
      const removedTabIndexInTabsArray = tabSubstance.findIndex(
        (entry) => entry.id === tab.id,
      );

      /**
       * If directly called without changing the active tab to a tab other than the removed one,
       * active tab has to be manually changed.
       */
      if (activeTabSubstance?.id === tab.id) {
        if (tabSubstance[removedTabIndexInTabsArray + 1]) {
          this.activeTab.set(tabSubstance[removedTabIndexInTabsArray + 1]);
        } else if (tabSubstance[removedTabIndexInTabsArray - 1]) {
          this.activeTab.set(tabSubstance[removedTabIndexInTabsArray - 1]);
        } else {
          this.activeTab.set(null);
        }
      }

      /**
       * If called from component event, the tab would already have been removed in previous tick.
       * If called directly, tab will have to be removed.
       * We have a find check to avoid unnessary re-renders incase of component events.
       */
      if (removedTabIndexInTabsArray > -1) {
        this.tabs.set(
          tabSubstance.filter((entry) => entry.id !== tab.id),
        );
      }

      if (tab.isNew) {
        removeImportFromView(this.schemaId, tab.id);
      } else if (tab.tabularData) {
        // URLQueryHandler.removeTable(db, tab.id as number, get(activeTab)?.id as number);
        removeTabularContent(tab.tabularData.type, tab.tabularData.id);
      }
    } else {
      // eslint-disable-next-line no-console
      console.error('Tab removal failed. RemovedTab information is missing');
    }
  }

  replace(oldTabId: MathesarTab['id'], tab: MathesarTab): void {
    const tabSubstance = get(this.tabs);
    const activeTabSubstance = get(this.activeTab);

    const existingTabIndex = tabSubstance.findIndex((tabEntry) => tabEntry.id === oldTabId);
    const existingTab = tabSubstance[existingTabIndex];
    this.add(tab, {
      position: existingTabIndex,
      status: activeTabSubstance?.id === existingTab.id ? 'active' : 'inactive',
    });
    this.remove(existingTab);
  }
}
