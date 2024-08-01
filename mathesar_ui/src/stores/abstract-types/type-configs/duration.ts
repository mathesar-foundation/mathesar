import { type Column, getColumnDisplayOption } from '@mathesar/api/rpc/columns';
import { iconUiTypeDuration } from '@mathesar/icons';
import { DurationSpecification } from '@mathesar/utils/duration';
import type { FormValues } from '@mathesar-component-library/types';

import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
} from '../types';

const durationDefaults = DurationSpecification.getDefaults();

const displayForm: AbstractTypeConfigForm = {
  variables: {
    /**
     * For the sake of time, use a custom component
     * for duration config.
     *
     * TODO: Make this serializable instead of the
     * custom component.
     */
    durationConfig: {
      type: 'custom',
      default: {
        max: durationDefaults.max,
        min: durationDefaults.min,
      },
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'static',
        variable: 'durationConfig',
        componentId: 'duration-config-menu',
      },
    ],
  },
};

function determineDisplayOptions(
  formValues: FormValues,
): Column['display_options'] {
  const displayOptions: Column['display_options'] = {
    ...(formValues.durationConfig as Record<string, unknown>),
    duration_show_units: false,
  };
  return displayOptions;
}

function constructDisplayFormValuesFromDisplayOptions(
  displayOptions: Column['display_options'],
): FormValues {
  const column = { display_options: displayOptions };
  const formValues: FormValues = {
    durationConfig: {
      max: getColumnDisplayOption(column, 'duration_max'),
      min: getColumnDisplayOption(column, 'duration_min'),
    },
  };
  return formValues;
}

const durationType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeDuration, label: 'Duration' }),
  cellInfo: {
    type: 'duration',
  },
  getDisplayConfig: () => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),
};

export default durationType;
