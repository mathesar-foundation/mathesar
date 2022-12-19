import type { FormConfiguration } from '../types';

const formConfig: FormConfiguration = {
  variables: {
    restrictFieldSize: {
      type: 'boolean',
      default: false,
    },
    fieldSizeLimit: {
      type: 'integer',
      default: 255,
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'restrictFieldSize',
        label: 'Set a maximum length',
      },
      {
        type: 'if',
        variable: 'restrictFieldSize',
        condition: 'eq',
        value: true,
        elements: [
          {
            type: 'input',
            variable: 'fieldSizeLimit',
            label: 'Field Size Limit',
          },
        ],
      },
    ],
  },
};

export default formConfig;
