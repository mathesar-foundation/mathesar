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
              enum: ['Integer', 'Decimal', 'Float'],
              defaults: {
                INTEGER: 'Integer',
                SMALLINT: 'Integer',
                BIGINT: 'Integer',
                DECIMAL: 'Decimal',
                NUMERIC: 'Decimal',
                REAL: 'Float',
                'DOUBLE PRECISION': 'Float',
              },
            },
            integerDataSize: {
              type: 'string',
              enum: ['default', 'bigInt', 'smallInt'],
              defaults: {
                INTEGER: 'default',
                SMALLINT: 'smallInt',
                BIGINT: 'bigInt',
              },
            },
            precision: {
              type: 'integer',
              isSaved: true,
            },
            scale: {
              type: 'integer',
              isSaved: true,
            },
            floatingPointType: {
              type: 'string',
              enum: ['real', 'doublePrecision'],
              defaults: {
                REAL: 'real',
                'DOUBLE PRECISION': 'doublePrecision',
              },
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
                          variable: 'precision',
                          label: 'Decimal Places',
                        },
                        {
                          type: 'input',
                          variable: 'scale',
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
            resolve: 'DOUBLE PRECISION',
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
      },
    },
    display: {
      form: {
        variables: {
          showAsPercentage: {
            type: 'boolean',
            isSaved: true,
          },
          format: {
            type: 'string',
            enum: ['en_us', 'fr'],
            isSaved: true,
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
