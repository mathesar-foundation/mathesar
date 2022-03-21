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
  // prettier-ignore
  const localeEnUs: [string, boolean, boolean, string, string, number | null][] = [
  // locale   allowFloat
  //                  allowNegative
  //                          input          intermediateDisplay
  //                                                          value
    ['en-US', true  , true  , ''           , ''             , null       ],
    ['en-US', true  , true  , ','          , ''             , null       ],
    ['en-US', true  , true  , 'a'          , ''             , null       ],
    ['en-US', true  , true  , 'abc'        , ''             , null       ],
    ['en-US', true  , true  , 'NaN'        , ''             , null       ],
    ['en-US', true  , true  , 'Infinity'   , ''             , null       ],
    ['en-US', true  , true  , ' '          , ''             , null       ],
    ['en-US', true  , true  , '-'          , '-'            , null       ], // see 4
    ['en-US', true  , false , '-'          , ''             , null       ],
    ['en-US', true  , true  , '-a'         , '-'            , null       ],
    ['en-US', true  , true  , 'a-'         , '-'            , null       ],
    ['en-US', true  , true  , '-0'         , '-0'           , -0         ],
    ['en-US', true  , true  , '-.'         , '-0.'          , -0         ],
    ['en-US', true  , true  , '-0.'        , '-0.'          , -0         ],
    ['en-US', true  , true  , '-0.0'       , '-0.0'         , -0         ],
    ['en-US', true  , true  , '-0.0a'      , '-0.0'         , -0         ],
    ['en-US', true  , true  , '-0.0a0'     , '-0.00'        , -0         ],
    ['en-US', true  , true  , '-0.0a1'     , '-0.01'        , -0.01      ],
    ['en-US', true  , true  , '0'          , '0'            , 0          ],
    ['en-US', true  , true  , '0.'         , '0.'           , 0          ],
    ['en-US', false , true  , '0.'         , '0'            , 0          ],
    ['en-US', true  , true  , '.-'         , '0.'           , 0          ],
    ['en-US', true  , true  , '0.0'        , '0.0'          , 0          ],
    ['en-US', true  , true  , '.00000'     , '0.00000'      , 0          ], // See 2
    ['en-US', true  , true  , '.'          , '0.'           , 0          ],
    ['en-US', true  , true  , '.0'         , '0.0'          , 0          ],
    ['en-US', true  , true  , '-.1'        , '-0.1'         , -0.1       ],
    ['en-US', true  , true  , '.1'         , '0.1'          , 0.1        ],
    ['en-US', true  , true  , '.1.'        , '0.1'          , 0.1        ],
    ['en-US', true  , true  , '.1.2'       , '0.12'         , 0.12       ],
    ['en-US', true  , true  , '1.2'        , '1.2'          , 1.2        ],
    ['en-US', true  , true  , '1.2.'       , '1.2'          , 1.2        ],
    ['en-US', true  , true  , '1..2'       , '1.2'          , 1.2        ],
    ['en-US', true  , true  , '1.2.3'      , '1.23'         , 1.23       ],
    ['en-US', true  , true  , '-1'         , '-1'           , -1         ],
    ['en-US', true  , true  , '-a1'        , '-1'           , -1         ],
    ['en-US', true  , true  , '-1-'        , '-1'           , -1         ],
    ['en-US', true  , true  , '--1'        , '-1'           , -1         ],
    ['en-US', true  , true  , '\u20121'    , '-1'           , -1         ], // See 3
    ['en-US', true  , true  , '1'          , '1'            , 1          ],
    ['en-US', true  , true  , '1,'         , '1'            , 1          ],
    ['en-US', true  , true  , '+1'         , '1'            , 1          ],
    ['en-US', true  , true  , ' 1 '        , '1'            , 1          ],
    ['en-US', true  , true  , 'a1a'        , '1'            , 1          ],
    ['en-US', true  , true  , '1-'         , '1'            , 1          ],
    ['en-US', true  , true  , '12345'      , '12,345'       , 12345      ],
    ['en-US', true  , true  , '12,345'     , '12,345'       , 12345      ],
    ['en-US', true  , true  , '1,2345'     , '12,345'       , 12345      ],
    ['en-US', true  , true  , '1234567.89' , '1,234,567.89' , 1234567.89 ],
    ['en-US', true  , true  , '.123456789' , '0.123456789'  , 0.123456789],
    ['en-US', true  , true  , '-1-2-'      , '-12'          , -12        ],
    ['en-US', true  , true  , '1e2'        , '12'           , 12         ], // See 1
    ['en-US', true  , true  , '1,,2'       , '12'           , 12         ],
    ['en-US', true  , true  , '1-2'        , '12'           , 12         ],
    ['en-US', true  , true  , '12-'        , '12'           , 12         ],
    ['en-US', true  , true  , '1-2-'       , '12'           , 12         ],
    ['de-DE', true  , true  , '2..3'       , '23'           , 23         ],
    ['de-DE', true  , true  , '2,,3'       , '2,3'          , 2.3        ],
    ['de-DE', true  , true  , '1.2.3.4'    , '1.234'        , 1234       ],
    ['de-DE', true  , true  , '1,2,3,4'    , '1,234'        , 1.234      ],
    ['li'   , true  , true  , '-1'         , '-1'           , -1         ], // See 5

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
  test.each(localeEnUs)(
    'with locale=%s, input="%s"',
    (
      locale,
      allowFloat,
      allowNegative,
      input,
      expectedIntermediateDisplay,
      expectedValue,
    ) => {
      const formatter = getFormatter({ locale, allowFloat, allowNegative });
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
