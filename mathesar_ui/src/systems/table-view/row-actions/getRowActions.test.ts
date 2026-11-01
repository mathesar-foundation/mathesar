import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getRecordPageUrlByTable } from '@mathesar/routes/urls';
import { confirm } from '@mathesar/stores/confirmation';
import type { TabularData } from '@mathesar/stores/table-data';

import { getRowActions } from './getRowActions';

vi.mock('svelte-i18n', () => ({
  _: {
    subscribe(run: (translate: (id: string) => string) => void) {
      run((id) => id);
      return () => undefined;
    },
  },
}));

vi.mock('@mathesar/icons', () => ({
  iconDeleteMajor: {},
  iconDuplicateRecord: {},
  iconLinkToRecordPage: {},
  iconModalRecordView: {},
}));

vi.mock('@mathesar/routes/urls', () => ({
  getRecordPageUrlByTable: vi.fn(() => '/record/10'),
}));

vi.mock('@mathesar/stores/confirmation', () => ({
  confirm: vi.fn(),
}));

vi.mock('@mathesar/stores/tables', () => ({
  currentTablesMap: {
    subscribe(run: (tables: Map<number, { oid: number }>) => void) {
      run(new Map([[1, { oid: 1 }]]));
      return () => undefined;
    },
  },
}));

vi.mock('@mathesar/stores/toast', () => ({
  toast: { fromError: vi.fn() },
}));

vi.mock('@mathesar/systems/record-view/RecordStore', () => ({
  default: class RecordStore {},
}));

function createTabularData() {
  const row = { record: { 1: 10 } };
  const duplicateRecord = vi.fn();
  const deleteSelected = vi.fn();
  const tabularData = {
    table: { oid: 1 },
    getRecordIdFromRowId: vi.fn(() => 10),
    recordsData: {
      selectableRowsMap: {
        subscribe(run: (rows: Map<string, typeof row>) => void) {
          run(new Map([['row-1', row]]));
          return () => undefined;
        },
      },
      duplicateRecord,
      deleteSelected,
    },
  } as unknown as TabularData;
  return { tabularData, duplicateRecord, deleteSelected };
}

function getActions(
  tabularData: TabularData,
  rowIds: string[],
  permissions = {
    canDeleteRecords: true,
    canInsertRecords: true,
    canViewLinkedEntities: true,
  },
) {
  return getRowActions({
    rowIds,
    tabularData,
    modalRecordView: { open: vi.fn() } as never,
    permissions,
  });
}

describe('getRowActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns all single-row actions from one source', () => {
    const { tabularData } = createTabularData();
    const actions = getActions(tabularData, ['row-1']);

    expect(actions.map(({ label }) => label)).toEqual([
      'quick_view_record',
      'open_record',
      'duplicate_record',
      'delete_records',
    ]);
    expect(getRecordPageUrlByTable).toHaveBeenCalledOnce();
  });

  test('only returns actions valid for multiple rows', () => {
    const { tabularData } = createTabularData();
    const actions = getActions(tabularData, ['row-1', 'row-2']);

    expect(actions.map(({ label }) => label)).toEqual(['delete_records']);
  });

  test('filters actions using table permissions', () => {
    const { tabularData } = createTabularData();
    const actions = getActions(tabularData, ['row-1'], {
      canDeleteRecords: false,
      canInsertRecords: false,
      canViewLinkedEntities: false,
    });

    expect(actions).toEqual([]);
  });

  test('duplicates the selected row', () => {
    const { tabularData, duplicateRecord } = createTabularData();
    const action = getActions(tabularData, ['row-1']).find(
      ({ label }) => label === 'duplicate_record',
    );

    if (action?.type !== 'button') throw new Error('Missing duplicate action');
    action.onClick();

    expect(duplicateRecord).toHaveBeenCalledOnce();
  });

  test('deletes all selected rows after confirmation', () => {
    const { tabularData, deleteSelected } = createTabularData();
    const action = getActions(tabularData, ['row-1', 'row-2'])[0];

    if (action?.type !== 'button') throw new Error('Missing delete action');
    action.onClick();
    const [{ onProceed }] = vi.mocked(confirm).mock.calls[0] as [
      { onProceed: () => unknown },
    ];
    onProceed();

    expect(deleteSelected).toHaveBeenCalledWith(['row-1', 'row-2']);
  });
});
