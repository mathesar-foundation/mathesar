import {
  type Column,
  type TimeFormat,
  getColumnDisplayOption,
} from '@mathesar/api/rpc/columns';
import { iconUiTypeTime } from '@mathesar/icons';
import type { FormValues } from '@mathesar-component-library/types';

import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
  AbstractTypeDbConfig,
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
  formValues: FormValues,
): Column['display_options'] {
  return {
    time_format: formValues.format as TimeFormat,
  };
}

function constructDisplayFormValuesFromDisplayOptions(
  displayOptions: Column['display_options'],
): FormValues {
  const column = { display_options: displayOptions };
  return {
    format: getColumnDisplayOption(column, 'time_format'),
  };
}

const timeType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeTime, label: 'Time' }),
  defaultDbType: DB_TYPES.TIME_WITH_TZ,
  cellInfo: {
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
