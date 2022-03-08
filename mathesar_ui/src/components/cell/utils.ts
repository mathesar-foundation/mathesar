import { get } from 'svelte/store';
import type { Column } from '@mathesar/stores/table-data/types.d';
import type { ComponentAndProps } from '@mathesar/component-library/types';
import {
  currentDbAbstractTypes,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';
import type { AbstractTypeConfiguration } from '@mathesar/stores/abstract-types/types';
import TextBoxCell from './cell-types/TextBoxCell.svelte';
import TextAreaCell from './cell-types/TextAreaCell.svelte';
import CheckboxCell from './cell-types/CheckboxCell.svelte';

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
  // TODO: Change to Select based on display option
  return { component: CheckboxCell, props: displayOptions };
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
