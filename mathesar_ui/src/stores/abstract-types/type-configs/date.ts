import {
  type Column,
  type DateFormat,
  getColumnMetadataValue,
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

function determineDisplayOptions(formValues: FormValues): Column['metadata'] {
  return {
    date_format: formValues.format as DateFormat,
  };
}

function constructDisplayFormValuesFromDisplayOptions(
  metadata: Column['metadata'],
): FormValues {
  const column = { metadata };
  const formValues: FormValues = {
    format: getColumnMetadataValue(column, 'date_format'),
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
