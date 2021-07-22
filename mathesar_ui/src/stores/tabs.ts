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
      switch (fileImportInfo.changeType) {
        case ImportChangeType.ADDED: {
          const newImportTab = {
            ...fileImportInfo.info,
            label: fileImportInfo.info.name,
            isNew: true,
          };
          dbInfo.tabs.set([
            ...get(dbInfo.tabs),
            newImportTab,
          ]);
          dbInfo.activeTab.set(newImportTab);
          break;
        }
        case ImportChangeType.MODIFIED: {
          if (fileImportInfo.old.name !== fileImportInfo.info.name) {
            const tabList = get(dbInfo.tabs);
            const activeTabInfo = get(dbInfo.activeTab);

            let newlyCreatedTab: MathesarTab;
            dbInfo.tabs.set(
              tabList.map((entry) => {
                if (entry.id === fileImportInfo.info.id) {
                  newlyCreatedTab = {
                    ...entry,
                    label: fileImportInfo.info.name,
                  };
                  return newlyCreatedTab;
                }
                return entry;
              }),
            );

            if (activeTabInfo.id === newlyCreatedTab?.id) {
              dbInfo.activeTab.set(newlyCreatedTab);
            }
          }
          break;
        }
        default:
          break;
      }
    }
  });

  return dbInfo;
}

export function addTab(
  db: string,
  tab: MathesarTab,
  options?: { position?: number, status?: 'active' | 'inactive' },
): void {
  const { tabs, activeTab } = getTabsForDB(db);
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
    if (tabData.find((entry) => entry.id === removedTab.id)) {
      tabs.set(
        tabData.filter((tab) => tab.id !== removedTab.id),
      );
    }

    if (removedTab.isNew) {
      removeImport(db, removedTab.id as string);
    } else {
      URLQueryHandler.removeTable(db, removedTab.id as number, newActiveTab?.id as number);
      clearTable(db, removedTab.id as number);
    }
  } else {
    // eslint-disable-next-line no-console
    console.error('Tab removal failed. RemovedTab information is missing');
  }
}

export function replaceTab(db: string, oldTabId: unknown, tab: MathesarTab): void {
  const { tabs, activeTab } = getTabsForDB(db);
  const tabData = get(tabs);
  const activeTabData = get(activeTab);

  const existingTabIndex = tabData.findIndex((tabEntry) => tabEntry.id === oldTabId);
  const existingTab = tabData[existingTabIndex];
  addTab(db, tab, {
    position: existingTabIndex,
    status: activeTabData?.id === existingTab.id ? 'active' : 'inactive',
  });
  removeTab(db, existingTab, tab);
}

export function selectTab(db: string, tab: MathesarTab): void {
  if (tab.isNew) {
    URLQueryHandler.removeActiveTable(db);
  } else {
    URLQueryHandler.addTable(db, tab.id as number);
  }
}
