import type { FormConfiguration } from '../types';

const formConfig: FormConfiguration = {
  variables: {
    booleanValue: {
      type: 'boolean',
      default: true,
    },
    integerValue: {
      type: 'integer',
      default: 100,
    },
    floatValue: {
      type: 'float',
      default: 14.52,
    },
    stringTextValue: {
      type: 'string',
      default: 'TextInput',
    },
    stringTextAreaValue: {
      type: 'string',
      default: 'TextArea',
    },
    enumValue: {
      type: 'string',
      default: 'Pikachu',
      enum: ['Pichu', 'Pikachu', 'Raichu'],
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'booleanValue',
        label: 'Boolean value',
      },
      {
        type: 'input',
        variable: 'integerValue',
        label: 'Integer value',
      },
      {
        type: 'input',
        variable: 'floatValue',
        label: 'Float value',
      },
      {
        type: 'input',
        variable: 'stringTextValue',
        label: 'String value: TextInput',
      },
      {
        type: 'input',
        variable: 'stringTextAreaValue',
        interfaceType: 'textarea',
        label: 'String value: TextArea',
      },
      {
        type: 'input',
        variable: 'enumValue',
        interfaceType: 'select',
        label: 'Enum value',
      },
    ],
  },
};

export default formConfig;
