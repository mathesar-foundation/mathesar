<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { ConstraintType } from '@mathesar/api/rest/types/tables/constraints';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import type { ReadableMapLike } from '@mathesar/typeUtils';
  import {
    Button,
    Icon,
    InputGroup,
    Select,
  } from '@mathesar-component-library';

  import type { SortEntryColumnLike } from './types';
  import {
    type SortDirection,
    allowedSortDirections,
    getSortingLabelForColumn,
  } from './utils';

  type T = $$Generic;
  type ColumnLikeType = SortEntryColumnLike & T;

  const dispatch = createEventDispatcher<{
    remove: undefined;
    update: {
      columnIdentifier: ColumnLikeType['id'];
      sortDirection: SortDirection;
    };
  }>();

  export let columns: ReadableMapLike<ColumnLikeType['id'], ColumnLikeType>;
  export let getColumnLabel: (column?: ColumnLikeType) => string;
  export let getColumnConstraintType: (
    column: ColumnLikeType,
  ) => ConstraintType[] | undefined = () => undefined;
  export let columnsAllowedForSelection: ColumnLikeType['id'][] | undefined =
    undefined;
  export let columnIdentifier: ColumnLikeType['id'];
  export let sortDirection: SortDirection = 'ASCENDING';
  export let disableColumnChange = false;
  export let allowDelete = true;
  export let getSortDirectionLabel: (
    sortDirection?: SortDirection,
  ) => string = (_sortDirection?: SortDirection) => {
    const column = columns.get(columnIdentifier);

    if (column && _sortDirection) {
      const label = getSortingLabelForColumn(column.abstractType.cellInfo.type);
      return label[_sortDirection];
    }

    // Ideally should never happen
    return sortDirection === 'DESCENDING' ? $_('descending') : $_('ascending');
  };

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  $: allColumnIds = [...columns.values()].map(
    (column) => column.id,
  ) as ColumnLikeType['id'][];
  $: columnIdentifiers = (() => {
    if (columnsAllowedForSelection) {
      const columnIdList = [columnIdentifier, ...columnsAllowedForSelection];
      // To retain sort order
      return allColumnIds.filter((columnId) => columnIdList.includes(columnId));
    }
    return allColumnIds;
  })();

  function getColumnConstraintTypeByColumnId(_columnId?: ColumnLikeType['id']) {
    if (_columnId) {
      const column = columns.get(_columnId);
      if (column) {
        return getColumnConstraintType(column);
      }
    }
    return undefined;
  }

  function removeSort() {
    dispatch('remove');
  }

  function update() {
    dispatch('update', {
      columnIdentifier,
      sortDirection,
    });
  }
</script>

<InputGroup>
  <Select
    options={columnIdentifiers}
    autoSelect="none"
    bind:value={columnIdentifier}
    disabled={disableColumnChange}
    getLabel={(columnId) =>
      columnId ? getColumnLabel(columns.get(columnId)) : ''}
    on:change={update}
    let:option
  >
    {@const columnInfo = columns.get(option)}
    <ColumnName
      column={{
        name: getColumnLabel(columnInfo),
        type: columnInfo?.column.type ?? 'unknown',
        type_options: columnInfo?.column.type_options ?? null,
        display_options: columnInfo?.column.display_options ?? null,
        constraintsType: getColumnConstraintTypeByColumnId(option),
      }}
    />
  </Select>
  <Select
    options={allowedSortDirections}
    getLabel={getSortDirectionLabel}
    bind:value={sortDirection}
    on:change={update}
  />
  {#if allowDelete}
    <Button size="small" appearance="secondary" on:click={removeSort}>
      <Icon {...iconDeleteMajor} />
    </Button>
  {/if}
</InputGroup>
