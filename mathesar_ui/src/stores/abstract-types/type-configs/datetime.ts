import {
  type Column,
  type DateFormat,
  type TimeFormat,
  getColumnDisplayOption,
} from '@mathesar/api/rpc/columns';
import { iconUiTypeDateTime } from '@mathesar/icons';
import type { FormValues } from '@mathesar-component-library/types';

import { DB_TYPES } from '../dbTypes';
import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
  AbstractTypeDbConfig,
} from '../types';

import { getDateFormatOptions, getTimeFormatOptions } from './utils';

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
    ? DB_TYPES.TIMESTAMP_WITH_TZ
    : DB_TYPES.TIMESTAMP_WITHOUT_TZ;
  return {
    dbType,
    typeOptions: {},
  };
}

function constructDbFormValuesFromTypeOptions(
  columnType: Column['type'],
): FormValues {
  return {
    supportTimeZones: columnType === DB_TYPES.TIMESTAMP_WITH_TZ,
  };
}

const displayForm: AbstractTypeConfigForm = {
  variables: {
    dateFormat: {
      type: 'string',
      enum: ['none', 'us', 'eu', 'friendly', 'iso'],
      default: 'none',
    },
    timeFormat: {
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
        variable: 'dateFormat',
        label: 'Date Format',
        options: getDateFormatOptions(),
      },
      {
        type: 'input',
        variable: 'timeFormat',
        label: 'Time Format',
        options: getTimeFormatOptions(),
      },
    ],
  },
};

function determineDisplayOptions(
  dispFormValues: FormValues,
): Column['display_options'] {
  const displayOptions: Column['display_options'] = {
    date_format: dispFormValues.dateFormat as DateFormat,
    time_format: dispFormValues.timeFormat as TimeFormat,
  };
  return displayOptions;
}

function constructDisplayFormValuesFromDisplayOptions(
  displayOptions: Column['display_options'],
): FormValues {
  const column = { display_options: displayOptions };
  const formValues: FormValues = {
    dateFormat: getColumnDisplayOption(column, 'date_format'),
    timeFormat: getColumnDisplayOption(column, 'time_format'),
  };
  return formValues;
}

const dateTimeType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeDateTime, label: 'Date & Time' }),
  defaultDbType: DB_TYPES.TIMESTAMP_WITH_TZ,
  cellInfo: {
    type: 'datetime',
    conditionalConfig: {
      [DB_TYPES.TIMESTAMP_WITH_TZ]: {
        supportTimeZone: true,
      },
      [DB_TYPES.TIMESTAMP_WITHOUT_TZ]: {
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

export default dateTimeType;
