<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { faTimes } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Button, Select } from '@mathesar-component-library';
  import type { FilterEntry } from '@mathesar/stores/table-data/types';
  import DataTypeBasedInput from '@mathesar/components/cell/DataTypeBasedInput.svelte';
  import type {
    ProcessedTableColumn,
    ProcessedTableColumnMap,
  } from '../../utils';

  const dispatch = createEventDispatcher();

  export let processedTableColumnsMap: ProcessedTableColumnMap;

  export let columnId: FilterEntry['columnId'] | undefined;
  export let conditionId: FilterEntry['conditionId'] | undefined;
  export let value: FilterEntry['value'] | undefined;
  export let allowRemoval = true;

  $: columnIds = [...processedTableColumnsMap].map(([_columnId]) => _columnId);
  $: processedSelectedColumn = columnId
    ? processedTableColumnsMap.get(columnId)
    : undefined;
  $: selectedColumnFiltersMap =
    processedSelectedColumn?.allowedFiltersMap ??
    (new Map() as ProcessedTableColumn['allowedFiltersMap']);
  $: conditionIds = [...selectedColumnFiltersMap].map(
    ([_conditionId]) => _conditionId,
  );
  $: selectedCondition = conditionId
    ? selectedColumnFiltersMap.get(conditionId)
    : undefined;
  $: selectedColumnInputCap = processedSelectedColumn?.dbTypeInputCap;

  let prevValue: unknown = value;
  let timer: number;

  onDestroy(() => {
    window.clearTimeout(timer);
  });

  function getColumnName(_columnId?: FilterEntry['columnId']) {
    if (_columnId) {
      return processedTableColumnsMap.get(_columnId)?.column.name ?? '';
    }
    return '';
  }

  function getConditionName(_conditionId?: FilterEntry['conditionId']) {
    if (_conditionId) {
      return selectedColumnFiltersMap.get(_conditionId)?.name ?? '';
    }
    return '';
  }

  function onValueInput() {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (prevValue !== value) {
        prevValue = value;
        dispatch('reload');
      }
    }, 500);
  }

  function onValueChange() {
    clearTimeout(timer);
    prevValue = value;
    dispatch('reload');
  }

  // TODO: Calculate input based on type in selectedCondition?.parameters
  // If parameter.type is same as column abstract type, ignore it
  //
</script>

<tr>
  <td class="column">
    <Select
      options={columnIds}
      bind:value={columnId}
      getLabel={getColumnName}
      on:change={() => dispatch('reload')}
    />
  </td>
  <td class="dir">
    <Select
      options={conditionIds}
      bind:value={conditionId}
      getLabel={getConditionName}
      on:change={() => dispatch('reload')}
    />
  </td>
  {#if selectedCondition?.parameters && selectedColumnInputCap}
    <DataTypeBasedInput
      bind:value
      componentAndProps={selectedColumnInputCap}
      on:input={onValueInput}
      on:change={onValueChange}
    />
  {/if}
  {#if allowRemoval}
    <td>
      <Button size="small" on:click={() => dispatch('removeFilter')}>
        <Icon data={faTimes} />
      </Button>
    </td>
  {/if}
</tr>
