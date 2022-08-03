import type { FormValues } from '@mathesar-component-library/types';
import type {
  TimeDisplayOptions,
  TimeFormat,
  Column,
} from '@mathesar/api/tables/columns';
import { iconClock } from '@mathesar/icons';
import type {
  AbstractTypeDbConfig,
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
} from '../types';
import { getTimeFormatOptions } from './utils';

const DB_TYPES = {
  TIME_WITH_TZ: 'time with time zone',
  TIME_WITHOUT_TZ: 'time without time zone',
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
        options: getTimeFormatOptions(),
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
  icon: { ...iconClock, label: 'Time' },
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
