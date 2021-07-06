import {
  get,
  writable,
  Writable,
  Unsubscriber,
} from 'svelte/store';
import type { Tab } from '@mathesar-components/types';
import {
  getDBStore,
  getAllImportDetails,
  ImportChangeType,
  removeImport,
} from '@mathesar/stores/fileImports';
import { clearTable } from '@mathesar/stores/tableData';
import { schemas } from '@mathesar/stores/schemas';
import URLQueryHandler from '@mathesar/utils/urlQueryHandler';

export interface MathesarTab extends Tab {
  id: unknown,
  label: string,
}

export interface TabList {
  activeTab: Writable<MathesarTab>,
  tabs: Writable<MathesarTab[]>,
}

const databaseMap: Map<string, TabList> = new Map();

function getTabsForDB(db: string): TabList {
  let dbInfo = databaseMap.get(db);
  if (!dbInfo) {
    const tables = [] as MathesarTab[];
    const { tableMap } = get(schemas);

    URLQueryHandler.getAllTableConfigs(db).forEach(
      (entry) => {
        const schemaTable = tableMap?.get(entry.id);
        if (schemaTable) {
          tables.push({
            id: entry.id,
            label: schemaTable?.name,
          });
        } else {
          URLQueryHandler.removeTable(db, entry.id);
        }
      },
    );

    const imports = getAllImportDetails(db) as unknown as MathesarTab[];

    const tabs = [...imports, ...tables];
    const activeTab = tables.find(
      (table) => table.id === URLQueryHandler.getActiveTable(db),
    ) || tabs[0];

    dbInfo = {
      tabs: writable(tabs),
      activeTab: writable(activeTab),
    };
    databaseMap.set(db, dbInfo);
  }
  return dbInfo;
}

let unsubFileImports: Unsubscriber = null;

export function getAllTabsForDB(db: string): TabList {
  if (unsubFileImports) {
    unsubFileImports();
  }

  const dbInfo = getTabsForDB(db);
  unsubFileImports = getDBStore(db).changes.subscribe((fileImportInfo) => {
    if (fileImportInfo) {
      if (fileImportInfo.changeType === ImportChangeType.ADDED) {
        const newImportTab = {
          ...fileImportInfo.info,
          label: 'New import',
          isNew: true,
        };
        dbInfo.tabs.set([
          ...get(dbInfo.tabs),
          newImportTab,
        ]);
        dbInfo.activeTab.set(newImportTab);
      }
    }
  });

  return dbInfo;
}

export function addTab(db: string, tab: MathesarTab): void {
  const tabId = tab.id as number;
  const { tabs, activeTab } = getTabsForDB(db);
  const tabData = get(tabs);

  URLQueryHandler.addTable(db, tabId);
  const existingTab = tabData.find((tabEntry) => tabEntry.id === tabId);
  if (existingTab) {
    if (get(activeTab).id !== existingTab.id) {
      activeTab.set(existingTab);
    }
  } else {
    tabs.set([
      ...tabData,
      tab,
    ]);
    activeTab.set(tab);
  }
}

export function removeTab(
  db: string,
  removedTab?: MathesarTab,
  newActiveTab?: MathesarTab,
): void {
  const { tabs, activeTab } = getTabsForDB(db);
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
    if (tabData.find((entry) => entry === removedTab)) {
      tabs.set(
        tabData.filter((tab) => tab !== removedTab),
      );
    }

    if (removedTab.isNew) {
      removeImport(db, removedTab.id as string);
    } else {
      URLQueryHandler.removeTable(db, removedTab.id as number, newActiveTab?.id as number);
      clearTable(db, removedTab.id as number);
    }
  }
}

export function selectTab(db: string, tab: MathesarTab): void {
  if (tab.isNew) {
    URLQueryHandler.removeActiveTable(db);
  } else {
    URLQueryHandler.addTable(db, tab.id as number);
  }
}
