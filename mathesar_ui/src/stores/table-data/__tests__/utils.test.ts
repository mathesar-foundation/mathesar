import { ImmutableMap } from '@mathesar/component-library';
import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
import type { RowStatus } from '../meta';
import type { CellKey, RowKey } from '../utils';
import { ROW_HAS_CELL_ERROR_MSG, getRowStatus } from '../utils';

describe('getRowStatus', () => {
  interface TestCase {
    label: string;
    cellClientErrors: [CellKey, string[]][];
    cellModification: [CellKey, RequestStatus][];
    rowCreation: [RowKey, RequestStatus][];
    rowDeletion: [RowKey, RequestStatus][];
    result: [RowKey, RowStatus][];
  }
  const m = ROW_HAS_CELL_ERROR_MSG;
  const testCases: TestCase[] = [
    // {
    //   label: 'All empty',
    //   cellClientErrors: [],
    //   cellModification: [],
    //   rowCreation: [],
    //   rowDeletion: [],
    //   result: [],
    // },
    {
      label: 'Complex',
      cellClientErrors: [['300::1', ['Client error']]],
      // cellClientErrors: [],
      cellModification: [
        ['1::1', { state: 'success' }],
        ['1::2', { state: 'processing' }],
        ['1::3', { state: 'failure', errors: ['foo'] }],
        ['2::9', { state: 'failure', errors: ['bar'] }],
        ['3::7', { state: 'processing' }],
        ['4::5', { state: 'processing' }],
        ['5::5', { state: 'success' }],
      ],
      rowCreation: [
        ['2', { state: 'success' }],
        ['3', { state: 'success' }],
        ['101', { state: 'success' }],
        ['102', { state: 'success' }],
        ['103', { state: 'processing' }],
      ],
      rowDeletion: [
        ['102', { state: 'failure', errors: ['Unable to delete row.'] }],
        ['201', { state: 'processing' }],
        ['202', { state: 'failure', errors: ['Unable to delete row.'] }],
      ],
      result: [
        ['300', { errorsFromWholeRowAndCells: [m] }],
        ['1', { wholeRowState: undefined, errorsFromWholeRowAndCells: [m] }],
        ['2', { wholeRowState: 'success', errorsFromWholeRowAndCells: [m] }],
        ['3', { wholeRowState: 'success', errorsFromWholeRowAndCells: [] }],
        ['101', { wholeRowState: 'success', errorsFromWholeRowAndCells: [] }],
        [
          // Deletion status trumps creation status
          '102',
          {
            wholeRowState: 'failure',
            errorsFromWholeRowAndCells: ['Unable to delete row.'],
          },
        ],
        [
          '103',
          { wholeRowState: 'processing', errorsFromWholeRowAndCells: [] },
        ],
        [
          '201',
          { wholeRowState: 'processing', errorsFromWholeRowAndCells: [] },
        ],
        [
          '202',
          {
            wholeRowState: 'failure',
            errorsFromWholeRowAndCells: ['Unable to delete row.'],
          },
        ],
      ],
    },
  ];
  test.each(testCases)('getRowStatus %#', (testCase) => {
    expect([
      ...getRowStatus({
        cellClientSideErrors: new ImmutableMap(testCase.cellClientErrors),
        cellModificationStatus: new ImmutableMap(testCase.cellModification),
        rowCreationStatus: new ImmutableMap(testCase.rowCreation),
        rowDeletionStatus: new ImmutableMap(testCase.rowDeletion),
      }).entries(),
    ]).toEqual(testCase.result);
  });
});
