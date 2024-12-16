import LocalStorageStore from './LocalStorageStore';

// prettier-ignore
export const LOCAL_STORAGE_KEYS = {
  releaseData: 'mathesar-release-data',

  // Table inspector
  tableInspectorVisible: 'table-inspector-visible',
  tableInspectorWidth: 'table-inspector-width',
  tableInspectorTablePropertiesVisible: 'table-inspector-table-properties-visible',
  tableInspectorTableLinksVisible: 'table-inspector-table-links-visible',
  tableInspectorTableRecordSummaryVisible: 'table-inspector-table-record-summary-visible',
  tableInspectorTableActionsVisible: 'table-inspector-table-actions-visible',
  tableInspectorTableAdvancedVisible: 'table-inspector-table-advanced-visible',
  tableInspectorColumnPropertiesVisible: 'table-inspector-column-properties-visible',
  tableInspectorColumnDataTypeVisible: 'table-inspector-column-data-type-visible',
  tableInspectorColumnDefaultValueVisible: 'table-inspector-column-default-value-visible',
  tableInspectorColumnFormattingVisible: 'table-inspector-column-formatting-visible',
  tableInspectorColumnRecordSummaryVisible: 'table-inspector-column-record-summary-visible',
  tableInspectorColumnActionsVisible: 'table-inspector-column-actions-visible',

  // Data explorer
  dataExplorerLeftSidebarWidth: 'data-explorer-left-sidebar-width',
  dataExplorerRightSidebarWidth: 'data-explorer-right-sidebar-width',
} as const;

export const tableInspectorWidth = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorWidth,
  defaultValue: 350,
});

export const tableInspectorVisible = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorVisible,
  defaultValue: true,
});

export const tableInspectorTablePropertiesVisible = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorTablePropertiesVisible,
  defaultValue: true,
});

export const tableInspectorTableLinksVisible = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorTableLinksVisible,
  defaultValue: true,
});

export const tableInspectorTableRecordSummaryVisible = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorTableRecordSummaryVisible,
  defaultValue: false,
});

export const tableInspectorTableActionsVisible = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorTableActionsVisible,
  defaultValue: true,
});

export const tableInspectorTableAdvancedVisible = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorTableAdvancedVisible,
  defaultValue: false,
});

export const tableInspectorColumnPropertiesVisible = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorColumnPropertiesVisible,
  defaultValue: true,
});

export const tableInspectorColumnDataTypeVisible = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorColumnDataTypeVisible,
  defaultValue: true,
});

export const tableInspectorColumnDefaultValueVisible = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorColumnDefaultValueVisible,
  defaultValue: true,
});

export const tableInspectorColumnFormattingVisible = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorColumnFormattingVisible,
  defaultValue: true,
});

export const tableInspectorColumnRecordSummaryVisible = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorColumnRecordSummaryVisible,
  defaultValue: false,
});

export const tableInspectorColumnActionsVisible = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.tableInspectorColumnActionsVisible,
  defaultValue: true,
});

export const dataExplorerLeftSidebarWidth = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.dataExplorerLeftSidebarWidth,
  defaultValue: 400,
});

export const dataExplorerRightSidebarWidth = new LocalStorageStore({
  key: LOCAL_STORAGE_KEYS.dataExplorerRightSidebarWidth,
  defaultValue: 350,
});
