import { get, writable } from 'svelte/store';
import type { Writable, Unsubscriber } from 'svelte/store';
import type { Tab } from '@mathesar-component-library/types';
import type { TabularData, TabularDataParams } from '@mathesar/stores/table-data/types';
import type {
  Database, DBObjectEntry, SchemaEntry, TabularType,
} from '@mathesar/App.d';
import { getTabularContent, removeTabularContent } from '@mathesar/stores/table-data';
import { getTablesStoreForSchema } from '@mathesar/stores/tables';
import {
  getAllImportDetailsForSchema,
  removeImportFromView,
} from '@mathesar/stores/fileImports';
import type {
  FileImportInfo,
} from '@mathesar/stores/fileImports';
import {
  parseTabListConfigFromURL,
  syncTabularParamListToURL,
  syncSingleTabularParamToURL,
} from './utils';
import type { TabListConfig } from './utils';

export interface MathesarTab extends Tab {
  id: string,
  label: string,

  // TODO: Use a enum to determine type of tab
  isNew: boolean,
  tabularData?: TabularData,

  // Discuss: Remove imports from within the tab context to a higher level modal context
  fileImportId?: FileImportInfo['id']
}

interface TabAddOptions {
  position?: number,
  status?: 'active' | 'inactive'
}

function calculateTabularTabId(type: TabularType, id: DBObjectEntry['id']): MathesarTab['id'] {
  return `tabular_type_${type}_id_${id}`;
}

function calculateImportTabId(id: FileImportInfo['id']): MathesarTab['id'] {
  return `import_id_${id}`;
}

function getTabsFromImports(schemaId: SchemaEntry['id']): MathesarTab[] {
  const imports: MathesarTab[] = getAllImportDetailsForSchema(schemaId).map(
    (entry) => ({
      ...entry,
      isNew: true,
      label: 'Import data',
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
          id: calculateTabularTabId(entry[0], entry[1]),
          label: table.name,
          isNew: false,
          tabularData: getTabularContent(entry[0], entry[1], entry),
        });
      }
    },
  );
  return tabs;
}

export function constructTabularTab(
  type: TabularData['type'],
  id: TabularData['id'],
  label: DBObjectEntry['name'],
): MathesarTab {
  const newTab: MathesarTab = {
    id: calculateTabularTabId(type, id),
    label,
    isNew: false,
    tabularData: getTabularContent(type, id),
  };
  return newTab;
}

export function constructImportTab(
  fileImportId: FileImportInfo['id'],
  label?: FileImportInfo['name'],
): MathesarTab {
  const newTab: MathesarTab = {
    id: calculateImportTabId(fileImportId),
    label: label || 'Import data',
    isNew: true,
    fileImportId,
  };
  return newTab;
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

  activeTab: Writable<MathesarTab | null>;

  private tabsUnsubscriber: Unsubscriber;

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

    this.tabsUnsubscriber = this.tabs.subscribe((tabsSubstance) => {
      const tabularDataParamList: TabularDataParams[] = [];
      tabsSubstance.forEach((entry) => {
        if (entry.tabularData) {
          tabularDataParamList.push(entry.tabularData.parameterize());
        }
      });
      syncTabularParamListToURL(this.dbName, this.schemaId, tabularDataParamList);
    });
    tabularTabs.forEach((tabularTab) => {
      this.addParamListenerToTab(tabularTab);
    });
  }

  addParamListenerToTab(tab: MathesarTab): void {
    /**
     * We do not have to explicity unlisten to this event.
     * When tabularData is removed through `removeTabularContent` in remove method,
     * all listeners for that tabularData are cleared.
     */
    tab.tabularData?.on('paramsUpdated', (params: TabularDataParams) => {
      syncSingleTabularParamToURL(this.dbName, this.schemaId, params);
    });
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
        this.activeTab.set(existingTab || tab);
      }
    }

    this.addParamListenerToTab(tab);
  }

  getTabularTabByTabularID(
    type: TabularData['type'],
    id: TabularData['id'],
  ): MathesarTab {
    const tabSubstance = get(this.tabs);
    const tabularTabId = calculateTabularTabId(type, id);
    return tabSubstance.find(
      (entry) => entry.id === tabularTabId,
    );
  }

  getImportTabByImportID(id: FileImportInfo['id']): MathesarTab {
    const tabSubstance = get(this.tabs);
    const importTabId = calculateImportTabId(id);
    return tabSubstance.find(
      (entry) => entry.id === importTabId,
    );
  }

  remove(tab: MathesarTab): void {
    const tabSubstance = get(this.tabs);
    const activeTabSubstance = get(this.activeTab);

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
      removeTabularContent(tab.tabularData.type, tab.tabularData.id);
    }
  }

  replace(oldTab: MathesarTab, tab: MathesarTab): void {
    const tabSubstance = get(this.tabs);
    const activeTabSubstance = get(this.activeTab);

    const existingTabIndex = tabSubstance.findIndex((tabEntry) => tabEntry.id === oldTab.id);
    const existingTab = tabSubstance[existingTabIndex];

    this.add(tab, {
      position: existingTabIndex,
      status: existingTab && activeTabSubstance?.id === existingTab.id ? 'active' : 'inactive',
    });
    if (existingTab) {
      this.remove(existingTab);
    }
  }

  destroy(): void {
    this.tabsUnsubscriber();
  }
}
