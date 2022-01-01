import type { AbstractTypeConfiguration } from '../types.d';

const numberType: AbstractTypeConfiguration = {
  icon: '#',
  input: {
    type: 'integer',
  },
  typeSwitchOptions: {
    database: {
      allowDefault: true,
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
              switch: 'numberType',
              cases: {
                Integer: [{
                  type: 'input',
                  variable: 'integerDataSize',
                  label: 'Integer Data Size',
                  inputType: 'select',
                  options: {
                    default: { label: 'Default (4 bytes)' },
                    bigInt: { label: 'Big Integer (8 bytes)' },
                    smallInt: { label: 'Small Integer (2 bytes)' },
                  },
                }],
                Decimal: [{
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
                }],
                Float: [{
                  type: 'input',
                  variable: 'floatingPointType',
                  label: 'Floating Point Type',
                  inputType: 'select',
                  options: {
                    real: { label: 'Real (6 digits)' },
                    doublePrecision: { label: 'Double Precision (15 digits)' },
                  },
                }],
              },
            },
          ],
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
              inputType: 'select',
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
