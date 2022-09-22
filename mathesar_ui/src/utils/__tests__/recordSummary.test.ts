import { ImmutableMap } from '@mathesar-component-library';
import {
  renderSummaryFromFieldsAndFkData,
  renderSummaryFromValuesObject,
} from '../recordSummary';
import type { DataForRecordSummaryInFkCell } from '../recordSummaryTypes';

test.each(
  // prettier-ignore
  [
  [ '{2__9___10__21__col__22}'   , 'one' ],
  [ '({2__9___10__21__col__22})' , '(one)' ],
  [ '2__9___10__21__col__22'     , '2__9___10__21__col__22' ],
  [ '{9__9___99__99__col__99}'   , '{9__9___99__99__col__99}' ],
  [ ''                           , '' ],
],
)('renderRecordSummaryFromValuesObject %#', (template, result) => {
  const values: Record<string, string> = {
    '2__9___10__21__col__22': 'one',
  };
  expect(renderSummaryFromValuesObject(template, values)).toBe(result);
});

test.each(
  // prettier-ignore
  [
  [ ''                      , '' ],
  [ '{1} {2}'               , 'one two' ],
  [ '{4} {5}'               , 'null {5}' ],
  [ '{{1}} {2}'             , '{one} two' ],
  [ '{1 } { 1} {2{8}} {9}'  , '{1 } { 1} {2{8}} {9}' ],
  [ '{3}'                   , 'Hi!' ],
],
)('renderRecordSummaryFromFieldsAndFkData %#', (template, result) => {
  const fields = new ImmutableMap<number, string | number | null>([
    // Column ids
    //  cell values
    [1, 'one'],
    [2, 'two'],
    [3, 99], // an FK column
    [4, null],
  ]);
  const fkSummaryData = new ImmutableMap<number, DataForRecordSummaryInFkCell>([
    [
      3,
      {
        template: '{7__8__col__9}',
        data: { '7__8__col__9': 'Hi!' },
      },
    ],
  ]);
  expect(
    renderSummaryFromFieldsAndFkData(template, fields, fkSummaryData),
  ).toBe(result);
});
