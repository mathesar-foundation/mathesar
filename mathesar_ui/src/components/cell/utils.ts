import { get } from 'svelte/store';
import type { Column } from '@mathesar/stores/table-data/types.d';
import type { ComponentAndProps } from '@mathesar/component-library/types';
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

function getStringCellComponentAndProps(column: Column): ComponentAndProps {
  const typeOptions = column.type_options ?? undefined;
  let component = TextBoxCell;
  if (
    !typeOptions ||
    typeOptions.length === null ||
    (typeOptions.length as number) > 255
  ) {
    component = TextAreaCell;
  }
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
  switch (inputDataType) {
    case 'boolean':
      return getBooleanCellComponentAndProps(column);
    case 'string':
      return getStringCellComponentAndProps(column);
    default:
      return { component: TextBoxCell };
  }
}
