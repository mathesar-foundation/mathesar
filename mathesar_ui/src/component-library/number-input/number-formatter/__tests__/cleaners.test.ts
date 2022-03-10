import {
  removeExtraneousMinusSigns,
  factoryToRemoveExtraneousDecimalSeparators,
  factoryToPrependShorthandDecimalWithZero,
  factoryToNormalize,
} from '../cleaners';

test.each([
  ['', ''],
  ['.', '.'],
  ['...', '.'],
  ['ab', 'ab'],
  ['a.b', 'a.b'],
  ['ab.', 'ab.'],
  ['ab..', 'ab.'],
  ['..ab', '.ab'],
  ['a..b', 'a.b'],
  ['.a.b.c.', '.abc'],
])('removeExtraneousDecimalSeparators, %s', (input, output) => {
  const clean = factoryToRemoveExtraneousDecimalSeparators({
    decimalSeparator: '.',
  });
  expect(clean(input)).toBe(output);
});

test.each([
  ['', ''],
  ['-', '-'],
  ['---', '-'],
  ['12', '12'],
  ['-12', '-12'],
  ['--12', '-12'],
  ['1-2', '12'],
  ['12-', '12'],
  ['12--', '12'],
  ['-1-2-3', '-123'],
])('removeExtraneousMinusSigns, %s', (input, output) => {
  expect(removeExtraneousMinusSigns(input)).toBe(output);
});

test.each([
  ['.', '0.'],
  ['-.', '-0.'],
  ['1.', '1.'],
  ['0.', '0.'],
])('prependShorthandDecimalWithZero, %s', (input, output) => {
  const clean = factoryToPrependShorthandDecimalWithZero({
    decimalSeparator: '.',
  });
  expect(clean(input)).toBe(output);
});

test.each(
  // prettier-ignore
  [
    // decimalSeparator
    //    allowFloat
    //           allowNegative
    //                  input               output
    ['.', true,  true,  ''                , ''      ],
    ['.', true,  true,  '.'               , '0.'    ],
    ['.', true,  true,  '-'               , '-'     ],
    ['.', true,  true,  '-.'              , '-0.'   ],
    ['.', true,  true,  '.-'              , '0.'    ],
    ['.', true,  true,  '-.3'             , '-0.3'  ],
    ['.', true,  true,  '1'               , '1'     ],
    ['.', true,  true,  'a1a'             , '1'     ],
    ['.', true,  true,  'abc'             , ''      ],
    ['.', true,  true,  'NaN'             , ''      ],
    ['.', true,  true,  ' 1 '             , '1'     ],
    ['.', true,  true,  '--1'             , '-1'    ],
    ['.', true,  true,  '-1-'             , '-1'    ],
    ['.', true,  true,  '9-1'             , '91'    ],
    ['.', true,  true,  '-9-1-'           , '-91'   ],
    ['.', true,  true,  '91-'             , '91'    ],
    ['.', true,  true,  '\u20121'         , '-1'    ],
    ['.', true,  true,  '\u2012\u2013-1-' , '-1'    ],
    ['.', true,  true,  '+1'              , '1'     ],
    ['.', true,  true,  '2e7'             , '27'    ],
    ['.', true,  true,  '-0'              , '-0'    ],
    ['.', true,  true,  '-0.'             , '-0.'   ],
    ['.', true,  true,  '-0.00'           , '-0.00' ],
    ['.', true,  true,  '-0.00a'          , '-0.00' ],
    ['.', true,  true,  '.3'              , '0.3'   ],
    ['.', true,  true,  '.3.'             , '0.3'   ],
    ['.', true,  true,  '2.3'             , '2.3'   ],
    ['.', true,  true,  '2..3'            , '2.3'   ],
    ['.', true,  true,  '.2.3.'           , '0.23'  ],
    ['.', true,  true,  '2,,3'            , '23'    ],
    ['.', true,  true,  '1.2.3.4'         , '1.234' ],
    ['.', true,  true,  '1,2,3,4'         , '1234'  ],
    [',', true,  true,  '2..3'            , '23'    ],
    [',', true,  true,  '2,,3'            , '2.3'   ],
    [',', true,  true,  '1.2.3.4'         , '1234'  ],
    [',', true,  true,  '1,2,3,4'         , '1.234' ],
    ['.', false, true,  '123.4'           , '1234'  ],
    ['.', true,  false, '-123.4'          , '123.4' ],
    ['.', false, false, '-123.4'          , '1234'  ],
  ],
)(
  'clean decimal="%s" allowFloat=%o allowNegative=%o input="%s"',
  (decimalSeparator, allowFloat, allowNegative, input, output) => {
    const normalize = factoryToNormalize({
      decimalSeparator,
      allowFloat,
      allowNegative,
    });
    expect(normalize(input)).toBe(output);
  },
);
