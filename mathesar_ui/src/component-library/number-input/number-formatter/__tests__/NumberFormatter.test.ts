import type { Options } from '../options';
import NumberFormatter from '../NumberFormatter';

function getFormatter(partialOpts: Partial<Options> = {}): NumberFormatter {
  /**
   * We're explicitly setting a default locale and grouping here so that we
   * don't have any unexpected behavior when running the tests across different
   * machines which might be configured with different locales.
   */
  const defaultsForTestRunning = { locale: 'en-US', useGrouping: true };
  const opts = { ...defaultsForTestRunning, ...partialOpts };
  return new NumberFormatter(opts);
}

describe('parse and re-parse', () => {
  const u = undefined;
  // prettier-ignore
  const cases: [
    string,
    boolean,
    boolean,
    number | undefined,
    number | undefined,
    string,
    string,
    number | null
  ][] = [
  // locale | allowFloat
  //        |      | allowNegative
  //        |      |      | minimumFractionDigits
  //        |      |      |  | maximumFractionDigits
  //        |      |      |  |  | input        | intermediateDisplay
  //        |      |      |  |  |              |                | value
    ['en-US', true , true , u, u, ''           , ''             , null       ],
    ['en-US', true , true , u, u, ','          , ''             , null       ],
    ['en-US', true , true , u, u, 'a'          , ''             , null       ],
    ['en-US', true , true , u, u, 'abc'        , ''             , null       ],
    ['en-US', true , true , u, u, 'NaN'        , ''             , null       ],
    ['en-US', true , true , u, u, 'Infinity'   , ''             , null       ],
    ['en-US', true , true , u, u, ' '          , ''             , null       ],
    ['en-US', true , true , u, u, '-'          , '-'            , null       ], // see 4
    ['en-US', true , false, u, u, '-'          , ''             , null       ],
    ['en-US', true , true , u, u, '-a'         , '-'            , null       ],
    ['en-US', true , true , u, u, 'a-'         , '-'            , null       ],
    ['en-US', true , true , u, u, '-0'         , '-0'           , -0         ],
    ['en-US', true , true , u, u, '-.'         , '-0.'          , -0         ],
    ['en-US', true , true , u, u, '-0.'        , '-0.'          , -0         ],
    ['en-US', true , true , u, u, '-0.0'       , '-0.0'         , -0         ],
    ['en-US', true , true , u, u, '-0.0a'      , '-0.0'         , -0         ],
    ['en-US', true , true , u, u, '-0.0a0'     , '-0.00'        , -0         ],
    ['en-US', true , true , u, u, '-0.0a1'     , '-0.01'        , -0.01      ],
    ['en-US', true , true , u, u, '0'          , '0'            , 0          ],
    ['en-US', true , true , u, u, '0.'         , '0.'           , 0          ],
    ['en-US', false, true , u, u, '0.'         , '0'            , 0          ],
    ['en-US', true , true , u, u, '.-'         , '0.'           , 0          ],
    ['en-US', true , true , u, u, '0.0'        , '0.0'          , 0          ],
    ['en-US', true , true , u, u, '.00000'     , '0.00000'      , 0          ], // See 2
    ['en-US', true , true , u, u, '.'          , '0.'           , 0          ],
    ['en-US', true , true , u, u, '.0'         , '0.0'          , 0          ],
    ['en-US', true , true , u, u, '-.1'        , '-0.1'         , -0.1       ],
    ['en-US', true , true , u, u, '.1'         , '0.1'          , 0.1        ],
    ['en-US', true , true , u, u, '.1.'        , '0.1'          , 0.1        ],
    ['en-US', true , true , u, u, '.1.2'       , '0.12'         , 0.12       ],
    ['en-US', true , true , u, u, '1.2'        , '1.2'          , 1.2        ],
    ['en-US', true , true , u, u, '1.2.'       , '1.2'          , 1.2        ],
    ['en-US', true , true , u, u, '1..2'       , '1.2'          , 1.2        ],
    ['en-US', true , true , u, u, '1.2.3'      , '1.23'         , 1.23       ],
    ['en-US', true , true , u, u, '-1'         , '-1'           , -1         ],
    ['en-US', true , true , u, u, '-a1'        , '-1'           , -1         ],
    ['en-US', true , true , u, u, '-1-'        , '-1'           , -1         ],
    ['en-US', true , true , u, u, '--1'        , '-1'           , -1         ],
    ['en-US', true , true , u, u, '\u20121'    , '-1'           , -1         ], // See 3
    ['en-US', true , true , u, u, '1'          , '1'            , 1          ],
    ['en-US', true , true , u, u, '1,'         , '1'            , 1          ],
    ['en-US', true , true , u, u, '+1'         , '1'            , 1          ],
    ['en-US', true , true , u, u, ' 1 '        , '1'            , 1          ],
    ['en-US', true , true , u, u, 'a1a'        , '1'            , 1          ],
    ['en-US', true , true , u, u, '1-'         , '1'            , 1          ],
    ['en-US', true , true , u, u, '12345'      , '12,345'       , 12345      ],
    ['en-US', true , true , u, u, '12,345'     , '12,345'       , 12345      ],
    ['en-US', true , true , u, u, '1,2345'     , '12,345'       , 12345      ],
    ['en-US', true , true , u, u, '1234567.89' , '1,234,567.89' , 1234567.89 ],
    ['en-US', true , true , u, u, '.123456789' , '0.123456789'  , 0.123456789],
    ['en-US', true , true , u, u, '-1-2-'      , '-12'          , -12        ],
    ['en-US', true , true , u, u, '1e2'        , '12'           , 12         ], // See 1
    ['en-US', true , true , u, u, '1,,2'       , '12'           , 12         ],
    ['en-US', true , true , u, u, '1-2'        , '12'           , 12         ],
    ['en-US', true , true , u, u, '12-'        , '12'           , 12         ],
    ['en-US', true , true , u, u, '1-2-'       , '12'           , 12         ],
    ['de-DE', true , true , u, u, '2..3'       , '23'           , 23         ],
    ['de-DE', true , true , u, u, '2,,3'       , '2,3'          , 2.3        ],
    ['de-DE', true , true , u, u, '1.2.3.4'    , '1.234'        , 1234       ],
    ['de-DE', true , true , u, u, '1,2,3,4'    , '1,234'        , 1.234      ],
    ['li'   , true , true , u, u, '-1'         , '-1'           , -1         ], // See 5
    ['en-US', true , true , 2, 2, '1'          , '1'            , 1          ],
    ['en-US', true , true , 2, 2, '1.2'        , '1.2'          , 1.2        ],
    ['en-US', true , true , 2, 2, '1.229'      , '1.23'         , 1.23       ],
    ['en-US', true , true , 2, 2, '-1.229'     , '-1.23'        , -1.23      ],
    ['en-US', true , true , u, 2, '1.229'      , '1.23'         , 1.23       ],
    ['en-US', true , true , u, 2, '1.00'       , '1.00'         , 1          ],
    ['en-US', true , true , 2, u, '1'          , '1'            , 1          ],
    ['en-US', true , true , 2, u, '1.0'        , '1.0'          , 1          ],
    ['en-US', true , true , 2, u, '1.229'      , '1.229'        , 1.229      ],

    // 1. Entering numbers in scientific notation is not yet supported. We could
    //    add this in the future.
    //
    // 2. Important to allow the user to manually enter numbers like "0.000001".
    //
    // 3. Unicode minus sign will be converted to ASCII hyphen.
    //
    // 4. Important to allow the user to manually enter negative numbers like
    //    "-1".
    //
    // 5. Important because locale will format using a Unicode minus sign but
    //    we're overriding it with a hyphen.
  ];
  test.each(cases)(
    'case %#',
    (
      locale,
      allowFloat,
      allowNegative,
      minimumFractionDigits,
      maximumFractionDigits,
      input,
      expectedIntermediateDisplay,
      expectedValue,
    ) => {
      const formatter = getFormatter({
        locale,
        allowFloat,
        allowNegative,
        minimumFractionDigits,
        maximumFractionDigits,
      });
      const parsed = formatter.parse(input);
      expect(parsed.value).toEqual(expectedValue);
      expect(parsed.intermediateDisplay).toEqual(expectedIntermediateDisplay);

      // Ensure that the parsing is idempotent
      const reParsed = formatter.parse(parsed.intermediateDisplay);
      expect(reParsed.value).toEqual(expectedValue);
      expect(reParsed.intermediateDisplay).toEqual(expectedIntermediateDisplay);
    },
  );
});
