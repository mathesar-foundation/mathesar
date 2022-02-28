import { get } from 'svelte/store';
import type { SvelteComponent } from 'svelte';
import type { Column } from '@mathesar/stores/table-data/types.d';
import {
  currentDbAbstractTypes,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';
import type { AbstractTypeConfiguration } from '@mathesar/stores/abstract-types/types.d';
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
): [typeof SvelteComponent, Record<string, unknown>] {
  const typeOptions = column.type_options;
  let component = TextBoxCell;
  if (
    !typeOptions ||
    typeOptions.length === null ||
    (typeOptions.length as number) > 255
  ) {
    component = TextAreaCell;
  }
  return [component, typeOptions ?? {}];
}

function getBooleanCellComponentAndProps(
  column: Column,
): [typeof SvelteComponent, Record<string, unknown>] {
  const displayOptions = column.display_options;
  // TODO: Change to Select based on display option
  return [CheckboxCell, displayOptions ?? {}];
}

export function getCellComponentWithProps(
  column: Column,
): [typeof SvelteComponent, Record<string, unknown>] {
  const inputOptions = getInputConfiguration(column);
  const inputDataType: string = inputOptions.type ?? 'string';
  switch (inputDataType) {
    case 'boolean':
      return getBooleanCellComponentAndProps(column);
    case 'string':
      return getStringCellComponentAndProps(column);
    default:
      return [TextBoxCell, {}];
  }
}
