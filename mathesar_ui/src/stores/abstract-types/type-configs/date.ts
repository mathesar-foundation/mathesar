import { faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import type { FormValues } from '@mathesar-component-library/types';
import type { Column } from '@mathesar/stores/table-data/types';
import type {
  DateDisplayOptions,
  DateFormat,
} from '@mathesar/api/tables/columns';
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
  icon: { data: faCalendarDay, label: 'Date' },
  cell: {
    type: 'date',
  },
  getDisplayConfig: () => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),
};

export default dateType;
