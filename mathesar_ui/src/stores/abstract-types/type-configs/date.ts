import {
  type Column,
  type DateFormat,
  getColumnDisplayOption,
} from '@mathesar/api/rpc/columns';
import { iconUiTypeDate } from '@mathesar/icons';
import type { FormValues } from '@mathesar-component-library/types';

import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
} from '../types';

import { getDateFormatOptions } from './utils';

const displayForm: AbstractTypeConfigForm = {
  variables: {
    format: {
      type: 'string',
      enum: ['none', 'us', 'eu', 'friendly', 'iso'],
      default: 'none',
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'format',
        label: 'Date Format',
        options: getDateFormatOptions(),
      },
    ],
  },
};

function determineDisplayOptions(
  formValues: FormValues,
): Column['display_options'] {
  return {
    date_format: formValues.format as DateFormat,
  };
}

function constructDisplayFormValuesFromDisplayOptions(
  displayOptions: Column['display_options'],
): FormValues {
  const column = { display_options: displayOptions };
  const formValues: FormValues = {
    format: getColumnDisplayOption(column, 'date_format'),
  };
  return formValues;
}

const dateType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeDate, label: 'Date' }),
  cellInfo: {
    type: 'date',
  },
  getDisplayConfig: () => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),
};

export default dateType;
