import { get } from 'svelte/store';
import type { Column } from '@mathesar/stores/table-data/types';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import {
  currentDbAbstractTypes,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';
import type { AbstractTypeConfiguration } from '@mathesar/stores/abstract-types/types';
import TextBoxCell from './cell-types/TextBoxCell.svelte';
import TextAreaCell from './cell-types/TextAreaCell.svelte';
import CheckboxCell from './cell-types/CheckboxCell.svelte';
import SingleSelectCell from './cell-types/SingleSelectCell.svelte';

function getInputConfiguration(
  column: Column,
): AbstractTypeConfiguration['input'] {
  const abstractTypeOfColumn = getAbstractTypeForDbType(
    column.type,
    get(currentDbAbstractTypes)?.data,
  );
  return abstractTypeOfColumn?.input ?? null;
}

function getStringCellComponentAndProps(
  column: Column,
  config: Record<string, unknown>,
): ComponentAndProps {
  const typeOptions = column.type_options ?? undefined;
  const component = config.multiLine ? TextAreaCell : TextBoxCell;
  return { component, props: typeOptions };
}

function getBooleanCellComponentAndProps(column: Column): ComponentAndProps {
  const displayOptions = column.display_options ?? undefined;
  if (displayOptions && displayOptions.input === 'dropdown') {
    const customLabels =
      (displayOptions.custom_labels as { TRUE: string; FALSE: string }) ??
      undefined;
    const options = [
      customLabels?.TRUE ?? 'true',
      customLabels?.FALSE ?? 'false',
    ];
    const getSelectedOptionsFromValue = (
      value: boolean | undefined | null,
    ): string[] => {
      if (value === true) {
        return [options[0]];
      }
      if (value === false) {
        return [options[1]];
      }
      return [];
    };
    const getValueFromSelectedOptions = (values: string[]): boolean | null => {
      let value = null;
      switch (values[0]) {
        case options[0]:
          value = true;
          break;
        case options[1]:
          value = false;
          break;
        default:
          break;
      }
      return value;
    };
    const getLabel = (value: boolean) => (value ? options[0] : options[1]);

    return {
      component: SingleSelectCell,
      props: {
        options,
        getSelectedOptionsFromValue,
        getValueFromSelectedOptions,
        getLabel,
      },
    };
  }
  return { component: CheckboxCell, props: {} };
}

export function getCellComponentWithProps(column: Column): ComponentAndProps {
  const inputOptions = getInputConfiguration(column);
  const inputDataType: string = inputOptions.type ?? 'string';
  const inputConfig = inputOptions.config ?? {};
  const inputConditionalConfig =
    inputOptions.conditionalConfig?.[column.type] ?? {};
  const combinedInputConfig = {
    ...inputConfig,
    ...inputConditionalConfig,
  };
  switch (inputDataType) {
    case 'boolean':
      return getBooleanCellComponentAndProps(column);
    case 'string':
      return getStringCellComponentAndProps(column, combinedInputConfig);
    default:
      return { component: TextBoxCell };
  }
}
