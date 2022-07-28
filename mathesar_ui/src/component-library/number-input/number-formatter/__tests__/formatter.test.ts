import { makeFormatter } from '../formatter';
import { getDerivedOptions } from '../options';

test.each(
  // prettier-ignore
  [
  // locale
  //        | allowFloat
  //        |      | allowNegative
  //        |      |      | useGrouping
  //        |      |      |      | forceTrailingDecimal
  //        |      |      |      |      | minimumFractionDigits
  //        |      |      |      |      |   | maximumFractionDigits
  //        |      |      |      |      |   |   | input      | output
    ['en-US', true,  true,  true,  false, 0, 20, 1,           '1'            ],
    ['en-US', true,  true,  true,  false, 0, 20, 0,           '0'            ],
    ['en-US', true,  true,  true,  false, 0, 20, -0,          '-0'           ], // See 1
    ['en-US', true,  true,  true,  false, 0, 20, -1,          '-1'           ],
    ['en-US', true,  true,  true,  false, 0, 20, 1.1,         '1.1'          ],
    ['en-US', true,  true,  true,  false, 0, 20, 0.1,         '0.1'          ],
    ['en-US', true,  true,  true,  false, 0, 20, -0.1,        '-0.1'         ],
    ['en-US', true,  true,  true,  false, 0, 20, 1.0,         '1'            ],
    ['en-US', true,  true,  true,  false, 0, 20, 1234,        '1,234'        ],
    ['en-US', true,  true,  true,  false, 0, 20, 0.123456789, '0.123456789'  ],
    ['en-US', true,  true,  true,  false, 0, 20, 1234567.89,  '1,234,567.89' ],
    ['en-US', true,  true,  false, false, 0, 20, 1234567.89,  '1234567.89'   ],
    ['de-DE', true,  true,  true,  false, 0, 20, 1234567.89,  '1.234.567,89' ],
    ['en-US', true,  true,  true,  false, 5, 20, 1.1,         '1.10000'      ],
    ['en-US', true,  true,  true,  false, 2, 2 , 1.1,         '1.10'         ],
    ['en-US', true,  true,  true,  false, 2, 2 , 1.559,       '1.56'         ],
  ],
  // 1. Edge case. Intl.NumberFormat accepts `signDisplay: negative` to format
  //    negative zero without a sign, but it's an experimental feature and we
  //    haven't implemented `signDisplay` for our options yet. Negative zero and
  //    zero are actually different values in JS, even though they are
  //    considered "equal".
)(
  'format case# %# - %s',
  (
    locale,
    allowFloat,
    allowNegative,
    useGrouping,
    forceTrailingDecimal,
    minimumFractionDigits,
    maximumFractionDigits,
    input,
    output,
  ) => {
    const options = {
      locale,
      allowFloat,
      allowNegative,
      useGrouping,
      forceTrailingDecimal,
      minimumFractionDigits,
      maximumFractionDigits,
    };
    const format = makeFormatter(getDerivedOptions(options));
    expect(format(input)).toBe(output);
  },
);

test('format, errors', () => {
  const defaultOptions = {
    locale: 'en-US',
    allowFloat: false,
    allowNegative: true,
    useGrouping: true,
    forceTrailingDecimal: false,
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
  };

  const formatInteger = makeFormatter(
    getDerivedOptions({ ...defaultOptions, allowFloat: false }),
  );
  expect(() => {
    formatInteger(1.2);
  }).toThrow();

  const formatPositive = makeFormatter(
    getDerivedOptions({ ...defaultOptions, allowNegative: false }),
  );
  expect(() => {
    formatPositive(-1);
  }).toThrow();
  expect(() => {
    formatPositive(-0);
  }).toThrow();
});
