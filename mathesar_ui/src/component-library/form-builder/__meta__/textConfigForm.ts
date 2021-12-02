import type { FormConfiguration } from '../types.d';

const formConfig: FormConfiguration = {
  variables: {
    restrictFieldSize: {
      type: 'boolean',
      default: true,
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
        title: 'Restrict Field Size',
      },
      {
        type: 'input',
        variable: 'fieldSizeLimit',
        title: 'Field Size Limit',
      },
    ],
  },
};

export default formConfig;
