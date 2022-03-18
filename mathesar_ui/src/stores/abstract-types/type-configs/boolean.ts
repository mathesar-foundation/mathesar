import type { AbstractTypeConfiguration } from '../types';

const textType: AbstractTypeConfiguration = {
  icon: '?',
  input: {
    type: 'boolean',
  },
  typeSwitchOptions: {
    display: {
      form: {
        variables: {
          displayAs: {
            type: 'string',
            enum: ['Checkbox', 'Dropdown'],
          },
          useCustomLabels: {
            type: 'boolean',
            default: false,
          },
          trueLabel: {
            type: 'string',
            default: 'TRUE',
          },
          falseLabel: {
            type: 'string',
            default: 'FALSE',
          },
        },
        layout: {
          orientation: 'vertical',
          elements: [
            {
              type: 'input',
              variable: 'displayAs',
              label: 'Display as',
            },
            {
              type: 'if',
              variable: 'displayAs',
              condition: 'eq',
              value: 'Dropdown',
              elements: [
                {
                  type: 'input',
                  variable: 'useCustomLabels',
                  label: 'Use Custom Labels',
                },
                {
                  type: 'if',
                  variable: 'useCustomLabels',
                  condition: 'eq',
                  value: true,
                  elements: [
                    {
                      type: 'input',
                      variable: 'trueLabel',
                      label: 'Label for TRUE',
                    },
                    {
                      type: 'input',
                      variable: 'falseLabel',
                      label: 'Label for FALSE',
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
  },
};

export default textType;
