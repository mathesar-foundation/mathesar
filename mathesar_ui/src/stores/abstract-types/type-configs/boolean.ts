import {
  type BooleanInputType,
  type Column,
  getColumnMetadataValue,
} from '@mathesar/api/rpc/columns';
import { iconUiTypeBoolean } from '@mathesar/icons';
import type { FormValues } from '@mathesar-component-library/types';

import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
} from '../types';

const displayForm: AbstractTypeConfigForm = {
  variables: {
    displayAs: {
      type: 'string',
      enum: ['checkbox', 'dropdown'],
      default: 'checkbox',
    },
    useCustomLabels: {
      type: 'boolean',
      default: false,
    },
    trueLabel: {
      type: 'string',
      default: 'true',
      validation: {
        checks: ['isEmpty'],
      },
    },
    falseLabel: {
      type: 'string',
      default: 'false',
      validation: {
        checks: ['isEmpty'],
      },
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'displayAs',
        label: 'Display as',
        options: {
          checkbox: { label: 'Checkbox' },
          dropdown: { label: 'Dropdown' },
        },
      },
      {
        type: 'if',
        variable: 'displayAs',
        condition: 'eq',
        value: 'dropdown',
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
};

function determineDisplayOptions(formValues: FormValues): Column['metadata'] {
  const displayOptions: Column['metadata'] = {
    bool_input: formValues.displayAs as BooleanInputType,
  };
  if (formValues.displayAs === 'dropdown' && formValues.useCustomLabels) {
    displayOptions.bool_true = formValues.trueLabel as string;
    displayOptions.bool_false = formValues.falseLabel as string;
  }
  return displayOptions;
}

function constructDisplayFormValuesFromDisplayOptions(
  metadata: Column['metadata'],
): FormValues {
  const column = { metadata };
  const formValues: FormValues = {
    displayAs: getColumnMetadataValue(column, 'bool_input'),
  };
  if (metadata?.bool_true || metadata?.bool_false) {
    formValues.useCustomLabels = true;
    formValues.trueLabel = getColumnMetadataValue(column, 'bool_true');
    formValues.falseLabel = getColumnMetadataValue(column, 'bool_false');
  }
  return formValues;
}

const booleanType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeBoolean, label: 'Boolean' }),
  cellInfo: {
    type: 'boolean',
  },
  getDisplayConfig: () => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),
};

export default booleanType;
