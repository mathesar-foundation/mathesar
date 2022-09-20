import { ImmutableMap } from '@mathesar-component-library';
import {
  renderRecordSummaryFromValuesObject,
  renderRecordSummaryFromFieldsMap,
} from '../recordSummary';

test.each(
  // prettier-ignore
  [
  [ ''                      , '' ],
  [ '{1} {2}'               , 'one two' ],
  [ '{4} {5}'               , '{4} {5}' ],
  [ '{{1}} {2}'             , '{one} two' ],
  [ '{1 } { 1} {2{3}} {4}'  , '{1 } { 1} {2{3}} {4}' ],
],
)('renderRecordSummaryFromFieldsMap %#', (template, result) => {
  const values = new ImmutableMap([
    [1, 'one'],
    [2, 'two'],
  ]);
  expect(renderRecordSummaryFromFieldsMap(template, values)).toBe(result);
});

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
  expect(renderRecordSummaryFromValuesObject(template, values)).toBe(result);
});
