import TemplateInputFormatter from '../TemplateInputFormatter';

/**
 * - `bidirectional` - The test case can be formatted and parsed.
 * - `format-only` - The test case only works for formatting.
 * - `parse-only` - The test case only works for parsing.
 */
type TestCaseType = 'bidirectional' | 'format-only' | 'parse-only';

/** [withColumnIds, withColumnNames, type] */
type TestCase = [string, string, TestCaseType];

function isFormattable([, , t]: TestCase) {
  return t === 'bidirectional' || t === 'format-only';
}
function isParsable([, , t]: TestCase) {
  return t === 'bidirectional' || t === 'parse-only';
}

describe('TemplateInputFormatter', () => {
  const columns = [
    { id: 1, name: 'col1' },
    { id: 2, name: 'col2' },
    { id: 3, name: 'foo bar' },
    { id: 4, name: 'Left{brace' },
    { id: 5, name: 'Right}brace' },
    { id: 6, name: '1' },
    { id: 7, name: '99' },
    { id: 8, name: 'brace' },
  ];
  const formatter = new TemplateInputFormatter(columns);

  // prettier-ignore
  const testCases: TestCase[] = [ /*
                          <->                   bidirectional
                          -->                   format-only
                          <--                   parse-only
     with Column IDs       | with Column Names                 */
    [''                    , ''              , 'bidirectional' ],
    ['No tokens'           , 'No tokens'     , 'bidirectional' ],
    ['{1}'                 , '{col1}'        , 'bidirectional' ],
    ['{col1}'              , '{col1}'        , 'format-only' ],
    ['{nope}'              , '{nope}'        , 'bidirectional' ],
    ['{1} {2}'             , '{col1} {col2}' , 'bidirectional' ],
    ['{1} {col2'           , '{col1} {col2'  , 'bidirectional' ],
    ['{7}'                 , '{99}'          , 'bidirectional' ],
    ['{99}'                , '{99}'          , 'format-only' ],
    ['{3}'                 , '{foo bar}'     , 'bidirectional' ],
    ['{6}'                 , '{1}'           , 'bidirectional' ],
    ['{2}'                 , '{2}'           , 'parse-only' ],
    ['{2}'                 , '{col2}'        , 'bidirectional' ],
    ['{4}'                 , '{4}'           , 'bidirectional' ], // 1
    ['{5}'                 , '{5}'           , 'bidirectional' ], // 1
    ['{Left{8}'            , '{Left{brace}'  , 'bidirectional' ],
    ['{Right}brace}'       , '{Right}brace}' , 'bidirectional' ],
  ];
  // 1. Columns with braces in the names are not taken into account at all.

  test.each(testCases.filter(isFormattable))(
    'format %#',
    (withColumnIds, withColumnNames) => {
      expect(formatter.format(withColumnIds)).toBe(withColumnNames);
    },
  );

  test.each(testCases.filter(isParsable))(
    'parse %#',
    (withColumnIds, withColumnNames) => {
      expect(formatter.parse(withColumnNames).value).toBe(withColumnIds);
    },
  );
});
