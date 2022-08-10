import type { FormValues } from '@mathesar-component-library/types';
import type {
  BooleanDisplayOptions,
  Column,
} from '@mathesar/api/tables/columns';
import { iconUiTypeBoolean } from '@mathesar/icons';
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
  dispFormValues: FormValues,
): Column['display_options'] {
  const displayOptions: Column['display_options'] = {
    input: dispFormValues.displayAs,
  };
  if (
    dispFormValues.displayAs === 'dropdown' &&
    dispFormValues.useCustomLabels
  ) {
    displayOptions.custom_labels = {
      TRUE: dispFormValues.trueLabel,
      FALSE: dispFormValues.falseLabel,
    };
  }
  return displayOptions;
}

function constructDisplayFormValuesFromDisplayOptions(
  columnDisplayOpts: Column['display_options'],
): FormValues {
  const displayOptions = columnDisplayOpts as BooleanDisplayOptions | null;
  const dispFormValues: FormValues = {
    displayAs: displayOptions?.input ?? 'checkbox',
  };
  if (
    typeof displayOptions?.custom_labels === 'object' &&
    displayOptions.custom_labels !== null
  ) {
    dispFormValues.useCustomLabels = true;
    dispFormValues.trueLabel = displayOptions.custom_labels.TRUE;
    dispFormValues.falseLabel = displayOptions.custom_labels.FALSE;
  }
  return dispFormValues;
}

const booleanType: AbstractTypeConfiguration = {
  icon: { ...iconUiTypeBoolean, label: 'Boolean' },
  cell: {
    type: 'boolean',
  },
  getDisplayConfig: () => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),
};

export default booleanType;
