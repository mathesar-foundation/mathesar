<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import {
    Button,
    Icon,
    InputGroup,
    Select,
  } from '@mathesar-component-library';
  import { iconDeleteMajor } from '@mathesar/icons';
  import type { ReadableMapLike } from '@mathesar/typeUtils';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import type { GroupEntryColumnLike } from './types';

  type T = $$Generic;
  type ColumnLikeType = T & GroupEntryColumnLike;

  const dispatch = createEventDispatcher<{
    update: {
      preprocFunctionIdentifier: string | undefined;
      columnIdentifier: ColumnLikeType['id'];
    };
    removeGroup: undefined;
  }>();

  export let columns: ReadableMapLike<ColumnLikeType['id'], ColumnLikeType>;
  export let getColumnLabel: (column?: ColumnLikeType) => string;
  export let columnsAllowedForSelection: ColumnLikeType['id'][] | undefined =
    undefined;

  export let columnIdentifier: ColumnLikeType['id'];
  export let preprocFunctionIdentifier: string | undefined = undefined;
  export let disableColumnChange = false;
  export let allowDelete = true;

  function getColumnsAllowedForSelection(
    _allColumnIds: ColumnLikeType['id'][],
    _columnIdentifier: ColumnLikeType['id'],
    _columnsAllowedForSelection: ColumnLikeType['id'][] | undefined,
  ): ColumnLikeType['id'][] {
    let allowedColumns = _columnsAllowedForSelection ?? _allColumnIds;
    if (!allowedColumns?.some((entry) => entry === _columnIdentifier)) {
      allowedColumns = [_columnIdentifier, ...allowedColumns];
    }
    return allowedColumns;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  $: allColumnIds = [...columns.values()].map(
    (column) => column.id,
  ) as ColumnLikeType['id'][];
  $: columnIdentifiers = getColumnsAllowedForSelection(
    allColumnIds,
    columnIdentifier,
    columnsAllowedForSelection,
  );
  $: preprocFunctions = [
    undefined,
    ...(columns.get(columnIdentifier)?.preprocFunctions.map((fn) => fn.id) ??
      []),
  ] ?? [undefined];

  async function update() {
    await tick();
    dispatch('update', {
      columnIdentifier,
      preprocFunctionIdentifier,
    });
  }

  async function onColumnChange() {
    preprocFunctionIdentifier = undefined;
    await update();
  }

  function functionToGetPreprocLabel(
    _columns: ReadableMapLike<ColumnLikeType['id'], ColumnLikeType>,
    _columnIdentifier: ColumnLikeType['id'],
  ) {
    return (preprocId: string) =>
      preprocId === undefined
        ? 'Value'
        : _columns
            .get(_columnIdentifier)
            ?.preprocFunctions.find((entry) => entry.id === preprocId)?.name ??
          preprocId;
  }
  $: getPreprocLabel = functionToGetPreprocLabel(columns, columnIdentifier);
</script>

<InputGroup>
  <Select
    options={columnIdentifiers}
    autoSelect="none"
    bind:value={columnIdentifier}
    disabled={disableColumnChange}
    getLabel={(columnId) =>
      columnId ? getColumnLabel(columns.get(columnId)) : ''}
    on:change={onColumnChange}
    let:option
  >
    {@const columnInfo = columns.get(option)}
    <ColumnName
      column={{
        name: getColumnLabel(columnInfo),
        type: columnInfo?.column.type ?? 'unknown',
        type_options: columnInfo?.column.type_options ?? null,
        display_options: columnInfo?.column.display_options ?? null,
      }}
    />
  </Select>
  {#if preprocFunctions.length > 1}
    <Select
      options={preprocFunctions}
      bind:value={preprocFunctionIdentifier}
      autoSelect="none"
      getLabel={(entry) =>
        entry === undefined ? 'Value' : getPreprocLabel(entry)}
      on:change={update}
    />
  {/if}
  {#if allowDelete}
    <Button appearance="secondary" on:click={() => dispatch('removeGroup')}>
      <Icon size="0.8rem" {...iconDeleteMajor} />
    </Button>
  {/if}
</InputGroup>
