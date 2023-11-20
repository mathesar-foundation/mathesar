import {
  removeExtraneousMinusSigns,
  factoryToRemoveExtraneousDecimalSeparators,
  factoryToPrependShorthandDecimalWithZero,
  factoryToSimplify,
  removePrecedingZeros,
  removeTrailingDecimalZeros,
  removeTrailingDecimalSeparator,
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
  ['.1', '0.1'],
  ['-.', '-0.'],
  ['1.', '1.'],
  ['0.', '0.'],
])('prependShorthandDecimalWithZero, %s', (input, output) => {
  const clean = factoryToPrependShorthandDecimalWithZero({
    decimalSeparator: '.',
  });
  expect(clean(input)).toBe(output);
});

test.each([
  ['.', '.'],
  ['0.1', '0.1'],
  ['-0.1', '-0.1'],
  ['-00.1', '-0.1'],
  ['0.', '0.'],
  ['00.', '0.'],
  ['000', '0'],
  ['00.0', '0.0'],
  ['00.000', '0.000'],
  ['0', '0'],
  ['-01', '-1'],
  ['01', '1'],
  ['0001', '1'],
  ['000100000', '100000'],
  ['0001000001', '1000001'],
  ['-000100000.000', '-100000.000'],
])('removePrecedingZeros, %s', (input, output) => {
  expect(removePrecedingZeros(input)).toBe(output);
});

test.each([
  ['1000', '1000'],
  ['1.0001', '1.0001'],
  ['1.10001', '1.10001'],
  ['1.0001000', '1.0001'],
  ['1.10001000', '1.10001'],
  ['1.000', '1.'],
  ['0', '0'],
])('removeTrailingDecimalZeros, %s', (input, output) => {
  expect(removeTrailingDecimalZeros(input)).toBe(output);
});

test.each([
  ['0', '0'],
  ['0.', '0'],
  ['0.1', '0.1'],
])('removeTrailingDecimalSeparator, %s', (input, output) => {
  expect(removeTrailingDecimalSeparator(input)).toBe(output);
});

test.each(
  // prettier-ignore
  [
    // decimalSeparator
    //    allowFloat
    //           allowNegative
    //                  input               output
    ['.', true,  true,  false,  ''                , ''      ],
    ['.', true,  true,  false,  '.'               , '0.'    ],
    ['.', true,  true,  false,  '-'               , '-'     ],
    ['.', true,  true,  false,  '-.'              , '-0.'   ],
    ['.', true,  true,  false,  '.-'              , '0.'    ],
    ['.', true,  true,  false,  '-.3'             , '-0.3'  ],
    ['.', true,  true,  false,  '1'               , '1'     ],
    ['.', true,  true,  false,  'a1a'             , '1'     ],
    ['.', true,  true,  false,  'abc'             , ''      ],
    ['.', true,  true,  false,  'NaN'             , ''      ],
    ['.', true,  true,  false,  ' 1 '             , '1'     ],
    ['.', true,  true,  false,  '01'              , '1'     ],
    ['.', true,  true,  false,  '000'             , '0'     ],
    ['.', true,  true,  false,  '--1'             , '-1'    ],
    ['.', true,  true,  false,  '-1-'             , '-1'    ],
    ['.', true,  true,  false,  '9-1'             , '91'    ],
    ['.', true,  true,  false,  '-9-1-'           , '-91'   ],
    ['.', true,  true,  false,  '91-'             , '91'    ],
    ['.', true,  true,  false,  '\u20121'         , '-1'    ],
    ['.', true,  true,  false,  '\u2012\u2013-1-' , '-1'    ],
    ['.', true,  true,  false,  '+1'              , '1'     ],
    ['.', true,  true,  false,  '2e7'             , '27'    ],
    ['.', true,  true,  false,  '-0'              , '-0'    ],
    ['.', true,  true,  false,  '-0.'             , '-0.'   ],
    ['.', true,  true,  false,  '-0.00'           , '-0.00' ],
    ['.', true,  true,  false,  '-0.00a'          , '-0.00' ],
    ['.', true,  true,  false,  '.3'              , '0.3'   ],
    ['.', true,  true,  false,  '.3.'             , '0.3'   ],
    ['.', true,  true,  false,  '2.3'             , '2.3'   ],
    ['.', true,  true,  false,  '2..3'            , '2.3'   ],
    ['.', true,  true,  false,  '.2.3.'           , '0.23'  ],
    ['.', true,  true,  false,  '2,,3'            , '23'    ],
    ['.', true,  true,  false,  '1.2.3.4'         , '1.234' ],
    ['.', true,  true,  false,  '1,2,3,4'         , '1234'  ],
    [',', true,  true,  false,  '2..3'            , '23'    ],
    [',', true,  true,  false,  '2,,3'            , '2.3'   ],
    [',', true,  true,  false,  '1.2.3.4'         , '1234'  ],
    [',', true,  true,  false,  '1,2,3,4'         , '1.234' ],
    ['.', false, true,  false,  '123.4'           , '1234'  ],
    ['.', true,  false,  false, '-123.4'          , '123.4' ],
    ['.', false, false,  false, '-123.4'          , '1234'  ],
  ],
)(
  'simplify decimal="%s" allowFloat=%o allowNegative=%o allowScientificNotation=%o input="%s"',
  (
    decimalSeparator,
    allowFloat,
    allowNegative,
    allowScientificNotation,
    input,
    output,
  ) => {
    const simplify = factoryToSimplify({
      decimalSeparator,
      allowFloat,
      allowNegative,
      allowScientificNotation,
    });
    expect(simplify(input)).toBe(output);
  },
);

test.each([
  // ... existing test cases ...

  // Test cases for scientific notation
  ['.', true, true, true, '3.456e11', '3.456e11'],
  ['.', true, true, true, '1.23e5', '1.23e5'],
  ['.', true, true, true, '-2.5e8', '-2.5e8'],
  ['.', true, true, true, '5e0', '5e0'],
])(
  'simplify decimal="%s" allowFloat=%o allowNegative=%o, allowScientificNotation=%o input="%s"',
  (
    decimalSeparator,
    allowFloat,
    allowNegative,
    allowScientificNotation,
    input,
    output,
  ) => {
    const simplify = factoryToSimplify({
      decimalSeparator,
      allowFloat,
      allowNegative,
      allowScientificNotation,
    });
    expect(simplify(input)).toBe(output);
  },
);
