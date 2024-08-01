import {
  type BooleanInputType,
  type Column,
  getColumnDisplayOption,
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

function determineDisplayOptions(
  formValues: FormValues,
): Column['display_options'] {
  const displayOptions: Column['display_options'] = {
    bool_input: formValues.displayAs as BooleanInputType,
  };
  if (formValues.displayAs === 'dropdown' && formValues.useCustomLabels) {
    displayOptions.bool_true = formValues.trueLabel as string;
    displayOptions.bool_false = formValues.falseLabel as string;
  }
  return displayOptions;
}

function constructDisplayFormValuesFromDisplayOptions(
  displayOptions: Column['display_options'],
): FormValues {
  const column = { display_options: displayOptions };
  const formValues: FormValues = {
    displayAs: getColumnDisplayOption(column, 'bool_input'),
  };
  if (displayOptions?.bool_true || displayOptions?.bool_false) {
    formValues.useCustomLabels = true;
    formValues.trueLabel = getColumnDisplayOption(column, 'bool_true');
    formValues.falseLabel = getColumnDisplayOption(column, 'bool_false');
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
