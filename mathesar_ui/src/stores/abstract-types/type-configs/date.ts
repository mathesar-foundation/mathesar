import { faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { dayjs } from '@mathesar-component-library';
import type { FormValues } from '@mathesar-component-library/types';
import type { Column } from '@mathesar/stores/table-data/types';
import type {
  DateDisplayOptions,
  DateFormat,
} from '@mathesar/api/tables/columns';
import { DateTimeSpecification } from '@mathesar/utils/date-time';
import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
} from '../types';

function getFormatOptions(): Record<string, { label: string }> {
  const day = dayjs();
  const dateFormattingStringMap =
    DateTimeSpecification.getDateFormattingStringMap();

  return {
    none: {
      label: `Infer from browser (${day.format(dateFormattingStringMap.none)})`,
    },
    us: { label: `US (${day.format(dateFormattingStringMap.us)})` },
    eu: { label: `European (${day.format(dateFormattingStringMap.eu)})` },
    friendly: {
      label: `Friendly (${day.format(dateFormattingStringMap.friendly)})`,
    },
    iso: { label: `Standard (${day.format(dateFormattingStringMap.iso)})` },
  };
}

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
        options: getFormatOptions(),
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
