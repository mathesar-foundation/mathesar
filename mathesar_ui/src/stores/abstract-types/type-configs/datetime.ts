import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type {
  DateFormat,
  TimeFormat,
} from '@mathesar/api/rpc/_common/columnDisplayOptions';
import {
  type RawColumnWithMetadata,
  getColumnMetadataValue,
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

const getDbForm: () => AbstractTypeConfigForm = () => ({
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
        label: get(_)('support_time_zones'),
        text: {
          help: get(_)('support_time_zone_helper'),
        },
      },
    ],
  },
});

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
  columnType: RawColumnWithMetadata['type'],
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
): RawColumnWithMetadata['metadata'] {
  const displayOptions: RawColumnWithMetadata['metadata'] = {
    date_format: dispFormValues.dateFormat as DateFormat,
    time_format: dispFormValues.timeFormat as TimeFormat,
  };
  return displayOptions;
}

function constructDisplayFormValuesFromDisplayOptions(
  metadata: RawColumnWithMetadata['metadata'],
): FormValues {
  const column = { metadata };
  const formValues: FormValues = {
    dateFormat: getColumnMetadataValue(column, 'date_format'),
    timeFormat: getColumnMetadataValue(column, 'time_format'),
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
    form: getDbForm(),
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
