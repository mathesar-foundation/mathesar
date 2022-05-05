import DurationFormatter from '../DurationFormatter';
import DurationSpecification from '../DurationSpecification';
import type { DurationConfig } from '../DurationSpecification';

describe('parse', () => {
  // prettier-ignore
  const successScenarios: [string, DurationConfig, string, string][] = [
    // input             , config                 , formatted value  , value
    [ '3'                , { max: 'm', min: 's'  }, '00:03'          , 'PT3S'              ],
    [ '.'                , { max: 'm', min: 's'  }, '00:00'          , 'P0D'               ],
    [ '3:12'             , { max: 'm', min: 's'  }, '03:12'          , 'PT3M12S'           ],
    [ '3:12:33'          , { max: 'd', min: 's'  }, '0:03:12:33'     , 'PT3H12M33S'        ],
    [ '3:12:33'          , { max: 'd', min: 'ms' }, '0:03:12:33.000' , 'PT3H12M33S'        ],
    [ '3:12:33.23'       , { max: 'd', min: 'ms' }, '0:03:12:33.230' , 'PT3H12M33.23S'     ],
    [ '2:3:12:33.23'     , { max: 'd', min: 'ms' }, '2:03:12:33.230' , 'P2DT3H12M33.23S'   ],
    [ '25:61:61.100'     , { max: 'd', min: 'ms' }, '1:02:02:01.100' , 'PT25H61M61.1S'     ],
    [ ':23.'             , { max: 'm', min: 's'  }, '00:23'          , 'PT23S'             ],
    [ ':.'               , { max: 'm', min: 's'  }, '00:00'          , 'P0D'               ],
  ];

  // prettier-ignore
  const failureScenarios: [string, DurationConfig][] = [
    [ '3:12:33'  , { max: 'm', min: 's' } ],
    [ '::'       , { max: 'm', min: 's' } ],
  ];

  test.each(successScenarios)(
    'with userInput=%s config=%s',
    (input, { min, max }, formattedValue, expectedValue) => {
      const formatter = new DurationFormatter(
        new DurationSpecification({ min, max }),
      );
      const parsed = formatter.parse(input);
      expect(parsed.value).toEqual(expectedValue);
      expect(parsed.intermediateDisplay).toEqual(input);

      expect(formatter.format(expectedValue)).toEqual(formattedValue);
    },
  );

  test.each(failureScenarios)(
    'with userInput=%s config=%s',
    (input, { min, max }) => {
      const formatter = new DurationFormatter(
        new DurationSpecification({ min, max }),
      );
      expect(() => formatter.parse(input)).toThrow();
    },
  );

  test('empty string', () => {
    const formatter = new DurationFormatter(
      new DurationSpecification({ min: 'm', max: 's' }),
    );
    expect(formatter.parse('').value).toBeNull();
  });
});

describe('format', () => {
  // prettier-ignore
  const entries: [string, DurationConfig, string][] = [
    [ 'P1D'      , { max: 'm' , min: 's'  }, '1440:00'  ],
    [ 'P1D'      , { max: 'ms', min: 'ms' }, '86400000' ],
    [ 'PT3601S'  , { max: 'm' , min: 's'  }, '60:01'    ],
    [ 'PT3601S'  , { max: 'h' , min: 's'  }, '01:00:01' ],
  ];

  test.each(entries)(
    'with userInput=%s config=%s',
    (canonicalInput, { min, max }, expectedValue) => {
      const formatter = new DurationFormatter(
        new DurationSpecification({ min, max }),
      );
      expect(formatter.format(canonicalInput)).toEqual(expectedValue);
    },
  );
});
