import { get, readable } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import { ImmutableMap } from '@mathesar/component-library';
import { RpcError } from '@mathesar/packages/json-rpc-client-builder';

import type { RowStatus } from '../meta';
import {
  type CellKey,
  type ClientSideCellError,
  type RowKey,
  getRowStatus,
} from '../utils';

vi.mock('svelte-i18n', () => {
  const translate = (s: string) => s;
  return { _: readable(translate) };
});

describe('getRowStatus', () => {
  interface TestCase {
    label: string;
    cellClientErrors: [CellKey, ClientSideCellError[]][];
    cellModification: [CellKey, RequestStatus<RpcError[]>][];
    rowCreation: [RowKey, RequestStatus<RpcError[]>][];
    rowDeletion: [RowKey, RequestStatus<RpcError[]>][];
    result: [RowKey, RowStatus][];
  }
  const c = RpcError.fromAnything('columns_cannot_be_null');
  const m = RpcError.fromAnything('row_contains_cell_with_error');
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
      cellClientErrors: [
        [
          '300::1',
          [
            {
              code: 101,
              message: 'Client Error',
              column: {
                id: 1,
                name: 'c',
                description: null,
                type: 'text',
                type_options: null,
                nullable: false,
                primary_key: false,
                default: null,
                has_dependents: false,
                current_role_priv: [],
                metadata: null,
              },
            },
          ],
        ],
      ],
      cellModification: [
        ['1::1', { state: 'success' }],
        ['1::2', { state: 'processing' }],
        ['1::3', { state: 'failure', errors: [RpcError.fromAnything('foo')] }],
        ['2::9', { state: 'failure', errors: [RpcError.fromAnything('bar')] }],
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
        [
          '102',
          {
            state: 'failure',
            errors: [RpcError.fromAnything('Unable to delete row.')],
          },
        ],
        ['201', { state: 'processing' }],
        [
          '202',
          {
            state: 'failure',
            errors: [RpcError.fromAnything('Unable to delete row.')],
          },
        ],
      ],
      result: [
        ['300', { errorsFromWholeRowAndCells: [c] }],
        ['1', { wholeRowState: undefined, errorsFromWholeRowAndCells: [m] }],
        ['2', { wholeRowState: 'success', errorsFromWholeRowAndCells: [m] }],
        ['3', { wholeRowState: 'success', errorsFromWholeRowAndCells: [] }],
        ['101', { wholeRowState: 'success', errorsFromWholeRowAndCells: [] }],
        [
          // Deletion status trumps creation status
          '102',
          {
            wholeRowState: 'failure',
            errorsFromWholeRowAndCells: [
              RpcError.fromAnything('Unable to delete row.'),
            ],
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
            errorsFromWholeRowAndCells: [
              RpcError.fromAnything('Unable to delete row.'),
            ],
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
