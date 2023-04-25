import LocalStorageStore from './LocalStorageStore';

export const LOCAL_STORAGE_KEYS = {
  releaseData: 'mathesar-release-data',
  tableInspectorWidth: 'table-inspector-width',
  dataExplorerLeftSidebarWidth: 'data-explorer-left-sidebar-width',
  dataExplorerRightSidebarWidth: 'data-explorer-right-sidebar-width',
} as const;

export const tableInspectorWidth = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorWidth,
  defaultValue: 350,
});

export const dataExplorerLeftSidebarWidth = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.dataExplorerLeftSidebarWidth,
  defaultValue: 400,
});

export const dataExplorerRightSidebarWidth = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.dataExplorerRightSidebarWidth,
  defaultValue: 350,
});
