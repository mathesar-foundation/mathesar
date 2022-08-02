import type { Readable, Writable, Unsubscriber } from 'svelte/store';
import { derived, get, writable } from 'svelte/store';
import type { Tab } from '@mathesar-component-library/types';
import type {
  TabularData,
  TabularDataProps,
  MetaProps,
} from '@mathesar/stores/table-data/types';
import type { Database, DBObjectEntry, SchemaEntry } from '@mathesar/AppTypes';
import {
  initTabularData,
  removeTabularData,
  TabularType,
} from '@mathesar/stores/table-data';
import { getTablesStoreForSchema } from '@mathesar/stores/tables';
import {
  removeImportFromView,
  getAllImportDetailsForSchema,
} from '@mathesar/stores/fileImports';
import type { FileImportInfo } from '@mathesar/stores/fileImports';
import { collapse, unite } from '@mathesar-component-library';
import type { SavableTabData, TabularTabReference } from './tabDataSaver';
import {
  getSavedTabData,
  saveTabData,
  tabMatchesReference,
} from './tabDataSaver';

export enum TabType {
  Tabular,
  Import,
}
interface BaseTab extends Tab {
  id: string;
  label: string;
}
export interface TabularTab extends BaseTab {
  type: TabType.Tabular;
  tabularData: TabularData;
}
export interface ImportTab extends BaseTab {
  type: TabType.Import;
  /**
   * Discuss: Remove imports from within the tab context to a higher level
   * modal context.
   */
  fileImportId?: FileImportInfo['id'];
}
export type MathesarTab = TabularTab | ImportTab;

export function tabIsTabular(tab: MathesarTab): tab is TabularTab {
  return tab.type === TabType.Tabular;
}

interface TabAddOptions {
  position?: number;
  status?: 'active' | 'inactive';
}

function calculateTabularTabId(
  type: TabularType,
  id: DBObjectEntry['id'],
): MathesarTab['id'] {
  return `tabular_type_${type}_id_${id}`;
}

function calculateImportTabId(id: FileImportInfo['id']): MathesarTab['id'] {
  return `import_id_${id}`;
}

export function constructTabularTab(
  type: TabularData['type'],
  id: TabularData['id'],
  label: DBObjectEntry['name'],
  metaProps?: MetaProps,
): TabularTab {
  const newTab: TabularTab = {
    id: calculateTabularTabId(type, id),
    label,
    type: TabType.Tabular,
    tabularData: initTabularData({ type, id, metaProps }),
  };
  return newTab;
}

function buildTabularTabFromProps({
  schemaId,
  tabularDataProps,
}: {
  schemaId: SchemaEntry['id'];
  tabularDataProps: TabularDataProps;
}) {
  const { id, type, metaProps } = tabularDataProps;
  const tableStoreData = get(getTablesStoreForSchema(schemaId));
  const table = tableStoreData.data.get(id);
  const label = table ? table.name : '(Unknown table)';
  return constructTabularTab(type, id, label, metaProps);
}

function getTabsFromImports(schemaId: SchemaEntry['id']): ImportTab[] {
  const imports: ImportTab[] = getAllImportDetailsForSchema(schemaId).map(
    (entry) => ({
      id: calculateImportTabId(entry.id),
      fileImportId: entry.id,
      type: TabType.Import,
      label: 'Import data',
    }),
  );
  return imports;
}

export function constructImportTab(
  fileImportId: FileImportInfo['id'],
  label?: FileImportInfo['name'],
): ImportTab {
  return {
    id: calculateImportTabId(fileImportId),
    label: label || 'Import data',
    type: TabType.Import,
    fileImportId,
  };
}

function getTabularTabReference(
  tab: MathesarTab,
): TabularTabReference | undefined {
  if (!tabIsTabular(tab)) {
    return undefined;
  }
  return { type: tab.tabularData.type, id: tab.tabularData.id };
}

function getTabularDataProps(
  tabularTab: TabularTab,
): Readable<TabularDataProps> {
  return derived(tabularTab.tabularData.meta.props, (metaProps) => ({
    type: tabularTab.tabularData.type,
    id: tabularTab.tabularData.id,
    metaProps,
  }));
}

