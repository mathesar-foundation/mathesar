import { ImmutableMap } from '@mathesar-component-library';
import {
  prepareFieldsAsRecordSummaryInputData,
  renderTransitiveRecordSummary,
  type RecordSummariesForSheet,
} from '../recordSummaryUtils';

describe('Record Summary', () => {
  // prettier-ignore
  const fields = new ImmutableMap<number, string | number | null>([ /*
      | Column ids | cell values | */
      [  11        , 'one'       ],
      [  12        , 'two'       ],
      [  13        , null        ],
      [  14        , 1401        ], // an FK column with transitive data
      [  15        , 1501        ], // an FK column with incomplete transitive data
      [  16        , 1601        ], // an FK column with no transitive data
  ]);
  const inputData = prepareFieldsAsRecordSummaryInputData(fields);
  const transitiveData: RecordSummariesForSheet = new ImmutableMap([
    [
      '14', // <- The id of the FK column
      new ImmutableMap([
        [
          '1401', // <- The id of the record in the FK column
          'Apple-Banana', // <- The record summary for that record
        ],
      ]),
    ],
    [
      '15', // <- The id of the FK column
      // We have some input data here, but we don't have an entry with a
      // record id of 1501. We don't expect this to happen in practice, but we
      // need to handle it anyway.
      new ImmutableMap([
        [
          '9999', // <- The id of the record in the FK column
          'NOPE',
        ],
      ]),
      // Note that, for the sake of testing different scenarios, we _don't_ have
      // an entry here for FK column 16.
    ],
  ]);
  // prettier-ignore
  const testCases =
  [
  //  template         | result
    [ ''               , '' ],
    [ '{11} {12}'      , 'one two' ],
    [ '{{11} {12}}'    , '{one two}' ],
    [ '{{11}}'         , '{one}' ],
    [ '{ 11}'          , '{ 11}' ],
    [ '{11 }'          , '{11 }' ],
    [ '{99}'           , '{99}' ], // column id 99 doesn't exist
    [ '{13}'           , '(null)' ],
    [ '{14}'           , 'Apple-Banana' ],
    [ '{11} {14}'      , 'one Apple-Banana' ],
    [ '{15}'           , '1501' ],
    [ '{16}'           , '1601' ],
  ];
  test.each(testCases)(
    'renderTransitiveRecordSummary %#',
    (template, result) => {
      const recordSummary = renderTransitiveRecordSummary({
        template,
        inputData,
        transitiveData,
      });
      expect(recordSummary).toBe(result);
    },
  );
});
