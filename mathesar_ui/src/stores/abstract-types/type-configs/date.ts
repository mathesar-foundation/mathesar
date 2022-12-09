import type { FormValues } from '@mathesar-component-library/types';
import type {
  DateDisplayOptions,
  DateFormat,
  Column,
} from '@mathesar/api/types/tables/columns';
import { iconUiTypeDate } from '@mathesar/icons';
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
  dispFormValues: FormValues,
): Column['display_options'] {
  const displayOptions: DateDisplayOptions = {
    format: dispFormValues.format as DateFormat,
  };
  return displayOptions;
}

function constructDisplayFormValuesFromDisplayOptions(
  columnDisplayOpts: Column['display_options'],
): FormValues {
  const displayOptions = columnDisplayOpts as DateDisplayOptions | null;
  const dispFormValues: FormValues = {
    format: displayOptions?.format ?? 'none',
  };
  return dispFormValues;
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