function getSavableTabData(
  tabs: Readable<MathesarTab[]>,
  activeTab: Readable<MathesarTab | undefined>,
): Readable<SavableTabData> {
  const tabularTabs = derived(tabs, ($tabs) => $tabs.filter(tabIsTabular));
  return collapse(
    derived([tabularTabs, activeTab], ([$tabularTabs, $activeTab]) => {
      const tabularDataPropsArray = unite(
        $tabularTabs.map(getTabularDataProps),
      );
      return derived(tabularDataPropsArray, ($tabularDataPropsArray) => ({
        tabs: $tabularDataPropsArray,
        activeTab: $activeTab && getTabularTabReference($activeTab),
      }));
    }),
  );
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

  activeTab: Writable<MathesarTab | undefined>;

  savableTabData: Readable<SavableTabData>;

  private savableTabDataUnsubscriber: Unsubscriber;

  constructor(dbName: Database['name'], schemaId: SchemaEntry['id']) {
    this.dbName = dbName;
    this.schemaId = schemaId;

    // Load incomplete imports from fileImports store
    const importedFileTabs = getTabsFromImports(schemaId);

    // // Load tables & views from URL
    const savedTabData = getSavedTabData();
    const activeTabReference = savedTabData?.activeTab;
    const tabularTabs =
      savedTabData?.tabs.map((tabularDataProps) =>
        buildTabularTabFromProps({ tabularDataProps, schemaId: this.schemaId }),
      ) ?? [];

    const tabs: MathesarTab[] = [...importedFileTabs, ...tabularTabs];
    this.tabs = writable(tabs);

    const activeTab =
      (activeTabReference
        ? tabularTabs.find((tab) =>
            tabMatchesReference(tab, activeTabReference),
          )
        : undefined) ?? tabs[0];
    this.activeTab = writable(activeTab);

    this.savableTabData = getSavableTabData(this.tabs, this.activeTab);
    this.savableTabDataUnsubscriber =
      this.savableTabData.subscribe(saveTabData);
  }

  add(tab: MathesarTab, options?: TabAddOptions): void {
    const tabSubstance = get(this.tabs);
    const activeTabSubstance = get(this.activeTab);

    const existingTab = tabSubstance.find((tabEntry) => tabEntry.id === tab.id);
    if (!existingTab) {
      if (
        typeof options?.position === 'number' &&
        options?.position > -1 &&
        options?.position < tabSubstance.length
      ) {
        tabSubstance.splice(options?.position, 0, tab);
        this.tabs.set([...tabSubstance]);
      } else {
        this.tabs.set([...tabSubstance, tab]);
      }
    }

    if (options?.status !== 'inactive') {
      if (activeTabSubstance?.id !== tab.id) {
        this.activeTab.set(existingTab || tab);
      }
    }
  }

  getTabularTabByTabularID(
    type: TabularData['type'],
    id: TabularData['id'],
  ): MathesarTab | undefined {
    const tabSubstance = get(this.tabs);
    const tabularTabId = calculateTabularTabId(type, id);
    return tabSubstance.find((entry) => entry.id === tabularTabId);
  }

  getImportTabByImportID(id: FileImportInfo['id']): MathesarTab | undefined {
    const tabSubstance = get(this.tabs);
    const importTabId = calculateImportTabId(id);
    return tabSubstance.find((entry) => entry.id === importTabId);
  }

  private removeTabWithoutTouchingItsData(tab: MathesarTab): void {
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
        this.activeTab.set(undefined);
      }
    }

    /**
     * If called from component event, the tab would already have been removed in previous tick.
     * If called directly, tab will have to be removed.
     * We have a find check to avoid unnecessary re-renders incase of component events.
     */
    if (removedTabIndexInTabsArray > -1) {
      this.tabs.set(tabSubstance.filter((entry) => entry.id !== tab.id));
    }
  }

  removeTabAndItsData(tab: MathesarTab): void {
    this.removeTabWithoutTouchingItsData(tab);

    if (tab.type === TabType.Import) {
      if (tab.fileImportId) {
        removeImportFromView(this.schemaId, tab.fileImportId);
      }
    } else if (tab.tabularData) {
      removeTabularData(tab.tabularData.type, tab.tabularData.id);
    }
  }

  replace(oldTab: MathesarTab, tab: MathesarTab): void {
    const tabSubstance = get(this.tabs);
    const activeTabSubstance = get(this.activeTab);

    const existingTabIndex = tabSubstance.findIndex(
      (tabEntry) => tabEntry.id === oldTab.id,
    );
    const existingTab = tabSubstance[existingTabIndex];

    if (existingTab) {
      this.removeTabWithoutTouchingItsData(existingTab);
    }
    this.add(tab, {
      position: existingTabIndex,
      status:
        existingTab && activeTabSubstance?.id === existingTab.id
          ? 'active'
          : 'inactive',
    });
  }

  destroy(): void {
    this.savableTabDataUnsubscriber();
  }
}
