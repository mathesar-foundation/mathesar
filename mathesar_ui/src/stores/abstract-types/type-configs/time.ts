import { faClock } from '@fortawesome/free-solid-svg-icons';
import { dayjs } from '@mathesar-component-library';
import type { FormValues } from '@mathesar-component-library/types';
import type { Column } from '@mathesar/stores/table-data/types';
import type {
  TimeDisplayOptions,
  TimeFormat,
} from '@mathesar/api/tables/columns';
import { DateTimeSpecification } from '@mathesar/utils/date-time';
import type {
  AbstractTypeDbConfig,
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
} from '../types';

const DB_TYPES = {
  TIME_WITH_TZ: 'TIME WITH TIME ZONE',
  TIME_WITHOUT_TZ: 'TIME WITHOUT TIME ZONE',
};

const dbForm: AbstractTypeConfigForm = {
  variables: {
    supportTimeZones: {
      type: 'boolean',
      default: false,
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'supportTimeZones',
        label: 'Support Time Zones',
      },
    ],
  },
};

function determineDbTypeAndOptions(
  dbFormValues: FormValues,
): ReturnType<AbstractTypeDbConfig['determineDbTypeAndOptions']> {
  const dbType = dbFormValues.supportTimeZones
    ? DB_TYPES.TIME_WITH_TZ
    : DB_TYPES.TIME_WITHOUT_TZ;
  return {
    dbType,
    typeOptions: {},
  };
}

function constructDbFormValuesFromTypeOptions(
  columnType: Column['type'],
): FormValues {
  return {
    supportTimeZones: columnType === DB_TYPES.TIME_WITH_TZ,
  };
}

function getFormatOptions(): Record<TimeFormat, { label: string }> {
  const day = dayjs();
  const timeFormattingStringMap =
    DateTimeSpecification.getTimeFormattingStringMap();

  return {
    '24hr': {
      label: `Short time 24 hr (${day.format(
        timeFormattingStringMap['24hr'],
      )})`,
    },
    '24hrLong': {
      label: `Long time 24 hr (${day.format(
        timeFormattingStringMap['24hrLong'],
      )})`,
    },
    '12hr': {
      label: `Short time 12 hr (${day.format(
        timeFormattingStringMap['12hr'],
      )})`,
    },
    '12hrLong': {
      label: `Long time 12 hr (${day.format(
        timeFormattingStringMap['12hrLong'],
      )})`,
    },
  };
}

const displayForm: AbstractTypeConfigForm = {
  variables: {
    format: {
      type: 'string',
      enum: ['24hr', '24hrLong', '12hr', '12hrLong'],
      default: '24hr',
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'format',
        label: 'Time Format',
        options: getFormatOptions(),
      },
    ],
  },
};

function determineDisplayOptions(
  dispFormValues: FormValues,
): Column['display_options'] {
  const displayOptions: TimeDisplayOptions = {
    format: dispFormValues.format as TimeFormat,
  };
  return displayOptions;
}

function constructDisplayFormValuesFromDisplayOptions(
  columnDisplayOpts: Column['display_options'],
): FormValues {
  const displayOptions = columnDisplayOpts as TimeDisplayOptions | null;
  const dispFormValues: FormValues = {
    format: displayOptions?.format ?? '24hr',
  };
  return dispFormValues;
}

const timeType: AbstractTypeConfiguration = {
  icon: { data: faClock, label: 'Time' },
  defaultDbType: DB_TYPES.TIME_WITH_TZ,
  cell: {
    type: 'time',
    conditionalConfig: {
      [DB_TYPES.TIME_WITH_TZ]: {
        supportTimeZone: true,
      },
      [DB_TYPES.TIME_WITHOUT_TZ]: {
        supportTimeZone: false,
      },
    },
  },
  getDbConfig: () => ({
    form: dbForm,
    determineDbTypeAndOptions,
    constructDbFormValuesFromTypeOptions,
  }),
  getDisplayConfig: () => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),
};

export default timeType;
