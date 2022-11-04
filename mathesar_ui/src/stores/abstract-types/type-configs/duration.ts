import type { FormValues } from '@mathesar-component-library/types';
import type {
  DurationDisplayOptions,
  Column,
} from '@mathesar/api/tables/columns';
import { iconUiTypeDuration } from '@mathesar/icons';
import { DurationSpecification } from '@mathesar/utils/duration';
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
  dispFormValues: FormValues,
): Column['display_options'] {
  const displayOptions: Column['display_options'] = {
    ...(dispFormValues.durationConfig as Record<string, unknown>),
    show_units: false,
  };
  return displayOptions;
}

function constructDisplayFormValuesFromDisplayOptions(
  columnDisplayOpts: Column['display_options'],
): FormValues {
  const displayOptions = columnDisplayOpts as DurationDisplayOptions | null;
  const dispFormValues: FormValues = {
    durationConfig: {
      max: displayOptions?.max ?? durationDefaults.max,
      min: displayOptions?.min ?? durationDefaults.min,
    },
  };
  return dispFormValues;
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
