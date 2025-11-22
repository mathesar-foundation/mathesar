import type { FormConfiguration } from '../types';

const formConfig: FormConfiguration = {
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
                doublePrecision: { label: 'Double Precision (15 digits)' },
              },
            },
          ],
        },
      },
    ],
  },
};

export default formConfig;
