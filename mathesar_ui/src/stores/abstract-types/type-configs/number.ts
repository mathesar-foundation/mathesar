import type { AbstractTypeConfiguration } from '../types.d';

const numberType: AbstractTypeConfiguration = {
  icon: '#',
  input: {
    type: 'integer',
  },
  defaultDbType: 'INTEGER',
  typeSwitchOptions: {
    database: {
      allowDefault: true,
      configuration: {
        form: {
          variables: {
            numberType: {
              type: 'string',
              default: 'Integer',
              enum: ['Integer', 'Decimal', 'Float'],
            },
            integerDataSize: {
              type: 'string',
              default: 'default',
              enum: ['default', 'bigInt', 'smallInt'],
            },
            decimalPlaces: {
              type: 'integer',
              default: 2,
            },
            maxDigits: {
              type: 'integer',
              default: 2,
            },
            floatingPointType: {
              type: 'string',
              default: 'real',
              enum: ['real', 'doublePrecision'],
            },
          },
          layout: {
            orientation: 'vertical',
            elements: [
              {
                type: 'input',
                variable: 'numberType',
                label: 'Number Type',
              },
              {
                type: 'switch',
                variable: 'numberType',
                cases: {
                  Integer: [
                    {
                      type: 'input',
                      variable: 'integerDataSize',
                      label: 'Integer Data Size',
                      interfaceType: 'select',
                      options: {
                        default: { label: 'Default (4 bytes)' },
                        bigInt: { label: 'Big Integer (8 bytes)' },
                        smallInt: { label: 'Small Integer (2 bytes)' },
                      },
                    },
                  ],
                  Decimal: [
                    {
                      type: 'layout',
                      orientation: 'horizontal',
                      elements: [
                        {
                          type: 'input',
                          variable: 'decimalPlaces',
                          label: 'Decimal Places',
                        },
                        {
                          type: 'input',
                          variable: 'maxDigits',
                          label: 'Max Digits',
                        },
                      ],
                    },
                  ],
                  Float: [
                    {
                      type: 'input',
                      variable: 'floatingPointType',
                      label: 'Floating Point Type',
                      interfaceType: 'select',
                      options: {
                        real: { label: 'Real (6 digits)' },
                        doublePrecision: {
                          label: 'Double Precision (15 digits)',
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        determinationRules: [
          {
            resolve: 'INTEGER',
            rule: {
              combination: 'and',
              terms: [
                {
                  id: 'numberType',
                  op: 'eq',
                  value: 'Integer',
                },
                {
                  id: 'integerDataSize',
                  op: 'eq',
                  value: 'default',
                },
              ],
            },
          },
          {
            resolve: 'SMALLINT',
            rule: {
              combination: 'and',
              terms: [
                {
                  id: 'numberType',
                  op: 'eq',
                  value: 'Integer',
                },
                {
                  id: 'integerDataSize',
                  op: 'eq',
                  value: 'smallInt',
                },
              ],
            },
          },
          {
            resolve: 'BIGINT',
            rule: {
              combination: 'and',
              terms: [
                {
                  id: 'numberType',
                  op: 'eq',
                  value: 'Integer',
                },
                {
                  id: 'integerDataSize',
                  op: 'eq',
                  value: 'bigInt',
                },
              ],
            },
          },
          {
            resolve: 'DECIMAL',
            rule: {
              id: 'numberType',
              op: 'eq',
              value: 'Decimal',
            },
          },
          {
            resolve: 'REAL',
            rule: {
              combination: 'and',
              terms: [
                {
                  id: 'numberType',
                  op: 'eq',
                  value: 'Float',
                },
                {
                  id: 'floatingPointType',
                  op: 'eq',
                  value: 'real',
                },
              ],
            },
          },
          {
            resolve: 'DOUBLE_PRECISION',
            rule: {
              combination: 'and',
              terms: [
                {
                  id: 'numberType',
                  op: 'eq',
                  value: 'Float',
                },
                {
                  id: 'floatingPointType',
                  op: 'eq',
                  value: 'doublePrecision',
                },
              ],
            },
          },
        ],
        ruleReversalValues: {
          INTEGER: {
            numberType: 'Integer',
            integerDataSize: 'default',
          },
          SMALLINT: {
            numberType: 'Integer',
            integerDataSize: 'smallInt',
          },
          BIGINT: {
            numberType: 'Integer',
            integerDataSize: 'bigInt',
          },
          DECIMAL: {
            numberType: 'Decimal',
            decimalPlaces: null,
            maxDigits: null,
          },
          NUMERIC: {
            numberType: 'Decimal',
            decimalPlaces: null,
            maxDigits: null,
          },
          REAL: {
            numberType: 'Float',
            floatingPointType: 'real',
          },
          DOUBLE_PRECISION: {
            numberType: 'Float',
            floatingPointType: 'doublePrecision',
          },
        },
      },
    },
    display: {
      form: {
        variables: {
          showAsPercentage: {
            type: 'boolean',
            default: false,
          },
          format: {
            type: 'string',
            default: 'en_us',
            enum: ['en_us', 'fr'],
          },
        },
        layout: {
          orientation: 'vertical',
          elements: [
            {
              type: 'input',
              variable: 'showAsPercentage',
              label: 'Show as Percentage',
            },
            {
              type: 'input',
              variable: 'format',
              label: 'Format',
              interfaceType: 'select',
              options: {
                en_us: { label: 'English (US)' },
                fr: { label: 'French (FR)' },
              },
            },
          ],
        },
      },
    },
  },
};

export default numberType;
