import {
  get,
  writable,
  Writable,
} from 'svelte/store';
import type { Tab } from '@mathesar-components/types';
import {
  getAllImportDetailsForSchema,
  removeImportFromView,
} from '@mathesar/stores/fileImports';
import { clearTable } from '@mathesar/stores/tableData';
import { getSchemasStoreForDB } from '@mathesar/stores/schemas';
import URLQueryHandler from '@mathesar/utils/urlQueryHandler';
import type { Schema } from '@mathesar/App';

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
    const tables = [] as MathesarTab[];
    const schemas = get(getSchemasStoreForDB(db));

    URLQueryHandler.getAllTableConfigs(db).forEach(
      (entry) => {
        const schemaTable = schemas?.data.get(schemaId)?.tables.get(entry.id);
        if (schemaTable) {
          tables.push({
            id: entry.id,
            label: schemaTable.name,
          });
        } else {
          URLQueryHandler.removeTable(db, entry.id);
        }
      },
    );

    const imports = getAllImportDetailsForSchema(schemaId) as unknown as MathesarTab[];

    const tabs = [...imports, ...tables];
    const activeTab = tables.find(
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
  schemaId: Schema['id'],
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
  schemaId: Schema['id'],
  removedTab?: MathesarTab,
  newActiveTab?: MathesarTab,
): void {
  const { tabs, activeTab } = getTabsForSchema(db, schemaId);
  const tabData = get(tabs);
  const activeTabData = get(activeTab);

  if (activeTabData?.isNew) {
    URLQueryHandler.removeActiveTable(db);
  }

  if (removedTab) {
    /**
     * If called from component event, the tab would already have been removed in previous tick.
     * If called directly, tab will have to be removed.
     * We have a find check, to avoid unnessary re-renders, incase of component events.
     */
    if (tabData.find((entry) => entry.id === removedTab.id)) {
      tabs.set(
        tabData.filter((tab) => tab.id !== removedTab.id),
      );
    }

    if (removedTab.isNew) {
      removeImportFromView(schemaId, removedTab.id as string);
    } else {
      URLQueryHandler.removeTable(db, removedTab.id as number, newActiveTab?.id as number);
      clearTable(db, removedTab.id as number);
    }
  } else {
    // eslint-disable-next-line no-console
    console.error('Tab removal failed. RemovedTab information is missing');
  }
}

export function replaceTab(db: string, schemaId: Schema['id'], oldTabId: unknown, tab: MathesarTab): void {
  const { tabs, activeTab } = getTabsForSchema(db, schemaId);
  const tabData = get(tabs);
  const activeTabData = get(activeTab);

  const existingTabIndex = tabData.findIndex((tabEntry) => tabEntry.id === oldTabId);
  const existingTab = tabData[existingTabIndex];
  addTab(db, schemaId, tab, {
    position: existingTabIndex,
    status: activeTabData?.id === existingTab.id ? 'active' : 'inactive',
  });
  removeTab(db, schemaId, existingTab, tab);
}

export function selectTab(db: string, tab: MathesarTab): void {
  if (tab.isNew) {
    URLQueryHandler.removeActiveTable(db);
  } else {
    URLQueryHandler.addTable(db, tab.id as number);
  }
}
