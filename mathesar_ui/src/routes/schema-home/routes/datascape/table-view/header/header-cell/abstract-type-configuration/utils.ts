import { makeForm } from '@mathesar-component-library';
import type { DbType } from '@mathesar/AppTypes';
import type { FormBuildConfiguration } from '@mathesar-component-library/types';
import type {
  AbstractType,
  AbstractTypeDbConfig,
  AbstractTypeDisplayConfig,
} from '@mathesar/stores/abstract-types/types';
import type { Column } from '@mathesar/stores/table-data/types';
import { readable } from 'svelte/store';
import DurationConfiguration from './config-components/DurationConfiguration.svelte';

export function getFormValueStore(
  form: FormBuildConfiguration | undefined,
): FormBuildConfiguration['values'] {
  if (form) {
    return form.values;
  }
  return readable({});
}

export function constructDbForm(
  selectedAbstractType: AbstractType,
  selectedDbType: DbType,
  column: Column,
): {
  dbOptionsConfig?: AbstractTypeDbConfig;
  dbForm?: FormBuildConfiguration;
  dbFormValues: FormBuildConfiguration['values'];
} {
  const dbOptionsConfig = selectedAbstractType.getDbConfig?.() ?? undefined;
  let dbForm;
  if (dbOptionsConfig) {
    const dbFormValues =
      column.type === selectedDbType
        ? dbOptionsConfig.constructDbFormValuesFromTypeOptions(
            column.type,
            column.type_options,
          )
        : {};
    dbForm = makeForm(dbOptionsConfig.form, dbFormValues);
  }
  const dbFormValues = getFormValueStore(dbForm);
  return {
    dbOptionsConfig,
    dbForm,
    dbFormValues,
  };
}

export function constructDisplayForm(
  selectedAbstractType: AbstractType,
  selectedDbType: DbType,
  column: Column,
): {
  displayOptionsConfig?: AbstractTypeDisplayConfig;
  displayForm?: FormBuildConfiguration;
  displayFormValues: FormBuildConfiguration['values'];
} {
  const displayOptionsConfig =
    selectedAbstractType.getDisplayConfig?.() ?? undefined;
  let displayForm;
  if (displayOptionsConfig) {
    const displayFormValues =
      column.type === selectedDbType
        ? displayOptionsConfig.constructDisplayFormValuesFromDisplayOptions(
            column.display_options,
          )
        : {};
    displayForm = makeForm(displayOptionsConfig.form, displayFormValues, {
      'duration-config-menu': DurationConfiguration,
    });
  }
  const displayFormValues = getFormValueStore(displayForm);
  return {
    displayOptionsConfig,
    displayForm,
    displayFormValues,
  };
}
